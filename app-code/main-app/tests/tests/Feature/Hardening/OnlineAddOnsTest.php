<?php

namespace Tests\Feature\Hardening;

use App\Services\Commerce\CommerceException;
use App\Services\Commerce\OnlineAddOns;
use Tests\TestCase;

/**
 * What a customer may choose on the public menu is decided on the server from
 * option ids only. Pure logic: no database needed.
 */
class OnlineAddOnsTest extends TestCase
{
    private function sampleGroups(): array
    {
        return [
            ['id' => 1, 'name' => 'Size', 'min_select' => 0, 'max_select' => 1, 'required' => true, 'options' => [
                ['id' => 10, 'name' => 'Regular', 'price_delta' => 0.0, 'is_default' => true],
                ['id' => 11, 'name' => 'Large', 'price_delta' => 150.0, 'is_default' => false],
            ]],
            ['id' => 2, 'name' => 'Toppings', 'min_select' => 0, 'max_select' => 2, 'required' => false, 'options' => [
                ['id' => 20, 'name' => 'Cheese', 'price_delta' => 50.0, 'is_default' => false],
                ['id' => 21, 'name' => 'Olives', 'price_delta' => 30.0, 'is_default' => false],
                ['id' => 22, 'name' => 'Jalapeno', 'price_delta' => 20.0, 'is_default' => false],
            ]],
        ];
    }

    /** @test */
    public function a_valid_choice_is_resolved_with_server_prices(): void
    {
        $r = (new OnlineAddOns())->resolve($this->sampleGroups(), [11, 20, 21], 'Pizza');
        $this->assertSame([11, 20, 21], array_column($r, 'id'));
        $this->assertSame(230.0, array_sum(array_column($r, 'price_delta')));
    }

    /** @test */
    public function a_required_group_cannot_be_skipped(): void
    {
        $this->expectException(CommerceException::class);
        (new OnlineAddOns())->resolve($this->sampleGroups(), [20], 'Pizza');
    }

    /** @test */
    public function too_many_choices_in_a_group_are_refused(): void
    {
        $this->expectException(CommerceException::class);
        (new OnlineAddOns())->resolve($this->sampleGroups(), [10, 20, 21, 22], 'Pizza');
    }

    /** @test */
    public function an_option_the_product_does_not_offer_is_refused(): void
    {
        $this->expectException(CommerceException::class);
        (new OnlineAddOns())->resolve($this->sampleGroups(), [10, 999], 'Pizza');
    }

    /** @test */
    public function a_product_without_add_ons_accepts_none(): void
    {
        $this->assertSame([], (new OnlineAddOns())->resolve([], [], 'Water'));
        $this->expectException(CommerceException::class);
        (new OnlineAddOns())->resolve([], [5], 'Water');
    }
}
