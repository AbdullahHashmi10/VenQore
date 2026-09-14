<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends Controller
{
    /**
     * Run all proactive diagnostic health checks.
     * Locked strictly to SuperAdmin users.
     */
    public function check(): JsonResponse
    {
        return response()->json([
            'database'    => $this->checkDb(),
            'storage'     => $this->checkStorage(),
            'cache'       => $this->checkCache(),
            'queue'       => $this->checkQueue(),
            'recent_logs' => $this->checkRecentLogs(),
            'checked_at'  => now()->toISOString(),
        ]);
    }

    /**
     * Check Database connectivity and record presence.
     */
    private function checkDb(): array
    {
        try {
            DB::select('SELECT 1');
            $tenants = DB::table('tenants')->count();
            return [
                'ok' => true, 
                'detail' => "Connection stable. $tenants store(s) detected in database."
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false, 
                'detail' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify both read and write capabilities on file storage.
     */
    private function checkStorage(): array
    {
        try {
            $disk = Storage::disk('public');
            $filename = 'diagnostics/health_heartbeat_' . time() . '.txt';
            
            // Check write access
            $disk->put($filename, 'pong');
            
            // Check read access
            $content = $disk->get($filename);
            if ($content !== 'pong') {
                throw new \Exception('Storage read mismatch.');
            }
            
            // Check delete access
            $disk->delete($filename);
            
            return [
                'ok' => true, 
                'detail' => 'Storage read, write, and delete permissions are fully functional.'
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false, 
                'detail' => 'Storage permission error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify Cache read/write stability.
     */
    private function checkCache(): array
    {
        try {
            $key = 'health_check_heartbeat';
            Cache::put($key, 'pong', 30);
            $result = Cache::get($key);
            
            if ($result !== 'pong') {
                throw new \Exception('Cache read mismatch.');
            }
            
            return [
                'ok' => true, 
                'detail' => 'Cache read/write checks passed successfully.'
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false, 
                'detail' => 'Cache driver error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify recent background job failures.
     */
    private function checkQueue(): array
    {
        try {
            if (!SchemaHasTable('failed_jobs')) {
                return [
                    'ok' => true,
                    'detail' => 'Queue system ok. No failed_jobs table detected (using synchronous drivers).'
                ];
            }

            $failedRecent = DB::table('failed_jobs')
                ->where('failed_at', '>', now()->subMinutes(10))
                ->count();
                
            return [
                'ok'     => $failedRecent === 0,
                'detail' => $failedRecent === 0
                    ? 'Queue check ok. No failed jobs recorded in the last 10 minutes.'
                    : "Queue warning: $failedRecent job(s) failed in the last 10 minutes.",
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false, 
                'detail' => 'Queue monitoring error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Memory-safe tail-read of recent error logs.
     */
    private function checkRecentLogs(): array
    {
        try {
            $log = storage_path('logs/laravel.log');
            if (!file_exists($log)) {
                return [
                    'ok' => true, 
                    'detail' => 'No active log file found. Logs are clean.'
                ];
            }

            // Memory-safe stream seeking to get only the last 15KB of log lines
            $handle = fopen($log, 'r');
            if (!$handle) {
                throw new \Exception('Could not open log file.');
            }

            fseek($handle, 0, SEEK_END);
            $pos = ftell($handle);
            
            // Limit read to the last 15KB of file to keep memory constant
            $readSize = min($pos, 15360); 
            fseek($handle, $pos - $readSize, SEEK_SET);
            $logBuffer = fread($handle, $readSize);
            fclose($handle);

            $errors = 0;
            // Scan for critical and error lines
            if ($logBuffer) {
                $lines = explode("\n", $logBuffer);
                foreach ($lines as $line) {
                    if (str_contains($line, '.ERROR') || str_contains($line, 'CRITICAL') || str_contains($line, 'EMERGENCY')) {
                        $errors++;
                    }
                }
            }

            return [
                'ok'     => $errors === 0,
                'detail' => $errors === 0
                    ? 'Logs verify ok. No errors or critical entries detected in the recent log stream.'
                    : "Logs warning: Detected $errors error/critical entry lines in the recent log stream.",
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false, 
                'detail' => 'Log diagnostic error: ' . $e->getMessage()
            ];
        }
    }
}

/**
 * Helper to check table existence safely.
 */
function SchemaHasTable(string $table): bool
{
    try {
        return \Illuminate\Support\Facades\Schema::hasTable($table);
    } catch (\Throwable) {
        return false;
    }
}
