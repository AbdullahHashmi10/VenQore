<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\BarcodeService;
use App\Services\Tools\PriceTagSheetService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * PriceTagToolController — Free Price Tag Generator controller.
 *
 * UNGATED per plan §6.1.
 */
class PriceTagToolController extends Controller
{
    public function __construct(
        private readonly PriceTagSheetService $sheets,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/PriceTag', [
            'sheetPresets'  => PriceTagSheetService::presetOptions(),
            'maxRows'       => PriceTagSheetService::MAX_ROWS,
            'maxCopies'     => PriceTagSheetService::MAX_COPIES,
            'barcodeFormats' => $this->barcodeFormatList(),
            'toolGroups'    => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/price-tag-generator/parse — throttle:tools
     * Parses raw CSV-like text into structured item rows for bulk import.
     */
    public function parse(Request $request)
    {
        $validated = $request->validate([
            'csv_text' => ['required', 'string', 'max:50000'],
        ]);

        $items = $this->sheets->parseCsv($validated['csv_text']);

        return response()->json([
            'items' => $items,
            'count' => count($items),
        ]);
    }

    /**
     * POST /tools/price-tag-generator/sheet — throttle:tools
     * Builds and streams a PDF of price tags.
     */
    public function sheet(Request $request)
    {
        $validated = $request->validate([
            'items'            => ['required', 'array', 'min:1', 'max:' . PriceTagSheetService::MAX_ROWS],
            'items.*.name'      => ['required', 'string', 'max:120'],
            'items.*.price'     => ['required', 'string', 'max:30'],
            'items.*.was_price' => ['nullable', 'string', 'max:30'],
            'items.*.sku'       => ['nullable', 'string', 'max:64'],
            'items.*.badge'     => ['nullable', 'string', 'max:30'],
            'preset'           => ['required', 'string', Rule::in(array_keys(PriceTagSheetService::PRESETS))],
            'copies'           => ['required', 'integer', 'min:1', 'max:' . PriceTagSheetService::MAX_COPIES],
            'currency_symbol'  => ['nullable', 'string', 'max:5'],
            'show_barcode'     => ['nullable', 'boolean'],
            'barcode_format'   => ['nullable', 'string', Rule::in(array_keys(BarcodeService::FORMATS))],
        ]);

        try {
            $pdf = $this->sheets->build(
                items: $validated['items'],
                preset: $validated['preset'],
                copies: $validated['copies'],
                currencySymbol: $validated['currency_symbol'] ?? '$',
                showBarcode: $validated['show_barcode'] ?? false,
                barcodeFormat: $validated['barcode_format'] ?? 'code128',
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not generate price tag PDF. Double check inputs and try again.']], 422);
        }

        $this->usage->record('price-tag-sheet', $validated['preset'], null, [
            'item_count' => count($validated['items']),
            'copies'     => $validated['copies'],
        ]);

        $filename = 'price-tags-' . $validated['preset'] . '.pdf';

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
