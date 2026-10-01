<?php

namespace App\Services\V3;

use App\Engines\PurchaseService as EnginePurchaseService;

class PurchaseService extends EnginePurchaseService
{
    public function createPurchase(array $data)
    {
        /* Header fields this method does not reshape (warehouse_id,
           amount_paid, round_off, extras, workflow_status, supplier_invoice,
           payment_account_id …) pass straight through to store(). */
        $payload = array_merge($data, [
            'party_id'       => $data['supplier_id'] ?? $data['party_id'] ?? null,
            'purchase_date'  => $data['purchase_date'] ?? $data['date'] ?? now()->toDateString(),
            'due_date'       => $data['due_date'] ?? null,
            'payment_method' => $data['payment_method'] ?? (($data['payment_status'] ?? '') === 'paid' ? 'cash' : 'credit'),
            'discount'       => $data['discount'] ?? 0,
            'tax'            => $data['tax'] ?? 0,
            'notes'          => $data['notes'] ?? null,
            'items'          => array_map(function ($item) {
                $qty = (float) ($item['quantity'] ?? $item['qty'] ?? 1);
                $unitCost = (float) ($item['unit_price'] ?? $item['unit_cost'] ?? $item['cost_price'] ?? 0);
                $gross = $qty * $unitCost;
                $taxAmount = (float) ($item['tax'] ?? $item['tax_amount'] ?? 0);
                $taxRate = isset($item['tax_rate']) ? (float) $item['tax_rate'] : ($gross > 0 && $taxAmount > 0 ? round(($taxAmount / $gross) * 100, 4) : 0);

                $line = [
                    'product_id'      => $item['product_id'],
                    'variant_id'      => $item['variant_id'] ?? null,
                    'qty'             => $qty,
                    'unit_cost'       => $unitCost,
                    'discount_amount' => (float) ($item['discount_amount'] ?? 0),
                    'tax_rate'        => $taxRate,
                ];

                /* Partial input-tax recovery. Dropped here before, so every
                   purchase through this entry point claimed 100% of its tax
                   in 2300 however little of it was for business use. */
                if (isset($item['business_pct']) && $item['business_pct'] !== '') {
                    $line['business_pct'] = (float) $item['business_pct'];
                }

                return $line;
            }, $data['items'] ?? []),
        ]);

        return $this->store($payload);
    }
}
