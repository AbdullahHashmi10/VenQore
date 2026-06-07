<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:200'],
            'sku'                => ['required', 'string', 'max:100', 'unique:products,sku'],
            'base_unit'          => ['required', 'string', 'max:20'],
            'sale_price'         => ['required', 'numeric', 'min:0'],
            'tax_rate'           => ['nullable', 'numeric', 'min:0', 'max:100'],
            'price_includes_tax' => ['boolean'],
            'reorder_level'      => ['nullable', 'numeric', 'min:0'],
            'is_manufactured'    => ['boolean'],
            'bom_items'          => ['nullable', 'array'],
            'bom_items.*.product_id'   => ['required_with:bom_items', 'string', 'exists:products,id'],
            'bom_items.*.qty_per_unit' => ['required_with:bom_items', 'numeric', 'min:0.0001'],
        ];
    }
}
