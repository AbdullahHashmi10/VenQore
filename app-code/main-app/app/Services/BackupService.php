<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BackupService
{
    protected $backupDisk = 'local';
    protected $backupPath = 'backups';

    public function createBackup()
    {
        if (app()->bound('current.tenant') && app('current.tenant')) {
            throw new \Exception("SECURITY VIOLATION: Raw SQL backups can only be performed by the Platform Administrator.");
        }

        $filename = 'backup-' . Carbon::now()->format('Y-m-d-H-i-s') . '.sql';
        $path = $this->backupPath . '/' . $filename;
        
        // Ensure directory exists
        if (!Storage::disk($this->backupDisk)->exists($this->backupPath)) {
            Storage::disk($this->backupDisk)->makeDirectory($this->backupPath);
        }

        try {
            // Written straight to the file, table by table: building the whole
            // database as one string ran out of memory on a real server.
            @set_time_limit(0);
            $full = Storage::disk($this->backupDisk)->path($path);
            $fh = fopen($full, 'wb');
            if (! $fh) {
                throw new \Exception("Cannot write {$full}");
            }
            try {
                $this->dumpDatabase(fn (string $chunk) => fwrite($fh, $chunk));
            } finally {
                fclose($fh);
            }

            return [
                'success' => true,
                'path' => $path,
                'filename' => $filename,
                'size' => Storage::disk($this->backupDisk)->size($path)
            ];

        } catch (\Throwable $e) {
            Log::error("Backup failed: " . $e->getMessage());
            if (isset($full) && is_file($full) && filesize($full) === 0) {
                @unlink($full);
            }
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    protected function dumpDatabase(callable $write): void
    {
        $write("/* VenQore POS Database Backup */\n/* Date: " . date('Y-m-d H:i:s') . " */\n\n");
        $write("SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n\n");

        $pdo = DB::connection()->getPdo();
        $tables = DB::select('SHOW FULL TABLES');
        foreach ($tables as $t) {
            $t = array_values((array) $t);
            [$table, $type] = [$t[0], $t[1] ?? 'BASE TABLE'];
            if ($type !== 'BASE TABLE') {
                continue; // views are rebuilt by migrations
            }
            $createSql = DB::select("SHOW CREATE TABLE `$table`")[0]->{'Create Table'};
            $write("DROP TABLE IF EXISTS `$table`;\n" . $createSql . ";\n\n");

            $buf = '';
            foreach (DB::table($table)->cursor() as $row) {
                $row = (array) $row;
                $vals = array_map(fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v), array_values($row));
                $buf .= "INSERT INTO `$table` (`" . implode('`, `', array_keys($row)) . "`) VALUES (" . implode(', ', $vals) . ");\n";
                if (strlen($buf) > 1048576) {
                    $write($buf);
                    $buf = '';
                }
            }
            $write($buf . "\n");
        }

        $write("SET FOREIGN_KEY_CHECKS=1;\n");
    }


    public function restoreBackup($filePath)
    {
        if (app()->bound('current.tenant') && app('current.tenant')) {
            throw new \Exception("SECURITY VIOLATION: Raw SQL restores can only be performed by the Platform Administrator. Cross-tenant database destruction prevented.");
        }

        try {
            // Read file
            if (!file_exists($filePath)) {
                throw new \Exception("Backup file not found.");
            }

            $sql = file_get_contents($filePath);

            // Basic validation
            if (empty($sql)) {
                throw new \Exception("Backup file is empty.");
            }

            // Disable FK checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Execute SQL
            // DB::unprepared is suitable for raw SQL dumps with multiple statements
            DB::unprepared($sql);

            // Re-enable FK checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return [
                'success' => true,
                'message' => 'Database restored successfully.'
            ];

        } catch (\Exception $e) {
            Log::error("Restore failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
