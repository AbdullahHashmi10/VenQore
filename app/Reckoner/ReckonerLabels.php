<?php

namespace App\Reckoner;

/**
 * Display names — never affects the maths (§4 Phase 4). Two responsibilities:
 *
 *   1. §7.16 — a `signed` metric renders a different word when its value is
 *      negative (e.g. "Net Profit" becomes "Net Loss"). This is a table of
 *      exactly the pairs the build spec names; a signed metric NOT in this
 *      table keeps its normal label even when negative (there is no generic
 *      "X" / "Negative X" transform — each pair is a real accounting term,
 *      not a mechanical negation, so an unlisted signed metric is a sign
 *      this table needs a new row, not a fallback rule).
 *
 *   2. Business-type label overrides. Phase 4 scope; only the loss-side
 *      table is exercised by ReckonerResult today. The business-type map is
 *      declared here so Phase 4 settings screens have one place to extend
 *      it, but no registry entry currently opts into a per-business-type
 *      override — none of the ~32 Phase 1/2 metrics needed one to stay
 *      truthful, and inventing overrides with no real business-type-specific
 *      wording to base them on would be exactly the kind of guess this
 *      build tries to avoid.
 */
final class ReckonerLabels
{
    /** §7.16 — metric key => [positive-or-zero label, negative label]. */
    private const SIGNED_LABELS = [
        'finance.gross_profit' => ['Gross Profit', 'Gross Loss'],
        'sales.gross_profit' => ['Gross Profit', 'Gross Loss'],
        'finance.net_profit' => ['Net Profit', 'Net Loss'],
        'finance.net_cash_flow' => ['Net Cash Inflow', 'Net Cash Outflow'],
        'tax.net_payable' => ['Tax Payable', 'Tax Refundable'],
        'inventory.movement_net' => ['Net Stock Gain', 'Net Stock Reduction'],
        'finance.trial_balance_diff' => ['Out of Balance (Dr)', 'Out of Balance (Cr)'],
        'sales.by_party_flow' => ['Net Receivable', 'Net Payable'],
        'finance.profit_trend' => ['Profit Trend', 'Loss Trend'],
        'finance.total_liquidity' => ['Total Liquidity', 'Negative Liquidity'],
    ];

    /**
     * Resolve the label for a result, applying the §7.16 loss-side swap when
     * the metric is signed, in the table above, and the value is negative.
     */
    public static function resolve(string $key, array $definition, mixed $value): string
    {
        $defaultLabel = $definition['label'] ?? $key;

        if (empty($definition['signed']) || ! isset(self::SIGNED_LABELS[$key])) {
            return $defaultLabel;
        }

        $numericValue = is_array($value) ? ($value['value'] ?? null) : $value;

        if (! is_numeric($numericValue)) {
            return $defaultLabel;
        }

        [$positiveLabel, $negativeLabel] = self::SIGNED_LABELS[$key];

        return $numericValue < 0 ? $negativeLabel : $positiveLabel;
    }
}
