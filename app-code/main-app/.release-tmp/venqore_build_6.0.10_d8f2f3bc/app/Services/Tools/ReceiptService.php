<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * ReceiptService — builds a free, unwatermarked PDF point-of-sale receipt
 * from a store profile, line items, transaction meta, tax/discount, and payment info.
 *
 * Supports two paper presets:
 * - 'thermal_80mm' (80mm width = 226.77 pt; high height allowing single continuous receipt print)
 * - 'letter_a4' (Standard A4 letter record copy with receipt-styled centered column)
 */
class ReceiptService
{
    public const PAPER_PRESETS = [
        'thermal_80mm' => [
            'name' => '80mm Thermal Roll',
            'description' => 'Sized for POS thermal receipt printers.',
        ],
        'letter_a4' => [
            'name' => 'Standard Letter/A4 (for records)',
            'description' => 'Full-size page for filing or emailing.',
        ],
    ];

    public const PAYMENT_METHODS = ['Cash', 'Card', 'Other'];
    public const DISCOUNT_TYPES = ['flat', 'percent'];

    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    public const MAX_LINE_ITEMS = 100;

    /**
     * @param array $store   ['name','address','phone','logo_base64','footer_message']
     * @param array $items   list of ['name','quantity','unit_price']
     * @param array $meta    ['receipt_number','date_time','cashier','returns_policy_days','paper_preset','currency','payment_method','amount_tendered','tax_rate','discount_value','discount_type']
     * @throws InvalidArgumentException
     */
    public function build(array $store, array $items, array $meta): array
    {
        $errors = $this->validate($store, $items, $meta);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $paperPreset = $meta['paper_preset'] ?? 'thermal_80mm';
        if (!array_key_exists($paperPreset, self::PAPER_PRESETS)) {
            $paperPreset = 'thermal_80mm';
        }

        $currency = $meta['currency'] ?? 'USD';
        $symbol = self::CURRENCIES[$currency] ?? $currency;

        $paymentMethod = $meta['payment_method'] ?? 'Cash';
        if (!in_array($paymentMethod, self::PAYMENT_METHODS, true)) {
            $paymentMethod = 'Cash';
        }

        $lines = [];
        $rawSubtotal = 0.0;

        foreach (array_slice($items, 0, self::MAX_LINE_ITEMS) as $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            $price = (float) ($item['unit_price'] ?? 0);
            $amount = $qty * $price;
            $rawSubtotal += $amount;

            $lines[] = [
                'name'       => $item['name'] ?? '',
                'quantity'   => $qty,
                'unit_price' => $price,
                'amount'     => round($amount, 2),
            ];
        }

        $subtotal = round($rawSubtotal, 2);

        // Overall discount
        $discVal = max(0, (float) ($meta['discount_value'] ?? 0));
        $discType = $meta['discount_type'] ?? 'flat';
        if ($discType === 'percent') {
            $discPct = min(100, $discVal);
            $discount = round($subtotal * ($discPct / 100), 2);
        } else {
            $discount = round(min($subtotal, $discVal), 2);
        }

        $taxableAmount = max(0, $subtotal - $discount);
        $taxRate = max(0, (float) ($meta['tax_rate'] ?? 0));
        $tax = round($taxableAmount * ($taxRate / 100), 2);
        $total = round($taxableAmount + $tax, 2);

        $tendered = (float) ($meta['amount_tendered'] ?? 0);
        $changeDue = 0.0;
        if ($paymentMethod === 'Cash') {
            $changeDue = max(0, round($tendered - $total, 2));
        }

        $pdfView = Pdf::loadView('tools.pdf.receipt', [
            'store'         => $store,
            'lines'         => $lines,
            'meta'          => $meta,
            'paperPreset'   => $paperPreset,
            'currency'      => $currency,
            'symbol'        => $symbol,
            'paymentMethod' => $paymentMethod,
            'subtotal'      => $subtotal,
            'discount'      => $discount,
            'tax'           => $tax,
            'total'         => $total,
            'tendered'      => round($tendered, 2),
            'changeDue'     => $changeDue,
        ]);

        if ($paperPreset === 'thermal_80mm') {
            // 80mm = 80 / 25.4 * 72 pt = 226.77 pt
            // 297mm height = 841.89 pt (generous fixed height to allow thermal auto-cut)
            $pdfView->setPaper([0, 0, 226.77, 841.89], 'portrait');
        } else {
            $pdfView->setPaper('a4', 'portrait');
        }

        return [
            'bytes'    => $pdfView->output(),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax'      => $tax,
            'total'    => $total,
        ];
    }

    public function validate(array $store, array $items, array $meta): array
    {
        $errors = [];

        if (empty(trim($store['name'] ?? ''))) {
            $errors[] = 'Your store name is required.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one line item.';
        }
        if (count($items) > self::MAX_LINE_ITEMS) {
            $errors[] = 'A single receipt supports at most ' . self::MAX_LINE_ITEMS . ' line items.';
        }
        foreach ($items as $i => $item) {
            if (empty(trim($item['name'] ?? ''))) {
                $errors[] = 'Item ' . ($i + 1) . ' needs a product name.';
                break;
            }
        }
        if (!empty($meta['currency']) && !array_key_exists($meta['currency'], self::CURRENCIES)) {
            $errors[] = 'Unsupported currency.';
        }
        if (!empty($meta['paper_preset']) && !array_key_exists($meta['paper_preset'], self::PAPER_PRESETS)) {
            $errors[] = 'Unsupported paper size.';
        }
        if (!empty($meta['payment_method']) && !in_array($meta['payment_method'], self::PAYMENT_METHODS, true)) {
            $errors[] = 'Invalid payment method.';
        }

        return $errors;
    }

    public function nextReceiptNumber(): string
    {
        return 'REC-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
