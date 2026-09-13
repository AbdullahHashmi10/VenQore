<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\StockCountSheetService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockCountSheetToolController extends Controller
{
    public function __construct(
        private readonly StockCountSheetService $countSheet,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/StockCountSheet', [
            'maxItems'            => StockCountSheetService::MAX_ITEMS,
            'suggestedReference'  => $this->countSheet->nextReferenceNo(),
            'toolGroups'          => ToolRegistry::groups(),
        ]);
    }

    public function parse(Request $request)
    {
        $validated = $request->validate([
            'csv_text' => ['required', 'string', 'max:50000'],
        ]);

        $items = $this->countSheet->parseCsv($validated['csv_text']);

        return response()->json([
            'success' => true,
            'items'   => $items,
            'count'   => count($items),
        ]);
    }

    public function render(Request $request)
    {
        $validated = $request->validate([
            'store'                 => ['required', 'array'],
            'store.name'            => ['required', 'string', 'max:120'],
            'store.location'        => ['nullable', 'string', 'max:120'],
            'store.auditor_name'    => ['nullable', 'string', 'max:120'],
            'store.audit_date'      => ['nullable', 'string', 'max:30'],
            'store.reference_no'    => ['nullable', 'string', 'max:60'],
            'store.logo_base64'     => ['nullable', 'string', 'max:2000000'],

            'items'                 => ['required', 'array', 'min:1', 'max:' . StockCountSheetService::MAX_ITEMS],
            'items.*.sku'           => ['nullable', 'string', 'max:60'],
            'items.*.name'          => ['required', 'string', 'max:200'],
            'items.*.category'      => ['nullable', 'string', 'max:100'],
            'items.*.unit'          => ['nullable', 'string', 'max:30'],
            'items.*.expected_qty'  => ['nullable', 'numeric', 'min:0', 'max:1000000'],

            'meta'                  => ['nullable', 'array'],
            'meta.show_expected'    => ['nullable', 'boolean'],
            'meta.blind_count'      => ['nullable', 'boolean'],
            'meta.group_by'         => ['nullable', 'string', 'in:category,location,none'],
            'meta.orientation'      => ['nullable', 'string', 'in:portrait,landscape'],
            'meta.notes'            => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $result = $this->countSheet->build(
                $validated['store'],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build stock count sheet. Check items and try again.']], 422);
        }

        $this->usage->record('stock-count', $validated['meta']['orientation'] ?? 'portrait', null, [
            'total_items' => count($validated['items']),
            'blind_count' => !empty($validated['meta']['blind_count'] ?? false),
        ]);

        $filename = 'stock-count-sheet-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['store']['reference_no'] ?? 'audit') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Item-Count'        => (string) $result['totalItems'],
        ]);
    }
}
