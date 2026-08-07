<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\CashDrawerService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * CashDrawerToolController — free Cash Drawer Count Sheet & Till Reconciliation generator.
 */
class CashDrawerToolController extends Controller
{
    public function __construct(
        private readonly CashDrawerService $cashDrawer,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/CashDrawer', [
            'currencies' => CashDrawerService::CURRENCIES,
            'defaultDenominations' => [
                'USD' => $this->cashDrawer->getDefaultDenominations('USD'),
                'EUR' => $this->cashDrawer->getDefaultDenominations('EUR'),
                'GBP' => $this->cashDrawer->getDefaultDenominations('GBP'),
            ],
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/cash-drawer-count-sheet/render — throttle:tools
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'store' => ['required', 'array'],
            'store.name' => ['required', 'string', 'max:120'],
            'store.location' => ['nullable', 'string', 'max:120'],
            'store.cashier_name' => ['nullable', 'string', 'max:120'],
            'store.supervisor_name' => ['nullable', 'string', 'max:120'],
            'store.register_id' => ['nullable', 'string', 'max:60'],
            'store.shift_date' => ['nullable', 'string', 'max:30'],
            'store.notes' => ['nullable', 'string', 'max:1000'],

            'denominations' => ['required', 'array', 'min:1', 'max:100'],
            'denominations.*.name' => ['required', 'string', 'max:100'],
            'denominations.*.type' => ['required', 'string', Rule::in(['bill', 'coin'])],
            'denominations.*.value' => ['required', 'numeric', 'min:0', 'max:100000'],
            'denominations.*.count' => ['required', 'integer', 'min:0', 'max:1000000'],

            'meta' => ['nullable', 'array'],
            'meta.currency' => ['nullable', 'string', Rule::in(array_keys(CashDrawerService::CURRENCIES))],
            'meta.opening_float' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'meta.expected_cash_sales' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'meta.expected_cash_total' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
        ]);

        try {
            $result = $this->cashDrawer->build(
                $validated['store'],
                $validated['denominations'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build cash drawer count sheet. Please check entries and try again.']], 422);
        }

        $this->usage->record('cash-drawer', 'default', null, [
            'total_counted' => $result['totalCountedCash'],
            'variance' => $result['variance'],
            'currency' => $validated['meta']['currency'] ?? 'USD',
        ]);

        $filename = 'cash-drawer-count-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['store']['shift_date'] ?? date('Y-m-d')) . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Counted-Total' => (string) $result['totalCountedCash'],
            'X-Variance' => (string) $result['variance'],
        ]);
    }
}
