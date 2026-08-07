<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PriceTierController extends Controller
{
    public function index(string $productId)
    {
        $product = DB::table('products')->where('products.tenant_id', app('current.tenant')->id)->where('id', $productId)->firstOrFail();

        $tiers = DB::table('product_price_tiers')->where('product_price_tiers.tenant_id', app('current.tenant')->id)
            ->where('product_id', $productId)
            ->orderBy('min_qty')
            ->get();

        return Inertia::render('V3/Products/PriceTiers', [
            'product' => $product,
            'tiers'   => $tiers,
        ]);
    }

    public function store(Request $request, string $productId)
    {
        $validated = $request->validate([
            'min_qty'    => ['required', 'numeric', 'min:0'],
            'max_qty'    => ['nullable', 'numeric', 'gt:min_qty'],
            'unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        // Overlap check: no two tiers should cover the same qty range
        $overlap = DB::table('product_price_tiers')->where('product_price_tiers.tenant_id', app('current.tenant')->id)
            ->where('product_id', $productId)
            ->where(function ($q) use ($validated) {
                $q->whereBetween('min_qty', [$validated['min_qty'], $validated['max_qty'] ?? PHP_INT_MAX])
                  ->orWhereBetween('max_qty', [$validated['min_qty'], $validated['max_qty'] ?? PHP_INT_MAX])
                  ->orWhere(function ($q2) use ($validated) {
                      $q2->where('min_qty', '<=', $validated['min_qty'])
                         ->where(function ($q3) use ($validated) {
                             $q3->whereNull('max_qty')
                                ->orWhere('max_qty', '>=', $validated['min_qty']);
                         });
                  });
            })
            ->exists();

        if ($overlap) {
            return back()->withErrors([
                'min_qty' => 'This quantity range overlaps with an existing price tier.',
            ]);
        }

        DB::table('product_price_tiers')->where('product_price_tiers.tenant_id', app('current.tenant')->id)->insert([
            'id'         => Str::uuid()->toString(),
            'product_id' => $productId,
            'min_qty'    => $validated['min_qty'],
            'max_qty'    => $validated['max_qty'] ?? null,
            'unit_price' => $validated['unit_price'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Price tier added.');
    }

    public function destroy(string $productId, string $id)
    {
        DB::table('product_price_tiers')->where('product_price_tiers.tenant_id', app('current.tenant')->id)
            ->where('id', $id)
            ->where('product_id', $productId)
            ->delete();

        return back()->with('success', 'Price tier removed.');
    }
}
