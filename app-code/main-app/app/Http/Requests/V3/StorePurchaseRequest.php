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

    protected function prepareForValidation(): void
    {
        $merge = [];
        if (!$this->has('supplier_id') && $this->has('party_id')) {
            $merge['supplier_id'] = $this->input('party_id');
        }
        if (!$this->has('purchase_date') && $this->has('date')) {
            $merge['purchase_date'] = $this->input('date');
        }
        if ($this->has('status') && !$this->has('workflow_status')) {
            $merge['workflow_status'] = $this->input('status');
        }
        if ($this->has('items') && is_array($this->input('items'))) {
            $items = $this->input('items');
            foreach ($items as $k => $item) {
                if (is_array($item)) {
                    if (!isset($item['qty']) && isset($item['quantity'])) {
                        $items[$k]['qty'] = $item['quantity'];
                    }
                    if (!isset($item['unit_cost']) && isset($item['price'])) {
                        $items[$k]['unit_cost'] = $item['price'];
                    } elseif (!isset($item['unit_cost']) && isset($item['cost'])) {
                        $items[$k]['unit_cost'] = $item['cost'];
                    }
                }
            }
            $merge['items'] = $items;
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

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
        // Every id below must belong to the CURRENT store (bare exists: rules
        // accepted another store's warehouse / products / variants, and the
        // account ids were not checked at all).
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        return [
            'supplier_id'      => ['required', 'string', self::supplierExistsRule()],
            'warehouse_id'     => ['nullable', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId)],
            'payment_method'   => ['required', 'in:cash,credit'],

            /* A purchase used to be paid in full or not at all: 'cash' meant
               paid, 'credit' meant nothing paid, and there was no way to say
               "half now, half on the 30th" — which is how a great many
               suppliers are actually settled. These two make that sayable. */
            'amount_paid'        => ['nullable', 'numeric', 'min:0'],
            'payment_account_id' => ['nullable', 'string', self::paymentAccountRule($tenantId)],
            'supplier_invoice' => ['nullable', 'string', 'max:100'],

            // ── legacy parity: header fields ─────────────────────────────────
            'reference'        => ['nullable', 'string', 'max:100'],
            'notes'            => ['nullable', 'string'],
            'due_date'         => ['nullable', 'date'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'round_off'        => ['nullable', 'numeric'],
            'workflow_status'  => ['nullable', 'in:pending,partial,received'],

            // ── legacy parity: line fields ───────────────────────────────────
            'items.*.product_id'      => ['required', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'items.*.variant_id'      => ['nullable', 'string', Rule::exists('product_variants', 'id')->where('tenant_id', $tenantId)],
            'items.*.qty'             => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_cost'       => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.business_pct'    => ['nullable', 'numeric', 'min:0', 'max:100'],

            // ── legacy parity: landed costs ──────────────────────────────────
            'extras'                  => ['nullable', 'array'],
            'extras.*.amount'         => ['required_with:extras', 'numeric', 'min:0'],
            'extras.*.method'         => ['nullable', 'in:value,quantity,manual'],
            'extras.*.category_id'    => ['nullable', 'string', Rule::exists('expense_categories', 'id')->where('tenant_id', $tenantId)],
            'extras.*.description'    => ['nullable', 'string', 'max:255'],
            'extras.*.bank_account_id' => ['nullable', 'string', Rule::exists('bank_accounts', 'id')->where('tenant_id', $tenantId)],

            'zero_cost_acknowledged'  => ['boolean'],
        ];
    }

    /**
     * payment_account_id is either the picker's 'CHEQUE' sentinel or the id of
     * one of THIS store's ledger accounts.
     */
    private static function paymentAccountRule(int|string|null $tenantId): \Closure
    {
        return function (string $attribute, $value, \Closure $fail) use ($tenantId) {
            if (is_string($value) && strtoupper($value) === 'CHEQUE') {
                return;
            }
            $exists = DB::table('accounts')
                ->where('tenant_id', $tenantId)
                ->where('id', $value)
                ->exists();
            if (! $exists) {
                $fail('The selected payment account is invalid.');
            }
        };
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
            /* NET of the per-line discounts, because that is what the stock is
               debited with. Measuring against the gross let a header discount
               equal to the gross sail through and drive the inventory debit —
               and therefore the whole journal entry — negative. */
            $goodsValue = 0.0;
            foreach ($items as $item) {
                $line = (float) ($item['qty'] ?? 0) * (float) ($item['unit_cost'] ?? 0);
                $goodsValue += max(0.0, $line - (float) ($item['discount_amount'] ?? 0));
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
