<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\LedgerService;

class SyncController extends Controller
{
    /**
     * Resolve the current store ID from the authenticated user.
     */
    private function getStoreId(): ?int
    {
        $user = auth()->user();
        return $user ? (int) $user->last_store_id : null;
    }

    /**
     * Returns staff list with hashed PINs for offline authentication.
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
                'tenant_users.pos_pin as passcode' 
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

        $customers = \App\Models\Party::where('tenant_id', $storeId)
            ->where('type', 'customer')
            ->get()
            ->map(function($party) use ($storeId) {
                $party->current_balance = LedgerService::partyNetBalance(
                    $party->id,
                    $storeId,
                    'customer'
                );
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

        $suppliers = \App\Models\Party::where('tenant_id', $storeId)
            ->where('type', 'supplier')
            ->get()
            ->map(function($party) use ($storeId) {
                $party->current_balance = LedgerService::partyNetBalance(
                    $party->id,
                    $storeId,
                    'supplier'
                );
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
        if (empty($orders)) return response()->json(['message' => 'No orders provided'], 422);

        try {
            DB::transaction(function () use ($orders) {
                foreach ($orders as $orderData) {
                    if (\App\Models\Sale::where('id', $orderData['id'])->exists()) continue; 
                    try {
                        $syntheticRequest = new Request($orderData);
                        app(\App\Http\Controllers\SaleController::class)->store($syntheticRequest);
                    } catch (\Exception $e) {
                        Log::error('Offline Sync Error: ' . $e->getMessage());
                    }
                }
            });
            return response()->json(['status' => 'synced', 'count' => count($orders)]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Sync failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkConnection()
    {
        return response()->json(['status' => 'ok']);
    }
}
