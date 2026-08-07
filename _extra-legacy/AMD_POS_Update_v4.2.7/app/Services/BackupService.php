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
            // Try mysqldump first if available (faster)
            // But for XAMPP Windows reliability without PATH, let's use a pure PHP dumper
            // It's safer for this context.
            
            $content = $this->dumpDatabase();
            
            Storage::disk($this->backupDisk)->put($path, $content);
            
            return [
                'success' => true,
                'path' => $path,
                'filename' => $filename,
                'size' => Storage::disk($this->backupDisk)->size($path)
            ];

        } catch (\Exception $e) {
            Log::error("Backup failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    protected function dumpDatabase()
    {
        $out = "/* VenQore POS Database Backup */\n";
        $out .= "/* Date: " . date('Y-m-d H:i:s') . " */\n\n";
        $out .= "SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n\n";

        $tables = DB::select('SHOW TABLES');
        $tables = array_map(fn($t) => array_values((array)$t)[0], $tables);

        foreach ($tables as $table) {
            // Structure
            $createTable = DB::select("SHOW CREATE TABLE `$table`");
            if (isset($createTable[0]->{'Create View'})) {
                // It's a view, skip or handle views (skipping complex views for simple backup is often safer unless needed)
                continue; 
            }
            $createSql = $createTable[0]->{'Create Table'};
            $out .= "DROP TABLE IF EXISTS `$table`;\n";
            $out .= $createSql . ";\n\n";

            // Data
            // Chunking for memory safety
            DB::table($table)->orderBy(DB::raw('1'))->chunk(100, function ($rows) use (&$out, $table) {
                foreach ($rows as $row) {
                    $row = (array)$row;
                    $cols = array_keys($row);
                    $vals = array_values($row);

                    $vals = array_map(function ($val) {
                        if (is_null($val)) return "NULL";
                        return "'" . addslashes($val) . "'";
                    }, $vals);

                    $out .= "INSERT INTO `$table` (`" . implode('`, `', $cols) . "`) VALUES (" . implode(', ', $vals) . ");\n";
                }
            });
            $out .= "\n";
        }

        $out .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $out;
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
