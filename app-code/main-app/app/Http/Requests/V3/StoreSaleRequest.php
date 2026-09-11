<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        // Customer, warehouse, products and channel must all be this store's.
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        return [
            'customer_id'      => ['required', 'string', Rule::exists('parties', 'id')->where('tenant_id', $tenantId)],
            'warehouse_id'     => ['required', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId)],
            'sale_date'        => ['required', 'date', 'before_or_equal:today'],
            'payment_method'   => ['required', 'in:cash,bank,credit'],
            'amount_received'  => ['nullable', 'numeric', 'min:0'],
            'approved_by'      => ['nullable', 'string'],
            'approval_pin'     => ['nullable', 'string', 'max:20'],

            'items'                        => ['required', 'array', 'min:1'],
            'items.*.product_id'           => ['required', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'items.*.qty'                  => ['required', 'numeric', 'min:0.0001'],
            'items.*.sale_uom'             => ['required', 'string', 'max:20'],
            'items.*.unit_price'           => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate'             => ['nullable', 'numeric', 'min:0'],
            'items.*.is_promotional'       => ['nullable', 'boolean'],

            // S-048 — Optional advance settlement on delivery
            'advance_amount'    => ['nullable', 'numeric', 'min:0.01'],
            'advance_reference' => ['nullable', 'string', 'max:100'],
            
            // VenSynQ Channel Dropship Fields
            'is_dropship'          => ['nullable', 'boolean'],
            'ecommerce_channel_id' => ['nullable', 'integer', Rule::exists('ecommerce_channels', 'id')->where('tenant_id', $tenantId)],
            'channel_order_id'     => ['nullable', 'string', 'max:255'],
            'fulfillment_type'     => ['nullable', 'string', 'in:fbm,fba,jit'],

            // Idempotency
            'client_sale_id'       => ['nullable', 'string', 'max:36'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // S-044 — Discount enforcement: each item discount must be within
            // the user's role limit. Over-limit requires a verified manager
            // approval whose own role limit covers the discount.
            // S-011 — approved_by also unlocks below-cost lines in SaleService,
            // so ANY approved_by must be a verified manager approval.
            $items      = $this->input('items', []);
            $approvedBy = $this->input('approved_by');
            $userId     = auth()->id();

            if (!$userId) return;

            $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

            $approvalValid = false;
            if (!empty($approvedBy) && $tenantId !== null) {
                $problem = \App\Support\ManagerApproval::check($approvedBy, $this->input('approval_pin'), $tenantId, $userId);
                if ($problem !== null) {
                    $validator->errors()->add('approved_by', $problem);
                } else {
                    $approvalValid = true;
                }
            }

            $role = \Illuminate\Support\Facades\DB::table('tenant_users')
                ->where('user_id', $userId)
                ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
                ->value('role');

            // Store-specific limit first, global default second (was unscoped:
            // another store's row, or the global row, could win).
            $maxDiscount = \App\Support\ManagerApproval::discountLimit($role, $tenantId);

            if ($maxDiscount === null) return; // no limit configured for this role

            $approverLimit = $approvalValid
                ? \App\Support\ManagerApproval::discountLimit(\App\Support\ManagerApproval::roleOf($approvedBy, $tenantId), $tenantId)
                : null;

            foreach ($items as $index => $item) {
                $discountPct = (float) ($item['discount_percent'] ?? 0);

                if ($discountPct <= (float) $maxDiscount) {
                    continue;
                }

                if (empty($approvedBy)) {
                    $validator->errors()->add(
                        "items.{$index}.discount_percent",
                        "Discount {$discountPct}% exceeds your role limit of {$maxDiscount}%. " .
                        "Manager approval (approved_by) is required (S-044)."
                    );
                } elseif ($approvalValid && $approverLimit !== null && $discountPct > $approverLimit) {
                    $validator->errors()->add(
                        "items.{$index}.discount_percent",
                        "Discount {$discountPct}% exceeds the approver's own limit of {$approverLimit}% (S-044)."
                    );
                }
            }
        });
    }
}
