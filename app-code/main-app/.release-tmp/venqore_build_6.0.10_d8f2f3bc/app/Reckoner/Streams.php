<?php

namespace App\Reckoner;

/**
 * The 16 canonical Reckoner data streams.
 * Source of truth: Section 2.2 of VENQORE_RECKONER_AND_ONBOARDING_BUILD_SPEC.md
 * and `reckoner.json` exported from VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html.
 */
final class Streams
{
    public const LEDGER_JOURNAL = 'ledger.journal';
    public const LEDGER_ACCOUNTS = 'ledger.accounts';
    public const SALES_HEADERS = 'sales.headers';
    public const SALES_LINES = 'sales.lines';
    public const PURCHASE_HEADERS = 'purchase.headers';
    public const PURCHASE_LINES = 'purchase.lines';
    public const STOCK_MOVEMENTS = 'stock.movements';
    public const STOCK_POSITIONS = 'stock.positions';
    public const PARTY_BALANCES = 'party.balances';
    public const PAYMENT_ENTRIES = 'payment.entries';
    public const EXPENSE_ENTRIES = 'expense.entries';
    public const TAX_ENTRIES = 'tax.entries';
    public const PRODUCTION_ENTRIES = 'production.entries';
    public const ATTENDANCE_ENTRIES = 'attendance.entries';
    public const DOC_STATUS = 'doc.status';
    public const MASTER_REGISTRY = 'master.registry';

    public static function all(): array
    {
        return [
            self::LEDGER_JOURNAL => [
                'key' => self::LEDGER_JOURNAL,
                'name' => 'Journal postings',
                'what' => 'Every debit and credit the accounting engine writes. The spine — most money cards trace back here.',
            ],
            self::LEDGER_ACCOUNTS => [
                'key' => self::LEDGER_ACCOUNTS,
                'name' => 'Account balances',
                'what' => 'Running balance per chart-of-accounts node, per period.',
            ],
            self::SALES_HEADERS => [
                'key' => self::SALES_HEADERS,
                'name' => 'Sale documents',
                'what' => 'One row per sale, invoice, or counter ticket: date, party, totals, payment state.',
            ],
            self::SALES_LINES => [
                'key' => self::SALES_LINES,
                'name' => 'Sale lines',
                'what' => 'One row per line item: product, qty, price, cost at time of sale, discount, tax.',
            ],
            self::PURCHASE_HEADERS => [
                'key' => self::PURCHASE_HEADERS,
                'name' => 'Purchase documents',
                'what' => 'One row per supplier bill: date, supplier, totals, payment state.',
            ],
            self::PURCHASE_LINES => [
                'key' => self::PURCHASE_LINES,
                'name' => 'Purchase lines',
                'what' => 'One row per bought line: item, qty, cost, landed additions, tax.',
            ],
            self::STOCK_MOVEMENTS => [
                'key' => self::STOCK_MOVEMENTS,
                'name' => 'Stock movements',
                'what' => 'Every in, out, transfer, adjustment and write-off, with qty and valuation.',
            ],
            self::STOCK_POSITIONS => [
                'key' => self::STOCK_POSITIONS,
                'name' => 'Stock positions',
                'what' => 'Current qty and value per item per location per batch, plus reorder points.',
            ],
            self::PARTY_BALANCES => [
                'key' => self::PARTY_BALANCES,
                'name' => 'Party balances',
                'what' => 'Running receivable and payable per customer and supplier, with age.',
            ],
            self::PAYMENT_ENTRIES => [
                'key' => self::PAYMENT_ENTRIES,
                'name' => 'Payments',
                'what' => 'Every receipt and payout with method, instrument and allocation.',
            ],
            self::EXPENSE_ENTRIES => [
                'key' => self::EXPENSE_ENTRIES,
                'name' => 'Expenses',
                'what' => 'Operating and direct expense entries, categorised and tax-tagged.',
            ],
            self::TAX_ENTRIES => [
                'key' => self::TAX_ENTRIES,
                'name' => 'Tax entries',
                'what' => 'Input, output and withheld tax rows, per rate band and filing period.',
            ],
            self::PRODUCTION_ENTRIES => [
                'key' => self::PRODUCTION_ENTRIES,
                'name' => 'Production runs',
                'what' => 'Batch logs, bill-of-materials consumption, yield, scrap and unit costs.',
            ],
            self::ATTENDANCE_ENTRIES => [
                'key' => self::ATTENDANCE_ENTRIES,
                'name' => 'Attendance & shifts',
                'what' => 'Clock-ins, shift hours, presence and staff sale attribution.',
            ],
            self::DOC_STATUS => [
                'key' => self::DOC_STATUS,
                'name' => 'Document status',
                'what' => 'Open, pending, approved, fulfilled, overdue and cancelled document counts.',
            ],
            self::MASTER_REGISTRY => [
                'key' => self::MASTER_REGISTRY,
                'name' => 'Master records',
                'what' => 'Catalogue of products, services, customers, suppliers, accounts and staff.',
            ],
        ];
    }
}
