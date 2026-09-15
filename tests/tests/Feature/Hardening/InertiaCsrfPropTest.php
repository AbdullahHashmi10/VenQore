<?php

namespace Tests\Feature\Hardening;

use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Login regenerates the CSRF token, but an Inertia visit never refreshes the
 * <meta name="csrf-token"> tag, so the first POST after login (e.g. the 2FA code
 * after /VenQore-login) used to fail with 419. Every Inertia page now carries the
 * live token as `csrf_token`; resources/js/bootstrap.js re-syncs axios from it.
 */
class InertiaCsrfPropTest extends VenQoreTestCase
{
    #[Test]
    public function every_inertia_page_carries_the_live_csrf_token(): void
    {
        $response = $this->get('/pricing', ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest']);
        $response->assertOk();

        $token = $response->json('props.csrf_token');
        $this->assertIsString($token);
        $this->assertSame(session()->token(), $token);
    }

    #[Test]
    public function the_token_in_the_props_changes_when_the_session_token_is_regenerated(): void
    {
        $first = $this->get('/pricing', ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])->json('props.csrf_token');

        session()->regenerateToken();

        $second = $this->get('/pricing', ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])->json('props.csrf_token');
        $this->assertNotSame($first, $second);
        $this->assertSame(session()->token(), $second);
    }

    #[Test]
    public function bootstrap_resyncs_axios_from_the_page_prop_after_each_visit(): void
    {
        $js = file_get_contents(resource_path('js/bootstrap.js'));
        $this->assertStringContainsString("addEventListener('inertia:navigate', syncCsrfFromPage)", $js);
        $this->assertStringContainsString('props?.csrf_token', $js);
    }
}
