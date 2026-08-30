<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * What is still returnable against a sale.
 *
 * A return has never known which sale it answers to, which means nothing has
 * ever capped it: the same goods could be handed back three times, each one
 * putting stock on the shelf and cash out of the drawer, and no report would
 * disagree. This is the lookup that closes that.
 *
 * For each line of the original sale it reports what was sold, what has already
 * come back on earlier returns, and therefore what is still returnable. The
 * screen loads those lines; the server checks them again on save, because a cap
 * enforced only in a browser is not a cap.
 */
class SaleReturnLookupController extends Controller
{
    /** GET — recent sales for a party, so the operator can find the one. */
    public function index(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $sales = DB::table('sales')
            ->leftJoin('parties', 'sales.party_id', '=', 'parties.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'posted')
            ->when($request->query('party'), fn ($q, $p) => $q->where('sales.party_id', $p))
            ->when($request->query('query'), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('sales.reference_number', 'like', "%{$term}%")
                      ->orWhere('parties.name', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('sales.posted_at')
            ->limit(25)
            ->get([
                'sales.id', 'sales.reference_number', 'sales.posted_at',
                'sales.total', 'sales.party_id', 'parties.name as party_name',
            ]);

        return response()->json($sales);
    }

    /** GET — one sale, with what is left to return on every line. */
    public function show(Request $request, string $sale)
    {
        $tenantId = app('current.tenant')->id;

        $doc = DB::table('sales')
            ->leftJoin('parties', 'sales.party_id', '=', 'parties.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.id', $sale)
            ->select('sales.*', 'parties.name as party_name')
            ->first();

        if (! $doc) {
            return response()->json(['message' => 'That sale could not be found.'], 404);
        }

        $lines = DB::table('sale_items')
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sale_items.sale_id', $sale)
            ->get([
                'sale_items.id', 'sale_items.product_id', 'sale_items.quantity',
                'sale_items.unit_price', 'sale_items.subtotal',
                'sale_items.tax_rate', 'sale_items.cost_price',
                'products.name as product_name', 'products.sku', 'products.base_unit',
                'products.tax_rate as product_tax_rate',
            ]);

        /* What has already come back, per ORIGINAL LINE. Per line rather than
           per product, because the same product can appear twice on one sale at
           two different prices and they are not interchangeable. */
        $alreadyBack = DB::table('sale_items')
            ->join('sales as r', 'sale_items.sale_id', '=', 'r.id')
            ->where('r.tenant_id', $tenantId)
            ->where('r.original_sale_id', $sale)
            ->where('r.status', 'returned')
            ->whereNotNull('sale_items.original_sale_item_id')
            ->groupBy('sale_items.original_sale_item_id')
            /* Return lines are stored negative, so the absolute value is the
               quantity that went back. */
            ->selectRaw('sale_items.original_sale_item_id as line_id, SUM(ABS(sale_items.quantity)) as qty')
            ->pluck('qty', 'line_id');

        $out = $lines->map(function ($l) use ($alreadyBack) {
            $sold = (float) $l->quantity;
            $back = (float) ($alreadyBack[$l->id] ?? 0);
            return [
                'original_sale_item_id' => $l->id,
                'product_id'   => $l->product_id,
                'product_name' => $l->product_name,
                'sku'          => $l->sku,
                'base_unit'    => $l->base_unit,
                'sold_qty'     => round($sold, 4),
                'returned_qty' => round($back, 4),
                'returnable_qty' => round(max(0, $sold - $back), 4),
                'unit_price'   => (float) $l->unit_price,
                'tax_rate'     => (float) ($l->tax_rate ?? $l->product_tax_rate ?? 0),
                'cost_price'   => (float) ($l->cost_price ?? 0),
            ];
        })->values();

        return response()->json([
            'sale' => [
                'id'        => $doc->id,
                'reference' => $doc->reference_number,
                'date'      => $doc->posted_at,
                'total'     => (float) $doc->total,
                'party_id'  => $doc->party_id,
                'party_name'=> $doc->party_name,
                'tax'       => (float) $doc->tax,
                'discount'  => (float) $doc->discount,
                'payment_method' => $doc->payment_method,
            ],
            'items' => $out,
            /* Nothing left to give back is worth saying plainly, rather than
               presenting a form that cannot be submitted. */
            'fully_returned' => $out->every(fn ($i) => $i['returnable_qty'] <= 0.0001),
        ]);
    }
}
