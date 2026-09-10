<?php

namespace Tests\Feature\Security;

use App\Models\Tenant;
use App\Models\WooConnection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WooWebhookSecretTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
        app()->forgetInstance('current.tenant');
        app()->forgetInstance('current.membership');
    }

    #[Test]
    public function both_woocommerce_webhook_receivers_fail_closed_without_a_secret(): void
    {
        $tenant = Tenant::factory()->create();
        $connection = WooConnection::create([
            'tenant_id' => $tenant->id,
            'name' => 'No-secret connection',
            'site_url' => 'https://shop.example.test',
            'uuid' => WooConnection::generateUuid(),
            'webhook_secret' => null,
            'status' => 'active',
        ]);

        $headers = [
            'x-wc-webhook-signature' => 'attacker-controlled',
            'x-wc-webhook-topic' => 'product.updated',
        ];

        $this->postJson("/api/woo/webhook/{$connection->uuid}", ['id' => 123], $headers)
            ->assertUnauthorized()
            ->assertJson(['ok' => false]);

        $this->postJson("/woocommerce/webhook/{$connection->uuid}", ['line_items' => []], $headers)
            ->assertUnauthorized()
            ->assertJson(['error' => 'Webhook is not configured.']);
    }
}
