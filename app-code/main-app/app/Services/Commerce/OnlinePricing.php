<?php

namespace App\Services\Commerce;

use App\Engines\TaxService;

/**
 * Online price resolution. The ONLY place storefront prices are computed.
 *
 * Precedence (MVP): fixed per-product override -> storefront percentage rule -> regular retail price.
 * The core `products.price` is never written. Rounding: half away from zero to 2 decimals (PHP round()),
 * applied once to the online price. The online price keeps the same tax basis as the product's
 * regular price (tax-inclusive stays inclusive), so tax is never added twice.
 */
class OnlinePricing
{
    public const MAX_INCREASE = 200.0;
    public const MAX_DECREASE = 90.0;

    public static function validateRule(string $mode, float $percent): ?string
    {
        if (! in_array($mode, ['same', 'increase', 'decrease'], true)) {
            return 'Unknown pricing mode.';
        }
        if ($mode === 'same') {
            return null;
        }
        if ($percent <= 0) {
            return 'Percentage must be greater than zero.';
        }
        if ($mode === 'increase' && $percent > self::MAX_INCREASE) {
            return 'Increase cannot exceed ' . self::MAX_INCREASE . '%.';
        }
        if ($mode === 'decrease' && $percent > self::MAX_DECREASE) {
            return 'Decrease cannot exceed ' . self::MAX_DECREASE . '%.';
        }
        return null;
    }

    /**
     * @param object      $product product row (price, cost_price, tax_rate, price_includes_tax)
     * @param object|null $sp      storefront_products row/model (override_price) or null
     * @param object      $store   storefront (pricing_mode, pricing_percent)
     */
    public function resolve(object $product, ?object $sp, object $store): array
    {
        $base = round((float) $product->price, 4);
        $override = $sp->override_price ?? null;

        if ($override !== null && (float) $override > 0) {
            $rule = 'fixed_override';
            $percent = null;
            $online = round((float) $override, 2);
        } elseif ($store->pricing_mode === 'increase' && (float) $store->pricing_percent > 0) {
            $rule = 'percent';
            $percent = (float) $store->pricing_percent;
            $online = round($base * (1 + $percent / 100), 2);
        } elseif ($store->pricing_mode === 'decrease' && (float) $store->pricing_percent > 0) {
            $rule = 'percent';
            $percent = -(float) $store->pricing_percent;
            $online = round($base * (1 + $percent / 100), 2);
        } else {
            $rule = 'regular';
            $percent = null;
            $online = round($base, 2);
        }

        $taxRate = (float) ($product->tax_rate ?? 0);
        $inclusive = (bool) ($product->price_includes_tax ?? false) && $taxRate > 0;
        $net = $inclusive ? round($online / (1 + $taxRate / 100), 4) : round($online, 4);

        return [
            'base_price' => $base,
            'rule' => $rule,
            'rule_percent' => $percent,
            'online_price' => $online,
            'net_unit_price' => $net,
            'tax_rate' => $taxRate,
            'price_includes_tax' => $inclusive,
            'below_cost' => $net < round((float) ($product->cost_price ?? 0), 4),
        ];
    }

    /** Line math mirrors SaleService (gross = round(qty*unit,2); tax from TaxService) so order total == posted sale total. */
    public function line(array $price, float $qty): array
    {
        $lineNet = round($qty * $price['net_unit_price'], 2);
        $tax = app(TaxService::class)->calculateLineTax($lineNet, $price['tax_rate'], false)['tax'];

        return [
            'line_net' => $lineNet,
            'tax_amount' => round($tax, 2),
            'line_total' => round($lineNet + $tax, 2),
        ];
    }
}
