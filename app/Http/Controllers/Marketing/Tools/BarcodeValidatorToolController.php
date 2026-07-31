<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\BarcodeService;
use App\Services\Tools\ToolUsageRecorder;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * BarcodeValidatorToolController — T10.
 * Entirely free, no gate at all (plan §7 T10) — exists to earn links.
 */
class BarcodeValidatorToolController extends Controller
{
    public function __construct(
        private readonly BarcodeService $barcodes,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index(Request $request)
    {
        // ?value= lets the generator's inline check deep-link straight into
        // the full breakdown without the user retyping the number.
        $prefill = (string) $request->query('value', '');

        return Inertia::render('Marketing/Tools/BarcodeValidator', [
            'prefill'    => mb_substr($prefill, 0, 32),
            'toolGroups' => \App\Support\ToolRegistry::groups(),
        ]);
    }

    public function validateGtin(Request $request)
    {
        $validated = $request->validate([
            'value' => ['required', 'string', 'max:32'],
        ]);

        try {
            $result = $this->barcodes->validateGtin($validated['value']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }

        $this->usage->record('barcode-validator', null, null, [
            'valid' => $result['valid'],
            'length' => strlen(preg_replace('/[\s\-]/', '', $validated['value'])),
        ]);

        return response()->json($result);
    }
}
