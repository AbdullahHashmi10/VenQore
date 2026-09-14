<?php

namespace App\Services\Tools;

use InvalidArgumentException;

/**
 * ProductCsvCleanerService — parses a messy product CSV export (Shopify,
 * WooCommerce, or a generic spreadsheet), auto-detects column meaning by
 * fuzzy header matching, cleans common data problems, and reports what it
 * found so the user can review before downloading.
 *
 * Reuses App\Services\Tools\BarcodeService::validateGtin() for barcode
 * check-digit validation rather than reimplementing GTIN/UPC/EAN math.
 *
 * Row cap keeps this a snappy free tool, not a bulk ETL pipeline — larger
 * catalogs should use VenQore's actual import tools (soft upsell only).
 */
class ProductCsvCleanerService
{
    public const MAX_ROWS = 5000;

    /** Canonical field => list of header aliases matched case-insensitively, whitespace-normalized. */
    public const FIELD_ALIASES = [
        'name' => ['name', 'title', 'product name', 'product title', 'item name', 'item'],
        'sku' => ['sku', 'item code', 'product code', 'item sku', 'product sku', 'code'],
        'price' => ['price', 'regular price', 'unit price', 'sale price', 'cost', 'retail price'],
        'barcode' => ['barcode', 'upc', 'ean', 'gtin', 'upc/ean', 'barcode (upc/ean)'],
        'quantity' => ['quantity', 'stock', 'qty', 'stock quantity', 'inventory', 'in stock'],
        'category' => ['category', 'product type', 'product category', 'type', 'collection'],
        'description' => ['description', 'body (html)', 'body', 'product description', 'details'],
    ];

    public const ISSUE_TYPES = [
        'missing_sku',
        'duplicate_sku',
        'malformed_price',
        'negative_or_zero_price',
        'invalid_barcode',
        'duplicate_name_category',
        'whitespace_cleaned',
    ];

    public function __construct(private readonly BarcodeService $barcodes)
    {
    }

    /**
     * Split raw CSV text into a header row + data rows, handling quoted
     * fields with embedded commas via PHP's native str_getcsv on each line
     * boundary is unreliable for embedded newlines, so we use fgetcsv over
     * an in-memory stream instead — the standard, robust way to parse CSV
     * text (quoted fields, embedded commas/newlines, escaped quotes) without
     * hand-rolling a parser.
     *
     * @return array{header: array<int,string>, rows: array<int,array<int,string>>}
     */
    public function parseRawCsv(string $csvText): array
    {
        // Strip BOM if present (common in Excel/Shopify exports).
        $csvText = preg_replace('/^\xEF\xBB\xBF/', '', $csvText);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $csvText);
        rewind($stream);

        $rows = [];
        while (($row = fgetcsv($stream)) !== false) {
            if (count($row) === 1 && $row[0] === null) {
                continue;
            }
            $rows[] = $row;
        }
        fclose($stream);

        if (empty($rows)) {
            throw new InvalidArgumentException('No CSV data found. Paste or upload a file with a header row and at least one product row.');
        }

        $header = array_map(fn ($h) => trim((string) $h), array_shift($rows));

