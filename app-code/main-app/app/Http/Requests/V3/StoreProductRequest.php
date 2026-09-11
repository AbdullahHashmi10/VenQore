<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        // SKUs are unique per store (products_tenant_id_sku_unique), and BOM
        // components must be this store's products.
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        return [
            'name'               => ['required', 'string', 'max:200'],
            'sku'                => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->where('tenant_id', $tenantId)],
            'base_unit'          => ['required', 'string', 'max:20'],
            'sale_price'         => ['required', 'numeric', 'min:0'],
            'tax_rate'           => ['nullable', 'numeric', 'min:0', 'max:100'],
            'price_includes_tax' => ['boolean'],
            'reorder_level'      => ['nullable', 'numeric', 'min:0'],
            'is_manufactured'    => ['boolean'],
            'bom_items'          => ['nullable', 'array'],
            'bom_items.*.product_id'   => ['required_with:bom_items', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'bom_items.*.qty_per_unit' => ['required_with:bom_items', 'numeric', 'min:0.0001'],
            'supplier_sku'       => ['nullable', 'string', 'max:100'],
        ];
    }
}
