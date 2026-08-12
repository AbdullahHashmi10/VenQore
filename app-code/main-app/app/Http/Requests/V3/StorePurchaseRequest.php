<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Phase 2 (V3_CONSOLIDATION_PLAN.md): extended to legacy parity.
 *
 * New since 2026-08-11: header discount / round_off / notes / reference /
 * due_date / workflow_status, landed-cost `extras`, per-line `variant_id` and
 * `discount_amount`, and an OPTIONAL warehouse_id (the service falls back to the
 * tenant default, which is what the legacy UI relied on).
 *
 * `supplier_id` now accepts EITHER a Party id or a Supplier id, because the
 * legacy create screen posts a Supplier id. PurchaseService::resolvePartyId()
 * auto-creates the Party for a Supplier that does not have one yet.
 */
class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return array_merge(self::sharedPurchaseRules(), [
            'purchase_date' => ['required', 'date', 'before_or_equal:today'],
            'items'         => ['required', 'array', 'min:1'],
        ]);
    }

    /** Shared by StorePurchaseRequest and UpdatePurchaseRequest. */
    public static function sharedPurchaseRules(): array
    {
        return [
            'supplier_id'      => ['required', 'string', self::supplierExistsRule()],
            'warehouse_id'     => ['nullable', 'string', 'exists:warehouses,id'],
            'payment_method'   => ['required', 'in:cash,credit'],
            'supplier_invoice' => ['nullable', 'string', 'max:100'],

            // ── legacy parity: header fields ─────────────────────────────────
            'reference'        => ['nullable', 'string', 'max:100'],
            'notes'            => ['nullable', 'string'],
            'due_date'         => ['nullable', 'date'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'round_off'        => ['nullable', 'numeric'],
            'workflow_status'  => ['nullable', 'in:pending,partial,received'],

            // ── legacy parity: line fields ───────────────────────────────────
            'items.*.product_id'      => ['required', 'string', 'exists:products,id'],
            'items.*.variant_id'      => ['nullable', 'string', 'exists:product_variants,id'],
            'items.*.qty'             => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_cost'       => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.business_pct'    => ['nullable', 'numeric', 'min:0', 'max:100'],

            // ── legacy parity: landed costs ──────────────────────────────────
            'extras'                  => ['nullable', 'array'],
            'extras.*.amount'         => ['required_with:extras', 'numeric', 'min:0'],
            'extras.*.method'         => ['nullable', 'in:value,quantity,manual'],
            'extras.*.category_id'    => ['nullable', 'string'],
            'extras.*.description'    => ['nullable', 'string', 'max:255'],
            'extras.*.bank_account_id' => ['nullable', 'string'],

            'zero_cost_acknowledged'  => ['boolean'],
        ];
    }

    /**
     * The id may name a row in `parties` OR in `suppliers`. Checked against the
     * current tenant so one store cannot reference another store's supplier.
     */
    private static function supplierExistsRule(): \Closure
    {
        return function (string $attribute, $value, \Closure $fail) {
            $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

            $inParties = DB::table('parties')
                ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
                ->where('id', $value)
                ->exists();

            if ($inParties) {
                return;
            }

            // `suppliers` may or may not carry tenant_id depending on how far
            // that table got through the multi-tenant retrofit — check before
            // filtering rather than assuming.
            $suppliersAreTenantScoped = \Illuminate\Support\Facades\Schema::hasColumn('suppliers', 'tenant_id');

            $inSuppliers = DB::table('suppliers')
                ->when($tenantId && $suppliersAreTenantScoped, fn ($q) => $q->where('tenant_id', $tenantId))
                ->where('id', $value)
                ->exists();

            if (! $inSuppliers) {
                $fail('The selected supplier is invalid.');
            }
        };
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items        = $this->input('items', []);
            $acknowledged = $this->boolean('zero_cost_acknowledged');

            foreach ($items as $item) {
                $unitCost = (float) ($item['unit_cost'] ?? 0);

                if ($unitCost === 0.0 && ! $acknowledged) {
                    $validator->errors()->add(
                        'zero_cost_acknowledged',
                        'One or more items have zero unit cost. ' .
                        'Set zero_cost_acknowledged=true to confirm this is intentional.'
                    );
                    break;
                }
            }

            // A header discount larger than the goods value would drive the
            // inventory debit negative and silently corrupt stock valuation.
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

    public function messages(): array
    {
        return [
            'items.*.unit_cost.min' => 'Unit cost cannot be negative.',
            'items.*.qty.min'       => 'Quantity must be greater than zero.',
        ];
    }
}
