<?php

namespace App\Services\Tools;

use InvalidArgumentException;

/**
 * QrCodeService — QR Code Generator, "Barcodes & Labels" tool group.
 *
 * ============================================================================
 * IMPORTANT — REQUIRES A COMPOSER PACKAGE NOT YET INSTALLED
 * ============================================================================
 * As of writing, composer.json has NO QR code library (confirmed: no
 * endroid/qr-code, simplesoftwareio/simple-qrcode, or bacon/bacon-qr-code
 * present). This class is written AS IF `endroid/qr-code` (the modern,
 * actively-maintained, Builder-pattern library) is installed, because that
 * is the standard choice for Laravel apps needing QR + PNG/SVG + logo
 * overlay + error-correction control in one package.
 *
 * BEFORE THIS TOOL WILL WORK, run locally:
 *
 *     composer require endroid/qr-code
 *
 * Do NOT attempt to `composer require` from an automated/sandboxed agent
 * environment — package resolution must happen against the real local PHP
 * environment (this project pins PHP 8.2 / Laravel 12 per CLAUDE.md), which
 * this sandbox cannot verify or guarantee. Run it locally, then re-test.
 *
 * API surface used below (endroid/qr-code ^5.x, the current major version):
 *   Endroid\QrCode\Builder\Builder::create()
 *       ->writer(new PngWriter() | new SvgWriter())
 *       ->data(string $data)
 *       ->size(int $px)
 *       ->margin(int $px)
 *       ->errorCorrectionLevel(ErrorCorrectionLevel::Low|Medium|Quartile|High)
 *       ->foregroundColor(new Color(r,g,b))
 *       ->backgroundColor(new Color(r,g,b))
 *       ->logoPath(string $path)         // GD-based logo compositing, built into the library
 *       ->logoResizeToWidth(int $px)
 *       ->build();
 *   $result->getString() / $result->getDataUri() / $result->getMimeType()
 *
 * Everything else in this file (payload encoding for URL/text/WiFi/vCard/
 * email/phone, validation, honest format reporting) is our own code and has
 * no dependency on any specific QR library — only render() touches the
 * endroid classes, so if a different package ends up installed, render()
 * is the only method that needs to change.
 * ============================================================================
 */
class QrCodeService
{
    public const TYPES = ['url', 'text', 'wifi', 'vcard', 'email', 'phone'];

    public const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'];

    /** Minimum error-correction level required before we allow a logo overlay. */
    private const MIN_LEVEL_FOR_LOGO = 'H';

    public function isValidType(string $type): bool
    {
        return in_array($type, self::TYPES, true);
    }

    /**
     * Whether raster (PNG) output and logo compositing are actually possible
     * on this server. endroid/qr-code's PngWriter requires GD or Imagick;
     * logo compositing specifically requires GD. We report this honestly
     * rather than silently downgrading — same principle as
     * BarcodeService::supportsRaster().
     */
    public function supportsRaster(): bool
    {
        return extension_loaded('imagick') || function_exists('imagecreate');
    }

    public function supportsLogo(): bool
    {
        return function_exists('imagecreatefromstring');
    }

    /**
     * Build the actual string payload that gets encoded into the QR code,
     * from a structured $type + $fields input. This is pure string
     * formatting — no QR library involved — so it works and is testable
     * independent of whether endroid/qr-code is installed.
     *
     * @param array<string,mixed> $fields
     * @throws InvalidArgumentException
     */
    public function buildPayload(string $type, array $fields): string
    {
        if (!$this->isValidType($type)) {
            throw new InvalidArgumentException('Unknown QR code content type.');
        }

        return match ($type) {
            'url'   => $this->buildUrlPayload($fields),
            'text'  => $this->buildTextPayload($fields),
            'wifi'  => $this->buildWifiPayload($fields),
            'vcard' => $this->buildVCardPayload($fields),
            'email' => $this->buildEmailPayload($fields),
            'phone' => $this->buildPhonePayload($fields),
        };
    }

    private function buildUrlPayload(array $fields): string
    {
        $url = trim((string) ($fields['url'] ?? ''));
        if ($url === '') {
            throw new InvalidArgumentException('Enter a URL to encode.');
        }
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }

