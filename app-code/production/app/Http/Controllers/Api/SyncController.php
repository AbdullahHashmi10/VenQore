<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Queries\PartyBalanceQuery;

class SyncController extends Controller
{
    /**
     * Resolve the current store ID from the authenticated user.
     */
    private function getStoreId(): ?int
    {
        // SEC-02: the store comes ONLY from the EnsureActiveStoreMembership
        // middleware (active membership proven). Never trust last_store_id here.
        return app()->bound('current.tenant') && app()->bound('current.membership')
            ? (int) app('current.tenant')->id
            : null;
    }

    /**
     * Returns the active staff list (id, name, role).
     *
     * SEC-10 (2026-09-10): this used to return tenant_users.pos_pin (the PIN
     * hash) for every staff member to any authenticated caller, enabling offline
     * guessing of short PINs. PIN verifiers are no longer distributed. Offline
     * staff unlock must be redesigned around device enrollment (see audit).
     */
    public function users(Request $request)
    {
        $storeId = $this->getStoreId();

        if (!$storeId) {
            return response()->json([]);
        }

        $staff = DB::table('users')
            ->join('tenant_users', 'users.id', '=', 'tenant_users.user_id')
            ->where('tenant_users.tenant_id', $storeId)
            ->where('tenant_users.status', 'active')
            ->whereNull('users.deleted_at')
            ->select([
                'users.id',
                'users.name',
                'tenant_users.role',
            ])
            ->get();

        return response()->json($staff);
    }

    /**
     * Fetch all products for offline use
     */
    public function products()
    {
        $storeId = $this->getStoreId();
        if (!$storeId) return response()->json([]);

        $products = \App\Models\Product::with(['category', 'variants'])
            ->where('tenant_id', $storeId)
            ->whereNull('deleted_at')
            ->get();

        // Get V3 stock totals
        $stockTotals = DB::table('inventory_batches')
            ->select('product_id', DB::raw('SUM(remaining_qty) as total'))
            ->where('tenant_id', $storeId)
            ->whereNull('deleted_at')
            ->groupBy('product_id')
            ->pluck('total', 'product_id');

        // Dynamically override stock_quantity with current batch sums
        foreach ($products as $product) {
            $product->stock_quantity = (float)($stockTotals[$product->id] ?? 0);
        }

        return response()->json($products);
    }

    /**
     * Fetch all customers (Party type 'customer')
     */
    public function customers()
    {
        $storeId = $this->getStoreId();
        if (!$storeId) return response()->json([]);

        $tenant = \App\Models\Tenant::withoutGlobalScopes()->find($storeId);
        $hasKhata = $tenant ? \App\Services\PlanRepository::canUseFeature($tenant, 'customer_khata') : true;

        $customers = \App\Models\Party::where('tenant_id', $storeId)
            ->where('type', 'customer')
            ->get()
            ->map(function($party) use ($storeId, $hasKhata) {
                $party->current_balance = $hasKhata ? PartyBalanceQuery::partyNetBalance(
                    $party->id,
                    $storeId,
                    'customer'
                ) : 0.0;
                return $party;
            });

        return response()->json($customers);
    }

    /**
     * Fetch all suppliers (Party type 'supplier')
     */
    public function suppliers()
    {
        $storeId = $this->getStoreId();
        if (!$storeId) return response()->json([]);

        $tenant = \App\Models\Tenant::withoutGlobalScopes()->find($storeId);
        $hasKhata = $tenant ? \App\Services\PlanRepository::canUseFeature($tenant, 'supplier_khata') : true;

        $suppliers = \App\Models\Party::where('tenant_id', $storeId)
            ->where('type', 'supplier')
            ->get()
            ->map(function($party) use ($storeId, $hasKhata) {
                $party->current_balance = $hasKhata ? PartyBalanceQuery::partyNetBalance(
                    $party->id,
                    $storeId,
                    'supplier'
                ) : 0.0;
                return $party;
            });

        return response()->json($suppliers);
    }

