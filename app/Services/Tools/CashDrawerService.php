<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * CashDrawerService — till reconciliation & cash drawer count sheet PDF builder.
 *
 * Free TOFU tool: validates currency denomination counts, calculates expected
 * vs counted totals, variances (over/short), and renders an audit PDF.
 */
class CashDrawerService
{
    public const CURRENCIES = [
        'USD' => ['symbol' => '$', 'label' => 'USD ($)'],
        'EUR' => ['symbol' => '€', 'label' => 'EUR (€)'],
        'GBP' => ['symbol' => '£', 'label' => 'GBP (£)'],
        'CAD' => ['symbol' => 'CA$', 'label' => 'CAD (CA$)'],
        'AUD' => ['symbol' => 'AU$', 'label' => 'AUD (AU$)'],
        'PKR' => ['symbol' => 'Rs', 'label' => 'PKR (Rs)'],
        'INR' => ['symbol' => '₹', 'label' => 'INR (₹)'],
        'AED' => ['symbol' => 'AED', 'label' => 'AED'],
        'SAR' => ['symbol' => 'SAR', 'label' => 'SAR'],
    ];

    public const DEFAULT_DENOMINATIONS = [
        'USD' => [
            'bills' => [
                ['name' => '$100 Bill', 'value' => 100.00],
                ['name' => '$50 Bill',  'value' => 50.00],
                ['name' => '$20 Bill',  'value' => 20.00],
                ['name' => '$10 Bill',  'value' => 10.00],
                ['name' => '$5 Bill',   'value' => 5.00],
                ['name' => '$1 Bill',   'value' => 1.00],
            ],
            'coins' => [
                ['name' => '$1 Coin',   'value' => 1.00],
                ['name' => '25¢ Quarter', 'value' => 0.25],
                ['name' => '10¢ Dime',    'value' => 0.10],
                ['name' => '5¢ Nickel',   'value' => 0.05],
                ['name' => '1¢ Penny',    'value' => 0.01],
            ],
        ],
        'EUR' => [
            'bills' => [
                ['name' => '€500 Note', 'value' => 500.00],
                ['name' => '€200 Note', 'value' => 200.00],
                ['name' => '€100 Note', 'value' => 100.00],
                ['name' => '€50 Note',  'value' => 50.00],
                ['name' => '€20 Note',  'value' => 20.00],
                ['name' => '€10 Note',  'value' => 10.00],
                ['name' => '€5 Note',   'value' => 5.00],
            ],
            'coins' => [
                ['name' => '€2 Coin',   'value' => 2.00],
                ['name' => '€1 Coin',   'value' => 1.00],
                ['name' => '50c Coin',  'value' => 0.50],
                ['name' => '20c Coin',  'value' => 0.20],
                ['name' => '10c Coin',  'value' => 0.10],
                ['name' => '5c Coin',   'value' => 0.05],
                ['name' => '2c Coin',   'value' => 0.02],
                ['name' => '1c Coin',   'value' => 0.01],
            ],
        ],
        'GBP' => [
            'bills' => [
                ['name' => '£50 Note', 'value' => 50.00],
                ['name' => '£20 Note', 'value' => 20.00],
                ['name' => '£10 Note', 'value' => 10.00],
                ['name' => '£5 Note',  'value' => 5.00],
            ],
            'coins' => [
                ['name' => '£2 Coin',  'value' => 2.00],
                ['name' => '£1 Coin',  'value' => 1.00],
                ['name' => '50p Coin', 'value' => 0.50],
                ['name' => '20p Coin', 'value' => 0.20],
                ['name' => '10p Coin', 'value' => 0.10],
                ['name' => '5p Coin',  'value' => 0.05],
                ['name' => '2p Coin',  'value' => 0.02],
                ['name' => '1p Coin',  'value' => 0.01],
            ],
        ],
    ];

