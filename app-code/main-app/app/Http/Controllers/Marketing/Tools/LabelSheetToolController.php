<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\LabelSheetService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * LabelSheetToolController — Free Label Sheet Generator controller.
 *
 * General-purpose Avery-compatible TEXT label sheets (addresses, warnings,
 * folder tabs, name badges) — NOT barcode-specific, NOT price-tag-specific.
 * UNGATED — no email required, standard throttle:tools limiter only.
 */
class LabelSheetToolController extends Controller
{
    public function __construct(
        private readonly LabelSheetService $sheets,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/LabelSheet', [
            'sheetPresets' => LabelSheetService::presetOptions(),
            'maxRows'      => LabelSheetService::MAX_ROWS,
            'maxCopies'    => LabelSheetService::MAX_COPIES,
            'maxRowQty'    => LabelSheetService::MAX_ROW_QTY,
            'toolGroups'   => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/label-sheet-generator/parse — throttle:tools
     * Parses blank-line-separated bulk-paste text into structured label rows.
     */
    public function parse(Request $request)
    {
        $validated = $request->validate([
            'bulk_text' => ['required', 'string', 'max:50000'],
        ]);

        try {
            $items = $this->sheets->parseBulkText($validated['bulk_text']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }

        return response()->json([
            'items' => $items,
            'count' => count($items),
        ]);
    }

    /**
     * POST /tools/label-sheet-generator/sheet — throttle:tools
     * Builds and streams a PDF of text labels.
     */
    public function sheet(Request $request)
    {
        $validated = $request->validate([
            'items'              => ['required', 'array', 'min:1', 'max:' . LabelSheetService::MAX_ROWS],
            'items.*.line1'      => ['nullable', 'string', 'max:120'],
            'items.*.line2'      => ['nullable', 'string', 'max:120'],
            'items.*.line3'      => ['nullable', 'string', 'max:120'],
            'items.*.align'      => ['nullable', 'string', Rule::in(['left', 'center'])],
            'items.*.bold_first' => ['nullable', 'boolean'],
            'items.*.qty'        => ['nullable', 'integer', 'min:1', 'max:' . LabelSheetService::MAX_ROW_QTY],
            'preset'             => ['required', 'string', Rule::in(array_keys(LabelSheetService::PRESETS))],
            'copies'             => ['required', 'integer', 'min:1', 'max:' . LabelSheetService::MAX_COPIES],
        ]);

        try {
            $pdf = $this->sheets->build(
                preset: $validated['preset'],
                rows: $validated['items'],
                options: ['copies' => $validated['copies']],
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not generate the label sheet PDF. Double check inputs and try again.']], 422);
        }

        $this->usage->record('label-sheet', $validated['preset'], null, [
            'item_count' => count($validated['items']),
            'copies'     => $validated['copies'],
        ]);

        $filename = 'label-sheet-' . $validated['preset'] . '.pdf';

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
