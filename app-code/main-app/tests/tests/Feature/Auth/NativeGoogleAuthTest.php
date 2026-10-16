<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Tests\Feature\VenQoreTestCase;

/** Phone app Google sign-in: ID token in, one-time ticket out, same trust rules as the browser flow. */
class NativeGoogleAuthTest extends VenQoreTestCase
{
    private const CLIENT = 'web-client-123.apps.googleusercontent.com';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.client_id' => self::CLIENT, 'services.google.mobile_client_ids' => []]);
    }

    private function fakeGoogle(array $over = [], int $status = 200): void
    {
        Http::fake([
            'oauth2.googleapis.com/tokeninfo*' => Http::response(array_merge([
                'iss' => 'https://accounts.google.com',
                'aud' => self::CLIENT,
                'sub' => '110000000000000000001',
                'email' => 'new.owner@example.com',
                'email_verified' => 'true',
                'name' => 'New Owner',
                'exp' => (string) (time() + 3000),
            ], $over), $status),
        ]);
    }

    private function exchange(): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/mobile/auth/google', ['id_token' => 'fake.id.token']);
    }

    public function test_a_new_google_account_gets_a_ticket_that_signs_in_exactly_once(): void
    {
        $this->fakeGoogle();

        $res = $this->exchange()->assertOk()->assertJsonPath('status', 'ok');
        $url = $res->json('ticket_url');
        $this->assertStringContainsString('/auth/native-ticket/', $url);

        $user = User::where('email', 'new.owner@example.com')->firstOrFail();
        $this->assertSame('110000000000000000001', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
        $this->assertGuest();

        $this->get(parse_url($url, PHP_URL_PATH))->assertRedirect();
        $this->assertAuthenticatedAs($user);

        // The ticket is single use.
        auth()->logout();
        $this->get(parse_url($url, PHP_URL_PATH))->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_an_existing_google_linked_user_gets_a_ticket(): void
    {
        $user = User::factory()->create(['google_id' => '110000000000000000001', 'email' => 'new.owner@example.com']);
        $this->fakeGoogle();

        $this->exchange()->assertOk()->assertJsonPath('status', 'ok');
        $this->assertSame(1, User::where('email', 'new.owner@example.com')->count());
        $this->assertNotNull($user->fresh());
    }

    public function test_an_existing_password_account_is_not_silently_linked(): void
    {
        User::factory()->create(['email' => 'new.owner@example.com', 'google_id' => null]);
        $this->fakeGoogle();

        $this->exchange()->assertOk()->assertJsonPath('status', 'link_required')->assertJsonMissingPath('ticket_url');
        $this->assertNull(User::where('email', 'new.owner@example.com')->value('google_id'));
    }

    public function test_a_token_issued_to_another_app_is_refused(): void
    {
        $this->fakeGoogle(['aud' => 'someone-elses-app.apps.googleusercontent.com']);
        $this->exchange()->assertStatus(401);
        $this->assertSame(0, User::where('email', 'new.owner@example.com')->count());
    }

    public function test_an_unverified_google_email_is_refused(): void
    {
        $this->fakeGoogle(['email_verified' => 'false']);
        $this->exchange()->assertStatus(401);
    }

    public function test_an_expired_token_is_refused(): void
    {
        $this->fakeGoogle(['exp' => (string) (time() - 10)]);
        $this->exchange()->assertStatus(401);
    }

    public function test_a_token_google_rejects_is_refused(): void
    {
        $this->fakeGoogle(['error' => 'invalid_token'], 400);
        $this->exchange()->assertStatus(401);
    }

    public function test_nothing_is_accepted_when_no_client_id_is_configured(): void
    {
        config(['services.google.client_id' => null]);
        $this->fakeGoogle();
        $this->exchange()->assertStatus(401);
    }

    public function test_the_app_can_read_the_public_client_id(): void
    {
        $this->getJson('/api/mobile/config')->assertOk()->assertExactJson(['google_server_client_id' => self::CLIENT]);

        config(['services.google.client_id' => null]);
        $this->getJson('/api/mobile/config')->assertOk()->assertExactJson(['google_server_client_id' => null]);
    }

    public function test_an_unknown_ticket_goes_back_to_sign_in(): void
    {
        $this->get('/auth/native-ticket/' . str_repeat('a', 64))->assertRedirect('/login');
        $this->assertGuest();
    }
}
