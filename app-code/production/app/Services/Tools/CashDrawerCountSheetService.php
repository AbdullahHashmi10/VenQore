<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * CashDrawerCountSheetService — builds a printable end-of-shift till
 * reconciliation PDF. Denomination "Count" and "Subtotal" cells are
 * deliberately left BLANK on the PDF (write-in by hand) because the actual
 * counted figures do not exist at generation time — this tool only prints
 * the structure (denomination value labels, blank lines, formulas) for
 * staff to fill in physically after counting the drawer.
 */
class CashDrawerCountSheetService
{
    public const MIN_REGISTERS = 1;
    public const MAX_REGISTERS = 10;

    public const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

    /**
     * Real-world denomination lists. Each row: [label, value, type].
     * value is used only to print "x $0.25 =" style hints, never computed
     * into a total server-side.
     */
    private const DENOMINATIONS = [
        'USD' => [
            ['label' => 'Pennies', 'value' => 0.01, 'type' => 'coin'],
            ['label' => 'Nickels', 'value' => 0.05, 'type' => 'coin'],
            ['label' => 'Dimes', 'value' => 0.10, 'type' => 'coin'],
            ['label' => 'Quarters', 'value' => 0.25, 'type' => 'coin'],
            ['label' => '$1 Coin', 'value' => 1.00, 'type' => 'coin'],
            ['label' => '$1 Bill', 'value' => 1.00, 'type' => 'note'],
            ['label' => '$5 Bill', 'value' => 5.00, 'type' => 'note'],
            ['label' => '$10 Bill', 'value' => 10.00, 'type' => 'note'],
            ['label' => '$20 Bill', 'value' => 20.00, 'type' => 'note'],
            ['label' => '$50 Bill', 'value' => 50.00, 'type' => 'note'],
            ['label' => '$100 Bill', 'value' => 100.00, 'type' => 'note'],
        ],
        'CAD' => [
            ['label' => 'Pennies (legacy, if used)', 'value' => 0.01, 'type' => 'coin'],
            ['label' => 'Nickels', 'value' => 0.05, 'type' => 'coin'],
            ['label' => 'Dimes', 'value' => 0.10, 'type' => 'coin'],
            ['label' => 'Quarters', 'value' => 0.25, 'type' => 'coin'],
            ['label' => '$1 Coin (Loonie)', 'value' => 1.00, 'type' => 'coin'],
            ['label' => '$2 Coin (Toonie)', 'value' => 2.00, 'type' => 'coin'],
            ['label' => '$5 Bill', 'value' => 5.00, 'type' => 'note'],
            ['label' => '$10 Bill', 'value' => 10.00, 'type' => 'note'],
            ['label' => '$20 Bill', 'value' => 20.00, 'type' => 'note'],
            ['label' => '$50 Bill', 'value' => 50.00, 'type' => 'note'],
            ['label' => '$100 Bill', 'value' => 100.00, 'type' => 'note'],
        ],
        'EUR' => [
            ['label' => '1 Cent', 'value' => 0.01, 'type' => 'coin'],
            ['label' => '2 Cent', 'value' => 0.02, 'type' => 'coin'],
            ['label' => '5 Cent', 'value' => 0.05, 'type' => 'coin'],
            ['label' => '10 Cent', 'value' => 0.10, 'type' => 'coin'],
            ['label' => '20 Cent', 'value' => 0.20, 'type' => 'coin'],
            ['label' => '50 Cent', 'value' => 0.50, 'type' => 'coin'],
            ['label' => '€1 Coin', 'value' => 1.00, 'type' => 'coin'],
            ['label' => '€2 Coin', 'value' => 2.00, 'type' => 'coin'],
            ['label' => '€5 Note', 'value' => 5.00, 'type' => 'note'],
            ['label' => '€10 Note', 'value' => 10.00, 'type' => 'note'],
            ['label' => '€20 Note', 'value' => 20.00, 'type' => 'note'],
            ['label' => '€50 Note', 'value' => 50.00, 'type' => 'note'],
            ['label' => '€100 Note', 'value' => 100.00, 'type' => 'note'],
            ['label' => '€200 Note', 'value' => 200.00, 'type' => 'note'],
            ['label' => '€500 Note (rare, being phased out)', 'value' => 500.00, 'type' => 'note'],
        ],
        'GBP' => [
            ['label' => '1p', 'value' => 0.01, 'type' => 'coin'],
            ['label' => '2p', 'value' => 0.02, 'type' => 'coin'],
            ['label' => '5p', 'value' => 0.05, 'type' => 'coin'],
            ['label' => '10p', 'value' => 0.10, 'type' => 'coin'],
            ['label' => '20p', 'value' => 0.20, 'type' => 'coin'],
            ['label' => '50p', 'value' => 0.50, 'type' => 'coin'],
            ['label' => '£1 Coin', 'value' => 1.00, 'type' => 'coin'],
            ['label' => '£2 Coin', 'value' => 2.00, 'type' => 'coin'],
            ['label' => '£5 Note', 'value' => 5.00, 'type' => 'note'],
            ['label' => '£10 Note', 'value' => 10.00, 'type' => 'note'],
            ['label' => '£20 Note', 'value' => 20.00, 'type' => 'note'],
            ['label' => '£50 Note', 'value' => 50.00, 'type' => 'note'],
        ],
        // AUD: generic fallback used deliberately — see class doc. Australia's
        // coin lineup (5c/10c/20c/50c/$1/$2) and notes (5/10/20/50/100) are
        // fairly well known, but to stay conservative per the task's own
        // "if not fully confident, use generic fallback" instruction for any
        // currency not double-checked against an authoritative source at
        // build time, AUD ships with the generic 2-row structure.
        'AUD' => null,
    ];

