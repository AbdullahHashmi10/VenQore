<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'customer_id'      => ['required', 'string', 'exists:parties,id'],
            'warehouse_id'     => ['required', 'string', 'exists:warehouses,id'],
            'sale_date'        => ['required', 'date', 'before_or_equal:today'],
            'payment_method'   => ['required', 'in:cash,bank,credit'],
            'amount_received'  => ['nullable', 'numeric', 'min:0'],
            'approved_by'      => ['nullable', 'string'],

            'items'                        => ['required', 'array', 'min:1'],
            'items.*.product_id'           => ['required', 'string', 'exists:products,id'],
            'items.*.qty'                  => ['required', 'numeric', 'min:0.0001'],
            'items.*.sale_uom'             => ['required', 'string', 'max:20'],
            'items.*.unit_price'           => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate'             => ['nullable', 'numeric', 'min:0'],
            'items.*.is_promotional'       => ['nullable', 'boolean'],

            // S-048 — Optional advance settlement on delivery
            'advance_amount'    => ['nullable', 'numeric', 'min:0.01'],
            'advance_reference' => ['nullable', 'string', 'max:100'],

        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // S-044 — Discount enforcement: each item discount must be within
            // the user's role limit. Over-limit requires approved_by.
            $items      = $this->input('items', []);
            $approvedBy = $this->input('approved_by');
            $userId     = auth()->id();

            if (!$userId) return;

            $role = \Illuminate\Support\Facades\DB::table('users')
                ->where('id', $userId)
                ->value('role');

            $maxDiscount = \Illuminate\Support\Facades\DB::table('discount_limits')
                ->where('role', $role)
                ->value('max_discount_percent');

            if ($maxDiscount === null) return; // no limit configured for this role

            foreach ($items as $index => $item) {
                $discountPct = (float) ($item['discount_percent'] ?? 0);

                if ($discountPct > (float) $maxDiscount && empty($approvedBy)) {
                    $validator->errors()->add(
                        "items.{$index}.discount_percent",
                        "Discount {$discountPct}% exceeds your role limit of {$maxDiscount}%. " .
                        "Manager approval (approved_by) is required (S-044)."
                    );
                }
            }
        });
    }
}