    /**
     * Fetch current inventory levels
     */
    public function inventory()
    {
        $storeId = $this->getStoreId();
        if (!$storeId) return response()->json([]);

        $tenant = \App\Models\Tenant::withoutGlobalScopes()->find($storeId);
        if ($tenant && ! \App\Services\PlanRepository::canUseFeature($tenant, 'stock_levels_view')) {
            return response()->json([]);
        }

        $batches = DB::table('inventory_batches')
            ->select('product_id', 'warehouse_id', DB::raw('SUM(remaining_qty) as total'))
            ->where('tenant_id', $storeId)
            ->whereNull('deleted_at')
            ->groupBy('product_id', 'warehouse_id')
            ->get();

        return response()->json($batches->map(function ($b) {
            return [
                'id' => $b->product_id . '-' . $b->warehouse_id,
                'product_id' => $b->product_id,
                'godown_id' => $b->warehouse_id,
                'quantity' => (float)$b->total,
            ];
        }));
    }

    public function taxes()
    {
        return response()->json([]);
    }

    public function batchOrders(Request $request)
    {
        $orders = $request->input('orders');
        if (empty($orders)) {
            return response()->json(['message' => 'No orders provided'], 422);
        }

        $storeId = $this->getStoreId();
        if (!$storeId) {
            return response()->json(['message' => 'Unauthorized: no active store context'], 403);
        }

        // SEC-02: batch sync creates sales — require the same permission as the
        // POS/sales routes instead of bypassing route-level checks.
        $perms = (array) (auth()->user()->permissions ?? []);
        if (! in_array('*', $perms, true) && ! in_array('sales.create', $perms, true) && ! in_array('pos', $perms, true)) {
            return response()->json(['message' => 'You do not have permission to record sales.'], 403);
        }

        if (is_array($orders) && count($orders) > 200) {
            return response()->json(['message' => 'Too many orders in one batch (max 200).'], 422);
        }

        $tenant = \App\Models\Tenant::withoutGlobalScopes()->find($storeId);
        if (!$tenant) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        if (!\App\Services\ModuleService::enabled($tenant, 'pos')) {
            return response()->json([
                'message' => 'The POS module is currently disabled for this store.',
                'error'   => 'module_disabled',
                'module'  => 'pos',
            ], 409);
        }

        if (!app()->bound('current.tenant')) {
            app()->instance('current.tenant', $tenant);
        }

        try {
            $syncedCount = 0;
            DB::transaction(function () use ($orders, $tenant, &$syncedCount) {
                foreach ($orders as $orderData) {
                    $clientSaleId = $orderData['client_sale_id'] ?? $orderData['id'] ?? null;
                    if ($clientSaleId) {
                        $alreadySynced = \App\Models\Sale::withoutGlobalScope('tenant')
                            ->where('tenant_id', $tenant->id)
                            ->where(function ($q) use ($clientSaleId) {
                                $q->where('client_sale_id', (string) $clientSaleId)
                                  ->orWhere('idempotency_key', (string) $clientSaleId);
                            })
                            ->exists();

                        if ($alreadySynced) {
                            $syncedCount++;
                            continue;
                        }
                    }

                    try {
                        if ($clientSaleId && empty($orderData['idempotency_key'])) {
                            $orderData['idempotency_key'] = (string) $clientSaleId;
                        }
                        if ($clientSaleId && empty($orderData['client_sale_id'])) {
                            $orderData['client_sale_id'] = (string) $clientSaleId;
                        }

                        $syntheticRequest = new Request($orderData);
                        $syntheticRequest->setUserResolver(fn () => auth()->user());

                        $response = app(\App\Http\Controllers\SaleController::class)->store($syntheticRequest);
                        $statusCode = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 200;
                        if ($statusCode >= 200 && $statusCode < 300) {
                            $syncedCount++;
                        }
                    } catch (\Throwable $e) {
                        Log::error('Offline Sync Error: ' . $e->getMessage(), [
                            'tenant_id' => $tenant->id,
                            'client_sale_id' => $clientSaleId,
                        ]);
                    }
                }
            });
            return response()->json(['status' => 'synced', 'count' => $syncedCount]);
        } catch (\Throwable $e) {
            Log::error('Offline batch sync transaction failed: ' . $e->getMessage());
            return response()->json(['message' => 'Sync failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkConnection()
    {
        return response()->json(['status' => 'ok']);
    }
}
