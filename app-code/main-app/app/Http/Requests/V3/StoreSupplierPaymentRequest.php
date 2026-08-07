<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierPaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'supplier_id'     => ['required', 'string', 'exists:parties,id'],
            'payment_date'    => ['required', 'date', 'before_or_equal:today'],
            'payment_method'  => ['required', 'in:cash,bank'],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'reference'       => ['nullable', 'string', 'max:100'],
            'allocations'     => ['required', 'array', 'min:1'],
            'allocations.*.purchase_id' => ['required', 'string', 'exists:purchases,id'],
            'allocations.*.amount'      => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Allocation total must not exceed payment amount
            $allocations  = $this->input('allocations', []);
            $allocTotal   = array_sum(array_column($allocations, 'amount'));
            $paymentAmount = (float) $this->input('amount', 0);

            if (round($allocTotal, 2) > round($paymentAmount, 2)) {
                $validator->errors()->add(
                    'allocations',
                    "Total allocations ({$allocTotal}) exceed payment amount ({$paymentAmount})."
                );
            }
        });
    }
}
