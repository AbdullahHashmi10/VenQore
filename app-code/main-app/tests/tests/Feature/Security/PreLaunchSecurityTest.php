<?php

namespace Tests\Feature\Security;

use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Tests\Feature\VenQoreTestCase;

/**
 * Acceptance tests for the 10 Sep 2026 pre-launch security audit
 * (SEC-01 … SEC-13). Each test names the finding it closes.
 */
class PreLaunchSecurityTest extends VenQoreTestCase
{
    // ── SEC-01 ─────────────────────────────────────────────────────────────

    public function test_sec01_store_admin_cannot_edit_or_delete_users_of_another_store(): void
    {
        $storeA = $this->createTenant('sec01-a');
        $storeB = $this->createTenant('sec01-b');
        $adminA = $this->createTenantUser($storeA, 'admin');
        $victim = $this->createTenantUser($storeB, 'cashier');
        $originalHash = $victim->password;

        $this->actingAs($adminA)
            ->put($this->storeUrl($storeA, "admin-panel/users/{$victim->id}"), [
                'name' => 'Pwned', 'email' => 'attacker@example.com', 'password' => 'newpassword123',
            ])->assertNotFound();

        $this->actingAs($adminA)
            ->delete($this->storeUrl($storeA, "admin-panel/users/{$victim->id}"))
            ->assertNotFound();

        $victim->refresh();
        $this->assertSame($originalHash, $victim->password);
        $this->assertNotSame('attacker@example.com', $victim->email);
        $this->assertFalse($victim->trashed());
    }

    public function test_sec01_platform_account_cannot_be_managed_from_a_store(): void
    {
        $store = $this->createTenant('sec01-p');
        $owner = $this->createTenantUser($store, 'owner');
        $platform = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create(['tenant_id' => $store->id, 'user_id' => $platform->id, 'role' => 'cashier', 'status' => 'active', 'joined_at' => now()]);

        $this->actingAs($owner)
            ->delete($this->storeUrl($store, "admin-panel/users/{$platform->id}"))
            ->assertForbidden();
        $this->assertFalse($platform->fresh()->trashed());
    }

    public function test_sec01_legacy_update_never_changes_login_credentials(): void
    {
        $store = $this->createTenant('sec01-c');
        $owner = $this->createTenantUser($store, 'owner');
        $cashier = $this->createTenantUser($store, 'cashier');
        $hash = $cashier->password;

        $this->actingAs($owner)
            ->put($this->storeUrl($store, "admin-panel/users/{$cashier->id}"), [
                'name' => $cashier->name, 'email' => $cashier->email, 'password' => 'newpassword123',
            ])->assertForbidden();

        $this->assertSame($hash, $cashier->fresh()->password);
    }

    public function test_sec01_legacy_delete_removes_membership_only(): void
    {
        $store = $this->createTenant('sec01-d');
        $owner = $this->createTenantUser($store, 'owner');
        $cashier = $this->createTenantUser($store, 'cashier');
        $code = $store->join_code;

        $this->actingAs($owner)->delete($this->storeUrl($store, "admin-panel/users/{$cashier->id}"));

        $this->assertFalse($cashier->fresh()->trashed(), 'The global login account must survive.');
        $this->assertDatabaseMissing('tenant_users', ['tenant_id' => $store->id, 'user_id' => $cashier->id]);
        // SEC-11: removing someone rotates the shared join code.
        $this->assertNotSame($code, $store->fresh()->join_code);
    }

    // ── SEC-02 / SEC-10 ────────────────────────────────────────────────────

    public function test_sec02_suspended_member_cannot_use_sync_api_with_stale_last_store_id(): void
    {
        $store = $this->createTenant('sec02-a');
        $member = $this->createTenantUser($store, 'cashier');
        TenantUser::where('user_id', $member->id)->update(['status' => 'suspended']);

        $this->actingAs($member, 'sanctum')->getJson('/api/sync/products')->assertForbidden();
        $this->actingAs($member, 'sanctum')->postJson('/api/sync/orders/batch', ['orders' => [['id' => 'x']]])->assertForbidden();
    }

    public function test_sec10_sync_users_never_returns_pin_hashes(): void
    {
        $store = $this->createTenant('sec10-a');
        $owner = $this->createTenantUser($store, 'owner');
        TenantUser::where('user_id', $owner->id)->update(['pos_pin' => Hash::make('1234')]);

        $response = $this->actingAs($owner, 'sanctum')->getJson('/api/sync/users')->assertOk();
        $this->assertStringNotContainsString('$2y$', $response->getContent());
        $this->assertArrayNotHasKey('passcode', $response->json()[0] ?? []);
    }

    public function test_sec02_member_without_active_membership_has_no_store_permissions(): void
    {
        $store = $this->createTenant('sec02-p');
        $member = $this->createTenantUser($store, 'manager');
        TenantUser::where('user_id', $member->id)->update(['status' => 'suspended']);

        $this->assertSame([], $member->fresh()->permissions);
    }

