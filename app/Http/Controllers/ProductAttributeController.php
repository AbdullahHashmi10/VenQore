<?php

namespace App\Http\Controllers;

use App\Models\ProductAttribute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductAttributeController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Attributes/AttributesList', [
            'attributes' => ProductAttribute::query()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:product_attributes,name',
            'type' => 'required|string',
            'options' => 'nullable|array',
        ]);

        ProductAttribute::create($request->all());

        return back()->with('success', 'Attribute created successfully.');
    }

    public function update(Request $request, ProductAttribute $attribute)
    {
        $request->validate([
            'name' => 'required|string|unique:product_attributes,name,' . $attribute->id,
            'type' => 'required|string',
            'options' => 'nullable|array',
        ]);

        $attribute->update($request->all());

        return back()->with('success', 'Attribute updated successfully.');
    }

    public function destroy(ProductAttribute $attribute)
    {
        $attribute->delete();
        return back()->with('success', 'Attribute deleted successfully.');
    }
}
