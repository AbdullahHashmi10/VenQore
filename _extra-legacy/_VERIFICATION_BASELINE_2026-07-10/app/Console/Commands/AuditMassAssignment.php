<?php

namespace App\Console\Commands;

use App\Support\Guardrails\MassAssignmentAnalyzer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * php artisan audit:mass-assignment
 *
 * Scans every static Eloquent write call (Model::create / updateOrCreate /
 * firstOrCreate / make / forceCreate / firstOrNew) in app/ and database/ and
 * fails loudly if any literal key is not a real column on that model's table
 * and not covered by a mutator.
 *
 * This turns "someone has to notice by reading code" into "the build fails
 * automatically". Wire it into CI (it exits non-zero on any finding) and it
 * also runs inside the test suite via MassAssignmentGuardTest.
 */
class AuditMassAssignment extends Command
{
    protected $signature = 'audit:mass-assignment {--json : Output findings as JSON}';

    protected $description = 'Fail if any Model::create()/updateOrCreate() passes a key that is not a real column (silent data-drift guard).';

    public function handle(): int
    {
        $analyzer = new MassAssignmentAnalyzer();

        $dirs = array_filter([
            base_path('app'),
            base_path('database'),
        ], 'is_dir');

        $calls = $analyzer->scanDirectories($dirs);
        $violations = $analyzer->findViolations($calls, fn (string $model) => $this->allowedKeysFor($model));

        if ($this->option('json')) {
            $this->line(json_encode($violations, JSON_PRETTY_PRINT));
            return $violations === [] ? self::SUCCESS : self::FAILURE;
        }

        $this->info(sprintf('Scanned %d static model write call(s).', count($calls)));

        if ($violations === []) {
            $this->info('[PASS] No mass-assignment drift found. Every written key maps to a real column.');
            return self::SUCCESS;
        }

        $this->error(sprintf('[FAIL] %d mass-assignment violation(s) found:', count($violations)));
        $this->newLine();

        // Group by file for readability.
        $byFile = [];
        foreach ($violations as $v) {
            $byFile[$v['file']][] = $v;
        }

        foreach ($byFile as $file => $items) {
            $this->line('  ' . str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file));
            foreach ($items as $v) {
                $this->line(sprintf(
                    '    line %d  %s::create([... \'%s\' ...])  ← \'%s\' is not a column on %s',
                    $v['line'],
                    class_basename($v['model']),
                    $v['key'],
                    $v['key'],
                    class_basename($v['model'])
                ));
            }
        }

        $this->newLine();
        $this->warn('Each of these keys is silently dropped (with $fillable) or throws at runtime (with $guarded = []).');

        return self::FAILURE;
    }

    /**
     * Allowed keys for a model = real table columns + mutator-backed virtual
     * attributes. Returns null if the table cannot be introspected, so the
     * analyzer skips it rather than raising a false positive.
     *
     * @return string[]|null
     */
    private function allowedKeysFor(string $modelClass): ?array
    {
        if (!class_exists($modelClass)) {
            try {
                if (!Schema::hasTable($modelClass)) {
                    return null;
                }
                return Schema::getColumnListing($modelClass);
            } catch (\Throwable $e) {
                return null;
            }
        }

        try {
            /** @var \Illuminate\Database\Eloquent\Model $instance */
            $instance = new $modelClass();
        } catch (\Throwable $e) {
            return null;
        }

        if (!$instance instanceof \Illuminate\Database\Eloquent\Model) {
            return null;
        }

        try {
            $table = $instance->getTable();
            if (!Schema::hasTable($table)) {
                return null;
            }
            $columns = Schema::getColumnListing($table);
        } catch (\Throwable $e) {
            return null;
        }

        if (empty($columns)) {
            return null;
        }

        return array_merge($columns, $this->mutatorKeys($modelClass));
    }

    /**
     * Snake-cased attribute names that have a setXxxAttribute() mutator — these
     * are legitimately assignable even though they may not be literal columns.
     *
     * @return string[]
     */
    private function mutatorKeys(string $modelClass): array
    {
        $keys = [];
        try {
            $methods = get_class_methods($modelClass);
        } catch (\Throwable $e) {
            return [];
        }

        // Old-style mutators: setFooAttribute()
        foreach ($methods as $method) {
            if (preg_match('/^set(.+)Attribute$/', $method, $m)) {
                $keys[] = \Illuminate\Support\Str::snake($m[1]);
            }
        }

        // New-style mutators: public function foo(): Attribute
        try {
            foreach ((new \ReflectionClass($modelClass))->getMethods(\ReflectionMethod::IS_PUBLIC) as $rm) {
                $rt = $rm->getReturnType();
                if ($rt instanceof \ReflectionNamedType
                    && $rt->getName() === \Illuminate\Database\Eloquent\Casts\Attribute::class
                    && $rm->getNumberOfRequiredParameters() === 0) {
                    $keys[] = \Illuminate\Support\Str::snake($rm->getName());
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return $keys;
    }
}
