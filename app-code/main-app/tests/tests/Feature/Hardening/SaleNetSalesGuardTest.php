<?php

namespace Tests\Feature\Hardening;

use App\Models\Sale;
use App\Observers\SaleObserver;
use Tests\TestCase;

/** A sale saved with a total but no net_sales must not read as zero revenue. */
class SaleNetSalesGuardTest extends TestCase
{
    private function fill(Sale $sale): Sale
    {
        (new SaleObserver())->creating($sale);
        return $sale;
    }

    public function test_zero_net_sales_is_derived_from_total_minus_tax(): void
    {
        $s = $this->fill(new Sale(['status' => 'completed', 'total' => 1050, 'tax' => 50, 'net_sales' => 0]));
        $this->assertEqualsWithDelta(1000.0, (float) $s->net_sales, 0.001);
    }

    public function test_an_explicit_net_sales_is_never_overwritten(): void
    {
        $s = $this->fill(new Sale(['status' => 'completed', 'total' => 1050, 'tax' => 50, 'net_sales' => 900]));
        $this->assertEqualsWithDelta(900.0, (float) $s->net_sales, 0.001);
    }

    public function test_returns_are_left_alone(): void
    {
        $s = $this->fill(new Sale(['status' => 'returned', 'total' => -500, 'net_sales' => 0]));
        $this->assertEqualsWithDelta(0.0, (float) $s->net_sales, 0.001);
    }
}
