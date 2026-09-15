<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Feature\VenQoreTestCase;

class LegacyAdminPasscodeTest extends VenQoreTestCase
{
    use RefreshDatabase;

    /** @test */
    public function store_user_creates_membership_and_sets_hashed_pos_pin(): void
    {
        $tenant = $this->createTenant(null, 'ltd_3');
        $this->actingAsOwner($tenant);

        $response = $this->post("/s/{$tenant->slug}/admin-panel/users", [
            'name' => 'New Staff',
            'email' => 'staff@example.com',
            'password' => 'password123',
            'role' => 'cashier',
            'passcode' => '4321',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $user = User::where('email', 'staff@example.com')->first();
        $this->assertNotNull($user);

        // Assert role and passcode are stored directly in the users table
        $this->assertEquals('cashier', $user->getRawOriginal('role'));
        $this->assertTrue(Hash::check('4321', $user->getRawOriginal('passcode')));

        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        $this->assertNotNull($membership);
        $this->assertEquals('cashier', $membership->role);
        $this->assertNotNull($membership->pos_pin);
        $this->assertTrue(Hash::check('4321', $membership->pos_pin));
    }

    /** @test */
    public function update_user_modifies_membership_and_hashes_pos_pin(): void
    {
        $tenant = $this->createTenant(null, 'ltd_3');
        $owner = $this->actingAsOwner($tenant);

        // Create a staff user to update
        $staffUser = $this->createTenantUser($tenant, 'cashier');

        $response = $this->put("/s/{$tenant->slug}/admin-panel/users/{$staffUser->id}", [
            'name' => 'Updated Staff Name',
            'email' => $staffUser->email,
            'role' => 'manager',
            'passcode' => '5678',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // SEC-01 (2026-09-10): the legacy route now edits the STORE MEMBERSHIP
        // only. The global login identity (users.name / email / password) is
        // never changed from a store — the new name lands in display_name.
        $originalName = $staffUser->name;
        $staffUser->refresh();
        $this->assertEquals($originalName, $staffUser->name);

        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $staffUser->id)
            ->first();

        $this->assertEquals('Updated Staff Name', $membership->display_name);
        $this->assertEquals('manager', $membership->role);
        $this->assertTrue(Hash::check('5678', $membership->pos_pin));
    }

    /** @test */
    public function store_user_validates_passcode_uniqueness_within_same_store(): void
    {
        $tenant = $this->createTenant(null, 'ltd_3');
        $this->actingAsOwner($tenant);

        // Pre-create a staff member with a PIN
        $existingStaff = $this->createTenantUser($tenant, 'cashier');
        $existingStaff->passcode = '1234';
        $existingStaff->save();

        // Trying to create a new user with the same PIN should fail validation
        $response = $this->post("/s/{$tenant->slug}/admin-panel/users", [
            'name' => 'Another Staff',
            'email' => 'another@example.com',
            'password' => 'password123',
            'role' => 'cashier',
            'passcode' => '1234',
        ]);

        $response->assertSessionHasErrors('passcode');
    }
}
