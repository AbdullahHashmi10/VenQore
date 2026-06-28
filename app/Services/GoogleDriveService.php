<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    /**
     * Get a fresh access token for the tenant, refreshing it if needed.
     */
    public function getAccessToken(Tenant $tenant): ?string
    {
        if (!$tenant->google_refresh_token) {
            return null;
        }

        try {
            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $tenant->google_refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->failed()) {
                Log::error("Failed to refresh Google Drive token for tenant {$tenant->id}: " . $response->body());
                return null;
            }

            $data = $response->json();
            $accessToken = $data['access_token'] ?? null;

            if ($accessToken) {
                // Update access token in database for cache
                $tenant->google_access_token = $accessToken;
                $tenant->save();
            }

            return $accessToken;

        } catch (\Exception $e) {
            Log::error("Exception refreshing Google Drive token for tenant {$tenant->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get or create the 'VenQore Backups' folder on Google Drive.
     */
    public function getOrCreateFolder(Tenant $tenant, string $accessToken): ?string
    {
        if ($tenant->google_backup_folder_id) {
            // Verify folder still exists on Drive
            $response = Http::withToken($accessToken)
                ->get("https://www.googleapis.com/drive/v3/files/{$tenant->google_backup_folder_id}", [
                    'fields' => 'id, trashed',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!($data['trashed'] ?? false)) {
                    return $tenant->google_backup_folder_id;
                }
            }
        }

        try {
            // Search for folder by name
            $searchResponse = Http::withToken($accessToken)
                ->get('https://www.googleapis.com/drive/v3/files', [
                    'q' => "name = 'VenQore Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                    'fields' => 'files(id)',
                    'spaces' => 'drive',
                ]);

            if ($searchResponse->successful()) {
                $files = $searchResponse->json('files') ?? [];
                if (!empty($files)) {
                    $folderId = $files[0]['id'];
                    $tenant->google_backup_folder_id = $folderId;
                    $tenant->save();
                    return $folderId;
                }
            }

            // Create new folder
            $createResponse = Http::withToken($accessToken)
                ->post('https://www.googleapis.com/drive/v3/files', [
                    'name' => 'VenQore Backups',
                    'mimeType' => 'application/vnd.google-apps.folder',
                ]);

            if ($createResponse->successful()) {
                $folderId = $createResponse->json('id');
                $tenant->google_backup_folder_id = $folderId;
                $tenant->save();
                return $folderId;
            }

            Log::error("Failed to create Google Drive folder for tenant {$tenant->id}: " . $createResponse->body());
            return null;

        } catch (\Exception $e) {
            Log::error("Exception in getOrCreateFolder for tenant {$tenant->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload backup payload to Google Drive.
     */
    public function uploadBackup(Tenant $tenant, string $filename, string $payload): bool
    {
        $accessToken = $this->getAccessToken($tenant);
        if (!$accessToken) {
            return false;
        }

        $folderId = $this->getOrCreateFolder($tenant, $accessToken);
        if (!$folderId) {
            return false;
        }

        try {
            $metadata = [
                'name' => $filename,
                'parents' => [$folderId],
            ];

            $response = Http::withToken($accessToken)
                ->attach('metadata', json_encode($metadata), 'metadata.json', ['Content-Type' => 'application/json; charset=UTF-8'])
                ->attach('file', $payload, $filename, ['Content-Type' => 'application/octet-stream'])
                ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');

            if ($response->successful()) {
                Log::info("Backup '{$filename}' successfully uploaded to Google Drive for tenant {$tenant->id}");
                return true;
            }

            Log::error("Failed to upload backup to Google Drive for tenant {$tenant->id}: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("Exception uploading backup to Google Drive for tenant {$tenant->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * List backups sorted by creation date (newest first).
     */
    public function listBackups(Tenant $tenant): array
    {
        $accessToken = $this->getAccessToken($tenant);
        if (!$accessToken) {
            return [];
        }

        $folderId = $this->getOrCreateFolder($tenant, $accessToken);
        if (!$folderId) {
            return [];
        }

        try {
            $response = Http::withToken($accessToken)
                ->get('https://www.googleapis.com/drive/v3/files', [
                    'q' => "'{$folderId}' in parents and trashed = false and name contains '.vq'",
                    'orderBy' => 'createdTime desc',
                    'fields' => 'files(id, name, createdTime, size)',
                ]);

            if ($response->successful()) {
                return $response->json('files') ?? [];
            }

            Log::error("Failed to list Google Drive backups for tenant {$tenant->id}: " . $response->body());
            return [];

        } catch (\Exception $e) {
            Log::error("Exception listing backups on Google Drive for tenant {$tenant->id}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Prune backups based on retention policy.
     */
    public function pruneOldBackups(Tenant $tenant): bool
    {
        $accessToken = $this->getAccessToken($tenant);
        if (!$accessToken) {
            return false;
        }

        $files = $this->listBackups($tenant);
        $retention = $tenant->google_backup_retention ?? 7;

        if (count($files) <= $retention) {
            return true;
        }

        // Files are sorted descending by createdTime, so the oldest are at the end
        $filesToDelete = array_slice($files, $retention);

        $success = true;
        foreach ($filesToDelete as $file) {
            $fileId = $file['id'];
            try {
                $response = Http::withToken($accessToken)
                    ->delete("https://www.googleapis.com/drive/v3/files/{$fileId}");

                if ($response->successful()) {
                    Log::info("Pruned old backup '{$file['name']}' (ID: {$fileId}) from Google Drive for tenant {$tenant->id}");
                } else {
                    Log::error("Failed to prune file {$fileId} for tenant {$tenant->id}: " . $response->body());
                    $success = false;
                }
            } catch (\Exception $e) {
                Log::error("Exception pruning file {$fileId} for tenant {$tenant->id}: " . $e->getMessage());
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Download a file's content from Google Drive.
     */
    public function downloadFile(Tenant $tenant, string $fileId): ?string
    {
        $accessToken = $this->getAccessToken($tenant);
        if (!$accessToken) {
            return null;
        }

        try {
            $response = Http::withToken($accessToken)
                ->get("https://www.googleapis.com/drive/v3/files/{$fileId}", [
                    'alt' => 'media',
                ]);

            if ($response->successful()) {
                return $response->body();
            }

            Log::error("Failed to download file {$fileId} from Google Drive for tenant {$tenant->id}: " . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error("Exception downloading file {$fileId} from Google Drive for tenant {$tenant->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a file from Google Drive.
     */
    public function deleteFile(Tenant $tenant, string $fileId): bool
    {
        $accessToken = $this->getAccessToken($tenant);
        if (!$accessToken) {
            return false;
        }

        try {
            $response = Http::withToken($accessToken)
                ->delete("https://www.googleapis.com/drive/v3/files/{$fileId}");

            if ($response->successful()) {
                Log::info("Successfully deleted file '{$fileId}' from Google Drive for tenant {$tenant->id}");
                return true;
            }

            Log::error("Failed to delete file {$fileId} from Google Drive for tenant {$tenant->id}: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("Exception deleting file {$fileId} from Google Drive for tenant {$tenant->id}: " . $e->getMessage());
            return false;
        }
    }
}
