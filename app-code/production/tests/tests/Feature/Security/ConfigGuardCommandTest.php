<?php

namespace Tests\Feature\Security;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ConfigGuardCommandTest extends TestCase
{
    #[Test]
    public function it_fails_in_production_when_pricing_contains_a_placeholder(): void
    {
        $this->app['env'] = 'production';

        config([
            'app.debug' => false,
            'mail.default' => 'sendmail',
            'queue.default' => 'database',
            'cache.default' => 'database',
            'session.driver' => 'database',
            'session.secure' => true,
            'database.default' => 'mariadb',
            'services.gemini.key' => 'configured-test-key',
            'services.lemon_squeezy.api_key' => 'configured-test-key',
            'services.lemon_squeezy.signing_secret' => 'configured-test-secret',
            'services.lemon_squeezy.test_mode' => false,
            'sentry.dsn' => 'https://public@example.invalid/1',
            'pricing' => [
                'plans' => [
                    'starter' => ['variant_id_monthly' => 'REPLACE_ME'],
                ],
            ],
        ]);

        $this->artisan('venqore:config-guard')
            ->expectsOutputToContain('Placeholder variant IDs still present: plans.starter.variant_id_monthly')
            ->assertFailed();
    }
}
