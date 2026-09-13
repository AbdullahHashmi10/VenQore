<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ListingImageService
{
    /**
     * Process seller image to meet Amazon 2000x2000 RGB(255,255,255) 85% fill requirement using GD canvas.
     */
    public function processForAmazon(string $originalPath): string
    {
        if (!function_exists('imagecreatetruecolor')) {
            throw new RuntimeException('GD extension is required for Amazon listing image compliance processing.');
        }

        $outputPath = 'listing_images/processed_' . Str::random(12) . '.jpg';
        $fullOriginalPath = Storage::disk('local')->path($originalPath);

        $targetWidth  = 2000;
        $targetHeight = 2000;
        $targetFillRatio = 0.85;

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        $white  = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);

        $src = null;
        if (file_exists($fullOriginalPath)) {
            $info = @getimagesize($fullOriginalPath);
            if ($info) {
                switch ($info[2]) {
                    case IMAGETYPE_JPEG:
                        $src = @imagecreatefromjpeg($fullOriginalPath);
                        break;
                    case IMAGETYPE_PNG:
                        $src = @imagecreatefrompng($fullOriginalPath);
                        break;
                }
            }
        }

        if ($src) {
            $srcW = imagesx($src);
            $srcH = imagesy($src);

            $maxBoundingDim = (int) ($targetWidth * $targetFillRatio);
            $ratio = min($maxBoundingDim / $srcW, $maxBoundingDim / $srcH);

            $dstW = (int) ($srcW * $ratio);
            $dstH = (int) ($srcH * $ratio);

            $dstX = (int) (($targetWidth - $dstW) / 2);
            $dstY = (int) (($targetHeight - $dstH) / 2);

            imagecopyresampled($canvas, $src, $dstX, $dstY, 0, 0, $dstW, $dstH, $srcW, $srcH);
            imagedestroy($src);
        }

        // Export to output stream
        ob_start();
        imagejpeg($canvas, null, 90);
        $imageBinary = ob_get_clean();
        imagedestroy($canvas);

        if (empty($imageBinary)) {
            throw new RuntimeException('Failed to generate Amazon compliant JPEG canvas.');
        }

        Storage::disk('local')->put($outputPath, $imageBinary);

        return $outputPath;
    }
}
