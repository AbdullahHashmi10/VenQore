<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * BarcodeLabelSheetService — builds a print-ready PDF sheet of Avery-style
 * labels, one per DIFFERENT product, each showing a real scannable barcode
 * plus product name and optional price.
 *
 * This is the last "soon" entry from the original tool roadmap. It sits
 * between two already-shipped sibling tools and is deliberately scoped to
 * not duplicate either:
 *   - BarcodeSheetService prints N copies of ONE barcode value.
 *   - PriceTagSheetService prints a batch of different products with prices,
 *     with an OPTIONAL barcode as a secondary decoration.
 *   - THIS service prints a batch of different products where the barcode
 *     is the primary content and price is optional — i.e. a real inventory
 *     labelling sheet (put a scannable code on every SKU), not a shelf-edge
 *     price sign.
 *
 * The preset shape is intentionally identical in spirit to
 * BarcodeSheetService/PriceTagSheetService (thermal-roll vs A4/Letter-grid,
 * mm-based dompdf exact-size rendering) and is DUPLICATED rather than
 * imported, matching the established pattern documented in
 * PriceTagSheetService's docblock: extracting a shared base class now would
 * touch shipped, tested classes for a cosmetic DRY win.
 */
class BarcodeLabelSheetService
{
    public const PRESETS = [
        'thermal-40x20' => ['label' => '40 × 20 mm inventory label',  'group' => 'Thermal roll', 'label_w' => 40, 'label_h' => 20, 'page' => 'label'],
        'thermal-50x25' => ['label' => '50 × 25 mm (2" × 1")',        'group' => 'Thermal roll', 'label_w' => 50, 'label_h' => 25, 'page' => 'label'],
        'thermal-50x30' => ['label' => '50 × 30 mm inventory label',  'group' => 'Thermal roll', 'label_w' => 50, 'label_h' => 30, 'page' => 'label'],

        'a4-3x8'  => ['label' => 'A4 — 24 per sheet (63.5 × 33.9 mm)', 'group' => 'A4 sheet', 'label_w' => 63.5, 'label_h' => 33.9, 'page' => 'a4', 'cols' => 3, 'rows' => 8,  'margin_top' => 12.7, 'margin_left' => 7.2],
        'a4-3x7'  => ['label' => 'A4 — 21 per sheet (70 × 42.3 mm)',   'group' => 'A4 sheet', 'label_w' => 70,   'label_h' => 42.3, 'page' => 'a4', 'cols' => 3, 'rows' => 7,  'margin_top' => 4.5,  'margin_left' => 0],
        'a4-5x13' => ['label' => 'A4 — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'A4 sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'a4', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
        'letter-3x8' => ['label' => 'Letter — 24 per sheet (66.7 × 33.9 mm)', 'group' => 'Letter sheet', 'label_w' => 66.7, 'label_h' => 33.9, 'page' => 'letter', 'cols' => 3, 'rows' => 8, 'margin_top' => 12.7, 'margin_left' => 4.8],
        'letter-5x13' => ['label' => 'Letter — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'Letter sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'letter', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
    ];

    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    public const MAX_ROWS = 200;
    public const MAX_COPIES = 20;

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
     * @param array $rows list of ['name','value','format'=>?,'price'=>?]
     * @param array $options ['currency'=>'USD','copies'=>int]
     * @return string raw PDF bytes
     * @throws InvalidArgumentException
     */
    public function build(string $preset, array $rows, array $options = []): string
    {
        if (!$this->isValidPreset($preset)) {
            throw new InvalidArgumentException('Unknown label size.');
        }
        if (empty($rows)) {
            throw new InvalidArgumentException('Add at least one product row.');
        }

        $rows = array_slice($rows, 0, self::MAX_ROWS);
        $config = self::PRESETS[$preset];

        $currency = $options['currency'] ?? null;
        $symbol = $currency ? (self::CURRENCIES[$currency] ?? $currency) : null;
        $copies = max(1, min(self::MAX_COPIES, (int) ($options['copies'] ?? 1)));

        $labels = [];
        foreach ($rows as $row) {
            $name = trim((string) ($row['name'] ?? ''));
            $value = trim((string) ($row['value'] ?? ''));
            if ($name === '' || $value === '') {
                throw new InvalidArgumentException('Every row needs a product name and a barcode value.');
            }

            $format = $row['format'] ?? 'code128';
            if (!array_key_exists($format, BarcodeService::FORMATS)) {
                $format = 'code128';
            }

            $errors = $this->barcodes->validate($format, $value);
            $encodeValue = $value;
            if (empty($errors)) {
                $prepared = $this->barcodes->prepareValue($format, $value);
                $encodeValue = $prepared['value'];
            }

            $svg = null;
            try {
                $rendered = $this->barcodes->render(
                    slug: $format,
                    value: $encodeValue,
                    output: 'svg',
                    widthFactor: 1,
                    height: 28,
                    showValue: true,
                );
                $svg = $rendered['bytes'];
            } catch (\Throwable $e) {
                // A row with an unencodable value shouldn't kill the whole
                // sheet — fail soft, same philosophy as PriceTagSheetService.
                $svg = null;
            }

            $price = isset($row['price']) && $row['price'] !== '' && $row['price'] !== null
                ? (float) $row['price']
                : null;

            $labels[] = [
                'name'  => $name,
                'value' => $encodeValue,
                'price' => $price,
                'svg'   => $svg,
            ];
        }

        $allLabels = [];
        for ($c = 0; $c < $copies; $c++) {
            array_push($allLabels, ...$labels);
        }

        $isThermal = ($config['page'] ?? null) === 'label';
        $paper = $isThermal
            ? [0, 0, $this->mmToPt($config['label_w']), $this->mmToPt($config['label_h'])]
            : $config['page'];

        $pdf = Pdf::loadView('tools.pdf.barcode-label-sheet', [
            'labels'    => $allLabels,
            'symbol'    => $symbol,
            'config'    => $config,
            'isThermal' => $isThermal,
        ])->setPaper($paper, 'portrait');

        return $pdf->output();
    }

    /**
     * Parse bulk-paste CSV-like text into row arrays.
     * Accepted line shape: name,value[,format[,price]]
     */
    public function parseBulkText(string $text): array
    {
        $rows = [];
        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $cols = str_getcsv($line);
            $name = trim($cols[0] ?? '');
            $value = trim($cols[1] ?? '');
            if ($name === '' || $value === '') {
                continue;
            }

            $format = trim($cols[2] ?? '') ?: 'code128';
            if (!array_key_exists($format, BarcodeService::FORMATS)) {
                $format = 'code128';
            }
            $priceRaw = trim($cols[3] ?? '');
            $price = $priceRaw !== '' ? (float) $priceRaw : null;

            $rows[] = ['name' => $name, 'value' => $value, 'format' => $format, 'price' => $price];

            if (count($rows) >= self::MAX_ROWS) {
                break;
            }
        }

        if (empty($rows)) {
            throw new InvalidArgumentException('Could not find any valid rows in the pasted text. Expected format: name,value');
        }

        return $rows;
    }

    private function mmToPt(float $mm): float
    {
        return $mm * 2.834645669;
    }
}
