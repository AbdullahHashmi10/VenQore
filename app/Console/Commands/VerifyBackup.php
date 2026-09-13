<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * backup:verify — IMPLEMENTATION.md T7.
 *
 * A backup nobody has ever restored is a hope, not a backup. This command
 * proves the *most recent* dump produced by `vq:backup` actually restores:
 * it spins up a scratch database (`venqore_restore_check`), replays the SQL
 * dump into it, and sanity-checks row counts on a handful of core tables
 * against production. It never touches the real `venqore_pos` database.
 *
 * Usage: php artisan backup:verify
 */
class VerifyBackup extends Command
{
    protected $signature = 'backup:verify';

    protected $description = 'Restore the most recent vq:backup dump into a scratch database and sanity-check it';

    /** Tables whose row counts are worth a quick sanity comparison. */
    protected array $coreTables = ['tenants', 'users', 'products', 'sales', 'journal_entries'];

    protected string $scratchDatabase = 'venqore_restore_check';

    public function handle(): int
    {
        if (app()->bound('current.tenant') && app('current.tenant')) {
            $this->error('SECURITY: backup:verify touches the whole database and must be run from a platform/CLI context, not a tenant-bound request.');
            return self::FAILURE;
        }

        $backupPath = $this->latestBackupPath();
        if (!$backupPath) {
            $this->error('No backup files found in storage/app/private/backups (or wherever the "local" disk points). Run `php artisan vq:backup` first.');
            return self::FAILURE;
        }

        $this->info("Verifying backup: {$backupPath}");

        $sql = Storage::disk('local')->get($backupPath);
        if (empty($sql)) {
            $this->error('Backup file is empty — nothing to restore.');
            return self::FAILURE;
        }

        try {
            $this->recreateScratchDatabase();
            $this->registerScratchConnection();

            $this->info("Restoring dump into `{$this->scratchDatabase}`...");

            // Laravel DB connection configuration
            $dbHost = config('database.connections.mysql.host', '127.0.0.1');
            $dbPort = config('database.connections.mysql.port', '3306');
            $dbUser = config('database.connections.mysql.username', 'root');
            $dbPass = config('database.connections.mysql.password', '');

            // Construct native shell command for mysql import to save PHP memory
            $backupFileAbs = Storage::disk('local')->path($backupPath);
            $cmd = sprintf(
                'mysql --host=%s --port=%s --user=%s %s %s < %s',
                escapeshellarg($dbHost),
                escapeshellarg($dbPort),
                escapeshellarg($dbUser),
                $dbPass ? '--password=' . escapeshellarg($dbPass) : '',
                escapeshellarg($this->scratchDatabase),
                escapeshellarg($backupFileAbs)
            );

            // Execute via native shell command line
            $output = [];
            $resultCode = 0;
            exec($cmd, $output, $resultCode);

            if ($resultCode !== 0) {
                // Fallback: If CLI mysql is missing, try raw PHP stream line-by-line parsing to avoid memory exhaustion
                $this->warn('CLI mysql import command failed or not found. Falling back to line-by-line stream import...');
                $conn = DB::connection('backup_verify');
                $conn->statement('SET FOREIGN_KEY_CHECKS=0;');
                
                $handle = fopen($backupFileAbs, 'r');
                if ($handle) {
                    $query = '';
                    while (($line = fgets($handle)) !== false) {
                        // Skip comments
                        if (str_starts_with(trim($line), '--') || str_starts_with(trim($line), '/*')) {
                            continue;
                        }
                        $query .= $line;
                        if (str_ends_with(trim($line), ';')) {
                            $conn->unprepared($query);
                            $query = '';
                        }
                    }
                    fclose($handle);
                }
                $conn->statement('SET FOREIGN_KEY_CHECKS=1;');
            } else {
                $conn = DB::connection('backup_verify');
            }
        } catch (\Throwable $e) {
            $this->error('Restore into scratch database failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info('Restore completed. Row-count sanity check against production:');

        $allOk = true;
        $rows = [];
        foreach ($this->coreTables as $table) {
            $prodCount = $this->tableExists(DB::connection(), $table) ? DB::connection()->table($table)->count() : null;
            $backupCount = $this->tableExists($conn, $table) ? $conn->table($table)->count() : null;

            $status = 'OK';
            if ($backupCount === null) {
                $status = 'MISSING TABLE IN BACKUP';
                $allOk = false;
            } elseif ($prodCount !== null && $backupCount === 0 && $prodCount > 0) {
                // Backup restored the table structure but it came back empty while
                // production has real rows — the dump is almost certainly stale or broken.
                $status = 'EMPTY IN BACKUP, NON-EMPTY IN PROD';
                $allOk = false;
            }

            $rows[] = [$table, $prodCount ?? 'n/a', $backupCount ?? 'n/a', $status];
        }

        $this->table(['Table', 'Production Count', 'Backup Count', 'Status'], $rows);

        $this->line("Scratch database `{$this->scratchDatabase}` left in place for manual inspection — it will be dropped and recreated on the next `backup:verify` run.");

        if (!$allOk) {
            $this->error('Backup verification FAILED — see table above.');
            return self::FAILURE;
        }

        $this->info('Backup verification PASSED.');
        return self::SUCCESS;
    }

    protected function latestBackupPath(): ?string
    {
        $files = collect(Storage::disk('local')->files('backups'))
            ->filter(fn($f) => str_ends_with($f, '.sql'))
            ->sortByDesc(fn($f) => Storage::disk('local')->lastModified($f));

        return $files->first();
    }

    /**
     * DROP + CREATE the scratch database.
     *
     * CREATE/DROP DATABASE is a server-level DDL operation in MySQL — it isn't
     * scoped to whichever database the connection currently has selected, so
     * this can safely run over the normal default ('mysql'/production) connection
     * as long as that DB user has the CREATE/DROP privilege. No separate
     * dbname-less "admin" connection is needed (and Laravel's MySqlConnector
     * always embeds `dbname=` in the DSN, so a null-database connection isn't
     * straightforward to construct anyway).
     */
    protected function recreateScratchDatabase(): void
    {
        DB::statement("DROP DATABASE IF EXISTS `{$this->scratchDatabase}`");
        DB::statement("CREATE DATABASE `{$this->scratchDatabase}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    }

    protected function registerScratchConnection(): void
    {
        $base = config('database.connections.mysql');

        config(['database.connections.backup_verify' => array_merge($base, [
            'database' => $this->scratchDatabase,
        ])]);

        DB::purge('backup_verify');
    }

    protected function tableExists($connection, string $table): bool
    {
        try {
            return $connection->getSchemaBuilder()->hasTable($table);
        } catch (\Throwable) {
            return false;
        }
    }
}
