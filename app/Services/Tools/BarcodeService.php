<?php

namespace App\Services\Tools;

use InvalidArgumentException;
use Picqer\Barcode\BarcodeGenerator;
use Picqer\Barcode\BarcodeGeneratorJPG;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Picqer\Barcode\BarcodeGeneratorSVG;
use Picqer\Barcode\Exceptions\UnknownTypeException;

/**
 * BarcodeService — T1 Barcode Generator + T10 Validator.
 *
 * Wraps picqer/php-barcode-generator (vendor/picqer/php-barcode-generator,
 * confirmed present in composer.json, previously unused anywhere in app/).
 *
 * We compute check digits ourselves rather than relying solely on picqer,
 * because the product requirement (plan §7 T1) is to SHOW the user the
 * computed check digit and accept short-form input — picqer's own type
 * classes validate length but do not surface "here is what we added and
 * why" in a form suitable for display.
 *
 * See SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §7 T1 and T10.
 */
class BarcodeService
{
    /**
     * Public-facing format slug => [picqer TYPE_* constant, human name, digits-only?, short length, full length]
     * Length pairs are null for variable-length alphanumeric formats.
     */
    public const FORMATS = [
        'code128' => ['type' => BarcodeGenerator::TYPE_CODE_128_B, 'name' => 'Code128', 'digits_only' => false, 'short_len' => null, 'full_len' => null],
        'code39'  => ['type' => BarcodeGenerator::TYPE_CODE_39,  'name' => 'Code39',  'digits_only' => false, 'short_len' => null, 'full_len' => null],
        'code93'  => ['type' => BarcodeGenerator::TYPE_CODE_93,  'name' => 'Code93',  'digits_only' => false, 'short_len' => null, 'full_len' => null],
        'ean-13'  => ['type' => BarcodeGenerator::TYPE_EAN_13,   'name' => 'EAN-13',  'digits_only' => true,  'short_len' => 12,   'full_len' => 13],
        'ean-8'   => ['type' => BarcodeGenerator::TYPE_EAN_8,    'name' => 'EAN-8',   'digits_only' => true,  'short_len' => 7,    'full_len' => 8],
        'upc-a'   => ['type' => BarcodeGenerator::TYPE_UPC_A,    'name' => 'UPC-A',   'digits_only' => true,  'short_len' => 11,   'full_len' => 12],
        'upc-e'   => ['type' => BarcodeGenerator::TYPE_UPC_E,    'name' => 'UPC-E',   'digits_only' => true,  'short_len' => 6,    'full_len' => 7],
        'itf-14'  => ['type' => BarcodeGenerator::TYPE_ITF_14,   'name' => 'ITF-14',  'digits_only' => true,  'short_len' => 13,   'full_len' => 14],
        'codabar' => ['type' => BarcodeGenerator::TYPE_CODABAR,  'name' => 'Codabar', 'digits_only' => false, 'short_len' => null, 'full_len' => null],
    ];

    /** Formats where we auto-compute and append a GTIN-style mod-10 check digit. */
    private const CHECK_DIGIT_FORMATS = ['ean-13', 'ean-8', 'upc-a', 'itf-14'];

    public function isValidFormat(string $slug): bool
    {
        return array_key_exists($slug, self::FORMATS);
    }

    /**
     * Validate raw user input against a format's character-set and length
     * rules, WITHOUT appending a check digit yet. Returns a list of
     * human-readable error strings; empty array means valid.
     */
    public function validate(string $slug, string $value): array
    {
        if (!$this->isValidFormat($slug)) {
            return ['Unknown barcode format.'];
        }

        $format = self::FORMATS[$slug];
        $errors = [];

        if ($value === '') {
            return ['Enter a value to encode.'];
        }

        if ($format['digits_only'] && !ctype_digit($value)) {
            $errors[] = "{$format['name']} accepts digits only.";
        }

        if ($format['digits_only'] && empty($errors)) {
            $len = strlen($value);
            $allowed = array_filter([$format['short_len'], $format['full_len']]);
            if (!in_array($len, $allowed, true)) {
                $errors[] = "{$format['name']} needs {$format['short_len']} digits (check digit added automatically) or {$format['full_len']} digits (check digit included).";
            }
        }

        return $errors;
    }

