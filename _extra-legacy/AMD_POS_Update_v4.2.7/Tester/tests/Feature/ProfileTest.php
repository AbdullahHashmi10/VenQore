<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ProfileTest — VenQore Profile Management
 *
 * VenQore's profile routes live under /s/{store_slug}/profile (store-scoped).
 * The /account route (auth-only, no store context) handles name/email updates
 * at the global account level.
 *
 * These tests verify VenQore's actual profile management behaviour.
 */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithStore(): array
    {
        $tenant = Tenant::factory()->create([
            'slug'            => 'test-store',
            'plan'            => 'trial',
            'status'          => 'trial',
            'trial_ends_at'   => now()->addDays(14),
            'setup_completed' => true,
        ]);

        $user = User::factory()->create();

        TenantUser::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
        ]);

        return [$user, $tenant];
    }

    public function test_profile_page_is_displayed(): void
    {
        [$user, $tenant] = $this->createUserWithStore();

        $response = $this
            ->actingAs($user)
            ->get("/s/{$tenant->slug}/profile");

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        [$user, $tenant] = $this->createUserWithStore();

        $response = $this
            ->actingAs($user)
            ->patch("/s/{$tenant->slug}/profile", [
                'name'  => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        [$user, $tenant] = $this->createUserWithStore();

        $response = $this
            ->actingAs($user)
            ->patch("/s/{$tenant->slug}/profile", [
                'name'  => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        [$user, $tenant] = $this->createUserWithStore();

        $response = $this
            ->actingAs($user)
            ->delete("/s/{$tenant->slug}/profile", [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        // User uses SoftDeletes — assertSoftDeleted instead of assertNull.
        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        [$user, $tenant] = $this->createUserWithStore();

        $response = $this
            ->actingAs($user)
            ->from("/s/{$tenant->slug}/profile")
            ->delete("/s/{$tenant->slug}/profile", [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect();

        $this->assertNotNull($user->fresh());
    }
}
