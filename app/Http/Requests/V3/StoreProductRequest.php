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
        ];
    }
}
