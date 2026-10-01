<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Models\Tenant;
use App\Services\GoogleDriveService;

class VqBackupController extends Controller
{
    /** SEC-03: manifest key embedded in v2 backups. */
    private const META_KEY = '__vq_meta';

    /** Max accepted .vq upload in kilobytes (100 MB). */
    private const MAX_UPLOAD_KB = 102400;

    /**
     * SEC-03 (2026-09-10): tables that hold security identities, credentials or
     * infrastructure state. They are never exported and never restored — a
     * business-data restore must not roll back who has access to the store
     * (staff memberships, PIN hashes, invitations, tokens) or quota counters.
     */
    private const NON_RESTORABLE_TABLES = [
        'tenant_users', 'staff_invitations', 'personal_access_tokens', 'sessions',
        'password_reset_tokens', 'jobs', 'failed_jobs', 'job_batches', 'cache', 'cache_locks',
        'ai_usage_events', 'ai_rate_buckets', 'ai_spend_counters', 'email_otp_challenges',
        'terminals', 'terminal_activities',
    ];

    /**
     * Export all store data into a single encrypted .vq file.
     * Dynamically scans every single database table containing tenant_id to guarantee
     * 100% data fidelity (transactions, cash in hand, settings, products, stocks, etc.).
     */
    /**
     * Generate the encrypted backup payload string.
     */
    public function generateBackupPayload(Tenant $tenant): string
    {
        $dbName = DB::connection()->getDatabaseName();
        $allTables = DB::select("SHOW TABLES");
        $keyName = "Tables_in_{$dbName}";
        
        $tenantTables = [];

        foreach ($allTables as $tableObj) {
            $tableName = $tableObj->$keyName ?? array_values((array)$tableObj)[0];
            if (Schema::hasColumn($tableName, 'tenant_id')) {
                $tenantTables[] = $tableName;
            }
        }

        $backupData = [];

        foreach ($tenantTables as $table) {
            if (in_array($table, self::NON_RESTORABLE_TABLES, true)) {
                continue; // SEC-03: security identities / infra never travel in a backup
            }
            $backupData[$table] = DB::table($table)
                ->where('tenant_id', $tenant->id)
                ->get()
                ->toArray();
        }

        // SEC-03: tenant-bound manifest. Restore refuses a backup made for another store.
        $backupData[self::META_KEY] = [
            'version'    => 2,
            'tenant_id'  => $tenant->id,
            'created_at' => now()->toIso8601String(),
        ];

        return Crypt::encryptString(json_encode($backupData));
    }

    public function export()
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        try {
            $encryptedPayload = $this->generateBackupPayload($tenant);
            $filename = 'venqore_backup_' . $tenant->slug . '_' . date('Y-m-d_His') . '.vq';

            Log::info("Tenant {$tenant->id} ('{$tenant->slug}') successfully exported complete encrypted .vq backup.");

            return response()->streamDownload(function () use ($encryptedPayload) {
                echo $encryptedPayload;
            }, $filename, [
                'Content-Type' => 'application/octet-stream',
            ]);

        } catch (\Exception $e) {
            Log::error("Backup Export failed for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to generate store backup: ' . $e->getMessage());
        }
    }

    /**
     * Manually sync the current store state to Google Drive.
     */
    public function syncToGoogleDrive(GoogleDriveService $driveService)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        if (!$tenant->google_refresh_token) {
            return back()->with('error', 'Google Drive integration is not connected.');
        }

        try {
            $payload = $this->generateBackupPayload($tenant);
            $filename = 'venqore_backup_manual_' . date('Y-m-d_His') . '.vq';

            $uploaded = $driveService->uploadBackup($tenant, $filename, $payload);

            if ($uploaded) {
                // Prune any backups exceeding the retention settings
                $driveService->pruneOldBackups($tenant);
                return back()->with('success', 'Backup synced successfully to your Google Drive folder!');
            }

            return back()->with('error', 'Failed to upload backup to Google Drive. Check connection logs.');

        } catch (\Exception $e) {
            Log::error("Manual Google Drive sync failed for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to sync backup to Google Drive: ' . $e->getMessage());
        }
    }

