<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        // SKUs are unique per store (products_tenant_id_sku_unique): another
        // store's SKU must neither block nor be revealed by this check.
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        return [
            'name'               => ['required', 'string', 'max:200'],
            'sku'                => ['required', 'string', 'max:100',
                                    Rule::unique('products', 'sku')->where('tenant_id', $tenantId)->ignore($this->route('product'))],
            'base_unit'          => ['required', 'string', 'max:20'],
            'sale_price'         => ['required', 'numeric', 'min:0'],
            'tax_rate'           => ['nullable', 'numeric', 'min:0', 'max:100'],
            'price_includes_tax' => ['boolean'],
            'reorder_level'      => ['nullable', 'numeric', 'min:0'],
            'is_manufactured'    => ['boolean'],
            'supplier_sku'       => ['nullable', 'string', 'max:100'],
        ];
    }
}
