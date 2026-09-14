<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Http\Controllers\VqBackupController;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncGoogleDriveBackups extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:google-drive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync store backups to user Google Drive folders for stores with Google Backup enabled';

    protected $driveService;
    protected $backupController;

    /**
     * Create a new command instance.
     */
    public function __construct(GoogleDriveService $driveService, VqBackupController $backupController)
    {
        parent::__construct();
        $this->driveService = $driveService;
        $this->backupController = $backupController;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Google Drive backup synchronization...");

        $tenants = Tenant::where('google_backup_enabled', true)
            ->whereNotNull('google_refresh_token')
            ->get();

        if ($tenants->isEmpty()) {
            $this->info("No stores found with Google Drive backups enabled.");
            return 0;
        }

        $successCount = 0;
        $failCount = 0;

        foreach ($tenants as $tenant) {
            $this->info("Processing store: {$tenant->name} (Slug: {$tenant->slug})");

            try {
                // Set the current.tenant binding in the DI container so HasTenant traits scope queries correctly
                app()->instance('current.tenant', $tenant);

                // Generate payload
                $payload = $this->backupController->generateBackupPayload($tenant);
                
                // Filename includes auto tag and ISO date
                $filename = 'venqore_backup_auto_' . date('Y-m-d') . '.vq';

                $this->info("Uploading encrypted backup '{$filename}' to Google Drive...");
                $uploaded = $this->driveService->uploadBackup($tenant, $filename, $payload);

                if ($uploaded) {
                    $this->info("Pruning old backups exceeding retention settings...");
                    $this->driveService->pruneOldBackups($tenant);
                    
                    $this->info("Backup synchronized successfully for {$tenant->name}.");
                    $successCount++;
                } else {
                    $this->error("Failed to upload backup for store {$tenant->id}.");
                    $failCount++;
                }

            } catch (\Exception $e) {
                $this->error("Error syncing backup for store {$tenant->id}: " . $e->getMessage());
                Log::error("Automated Google Drive Sync failed for store {$tenant->id}: " . $e->getMessage());
                $failCount++;
            }
        }

        $this->info("Backup sync complete. Success: {$successCount}, Failures: {$failCount}.");
        return 0;
    }
}