    /**
     * Build cash drawer reconciliation data and render PDF.
     *
     * @param array $store  ['name', 'location', 'cashier_name', 'supervisor_name', 'register_id', 'shift_date', 'notes']
     * @param array $denoms list of ['name', 'type' ('bill'|'coin'), 'value', 'count']
     * @param array $meta   ['currency', 'opening_float', 'expected_cash_sales', 'expected_cash_total']
     */
    public function build(array $store, array $denoms, array $meta): array
    {
        $errors = $this->validate($store, $denoms, $meta);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $currency = $meta['currency'] ?? 'USD';
        $symbol = self::CURRENCIES[$currency]['symbol'] ?? '$';

        $openingFloat = max(0, (float) ($meta['opening_float'] ?? 0));
        $expectedSales = max(0, (float) ($meta['expected_cash_sales'] ?? 0));

        $expectedTotal = isset($meta['expected_cash_total']) && $meta['expected_cash_total'] !== ''
            ? (float) $meta['expected_cash_total']
            : ($openingFloat + $expectedSales);

        $processedDenoms = [];
        $totalBills = 0.0;
        $totalCoins = 0.0;
        $totalCountedCash = 0.0;

        foreach ($denoms as $d) {
            $name = trim($d['name'] ?? 'Item');
            $type = in_array(strtolower($d['type'] ?? 'bill'), ['bill', 'coin'], true) ? strtolower($d['type']) : 'bill';
            $val = max(0, (float) ($d['value'] ?? 0));
            $count = max(0, (int) ($d['count'] ?? 0));
            $subtotal = round($val * $count, 2);

            if ($type === 'bill') {
                $totalBills += $subtotal;
            } else {
                $totalCoins += $subtotal;
            }
            $totalCountedCash += $subtotal;

            $processedDenoms[] = [
                'name' => $name,
                'type' => $type,
                'value' => $val,
                'count' => $count,
                'subtotal' => $subtotal,
            ];
        }

        $variance = round($totalCountedCash - $expectedTotal, 2);
        $varianceStatus = 'exact';
        if ($variance > 0) {
            $varianceStatus = 'over';
        } elseif ($variance < 0) {
            $varianceStatus = 'short';
        }

        $pdf = Pdf::loadView('tools.pdf.cash-drawer', [
            'store' => $store,
            'denoms' => $processedDenoms,
            'meta' => $meta,
            'currency' => $currency,
            'symbol' => $symbol,
            'openingFloat' => round($openingFloat, 2),
            'expectedSales' => round($expectedSales, 2),
            'expectedTotal' => round($expectedTotal, 2),
            'totalBills' => round($totalBills, 2),
            'totalCoins' => round($totalCoins, 2),
            'totalCountedCash' => round($totalCountedCash, 2),
            'variance' => $variance,
            'varianceStatus' => $varianceStatus,
        ])->setPaper('a4', 'portrait');

        return [
            'bytes' => $pdf->output(),
            'totalBills' => round($totalBills, 2),
            'totalCoins' => round($totalCoins, 2),
            'totalCountedCash' => round($totalCountedCash, 2),
            'expectedTotal' => round($expectedTotal, 2),
            'variance' => $variance,
            'varianceStatus' => $varianceStatus,
        ];
    }

    public function validate(array $store, array $denoms, array $meta): array
    {
        $errors = [];

        if (empty(trim($store['name'] ?? ''))) {
            $errors[] = 'Store name is required.';
        }
        if (empty($denoms)) {
            $errors[] = 'Add at least one currency denomination line.';
        }
        if (!empty($meta['currency']) && !array_key_exists($meta['currency'], self::CURRENCIES)) {
            $errors[] = 'Unsupported currency.';
        }

        return $errors;
    }

    public function getDefaultDenominations(string $currency = 'USD'): array
    {
        if (isset(self::DEFAULT_DENOMINATIONS[$currency])) {
            $bills = array_map(fn($b) => array_merge($b, ['type' => 'bill', 'count' => 0]), self::DEFAULT_DENOMINATIONS[$currency]['bills']);
            $coins = array_map(fn($c) => array_merge($c, ['type' => 'coin', 'count' => 0]), self::DEFAULT_DENOMINATIONS[$currency]['coins']);
            return array_merge($bills, $coins);
        }

        // Generic fallback for USD or unspecified
        return [
            ['name' => '$100 Bill', 'type' => 'bill', 'value' => 100.00, 'count' => 0],
            ['name' => '$50 Bill',  'type' => 'bill', 'value' => 50.00,  'count' => 0],
            ['name' => '$20 Bill',  'type' => 'bill', 'value' => 20.00,  'count' => 0],
            ['name' => '$10 Bill',  'type' => 'bill', 'value' => 10.00,  'count' => 0],
            ['name' => '$5 Bill',   'type' => 'bill', 'value' => 5.00,   'count' => 0],
            ['name' => '$1 Bill',   'type' => 'bill', 'value' => 1.00,   'count' => 0],
            ['name' => '$1 Coin',   'type' => 'coin', 'value' => 1.00,   'count' => 0],
            ['name' => '25¢ Quarter', 'type' => 'coin', 'value' => 0.25, 'count' => 0],
            ['name' => '10¢ Dime',    'type' => 'coin', 'value' => 0.10, 'count' => 0],
            ['name' => '5¢ Nickel',   'type' => 'coin', 'value' => 0.05, 'count' => 0],
            ['name' => '1¢ Penny',    'type' => 'coin', 'value' => 0.01, 'count' => 0],
        ];
    }
}
