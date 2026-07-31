<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * CreditNoteService — builds a free, unwatermarked PDF credit note / credit memo
 * from a company profile, a client, a reference to an original invoice, a reason,
 * itemized credit lines, and refund/store credit terms.
 *
 * This is a document generator, not an accounting system: nothing here
 * writes to Transaction/JournalEntry.
 */
class CreditNoteService
{
    public const TEMPLATES = [
        'clean'    => ['name' => 'Clean',    'description' => 'Minimal black-and-white, works for any industry.'],
        'modern'   => ['name' => 'Modern',   'description' => 'Bold accent color band, good for retail and digital brands.'],
        'classic'  => ['name' => 'Classic',  'description' => 'Traditional bordered table, familiar to accountants.'],
        'compact'  => ['name' => 'Compact',  'description' => 'Dense layout for credit notes with many line items.'],
    ];

    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    public const REASONS = [
        'return'       => 'Product Return',
        'overcharge'   => 'Pricing Overcharge / Error',
        'damage'       => 'Damaged / Defective Goods',
        'discount'     => 'Discount Adjustment',
        'cancellation' => 'Order Cancellation',
        'goodwill'     => 'Goodwill Gesture',
        'other'        => 'Other Adjustment',
    ];

    public const REFUND_METHODS = [
        'original_payment' => 'Refund to Original Payment Method',
        'store_credit'     => 'Store Credit / Account Credit',
        'invoice_offset'   => 'Offset Against Next Invoice',
        'bank_transfer'    => 'Bank Transfer',
        'cash'             => 'Cash Refund',
        'other'            => 'Other Settlement',
    ];

    public const MAX_LINE_ITEMS = 100;

    /**
     * @param array $company     ['name','address','email','phone','logo_base64','tax_id']
     * @param array $client      ['name','address','email']
     * @param array $items       list of ['description','quantity','unit_price','tax_rate','discount_pct']
     * @param array $meta        ['credit_note_number','original_invoice_number','original_invoice_date','reason','custom_reason','refund_method','issue_date','currency','notes','terms','template','accent_color']
     * @throws InvalidArgumentException
     */
    public function build(array $company, array $client, array $items, array $meta): array
    {
        $errors = $this->validate($company, $client, $items, $meta);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $template = $meta['template'] ?? 'clean';
        if (!array_key_exists($template, self::TEMPLATES)) {
            $template = 'clean';
        }

        $currency = $meta['currency'] ?? 'USD';
        $symbol = self::CURRENCIES[$currency] ?? $currency;

        $reasonKey = $meta['reason'] ?? 'return';
        $reasonLabel = self::REASONS[$reasonKey] ?? ($meta['custom_reason'] ?? 'Adjustment');
        if ($reasonKey === 'other' && !empty($meta['custom_reason'])) {
            $reasonLabel = $meta['custom_reason'];
        }

        $refundMethodKey = $meta['refund_method'] ?? 'store_credit';
        $refundMethodLabel = self::REFUND_METHODS[$refundMethodKey] ?? $refundMethodKey;

        $lines = [];
        $subtotal = 0.0;
        $totalTax = 0.0;
        $totalDiscount = 0.0;

        foreach (array_slice($items, 0, self::MAX_LINE_ITEMS) as $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $discountPct = min(100, max(0, (float) ($item['discount_pct'] ?? 0)));
            $taxRate = max(0, (float) ($item['tax_rate'] ?? 0));

            $gross = $qty * $unitPrice;
            $discountAmount = $gross * ($discountPct / 100);
            $net = $gross - $discountAmount;
            $taxAmount = $net * ($taxRate / 100);
            $lineTotal = $net + $taxAmount;

            $subtotal += $net;
            $totalTax += $taxAmount;
            $totalDiscount += $discountAmount;

            $lines[] = [
                'description'  => $item['description'] ?? '',
                'quantity'     => $qty,
                'unit_price'   => $unitPrice,
                'discount_pct' => $discountPct,
                'tax_rate'     => $taxRate,
                'line_total'   => round($lineTotal, 2),
            ];
        }

        $grandTotal = $subtotal + $totalTax;

        $pdf = Pdf::loadView('tools.pdf.credit-note', [
            'company'           => $company,
            'client'            => $client,
            'lines'             => $lines,
            'meta'              => $meta,
            'template'          => $template,
            'symbol'            => $symbol,
            'currency'          => $currency,
            'reason_label'      => $reasonLabel,
            'refund_method_label' => $refundMethodLabel,
            'subtotal'          => round($subtotal, 2),
            'tax'               => round($totalTax, 2),
            'discount'          => round($totalDiscount, 2),
            'total'             => round($grandTotal, 2),
        ])->setPaper('a4', 'portrait');

        return [
            'bytes'    => $pdf->output(),
            'subtotal' => round($subtotal, 2),
            'tax'      => round($totalTax, 2),
            'discount' => round($totalDiscount, 2),
            'total'    => round($grandTotal, 2),
        ];
    }

    public function validate(array $company, array $client, array $items, array $meta): array
    {
        $errors = [];

        if (empty(trim($company['name'] ?? ''))) {
            $errors[] = 'Your company name is required.';
        }
        if (empty(trim($client['name'] ?? ''))) {
            $errors[] = 'A client / credit-to name is required.';
        }
        if (empty(trim($meta['original_invoice_number'] ?? ''))) {
            $errors[] = 'Original invoice number is required for reference.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one credit line item.';
        }
        if (count($items) > self::MAX_LINE_ITEMS) {
            $errors[] = 'A single credit note supports at most ' . self::MAX_LINE_ITEMS . ' line items.';
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

    public function nextCreditNoteNumber(): string
    {
        return 'CN-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
