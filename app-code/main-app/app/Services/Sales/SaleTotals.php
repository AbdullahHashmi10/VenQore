<?php

namespace App\Services\Sales;

use App\Exceptions\MoneyException;
use App\Support\Money;
use Brick\Math\BigDecimal;

/**
 * The one sale calculation — contract v2. PHP twin of
 * resources/js/Sell/core/saleTotals.js; both run the hand-computed fixtures in
 * resources/js/tests/fixtures/sale-totals/cases.json.
 *
 *  1. line gross    = q(unit × billed qty); free value = q(unit × free qty)
 *  2. line discount = q(discount) ≤ gross;  net = gross − discount
 *  3. bill discount = q(Σnet × pct / 100) or q(fixed), once ≤ Σnet;
 *                     allocated by largest remainder (ties → earlier line)
 *  4. line tax      = q(base × r / 100) exclusive | q(base × r / (100 + r)) inclusive
 *                     | min(base, q(fixed)); revenue = base − tax (incl.) or base
 *  5. typed charges: delivery, extra, service (amount or % of Σbase), tip
 *  6. components = Σrevenue + Σtax + charges; invoice = bill-round(components);
 *     round_off = invoice − components
 *
 * All outputs are integer minor units. Invalid input throws MoneyException.
 */
final class SaleTotals
{
    public const VERSION = 2;

