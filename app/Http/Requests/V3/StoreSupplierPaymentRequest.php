<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierPaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        // Supplier, bank account and every bill must belong to the CURRENT store.
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        return [
            'supplier_id'     => ['required', 'string', Rule::exists('parties', 'id')->where('tenant_id', $tenantId)],
            'payment_date'    => ['required', 'date', 'before_or_equal:today'],
            'payment_method'  => ['required', 'in:cash,bank'],
            'bank_account_id' => ['nullable', 'string', Rule::exists('bank_accounts', 'id')->where('tenant_id', $tenantId)],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'reference'       => ['nullable', 'string', 'max:100'],
            'allocations'     => ['required', 'array', 'min:1'],
            'allocations.*.purchase_id' => ['required', 'string', Rule::exists('purchases', 'id')->where('tenant_id', $tenantId)],
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

            // Each bill must be the paying supplier's own.
            $tenantId   = app()->bound('current.tenant') ? app('current.tenant')->id : null;
            $supplierId = $this->input('supplier_id');
            if ($tenantId === null || !is_string($supplierId) || $validator->errors()->has('supplier_id')) {
                return;
            }
            foreach ($allocations as $i => $allocation) {
                $purchaseId = is_array($allocation) ? ($allocation['purchase_id'] ?? null) : null;
                if (!is_string($purchaseId) || $validator->errors()->has("allocations.{$i}.purchase_id")) {
                    continue;
                }
                $belongs = \Illuminate\Support\Facades\DB::table('purchases')
                    ->where('tenant_id', $tenantId)
                    ->where('id', $purchaseId)
                    ->where('party_id', $supplierId)
                    ->exists();
                if (!$belongs) {
                    $validator->errors()->add("allocations.{$i}.purchase_id", 'This bill does not belong to the selected supplier.');
                }
            }
        });
    }
}