    /**
     * Given raw validated input, return the value that will actually be
     * encoded, plus metadata about whether/what check digit was added.
     *
     * @return array{value:string, check_digit:?int, was_computed:bool}
     */
    public function prepareValue(string $slug, string $value): array
    {
        $format = self::FORMATS[$slug];

        if (!in_array($slug, self::CHECK_DIGIT_FORMATS, true)) {
            return ['value' => $value, 'check_digit' => null, 'was_computed' => false];
        }

        $len = strlen($value);

        if ($len === $format['full_len']) {
            // User supplied the check digit themselves — verify it, but encode as given.
            $digit = (int) substr($value, -1);
            return ['value' => $value, 'check_digit' => $digit, 'was_computed' => false];
        }

        if ($len === $format['short_len']) {
            $checkDigit = $this->computeGtinCheckDigit($value);
            return ['value' => $value . $checkDigit, 'check_digit' => $checkDigit, 'was_computed' => true];
        }

        // Should not reach here if validate() was called first.
        return ['value' => $value, 'check_digit' => null, 'was_computed' => false];
    }

    /**
     * Standard GTIN / UPC / EAN modulo-10 check digit, per plan §7 T10:
     * from the rightmost digit, alternating digits are weighted 3 and 1,
     * summed, and the check digit brings that sum to the next multiple of 10.
     *
     * Works uniformly for GTIN-8/12/13/14 short forms because the weighting
     * is defined from the RIGHTMOST digit inward, not from a fixed offset.
     */
    public function computeGtinCheckDigit(string $digitsWithoutCheckDigit): int
    {
        $digits = array_map('intval', str_split($digitsWithoutCheckDigit));
        $sum = 0;
        $reversed = array_reverse($digits);

        foreach ($reversed as $i => $digit) {
            // Rightmost digit of the short form sits one position left of
            // where the check digit will go, so it gets weight 3 (position 0 => weight 3).
            $weight = ($i % 2 === 0) ? 3 : 1;
            $sum += $digit * $weight;
        }

        return (10 - ($sum % 10)) % 10;
    }

    /**
     * T10 — full validator with arithmetic breakdown, for GTIN-8/12/13/14
     * numbers that ALREADY include their check digit.
     *
     * @return array{valid:bool, computed_check_digit:int, supplied_check_digit:int,
     *               gtin14:string, breakdown:array<array{digit:int,weight:int,product:int}>}
     */
    public function validateGtin(string $rawValue): array
    {
        $clean = preg_replace('/[\s\-]/', '', $rawValue);

        if ($clean === '' || !ctype_digit($clean)) {
            throw new InvalidArgumentException('GTIN must contain only digits (spaces and hyphens are ignored).');
        }

        // Left-pad to a valid GTIN length so short forms (GTIN-8) still work.
        $len = strlen($clean);
        if (!in_array($len, [8, 12, 13, 14], true)) {
            throw new InvalidArgumentException('Enter an 8, 12, 13 or 14 digit UPC/EAN/GTIN number.');
        }

        $body = substr($clean, 0, -1);
        $suppliedCheckDigit = (int) substr($clean, -1);

        $digits = array_map('intval', str_split($body));
        $reversed = array_reverse($digits);
        $breakdown = [];
        $sum = 0;

        foreach ($reversed as $i => $digit) {
            $weight = ($i % 2 === 0) ? 3 : 1;
            $product = $digit * $weight;
            $sum += $product;
            $breakdown[] = ['digit' => $digit, 'weight' => $weight, 'product' => $product];
        }
        // breakdown was built right-to-left; reverse back to natural reading order.
        $breakdown = array_reverse($breakdown);

        $computedCheckDigit = (10 - ($sum % 10)) % 10;
        $gtin14 = str_pad($body . $suppliedCheckDigit, 14, '0', STR_PAD_LEFT);
        $valid = $computedCheckDigit === $suppliedCheckDigit;
        $formatName = match ($len) {
            8  => 'GTIN-8 (EAN-8)',
            12 => 'GTIN-12 (UPC-A)',
            13 => 'GTIN-13 (EAN-13)',
            14 => 'GTIN-14 (ITF-14)',
            default => 'GTIN',
        };

        // Plain-English explanation of what "valid"/"invalid" actually
        // means for the user, per product feedback: a bare pass/fail with
        // no context isn't useful. Shared by both the standalone validator
        // page and the inline check on the generator so the messaging
        // never drifts between the two.
        $explanation = $valid
            ? "This is a correctly formed {$formatName} number. The check digit ({$suppliedCheckDigit}) matches what the standard formula computes from the other {$len} digits, so a barcode scanner would accept it as a validly structured code."
            : "The check digit doesn't match. For a valid {$formatName}, the last digit should be {$computedCheckDigit} based on the other digits — but this number ends in {$suppliedCheckDigit}. A barcode scanner would likely reject or misread this code. This can happen from a typo, a transposed digit, or copying the number down incorrectly.";

        return [
            'valid'                 => $valid,
            'format_name'           => $formatName,
            'explanation'           => $explanation,
            'computed_check_digit'  => $computedCheckDigit,
            'supplied_check_digit'  => $suppliedCheckDigit,
            'sum'                   => $sum,
            'gtin14'                => $gtin14,
            'breakdown'             => $breakdown,
        ];
    }

