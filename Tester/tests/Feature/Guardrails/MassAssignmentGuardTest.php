<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Support\Guardrails\MassAssignmentAnalyzer;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Tests\Feature\VenQoreTestCase;

/**
 * MassAssignmentGuardTest — permanent silent-data-drift guardrail.
 *
 * These are NOT dopamine tests. They go RED the moment a static Eloquent write
 * references a key that is not a real column — the mechanical fault behind the
 * "field silently saved as 0 / dropped" class of bug.
 *
 * Both checks use a committed, self-seeding baseline. Whether a given drift is
 * a live bug, dead legacy code, or a migration-vs-production schema gap needs
 * human judgment (see the triage in PRELAUNCH_HARDENING_REPORT.md), so the
 * FIRST run records today's known set as a reviewed inventory and passes;
 * thereafter ANY NEW drift fails the build. Fixing a baselined item and
 * deleting its line is always allowed.
 */
class MassAssignmentGuardTest extends VenQoreTestCase
{
    private const WRITE_BASELINE = __DIR__ . '/baselines/mass_assignment_drift.json';
    private const FILLABLE_BASELINE = __DIR__ . '/baselines/stale_fillable.json';

    /**
     * No NEW static Model::create()/updateOrCreate()/etc. may pass a key that
     * is not a real column (or mutator) on that model.
     */
    public function test_no_new_static_write_assigns_a_nonexistent_column(): void
    {
        $analyzer = new MassAssignmentAnalyzer();

        $calls = $analyzer->scanDirectories([
            base_path('app'),
            base_path('database'),
        ]);

        // Sanity: the scanner must actually be finding write calls.
        $this->assertNotEmpty(
            $calls,
            'MassAssignmentAnalyzer found zero static model writes — the scanner itself is broken.'
        );

        $violations = $analyzer->findViolations($calls, fn (string $model) => $this->allowedKeysFor($model));

        // Signature per violation: "Model::key" (file/line can move; the pair is stable).
        $current = [];
        foreach ($violations as $v) {
            $current[class_basename($v['model']) . '::' . $v['key']] = true;
        }
        $current = array_keys($current);
        sort($current);

        if (!file_exists(self::WRITE_BASELINE)) {
            @mkdir(dirname(self::WRITE_BASELINE), 0777, true);
            file_put_contents(
                self::WRITE_BASELINE,
                json_encode($this->annotate($violations), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
            );
            $this->assertTrue(true, 'Mass-assignment drift baseline seeded with ' . count($current) . ' known item(s). Review & commit it.');
            return;
        }

        $baseline = json_decode((string) file_get_contents(self::WRITE_BASELINE), true) ?: [];
        $baselineSet = [];
        foreach ($baseline as $b) {
            if (isset($b['signature'])) {
                $baselineSet[$b['signature']] = true;
            }
        }

        $new = array_values(array_filter($current, fn ($sig) => !isset($baselineSet[$sig])));

        $this->assertSame(
            [],
            $new,
            "NEW mass-assignment drift (key is not a real column — silently dropped or throws on fresh installs):\n  - "
                . implode("\n  - ", $new)
                . "\n\nFix the write, or (if intentional) add it to baselines/mass_assignment_drift.json with a note."
        );
    }

    /**
     * No NEW stale $fillable entry (a fillable key that is not a real column;
     * writes to it are silently discarded).
     */
    public function test_no_new_stale_fillable_entry(): void
    {
        $modelDir = base_path('app/Models');
        $this->assertDirectoryExists($modelDir);

        $problems = [];

        foreach (glob($modelDir . '/*.php') as $file) {
            $class = 'App\\Models\\' . pathinfo($file, PATHINFO_FILENAME);

            if (!class_exists($class)) {
                continue;
            }

            try {
                $instance = new $class();
            } catch (\Throwable $e) {
                continue; // abstract / needs args → skip
            }

            if (!$instance instanceof \Illuminate\Database\Eloquent\Model) {
                continue;
            }

            $fillable = $instance->getFillable();
            if (empty($fillable)) {
                continue; // $guarded model — nothing to check here
            }

            try {
                $table = $instance->getTable();
                if (!Schema::hasTable($table)) {
                    continue;
                }
                $columns = Schema::getColumnListing($table);
            } catch (\Throwable $e) {
                continue;
            }

            $allowed = array_flip(array_merge($columns, $this->mutatorKeys($class)));

            foreach ($fillable as $key) {
                if (!isset($allowed[$key])) {
                    $problems[class_basename($class) . '::' . $key] = sprintf(
                        '%s::$fillable "%s" is not a column on `%s`',
                        class_basename($class),
                        $key,
                        $table
                    );
                }
            }
        }

        $currentSigs = array_keys($problems);
        sort($currentSigs);

        if (!file_exists(self::FILLABLE_BASELINE)) {
            @mkdir(dirname(self::FILLABLE_BASELINE), 0777, true);
            file_put_contents(
                self::FILLABLE_BASELINE,
                json_encode(array_values($problems), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
            );
            $this->assertTrue(true, 'Stale-fillable baseline seeded with ' . count($problems) . ' known item(s). Review & commit it.');
            return;
        }

        $baseline = json_decode((string) file_get_contents(self::FILLABLE_BASELINE), true) ?: [];
        $baselineSet = [];
        foreach ($baseline as $msg) {
            if (preg_match('/^([A-Za-z0-9_]+::[A-Za-z0-9_]+)/', (string) $msg, $m)) {
                $baselineSet[$m[1]] = true;
            }
        }

        $new = array_values(array_filter($currentSigs, fn ($sig) => !isset($baselineSet[$sig])));

        $this->assertSame(
            [],
            $new,
            "NEW stale \$fillable entries (writes to these keys are silently dropped):\n  - " . implode("\n  - ", $new)
        );
    }

    // ── helpers ───────────────────────────────────────────────────────────

    /** @return string[]|null */
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

    /** @return string[] */
    private function mutatorKeys(string $modelClass): array
    {
        $keys = [];

        // Old-style mutators: setFooAttribute()
        foreach (get_class_methods($modelClass) as $method) {
            if (preg_match('/^set(.+)Attribute$/', $method, $m)) {
                $keys[] = Str::snake($m[1]);
            }
        }

        // New-style mutators: public function foo(): Attribute
        try {
            foreach ((new \ReflectionClass($modelClass))->getMethods(\ReflectionMethod::IS_PUBLIC) as $rm) {
                $rt = $rm->getReturnType();
                if ($rt instanceof \ReflectionNamedType
                    && $rt->getName() === \Illuminate\Database\Eloquent\Casts\Attribute::class
                    && $rm->getNumberOfRequiredParameters() === 0) {
                    $keys[] = Str::snake($rm->getName());
                }
            }
        } catch (\Throwable $e) {
            // ignore — old-style detection already ran
        }

        return $keys;
    }

    /** @param array<int,array{file:string,line:int,model:string,key:string}> $violations */
    private function annotate(array $violations): array
    {
        $out = [];
        foreach ($violations as $v) {
            $out[] = [
                'signature' => class_basename($v['model']) . '::' . $v['key'],
                'model'     => $v['model'],
                'key'       => $v['key'],
                'file'      => str_replace(base_path() . DIRECTORY_SEPARATOR, '', $v['file']),
                'line'      => $v['line'],
                'note'      => 'REVIEW: live bug, dead legacy code, or migration-vs-prod schema gap?',
            ];
        }
        usort($out, fn ($a, $b) => strcmp($a['signature'], $b['signature']));
        return $out;
    }
}
