<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\CashDrawerCountSheetService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashDrawerCountSheetToolController extends Controller
{
    public function __construct(
        private readonly CashDrawerCountSheetService $countSheet,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/CashDrawerCountSheet', [
            'minRegisters'  => CashDrawerCountSheetService::MIN_REGISTERS,
            'maxRegisters'  => CashDrawerCountSheetService::MAX_REGISTERS,
            'currencies'    => CashDrawerCountSheetService::SUPPORTED_CURRENCIES,
            'toolGroups'    => ToolRegistry::groups(),
        ]);
    }

    public function render(Request $request)
    {
        $validated = $request->validate([
            'store'                       => ['required', 'array'],
            'store.name'                  => ['required', 'string', 'max:120'],
            'store.logo_base64'           => ['nullable', 'string', 'max:2000000'],

            'meta'                        => ['required', 'array'],
            'meta.currency'               => ['required', 'string', 'in:' . implode(',', CashDrawerCountSheetService::SUPPORTED_CURRENCIES)],
            'meta.register_count'         => ['required', 'integer', 'min:' . CashDrawerCountSheetService::MIN_REGISTERS, 'max:' . CashDrawerCountSheetService::MAX_REGISTERS],
            'meta.registers'              => ['nullable', 'array', 'max:' . CashDrawerCountSheetService::MAX_REGISTERS],
            'meta.registers.*.name'       => ['nullable', 'string', 'max:80'],
            'meta.registers.*.date'       => ['nullable', 'string', 'max:30'],
            'meta.registers.*.shift'      => ['nullable', 'string', 'max:60'],
            'meta.registers.*.counted_by' => ['nullable', 'string', 'max:80'],
            'meta.registers.*.verified_by'=> ['nullable', 'string', 'max:80'],
            'meta.notes'                  => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $result = $this->countSheet->build($validated['store'], $validated['meta']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build cash drawer count sheet. Check fields and try again.']], 422);
        }

        $this->usage->record('cash-drawer-count-sheet', $validated['meta']['currency'] ?? 'USD', null, [
            'register_count' => $result['registerCount'],
        ]);

        $filename = 'cash-drawer-count-sheet-' . now()->format('Ymd') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Register-Count'    => (string) $result['registerCount'],
        ]);
    }
}
