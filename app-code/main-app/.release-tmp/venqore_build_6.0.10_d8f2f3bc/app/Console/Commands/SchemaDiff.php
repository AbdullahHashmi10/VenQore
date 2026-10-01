<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * SchemaDiff — Track A / L005
 *
 * Produces a systematic, written diff between:
 *
 *   (a) the schema the migrations SHOULD produce — materialised by running
 *       every migration into a throwaway "scratch" MySQL database, and
 *   (b) the schema a live database ACTUALLY has (default: the current
 *       connection, i.e. production `venqore_pos`).
 *
 * This turns "the migrations and production have drifted, unknown how much"
 * into a concrete, closeable list feeding L013–L017 and anything else the
 * drift surfaces. It is strictly read-only against the live database; all
 * writes happen inside the scratch database, which is created and dropped
 * by this command.
 *
 * MySQL only (per project policy). Requires a MySQL user able to CREATE/DROP
 * the scratch database.
 *
 * Usage:
 *   php artisan schema:diff
 *   php artisan schema:diff --live=venqore_pos --scratch=venqore_schema_scratch
 *   php artisan schema:diff --json=storage/app/schema-diff.json
 */
class SchemaDiff extends Command
{
    protected $signature = 'schema:diff
        {--live= : Live database name to inspect (defaults to the current connection database)}
        {--scratch=venqore_schema_scratch : Name of the throwaway database to migrate into}
        {--keep-scratch : Do not drop the scratch database afterwards (for debugging)}
        {--json= : Optional path to also write the diff as JSON}';

    protected $description = 'Diff the migration-generated schema against a live database and report every column drift (L005).';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->error('schema:diff requires the MySQL driver (project policy is MySQL-only).');
            return self::FAILURE;
        }

        $live    = $this->option('live') ?: DB::connection()->getDatabaseName();
        $scratch = $this->option('scratch');

        if ($scratch === $live) {
            $this->error("Refusing to run: scratch database ('{$scratch}') must differ from the live database ('{$live}').");
            return self::FAILURE;
        }

        $this->info("Live database    : {$live}");
        $this->info("Scratch database : {$scratch}");
        $this->newLine();

        // ── 1. Build the scratch database from migrations ───────────────────
        $this->line('→ Creating scratch database and running migrations...');
        DB::statement("DROP DATABASE IF EXISTS `{$scratch}`");
        DB::statement("CREATE DATABASE `{$scratch}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Point a dedicated runtime connection at the scratch DB.
        $base = config('database.connections.' . config('database.default'));
        config(['database.connections.__schema_scratch' => array_merge($base, ['database' => $scratch])]);

        try {
            Artisan::call('migrate', [
                '--database' => '__schema_scratch',
                '--force'    => true,
            ], $this->getOutput());

            // ── 2. Read both schemas ────────────────────────────────────────
            $expected = $this->columnsByTable($scratch);
            $actual   = $this->columnsByTable($live);

            // ── 3. Compute the diff ─────────────────────────────────────────
            $report = $this->diff($expected, $actual);

            // ── 4. Emit ─────────────────────────────────────────────────────
            $this->renderReport($report);

            if ($path = $this->option('json')) {
                file_put_contents($path, json_encode($report, JSON_PRETTY_PRINT));
                $this->info("JSON diff written to: {$path}");
            }

            $hasDrift = !empty($report['tables_only_in_migrations'])
                || !empty($report['tables_only_in_live'])
                || !empty($report['column_drift']);

            return $hasDrift ? self::FAILURE : self::SUCCESS;
        } finally {
            if (!$this->option('keep-scratch')) {
                DB::statement("DROP DATABASE IF EXISTS `{$scratch}`");
                $this->line("→ Dropped scratch database '{$scratch}'.");
            } else {
                $this->warn("→ Scratch database '{$scratch}' kept for inspection.");
            }
        }
    }

    /**
     * Map of table => [column => true] for a database, from information_schema.
     */
    private function columnsByTable(string $database): array
    {
        $rows = DB::table('information_schema.columns')
            ->where('table_schema', $database)
            ->orderBy('table_name')
            ->orderBy('ordinal_position')
            ->get(['table_name', 'column_name']);

        $out = [];
        foreach ($rows as $r) {
            // information_schema column casing varies across MySQL versions.
            $table  = $r->table_name  ?? $r->TABLE_NAME;
            $column = $r->column_name ?? $r->COLUMN_NAME;
            $out[$table][$column] = true;
        }
        return $out;
    }

    /**
     * Build the structured diff report.
     */
    private function diff(array $expected, array $actual): array
    {
        // Ignore Laravel/infra bookkeeping tables that legitimately differ or
        // are environment-specific rather than domain schema.
        $ignoreTables = ['migrations', 'jobs', 'failed_jobs', 'job_batches',
            'password_reset_tokens', 'sessions', 'cache', 'cache_locks'];

        $expTables = array_diff(array_keys($expected), $ignoreTables);
        $actTables = array_diff(array_keys($actual), $ignoreTables);

        $onlyMigrations = array_values(array_diff($expTables, $actTables));
        $onlyLive       = array_values(array_diff($actTables, $expTables));

        $columnDrift = [];
        foreach (array_intersect($expTables, $actTables) as $table) {
            $expCols = array_keys($expected[$table]);
            $actCols = array_keys($actual[$table]);

            $missingInLive       = array_values(array_diff($expCols, $actCols));
            $extraInLive         = array_values(array_diff($actCols, $expCols));

            if ($missingInLive || $extraInLive) {
                $columnDrift[$table] = [
                    // Columns migrations create but the live DB lacks:
                    'missing_in_live'       => $missingInLive,
                    // Columns the live DB has but migrations never create
                    // (i.e. code may be writing to a column a fresh install won't have):
                    'only_in_live'          => $extraInLive,
                ];
            }
        }

        return [
            'live_database'               => $this->option('live') ?: DB::connection()->getDatabaseName(),
            'generated_at'                => now()->toIso8601String(),
            'tables_only_in_migrations'   => $onlyMigrations,
            'tables_only_in_live'         => $onlyLive,
            'column_drift'                => $columnDrift,
        ];
    }

    private function renderReport(array $report): void
    {
        $this->newLine();
        $this->info('════════════════ SCHEMA DIFF REPORT ════════════════');

        if ($report['tables_only_in_migrations']) {
            $this->error('Tables in migrations but NOT in live DB:');
            foreach ($report['tables_only_in_migrations'] as $t) {
                $this->line("   - {$t}");
            }
        }

        if ($report['tables_only_in_live']) {
            $this->warn('Tables in live DB but NOT produced by migrations:');
            foreach ($report['tables_only_in_live'] as $t) {
                $this->line("   - {$t}");
            }
        }

        if ($report['column_drift']) {
            $this->error('Column drift per table:');
            foreach ($report['column_drift'] as $table => $d) {
                $this->line("  <fg=cyan>{$table}</>");
                foreach ($d['missing_in_live'] as $c) {
                    $this->line("     <fg=red>- missing in live   :</> {$c}  (migrations create it; a drifted live DB lacks it)");
                }
                foreach ($d['only_in_live'] as $c) {
                    $this->line("     <fg=yellow>! only in live      :</> {$c}  (live has it; a FRESH install won't — code writing here will break)");
                }
            }
        }

        if (!$report['tables_only_in_migrations']
            && !$report['tables_only_in_live']
            && !$report['column_drift']) {
            $this->info('✅ No schema drift detected. Migrations and live DB agree.');
        }

        $this->info('═════════════════════════════════════════════════════');
    }
}
