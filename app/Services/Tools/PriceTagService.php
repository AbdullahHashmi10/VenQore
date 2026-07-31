<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * PriceTagService — builds a print-ready PDF sheet of shelf-edge price tags.
 *
 * Unlike BarcodeSheetService (which repeats ONE barcode N times), this
 * service prints a BATCH of DIFFERENT products — each row the user supplies
 * (name, price, optional was-price, optional SKU/barcode value, optional
 * badge) becomes exactly one tag in the output. A "copies" multiplier can
 * repeat the whole batch (e.g. print the same 40-SKU batch twice for two
 * shelves), but that is a multiplier over the WHOLE list, not per-row.
 *
 * The label-size preset shape (label_w/label_h/page/cols/rows/margin_*) is
 * intentionally identical in spirit to BarcodeSheetService::PRESETS — same
 * thermal-roll vs A4/Letter-grid split, same mm-based dompdf exact-size
 * rendering — but the array is DUPLICATED here rather than imported from
 * BarcodeSheetService. That is deliberate: BarcodeSheetService::PRESETS is
 * a public const already covered by its own tests and consumed by the live
 * Barcode print-sheet UI. Extracting a shared trait/base class now would
 * touch a shipped, tested class for a cosmetic DRY win — the risk of a
 * subtle regression in an existing, working money-path tool outweighs the
 * small duplication cost here. Revisit only if a THIRD sheet-style tool
 * needs the same presets.
 *
 * Barcodes embedded in a tag are always SVG (via BarcodeService::render)
 * for the same reason as BarcodeSheetService: dompdf renders inline SVG
 * natively, so no GD/Imagick dependency is required for print output.
 */
