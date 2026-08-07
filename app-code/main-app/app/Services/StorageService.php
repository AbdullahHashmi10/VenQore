<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * StorageService — Phase 3.3
 *
 * The single point of truth for all file storage in VenQore.
 *
 * WHY THIS EXISTS:
 *   Before this service, image uploads were scattered across 3 controllers
 *   with hardcoded `Storage::disk('public')->put(...)` calls. Migrating to
 *   Cloudflare R2 would have required changing every single upload call.
 *
 *   Now, all uploads go through this service. To migrate to R2, change ONE
 *   line: `'FILESYSTEM_DISK' => 'r2'` in .env. Zero controller changes needed.
 *
 * ARCHITECTURE:
 *   - In development:   FILESYSTEM_DISK=public   → local storage
 *   - In production:    FILESYSTEM_DISK=r2       → Cloudflare R2
 *   - Path structure:   tenants/{tenant_id}/{context}/{filename}
 *
 * USAGE:
 *   // Store a product image
 *   $path = StorageService::store($file, 'products');
 *   // Returns: "tenants/abc123/products/thumb_xyz.jpg"
 *
 *   // Get the public URL for a stored path
 *   $url = StorageService::url($path);
 *
 *   // Delete a file
 *   StorageService::delete($path);
 *
 *   // Store with GD thumbnail optimization (for product images)
 *   $path = StorageService::storeOptimized($file, 'products', 500);
 */
class StorageService
{
    /**
     * Get the active storage disk name.
     * Reads from FILESYSTEM_DISK env — no hardcoding.
     */
    public static function disk(): string
    {
        return config('filesystems.default', 'public');
    }

    /**
     * Store a file in the tenant-scoped path.
     *
     * @param  UploadedFile  $file
     * @param  string        $context  e.g. 'products', 'logos', 'attachments'
     * @return string        The stored path (relative, for saving to DB)
     */
    public static function store(UploadedFile $file, string $context = 'uploads'): string
    {
        $tenantPath = static::tenantPath($context);
        return $file->store($tenantPath, static::disk());
    }

    /**
     * Store a raw string (e.g., GD-processed image bytes).
     *
     * @param  string  $data     Raw file bytes
     * @param  string  $path     Full relative path including filename
     * @return bool
     */
    public static function put(string $path, string $data): bool
    {
        return Storage::disk(static::disk())->put($path, $data);
    }

    /**
     * Store a product image with GD thumbnail optimization.
     * Resizes to maxDimension × maxDimension before storing.
     * Falls back to raw store if GD is not available.
     *
     * @param  UploadedFile  $file
     * @param  string        $context
     * @param  int           $maxDimension  Max width or height in pixels
     * @return string        The stored thumbnail path
     */
    public static function storeOptimized(UploadedFile $file, string $context = 'products', int $maxDimension = 500): string
    {
        $tenantPath = static::tenantPath($context);

        if (!extension_loaded('gd') || !in_array(
            strtolower($file->getClientOriginalExtension()),
            ['jpg', 'jpeg', 'png', 'webp']
        )) {
            return $file->store($tenantPath, static::disk());
        }

        try {
            $imageData = file_get_contents($file->getRealPath());
            $image     = \imagecreatefromstring($imageData);

            if (!$image) {
                return $file->store($tenantPath, static::disk());
            }

            $width  = \imagesx($image);
            $height = \imagesy($image);

            if ($width <= $maxDimension && $height <= $maxDimension) {
                // Small enough — no resizing needed
                \imagedestroy($image);
                return $file->store($tenantPath, static::disk());
            }

            // Calculate new dimensions preserving aspect ratio
            if ($width > $height) {
                $newWidth  = $maxDimension;
                $newHeight = (int) round($maxDimension / ($width / $height));
            } else {
                $newHeight = $maxDimension;
                $newWidth  = (int) round($maxDimension / ($height / $width));
            }

            $thumb = \imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency for PNG/WEBP
            \imagecolortransparent($thumb, \imagecolorallocatealpha($thumb, 0, 0, 0, 127));
            \imagealphablending($thumb, false);
            \imagesavealpha($thumb, true);

            \imagecopyresampled($thumb, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            // Capture JPEG output
            ob_start();
            \imagejpeg($thumb, null, 82); // 82% quality — good balance size/fidelity
            $thumbData = ob_get_clean();

            // Store with unique filename
            $filename = 'thumb_' . $file->hashName() . '.jpg';
            $path     = $tenantPath . '/' . $filename;

            static::put($path, $thumbData);

            \imagedestroy($image);
            \imagedestroy($thumb);

            return $path;

        } catch (\Throwable $e) {
            Log::warning("StorageService: GD optimization failed — falling back to raw store", [
                'error' => $e->getMessage(),
                'file'  => $file->getClientOriginalName(),
            ]);
            return $file->store($tenantPath, static::disk());
        }
    }

    /**
     * Get the public URL for a stored path.
     *
     * @param  string|null  $path  The stored path from DB
     * @return string|null
     */
    public static function url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return Storage::disk(static::disk())->url($path);
    }

    /**
     * Delete a file.
     *
     * @param  string|null  $path
     * @return bool
     */
    public static function delete(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        return Storage::disk(static::disk())->delete($path);
    }

    /**
     * Check if a file exists.
     */
    public static function exists(string $path): bool
    {
        return Storage::disk(static::disk())->exists($path);
    }

    /**
     * Build the tenant-scoped directory path.
     * In multi-tenant mode: tenants/{id}/products/
     * In single-tenant mode: products/
     */
    private static function tenantPath(string $context): string
    {
        if (app()->bound('current.tenant')) {
            $tenantId = app('current.tenant')->id;
            return "tenants/{$tenantId}/{$context}";
        }

        // Fallback for local dev or single-tenant AMD Outlets deployment
        return $context;
    }
}
