<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * LabelSheetService — builds a print-ready PDF sheet of general-purpose
 * TEXT labels: mailing/return addresses, "Fragile" warning labels, folder
 * tabs, name badges, jar/container labels — anything that is plain text,
 * NOT a barcode (see BarcodeSheetService) and NOT a price tag (see
 * PriceTagService).
 *
 * Mirrors PriceTagService's core model: each ROW the user supplies is a
 * DISTINCT label (up to 3 free-text lines), not N copies of one label.
 * Two independent repeat mechanisms exist on top of that distinct-row
 * model:
 *   - per-row `qty`   — repeat THIS row's label content N times (e.g. the
 *                        same return-address label ×50).
 *   - global `copies` — repeat the WHOLE resulting batch N times (e.g.
 *                        print the same 20-label folder-tab batch twice).
 *
 * The label-size preset shape (label_w/label_h/page/cols/rows/margin_*) is
 * intentionally identical in spirit to BarcodeSheetService::PRESETS and
 * PriceTagService::PRESETS, but the array is DUPLICATED here rather than
 * imported from either — same reasoning as PriceTagService's header
 * comment: each sheet-style tool keeps its own preset copy so a change to
 * one shipped, tested tool can never silently ripple into another.
 */
class LabelSheetService
{
    /**
     * label_w / label_h — physical label size in mm
     * page              — 'label' (thermal roll, page == one label) or a dompdf paper string
     * cols / rows       — grid for sheet presets (ignored for thermal)
     * margin_*          — sheet margins in mm (ignored for thermal)
     */
    public const PRESETS = [
        // ── Thermal roll / direct label printers ──────────────────────
        'thermal-40x30' => ['label' => '40 × 30 mm label',        'group' => 'Thermal roll', 'label_w' => 40,   'label_h' => 30,   'page' => 'label'],
        'thermal-50x25' => ['label' => '50 × 25 mm (2" × 1")',    'group' => 'Thermal roll', 'label_w' => 50,   'label_h' => 25,   'page' => 'label'],
        'thermal-50x30' => ['label' => '50 × 30 mm label',        'group' => 'Thermal roll', 'label_w' => 50,   'label_h' => 30,   'page' => 'label'],
        'thermal-60x40' => ['label' => '60 × 40 mm label',        'group' => 'Thermal roll', 'label_w' => 60,   'label_h' => 40,   'page' => 'label'],
        'thermal-100x50' => ['label' => '100 × 50 mm (4" × 2") shipping label', 'group' => 'Thermal roll', 'label_w' => 100, 'label_h' => 50, 'page' => 'label'],

        // ── A4 / Letter sheets (Avery-compatible) ──────────────────────
        'a4-3x8'     => ['label' => 'A4 — 24 per sheet (63.5 × 33.9 mm)',     'group' => 'A4 sheet',     'label_w' => 63.5, 'label_h' => 33.9, 'page' => 'a4',     'cols' => 3, 'rows' => 8,  'margin_top' => 12.7, 'margin_left' => 7.2],
        'a4-3x7'     => ['label' => 'A4 — 21 per sheet (70 × 42.3 mm)',       'group' => 'A4 sheet',     'label_w' => 70,   'label_h' => 42.3, 'page' => 'a4',     'cols' => 3, 'rows' => 7,  'margin_top' => 4.5,  'margin_left' => 0],
        'a4-5x13'    => ['label' => 'A4 — 65 per sheet (38.1 × 21.2 mm)',     'group' => 'A4 sheet',     'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'a4',     'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
        'letter-3x8' => ['label' => 'Letter — 24 per sheet (66.7 × 33.9 mm)', 'group' => 'Letter sheet', 'label_w' => 66.7, 'label_h' => 33.9, 'page' => 'letter', 'cols' => 3, 'rows' => 8,  'margin_top' => 12.7, 'margin_left' => 4.8],
        'letter-3x7' => ['label' => 'Letter — 21 per sheet (70 × 42.3 mm)',   'group' => 'Letter sheet', 'label_w' => 70,   'label_h' => 42.3, 'page' => 'letter', 'cols' => 3, 'rows' => 7,  'margin_top' => 12.7, 'margin_left' => 4.8],
        'letter-5x13' => ['label' => 'Letter — 65 per sheet (38.1 × 21.2 mm)', 'group' => 'Letter sheet', 'label_w' => 38.1, 'label_h' => 21.2, 'page' => 'letter', 'cols' => 5, 'rows' => 13, 'margin_top' => 10.7, 'margin_left' => 4.7],
        // Avery 5160-equivalent address label: 1" x 2.625" = 25.4mm x 66.675mm, 3 cols x 10 rows on Letter.
        'letter-3x10-address' => ['label' => 'Letter — Avery 5160-equiv. address labels, 30 per sheet (66.7 × 25.4 mm)', 'group' => 'Letter sheet', 'label_w' => 66.7, 'label_h' => 25.4, 'page' => 'letter', 'cols' => 3, 'rows' => 10, 'margin_top' => 12.7, 'margin_left' => 4.8],
    ];

    /** Hard cap on distinct label rows per request (before per-row qty / global copies expand it). */
    public const MAX_ROWS = 200;

    /** Hard cap on whole-batch copies. */
    public const MAX_COPIES = 20;

    /** Hard cap on a single row's repeat quantity. */
    public const MAX_ROW_QTY = 200;

    /** Hard cap on total expanded labels in one PDF, to bound render time/size. */
    public const MAX_TOTAL_LABELS = 4000;

    public function isValidPreset(string $preset): bool
    {
        return array_key_exists($preset, self::PRESETS);
    }

    /** Presets grouped for the UI dropdown — same shape as sibling sheet-tool services. */
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
     * @param array $rows list of ['line1','line2'=>?,'line3'=>?,'align'=>?,'bold_first'=>?,'qty'=>?]
     * @param array $options ['copies'=>int]
     * @return string raw PDF bytes
     * @throws InvalidArgumentException
     */
    public function build(string $preset, array $rows, array $options = []): string
    {
        if (!$this->isValidPreset($preset)) {
            throw new InvalidArgumentException('Unknown label size.');
        }

        if (empty($rows)) {
            throw new InvalidArgumentException('Add at least one label row.');
        }

        $rows = array_slice($rows, 0, self::MAX_ROWS);
        $config = self::PRESETS[$preset];
        $copies = max(1, min(self::MAX_COPIES, (int) ($options['copies'] ?? 1)));

        $labels = [];
        foreach ($rows as $row) {
            $line1 = trim((string) ($row['line1'] ?? ''));
            $line2 = trim((string) ($row['line2'] ?? ''));
            $line3 = trim((string) ($row['line3'] ?? ''));

            if ($line1 === '' && $line2 === '' && $line3 === '') {
                continue;
            }

            $align = (isset($row['align']) && in_array($row['align'], ['left', 'center'], true)) ? $row['align'] : 'left';
            $boldFirst = isset($row['bold_first']) ? (bool) $row['bold_first'] : false;
            $qty = max(1, min(self::MAX_ROW_QTY, (int) ($row['qty'] ?? 1)));

            $label = [
                'line1'      => $line1,
                'line2'      => $line2,
                'line3'      => $line3,
                'align'      => $align,
                'bold_first' => $boldFirst,
            ];

            for ($i = 0; $i < $qty; $i++) {
                $labels[] = $label;

                if (count($labels) >= self::MAX_TOTAL_LABELS) {
                    break 2;
                }
            }
        }

        if (empty($labels)) {
            throw new InvalidArgumentException('Every label needs at least one line of text.');
        }

        $allLabels = [];
        for ($c = 0; $c < $copies; $c++) {
            foreach ($labels as $label) {
                $allLabels[] = $label;
                if (count($allLabels) >= self::MAX_TOTAL_LABELS) {
                    break 2;
                }
            }
        }

        $isThermal = ($config['page'] ?? null) === 'label';

        $paper = $isThermal
            ? [0, 0, $this->mmToPt($config['label_w']), $this->mmToPt($config['label_h'])]
            : $config['page'];

        $pdf = Pdf::loadView('tools.pdf.label-sheet', [
            'labels'    => $allLabels,
            'config'    => $config,
            'isThermal' => $isThermal,
        ])->setPaper($paper, 'portrait');

        return $pdf->output();
    }

    /**
     * Parse bulk-paste text into row arrays. Convention: labels are
     * separated by a BLANK LINE; within a block, each line (up to 3)
     * becomes line1/line2/line3 of one label. A trailing "xN" token on the
     * block's own line (e.g. "x5") sets that label's repeat quantity.
     * Lines starting with # are ignored (comments).
     *
     * Example input:
     *   Jane Doe
     *   123 Main St
     *   Springfield, IL 62704
     *
     *   FRAGILE
     *   This Side Up
     *   x10
     *
     * @return array<int, array{line1:string, line2:string, line3:string, qty:int}>
     * @throws InvalidArgumentException
     */
    public function parseBulkText(string $text): array
    {
        $normalized = preg_replace('/\r\n|\r/', "\n", $text) ?? $text;
        $blocks = preg_split('/\n\s*\n/', trim($normalized)) ?: [];

        $rows = [];
        foreach ($blocks as $block) {
            $lines = array_values(array_filter(
                array_map('trim', explode("\n", $block)),
                fn ($l) => $l !== '' && !str_starts_with($l, '#')
            ));

            if (empty($lines)) {
                continue;
            }

            $qty = 1;
            $last = end($lines);
            if (preg_match('/^x(\d{1,3})$/i', $last, $m)) {
                $qty = max(1, min(self::MAX_ROW_QTY, (int) $m[1]));
                array_pop($lines);
            }

            if (empty($lines)) {
                continue;
            }

            $rows[] = [
                'line1' => $lines[0] ?? '',
                'line2' => $lines[1] ?? '',
                'line3' => $lines[2] ?? '',
                'qty'   => $qty,
            ];

            if (count($rows) >= self::MAX_ROWS) {
                break;
            }
        }

        if (empty($rows)) {
            throw new InvalidArgumentException('Could not find any valid label blocks in the pasted text. Separate each label with a blank line.');
        }

        return $rows;
    }

    private function mmToPt(float $mm): float
    {
        return $mm * 2.834645669;
    }
}
