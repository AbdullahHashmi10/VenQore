<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BackupService;

class CreateVqBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vq:backup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a full database backup and store it securely';

    /**
     * Execute the console command.
     */
    public function handle(BackupService $backupService)
    {
        $this->info('Starting database backup...');

        $result = $backupService->createBackup();

        if ($result['success']) {
            $this->info("Backup created successfully!");
            $this->info("Filename: " . $result['filename']);
            $this->info("Path: " . $result['path']);
            $this->info("Size: " . number_format($result['size'] / 1024, 2) . " KB");
            return self::SUCCESS;
        } else {
            $this->error("Backup failed: " . $result['message']);
            return self::FAILURE;
        }
    }
}
