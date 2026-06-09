<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        // VenQore routes a new user with no stores to the store creation page.
        $response->assertRedirect(route('store.create-or-join', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_login_validation_errors_use_generic_messages_to_prevent_user_enumeration(): void
    {
        // Test with a non-existent email
        $response1 = $this->post('/login', [
            'email' => 'nonexistent@venqore.com',
            'password' => 'some-password',
        ]);

        $response1->assertSessionHasErrors(['email']);
        $this->assertStringContainsString(
            __('auth.failed'),
            session()->get('errors')->getBag('default')->first('email')
        );

        // Test with an existing email but wrong password
        $user = User::factory()->create();
        $response2 = $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response2->assertSessionHasErrors(['email']);
        $this->assertStringContainsString(
            __('auth.failed'),
            session()->get('errors')->getBag('default')->first('email')
        );
    }
}
