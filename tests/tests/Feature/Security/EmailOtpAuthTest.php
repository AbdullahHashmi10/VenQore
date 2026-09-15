<?php

namespace Tests\Feature\Security;

use App\Mail\EmailOtpCodeMail;
use App\Models\EmailOtpChallenge;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\Feature\VenQoreTestCase;

/**
 * AUTH-01 / AUTH-03 acceptance tests (pre-launch audit, 2026-09-10).
 */
class EmailOtpAuthTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['venqore.email_otp_required' => true]);
    }

    private function lastCode(?string $to = null): string
    {
        $code = null;
        Mail::assertQueued(EmailOtpCodeMail::class, function ($mail) use (&$code, $to) {
            if ($to && !$mail->hasTo($to)) {
                return false;
            }
            $code = $mail->code;
            return true;
        });
        return (string) $code;
    }

    private function wrong(string $code): string
    {
        return str_pad((string) (((int) $code + 1) % 1000000), 6, '0', STR_PAD_LEFT);
    }

    public function test_password_login_creates_no_session_until_code_is_verified(): void
    {
        $user = User::factory()->create();

        $this->post('/login', ['email' => $user->email, 'password' => 'password', 'remember' => 'on'])
            ->assertRedirect(route('otp.show', absolute: false));

        $this->assertGuest();
        // A protected page is still refused.
        $this->get('/hub')->assertRedirect();
        $this->assertGuest();

        $this->get('/verify-code')->assertOk();
        $this->post('/verify-code', ['code' => $this->lastCode($user->email)]);
        $this->assertAuthenticatedAs($user);
    }

    public function test_code_is_single_use(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $code = $this->lastCode();

        $this->post('/verify-code', ['code' => $code]);
        $this->assertAuthenticated();

        $this->post('/logout');
        $this->assertGuest();

        // Re-using the consumed code does nothing.
        $this->post('/verify-code', ['code' => $code])->assertRedirect(route('login', absolute: false));
        $this->assertGuest();
    }

    public function test_wrong_codes_lock_the_challenge_after_five_attempts(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $code = $this->lastCode();

        for ($i = 0; $i < 4; $i++) {
            $this->post('/verify-code', ['code' => $this->wrong($code)])->assertSessionHasErrors('code');
        }
        // 5th wrong attempt locks and sends the user back to start.
        $this->post('/verify-code', ['code' => $this->wrong($code)])->assertRedirect(route('login', absolute: false));

        // Even the right code no longer works.
        $this->post('/verify-code', ['code' => $code]);
        $this->assertGuest();
    }

    public function test_expired_code_is_refused(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $code = $this->lastCode();

        EmailOtpChallenge::query()->update(['expires_at' => now()->subSecond()]);

        $this->post('/verify-code', ['code' => $code])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_code_is_bound_to_the_browser_session_that_started_it(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $code = $this->lastCode();
        $challengeId = session('otp_pending.id');

        // A different browser (fresh session) presenting the same challenge id + code.
        $this->flushSession();
        $this->withSession(['otp_pending' => ['id' => $challengeId, 'purpose' => 'login']])
            ->post('/verify-code', ['code' => $code]);

        $this->assertGuest();
    }

    public function test_resend_invalidates_the_previous_code(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $first = $this->lastCode();

        // Cooldown blocks an immediate resend.
        $this->post('/verify-code/resend')->assertSessionHasErrors('code');

        EmailOtpChallenge::query()->update(['last_sent_at' => now()->subMinutes(2)]);
        $this->post('/verify-code/resend')->assertSessionHasNoErrors();

        $codes = [];
        Mail::assertQueued(EmailOtpCodeMail::class, function ($m) use (&$codes) { $codes[] = $m->code; return true; });
        $second = end($codes);

        if ($first !== $second) {
            $this->post('/verify-code', ['code' => $first])->assertSessionHasErrors('code');
            $this->assertGuest();
        }
        $this->post('/verify-code', ['code' => $second]);
        $this->assertAuthenticated();
    }

    public function test_a_queued_code_is_not_sent_once_superseded_used_or_expired(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $queued = [];
        Mail::assertQueued(EmailOtpCodeMail::class, function ($m) use (&$queued) { $queued[] = $m; return true; });
        $first = end($queued);
        $this->assertNotNull($first->challengeId);

        // send() skips the email whenever isStillValid() is false.
        $sent = fn (EmailOtpCodeMail $m) => $m->isStillValid();

        // Still valid → it goes out.
        $this->assertTrue($sent($first));

        // Superseded by a resend → the old job is dropped.
        EmailOtpChallenge::query()->update(['last_sent_at' => now()->subMinutes(2)]);
        $this->post('/verify-code/resend')->assertSessionHasNoErrors();
        $this->assertFalse($sent($first), 'An old code must not be emailed after a newer one.');

        // Expired → dropped.
        $challenge = EmailOtpChallenge::find($first->challengeId);
        $current = new EmailOtpCodeMail('000000', 'login', 5, $challenge->id);
        $challenge->forceFill(['expires_at' => now()->subSecond()])->save();
        $this->assertFalse($sent($current));
    }

    public function test_global_daily_budget_stops_sending(): void
    {
        config(['venqore.otp.max_sends_global_per_day' => 1]);
        $a = User::factory()->create();
        $b = User::factory()->create();

        $this->post('/login', ['email' => $a->email, 'password' => 'password'])->assertRedirect(route('otp.show', absolute: false));
        $this->post('/verify-code/cancel');
        $this->post('/login', ['email' => $b->email, 'password' => 'password'])->assertSessionHasErrors();
        Mail::assertQueued(EmailOtpCodeMail::class, 1);
    }

    public function test_wrong_password_sends_no_code(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'nope'])->assertSessionHasErrors('email');
        Mail::assertNothingQueued();
        $this->assertSame(0, EmailOtpChallenge::count());
    }

    public function test_signup_creates_account_only_after_code(): void
    {
        $this->post('/register', [
            'name' => 'New Person', 'email' => 'new.person@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect(route('otp.show', absolute: false));

        $this->assertDatabaseMissing('users', ['email' => 'new.person@example.com']);

        $this->post('/verify-code', ['code' => $this->lastCode('new.person@example.com')]);

        $user = User::where('email', 'new.person@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $user->password));
    }

    public function test_signup_with_existing_email_looks_identical_and_sends_nothing(): void
    {
        $existing = User::factory()->create(['email' => 'taken@example.com']);

        $this->post('/register', [
            'name' => 'Someone', 'email' => 'taken@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect(route('otp.show', absolute: false));

        Mail::assertNothingQueued();
        $this->post('/verify-code', ['code' => '123456'])->assertSessionHasErrors('code');
        $this->assertGuest();
        $this->assertSame(1, User::where('email', 'taken@example.com')->count());
    }

    public function test_first_public_signup_is_never_a_platform_admin(): void
    {
        // AUTH-03: even when no platform owner exists.
        User::query()->where('is_platform_admin', true)->update(['is_platform_admin' => false]);

        $this->post('/register', [
            'name' => 'First', 'email' => 'first@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ]);
        $this->post('/verify-code', ['code' => $this->lastCode('first@example.com')]);

        $user = User::where('email', 'first@example.com')->firstOrFail();
        $this->assertFalse((bool) $user->is_platform_admin);
        $this->assertNotSame('platform_owner', $user->platform_role);
    }

    public function test_send_budget_per_email_is_enforced(): void
    {
        $user = User::factory()->create();
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['email' => $user->email, 'password' => 'password']);
            $this->flushSession();
        }
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertSessionHasErrors('email');
        Mail::assertQueuedCount(5);
    }

    public function test_otp_mail_job_payload_is_encrypted(): void
    {
        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldBeEncrypted::class,
            class_implements(EmailOtpCodeMail::class)
        );
    }

    public function test_global_send_budget_refuses_signup_without_creating_an_account(): void
    {
        config(['venqore.otp.max_sends_global_per_day' => 2]);
        foreach (['one', 'two'] as $name) {
            $this->post('/register', [
                'name' => $name, 'email' => $name . '@example.com',
                'password' => 'password', 'password_confirmation' => 'password',
            ])->assertRedirect(route('otp.show', absolute: false));
        }
        $this->post('/register', [
            'name' => 'Blocked', 'email' => 'blocked@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertSessionHasErrors('email');
        Mail::assertQueuedCount(2);
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'blocked@example.com']);
        $this->assertDatabaseMissing('email_otp_challenges', ['email' => 'blocked@example.com']);
    }

    public function test_stale_queued_codes_are_dropped_before_mail_transport(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $mail = null;
        Mail::assertQueued(EmailOtpCodeMail::class, function ($queued) use (&$mail) {
            $mail = $queued;
            return true;
        });
        $this->assertTrue($mail->isStillValid());
        $challenge = EmailOtpChallenge::findOrFail($mail->challengeId);
        $transport = \Mockery::mock(\Illuminate\Contracts\Mail\Mailer::class);
        $transport->shouldNotReceive('send');

        $challenge->update(['expires_at' => now()->subSecond()]);
        $this->assertNull($mail->send($transport));
        $challenge->update(['expires_at' => now()->addMinutes(5), 'consumed_at' => now()]);
        $this->assertNull($mail->send($transport));
        $challenge->update(['consumed_at' => null, 'code_hash' => str_repeat('0', 64)]);
        $this->assertNull($mail->send($transport));
    }

    public function test_create_platform_owner_command(): void
    {
        User::query()->where('platform_role', 'platform_owner')->update(['platform_role' => null, 'is_platform_admin' => false]);

        $this->artisan('venqore:create-platform-owner', ['email' => 'owner@example.com', '--name' => 'Owner'])
            ->expectsQuestion('Password for the new owner (min 12 characters, not echoed)', 'Str0ng!Passw0rd#')
            ->expectsQuestion('Repeat the password', 'Str0ng!Passw0rd#')
            ->assertSuccessful();

        $owner = User::where('email', 'owner@example.com')->firstOrFail();
        $this->assertTrue($owner->isPlatformOwner());

        // A second run without --additional is refused.
        $this->artisan('venqore:create-platform-owner', ['email' => 'owner2@example.com'])
            ->expectsQuestion('Password for the new owner (min 12 characters, not echoed)', 'Str0ng!Passw0rd#')
            ->expectsQuestion('Repeat the password', 'Str0ng!Passw0rd#')
            ->assertFailed();
    }
}
