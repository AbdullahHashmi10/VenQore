<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Phase 2 (V3_CONSOLIDATION_PLAN.md) — goods receipt against a purchase.
 *
 * Over-receipt is NOT validated here: the remaining quantity has to be read
 * under a row lock or two concurrent receipts can both pass validation and then
 * both write. PurchaseService::receive() does that check inside the transaction.
 */
class ReceivePurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'items'                      => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id'   => ['required', 'string', 'exists:purchase_items,id'],
            'items.*.receiving_qty'      => ['required', 'numeric', 'min:0'],
            'items.*.batch_number'       => ['nullable', 'string', 'max:100'],
            'items.*.expiry_date'        => ['nullable', 'date'],
            'notes'                      => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.*.receiving_qty.min' => 'Receiving quantity cannot be negative.',
        ];
    }
}
