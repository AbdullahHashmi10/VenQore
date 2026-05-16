<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\ProductAttribute;

class ProductVariantController extends Controller
{
    public function index(Product $product)
    {
        return Inertia::render('Inventory/Variants/VariantsList', [
            'product' => $product,
            'variants' => $product->variants,
            'globalAttributes' => ProductAttribute::query()->get(),
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $request->validate([
            'sku' => 'nullable|unique:product_variants,sku',
            'attributes' => 'required|array',
            'price' => 'nullable|numeric',
            'stock_quantity' => 'nullable|integer',
        ]);

        $data = $request->all();
        if (isset($data['stock_quantity'])) {
            $data['stock'] = $data['stock_quantity'];
            unset($data['stock_quantity']);
        }
        $product->variants()->create($data);

        return back()->with('success', 'Variant created successfully.');
    }

    public function update(Request $request, ProductVariant $variant)
    {
        $request->validate([
            'sku' => 'nullable|unique:product_variants,sku,' . $variant->id,
            'attributes' => 'required|array',
            'price' => 'nullable|numeric',
            'stock_quantity' => 'nullable|integer',
        ]);

        $data = $request->all();
        if (isset($data['stock_quantity'])) {
            $data['stock'] = $data['stock_quantity'];
            unset($data['stock_quantity']);
        }
        $variant->update($data);

        return back()->with('success', 'Variant updated successfully.');
    }

    public function destroy(ProductVariant $variant)
    {
        $variant->delete();
        return back()->with('success', 'Variant deleted successfully.');
    }
}
