<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * StockCountSheetService — builds a printable physical inventory auditing sheet PDF.
 */
class StockCountSheetService
{
    public const MAX_ITEMS = 500;

    /**
     * @param array $store       ['name','location','auditor_name','audit_date','reference_no','logo_base64']
     * @param array $items       list of ['sku','name','category','unit','expected_qty']
     * @param array $meta        ['show_expected','blind_count','group_by','orientation','notes']
     * @throws InvalidArgumentException
     */
    public function build(array $store, array $items, array $meta): array
    {
        $errors = $this->validate($store, $items);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $orientation = isset($meta['orientation']) && in_array($meta['orientation'], ['portrait', 'landscape'], true)
            ? $meta['orientation']
            : 'portrait';

        $groupBy = $meta['group_by'] ?? 'category'; // 'category', 'location', or 'none'
        $showExpected = (bool) ($meta['show_expected'] ?? true);
        $blindCount = (bool) ($meta['blind_count'] ?? false);

        if ($blindCount) {
            $showExpected = false;
        }

        $processedItems = [];
        foreach (array_slice($items, 0, self::MAX_ITEMS) as $item) {
            $processedItems[] = [
                'sku'          => trim($item['sku'] ?? ''),
                'name'         => trim($item['name'] ?? ''),
                'category'     => trim($item['category'] ?? 'General'),
                'unit'         => trim($item['unit'] ?? 'pcs'),
                'expected_qty' => isset($item['expected_qty']) && $item['expected_qty'] !== '' ? (float) $item['expected_qty'] : null,
            ];
        }

        $grouped = [];
        if ($groupBy !== 'none') {
            foreach ($processedItems as $it) {
                $key = !empty($it['category']) ? $it['category'] : 'Uncategorized';
                $grouped[$key][] = $it;
            }
            ksort($grouped);
        } else {
            $grouped['All Items'] = $processedItems;
        }

        $pdf = Pdf::loadView('tools.pdf.stock-count-sheet', [
            'store'        => $store,
            'groupedItems' => $grouped,
            'meta'         => $meta,
            'showExpected' => $showExpected,
            'blindCount'   => $blindCount,
            'totalItems'   => count($processedItems),
        ])->setPaper('a4', $orientation);

        return [
            'bytes'      => $pdf->output(),
            'totalItems' => count($processedItems),
        ];
    }

    public function validate(array $store, array $items): array
    {
        $errors = [];

        if (empty(trim($store['name'] ?? ''))) {
            $errors[] = 'Store name is required.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one product item to count.';
        }
        if (count($items) > self::MAX_ITEMS) {
            $errors[] = 'A single count sheet supports at most ' . self::MAX_ITEMS . ' items.';
        }
        foreach ($items as $i => $item) {
            if (empty(trim($item['name'] ?? ''))) {
                $errors[] = 'Item ' . ($i + 1) . ' needs a name/description.';
                break;
            }
        }

        return $errors;
    }

    /**
     * Helper to parse CSV paste content into array of items.
     * Format: sku,name,category,expected_qty,unit
     */
    public function parseCsv(string $rawText): array
    {
        $lines = explode("\n", str_replace("\r", "", trim($rawText)));
        $items = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            $parts = str_getcsv($line);
            if (empty($parts[0])) continue;

            // Header skip if detected
            if (in_array(strtolower($parts[0]), ['sku', 'name', 'item', 'description', 'code'], true)) {
                continue;
            }

            // Standard order: sku, name, category, expected_qty, unit
            // Or if 2 columns: sku, name
            $sku = $parts[0] ?? '';
            $name = $parts[1] ?? $parts[0];
            $category = $parts[2] ?? 'General';
            $expectedQty = isset($parts[3]) && is_numeric(trim($parts[3])) ? (float) trim($parts[3]) : null;
            $unit = $parts[4] ?? 'pcs';

            $items[] = [
                'sku'          => $sku,
                'name'         => $name,
                'category'     => $category,
                'expected_qty' => $expectedQty,
                'unit'         => $unit,
            ];
        }

        return $items;
    }

    public function nextReferenceNo(): string
    {
        return 'AUD-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