    /**
     * @param array $input  see class doc; amounts as strings/ints/floats
     * @param bool  $strict false only for legacy (pre-v2) payload adapters
     */
    public static function calculate(array $input, bool $strict = true): array
    {
        $tax = $input['tax'] ?? [];
        $taxOn = !empty($tax['enabled']);
        $inclusive = $taxOn && !empty($tax['inclusive']);
        $defaultRate = $taxOn ? self::rate($tax['default_rate'] ?? 0, 'tax rate', $strict) : BigDecimal::zero();

        $lines = [];
        foreach (array_values($input['lines'] ?? []) as $i => $l) {
            $n = $i + 1;
            $unit = Money::parse($l['unit_price'] ?? 0, "line {$n} price", $strict);
            $qty = Money::parse($l['qty'] ?? 0, "line {$n} quantity", $strict);
            $freeQty = Money::parse($l['free_qty'] ?? 0, "line {$n} free quantity", $strict);
            if ($unit->isNegative()) {
                throw new MoneyException("line {$n} price cannot be negative", 'negative_amount');
            }
            if ($qty->isNegative() || $freeQty->isNegative()) {
                throw new MoneyException("line {$n} quantity cannot be negative", 'invalid_quantity');
            }
            $gross = Money::toMinor($unit->multipliedBy($qty));
            $free = Money::toMinor($unit->multipliedBy($freeQty));
            // A line discount is an amount, or a percentage of the line's gross
            // (quantized once, half-up). Never both.
            if (isset($l['discount_percent']) && $l['discount_percent'] !== null && $l['discount_percent'] !== '') {
                if (isset($l['discount']) && (float) $l['discount'] != 0.0) {
                    throw new MoneyException("line {$n} has both a discount amount and a percentage", 'invalid_discount');
                }
                $pct = self::rate($l['discount_percent'], "line {$n} discount %", $strict);
                if ($pct->isGreaterThan(100)) {
                    throw new MoneyException("line {$n} discount is more than 100%", 'excessive_discount');
                }
                $discount = Money::divRound(
                    $pct->getUnscaledValue()->multipliedBy($gross),
                    \Brick\Math\BigInteger::of(100)->multipliedBy(\Brick\Math\BigInteger::ten()->power($pct->getScale()))
                );
            } else {
                $discount = self::nonNegMinor($l['discount'] ?? 0, "line {$n} discount", $strict);
            }
            if ($discount > $gross) {
                throw new MoneyException("line {$n} discount is more than the line", 'excessive_discount');
            }
            $type = ($l['tax_type'] ?? 'percentage') === 'fixed' ? 'fixed' : 'percentage';
            $hasOwn = array_key_exists('tax_rate', $l) && $l['tax_rate'] !== null && $l['tax_rate'] !== '';
            $rate = $taxOn ? ($hasOwn ? self::rate($l['tax_rate'], "line {$n} tax rate", $strict) : $defaultRate) : BigDecimal::zero();
            $lines[] = compact('gross', 'free', 'discount', 'rate', 'type') + ['index' => $i, 'net' => $gross - $discount];
        }

        $sumNet = array_sum(array_column($lines, 'net'));

        $bd = $input['bill_discount'] ?? [];
        if (($bd['type'] ?? 'fixed') === 'percentage') {
            $pct = self::rate($bd['value'] ?? 0, 'discount percentage', $strict);
            $billDiscount = Money::divRound(
                $pct->getUnscaledValue()->multipliedBy($sumNet),
                \Brick\Math\BigInteger::of(100)->multipliedBy(\Brick\Math\BigInteger::ten()->power($pct->getScale()))
            );
        } else {
            $billDiscount = self::nonNegMinor($bd['value'] ?? 0, 'discount', $strict);
        }
        if ($billDiscount > $sumNet) {
            throw new MoneyException('the discount is more than the sale', 'excessive_discount');
        }
        $shares = Money::allocate($billDiscount, array_column($lines, 'net'));

        $sumBase = $sumTax = $sumRevenue = 0;
        foreach ($lines as $k => &$l) {
            $l['bill_share'] = $shares[$k];
            $l['base'] = $l['net'] - $l['bill_share'];
            $t = 0;
            if ($taxOn && $l['rate']->isPositive()) {
                $rn = $l['rate']->getUnscaledValue();
                $scale = \Brick\Math\BigInteger::ten()->power($l['rate']->getScale());
                if ($l['type'] === 'fixed') {
                    $t = min(Money::toMinor($l['rate']), $l['base']);
                } elseif ($inclusive) {
                    $t = Money::divRound($rn->multipliedBy($l['base']), $scale->multipliedBy(100)->plus($rn));
                } else {
                    $t = Money::divRound($rn->multipliedBy($l['base']), $scale->multipliedBy(100));
                }
            }
            $l['tax'] = $t;
            $l['revenue'] = $inclusive ? $l['base'] - $t : $l['base'];
            $sumBase += $l['base'];
            $sumTax += $t;
            $sumRevenue += $l['revenue'];
        }
        unset($l);

        $c = $input['charges'] ?? [];
        $delivery = self::nonNegMinor($c['delivery'] ?? 0, 'delivery charge', $strict);
        $extra = self::nonNegMinor($c['extra'] ?? 0, 'extra charge', $strict);
        $servicePct = $c['service_pct'] ?? null;
        if ($servicePct !== null && $servicePct !== '' && (float) $servicePct > 0) {
            $p = self::rate($servicePct, 'service charge %', $strict);
            $service = Money::divRound(
                $p->getUnscaledValue()->multipliedBy($sumBase),
                \Brick\Math\BigInteger::ten()->power($p->getScale())->multipliedBy(100)
            );
        } else {
            $service = self::nonNegMinor($c['service'] ?? 0, 'service charge', $strict);
        }
        $tip = self::nonNegMinor($c['tip'] ?? 0, 'tip', $strict);
        $charges = $delivery + $extra + $service + $tip;

        $components = $sumRevenue + $sumTax + $charges;
        $br = $input['bill_rounding'] ?? [];
        $invoice = !empty($br['apply'])
            ? Money::roundToIncrement($components, Money::billIncrementMinor($br['setting'] ?? null))
            : $components;

        return [
            'version'        => self::VERSION,
            'lines'          => array_map(fn ($l) => [
                'index' => $l['index'], 'gross' => $l['gross'], 'free' => $l['free'], 'discount' => $l['discount'],
                'net' => $l['net'], 'bill_share' => $l['bill_share'], 'base' => $l['base'], 'tax' => $l['tax'],
                'revenue' => $l['revenue'],
            ], $lines),
            'subtotal_gross' => array_sum(array_map(fn ($l) => $l['gross'] + $l['free'], $lines)),
            'free_value'     => array_sum(array_column($lines, 'free')),
            'item_discounts' => array_sum(array_column($lines, 'discount')),
            'sum_net'        => $sumNet,
            'bill_discount'  => $billDiscount,
            'taxable'        => $sumBase,
            'tax'            => $sumTax,
            'revenue'        => $sumRevenue,
            'delivery'       => $delivery,
            'extra'          => $extra,
            'service'        => $service,
            'tip'            => $tip,
            'charges'        => $charges,
            'components'     => $components,
            'invoice'        => $invoice,
            'round_off'      => $invoice - $components,
        ];
    }

    /** Result with every amount as a currency string (fixtures, logs, responses). */
    public static function serialize(array $r): array
    {
        $out = [];
        foreach ($r as $k => $v) {
            if ($k === 'lines') {
                $out[$k] = array_map(fn ($l) => array_map(
                    fn ($x, $kk) => $kk === 'index' ? $x : Money::toString($x), $l, array_keys($l)
                ), $v);
                $out[$k] = array_map(fn ($l, $orig) => array_combine(array_keys($orig), $l), $out[$k], $v);
            } elseif ($k === 'version') {
                $out[$k] = $v;
            } else {
                $out[$k] = Money::toString($v);
            }
        }
        return $out;
    }

    private static function rate(mixed $v, string $label, bool $strict): BigDecimal
    {
        $d = Money::parse($v ?? 0, $label, $strict);
        if ($d->isNegative()) {
            throw new MoneyException("{$label} cannot be negative", 'invalid_rate');
        }
        return $d;
    }

    private static function nonNegMinor(mixed $v, string $label, bool $strict): int
    {
        $m = Money::toMinor(Money::parse($v ?? 0, $label, $strict));
        if ($m < 0) {
            throw new MoneyException("{$label} cannot be negative", 'negative_amount');
        }
        return $m;
    }
}
