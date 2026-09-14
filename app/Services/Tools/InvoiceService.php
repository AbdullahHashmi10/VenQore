<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * InvoiceService — builds a free, unwatermarked PDF invoice from a company
 * profile, a client, and a set of line items.
 *
 * This is a document generator, not an accounting system: nothing here
 * writes to Transaction/JournalEntry. It exists purely as a TOFU/GEO tool
 * (plan §2.2) — the "stop doing this by hand" CTA is what converts a visitor
 * into a VenQore trial, where invoicing is wired to real double-entry books.
 *
 * Money handling: all amounts are floats rounded to 2dp for display and PDF
 * output only. This deliberately avoids importing any Money/decimal library
 * since nothing here persists or reconciles — see plan §6.1 "core output
 * never gated" for why the tool stays this simple.
 */
class InvoiceService
{
    public const TEMPLATES = [
        'clean'    => ['name' => 'Clean',    'description' => 'Minimal black-and-white, works for any industry.'],
        'modern'   => ['name' => 'Modern',   'description' => 'Bold accent color band, good for creative/retail brands.'],
        'classic'  => ['name' => 'Classic',  'description' => 'Traditional bordered table, familiar to accountants.'],
        'compact'  => ['name' => 'Compact',  'description' => 'Dense layout for invoices with many line items.'],
    ];

    public const CURRENCIES = [
        'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'AU$',
        'PKR' => 'Rs', 'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'JPY' => '¥',
    ];

    public const MAX_LINE_ITEMS = 100;

    /**
     * @param array $company     ['name','address','email','phone','logo_base64','tax_id']
     * @param array $client      ['name','address','email']
     * @param array $items       list of ['description','quantity','unit_price','tax_rate','discount_pct']
     * @param array $meta        ['invoice_number','issue_date','due_date','currency','notes','terms','template','accent_color']
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

        $pdf = Pdf::loadView('tools.pdf.invoice', [
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
            $errors[] = 'A client/bill-to name is required.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one line item.';
        }
        if (count($items) > self::MAX_LINE_ITEMS) {
            $errors[] = 'A single invoice supports at most ' . self::MAX_LINE_ITEMS . ' line items.';
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

    public function nextInvoiceNumber(): string
    {
        // Stateless suggestion only — this tool has no persistence, so the
        // "next number" is just today's date plus a random suffix, purely
        // to save the user from typing one. They can always override it.
        return 'INV-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
