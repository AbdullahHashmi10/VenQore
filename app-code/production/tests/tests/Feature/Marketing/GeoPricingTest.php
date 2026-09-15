<?php

namespace Tests\Feature\Marketing;

use Tests\TestCase;

class GeoPricingTest extends TestCase
{
    public function test_it_resolves_pakistan_country_from_cloudflare_header(): void
    {
        $this->withHeader('CF-IPCountry', 'PK')
            ->get('/pricing')
            ->assertOk()
            ->assertSee('<meta name="vq-currency" content="PKR">', false);
    }

    public function test_it_defaults_to_usd_for_other_countries(): void
    {
        $this->withHeader('CF-IPCountry', 'GB')
            ->get('/pricing')
            ->assertOk()
            ->assertSee('<meta name="vq-currency" content="USD">', false);
    }

    public function test_manual_currency_override_persists_in_session(): void
    {
        $this->from('/pricing')
            ->post('/pricing/currency-override', ['country' => 'PK'])
            ->assertRedirect('/pricing')
            ->assertSessionHas('geo_country_override', 'PK');

        $this->get('/pricing')
            ->assertOk()
            ->assertSee('<meta name="vq-currency" content="PKR">', false);
    }
}
