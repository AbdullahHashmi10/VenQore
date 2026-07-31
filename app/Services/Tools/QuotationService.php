<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * QuotationService — builds a free, unwatermarked PDF quotation/estimate
 * from a company profile, a client, and a set of line items.
 *
 * Distinct from InvoiceService: a quotation is a pre-sale offer, not a bill.
 * It carries a "Valid Until" expiry (issue date + validity_days, default 30)
 * and an acceptance/signature block instead of payment terms. Like the other
 * document tools, this is a document generator only — nothing here writes to
 * Transaction/JournalEntry, and CURRENCIES/TEMPLATES are deliberately
 * duplicated rather than shared with InvoiceService (established pattern).
 */
class QuotationService
{
    public const TEMPLATES = [
        'clean'    => ['name' => 'Clean',    'description' => 'Minimal black-and-white, works for any industry.'],
        'modern'   => ['name' => 'Modern',   'description' => 'Bold accent color band, good for creative/retail brands.'],
        'classic'  => ['name' => 'Classic',  'description' => 'Traditional bordered table, familiar to accountants.'],
        'compact'  => ['name' => 'Compact',  'description' => 'Dense layout for quotes with many line items.'],
    ];

    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    public const MAX_LINE_ITEMS = 100;

    public const DEFAULT_VALIDITY_DAYS = 30;

    /**
     * @param array $company     ['name','address','email','phone','logo_base64','tax_id']
     * @param array $client      ['name','address','email']
     * @param array $items       list of ['description','quantity','unit_price','tax_rate','discount_pct']
     * @param array $meta        ['quote_number','document_label','issue_date','validity_days','valid_until',
     *                            'currency','notes','scope_of_work','exclusions','template','accent_color']
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

        $label = strtoupper($meta['document_label'] ?? 'QUOTATION');
        if (!in_array($label, ['QUOTATION', 'ESTIMATE'], true)) {
            $label = 'QUOTATION';
        }
        $meta['document_label'] = $label;

        // Resolve issue date + validity → valid_until, unless explicitly given.
        $issueDate = !empty($meta['issue_date']) ? $meta['issue_date'] : now()->format('Y-m-d');
        $validityDays = (int) ($meta['validity_days'] ?? self::DEFAULT_VALIDITY_DAYS);
        if ($validityDays <= 0) {
            $validityDays = self::DEFAULT_VALIDITY_DAYS;
        }
        $meta['issue_date'] = $issueDate;
        $meta['validity_days'] = $validityDays;

        if (empty($meta['valid_until'])) {
            try {
                $meta['valid_until'] = \Carbon\Carbon::parse($issueDate)->addDays($validityDays)->format('Y-m-d');
            } catch (\Throwable $e) {
                $meta['valid_until'] = now()->addDays($validityDays)->format('Y-m-d');
            }
        }

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

        $pdf = Pdf::loadView('tools.pdf.quotation', [
            'company'  => $company,
            'client'   => $client,
            'lines'    => $lines,
            'meta'     => $meta,
            'template' => $template,
            'symbol'   => $symbol,
            'currency' => $currency,
            'subtotal' => round($subtotal, 2),
            'tax'      => round($totalTax, 2),
            'discount' => round($totalDiscount, 2),
            'total'    => round($grandTotal, 2),
        ])->setPaper('a4', 'portrait');

        return [
            'bytes'       => $pdf->output(),
            'subtotal'    => round($subtotal, 2),
            'tax'         => round($totalTax, 2),
            'discount'    => round($totalDiscount, 2),
            'total'       => round($grandTotal, 2),
            'valid_until' => $meta['valid_until'],
        ];
    }

    public function validate(array $company, array $client, array $items, array $meta): array
    {
        $errors = [];

        if (empty(trim($company['name'] ?? ''))) {
            $errors[] = 'Your company name is required.';
        }
        if (empty(trim($client['name'] ?? ''))) {
            $errors[] = 'A client name is required.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one line item.';
        }
        if (count($items) > self::MAX_LINE_ITEMS) {
            $errors[] = 'A single quotation supports at most ' . self::MAX_LINE_ITEMS . ' line items.';
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

    public function nextQuoteNumber(): string
    {
        return 'QTE-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
