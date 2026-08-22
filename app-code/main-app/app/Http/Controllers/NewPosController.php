<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\BankAccount;
use App\Models\Warehouse;
use App\Models\EcommerceChannel;
use App\Models\Setting;
use App\Models\Party;
use Illuminate\Support\Facades\Storage;

class NewPosController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $tenantId = $tenant?->id;

        // Recalled sale if recall param is present
        $recalledSale = null;
        if ($request->has('recall')) {
            $recalledSale = Sale::with([
                'items.product.category',
                'items.product.stocks',
                'items.productVariant',
                'customer'
            ])->find($request->recall);

            if ($recalledSale) {
                $recalledSale->items->transform(function ($item) {
                    if ($item->product && $item->product->image_path) {
                        $item->product->image_path = Storage::url($item->product->image_path);
                    }
                    return $item;
                });
            }
        }

        // Bank accounts: filter out cash accounts
        $bankAccountsQuery = BankAccount::where(function ($query) {
                $query->whereNull('account_type')
                      ->orWhere('account_type', '!=', 'cash');
            })
            ->where(function ($query) {
                $query->whereNull('type')
                      ->orWhere('type', '!=', 'cash');
            });
        
        if ($tenantId) {
            $bankAccountsQuery->where('tenant_id', $tenantId);
        }
        $bankAccounts = $bankAccountsQuery->get(['id', 'name', 'account_number as code', 'account_number']);

        // Default walk-in customer party
        $defaultCustomer = null;
        if ($tenantId) {
            $defaultCustomer = Party::where('tenant_id', $tenantId)
                ->where(function ($q) {
                    $q->where('name', 'LIKE', '%Walk-in%')
                      ->orWhere('name', 'LIKE', '%Cash Customer%')
                      ->orWhere('name', 'LIKE', '%Counter Customer%');
                })
                ->first();
        }

        // Warehouses
        $warehousesQuery = Warehouse::query();
        if ($tenantId) {
            $warehousesQuery->where('tenant_id', $tenantId);
        }
        $warehouses = $warehousesQuery->get(['id', 'name', 'is_default']);
        if ($warehouses->isEmpty()) {
            $warehouses = Warehouse::all(['id', 'name', 'is_default']);
        }

        // Ecommerce Channels
        $ecommerceChannels = $tenantId
            ? EcommerceChannel::where('tenant_id', $tenantId)->get(['id', 'name', 'platform', 'default_fulfillment_type'])
            : collect();

        // Settings map
        $settings = Setting::all()->pluck('value', 'key');

        return Inertia::render('NewPos', [
            'recalledSale'      => $recalledSale,
            'bankAccounts'      => $bankAccounts,
            'warehouses'        => $warehouses,
            'ecommerceChannels' => $ecommerceChannels,
            'settings'          => $settings,
            'defaultCustomer'   => $defaultCustomer,
            'store'             => $tenant,
            'auth'              => [
                'user' => $request->user(),
            ],
        ]);
    }
}
