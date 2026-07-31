<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\BarcodeLabelSheetService;
use App\Services\Tools\BarcodeService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * BarcodeLabelToolController — Free Barcode Label Sheet Generator.
 *
 * Free and completely ungated per plan §6.1 — no email, no account, just
 * the standard `throttle:tools` limiter. Prints a batch of DIFFERENT
 * products, each with its own real scannable barcode, on Avery-compatible
 * or thermal label sheets — the inventory-labelling sibling of the
 * shelf-price-focused Price Tag Generator.
 */
class BarcodeLabelToolController extends Controller
{
    public function __construct(
        private readonly BarcodeLabelSheetService $sheets,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/BarcodeLabelSheet', [
            'sheetPresets'   => BarcodeLabelSheetService::presetOptions(),
            'maxRows'        => BarcodeLabelSheetService::MAX_ROWS,
            'maxCopies'      => BarcodeLabelSheetService::MAX_COPIES,
            'currencies'     => BarcodeLabelSheetService::CURRENCIES,
            'barcodeFormats' => $this->barcodeFormatList(),
            'toolGroups'     => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/barcode-label-generator/parse — throttle:tools
     */
    public function parse(Request $request)
    {
        $validated = $request->validate([
            'csv_text' => ['required', 'string', 'max:50000'],
        ]);

        try {
            $rows = $this->sheets->parseBulkText($validated['csv_text']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }

        return response()->json(['items' => $rows, 'count' => count($rows)]);
    }

    /**
     * POST /tools/barcode-label-generator/sheet — throttle:tools
     */
    public function sheet(Request $request)
    {
        $validated = $request->validate([
            'items'             => ['required', 'array', 'min:1', 'max:' . BarcodeLabelSheetService::MAX_ROWS],
            'items.*.name'      => ['required', 'string', 'max:120'],
            'items.*.value'     => ['required', 'string', 'max:64'],
            'items.*.format'    => ['nullable', 'string', Rule::in(array_keys(BarcodeService::FORMATS))],
            'items.*.price'     => ['nullable', 'string', 'max:30'],
            'preset'            => ['required', 'string', Rule::in(array_keys(BarcodeLabelSheetService::PRESETS))],
            'copies'            => ['required', 'integer', 'min:1', 'max:' . BarcodeLabelSheetService::MAX_COPIES],
            'currency'          => ['nullable', 'string', Rule::in(array_keys(BarcodeLabelSheetService::CURRENCIES))],
        ]);

        try {
            $pdf = $this->sheets->build(
                preset: $validated['preset'],
                rows: $validated['items'],
                options: [
                    'currency' => $validated['currency'] ?? null,
                    'copies'   => $validated['copies'],
                ],
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not generate that label sheet. Double-check your rows and try again.']], 422);
        }

        $this->usage->record('barcode-label-sheet', $validated['preset'], null, [
            'item_count' => count($validated['items']),
            'copies'     => $validated['copies'],
        ]);

        $filename = 'barcode-labels-' . $validated['preset'] . '.pdf';

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function barcodeFormatList(): array
    {
        return collect(BarcodeService::FORMATS)->map(fn ($f, $slug) => [
            'slug' => $slug,
            'name' => $f['name'],
        ])->values()->all();
    }
}
