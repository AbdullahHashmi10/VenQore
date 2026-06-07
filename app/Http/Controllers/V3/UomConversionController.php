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

        DB::table('product_uom_conversions')->where('product_uom_conversions.tenant_id', app('current.tenant')->id)->insert([
            'id'                => Str::uuid()->toString(),
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
        // Safety check: do not delete a UOM that has been used in sale_items
        $inUse = DB::table('sale_items')->where('sale_items.tenant_id', app('current.tenant')->id)
            ->where('product_id', $productId)
            ->whereRaw('UPPER(sale_uom) = UPPER((SELECT sale_uom FROM product_uom_conversions WHERE id = ?))', [$id])
            ->exists();

        if ($inUse) {
            return back()->withErrors([
                'sale_uom' => 'This UOM has been used in existing sales and cannot be deleted.',
            ]);
        }

        DB::table('product_uom_conversions')->where('product_uom_conversions.tenant_id', app('current.tenant')->id)
            ->where('id', $id)
            ->where('product_id', $productId)
            ->delete();

        return back()->with('success', 'UOM conversion removed.');
    }
}