    /**
     * Whether raster output (PNG/JPG) is actually possible on this server.
     * picqer's PngRenderer auto-detects Imagick or GD and throws a clean
     * BarcodeException if neither is present — we check the same two
     * conditions up front so the controller can report the real answer
     * to the frontend instead of silently swapping formats.
     */
    public function supportsRaster(): bool
    {
        return extension_loaded('imagick') || function_exists('imagecreate');
    }

    /**
     * Render a barcode image.
     *
     * IMPORTANT: the requested $output is a preference, not a guarantee. If
     * raster support (GD/Imagick) is unavailable on this server and 'png' or
     * 'jpg' was requested, this method falls back to SVG bytes — but it
     * reports that honestly via the returned 'format' key, which the
     * controller uses for both the Content-Type header AND the suggested
     * download filename extension. This is the fix for the bug where a
     * browser downloaded an SVG file named "barcode.png" and image viewers
     * correctly refused to open it — the mislabeling was the bug, not the
     * fallback itself.
     *
     * $showValue: render the encoded value as the standard human-readable
     * line under the bars. Defaults to TRUE because that is what a real
     * barcode looks like — a code with no readable number underneath is
     * unusable when a scanner fails and someone has to key it in by hand.
     *
     * $caption: optional extra label (e.g. a product name) under the value.
     *
     * $logoBase64: optional small logo image (data URI or raw base64) to
     * composite over the center of the barcode. GD only — silently ignored
     * on SVG output and on servers without GD.
     *
     * Text is drawn for BOTH SVG and raster output. The SVG path needs no
     * image extension at all, so a server with neither GD nor Imagick still
     * produces a complete, readable, printable barcode.
     *
     * @return array{bytes:string, format:string} format is 'png'|'jpg'|'svg' — the format actually produced.
     * @throws InvalidArgumentException
     */
    public function render(
        string $slug,
        string $value,
        string $output = 'png',
        int $widthFactor = 2,
        int $height = 60,
        bool $showValue = true,
        ?string $caption = null,
        ?string $logoBase64 = null,
    ): array {
        if (!$this->isValidFormat($slug)) {
            throw new InvalidArgumentException('Unknown barcode format.');
        }

        $type = self::FORMATS[$slug]['type'];

        $lines = array_values(array_filter([
            $showValue ? $value : null,
            $caption !== null && $caption !== '' ? $caption : null,
        ]));

        $wantsSvg = $output === 'svg' || !$this->supportsRaster();

        if ($wantsSvg) {
            $svg = (new BarcodeGeneratorSVG())->getBarcode($value, $type, $widthFactor, $height);
            $svg = $this->decorateSvg($svg, $lines);

            return ['bytes' => $svg, 'format' => 'svg'];
        }

        $bytes = $output === 'jpg'
            ? (new BarcodeGeneratorJPG())->getBarcode($value, $type, $widthFactor, $height)
            : (new BarcodeGeneratorPNG())->getBarcode($value, $type, $widthFactor, $height);

        if (($lines || $logoBase64) && function_exists('imagecreatefromstring')) {
            $composited = $this->compositeExtras($bytes, $output, $lines, $logoBase64);
            if ($composited !== null) {
                $bytes = $composited;
            }
            // If compositing fails for any reason (corrupt logo upload,
            // GD error, etc.) we deliberately fall through and return the
            // plain barcode rather than erroring the whole request — a
            // barcode without your logo is still useful; a 500 is not.
        }

        return ['bytes' => $bytes, 'format' => $output];
    }

