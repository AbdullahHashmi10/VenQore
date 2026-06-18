<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\V3\AccountingService;

class PosReturnController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.001',
            'items.*.price'      => 'required|numeric|min:0',
            'refund_method'      => 'nullable|string',
            'reason'             => 'nullable|string',
        ]);

        $returnTotal = 0;
        $returnRef   = null;

        try {
            DB::transaction(function () use ($request, &$returnTotal, &$returnRef) {

                $tenant  = app('current.tenant');
                $items   = $request->input('items');
                $reason  = $request->input('reason', 'POS Open Return');

                $returnTotal = collect($items)->sum(fn($i) => $i['price'] * $i['quantity']);
                $returnRef   = 'RET-' . strtoupper(uniqid());

                // Create return sale record
                $sale = Sale::create([
                    'tenant_id'        => $tenant->id,
                    'user_id'          => Auth::id(),
                    'reference_number' => $returnRef,
                    'status'           => 'returned',
                    'payment_status'   => 'paid',
                    'payment_method'   => $request->input('refund_method', 'cash'),
                    'subtotal'         => $returnTotal,
                    'tax'              => 0,
                    'discount'         => 0,
                    'total'            => $returnTotal,
                    'net_sales'        => $returnTotal,
                    'invoice_total'    => $returnTotal,
                    'notes'            => $reason,
                    'posted_at'        => now(),
                ]);

                // Create sale items and restore stock
                foreach ($items as $item) {
                    SaleItem::create([
                        'sale_id'    => $sale->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'],
                        'unit_price' => $item['price'],
                        'net_amount' => $item['price'] * $item['quantity'],
                        'subtotal'   => $item['price'] * $item['quantity'],
                        'line_total' => $item['price'] * $item['quantity'],
                    ]);

                    // Restore stock across all batches for this product
                    DB::table('stocks')
                        ->where('product_id', $item['product_id'])
                        ->where('tenant_id', $tenant->id)
                        ->limit(1)
                        ->increment('quantity', $item['quantity']);
                }

                // Post proper double-entry journal for return via AccountingService
                // DR 4000 Revenue (reverse the sale revenue)
                // CR 1000 Cash in Hand (refund cash out)
                // CR 5000 COGS (reverse the cost — stock is back)
                // DR 1100 Inventory (stock asset restored)

                $revenueAccount   = Account::where('tenant_id', $tenant->id)->where('code', '4000')->first();
                $cashAccount      = Account::where('tenant_id', $tenant->id)->where('code', '1000')->first();
                $cogsAccount      = Account::where('tenant_id', $tenant->id)->where('code', '5000')->first();
                $inventoryAccount = Account::where('tenant_id', $tenant->id)->where('code', '1100')->first();

                $returnCogs = collect($items)->sum(function ($item) {
                    $product = \App\Models\Product::find($item['product_id']);
                    return ($product?->cost_price ?? 0) * $item['quantity'];
                });

                $lines = [];

                if ($revenueAccount && $cashAccount) {
                    $lines[] = ['account_id' => $revenueAccount->id, 'debit' => $returnTotal, 'credit' => 0];
                    $lines[] = ['account_id' => $cashAccount->id,    'debit' => 0, 'credit' => $returnTotal];
                }

                if ($cogsAccount && $inventoryAccount && $returnCogs > 0) {
                    $lines[] = ['account_id' => $cogsAccount->id,      'debit' => 0,           'credit' => $returnCogs];
                    $lines[] = ['account_id' => $inventoryAccount->id, 'debit' => $returnCogs, 'credit' => 0];
                }

                if (!empty($lines)) {
                    app(\App\Services\V3\AccountingService::class)->createEntry([
                        'date'           => now()->toDateString(),
                        'reference_type' => 'sale_return',
                        'reference'      => $sale->id,
                        'description'    => "POS Return: {$returnRef}",
                        'party_id'       => null,
                    ], $lines);
                }
            });

            return response()->json([
                'success'   => true,
                'message'   => 'Return processed successfully',
                'reference' => $returnRef,
                'total'     => $returnTotal,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