    /**
     * Import and restore store data from an encrypted .vq file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:' . self::MAX_UPLOAD_KB,
        ]);

        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        $file = $request->file('file');

        // Check file extension
        if ($file->getClientOriginalExtension() !== 'vq') {
            return back()->with('error', 'Invalid file type. Please upload a valid .vq backup file.');
        }

        try {
            $encryptedContent = file_get_contents($file->getRealPath());

            // Decrypt the payload
            try {
                $decryptedJson = Crypt::decryptString($encryptedContent);
            } catch (\Exception $decryptException) {
                return back()->with('error', 'Failed to decrypt backup. This file is corrupt or was generated by a different system key.');
            }

            $backupData = json_decode($decryptedJson, true);

            if (!is_array($backupData)) {
                return back()->with('error', 'Backup format is invalid or empty.');
            }

            if ($error = $this->restorePayload($tenant, $backupData, 'upload')) {
                return back()->with('error', $error);
            }

            Log::info("Tenant {$tenant->id} ('{$tenant->slug}') successfully restored complete data from .vq backup.");
            return back()->with('success', 'Store data restored successfully. All products, sales history, cash in hand, bank balances, and configuration settings are exactly as you left them!');

        } catch (\Exception $e) {
            Log::error("Backup Import failed for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to restore backup: ' . $e->getMessage());
        }
    }

    /**
     * Download a specific backup file from Google Drive.
     */
    public function downloadFromGoogleDrive(GoogleDriveService $driveService, $fileId)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        try {
            // Need to retrieve file name to serve correctly
            $accessToken = $driveService->getAccessToken($tenant);
            $metaResponse = \Illuminate\Support\Facades\Http::withToken($accessToken)
                ->get("https://www.googleapis.com/drive/v3/files/{$fileId}", [
                    'fields' => 'name',
                ]);
            $filename = $metaResponse->successful() ? $metaResponse->json('name') : "backup_{$fileId}.vq";

            $payload = $driveService->downloadFile($tenant, $fileId);

            if ($payload === null) {
                return back()->with('error', 'Failed to download backup file from Google Drive.');
            }

            return response()->streamDownload(function () use ($payload) {
                echo $payload;
            }, $filename, [
                'Content-Type' => 'application/octet-stream',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to stream download from Google Drive for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Download failed: ' . $e->getMessage());
        }
    }

    /**
     * Delete a specific backup file from Google Drive.
     */
    public function deleteFromGoogleDrive(GoogleDriveService $driveService, $fileId)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        try {
            $deleted = $driveService->deleteFile($tenant, $fileId);
            if ($deleted) {
                return back()->with('success', 'Backup deleted from Google Drive successfully.');
            }
            return back()->with('error', 'Failed to delete backup from Google Drive.');
        } catch (\Exception $e) {
            Log::error("Failed to delete backup from Google Drive for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Deletion failed: ' . $e->getMessage());
        }
    }

    /**
     * Restore the database directly from a specific Google Drive backup file.
     */
    public function restoreFromGoogleDrive(GoogleDriveService $driveService, $fileId)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        try {
            $encryptedContent = $driveService->downloadFile($tenant, $fileId);
            if ($encryptedContent === null) {
                return back()->with('error', 'Failed to download backup file from Google Drive.');
            }

            // Decrypt the payload
            try {
                $decryptedJson = Crypt::decryptString($encryptedContent);
            } catch (\Exception $decryptException) {
                return back()->with('error', 'Failed to decrypt backup. This file is corrupt or was generated by a different system key.');
            }

            $backupData = json_decode($decryptedJson, true);
            if (!is_array($backupData)) {
                return back()->with('error', 'Backup format is invalid or empty.');
            }

            if ($error = $this->restorePayload($tenant, $backupData, 'google_drive:' . $fileId)) {
                return back()->with('error', $error);
            }

            Log::info("Tenant {$tenant->id} ('{$tenant->slug}') successfully restored data directly from Google Drive backup {$fileId}.");
            return back()->with('success', 'Store data restored directly from Google Drive backup successfully!');

        } catch (\Exception $e) {
            Log::error("Direct Google Drive backup restore failed for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to restore Google Drive backup: ' . $e->getMessage());
        }
    }

    /**
     * SEC-03: the single restore path for both upload and Google Drive.
     *
     *  - refuses a v2 backup whose manifest names a different store;
     *  - restores only tables that exist, carry tenant_id and are not in
     *    NON_RESTORABLE_TABLES (memberships/credentials are never rolled back);
     *  - inserts only columns that exist in the current schema;
     *  - writes a pre-restore safety snapshot to local storage first;
     *  - records who restored what.
     *
     * Returns null on success or a user-facing error message.
     */
    private function restorePayload(Tenant $tenant, array $backupData, string $source): ?string
    {
        $meta = $backupData[self::META_KEY] ?? null;
        unset($backupData[self::META_KEY]);

        if (is_array($meta) && isset($meta['tenant_id']) && (string) $meta['tenant_id'] !== (string) $tenant->id) {
            Log::warning('Backup restore refused: manifest belongs to another store', [
                'tenant_id' => $tenant->id, 'backup_tenant_id' => $meta['tenant_id'], 'user_id' => auth()->id(), 'source' => $source,
            ]);
            return 'This backup was made for a different store and cannot be restored here.';
        }

        $tables = [];
        foreach ($backupData as $table => $rows) {
            if (!is_string($table) || !preg_match('/^[A-Za-z0-9_]+$/', $table)) {
                continue;
            }
            if (in_array($table, self::NON_RESTORABLE_TABLES, true)) {
                continue;
            }
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }
            $tables[$table] = is_array($rows) ? $rows : [];
        }

        if (empty($tables)) {
            return 'This backup contains no restorable store data.';
        }

        // Safety snapshot of the current state, so a bad restore can be undone.
        try {
            $snapshot = $this->generateBackupPayload($tenant);
            $path = 'backups/pre-restore/' . $tenant->id . '/pre_restore_' . date('Y-m-d_His') . '.vq';
            \Illuminate\Support\Facades\Storage::disk('local')->put($path, $snapshot);
        } catch (\Throwable $e) {
            Log::error("Pre-restore snapshot failed for store {$tenant->id}: " . $e->getMessage());
            return 'Could not take a safety snapshot before restoring, so nothing was changed. Please try again.';
        }

        DB::transaction(function () use ($tenant, $tables) {
            Schema::disableForeignKeyConstraints();
            try {
                foreach (array_keys($tables) as $table) {
                    DB::table($table)->where('tenant_id', $tenant->id)->delete();
                }

                foreach ($tables as $table => $rows) {
                    if (empty($rows)) {
                        continue;
                    }
                    $columns = array_flip(Schema::getColumnListing($table));
                    $insertBuffer = [];
                    foreach ($rows as $row) {
                        $rowArray = array_intersect_key((array) $row, $columns);
                        // Force the current store so a backup cannot write into another tenant.
                        $rowArray['tenant_id'] = $tenant->id;
                        $insertBuffer[] = $rowArray;
                    }
                    foreach (array_chunk($insertBuffer, 200) as $chunk) {
                        DB::table($table)->insert($chunk);
                    }
                }
            } finally {
                Schema::enableForeignKeyConstraints();
            }
        });

        Log::warning('Store data restored from backup', [
            'tenant_id' => $tenant->id, 'user_id' => auth()->id(), 'source' => $source,
            'tables' => count($tables), 'manifest' => is_array($meta) ? 'v2' : 'legacy',
        ]);

        return null;
    }
}