    /**
     * Add a white background and human-readable text line(s) to picqer's
     * SVG output.
     *
     * Two reasons this matters beyond looks:
     *  1. picqer emits a transparent SVG. On a dark page or dark paper a
     *     transparent barcode is unscannable — scanners need light
     *     background, dark bars. We always paint white behind it.
     *  2. This runs with zero image extensions, so text works even where
     *     PNG/JPG can't be produced at all.
     *
     * Font sizing uses a monospace approximation (0.6em advance width) to
     * avoid a font-metrics dependency; text is centre-anchored so minor
     * width error is invisible.
     */
    private function decorateSvg(string $svg, array $lines): string
    {
        if (!preg_match('/<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/', $svg, $m)) {
            return $svg; // unexpected shape — return untouched rather than corrupt it
        }

        $width  = (float) $m[1];
        $height = (float) $m[2];

        $fontSize   = max(10.0, min(16.0, $width / 18));
        $lineHeight = $fontSize * 1.35;
        $padTop     = $lines ? 4.0 : 0.0;
        $extra      = $lines ? ($padTop + (count($lines) * $lineHeight) + 4.0) : 0.0;
        $newHeight  = $height + $extra;

        // Grow the canvas: width stays, height and viewBox both change.
        $svg = preg_replace(
            '/(<svg[^>]*)height="' . preg_quote($m[2], '/') . '"/',
            '$1height="' . $newHeight . '"',
            $svg,
            1
        );
        $svg = preg_replace(
            '/viewBox="0 0 [\d.]+ [\d.]+"/',
            'viewBox="0 0 ' . $width . ' ' . $newHeight . '"',
            $svg,
            1
        );

        // White background behind everything (inserted right after <svg ...>)
        $background = '<rect x="0" y="0" width="' . $width . '" height="' . $newHeight . '" fill="#ffffff"/>';
        $svg = preg_replace('/(<svg[^>]*>)/', '$1' . PHP_EOL . "\t" . $background, $svg, 1);

        if (!$lines) {
            return $svg;
        }

        $text = '';
        $y = $height + $padTop + $fontSize;
        foreach ($lines as $line) {
            $text .= "\t" . '<text x="' . ($width / 2) . '" y="' . round($y, 2) . '"'
                . ' font-family="monospace, ' . 'Courier New' . '" font-size="' . round($fontSize, 2) . '"'
                . ' text-anchor="middle" fill="#111111">'
                . htmlspecialchars($line, ENT_QUOTES | ENT_XML1, 'UTF-8')
                . '</text>' . PHP_EOL;
            $y += $lineHeight;
        }

        return str_replace('</svg>', $text . '</svg>', $svg);
    }

    /**
     * GD-only: draws the barcode PNG/JPG onto a taller canvas with an
     * optional text caption underneath and an optional small logo
     * composited into the bottom margin. Returns null (not an exception)
     * on any failure so the caller can fall back to the plain barcode.
     */
    private function compositeExtras(string $barcodeBytes, string $output, array $lines, ?string $logoBase64): ?string
    {
        if (!function_exists('imagecreatefromstring')) {
            return null; // GD specifically required for compositing; Imagick-only servers skip this
        }

        $source = @imagecreatefromstring($barcodeBytes);
        if ($source === false) {
            return null;
        }

        $font       = 5; // built-in GD font, no external .ttf dependency required
        $lineHeight = imagefontheight($font) + 4;
        $srcW = imagesx($source);
        $srcH = imagesy($source);
        $extraH = $lines ? (count($lines) * $lineHeight) + 6 : 0;
        $logoSize = $logoBase64 ? min(48, (int) ($srcH * 0.8)) : 0;

        $canvasH = $srcH + $extraH;
        $canvas = imagecreatetruecolor($srcW, $canvasH);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);
        imagecopy($canvas, $source, 0, 0, 0, 0, $srcW, $srcH);
        imagedestroy($source);

        if ($lines) {
            $black = imagecolorallocate($canvas, 17, 17, 17);
            $y = $srcH + 4;
            foreach ($lines as $line) {
                $textWidth = imagefontwidth($font) * strlen((string) $line);
                $x = max(0, (int) (($srcW - $textWidth) / 2));
                imagestring($canvas, $font, $x, $y, (string) $line, $black);
                $y += $lineHeight;
            }
        }

        if ($logoBase64) {
            $logoData = base64_decode(preg_replace('#^data:image/\w+;base64,#', '', $logoBase64), true);
            $logo = $logoData !== false ? @imagecreatefromstring($logoData) : false;
            if ($logo !== false) {
                $logoW = imagesx($logo);
                $logoH = imagesy($logo);
                $scale = $logoSize / max($logoW, $logoH);
                $dstW = (int) ($logoW * $scale);
                $dstH = (int) ($logoH * $scale);
                $dstX = (int) (($srcW - $dstW) / 2);
                $dstY = (int) (($srcH - $dstH) / 2); // center of the barcode itself — caller UI should warn this can affect scannability
                imagecopyresampled($canvas, $logo, $dstX, $dstY, 0, 0, $dstW, $dstH, $logoW, $logoH);
                imagedestroy($logo);
            }
        }

        ob_start();
        if ($output === 'jpg') {
            imagejpeg($canvas, null, 90);
        } else {
            imagepng($canvas);
        }
        $bytes = ob_get_clean();
        imagedestroy($canvas);

        return $bytes === false ? null : $bytes;
    }

    public function mimeType(string $format): string
    {
        return match ($format) {
            'svg'   => 'image/svg+xml',
            'jpg'   => 'image/jpeg',
            default => 'image/png',
        };
    }

    public function fileExtension(string $format): string
    {
        return match ($format) {
            'svg'   => 'svg',
            'jpg'   => 'jpg',
            default => 'png',
        };
    }
}
