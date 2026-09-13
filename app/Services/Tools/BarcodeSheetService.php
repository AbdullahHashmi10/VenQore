<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * BarcodeSheetService — builds a print-ready PDF of repeated barcode labels.
 *
 * Two families of preset:
 *  - THERMAL: single-label-per-page rolls (Zebra/TSC/Godex style). Page size
 *    IS the label size, so the printer feeds one label per "page". This is
 *    what most small retailers actually use.
 *  - SHEET: A4/Letter sheets with a grid of labels (Avery-compatible).
 *
 * Everything is expressed in millimetres and rendered through dompdf at
 * exact physical dimensions — no browser scaling. Misaligned label sheets
 * waste the user's label stock, which is worse than not offering the
 * feature at all, so the presets below use published stock dimensions and
 * MUST be print-tested on real media before launch (plan §7 T2).
 *
 * Barcodes are embedded as SVG so no image extension (GD/Imagick) is
 * required — dompdf renders inline SVG natively. That keeps print sheets
 * working on servers where PNG output isn't available.
 */
class BarcodeSheetService
{
    /**
     * label_w / label_h  — physical label size in mm
     * page               — 'label' (page == one label, thermal roll) or a dompdf paper string
     * cols / rows        — grid for sheet presets (ignored for thermal)
     * margin_*           — sheet margins in mm (ignored for thermal)
     */
    public const PRESETS = [
        // ── Thermal roll / direct label printers ───────────────────────
        'thermal-50x25' => ['label' => '50 × 25 mm (2" × 1")',   'group' => 'Thermal roll', 'label_w' => 50,  'label_h' => 25,  'page' => 'label'],
        'thermal-50x50' => ['label' => '50 × 50 mm (2" × 2")',   'group' => 'Thermal roll', 'label_w' => 50,  'label_h' => 50,  'page' => 'label'],
        'thermal-75x50' => ['label' => '75 × 50 mm (3" × 2")',   'group' => 'Thermal roll', 'label_w' => 75,  'label_h' => 50,  'page' => 'label'],
        'thermal-100x50' => ['label' => '100 × 50 mm (4" × 2")', 'group' => 'Thermal roll', 'label_w' => 100, 'label_h' => 50,  'page' => 'label'],
        'thermal-100x150' => ['label' => '100 × 150 mm (4" × 6")', 'group' => 'Thermal roll', 'label_w' => 100, 'label_h' => 150, 'page' => 'label'],
        'thermal-38x25' => ['label' => '38 × 25 mm (1.5" × 1")', 'group' => 'Thermal roll', 'label_w' => 38,  'label_h' => 25,  'page' => 'label'],

        // ── A4 / Letter sheets ─────────────────────────────────────────
        'a4-3x8'  => ['label' => 'A4 — 24 per sheet (63.5 × 33.9 mm)', 'group' => 'A4 sheet', 'label_w' => 63.5, 'label_h' => 33.9, 'page' => 'a4', 'cols' => 3, 'rows' => 8,  'margin_top' => 12.7, 'margin_left' => 7.2],
        'a4-3x7'  => ['label' => 'A4 — 21 per sheet (70 × 42.3 mm)',   'group' => 'A4 sheet', 'label_w' => 70,   'label_h' => 42.3, 'page' => 'a4', 'cols' => 3, 'rows' => 7,  'margin_top' => 4.5,  'margin_left' => 0],
        'a4-5x13' => ['label' => 'A4 — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'A4 sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'a4', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
        'letter-3x10' => ['label' => 'Letter — 30 per sheet (66.7 × 25.4 mm)', 'group' => 'Letter sheet', 'label_w' => 66.7, 'label_h' => 25.4, 'page' => 'letter', 'cols' => 3, 'rows' => 10, 'margin_top' => 12.7, 'margin_left' => 4.8],
    ];

    /** Hard cap so one request can't generate a 10,000-page PDF. */
    public const MAX_QUANTITY = 1000;

    public function __construct(private readonly BarcodeService $barcodes)
    {
    }

    public function isValidPreset(string $preset): bool
    {
        return array_key_exists($preset, self::PRESETS);
    }

    /** Presets grouped for the UI dropdown. */
    public static function presetOptions(): array
    {
        $out = [];
        foreach (self::PRESETS as $key => $p) {
            $out[] = [
                'key'   => $key,
                'label' => $p['label'],
                'group' => $p['group'],
                'per_sheet' => isset($p['cols']) ? $p['cols'] * $p['rows'] : 1,
            ];
        }

        return $out;
    }

    /**
     * @return string raw PDF bytes
     * @throws InvalidArgumentException
     */
    public function build(
        string $formatSlug,
        string $value,
        string $preset,
        int $quantity,
        bool $showValue = true,
        ?string $caption = null,
    ): string {
        if (!$this->isValidPreset($preset)) {
            throw new InvalidArgumentException('Unknown label size.');
        }

        $quantity = max(1, min(self::MAX_QUANTITY, $quantity));
        $config = self::PRESETS[$preset];

        $errors = $this->barcodes->validate($formatSlug, $value);
        if (!empty($errors)) {
            throw new InvalidArgumentException($errors[0]);
        }

        $prepared = $this->barcodes->prepareValue($formatSlug, $value);

        // Always SVG for embedding — dompdf renders inline SVG and this
        // avoids any GD/Imagick dependency for print output.
        $rendered = $this->barcodes->render(
            slug: $formatSlug,
            value: $prepared['value'],
            output: 'svg',
            widthFactor: 2,
            height: 60,
            showValue: $showValue,
            caption: $caption,
        );

        $isThermal = ($config['page'] ?? null) === 'label';

        $paper = $isThermal
            ? [0, 0, $this->mmToPt($config['label_w']), $this->mmToPt($config['label_h'])]
            : $config['page'];

        $pdf = Pdf::loadView('tools.pdf.barcode-sheet', [
            'svg'       => $rendered['bytes'],
            'value'     => $prepared['value'],
            'caption'   => $caption,
            'quantity'  => $quantity,
            'config'    => $config,
            'isThermal' => $isThermal,
        ])->setPaper($paper, 'portrait');

        return $pdf->output();
    }

    private function mmToPt(float $mm): float
    {
        return $mm * 2.834645669;
    }
}
