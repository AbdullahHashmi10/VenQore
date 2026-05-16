<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'supplier_id'      => ['required', 'string', 'exists:parties,id'],
            'warehouse_id'     => ['required', 'string', 'exists:warehouses,id'],
            'payment_method'   => ['required', 'in:cash,credit'],
            'purchase_date'    => ['required', 'date', 'before_or_equal:today'],
            'supplier_invoice' => ['nullable', 'string', 'max:100'],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string', 'exists:products,id'],
            'items.*.qty'        => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_cost'  => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate'   => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.business_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'zero_cost_acknowledged' => ['boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            $acknowledged = $this->boolean('zero_cost_acknowledged');

            foreach ($items as $index => $item) {
                $unitCost = (float) ($item['unit_cost'] ?? 0);

                if ($unitCost === 0.0 && !$acknowledged) {
                    $validator->errors()->add(
                        'zero_cost_acknowledged',
                        'One or more items have zero unit cost. ' .
                        'Set zero_cost_acknowledged=true to confirm this is intentional.'
                    );
                    break;
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'items.*.unit_cost.min' => 'Unit cost cannot be negative.',
            'items.*.qty.min'       => 'Quantity must be greater than zero.',
        ];
    }
}
