<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Tests\Feature\VenQoreTestCase;

/**
 * Store Unique Name and Soft-Delete Checks Test
 *
 * Verifies that the store registration checks unique slugs and prevents duplicates,
 * guiding the user correctly depending on active/soft-deleted states and ownership.
 *
 * Usage:
 *   php artisan test --filter=StoreUniqueNameTest
 */
class StoreUniqueNameTest extends VenQoreTestCase
{

    /** @test */
    public function creates_store_successfully_when_name_is_unique(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/new-store', [
            'name' => 'Original Unique Store Name',
        ]);

        $response->assertRedirect(route('hub'));

        // Assert the store exists in the database
        $this->assertDatabaseHas('tenants', [
            'name' => 'Original Unique Store Name',
            'slug' => 'original-unique-store-name',
        ]);
    }

    /** @test */
    public function blocks_creation_when_same_active_store_is_owned_by_current_user(): void
    {
        $user = User::factory()->create();

        // Create an existing active store owned by this user
        $tenant = Tenant::create([
            'name'           => 'Active Store Name',
            'slug'           => 'active-store-name',
            'plan'           => 'starter',
            'status'         => 'active',
            'join_code'      => 'VQ-ACT1',
            'currency_code'  => 'PKR',
            'currency_symbol'=> 'Rs.',
            'timezone'       => 'Asia/Karachi',
        ]);

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        // Request creating a store with the same name
        $response = $this->actingAs($user)->post('/new-store', [
            'name' => 'Active Store Name',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors([
            'name' => 'You already have an active store with this name.',
        ]);
    }

    /** @test */
    public function blocks_creation_when_same_active_store_is_owned_by_another_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Create an existing active store owned by another user
        $tenant = Tenant::create([
            'name'           => 'Active Store Name',
            'slug'           => 'active-store-name',
            'plan'           => 'starter',
            'status'         => 'active',
            'join_code'      => 'VQ-ACT2',
            'currency_code'  => 'PKR',
            'currency_symbol'=> 'Rs.',
            'timezone'       => 'Asia/Karachi',
        ]);

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $otherUser->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        // Request creating a store with the same name
        $response = $this->actingAs($user)->post('/new-store', [
            'name' => 'Active Store Name',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors([
            'name' => 'This store name is already in use by another account. Please choose a unique store name.',
        ]);
    }

    /** @test */
    public function blocks_creation_and_asks_to_contact_support_when_deleted_by_current_user(): void
    {
        $user = User::factory()->create();

        // Create an existing soft-deleted store owned by this user
        $tenant = Tenant::create([
            'name'           => 'Soft Deleted Store Name',
            'slug'           => 'soft-deleted-store-name',
            'plan'           => 'starter',
            'status'         => 'active',
            'join_code'      => 'VQ-DEL1',
            'currency_code'  => 'PKR',
            'currency_symbol'=> 'Rs.',
            'timezone'       => 'Asia/Karachi',
        ]);
        $tenant->delete();

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        // Request creating a store with the same name
        $response = $this->actingAs($user)->post('/new-store', [
            'name' => 'Soft Deleted Store Name',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors([
            'name' => 'This store was previously deleted by you. Please contact support to reopen it.',
        ]);
    }

    /** @test */
    public function blocks_creation_and_asks_for_unique_name_when_deleted_by_another_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Create an existing soft-deleted store owned by another user
        $tenant = Tenant::create([
            'name'           => 'Soft Deleted Store Name',
            'slug'           => 'soft-deleted-store-name',
            'plan'           => 'starter',
            'status'         => 'active',
            'join_code'      => 'VQ-DEL2',
            'currency_code'  => 'PKR',
            'currency_symbol'=> 'Rs.',
            'timezone'       => 'Asia/Karachi',
        ]);
        $tenant->delete();

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $otherUser->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        // Request creating a store with the same name
        $response = $this->actingAs($user)->post('/new-store', [
            'name' => 'Soft Deleted Store Name',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors([
            'name' => 'This store name is already taken. Please choose a unique store name.',
        ]);
    }
}
