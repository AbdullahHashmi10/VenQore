<?php

use App\Models\Tenant;
use Illuminate\Support\Facades\Session;

beforeEach(function () {
    $this->tenant = $this->createTenant('geo-test-store');
    $this->owner = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);
});

test('it resolves pakistan country from cloudflare header', function () {
    $response = $this->withHeaders([
        'CF-IPCountry' => 'PK',
    ])->get(route('marketing.pricing'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Marketing/Pricing')
        ->where('geo.country', 'PK')
        ->where('geo.currency', 'PKR')
        ->where('geo.symbol', 'Rs')
    );
});

test('it defaults to usd for other countries', function () {
    $response = $this->withHeaders([
        'CF-IPCountry' => 'US',
    ])->get(route('marketing.pricing'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Marketing/Pricing')
        ->where('geo.country', 'US')
        ->where('geo.currency', 'USD')
        ->where('geo.symbol', '$')
    );
});

test('manual currency override persists in session', function () {
    $response = $this->post(route('marketing.pricing.override'), [
        'country' => 'PK',
    ]);

    $response->assertRedirect();
    expect(session('geo_country_override'))->toBe('PK');

    // Subsequent hit without headers should now resolve to PKR via session
    $pricingResponse = $this->get(route('marketing.pricing'));
    $pricingResponse->assertInertia(fn ($page) => $page
        ->where('geo.currency', 'PKR')
    );
});

test('checkout redirection is securely enforced on backend', function () {
    // Set mock checkout URLs in configuration env
    config([
        'services.lemon_squeezy.starter_checkout_url' => 'https://checkout.lemonsqueezy.com/starter-usd',
        'services.lemon_squeezy.starter_pkr_url' => 'https://checkout.lemonsqueezy.com/starter-pkr',
    ]);
    
    // Temporarily seed environment variables to verify BillingController configuration checks
    putenv('LEMON_SQUEEZY_STARTER_CHECKOUT_URL=https://checkout.lemonsqueezy.com/starter-usd');
    putenv('LEMON_SQUEEZY_STARTER_PKR_URL=https://checkout.lemonsqueezy.com/starter-pkr');

    // 1. Simulate a US checkout
    $responseUs = $this->withHeaders([
        'CF-IPCountry' => 'US',
    ])->get(route('store.billing.upgrade', [
        'store_slug' => $this->tenant->slug,
        'plan' => 'starter',
    ]));

    $responseUs->assertRedirectContains('starter-usd');

    // 2. Simulate a Pakistan checkout
    $responsePk = $this->withHeaders([
        'CF-IPCountry' => 'PK',
    ])->get(route('store.billing.upgrade', [
        'store_slug' => $this->tenant->slug,
        'plan' => 'starter',
    ]));

    $responsePk->assertRedirectContains('starter-pkr');
    
    // Clean up putenv variables
    putenv('LEMON_SQUEEZY_STARTER_CHECKOUT_URL');
    putenv('LEMON_SQUEEZY_STARTER_PKR_URL');
});

test('checkout redirection prefers database dynamic URLs', function () {
    // Create/update the starter plan in the database to have database checkout URLs
    $starterPlan = \App\Models\Plan::where('slug', 'starter')->first();
    if ($starterPlan) {
        $starterPlan->update([
            'checkout_url_usd' => 'https://checkout.lemonsqueezy.com/db-starter-usd',
            'checkout_url_pkr' => 'https://checkout.lemonsqueezy.com/db-starter-pkr',
        ]);
    }

    // 1. Simulate a US checkout and assert it redirects to the database-managed USD URL
    $responseUs = $this->withHeaders([
        'CF-IPCountry' => 'US',
    ])->get(route('store.billing.upgrade', [
        'store_slug' => $this->tenant->slug,
        'plan' => 'starter',
    ]));

    $responseUs->assertRedirectContains('db-starter-usd');

    // 2. Simulate a Pakistan checkout and assert it redirects to the database-managed PKR URL
    $responsePk = $this->withHeaders([
        'CF-IPCountry' => 'PK',
    ])->get(route('store.billing.upgrade', [
        'store_slug' => $this->tenant->slug,
        'plan' => 'starter',
    ]));

    $responsePk->assertRedirectContains('db-starter-pkr');
});