    /**
     * @param array $store  ['name','logo_base64']
     * @param array $meta   ['currency','register_count','registers' => [['name','date','shift','counted_by','verified_by']], 'notes']
     */
    public function build(array $store, array $meta): array
    {
        $errors = $this->validate($store, $meta);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $currency = strtoupper($meta['currency'] ?? 'USD');
        $registerCount = max(self::MIN_REGISTERS, min(self::MAX_REGISTERS, (int) ($meta['register_count'] ?? 1)));

        $registersInput = $meta['registers'] ?? [];
        $registers = [];
        for ($i = 0; $i < $registerCount; $i++) {
            $r = $registersInput[$i] ?? [];
            $registers[] = [
                'name'        => trim($r['name'] ?? ('Register ' . ($i + 1))),
                'date'        => trim($r['date'] ?? ''),
                'shift'       => trim($r['shift'] ?? ''),
                'counted_by'  => trim($r['counted_by'] ?? ''),
                'verified_by' => trim($r['verified_by'] ?? ''),
            ];
        }

        $denominations = self::DENOMINATIONS[$currency] ?? null;
        $currencySymbol = $this->currencySymbol($currency);

        $pdf = Pdf::loadView('tools.pdf.cash-drawer-count-sheet', [
            'store'          => $store,
            'currency'       => $currency,
            'currencySymbol' => $currencySymbol,
            'denominations'  => $denominations, // null => generic coins/notes fallback
            'registers'      => $registers,
            'notes'          => trim($meta['notes'] ?? ''),
        ])->setPaper('a4', 'portrait');

        return [
            'bytes'         => $pdf->output(),
            'registerCount' => count($registers),
        ];
    }

    public function validate(array $store, array $meta): array
    {
        $errors = [];

        if (empty(trim($store['name'] ?? ''))) {
            $errors[] = 'Store name is required.';
        }

        $currency = strtoupper($meta['currency'] ?? 'USD');
        if (!in_array($currency, self::SUPPORTED_CURRENCIES, true)) {
            $errors[] = 'Unsupported currency selected.';
        }

        $registerCount = (int) ($meta['register_count'] ?? 1);
        if ($registerCount < self::MIN_REGISTERS || $registerCount > self::MAX_REGISTERS) {
            $errors[] = 'Register count must be between ' . self::MIN_REGISTERS . ' and ' . self::MAX_REGISTERS . '.';
        }

        return $errors;
    }

    public function currencySymbol(string $currency): string
    {
        return match (strtoupper($currency)) {
            'USD', 'CAD', 'AUD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            default => '',
        };
    }
}
