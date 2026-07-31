<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * PriceTagSheetService — builds a print-ready PDF of shelf-edge price tags.
 *
 * Each tag in the sheet corresponds to one product item in the input batch
 * (product name, price, optional was_price, optional SKU/barcode, optional badge).
 *
 * Supports thermal roll single-label presets and A4/Letter multi-label grid sheets.
 */
class PriceTagSheetService
{
    /**
     * PRESETS for shelf-edge price tags.
     * label_w / label_h — physical label size in mm
     * page              — 'label' (page == one label, thermal roll) or a dompdf paper string
     * cols / rows       — grid for sheet presets (ignored for thermal)
     * margin_*          — sheet margins in mm (ignored for thermal)
     */
    public const PRESETS = [
        // ── Thermal roll / shelf-edge direct printers ──────────────────
        'thermal-40x30' => ['label' => '40 × 30 mm (Shelf Tag)',  'group' => 'Thermal roll', 'label_w' => 40,  'label_h' => 30,  'page' => 'label'],
        'thermal-50x25' => ['label' => '50 × 25 mm (2" × 1")',   'group' => 'Thermal roll', 'label_w' => 50,  'label_h' => 25,  'page' => 'label'],
        'thermal-50x30' => ['label' => '50 × 30 mm (Shelf Tag)',  'group' => 'Thermal roll', 'label_w' => 50,  'label_h' => 30,  'page' => 'label'],
        'thermal-60x40' => ['label' => '60 × 40 mm (Large Shelf)', 'group' => 'Thermal roll', 'label_w' => 60,  'label_h' => 40,  'page' => 'label'],

        // ── A4 / Letter sheets ─────────────────────────────────────────
        'a4-3x8'  => ['label' => 'A4 — 24 per sheet (63.5 × 33.9 mm)', 'group' => 'A4 sheet', 'label_w' => 63.5, 'label_h' => 33.9, 'page' => 'a4', 'cols' => 3, 'rows' => 8,  'margin_top' => 12.7, 'margin_left' => 7.2],
        'a4-3x7'  => ['label' => 'A4 — 21 per sheet (70 × 42.3 mm)',   'group' => 'A4 sheet', 'label_w' => 70,   'label_h' => 42.3, 'page' => 'a4', 'cols' => 3, 'rows' => 7,  'margin_top' => 4.5,  'margin_left' => 0],
        'a4-5x13' => ['label' => 'A4 — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'A4 sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'a4', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
        'letter-3x10' => ['label' => 'Letter — 30 per sheet (66.7 × 25.4 mm)', 'group' => 'Letter sheet', 'label_w' => 66.7, 'label_h' => 25.4, 'page' => 'letter', 'cols' => 3, 'rows' => 10, 'margin_top' => 12.7, 'margin_left' => 4.8],
    ];

    public const MAX_ROWS = 500;
    public const MAX_COPIES = 50;

    public function __construct(private readonly BarcodeService $barcodes)
    {
    }

    public function isValidPreset(string $preset): bool
    {
        return array_key_exists($preset, self::PRESETS);
    }

    public static function presetOptions(): array
    {
        $out = [];
        foreach (self::PRESETS as $key => $p) {
            $out[] = [
                'key'       => $key,
                'label'     => $p['label'],
                'group'     => $p['group'],
                'per_sheet' => isset($p['cols']) ? $p['cols'] * $p['rows'] : 1,
            ];
        }

        return $out;
    }

    /**
     * Parse raw CSV-like text into structured item arrays.
     * Expected columns: name, price, was_price, sku, badge
     */
    public function parseCsv(string $rawText): array
    {
        $lines = explode("\n", str_replace("\r", "", $rawText));
        $items = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $parts = str_getcsv($line);
            if (empty($parts) || trim($parts[0]) === '') {
                continue;
            }

            $name = trim($parts[0]);
            // Header detection: if line looks like header "name,price...", skip it
            if (count($items) === 0 && strtolower($name) === 'name' && isset($parts[1]) && strtolower(trim($parts[1])) === 'price') {
                continue;
            }

            $price = isset($parts[1]) ? trim($parts[1]) : '';
            $wasPrice = isset($parts[2]) && trim($parts[2]) !== '' ? trim($parts[2]) : null;
            $sku = isset($parts[3]) && trim($parts[3]) !== '' ? trim($parts[3]) : null;
            $badge = isset($parts[4]) && trim($parts[4]) !== '' ? trim($parts[4]) : null;

            $items[] = [
                'name'      => $name,
                'price'     => $price,
                'was_price' => $wasPrice,
                'sku'       => $sku,
                'badge'     => $badge,
            ];

            if (count($items) >= self::MAX_ROWS) {
                break;
            }
        }

        return $items;
    }