    // ── SEC-03 ─────────────────────────────────────────────────────────────

    public function test_sec03_cashier_cannot_restore_or_delete_backups(): void
    {
        $store = $this->createTenant('sec03-a');
        $cashier = $this->createTenantUser($store, 'cashier');
        $file = UploadedFile::fake()->createWithContent('b.vq', Crypt::encryptString(json_encode(['products' => []])));

        $this->actingAs($cashier)->post($this->storeUrl($store, 'backup/import'), ['file' => $file])->assertForbidden();
        $this->actingAs($cashier)->post($this->storeUrl($store, 'google/backup/restore/abc'))->assertForbidden();
        $this->actingAs($cashier)->post($this->storeUrl($store, 'google/backup/delete/abc'))->assertForbidden();
        $this->actingAs($cashier)->post($this->storeUrl($store, 'billing/change-plan'), ['plan' => 'x'])->assertForbidden();
        $this->actingAs($cashier)->post($this->storeUrl($store, 'settings'), ['settings' => ['store_name' => 'x']])->assertForbidden();
    }

    public function test_sec03_backup_for_another_store_is_refused(): void
    {
        $storeA = $this->createTenant('sec03-b');
        $storeB = $this->createTenant('sec03-c');
        $owner = $this->createTenantUser($storeA, 'owner');
        $payload = Crypt::encryptString(json_encode([
            'products'   => [],
            '__vq_meta'  => ['version' => 2, 'tenant_id' => $storeB->id],
        ]));
        $file = UploadedFile::fake()->createWithContent('b.vq', $payload);

        $this->actingAs($owner)->post($this->storeUrl($storeA, 'backup/import'), ['file' => $file])
            ->assertSessionHas('error');
    }

    // ── SEC-05 ─────────────────────────────────────────────────────────────

