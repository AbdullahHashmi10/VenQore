<?php

namespace App\Services\V3;

use App\Engines\PurchaseService as EnginePurchaseService;

class PurchaseService extends EnginePurchaseService
{
    public function createPurchase(array $data)
    {
        $payload = [
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

                return [
                    'product_id'      => $item['product_id'],
                    'qty'             => $qty,
                    'unit_cost'       => $unitCost,
                    'discount_amount' => (float) ($item['discount_amount'] ?? 0),
                    'tax_rate'        => $taxRate,
                ];
            }, $data['items'] ?? []),
        ];

        return $this->store($payload);
    }
}
