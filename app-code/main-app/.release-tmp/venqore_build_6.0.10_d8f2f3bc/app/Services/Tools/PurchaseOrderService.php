<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * PurchaseOrderService — builds a free, unwatermarked PDF Purchase Order from a buyer
 * company profile, vendor details, and a set of itemized line items.
 */
class PurchaseOrderService
{
    public const TEMPLATES = [
        'clean'   => ['name' => 'Clean',   'description' => 'Minimal black-and-white layout, works for any industry.'],
        'modern'  => ['name' => 'Modern',  'description' => 'Accent color banner, ideal for modern retail & trade.'],
        'classic' => ['name' => 'Classic', 'description' => 'Traditional bordered grid layout familiar to vendors.'],
    ];

    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    public const MAX_LINE_ITEMS = 100;

    /**
     * @param array $buyer      ['name','address','email','phone','logo_base64','tax_id','ship_to']
     * @param array $vendor     ['name','address','email','phone','contact_person']
     * @param array $items      list of ['sku','description','quantity','unit_cost','tax_rate']
     * @param array $meta       ['po_number','order_date','expected_date','payment_terms','shipping_cost','currency','notes','template','accent_color','authorized_by']
     * @throws InvalidArgumentException
     */
    public function build(array $buyer, array $vendor, array $items, array $meta): array
    {
        $errors = $this->validate($buyer, $vendor, $items, $meta);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $template = $meta['template'] ?? 'clean';
        if (!array_key_exists($template, self::TEMPLATES)) {
            $template = 'clean';
        }

        $currency = $meta['currency'] ?? 'USD';
        $symbol = self::CURRENCIES[$currency] ?? $currency;

        $lines = [];
        $subtotal = 0.0;
        $totalTax = 0.0;
        $shippingCost = max(0, (float) ($meta['shipping_cost'] ?? 0));

        foreach (array_slice($items, 0, self::MAX_LINE_ITEMS) as $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            $unitCost = (float) ($item['unit_cost'] ?? 0);
            $taxRate = max(0, (float) ($item['tax_rate'] ?? 0));

            $net = $qty * $unitCost;
            $taxAmount = $net * ($taxRate / 100);
            $lineTotal = $net + $taxAmount;

            $subtotal += $net;
            $totalTax += $taxAmount;

            $lines[] = [
                'sku'         => $item['sku'] ?? '',
                'description' => $item['description'] ?? '',
                'quantity'    => $qty,
                'unit_cost'   => $unitCost,
                'tax_rate'    => $taxRate,
                'line_total'  => round($lineTotal, 2),
            ];
        }

        $grandTotal = $subtotal + $totalTax + $shippingCost;

        $pdf = Pdf::loadView('tools.pdf.purchase-order', [
            'buyer'        => $buyer,
            'vendor'       => $vendor,
            'lines'        => $lines,
            'meta'         => $meta,
            'template'     => $template,
            'symbol'       => $symbol,
            'currency'     => $currency,
            'subtotal'     => round($subtotal, 2),
            'tax'          => round($totalTax, 2),
            'shipping'     => round($shippingCost, 2),
            'total'        => round($grandTotal, 2),
        ])->setPaper('a4', 'portrait');

        return [
            'bytes'    => $pdf->output(),
            'subtotal' => round($subtotal, 2),
            'tax'      => round($totalTax, 2),
            'shipping' => round($shippingCost, 2),
            'total'    => round($grandTotal, 2),
        ];
    }

    public function validate(array $buyer, array $vendor, array $items, array $meta): array
    {
        $errors = [];

        if (empty(trim($buyer['name'] ?? ''))) {
            $errors[] = 'Your business / store name is required.';
        }
        if (empty(trim($vendor['name'] ?? ''))) {
            $errors[] = 'Vendor / supplier name is required.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one line item.';
        }
        if (count($items) > self::MAX_LINE_ITEMS) {
            $errors[] = 'A single purchase order supports at most ' . self::MAX_LINE_ITEMS . ' line items.';
        }
        foreach ($items as $i => $item) {
            if (empty(trim($item['description'] ?? ''))) {
                $errors[] = 'Line ' . ($i + 1) . ' needs a description.';
                break;
            }
        }
        if (!empty($meta['currency']) && !array_key_exists($meta['currency'], self::CURRENCIES)) {
            $errors[] = 'Unsupported currency.';
        }

        return $errors;
    }

    public function nextPoNumber(): string
    {
        return 'PO-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
