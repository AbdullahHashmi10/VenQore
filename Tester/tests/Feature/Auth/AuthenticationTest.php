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

    public function test_login_shares_flash_and_errors_keys_to_inertia(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('errors')
            ->has('flash')
            ->has('flash.success')
            ->has('flash.error')
        );
    }

    public function test_staff_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/staff-login');

        $response->assertStatus(200);
    }

    public function test_platform_owner_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/VenQore-login');

        $response->assertStatus(200);
    }

    public function test_staff_login_shares_flash_and_errors_keys_to_inertia(): void
    {
        $response = $this->get('/staff-login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('errors')
            ->has('flash')
            ->has('flash.success')
            ->has('flash.error')
        );
    }

    public function test_platform_owner_login_shares_flash_and_errors_keys_to_inertia(): void
    {
        $response = $this->get('/VenQore-login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('errors')
            ->has('flash')
            ->has('flash.success')
            ->has('flash.error')
        );
    }

    public function test_csrf_token_mismatch_exception_for_inertia_requests(): void
    {
        \Illuminate\Support\Facades\Route::post('/_test/csrf-mismatch', function () {
            throw new \Illuminate\Session\TokenMismatchException();
        })->middleware('web');

        $response = $this->withSession([])->post('/_test/csrf-mismatch', [], [
            'X-Inertia' => 'true',
        ]);

        $response->assertStatus(409);
        $response->assertHeader('X-Inertia-Location', url('/_test/csrf-mismatch'));
        $response->assertSessionHas('error', 'Your session has expired. Please try again.');
    }

    public function test_csrf_token_mismatch_exception_for_non_inertia_requests(): void
    {
        \Illuminate\Support\Facades\Route::post('/_test/csrf-mismatch', function () {
            throw new \Illuminate\Session\TokenMismatchException();
        })->middleware('web');

        $response = $this->from('/login')->withSession([])->post('/_test/csrf-mismatch', []);

        $response->assertRedirect('/login');
        $response->assertSessionHas('error', 'Your session has expired. Please try again.');
    }

    public function test_pos_pin_login_rate_limiting(): void
    {
        $tenant = \App\Models\Tenant::factory()->create();
        $storeId = $tenant->id;
        $rateKey = 'pos-pin-login:' . $storeId . '|127.0.0.1';
        \Illuminate\Support\Facades\RateLimiter::clear($rateKey);

        // Attempt 5 failed PIN logins
        for ($i = 0; $i < 5; $i++) {
            $response = $this->post('/login/pin', [
                'store_id' => $storeId,
                'pin' => '0000', // Invalid PIN
            ]);
            $response->assertSessionHasErrors(['pin']);
            $this->assertStringContainsString('Invalid PIN.', session()->get('errors')->getBag('default')->first('pin'));
        }

        // 6th attempt should be rate limited / throttled
        $response = $this->post('/login/pin', [
            'store_id' => $storeId,
            'pin' => '0000',
        ]);
        $response->assertSessionHasErrors(['pin']);
        $this->assertStringContainsString('Too many login attempts', session()->get('errors')->getBag('default')->first('pin'));

        \Illuminate\Support\Facades\RateLimiter::clear($rateKey);
    }
}


