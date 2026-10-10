<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSaleRequest;
use App\Engines\SaleService;
use App\Services\PlanGate;
use App\Models\Sale;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\Approval\ApprovalExecutionEngine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SaleController extends Controller
{
    public function __construct(
        private SaleService $sales,
        private ApprovalPolicyResolver $policyResolver,
        private ApprovalExecutionEngine $approvalEngine
    ) {}

    public function store(StoreSaleRequest $request)
    {
        $tenantId = app('current.tenant')->id;
        $tenant   = app('current.tenant');
        $lock = \Illuminate\Support\Facades\Cache::lock("tenant_{$tenantId}_checkout_lock", 10);

        try {
            $lock->block(5); // Wait up to 5 seconds to acquire the lock

            $data = $request->validated();
            $items = $data['items'] ?? [];
            foreach ($items as $idx => $item) {
                if (empty($item['product_id']) && (!empty($item['description']) || !empty($item['name']))) {
                    $desc = trim($item['description'] ?? $item['name']);
                    $adHocProduct = \App\Models\Product::firstOrCreate(
                        [
                            'tenant_id' => $tenantId,
                            'name'      => $desc,
                            'type'      => 'service',
                        ],
                        [
                            'sku'        => 'SRV-' . strtoupper(substr(md5($desc . $tenantId), 0, 8)),
                            'price'      => (float)($item['unit_price'] ?? 0),
                            'cost_price' => 0,
                            'tax_rate'   => (float)($item['tax_rate'] ?? 0),
                            'is_active'  => true,
                        ]
                    );
                    $items[$idx]['product_id'] = $adHocProduct->id;
                }
            }
            $data['items'] = $items;

            // ── Maker-Checker Approval Interception for Administrative/V3 Sales ──
            // R01 FIX: The V3 sales API (POST s/{slug}/v3/sales) is an administrative
            // endpoint, not the POS checkout route. POS clearance MUST NOT be granted here.
            //
            // The correct POS checkout route is POST /pos/sales → PosSaleController, which
            // server-verifies the register shift and passes isTrustedPos=true from a
            // server-controlled source.
            //
            // The following client-controlled signals were incorrectly treated as POS trust:
            //   - $isPosRequest (Referer header containing '/pos'): trivially forgeable HTTP
            //     header that any client can set to any value
            //   - !empty($data['approved_by']): manager PIN approves below-cost/discounted
            //     products at the line level, NOT the document-level approval workflow
            //   - $hasActiveShift: a cashier's open shift does NOT exempt admin API invoices
            //     from the approval policy
            //
            // isTrustedPos is always false on this route.
            $user = auth()->user();
            $isTrustedPos = false; // Admin V3 API route: never POS-cleared

            // Best-effort pre-post total for the threshold check. SaleService::post()
            // remains the single source of truth for the actual posted total; this
            // estimate is only used to decide whether approval is required.
            $estimatedTotal = 0.0;
            foreach ($items as $item) {
                $qty        = (float)($item['qty'] ?? 0);
                $unitPrice  = (float)($item['unit_price'] ?? 0);
                $discountPc = (float)($item['discount_percent'] ?? 0);
                $taxRate    = (float)($item['tax_rate'] ?? 0);
                $gross      = $qty * $unitPrice;
                $net        = max(0, $gross - ($gross * $discountPc / 100));
                $estimatedTotal += $net + ($net * $taxRate / 100);
            }

            $policy = $this->policyResolver->resolve(
                tenant: $tenant,
                user: $user,
                documentType: ApprovalDocument::TYPE_SALES_INVOICE,
                amount: $estimatedTotal,
                isTrustedPos: $isTrustedPos
            );

            if ($policy['requires_approval']) {
                $doc = $this->approvalEngine->submit(
                    tenant: $tenant,
                    maker: $user,
                    documentType: ApprovalDocument::TYPE_SALES_INVOICE,
                    payload: array_diff_key($data, ['approval_pin' => '']),
                    amount: $estimatedTotal,
                    description: 'Sales invoice — ' . ($data['client_sale_id'] ?? ''),
                    idempotencyKey: $request->header('Idempotency-Key') ?: ($data['idempotency_key'] ?? null)
                );

                if ($request->wantsJson() || $request->expectsJson()) {
                    return response()->json([
                        'status'               => 'pending_approval',
                        'approval_document_id' => $doc->id,
                        'document_number'      => $doc->document_number,
                        'message'              => 'Sale submitted for approval.',
                    ], 202);
                }

                return redirect()->back()->with([
                    'info'    => 'Sale submitted for approval (ref: ' . $doc->document_number . ').',
                    'status'  => 'pending_approval',
                ]);
            }

            // The approval PIN is verified by StoreSaleRequest; it never travels further.
            $sale = $this->sales->post(\Illuminate\Support\Arr::except($data, ['approval_pin']));
        } catch (\App\Exceptions\BelowCostSaleException $e) {
            // S-011: surface as a validation error on approved_by (was an unhandled 500).
            throw \Illuminate\Validation\ValidationException::withMessages(['approved_by' => $e->getMessage()]);
        } finally {
            $lock->release();
        }

        // ── Loyalty auto-award (2026-07-03) — plan-gated, never blocks the sale ──
        $this->awardLoyaltyPointsForSale($sale);

        return redirect()->back()->with([
            'success'    => 'Sale posted successfully.',
            'invoice_id' => $sale->id,
            'invoice_no' => $sale->reference_number,
            'status'     => 'success',
        ]);
    }

    /**
     * Award loyalty points for a posted sale (2026-07-03).
     *
     * - Gated on the `loyalty_points` plan key (Enterprise/ltd_3 per the seeder),
     *   matching the pricing page's "Loyalty & Gift Cards — Enterprise" promise.
     * - Earn rate: `loyalty_earn_rate` in ai_settings = points per 100 currency
     *   units of the sale total (default 1). Configurable per tenant.
     * - NON-FATAL: any failure is logged and swallowed. Loyalty must never
     *   roll back or delay a posted sale — the money engine stays untouched.
     */
    private function awardLoyaltyPointsForSale($sale): void
    {
        try {
            if (!$sale || !$sale->party_id) {
                return;
            }
            if (!\App\Services\PlanGate::check('loyalty_points')) {
                return;
            }

            $tenantId = app('current.tenant')->id;
            $rate = (float) (\Illuminate\Support\Facades\DB::table('ai_settings')
                ->where('tenant_id', $tenantId)
                ->where('key', 'loyalty_earn_rate')
                ->value('value') ?? 1);

            $total  = (float) ($sale->total_amount ?? 0);
            $points = (int) floor(($total / 100) * $rate);

            if ($points < 1) {
                return;
            }

            \App\Models\LoyaltyBalance::awardPoints(
                $sale->party_id,
                $points,
                'Points earned on sale ' . ($sale->reference_number ?? $sale->id),
                null
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Loyalty auto-award failed (sale unaffected): ' . $e->getMessage(), [
                'sale_id' => $sale->id ?? null,
            ]);
        }
    }

    public function goodsOut(\Illuminate\Http\Request $request)
    {
        $tenantId = app('current.tenant')->id;
        $selectedId = $request->input('sale_id');

        $pendingSales = DB::table('sales')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.delivery_status', ['pending', 'partial'])
            ->whereIn('sales.status', ['posted', 'partially_returned'])
            ->whereNull('sales.deleted_at')
            ->leftJoin('parties', 'sales.customer_id', '=', 'parties.id')
            ->select('sales.*', 'parties.name as customer_name')
            ->orderBy('sales.created_at', 'desc')
            ->get();

        $saleIds = $pendingSales->pluck('id')->all();

        $itemsBySale = DB::table('sale_items')
            ->where('sale_items.tenant_id', $tenantId)
            ->whereIn('sale_items.sale_id', $saleIds)
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select(
                'sale_items.*',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get()
            ->groupBy('sale_id');

        $salesWithItems = $pendingSales->map(function ($s) use ($itemsBySale) {
            $s->items = $itemsBySale[$s->id] ?? collect();
            return $s;
        });

        $warehouses = DB::table('warehouses')->where('tenant_id', $tenantId)->whereNull('deleted_at')
            ->where('is_active', 1)->orderByDesc('is_default')->orderBy('name')->get(['id', 'name', 'location']);

        // product_id => [warehouse_id => qty on hand], so the dispatcher sees where stock really is.
        $productIds = $itemsBySale->flatten(1)->pluck('product_id')->unique()->values()->all();
        $availability = [];
        if ($productIds) {
            $rows = DB::table('inventory_batches')->where('tenant_id', $tenantId)
                ->whereIn('product_id', $productIds)->where('remaining_qty', '>', 0)
                ->groupBy('product_id', 'warehouse_id')
                ->selectRaw('product_id, warehouse_id, SUM(remaining_qty) as qty')->get();
            foreach ($rows as $r) {
                $availability[$r->product_id][$r->warehouse_id] = (float) $r->qty;
            }
        }

        return \Inertia\Inertia::render('V3/Sales/GoodsOut', [
            'warehouses'     => $warehouses,
            'availability'   => $availability,
            'pendingSales'   => $salesWithItems,
            'selectedSaleId' => $selectedId,
        ]);
    }

    public function storeDispatch(\Illuminate\Http\Request $request, string $id)
    {
        $tenantId = app('current.tenant')->id;
        $tenant   = app('current.tenant');
        $user     = Auth::user();

        $request->validate([
            'items'                      => ['required', 'array', 'min:1'],
            'items.*.sale_item_id'       => ['required', 'string'],
            'items.*.dispatching_qty'    => ['required', 'numeric', 'min:0'],
            'warehouse_id'               => ['nullable', \Illuminate\Validation\Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId)->whereNull('deleted_at')],
            'tracking_number'            => ['nullable', 'string', 'max:100'],
            'carrier_name'               => ['nullable', 'string', 'max:100'],
            'notes'                      => ['nullable', 'string'],
        ]);

        $items = $request->input('items');

        // Estimate total value being dispatched for approval check
        $lineIds = collect($items)->pluck('sale_item_id')->filter()->all();
        $pricesByLine = DB::table('sale_items')->where('tenant_id', $tenantId)->whereIn('id', $lineIds)->pluck('unit_price', 'id');
        $estimatedAmount = 0.0;
        foreach ($items as $line) {
            $qty = (float)($line['dispatching_qty'] ?? 0);
            $price = (float)($pricesByLine[$line['sale_item_id']] ?? 0);
            $estimatedAmount += $qty * $price;
        }

        $policy = resolve(ApprovalPolicyResolver::class)->resolve(
            tenant:       $tenant,
            user:         $user,
            documentType: ApprovalDocument::TYPE_SALES_INVOICE,
            amount:       $estimatedAmount,
        );

        if ($policy['requires_approval']) {
            $doc = resolve(ApprovalExecutionEngine::class)->submit(
                tenant:         $tenant,
                maker:          $user,
                documentType:   ApprovalDocument::TYPE_SALES_INVOICE,
                payload:        [
                    '_path'           => 'dispatch',
                    'sale_id'         => $id,
                    'items'           => $items,
                    'warehouse_id'    => $request->input('warehouse_id'),
                    'tracking_number' => $request->input('tracking_number'),
                    'carrier_name'    => $request->input('carrier_name'),
                    'notes'           => $request->input('notes'),
                ],
                amount:         $estimatedAmount,
                description:    'Goods delivery dispatch against sale #' . $id,
                idempotencyKey: $request->header('Idempotency-Key'),
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'pending_approval' => true,
                    'document_number'  => $doc->document_number,
                    'message'          => 'Goods dispatch submitted for approval.',
                ], 202);
            }

            return redirect()->route('store.sales.index', ['store_slug' => $tenant->slug])
                ->with('info', 'Goods dispatch submitted for approval (ref: ' . $doc->document_number . ').');
        }

        // Direct Execution
        try {
            $result = app(\App\Services\DeliveryChallanService::class)->dispatch(
                (int) $tenantId, (string) $id, $items, $request->input('warehouse_id'),
                $request->only(['carrier_name', 'tracking_number', 'notes']), (int) $user->id
            );
        } catch (\DomainException | \App\Exceptions\InsufficientStockException $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['dispatch' => $e->getMessage()]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Goods dispatched. Delivery challan created.',
                'delivery_status' => $result->delivery_status,
                'challan_id' => $result->challan_id,
                'challan_url' => route('store.delivery-challans.print', ['store_slug' => $tenant->slug, 'challan' => $result->challan_id]),
            ]);
        }

        return redirect()->route('store.sales.index', ['store_slug' => $tenant->slug])
            ->with('success', 'Goods dispatched. Delivery challan created.');
    }

    /**
     * Stock batches a seller may choose from for one product, oldest first.
     * Cost is deliberately not exposed here.
     */
    public function productBatches(\Illuminate\Http\Request $request, string $productId)
    {
        $tenantId = app('current.tenant')->id;
        // The warehouse a sale lands in when none is chosen (same default store() uses).
        $warehouseId = $request->input('warehouse_id') ?: \App\Models\Warehouse::first()?->id;

        $rows = DB::table('inventory_batches as b')
            ->leftJoin('purchases as p', 'p.id', '=', 'b.purchase_invoice_id')
            ->where('b.tenant_id', $tenantId)
            ->where('b.product_id', $productId)
            ->when($warehouseId, fn ($q) => $q->where('b.warehouse_id', $warehouseId))
            ->where('b.remaining_qty', '>', 0)
            ->whereNull('b.deleted_at')
            ->orderBy('b.created_at')->orderBy('b.seq')
            ->select('b.id', 'b.created_at', 'b.expiry_date', 'b.remaining_qty', 'b.batch_type', 'p.invoice_number as purchase_ref')
            ->limit(100)
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'received_on'  => substr((string) $r->created_at, 0, 10),
                'expiry_date'  => $r->expiry_date,
                'remaining'    => (float) $r->remaining_qty,
                'reference'    => $r->purchase_ref,
                'is_opening'   => $r->batch_type !== null && $r->batch_type !== 'purchase',
            ]);

        return response()->json(['batches' => $rows]);
    }
}
