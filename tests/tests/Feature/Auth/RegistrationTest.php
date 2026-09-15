<?php

namespace Tests\Feature\Auth;

use Tests\Feature\VenQoreTestCase;

class RegistrationTest extends VenQoreTestCase
{

    public function test_register_hands_new_businesses_to_the_builder(): void
    {
        // One signup path (11 Sep 2026): a new business is created in the builder.
        $response = $this->get('/register?email=a%40b.co&plan=core');

        $response->assertRedirect(route('workspace.build', ['email' => 'a@b.co', 'plan' => 'core'], absolute: false));
    }

    public function test_registration_form_still_renders_for_an_invite(): void
    {
        // People joining someone else's store keep the plain form.
        $response = $this->withSession(['pending_invite_token' => 'tok'])->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        // AUTH-01: nothing exists until the emailed code is proven.
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
        $response->assertRedirect(route('otp.show', absolute: false));

        $code = null;
        \Illuminate\Support\Facades\Mail::assertQueued(\App\Mail\EmailOtpCodeMail::class, function ($mail) use (&$code) {
            $code = $mail->code;
            return $mail->hasTo('test@example.com');
        });

        $response = $this->post('/verify-code', ['code' => $code]);

        $this->assertAuthenticated();
        $this->assertNotNull(\App\Models\User::where('email', 'test@example.com')->value('email_verified_at'));
        // VenQore redirects new registrants to the Hub to create or join their first store.
        $response->assertRedirect(route('hub', absolute: false));
    }
}
