<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

/**
 * PaymentFeeToolTest — the Payment Processing Fee Calculator has no POST
 * endpoint at all (every calculation is client-side JS), so this just
 * confirms the page loads and carries its SEO content for crawlers.
 */
class PaymentFeeToolTest extends TestCase
{
    public function test_payment_fee_calculator_page_loads(): void
    {
        $this->get(route('tools.payment-fee'))->assertOk();
    }

    public function test_payment_fee_calculator_page_has_seo_content_for_crawlers(): void
    {
        $response = $this->get('/tools/payment-fee-calculator');
        $response->assertOk();
        $response->assertSee('Payment Processing Fee', false);
        $response->assertSee('application/ld+json', false);
    }
}
