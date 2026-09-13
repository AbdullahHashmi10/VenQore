<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UomConversionController extends Controller
{
    public function index(string $productId)
    {
        $product = DB::table('products')->where('products.tenant_id', app('current.tenant')->id)->where('id', $productId)->firstOrFail();

        $conversions = DB::table('product_uom_conversions')->where('product_uom_conversions.tenant_id', app('current.tenant')->id)
            ->where('product_id', $productId)
            ->orderBy('sale_uom')
            ->get();

        return Inertia::render('V3/Products/UomConversions', [
            'product'     => $product,
            'conversions' => $conversions,
        ]);
    }

    public function store(Request $request, string $productId)
    {
        $validated = $request->validate([
            'sale_uom'          => ['required', 'string', 'max:20'],
            'conversion_factor' => ['required', 'numeric', 'min:0.000001'],
        ]);

        $tenantId = app('current.tenant')->id;

        // The product must belong to this store (404 otherwise).
        DB::table('products')->where('tenant_id', $tenantId)->where('id', $productId)->firstOrFail();

        // Enforce UNIQUE(product_id, sale_uom)
        $exists = DB::table('product_uom_conversions')->where('product_uom_conversions.tenant_id', app('current.tenant')->id)
            ->where('product_id', $productId)
            ->whereRaw('UPPER(sale_uom) = ?', [strtoupper($validated['sale_uom'])])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'sale_uom' => "A conversion for {$validated['sale_uom']} already exists for this product.",
            ]);
        }

        // tenant_id MUST be written: a raw insert gets no HasTenant auto-fill, so
        // the row used to be saved with tenant_id NULL — invisible to this
        // store's own index()/duplicate check and to the sale-side UOM lookup.
        DB::table('product_uom_conversions')->insert([
            'id'                => Str::uuid()->toString(),
            'tenant_id'         => $tenantId,
            'product_id'        => $productId,
            'sale_uom'          => strtoupper($validated['sale_uom']),
            'conversion_factor' => $validated['conversion_factor'],
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        return back()->with('success', 'UOM conversion added.');
    }

    public function destroy(string $productId, string $id)
    {
        $tenantId = app('current.tenant')->id;

        $conversion = DB::table('product_uom_conversions')
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->where('product_id', $productId)
            ->first();
        abort_if(!$conversion, 404);

        // sale_items does not record the unit a line was sold in (the query
        // used to read a non-existent sale_items.sale_uom column and threw).
        // Conservative rule: once the product has been sold while this
        // conversion existed, the conversion may have been used — keep it.
        $inUse = DB::table('sale_items')
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->when($conversion->created_at, fn ($q) => $q->where('created_at', '>=', $conversion->created_at))
            ->exists();

        if ($inUse) {
            return back()->withErrors([
                'sale_uom' => 'This UOM may have been used in sales since it was added and cannot be deleted.',
            ]);
        }

        DB::table('product_uom_conversions')
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'UOM conversion removed.');
    }
}
