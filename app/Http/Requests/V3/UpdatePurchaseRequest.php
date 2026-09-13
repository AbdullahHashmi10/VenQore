<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Phase 2 (V3_CONSOLIDATION_PLAN.md) — editing a posted purchase.
 *
 * Same shape as StorePurchaseRequest. The one relaxation is `purchase_date`:
 * `before_or_equal:today` is dropped, because editing a purchase recorded
 * yesterday must not fail validation simply because the clock moved.
 */
class UpdatePurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return array_merge(StorePurchaseRequest::sharedPurchaseRules(), [
            'purchase_date' => ['required', 'date'],
            'items'         => ['required', 'array', 'min:1'],
        ]);
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items      = $this->input('items', []);
            $goodsValue = 0.0;

            foreach ($items as $item) {
                $goodsValue += (float) ($item['qty'] ?? 0) * (float) ($item['unit_cost'] ?? 0);
            }

            if ((float) $this->input('discount', 0) > $goodsValue) {
                $validator->errors()->add(
                    'discount',
                    'The discount cannot be greater than the total value of the items.'
                );
            }
        });
    }
}