class PriceTagService
{
    /**
     * label_w / label_h — physical tag size in mm
     * page              — 'label' (thermal roll, page == one tag) or a dompdf paper string
     * cols / rows       — grid for sheet presets (ignored for thermal)
     * margin_*          — sheet margins in mm (ignored for thermal)
     */
    public const PRESETS = [
        // ── Thermal roll / direct label printers (shelf tag guns, desktop printers) ──
        'thermal-40x30' => ['label' => '40 × 30 mm shelf tag',   'group' => 'Thermal roll', 'label_w' => 40, 'label_h' => 30, 'page' => 'label'],
        'thermal-50x25' => ['label' => '50 × 25 mm (2" × 1")',   'group' => 'Thermal roll', 'label_w' => 50, 'label_h' => 25, 'page' => 'label'],
        'thermal-50x30' => ['label' => '50 × 30 mm shelf tag',   'group' => 'Thermal roll', 'label_w' => 50, 'label_h' => 30, 'page' => 'label'],
        'thermal-60x40' => ['label' => '60 × 40 mm shelf tag',   'group' => 'Thermal roll', 'label_w' => 60, 'label_h' => 40, 'page' => 'label'],

        // ── A4 / Letter sheets (Avery-compatible) ─────────────────────
        'a4-3x8'  => ['label' => 'A4 — 24 per sheet (63.5 × 33.9 mm)', 'group' => 'A4 sheet', 'label_w' => 63.5, 'label_h' => 33.9, 'page' => 'a4', 'cols' => 3, 'rows' => 8,  'margin_top' => 12.7, 'margin_left' => 7.2],
        'a4-3x7'  => ['label' => 'A4 — 21 per sheet (70 × 42.3 mm)',   'group' => 'A4 sheet', 'label_w' => 70,   'label_h' => 42.3, 'page' => 'a4', 'cols' => 3, 'rows' => 7,  'margin_top' => 4.5,  'margin_left' => 0],
        'a4-5x13' => ['label' => 'A4 — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'A4 sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'a4', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
        'letter-3x8' => ['label' => 'Letter — 24 per sheet (66.7 × 33.9 mm)', 'group' => 'Letter sheet', 'label_w' => 66.7, 'label_h' => 33.9, 'page' => 'letter', 'cols' => 3, 'rows' => 8, 'margin_top' => 12.7, 'margin_left' => 4.8],
        'letter-3x7' => ['label' => 'Letter — 21 per sheet (70 × 42.3 mm)',   'group' => 'Letter sheet', 'label_w' => 70,   'label_h' => 42.3, 'page' => 'letter', 'cols' => 3, 'rows' => 7, 'margin_top' => 12.7, 'margin_left' => 4.8],
        'letter-5x13' => ['label' => 'Letter — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'Letter sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'letter', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
    ];

    /** Currency symbol map — reuses InvoiceService::CURRENCIES' style/coverage. */
    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    /** Hard cap on distinct product rows per request. */
    public const MAX_ROWS = 200;

    /** Hard cap on whole-batch copies, mirroring BarcodeSheetService's page-count guard. */
    public const MAX_COPIES = 20;

    /** Quick-pick badge labels offered in the UI — kept here so server and client never drift. */
    public const QUICK_BADGES = ['SALE', 'NEW', 'CLEARANCE', 'HOT DEAL'];

    public function __construct(private readonly BarcodeService $barcodes)
    {
    }

    public function isValidPreset(string $preset): bool
    {
        return array_key_exists($preset, self::PRESETS);
    }

    /** Presets grouped for the UI dropdown — same shape as BarcodeSheetService::presetOptions(). */
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
     * @param array $rows list of ['name','price','was_price'=>?,'sku'=>?,'badge'=>?]
     * @param array $options ['currency'=>'USD','show_barcode'=>bool,'copies'=>int]
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

        $currency = $options['currency'] ?? 'USD';
        $symbol = self::CURRENCIES[$currency] ?? $currency;
        $showBarcode = (bool) ($options['show_barcode'] ?? false);
        $copies = max(1, min(self::MAX_COPIES, (int) ($options['copies'] ?? 1)));

        $tags = [];
        foreach ($rows as $row) {
            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                throw new InvalidArgumentException('Every row needs a product name.');
            }

            $price = (float) ($row['price'] ?? 0);
            $wasPrice = isset($row['was_price']) && $row['was_price'] !== '' && $row['was_price'] !== null
                ? (float) $row['was_price']
                : null;
            $sku = trim((string) ($row['sku'] ?? ''));
            $badge = trim((string) ($row['badge'] ?? ''));

            $svg = null;
            if ($showBarcode && $sku !== '') {
                try {
                    $rendered = $this->barcodes->render(
                        slug: 'code128',
                        value: $sku,
                        output: 'svg',
                        widthFactor: 1,
                        height: 30,
                        showValue: false,
                    );
                    $svg = $rendered['bytes'];
                } catch (\Throwable $e) {
                    // A bad SKU character shouldn't kill the whole sheet —
                    // the tag just renders without a barcode, same
                    // fail-soft philosophy as BarcodeService::render()'s
                    // logo-compositing fallback.
                    $svg = null;
                }
            }

            $tags[] = [
                'name'      => $name,
                'price'     => $price,
                'was_price' => $wasPrice,
                'sku'       => $sku,
                'badge'     => $badge,
                'svg'       => $svg,
            ];
        }

        $allTags = [];
        for ($c = 0; $c < $copies; $c++) {
            array_push($allTags, ...$tags);
        }

        $isThermal = ($config['page'] ?? null) === 'label';

        $paper = $isThermal
            ? [0, 0, $this->mmToPt($config['label_w']), $this->mmToPt($config['label_h'])]
            : $config['page'];

        $pdf = Pdf::loadView('tools.pdf.price-tag-sheet', [
            'tags'      => $allTags,
            'symbol'    => $symbol,
            'config'    => $config,
            'isThermal' => $isThermal,
        ])->setPaper($paper, 'portrait');

        return $pdf->output();
    }

    /**
     * Parse bulk-paste CSV-like text into row arrays.
     * Accepted line shape: name,price[,was_price[,sku[,badge]]]
     * Blank lines and lines starting with # are ignored.
     *
     * @return array<int, array{name:string, price:float, was_price:?float, sku:string, badge:string}>
     * @throws InvalidArgumentException
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
            if ($name === '') {
                continue;
            }

            $price = isset($cols[1]) ? (float) trim($cols[1]) : 0.0;
            $wasRaw = isset($cols[2]) ? trim($cols[2]) : '';
            $wasPrice = $wasRaw !== '' ? (float) $wasRaw : null;
            $sku = trim($cols[3] ?? '');
            $badge = trim($cols[4] ?? '');

            $rows[] = [
                'name'      => $name,
                'price'     => $price,
                'was_price' => $wasPrice,
                'sku'       => $sku,
                'badge'     => $badge,
            ];

            if (count($rows) >= self::MAX_ROWS) {
                break;
            }
        }

        if (empty($rows)) {
            throw new InvalidArgumentException('Could not find any valid rows in the pasted text. Expected format: name,price');
        }

        return $rows;
    }

    private function mmToPt(float $mm): float
    {
        return $mm * 2.834645669;
    }
}
