<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\ProductCsvCleanerService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * ProductCsvCleanerToolController — free CSV cleaning/validation tool for
 * product import files (Shopify, WooCommerce, generic spreadsheets).
 *
 * Server-side parsing (not client-side JS) because: robust CSV parsing
 * (quoted fields, embedded commas, BOM/encoding) is more reliable with
 * PHP's native fgetcsv than hand-rolled JS parsing, and file upload
 * naturally needs a server round-trip anyway. Two-step flow: /parse
 * returns a JSON preview + issue report for review, /download returns the
 * final cleaned CSV once the user confirms the column mapping and fixes.
 *
 * Free, no email gate, no persistence of uploaded content.
 */
class ProductCsvCleanerToolController extends Controller
{
    public function __construct(
        private readonly ProductCsvCleanerService $cleaner,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/ProductCsvCleaner', [
            'maxRows'    => ProductCsvCleanerService::MAX_ROWS,
            'fields'     => array_keys(ProductCsvCleanerService::FIELD_ALIASES),
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/product-csv-cleaner/parse — throttle:tools
     * Accepts either a file upload OR raw pasted CSV text. Returns detected
     * column mapping, a preview of the first ~20 cleaned rows, and the full
     * issue report so the frontend can render summary counters for all rows.
     */
    public function parse(Request $request)
    {
        $validated = $request->validate([
            'csv_text' => ['nullable', 'string', 'max:5000000'],
            'file' => ['nullable', 'file', 'mimes:csv,txt', 'max:5120'],
            'column_map' => ['nullable', 'array'],
            'generate_missing_skus' => ['nullable', 'boolean'],
        ]);

        $csvText = $this->resolveCsvText($request, $validated);

        if ($csvText === null) {
            return response()->json([
                'errors' => ['Upload a CSV file or paste CSV text to clean.'],
            ], 422);
        }

        try {
            $parsed = $this->cleaner->parseRawCsv($csvText);

            if (count($parsed['rows']) > ProductCsvCleanerService::MAX_ROWS) {
                return response()->json([
                    'errors' => [
                        'This file has more than ' . ProductCsvCleanerService::MAX_ROWS . ' rows. '
                        . 'The Product CSV Cleaner is a free tool capped at ' . ProductCsvCleanerService::MAX_ROWS
                        . ' rows to keep it fast for everyone — for larger catalogs, use VenQore\'s built-in product import instead.',
                    ],
                ], 422);
            }

            $detected = $this->cleaner->detectColumns($parsed['header']);

            $columnMap = $validated['column_map'] ?? null;
            $effectiveMap = $columnMap ?: $detected;
            // Normalize incoming overrides: values may arrive as strings.
            foreach ($effectiveMap as $field => $idx) {
                $effectiveMap[$field] = ($idx === null || $idx === '' ) ? null : (int) $idx;
            }

            $result = $this->cleaner->clean($parsed['header'], $parsed['rows'], $effectiveMap, [
                'generate_missing_skus' => (bool) ($validated['generate_missing_skus'] ?? false),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not parse that CSV. Double-check the file and try again.']], 422);
        }

        $this->usage->record('product-csv-cleaner', 'parse', null, [
            'rows_processed' => $result['summary']['rows_processed'],
            'issues_found' => $result['summary']['issues_found'],
        ]);

        return response()->json([
            'success' => true,
            'header' => $parsed['header'],
            'detected_columns' => $detected,
            'column_map' => $effectiveMap,
            'summary' => $result['summary'],
            'preview' => array_slice($result['rows'], 0, 20),
            'fields' => $result['fields'],
        ]);
    }

    /**
     * POST /tools/product-csv-cleaner/download — throttle:tools
     * Re-runs the same clean() pass with the confirmed column mapping and
     * options, then streams the full cleaned CSV file for download.
     */
    public function download(Request $request)
    {
        $validated = $request->validate([
            'csv_text' => ['nullable', 'string', 'max:5000000'],
            'file' => ['nullable', 'file', 'mimes:csv,txt', 'max:5120'],
            'column_map' => ['nullable', 'array'],
            'generate_missing_skus' => ['nullable', 'boolean'],
        ]);

        $csvText = $this->resolveCsvText($request, $validated);

        if ($csvText === null) {
            return response()->json(['errors' => ['Upload a CSV file or paste CSV text to clean.']], 422);
        }

        try {
            $parsed = $this->cleaner->parseRawCsv($csvText);

            if (count($parsed['rows']) > ProductCsvCleanerService::MAX_ROWS) {
                return response()->json([
                    'errors' => [
                        'This file has more than ' . ProductCsvCleanerService::MAX_ROWS . ' rows. '
                        . 'The Product CSV Cleaner is a free tool capped at ' . ProductCsvCleanerService::MAX_ROWS
                        . ' rows to keep it fast for everyone — for larger catalogs, use VenQore\'s built-in product import instead.',
                    ],
                ], 422);
            }

            $detected = $this->cleaner->detectColumns($parsed['header']);
            $columnMap = $validated['column_map'] ?? null;
            $effectiveMap = $columnMap ?: $detected;
            foreach ($effectiveMap as $field => $idx) {
                $effectiveMap[$field] = ($idx === null || $idx === '') ? null : (int) $idx;
            }

            $result = $this->cleaner->clean($parsed['header'], $parsed['rows'], $effectiveMap, [
                'generate_missing_skus' => (bool) ($validated['generate_missing_skus'] ?? false),
            ]);

            $csv = $this->cleaner->toCsv($result['fields'], $result['rows']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build the cleaned CSV. Double-check the file and try again.']], 422);
        }

        $this->usage->record('product-csv-cleaner', 'download', null, [
            'rows_processed' => $result['summary']['rows_processed'],
            'issues_found' => $result['summary']['issues_found'],
            'rows_auto_fixed' => $result['summary']['rows_auto_fixed'],
        ]);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="cleaned-products.csv"',
        ]);
    }

    private function resolveCsvText(Request $request, array $validated): ?string
    {
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            return file_get_contents($request->file('file')->getRealPath());
        }

        if (!empty($validated['csv_text'])) {
            return $validated['csv_text'];
        }

        return null;
    }
}
