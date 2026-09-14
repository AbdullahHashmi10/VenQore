<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

    protected function prepareForValidation(): void
    {
        if ($this->has('items') && is_array($this->input('items'))) {
            $items = $this->input('items');
            foreach ($items as $k => $item) {
                if (is_array($item)) {
                    if (!isset($item['purchase_item_id'])) {
                        if (isset($item['item_id'])) {
                            $items[$k]['purchase_item_id'] = $item['item_id'];
                        } elseif (isset($item['invoice_item_id'])) {
                            $items[$k]['purchase_item_id'] = $item['invoice_item_id'];
                        } elseif (isset($item['id'])) {
                            $items[$k]['purchase_item_id'] = $item['id'];
                        }
                    }
                }
            }
            $this->merge(['items' => $items]);
        }
    }

    public function rules(): array
    {
        // Every line must be a line of THIS purchase, in this store.
        $tenantId   = app()->bound('current.tenant') ? app('current.tenant')->id : null;
        $purchaseId = $this->route('purchase');
        $lineRule   = Rule::exists('purchase_items', 'id')->where('tenant_id', $tenantId);
        if (is_string($purchaseId) && $purchaseId !== '') {
            $lineRule->where('purchase_id', $purchaseId);
        }

        return [
            'items'                      => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id'   => ['required', 'string', $lineRule],
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
