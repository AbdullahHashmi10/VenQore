<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\ReceiptService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * ReceiptToolController — free PDF POS receipt generator.
 *
 * No persistence: store profile round-trips through request & localStorage.
 * Ungated, free, throttle:tools.
 */
class ReceiptToolController extends Controller
{
    public function __construct(
        private readonly ReceiptService $receipts,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/Receipt', [
            'paperPresets'    => ReceiptService::PAPER_PRESETS,
            'paymentMethods'  => ReceiptService::PAYMENT_METHODS,
            'currencies'      => ReceiptService::CURRENCIES,
            'maxItems'        => ReceiptService::MAX_LINE_ITEMS,
            'suggestedNumber' => $this->receipts->nextReceiptNumber(),
            'toolGroups'      => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/receipt-generator/render — throttle:tools
     * Free, ungated, no watermark PDF generation.
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'store'                          => ['required', 'array'],
            'store.name'                     => ['required', 'string', 'max:120'],
            'store.address'                  => ['nullable', 'string', 'max:300'],
            'store.phone'                    => ['nullable', 'string', 'max:60'],
            'store.logo_base64'              => ['nullable', 'string', 'max:2000000'],
            'store.footer_message'          => ['nullable', 'string', 'max:500'],

            'items'                          => ['required', 'array', 'min:1', 'max:' . ReceiptService::MAX_LINE_ITEMS],
            'items.*.name'                   => ['required', 'string', 'max:200'],
            'items.*.quantity'               => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.unit_price'             => ['required', 'numeric', 'min:0', 'max:1000000'],

            'meta'                           => ['nullable', 'array'],
            'meta.receipt_number'            => ['nullable', 'string', 'max:60'],
            'meta.date_time'                 => ['nullable', 'string', 'max:60'],
            'meta.cashier'                   => ['nullable', 'string', 'max:120'],
            'meta.returns_policy_days'       => ['nullable', 'numeric', 'min:0', 'max:365'],
            'meta.paper_preset'              => ['nullable', 'string', Rule::in(array_keys(ReceiptService::PAPER_PRESETS))],
            'meta.currency'                  => ['nullable', 'string', Rule::in(array_keys(ReceiptService::CURRENCIES))],
            'meta.payment_method'            => ['nullable', 'string', Rule::in(ReceiptService::PAYMENT_METHODS)],
            'meta.amount_tendered'           => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'meta.tax_rate'                  => ['nullable', 'numeric', 'min:0', 'max:100'],
            'meta.discount_value'            => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'meta.discount_type'             => ['nullable', 'string', Rule::in(ReceiptService::DISCOUNT_TYPES)],
        ]);

        try {
            $result = $this->receipts->build(
                $validated['store'],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that receipt. Double-check your line items and try again.']], 422);
        }

        $this->usage->record('receipt', $validated['meta']['paper_preset'] ?? 'thermal_80mm', null, [
            'line_items'     => count($validated['items']),
            'currency'       => $validated['meta']['currency'] ?? 'USD',
            'payment_method' => $validated['meta']['payment_method'] ?? 'Cash',
            'has_logo'       => !empty($validated['store']['logo_base64']),
        ]);

        $filename = 'receipt-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['meta']['receipt_number'] ?? 'draft') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Receipt-Total'     => (string) $result['total'],
        ]);
    }
}
