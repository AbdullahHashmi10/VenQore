<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OffsiteBackupService
{
    /**
     * Copy a local backup file to the configured offsite storage disk
     * (R2, S3 offsite, or dedicated secondary disk) with SHA-256 hash verification.
     *
     * @param string $localFilePath Relative path in storage/app or absolute path
     * @param string $targetDisk Disk name configured in filesystems.php (default: 's3_offsite' or 'r2')
     * @return array Status report containing success boolean, hash, and destination path
     */
    public function dispatchOffsiteBackup(string $localFilePath, string $targetDisk = 's3_offsite'): array
    {
        $localPath = Storage::disk('local')->path(ltrim($localFilePath, '/'));

        if (!file_exists($localPath)) {
            Log::error("OffsiteBackupService: Local backup file not found at {$localPath}");
            return [
                'success' => false,
                'error'   => 'Local file not found',
            ];
        }

        $content   = file_get_contents($localPath);
        $localHash = hash_file('sha256', $localPath);
        $filename  = basename($localPath);
        $targetPath = 'offsite/' . date('Y-m-d') . '/' . $filename;

        try {
            Storage::disk($targetDisk)->put($targetPath, $content);

            // Hash verification check
            $remoteContent = Storage::disk($targetDisk)->get($targetPath);
            $remoteHash    = hash('sha256', $remoteContent);

            if ($localHash !== $remoteHash) {
                Log::error("OffsiteBackupService: Hash mismatch during offsite backup for {$filename}. Local: {$localHash}, Remote: {$remoteHash}");
                return [
                    'success' => false,
                    'error'   => 'SHA-256 hash verification mismatch',
                ];
            }

            Log::info("OffsiteBackupService: Successfully dispatched offsite backup {$filename} to {$targetDisk}:{$targetPath}");

            return [
                'success'     => true,
                'disk'        => $targetDisk,
                'target_path' => $targetPath,
                'hash'        => $localHash,
                'bytes'       => strlen($content),
            ];
        } catch (\Throwable $e) {
            Log::error("OffsiteBackupService: Exception while uploading to offsite disk {$targetDisk}: " . $e->getMessage());
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}
