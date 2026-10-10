<?php

namespace App\Services\Sales;

use App\Support\Money;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;

/**
 * What a return of some units is worth — from what the sale BOOKED, never by
 * re-pricing today (sale-reliability plan §1: "persist allocation amounts
 * needed for refunds; do not reconstruct them later using today's settings").
 *
 * Each sale line's booked revenue (ex tax, after its bill-discount share) and
 * tax are taken from sale_items.revenue_amount / tax_amount (contract v2), or,
 * for older rows, from the sale's own POSTED totals (net_sales / total_tax)
 * spread over its lines by largest remainder — so a legacy line still refunds
 * its true share of what the books recorded.
 *
 * A partial return takes a CUMULATIVE share: value(returned after) minus
 * value(returned before), each exact and half-up. However a line comes back in
 * pieces, the pieces add up to exactly what the line booked.
 */
final class ReturnValuation
{
    /**
     * @param object   $sale  the original sales row (net_sales, total_tax)
     * @param iterable $lines ALL of its sale_items rows
     * @return array<string, array{revenue:int, tax:int, qty:string}> keyed by sale_item id
     */
    public static function booked(object $sale, iterable $lines): array
    {
        $lines = is_array($lines) ? $lines : collect($lines)->all();
        $m = fn ($v) => Money::toMinor(Money::parse($v === null ? 0 : (is_float($v) ? number_format($v, 6, '.', '') : $v), 'amount', false));
        $out = [];
        $allBooked = count($lines) > 0;
        foreach ($lines as $l) {
            if (!property_exists($l, 'revenue_amount') || $l->revenue_amount === null) {
                $allBooked = false;
                break;
            }
        }
        if ($allBooked) {
            foreach ($lines as $l) {
                $out[(string) $l->id] = ['revenue' => $m($l->revenue_amount), 'tax' => $m($l->tax_amount ?? 0), 'qty' => (string) $l->quantity];
            }
            return $out;
        }

        // Legacy rows: spread the sale's posted totals over its lines.
        $netWeights = array_map(fn ($l) => max(0, $m(
            ((float) ($l->net_amount ?? 0)) > 0 ? $l->net_amount : ((float) $l->unit_price * (float) $l->quantity)
        )), $lines);
        $taxWeights = array_map(fn ($l) => max(0, $m($l->tax_amount ?? 0)), $lines);
        // A very old row may never have recorded net_sales / total_tax: then the
        // lines' own amounts are the best record there is.
        $revenueTotal = ($sale->net_sales ?? null) === null ? array_sum($netWeights) : max(0, $m($sale->net_sales));
        $taxTotal = ($sale->total_tax ?? null) === null
            ? (($sale->tax ?? null) === null ? array_sum($taxWeights) : max(0, $m($sale->tax)))
            : max(0, $m($sale->total_tax));
        $rev = Money::allocate($revenueTotal, array_values($netWeights));
        $tax = Money::allocate($taxTotal, array_sum($taxWeights) > 0 ? array_values($taxWeights) : array_values($netWeights));
        foreach (array_values($lines) as $i => $l) {
            $out[(string) $l->id] = ['revenue' => $rev[$i], 'tax' => $tax[$i], 'qty' => (string) $l->quantity];
        }
        return $out;
    }

    /**
     * Minor units of $bookedMinor for returning $now more units when $before
     * were already returned out of $sold. Cumulative and exact.
     */
    public static function share(int $bookedMinor, mixed $sold, mixed $before, mixed $now): int
    {
        $sold = BigDecimal::of(self::dec($sold));
        $before = BigDecimal::of(self::dec($before));
        $after = $before->plus(BigDecimal::of(self::dec($now)));
        if ($sold->isLessThanOrEqualTo(0)) {
            return 0;
        }
        $cum = function (BigDecimal $q) use ($bookedMinor, $sold): int {
            if ($q->isGreaterThanOrEqualTo($sold)) {
                return $bookedMinor;
            }
            if ($q->isLessThanOrEqualTo(0)) {
                return 0;
            }
            return BigDecimal::of($bookedMinor)->multipliedBy($q)->dividedBy($sold, 0, RoundingMode::HALF_UP)->toInt();
        };
        return $cum($after) - $cum($before);
    }

    private static function dec(mixed $v): string
    {
        if (is_float($v)) {
            return rtrim(rtrim(number_format($v, 6, '.', ''), '0'), '.') ?: '0';
        }
        return (string) ($v ?? 0) ?: '0';
    }
}