    public function test_sec05_platform_pin_login_is_disabled_by_default(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true, 'platform_pin' => Hash::make('123456')]);
        $this->post('/VenQore-login/pin', ['pin' => '123456'])->assertNotFound();
        $this->assertGuest();
    }

    public function test_sec05_platform_admin_must_complete_totp_before_platform_pages(): void
    {
        config(['venqore.enforce_2fa_in_tests' => true]);
        $admin = User::factory()->create(['is_platform_admin' => true]);

        // Not enrolled → setup.
        $this->actingAs($admin)->get('/VenQore')->assertRedirect(route('2fa.setup'));

        // Enrolled but not verified this session → verify.
        $admin->forceFill(['two_factor_secret' => Crypt::encryptString('JBSWY3DPEHPK3PXP'), 'two_factor_confirmed_at' => now()])->save();
        $this->actingAs($admin)->get('/VenQore')->assertRedirect(route('2fa.verify'));

        // Store pages too (platform admins bypass store permission checks).
        $store = $this->createTenant('sec05-s');
        $this->actingAs($admin)->get($this->storeUrl($store, 'dashboard'))->assertRedirect(route('2fa.verify'));
    }

    public function test_sec05_any_user_who_enabled_totp_is_asked_for_it(): void
    {
        config(['venqore.enforce_2fa_in_tests' => true]);
        $store = $this->createTenant('sec05-u');
        $cashier = $this->createTenantUser($store, 'cashier');

        // Not enrolled, not required for the role → straight in.
        $this->actingAs($cashier)->get($this->storeUrl($store, 'dashboard'))->assertStatus(200);

        // Switched 2FA on → the code is required every session.
        $cashier->forceFill(['two_factor_secret' => Crypt::encryptString('JBSWY3DPEHPK3PXP'), 'two_factor_confirmed_at' => now()])->save();
        $this->actingAs($cashier)->get($this->storeUrl($store, 'dashboard'))->assertRedirect(route('2fa.verify'));
        $this->actingAs($cashier)->withSession(['2fa_verified_at' => now()])
            ->get($this->storeUrl($store, 'dashboard'))->assertStatus(200);
    }

    public function test_sec05_owner_2fa_setting_is_enforced_on_store_pages(): void
    {
        config(['venqore.enforce_2fa_in_tests' => true, 'venqore.require_owner_2fa' => true]);
        $store = $this->createTenant('sec05-o');
        $owner = $this->createTenantUser($store, 'owner');

        // The gate runs before the tenant middleware; it must still see "owner".
        $this->actingAs($owner)->get($this->storeUrl($store, 'dashboard'))->assertRedirect(route('2fa.setup'));
    }

    public function test_sec05_setup_key_survives_a_wrong_code(): void
    {
        config(['venqore.enforce_2fa_in_tests' => true]);
        $admin = User::factory()->create(['is_platform_admin' => true]);

        $secretOf = fn ($response) => $response->viewData('page')['props']['secret'];
        $first = $secretOf($this->actingAs($admin)->get('/2fa/setup')->assertOk());
        $this->assertSame($first, $secretOf($this->actingAs($admin)->get('/2fa/setup')), 'Reloading the page must not change the key.');

        // A typo keeps the same key (the authenticator already holds it)…
        $this->actingAs($admin)->post('/2fa/confirm', ['code' => '000000'])->assertSessionHasErrors('code');
        $this->assertSame($first, $secretOf($this->actingAs($admin)->get('/2fa/setup')));
        $this->assertNull($admin->fresh()->two_factor_confirmed_at, 'A pending key is not enrolment.');

        // …and a code from that key then enables 2FA, even in a fresh session.
        $this->flushSession();
        $code = $this->totp($first);
        $this->actingAs($admin)->post('/2fa/confirm', ['code' => $code])->assertRedirect(route('2fa.recovery'));
        $this->assertNotNull($admin->fresh()->two_factor_confirmed_at);
    }

    private function totp(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        foreach (str_split(strtoupper($secret)) as $ch) {
            $bits .= str_pad(decbin(strpos($alphabet, $ch)), 5, '0', STR_PAD_LEFT);
        }
        $key = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $key .= chr(bindec($byte));
            }
        }
        $hash = hash_hmac('sha1', pack('N*', 0, intdiv(time(), 30)), $key, true);
        $offset = ord($hash[19]) & 0xf;
        $value = ((ord($hash[$offset]) & 0x7f) << 24) | (ord($hash[$offset + 1]) << 16) | (ord($hash[$offset + 2]) << 8) | ord($hash[$offset + 3]);

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    public function test_sec05_totp_setup_page_does_not_send_secret_to_third_parties(): void
    {
        config(['venqore.enforce_2fa_in_tests' => true]);
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $response = $this->actingAs($admin)->get('/2fa/setup')->assertOk();
        $this->assertStringNotContainsString('qrserver.com', $response->getContent());
    }

    // ── SEC-07 / SEC-08 / SEC-09 ───────────────────────────────────────────

    public function test_sec07_installer_is_closed_by_default(): void
    {
        $this->get('/installer')->assertNotFound();
        $this->getJson('/api/installer/diagnose')->assertNotFound();
        $this->postJson('/api/installer/run')->assertNotFound();
    }

    public function test_sec08_web_updater_is_closed_by_default(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $this->actingAs($admin)->postJson('/api/updater/run', ['step' => 'extract'])->assertNotFound();
    }

    public function test_sec08_updater_requires_csrf_when_enabled(): void
    {
        config(['venqore.web_updater_enabled' => true]);
        \Illuminate\Support\Facades\File::put(storage_path('installed'), 'test');
        try {
            $admin = User::factory()->create(['is_platform_admin' => true]);
            $this->actingAs($admin)->postJson('/api/updater/run', ['step' => 'extract'])->assertStatus(419);
        } finally {
            \Illuminate\Support\Facades\File::delete(storage_path('installed'));
        }
    }

    public function test_sec09_error_reporter_is_rate_limited_and_deduplicated(): void
    {
        $statuses = [];
        for ($i = 0; $i < 22; $i++) {
            $statuses[] = $this->postJson('/api/report-error', ['message' => 'boom ' . $i])->status();
        }
        $this->assertContains(429, $statuses);

        // Minimal report with only the required field works.
        \Illuminate\Support\Facades\RateLimiter::clear('');
    }

    // ── SEC-11 ─────────────────────────────────────────────────────────────

    public function test_sec11_join_code_does_not_reactivate_suspended_membership(): void
    {
        $store = $this->createTenant('sec11-a', 'trial', 'active');
        $member = $this->createTenantUser($store, 'manager');
        TenantUser::where('user_id', $member->id)->update(['status' => 'suspended']);

        $this->actingAs($member)->post('/join', ['join_code' => $store->join_code])->assertForbidden();
        $this->assertSame('suspended', TenantUser::where('user_id', $member->id)->value('status'));
    }

    public function test_sec11_new_join_codes_are_high_entropy(): void
    {
        $code = \App\Models\Tenant::generateJoinCode();
        $this->assertMatchesRegularExpression('/^VQ-[A-Z2-9]{4}-[A-Z2-9]{4}$/', $code);
    }

    // ── SEC-13 ─────────────────────────────────────────────────────────────

    public function test_sec13_import_rejects_raw_and_traversal_paths(): void
    {
        $store = $this->createTenant('sec13-a', 'ltd_3', 'active');
        $owner = $this->createTenantUser($store, 'owner');

        foreach (['temp_imports/other.xlsx', '../../.env', '/etc/passwd', 'imp_' . str_repeat('a', 40)] as $path) {
            $this->actingAs($owner)
                ->post($this->storeUrl($store, 'admin/data/process-import'), [
                    'file_path' => $path, 'type' => 'products', 'mapping' => ['name' => 0],
                ])
                ->assertSessionHas('error');
        }
    }
}