        return ['header' => $header, 'rows' => $rows];
    }

    /**
     * Fuzzy/case-insensitive column auto-detection against known aliases.
     *
     * @param array<int,string> $header
     * @return array<string,?int> canonical field => column index (or null if not detected)
     */
    public function detectColumns(array $header): array
    {
        $normalized = array_map(fn ($h) => $this->normalizeHeader($h), $header);

        $detected = [];
        foreach (self::FIELD_ALIASES as $field => $aliases) {
            $detected[$field] = null;
            foreach ($normalized as $idx => $h) {
                if (in_array($h, $aliases, true)) {
                    $detected[$field] = $idx;
                    break;
                }
            }
            // Fallback: partial/contains match if no exact alias hit.
            if ($detected[$field] === null) {
                foreach ($normalized as $idx => $h) {
                    foreach ($aliases as $alias) {
                        if ($h !== '' && (str_contains($h, $alias) || str_contains($alias, $h))) {
                            $detected[$field] = $idx;
                            break 2;
                        }
                    }
                }
            }
        }

        return $detected;
    }

    private function normalizeHeader(string $header): string
    {
        $h = strtolower(trim($header));
        $h = preg_replace('/\s+/', ' ', $h);

        return $h;
    }

    /**
     * Clean + validate rows according to the given column mapping and
     * user-selected options, returning a full report and the cleaned rows.
     *
     * @param array<int,string> $header
     * @param array<int,array<int,string>> $rows
     * @param array<string,?int> $columnMap canonical field => column index
     * @param array{generate_missing_skus?:bool} $options
     *
     * @return array{
     *   summary: array{rows_processed:int, rows_skipped_empty:int, issues_found:int, rows_auto_fixed:int, issues_by_type:array<string,int>},
     *   rows: array<int,array>,
     *   fields: array<int,string>
     * }
     */
    public function clean(array $header, array $rows, array $columnMap, array $options = []): array
    {
        if (count($rows) > self::MAX_ROWS) {
            throw new InvalidArgumentException(
                'This file has more than ' . self::MAX_ROWS . ' rows. The Product CSV Cleaner is a free tool capped at '
                . self::MAX_ROWS . ' rows to keep it fast for everyone — for larger catalogs, use VenQore\'s built-in product import instead.'
            );
        }

        $generateMissingSkus = (bool) ($options['generate_missing_skus'] ?? false);

        $fields = array_keys(self::FIELD_ALIASES);

        // Pass 1: extract + trim/normalize whitespace, skip fully-empty rows.
        $extracted = [];
        $skippedEmpty = 0;
        $wasWhitespaceCleaned = [];

        foreach ($rows as $rowIndex => $row) {
            $isEmpty = true;
            foreach ($row as $cell) {
                if (trim((string) $cell) !== '') {
                    $isEmpty = false;
                    break;
                }
            }
            if ($isEmpty) {
                $skippedEmpty++;
                continue;
            }

            $record = [];
            $cleanedWhitespace = false;
            foreach ($fields as $field) {
                $colIdx = $columnMap[$field] ?? null;
                $raw = ($colIdx !== null && array_key_exists($colIdx, $row)) ? (string) $row[$colIdx] : '';

                if ($field === 'description') {
                    // Preserve internal formatting-ish content but still trim ends.
                    $normalized = trim($raw);
                } else {
                    $normalized = trim(preg_replace('/\s+/', ' ', $raw));
                }

                if ($normalized !== trim($raw) || $raw !== $normalized) {
                    // any change beyond a straight trim counts as a whitespace fix
                }
                if ($normalized !== $raw) {
                    $cleanedWhitespace = true;
                }

                $record[$field] = $normalized;
            }

            $extracted[] = $record;
            $wasWhitespaceCleaned[] = $cleanedWhitespace;
        }

        // Pass 2: SKU generation for missing SKUs (needs full pass 1 first, for dup checks after).
        $skuCounts = [];
        foreach ($extracted as $r) {
            if ($r['sku'] !== '') {
                $key = strtolower($r['sku']);
                $skuCounts[$key] = ($skuCounts[$key] ?? 0) + 1;
            }
        }

        $nameCategoryCounts = [];
        foreach ($extracted as $r) {
            if ($r['name'] !== '') {
                $key = strtolower($r['name']) . '||' . strtolower($r['category']);
                $nameCategoryCounts[$key] = ($nameCategoryCounts[$key] ?? 0) + 1;
            }
        }

        $issuesByType = array_fill_keys(self::ISSUE_TYPES, 0);
        $rowsAutoFixed = 0;
        $usedGeneratedSkus = [];
        $skuSuffix = 1;

        $out = [];
        foreach ($extracted as $i => $record) {
            $issues = [];
            $autoFixedThisRow = false;

            // Whitespace cleanup
            if ($wasWhitespaceCleaned[$i]) {
                $issues[] = 'whitespace_cleaned';
                $issuesByType['whitespace_cleaned']++;
                $autoFixedThisRow = true;
            }

            // Missing SKU
            if ($record['sku'] === '') {
                $issues[] = 'missing_sku';
                $issuesByType['missing_sku']++;

                if ($generateMissingSkus) {
                    $base = $this->slugify($record['name'] !== '' ? $record['name'] : 'product');
                    $candidate = strtoupper($base) . '-' . $skuSuffix;
                    while (isset($usedGeneratedSkus[$candidate]) || isset($skuCounts[strtolower($candidate)])) {
                        $skuSuffix++;
                        $candidate = strtoupper($base) . '-' . $skuSuffix;
                    }
                    $usedGeneratedSkus[$candidate] = true;
                    $skuSuffix++;
                    $record['sku'] = $candidate;
                    $record['sku_generated'] = true;
                    $autoFixedThisRow = true;
                }
            }

            // Duplicate SKU
            if ($record['sku'] !== '' && !($record['sku_generated'] ?? false)) {
                $key = strtolower($record['sku']);
                if (($skuCounts[$key] ?? 0) > 1) {
                    $issues[] = 'duplicate_sku';
                    $issuesByType['duplicate_sku']++;
                }
            }

            // Price cleanup
            if ($record['price'] !== '') {
                $priceResult = $this->normalizePrice($record['price']);
                if ($priceResult['error']) {
                    $issues[] = 'malformed_price';
                    $issuesByType['malformed_price']++;
                    $record['price_clean'] = null;
                } else {
                    if ($priceResult['was_malformed']) {
                        $issues[] = 'malformed_price';
                        $issuesByType['malformed_price']++;
                        $autoFixedThisRow = true;
                    }
                    $record['price_clean'] = $priceResult['value'];

                    if ($priceResult['value'] <= 0) {
                        $issues[] = 'negative_or_zero_price';
                        $issuesByType['negative_or_zero_price']++;
                    }
                }
            } else {
                $record['price_clean'] = null;
            }

            // Barcode validation (reuses BarcodeService::validateGtin — no reimplemented check-digit math)
            if ($record['barcode'] !== '') {
                try {
                    $res = $this->barcodes->validateGtin($record['barcode']);
                    if (isset($res['valid']) && !$res['valid']) {
                        $issues[] = 'invalid_barcode';
                        $issuesByType['invalid_barcode']++;
                    }
                } catch (InvalidArgumentException $e) {
                    $issues[] = 'invalid_barcode';
                    $issuesByType['invalid_barcode']++;
                }
            }

            // Duplicate name+category
            if ($record['name'] !== '') {
                $key = strtolower($record['name']) . '||' . strtolower($record['category']);
                if (($nameCategoryCounts[$key] ?? 0) > 1) {
                    $issues[] = 'duplicate_name_category';
                    $issuesByType['duplicate_name_category']++;
                }
            }

            if ($autoFixedThisRow) {
                $rowsAutoFixed++;
            }

            $record['row_number'] = $i + 1;
            $record['issues'] = array_values(array_unique($issues));
            $out[] = $record;
        }

        $totalIssues = 0;
        foreach ($issuesByType as $count) {
            $totalIssues += $count;
        }

        return [
            'summary' => [
                'rows_processed' => count($rows),
                'rows_kept' => count($out),
                'rows_skipped_empty' => $skippedEmpty,
                'issues_found' => $totalIssues,
                'rows_auto_fixed' => $rowsAutoFixed,
                'issues_by_type' => $issuesByType,
            ],
            'rows' => $out,
            'fields' => $fields,
        ];
    }

    /**
     * Normalize a raw price string: strip currency symbols and thousands
     * separators, parse to a clean decimal. Flags whether the input needed
     * normalization, and whether it could not be parsed as a number at all.
     *
     * @return array{value: ?float, was_malformed: bool, error: bool}
     */
    public function normalizePrice(string $raw): array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return ['value' => null, 'was_malformed' => false, 'error' => true];
        }

        // Already a clean plain number.
        if (preg_match('/^-?\d+(\.\d+)?$/', $trimmed)) {
            return ['value' => (float) $trimmed, 'was_malformed' => false, 'error' => false];
        }

        // Strip currency symbols/codes and whitespace.
        $stripped = preg_replace('/[^\d.,\-]/', '', $trimmed);

        if ($stripped === '' || $stripped === '-') {
            return ['value' => null, 'was_malformed' => true, 'error' => true];
        }

        // Handle thousands separators: "1,200.00" -> "1200.00"; "1.200,00" (EU) -> "1200.00".
        $hasComma = str_contains($stripped, ',');
        $hasDot = str_contains($stripped, '.');

        if ($hasComma && $hasDot) {
            // Whichever separator appears last is the decimal separator.
            if (strrpos($stripped, ',') > strrpos($stripped, '.')) {
                $stripped = str_replace('.', '', $stripped);
                $stripped = str_replace(',', '.', $stripped);
            } else {
                $stripped = str_replace(',', '', $stripped);
            }
        } elseif ($hasComma && !$hasDot) {
            // Could be thousands ("1,200") or EU decimal ("19,99"). If exactly
            // 2 digits follow the last comma, treat as decimal; else thousands.
            $parts = explode(',', $stripped);
            $last = end($parts);
            if (strlen($last) === 2) {
                $stripped = str_replace(',', '', substr($stripped, 0, -3)) . '.' . $last;
            } else {
                $stripped = str_replace(',', '', $stripped);
            }
        }

        if (!is_numeric($stripped)) {
            return ['value' => null, 'was_malformed' => true, 'error' => true];
        }

        return ['value' => (float) round((float) $stripped, 2), 'was_malformed' => true, 'error' => false];
    }

    public function slugify(string $text): string
    {
        $slug = strtolower(trim($text));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug === '' ? 'product' : $slug;
    }

    /**
     * Build downloadable CSV bytes from cleaned rows.
     *
     * @param array<int,string> $fields
     * @param array<int,array> $rows
     */
    public function toCsv(array $fields, array $rows): string
    {
        $stream = fopen('php://temp', 'r+');

        $columnLabels = [
            'name' => 'Name',
            'sku' => 'SKU',
            'price' => 'Price',
            'barcode' => 'Barcode',
            'quantity' => 'Quantity',
            'category' => 'Category',
            'description' => 'Description',
        ];

        $outHeader = array_map(fn ($f) => $columnLabels[$f] ?? $f, $fields);
        $outHeader[] = 'Issues Found';
        fputcsv($stream, $outHeader);

        foreach ($rows as $row) {
            $line = [];
            foreach ($fields as $field) {
                if ($field === 'price') {
                    $line[] = $row['price_clean'] !== null ? number_format((float) $row['price_clean'], 2, '.', '') : $row['price'];
                } else {
                    $line[] = $row[$field] ?? '';
                }
            }
            $line[] = implode('; ', $row['issues'] ?? []);
            fputcsv($stream, $line);
        }

        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);

        return $csv;
    }
}
