<?php

namespace App\Services\V3;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaxService
{
    private $tenantId;

    public function __construct() {
        $this->tenantId = app('current.tenant')->id;
    }
    /**
     * OWNS: All tax calculation logic.
     * No other class performs tax arithmetic inline.
     * Controllers call this and use the returned array.
     *
     * NEVER called for advance receipts (B20) — S-048 decision:
     * tax is posted at delivery, not receipt. Pass isAdvanceReceipt=true
     * to enforce this at the calculation layer.
     */

    /**
     * Calculate tax for a single line item.
     *
     * @param float $amount           The line amount (net or gross depending on flag)
     * @param float $taxRate          Tax percentage e.g. 17.00 for 17%
     * @param bool  $priceIncludesTax True = amount is gross (tax already inside)
     * @param bool  $isAdvanceReceipt True = S-048 rule — return zero tax always
     *
     * @return array{net: float, tax: float, gross: float}
     */
    public function calculateLineTax(
        float $amount,
        float $taxRate,
        bool  $priceIncludesTax = false,
        bool  $isAdvanceReceipt = false
    ): array {
        // S-048 — Advance receipts carry zero tax. Tax is posted at delivery only.
        if ($isAdvanceReceipt || $taxRate <= 0) {
            return [
                'net'   => round($amount, 2),
                'tax'   => 0.00,
                'gross' => round($amount, 2),
            ];
        }

        if ($priceIncludesTax) {
            // Amount is gross — extract net and tax from inside
            $net = round($amount / (1 + ($taxRate / 100)), 2);
            $tax = round($amount - $net, 2);

            // Correct for rounding gap to ensure net + tax = gross exactly
            if (($net + $tax) !== round($amount, 2)) {
                $tax = round($amount, 2) - $net;
            }

            return [
                'net'   => $net,
                'tax'   => $tax,
                'gross' => round($amount, 2),
            ];
        }

        // Amount is net — calculate tax on top
        $tax   = round($amount * ($taxRate / 100), 2);
        $gross = round($amount + $tax, 2);

        return [
            'net'   => round($amount, 2),
            'tax'   => $tax,
            'gross' => $gross,
        ];
    }

    /**
     * Tax report: Sales Tax Payable (2200) vs Input Tax Recoverable (2300).
     * Returns net tax payable to the government for a given period.
     *
     * @return array{
     *   sales_tax_collected:   float,
     *   input_tax_recoverable: float,
     *   net_tax_payable:       float,
     *   period_from:           string,
     *   period_to:             string
     * }
     */
    public function taxReport(Carbon $from, Carbon $to): array
    {
        $tid = $this->tenantId;
        $account2200 = DB::table('accounts')->where('tenant_id', $tid)->where('code', '2200')->first();
        $account2300 = DB::table('accounts')->where('tenant_id', $tid)->where('code', '2300')->first();

        // 2200 Sales Tax Payable — credit-normal — balance = SUM(credit) - SUM(debit)
        $salesTaxCollected = 0.00;
        if ($account2200) {
            $row = DB::table('journal_items')
                ->where('journal_items.tenant_id', $tid)
                ->join('journal_entries', function($join) use ($tid) {
                    $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                         ->where('journal_entries.tenant_id', $tid);
                })
                ->where('journal_items.account_id', $account2200->id)
                ->where('journal_entries.is_reversed', 0)
                ->whereBetween('journal_entries.date', [
                    $from->toDateString(),
                    $to->toDateString(),
                ])
                ->selectRaw('SUM(credit) as total_credit, SUM(debit) as total_debit')
                ->first();

            $salesTaxCollected = round(
                (float)($row->total_credit ?? 0) - (float)($row->total_debit ?? 0),
                2
            );
        }

        // 2300 Input Tax Recoverable — debit-normal — balance = SUM(debit) - SUM(credit)
        $inputTaxRecoverable = 0.00;
        if ($account2300) {
            $row = DB::table('journal_items')
                ->where('journal_items.tenant_id', $tid)
                ->join('journal_entries', function($join) use ($tid) {
                    $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                         ->where('journal_entries.tenant_id', $tid);
                })
                ->where('journal_items.account_id', $account2300->id)
                ->where('journal_entries.is_reversed', 0)
                ->whereBetween('journal_entries.date', [
                    $from->toDateString(),
                    $to->toDateString(),
                ])
                ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
                ->first();

            $inputTaxRecoverable = round(
                (float)($row->total_debit ?? 0) - (float)($row->total_credit ?? 0),
                2
            );
        }

        return [
            'sales_tax_collected'   => $salesTaxCollected,
            'input_tax_recoverable' => $inputTaxRecoverable,
            'net_tax_payable'       => round($salesTaxCollected - $inputTaxRecoverable, 2),
            'period_from'           => $from->toDateString(),
            'period_to'             => $to->toDateString(),
        ];
    }
}