    /**
     * @param array $items Array of items: [['name' => '...', 'price' => '...', 'was_price' => '...', 'sku' => '...', 'badge' => '...'], ...]
     * @return string raw PDF bytes
     */
    public function build(
        array $items,
        string $preset,
        int $copies = 1,
        string $currencySymbol = '$',
        bool $showBarcode = false,
        string $barcodeFormat = 'code128',
    ): string {
        if (!$this->isValidPreset($preset)) {
            throw new InvalidArgumentException('Unknown label size.');
        }

        if (empty($items)) {
            throw new InvalidArgumentException('At least one product item is required.');
        }

        $copies = max(1, min(self::MAX_COPIES, $copies));
        $config = self::PRESETS[$preset];

        // Prepare each item tag with optional barcode SVG
        $preparedTags = [];
        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            $price = trim($item['price'] ?? '');
            $wasPrice = !empty($item['was_price']) ? trim($item['was_price']) : null;
            $sku = !empty($item['sku']) ? trim($item['sku']) : null;
            $badge = !empty($item['badge']) ? trim($item['badge']) : null;

            $svg = null;
            if ($showBarcode && ($sku !== null || $name !== '')) {
                $barcodeVal = $sku ?? $name;
                // If barcode format validation fails for this specific item, fallback cleanly to code128 or omit SVG
                try {
                    $valToUse = $barcodeVal;
                    if ($this->barcodes->isValidFormat($barcodeFormat)) {
                        $errs = $this->barcodes->validate($barcodeFormat, $valToUse);
                        if (empty($errs)) {
                            $prep = $this->barcodes->prepareValue($barcodeFormat, $valToUse);
                            $rendered = $this->barcodes->render(
                                slug: $barcodeFormat,
                                value: $prep['value'],
                                output: 'svg',
                                widthFactor: 1,
                                height: 30,
                                showValue: true,
                            );
                            $svg = $rendered['bytes'];
                        }
                    }
                } catch (\Throwable $e) {
                    $svg = null;
                }
            }

            $preparedTags[] = [
                'name'      => $name,
                'price'     => $price,
                'was_price' => $wasPrice,
                'sku'       => $sku,
                'badge'     => $badge,
                'svg'       => $svg,
            ];
        }

        // Apply copies multiplier: duplicate the list of tags $copies times
        $allTags = [];
        for ($c = 0; $c < $copies; $c++) {
            foreach ($preparedTags as $tag) {
                $allTags[] = $tag;
            }
        }

        $isThermal = ($config['page'] ?? null) === 'label';

        $paper = $isThermal
            ? [0, 0, $this->mmToPt($config['label_w']), $this->mmToPt($config['label_h'])]
            : $config['page'];

        $pdf = Pdf::loadView('tools.pdf.price-tag-sheet', [
            'tags'           => $allTags,
            'config'         => $config,
            'isThermal'      => $isThermal,
            'currencySymbol' => $currencySymbol,
        ])->setPaper($paper, 'portrait');

        return $pdf->output();
    }

    private function mmToPt(float $mm): float
    {
        return $mm * 2.834645669;
    }
}
