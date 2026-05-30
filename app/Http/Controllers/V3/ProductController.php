<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreProductRequest;
use App\Http\Requests\V3\UpdateProductRequest;
use App\Services\PlanGate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = DB::table('products')->where('products.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', app('current.tenant')->id)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'         => $p->id,
                'name'       => $p->name,
                'sku'        => $p->sku,
                'base_unit'  => $p->base_unit,
                'sale_price' => (float) $p->price,
                'tax_rate'   => (float) $p->tax_rate,
            ]);

        return Inertia::render('V3/Products/Index', [
            'products' => $products,
        ]);
    }

    public function create()
    {
        return Inertia::render('V3/Products/Create');
    }

    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();

        // ── Phase 4.3: SKU Limit Gate (V3 path) ────────────────────────
        if (app()->bound('current.tenant')) {
            $skuCount = (int) DB::table('products')->where('products.tenant_id', app('current.tenant')->id)
                ->where('tenant_id', app('current.tenant')->id)
                ->whereNull('deleted_at')
                ->count();
            PlanGate::enforce('sku_limit', $skuCount);
        }

        $productId = Str::uuid()->toString();

        DB::transaction(function () use ($productId, $validated) {
            DB::table('products')->where('products.tenant_id', app('current.tenant')->id)->insert([
                'id'                => $productId,
                'tenant_id'         => app('current.tenant')->id,
                'name'              => $validated['name'],
                'sku'               => $validated['sku'],
                'base_unit'         => $validated['base_unit'],
                'price'             => $validated['sale_price'],
                'tax_rate'          => $validated['tax_rate'] ?? 0,
                'price_includes_tax'=> $validated['price_includes_tax'] ?? 0,
                'is_manufactured'   => $validated['is_manufactured'] ?? 0,
                'is_active'         => 1,
                'status'            => 'active',
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);

            if (!empty($validated['bom_items'])) {
                $bomId = Str::uuid()->toString();
                DB::table('bill_of_materials')->insert([
                    'id'             => $bomId,
                    'tenant_id'      => app('current.tenant')->id,
                    'product_id'     => $productId,
                    'version'        => 1,
                    'effective_from' => today()->toDateString(),
                    'is_active'      => 1,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);

                foreach ($validated['bom_items'] as $item) {
                    DB::table('bom_items')->insert([
                        'id'            => Str::uuid()->toString(),
                        'tenant_id'     => app('current.tenant')->id,
                        'bom_id'        => $bomId,
                        'product_id'    => $item['product_id'],
                        'qty_per_unit'  => $item['qty_per_unit'],
                        'created_at'    => now(),
                    ]);
                }
            }
        });

        return redirect()->route('store.v3.products.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Product created successfully.');
    }

    public function edit(string $id)
    {
        $product = DB::table('products')->where('products.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', app('current.tenant')->id)
            ->where('id', $id)
            ->firstOrFail();

        // Load UOM conversions for this product
        $uomConversions = DB::table('product_uom_conversions')->where('product_uom_conversions.tenant_id', app('current.tenant')->id)
            ->where('product_id', $id)
            ->get();

        // Load price tiers for this product
        $priceTiers = DB::table('product_price_tiers')->where('product_price_tiers.tenant_id', app('current.tenant')->id)
            ->where('product_id', $id)
            ->orderBy('min_qty')
            ->get();

        return Inertia::render('V3/Products/Edit', [
            'product'        => $product,
            'uomConversions' => $uomConversions,
            'priceTiers'     => $priceTiers,
        ]);
    }

    public function update(UpdateProductRequest $request, string $id)
    {
        $validated = $request->validated();

        DB::table('products')->where('products.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', app('current.tenant')->id)
            ->where('id', $id)
            ->update([
            'name'               => $validated['name'],
            'sku'                => $validated['sku'],
            'base_unit'          => $validated['base_unit'],
            'price'              => $validated['sale_price'],
            'tax_rate'           => $validated['tax_rate'] ?? 0,
            'price_includes_tax' => $validated['price_includes_tax'] ?? 0,
            // 'reorder_level'      => $validated['reorder_level'] ?? 0,
            'is_manufactured'    => $validated['is_manufactured'] ?? 0,
            'updated_at'         => now(),
        ]);

        return redirect()->route('store.v3.products.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(string $id)
    {
        // ── 6B: Archive-first delete logic ───────────────────────────────────
        // The DB has RESTRICT FKs on sale_items.product_id and invoice_items.product_id.
        // Attempting a hard delete on a product with history produces a raw MySQL FK error.
        // Instead, we check first and either archive or soft-delete cleanly.

        $tenantId = app('current.tenant')->id;
        $hasSalesHistory = DB::table('sale_items')->where('sale_items.tenant_id', app('current.tenant')->id)->where('product_id', $id)->exists()
            || DB::table('invoice_items')->where('invoice_items.tenant_id', app('current.tenant')->id)->where('product_id', $id)->exists()
            || DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)->where('product_id', $id)->exists();

        if ($hasSalesHistory) {
            // Archive: hide from POS and stock lists but NEVER destroy history.
            DB::table('products')->where('products.tenant_id', app('current.tenant')->id)->where('id', $id)->update([
                'is_active'  => 0,
                'updated_at' => now(),
            ]);

            $product = DB::table('products')->where('products.tenant_id', app('current.tenant')->id)->where('id', $id)->first();
            $name = $product->name ?? 'Product';

            return redirect()->route('store.v3.products.index', ['store_slug' => app('current.tenant')->slug])
                ->with('info',
                    "'{$name}' has been archived. It will no longer appear in the POS " .
                    "but its complete sales and accounting history is fully preserved."
                );
        }

        // No history — safe to soft-delete via Eloquent (sets deleted_at)
        \App\Models\Product::findOrFail($id)->delete();

        return redirect()->route('store.v3.products.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Product deleted successfully.');
    }
}

