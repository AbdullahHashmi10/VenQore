<?php

namespace App\Services\Tools;

use InvalidArgumentException;

/**
 * QrMenuService — Service layer for QR Menu Generator & Table Cards.
 */
class QrMenuService
{
    public const PRESETS = [
        'tent_4x6' => [
            'name' => 'Table Tent (4" x 6")',
            'width_mm' => 101.6,
            'height_mm' => 152.4,
            'aspect' => 'portrait',
        ],
        'standee_5x7' => [
            'name' => 'Table Standee (5" x 7")',
            'width_mm' => 127.0,
            'height_mm' => 177.8,
            'aspect' => 'portrait',
        ],
        'sticker_3x3' => [
            'name' => 'Table Sticker (3" x 3")',
            'width_mm' => 76.2,
            'height_mm' => 76.2,
            'aspect' => 'square',
        ],
    ];

    public const THEMES = [
        'classic_dark' => [
            'name' => 'Classic Dark',
            'bg_color' => '#1e293b',
            'card_bg' => '#0f172a',
            'text_color' => '#ffffff',
            'accent_color' => '#f59e0b',
            'qr_fg' => '#000000',
            'qr_bg' => '#ffffff',
        ],
        'modern_light' => [
            'name' => 'Modern Light',
            'bg_color' => '#f8fafc',
            'card_bg' => '#ffffff',
            'text_color' => '#0f172a',
            'accent_color' => '#2563eb',
            'qr_fg' => '#0f172a',
            'qr_bg' => '#ffffff',
        ],
        'warm_amber' => [
            'name' => 'Warm Amber / Café',
            'bg_color' => '#fffbeb',
            'card_bg' => '#fef3c7',
            'text_color' => '#78350f',
            'accent_color' => '#d97706',
            'qr_fg' => '#451a03',
            'qr_bg' => '#ffffff',
        ],
        'emerald_bistro' => [
            'name' => 'Emerald Bistro',
            'bg_color' => '#ecfdf5',
            'card_bg' => '#064e3b',
            'text_color' => '#ffffff',
            'accent_color' => '#10b981',
            'qr_fg' => '#064e3b',
            'qr_bg' => '#ffffff',
        ],
    ];

    public function __construct(
        private readonly QrCodeService $qrCodeService,
    ) {
    }

    /**
     * Generate QR code image (PNG base64 or SVG) for the menu URL/payload.
     *
     * @param array<string, mixed> $options
     * @return array{bytes: string, format: string, logo_applied: bool}
     */
    public function generateQrCode(
        string $payload,
        string $format = 'png',
        int $size = 400,
        string $foreground = '#000000',
        string $background = '#FFFFFF',
        ?string $logoBase64 = null
    ): array {
        if (trim($payload) === '') {
            throw new InvalidArgumentException('Menu URL or payload cannot be empty.');
        }

        return $this->qrCodeService->render(
            payload: $payload,
            output: $format,
            size: $size,
            margin: 16,
            errorCorrection: 'H',
            foreground: $foreground,
            background: $background,
            logoBase64: $logoBase64
        );
    }
}
