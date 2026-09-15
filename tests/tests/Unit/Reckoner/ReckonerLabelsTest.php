<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerLabels;
use Tests\TestCase;

/**
 * §7.16 — signed metric label swap (Profit/Loss, Inflow/Outflow, etc.)
 *
 * @group reckoner
 */
class ReckonerLabelsTest extends TestCase
{
    /* ------------------------------------------------------------------ *
     * Positive / zero values keep the positive label
     * ------------------------------------------------------------------ */

    public function test_positive_net_profit_keeps_profit_label(): void
    {
        $definition = ['label' => 'Net Profit', 'signed' => true];
        $this->assertSame('Net Profit', ReckonerLabels::resolve('finance.net_profit', $definition, 500.0));
    }

    public function test_zero_net_profit_keeps_profit_label(): void
    {
        $definition = ['label' => 'Net Profit', 'signed' => true];
        $this->assertSame('Net Profit', ReckonerLabels::resolve('finance.net_profit', $definition, 0.0));
    }

    /* ------------------------------------------------------------------ *
     * Negative values flip to the loss-side label
     * ------------------------------------------------------------------ */

    public function test_negative_net_profit_becomes_net_loss(): void
    {
        $definition = ['label' => 'Net Profit', 'signed' => true];
        $this->assertSame('Net Loss', ReckonerLabels::resolve('finance.net_profit', $definition, -1.0));
    }

    public function test_negative_gross_profit_becomes_gross_loss(): void
    {
        $definition = ['label' => 'Gross Profit', 'signed' => true];
        $this->assertSame('Gross Loss', ReckonerLabels::resolve('finance.gross_profit', $definition, -100.0));
    }

    /* ------------------------------------------------------------------ *
     * Non-signed metrics are never flipped
     * ------------------------------------------------------------------ */

    public function test_unsigned_metric_keeps_label_when_negative(): void
    {
        $definition = ['label' => 'Expenses', 'signed' => false];
        $this->assertSame('Expenses', ReckonerLabels::resolve('finance.expenses_total', $definition, -999.0));
    }

    /* ------------------------------------------------------------------ *
     * Missing / non-numeric value falls back to default label
     * ------------------------------------------------------------------ */

    public function test_null_value_keeps_default_label(): void
    {
        $definition = ['label' => 'Net Profit', 'signed' => true];
        $this->assertSame('Net Profit', ReckonerLabels::resolve('finance.net_profit', $definition, null));
    }

    public function test_non_numeric_value_keeps_default_label(): void
    {
        $definition = ['label' => 'Net Profit', 'signed' => true];
        $this->assertSame('Net Profit', ReckonerLabels::resolve('finance.net_profit', $definition, 'not a number'));
    }

    public function test_value_in_array_envelope_is_read_correctly(): void
    {
        // The SCALAR shape wraps the value as ['value' => ...] before it
        // reaches ReckonerLabels::resolve() in ReckonerResult::success().
        $definition = ['label' => 'Net Profit', 'signed' => true];
        $this->assertSame('Net Loss', ReckonerLabels::resolve('finance.net_profit', $definition, ['value' => -42.0]));
    }

    /* ------------------------------------------------------------------ *
     * Metric not in SIGNED_LABELS table is left alone (no silent swap)
     * ------------------------------------------------------------------ */

    public function test_signed_metric_not_in_table_keeps_default_label(): void
    {
        // A key the table doesn't know about: signed=true but no SIGNED_LABELS
        // entry means resolve() returns the definition label unchanged.
        $definition = ['label' => 'Mystery Metric', 'signed' => true];
        $this->assertSame('Mystery Metric', ReckonerLabels::resolve('some.unknown_key', $definition, -1.0));
    }
}