        return $url;
    }

    private function buildTextPayload(array $fields): string
    {
        $text = trim((string) ($fields['text'] ?? ''));
        if ($text === '') {
            throw new InvalidArgumentException('Enter some text to encode.');
        }

        return $text;
    }

    /**
     * Standard WIFI: URI format (used by iOS/Android's native "scan to
     * join network" QR handling): WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<pass>;;
     * Special characters \ ; , " : must be backslash-escaped per the spec.
     */
    private function buildWifiPayload(array $fields): string
    {
        $ssid = trim((string) ($fields['ssid'] ?? ''));
        if ($ssid === '') {
            throw new InvalidArgumentException('Enter a network name (SSID).');
        }

        $encryption = strtoupper((string) ($fields['encryption'] ?? 'WPA'));
        if (!in_array($encryption, ['WPA', 'WEP', 'NOPASS'], true)) {
            $encryption = 'WPA';
        }

        $password = (string) ($fields['password'] ?? '');
        if ($encryption !== 'NOPASS' && $password === '') {
            throw new InvalidArgumentException('Enter the network password, or choose "No password".');
        }

        $esc = fn (string $v) => preg_replace('/([\\\\;,":])/', '\\\\$1', $v);
        $type = $encryption === 'NOPASS' ? 'nopass' : $encryption;

        $payload = 'WIFI:T:' . $type . ';S:' . $esc($ssid) . ';';
        if ($encryption !== 'NOPASS') {
            $payload .= 'P:' . $esc($password) . ';';
        }
        $payload .= ';';

        return $payload;
    }

    /**
     * vCard 3.0 text block — the widely-supported version for QR scanning
     * (vCard 4.0 has patchier reader support on stock phone camera apps).
     */
    private function buildVCardPayload(array $fields): string
    {
        $name = trim((string) ($fields['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('Enter a name for the contact card.');
        }

        $phone   = trim((string) ($fields['phone'] ?? ''));
        $email   = trim((string) ($fields['email'] ?? ''));
        $company = trim((string) ($fields['company'] ?? ''));
        $title   = trim((string) ($fields['title'] ?? ''));

        $lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' . $name];

        // N: (structured name) — best-effort split on the last space, since
        // we only collect a single "full name" field in the UI. Not perfect
        // for compound surnames, but FN: is what most scanners display.
        $parts = preg_split('/\s+/', $name, 2);
        $given  = $parts[0] ?? '';
        $family = $parts[1] ?? '';
        $lines[] = 'N:' . $family . ';' . $given . ';;;';

        if ($company !== '') {
            $lines[] = 'ORG:' . $company;
        }
        if ($title !== '') {
            $lines[] = 'TITLE:' . $title;
        }
        if ($phone !== '') {
            $lines[] = 'TEL;TYPE=CELL:' . $phone;
        }
        if ($email !== '') {
            $lines[] = 'EMAIL:' . $email;
        }

        $lines[] = 'END:VCARD';

        return implode("\n", $lines);
    }

    private function buildEmailPayload(array $fields): string
    {
        $address = trim((string) ($fields['address'] ?? ''));
        if ($address === '' || !filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }

        $subject = trim((string) ($fields['subject'] ?? ''));
        $body    = trim((string) ($fields['body'] ?? ''));

        $query = array_filter([
            'subject' => $subject !== '' ? $subject : null,
            'body'    => $body !== '' ? $body : null,
        ]);

        $payload = 'mailto:' . $address;
        if (!empty($query)) {
            $payload .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        }

        return $payload;
    }

    private function buildPhonePayload(array $fields): string
    {
        $number = trim((string) ($fields['number'] ?? ''));
        if ($number === '') {
            throw new InvalidArgumentException('Enter a phone number.');
        }

        // Keep leading + and digits only — tel: URIs should not carry
        // spaces/dashes, though most readers tolerate them; strip for safety.
        $clean = preg_replace('/[^\d+]/', '', $number);

        return 'tel:' . $clean;
    }

    /**
     * Render a QR code image.
     *
     * IMPORTANT (same honesty contract as BarcodeService::render()): the
     * requested $output is a preference. If raster support is unavailable
     * and 'png' was requested, this falls back to SVG and reports that
     * truthfully via the returned 'format' key — never silently mislabel
     * a downloaded file's extension.
     *
     * $logoBase64 requires GD (compositing) and is only honored when
     * $errorCorrection is 'H' (or the caller has otherwise accepted the
     * scannability risk) — callers should default the UI to force High
     * when a logo is attached, but we defensively re-check here too since
     * this is server-side validation, not just a UI nicety.
     *
     * @return array{bytes:string, format:string, logo_applied:bool}
     * @throws InvalidArgumentException
     */
    public function render(
        string $payload,
        string $output = 'png',
        int $size = 400,
        int $margin = 16,
        string $errorCorrection = 'M',
        string $foreground = '#000000',
        string $background = '#FFFFFF',
        ?string $logoBase64 = null,
    ): array {
        if ($payload === '') {
            throw new InvalidArgumentException('Nothing to encode.');
        }
        if (!in_array($errorCorrection, self::ERROR_CORRECTION_LEVELS, true)) {
            $errorCorrection = 'M';
        }

        $wantsSvg = $output === 'svg' || !$this->supportsRaster();
        $wantsLogo = $logoBase64 !== null && $logoBase64 !== ''
            && $this->supportsLogo()
            && $errorCorrection === self::MIN_LEVEL_FOR_LOGO
            && !$wantsSvg; // logo compositing is raster-only

        if (!class_exists(\Endroid\QrCode\Builder\Builder::class)) {
            throw new InvalidArgumentException(
                'The QR code library (endroid/qr-code) is not installed on this server. '
                . 'Run "composer require endroid/qr-code" and try again.'
            );
        }

        [$fgR, $fgG, $fgB] = $this->hexToRgb($foreground);
        [$bgR, $bgG, $bgB] = $this->hexToRgb($background);

        $level = match ($errorCorrection) {
            'L' => \Endroid\QrCode\ErrorCorrectionLevel::Low,
            'Q' => \Endroid\QrCode\ErrorCorrectionLevel::Quartile,
            'H' => \Endroid\QrCode\ErrorCorrectionLevel::High,
            default => \Endroid\QrCode\ErrorCorrectionLevel::Medium,
        };

        $writer = $wantsSvg ? new \Endroid\QrCode\Writer\SvgWriter() : new \Endroid\QrCode\Writer\PngWriter();

        $builder = \Endroid\QrCode\Builder\Builder::create()
            ->writer($writer)
            ->data($payload)
            ->encoding(new \Endroid\QrCode\Encoding\Encoding('UTF-8'))
            ->errorCorrectionLevel($level)
            ->size($size)
            ->margin($margin)
            ->foregroundColor(new \Endroid\QrCode\Color\Color($fgR, $fgG, $fgB))
            ->backgroundColor(new \Endroid\QrCode\Color\Color($bgR, $bgG, $bgB));

        $tmpLogoPath = null;
        if ($wantsLogo) {
            $tmpLogoPath = $this->writeTempLogo($logoBase64);
            if ($tmpLogoPath !== null) {
                $builder = $builder
                    ->logoPath($tmpLogoPath)
                    ->logoResizeToWidth((int) round($size * 0.22));
            }
        }

        try {
            $result = $builder->build();
            $bytes = $result->getString();
        } finally {
            if ($tmpLogoPath !== null && file_exists($tmpLogoPath)) {
                @unlink($tmpLogoPath);
            }
        }

        return [
            'bytes'        => $bytes,
            'format'       => $wantsSvg ? 'svg' : 'png',
            'logo_applied' => $wantsLogo && $tmpLogoPath !== null,
        ];
    }

    /**
     * endroid/qr-code's logoPath() wants a filesystem path, not raw bytes,
     * so we write the uploaded base64 to a short-lived temp file. Caller
     * (render()) is responsible for deleting it after build().
     */
    private function writeTempLogo(string $logoBase64): ?string
    {
        $raw = base64_decode(preg_replace('#^data:image/\w+;base64,#', '', $logoBase64), true);
        if ($raw === false) {
            return null;
        }

        $path = tempnam(sys_get_temp_dir(), 'qr_logo_');
        if ($path === false) {
            return null;
        }

        file_put_contents($path, $raw);

        return $path;
    }

    /** @return array{0:int,1:int,2:int} */
    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }
        if (!preg_match('/^[0-9a-fA-F]{6}$/', $hex)) {
            return [0, 0, 0];
        }

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }

    public function mimeType(string $format): string
    {
        return $format === 'svg' ? 'image/svg+xml' : 'image/png';
    }

    public function fileExtension(string $format): string
    {
        return $format === 'svg' ? 'svg' : 'png';
    }
}
