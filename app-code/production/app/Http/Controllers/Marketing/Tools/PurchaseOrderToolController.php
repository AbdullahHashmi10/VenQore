<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\PurchaseOrderService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PurchaseOrderToolController extends Controller
{
    public function __construct(
        private readonly PurchaseOrderService $orders,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/PurchaseOrder', [
            'templates'       => PurchaseOrderService::TEMPLATES,
            'currencies'      => PurchaseOrderService::CURRENCIES,
            'maxItems'        => PurchaseOrderService::MAX_LINE_ITEMS,
            'suggestedNumber' => $this->orders->nextPoNumber(),
            'toolGroups'      => ToolRegistry::groups(),
        ]);
    }

    public function render(Request $request)
    {
        $validated = $request->validate([
            'buyer'                    => ['required', 'array'],
            'buyer.name'               => ['required', 'string', 'max:120'],
            'buyer.address'            => ['nullable', 'string', 'max:300'],
            'buyer.email'              => ['nullable', 'string', 'max:120'],
            'buyer.phone'              => ['nullable', 'string', 'max:60'],
            'buyer.tax_id'             => ['nullable', 'string', 'max:60'],
            'buyer.logo_base64'        => ['nullable', 'string', 'max:2000000'],
            'buyer.ship_to'            => ['nullable', 'string', 'max:300'],

            'vendor'                   => ['required', 'array'],
            'vendor.name'              => ['required', 'string', 'max:120'],
            'vendor.contact_person'    => ['nullable', 'string', 'max:120'],
            'vendor.address'           => ['nullable', 'string', 'max:300'],
            'vendor.email'             => ['nullable', 'string', 'max:120'],
            'vendor.phone'             => ['nullable', 'string', 'max:60'],

            'items'                    => ['required', 'array', 'min:1', 'max:' . PurchaseOrderService::MAX_LINE_ITEMS],
            'items.*.sku'              => ['nullable', 'string', 'max:60'],
            'items.*.description'      => ['required', 'string', 'max:200'],
            'items.*.quantity'         => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.unit_cost'        => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.tax_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],

            'meta'                     => ['nullable', 'array'],
            'meta.po_number'           => ['nullable', 'string', 'max:60'],
            'meta.order_date'          => ['nullable', 'string', 'max:30'],
            'meta.expected_date'       => ['nullable', 'string', 'max:30'],
            'meta.payment_terms'       => ['nullable', 'string', 'max:100'],
            'meta.shipping_cost'       => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'meta.currency'            => ['nullable', 'string', Rule::in(array_keys(PurchaseOrderService::CURRENCIES))],
            'meta.notes'               => ['nullable', 'string', 'max:1000'],
            'meta.authorized_by'       => ['nullable', 'string', 'max:120'],
            'meta.template'            => ['nullable', 'string', Rule::in(array_keys(PurchaseOrderService::TEMPLATES))],
            'meta.accent_color'        => ['nullable', 'string', 'max:9', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ]);

        try {
            $result = $this->orders->build(
                $validated['buyer'],
                $validated['vendor'],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that purchase order. Double-check your entries and try again.']], 422);
        }

        $this->usage->record('purchase-order', $validated['meta']['template'] ?? 'clean', null, [
            'line_items' => count($validated['items']),
            'currency'   => $validated['meta']['currency'] ?? 'USD',
            'has_logo'   => !empty($validated['buyer']['logo_base64']),
        ]);

        $filename = 'purchase-order-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['meta']['po_number'] ?? 'draft') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-PO-Total'          => (string) $result['total'],
        ]);
    }
}
