<?php

namespace Tests\Feature\Security;

use App\Http\Middleware\VerifyTurnstileToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TurnstileMiddlewareTest extends TestCase
{
    #[Test]
    public function it_fails_open_when_unconfigured(): void
    {
        config(['services.cloudflare.turnstile_secret_key' => null]);

        $request = Request::create('/contact', 'POST', ['name' => 'John']);
        $middleware = new VerifyTurnstileToken();

        $response = $middleware->handle($request, function ($req) {
            return response('passed');
        });

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('passed', $response->getContent());
    }

    #[Test]
    public function it_blocks_requests_missing_token_when_configured(): void
    {
        config(['services.cloudflare.turnstile_secret_key' => '0x4AAAAAAABBBBBB-real-secret']);

        $request = Request::create('/contact', 'POST', ['name' => 'John']);
        $request->headers->set('Accept', 'application/json');
        $middleware = new VerifyTurnstileToken();

        $response = $middleware->handle($request, function () {
            return response('passed');
        });

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('Security verification required', $response->getContent());
    }

    #[Test]
    public function it_verifies_valid_token_with_cloudflare(): void
    {
        config(['services.cloudflare.turnstile_secret_key' => '0x4AAAAAAABBBBBB-real-secret']);

        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response(['success' => true]),
        ]);

        $request = Request::create('/contact', 'POST', [
            'name' => 'John',
            'cf-turnstile-response' => 'valid-token',
        ]);
        $middleware = new VerifyTurnstileToken();

        $response = $middleware->handle($request, function () {
            return response('passed');
        });

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('passed', $response->getContent());
    }
}
