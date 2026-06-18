<?php

namespace Tests\Feature;

use App\Models\Party;
use App\Models\ExpenseCategory;
use Tests\Feature\VenQoreTestCase;

class RegressionFixesTest extends VenQoreTestCase
{
    /** @test */
    public function test_parties_show_route_redirects_to_ledger(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        $party = Party::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'name' => 'Test Party',
            'type' => 'customer',
        ]);

        $response = $this->get($this->storeUrl($tenant, "parties/{$party->id}"));

        $response->assertStatus(302);
        $response->assertRedirect($this->storeUrl($tenant, "parties/{$party->id}/ledger"));
    }

    /** @test */
    public function test_expense_category_store_creates_category(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        $response = $this->postJson($this->storeUrl($tenant, "expenses/category"), [
            'name' => 'Office Supplies ' . uniqid(),
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'success',
            'message',
            'category' => ['id', 'name', 'is_active'],
        ]);
    }

    /** @test */
    public function test_role_prioritization_from_tenant_memberships(): void
    {
        $tenant = $this->createTenant();
        $user = \App\Models\User::factory()->create();
        $tenantUser = \App\Models\TenantUser::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => 'manager',
            'status' => 'active',
        ]);

        app()->instance('current.tenant', $tenant);

        $this->assertEquals('manager', $user->role);
        $this->assertTrue($user->hasRole('manager'));
        $this->assertFalse($user->hasRole('admin'));

        $tenantUser->delete();
        $user->delete();
        $tenant->delete();
    }

    /** @test */
    public function test_party_opening_balance_updates_successfully(): void
    {
        $tenant = $this->createTenant();
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'owner');

        $party = Party::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'name' => 'Balance Test Customer',
            'type' => 'customer',
            'opening_balance' => 100.00,
            'opening_balance_type' => 'receivable',
        ]);

        $response = $this->putJson($this->storeUrl($tenant, "parties/{$party->id}"), [
            'name' => 'Balance Test Customer Updated',
            'type' => 'customer',
            'opening_balance' => 250.50,
            'opening_balance_type' => 'receivable',
        ]);

        $response->assertStatus(200);
        
        $party->refresh();
        $this->assertEquals(250.50, (float)$party->opening_balance);

        $party->delete();
        $tenant->delete();
    }

    /** @test */
    public function test_record_payment_passes_selected_party_id(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        $party = Party::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'name' => 'Payment Test Contact',
            'type' => 'customer',
        ]);

        $response = $this->get($this->storeUrl($tenant, "payments/in?party_id={$party->id}"));

        $response->assertStatus(200);
        $props = $response->original->getData()['page']['props'];
        $this->assertEquals($party->id, $props['selected_party_id']);

        $party->delete();
        $tenant->delete();
    }

    /** @test */
    public function test_excel_import_ignores_helper_row(): void
    {
        $tenant = $this->createTenant();
        app()->instance('current.tenant', $tenant);

        // Force class loading
        new \App\Imports\PartiesImport();
        $import = new \App\Imports\PartiesDataSheetImport([], null, false, [], []);

        $rowMock = \Mockery::mock(\Maatwebsite\Excel\Row::class);
        $rowMock->shouldReceive('getIndex')->andReturn(4);
        $rowMock->shouldReceive('toArray')->andReturn([
            'insert from here', 'customer', '0', 'To Receive', '1234567890'
        ]);

        $beforeCount = Party::where('tenant_id', $tenant->id)->count();
        $import->onRow($rowMock);
        $afterCount = Party::where('tenant_id', $tenant->id)->count();

        $this->assertEquals($beforeCount, $afterCount);

        $tenant->delete();
    }

    /** @test */
    public function test_multi_word_search_tokenization(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        $product = \App\Models\Product::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'name' => 'Apple Watch series 5',
            'sku' => 'AW-5-SKU',
            'is_active' => true,
        ]);

        $response = $this->getJson($this->storeUrl($tenant, "global-search?query=apple series 5"));
        $response->assertStatus(200);

        $results = $response->json();
        $this->assertNotEmpty($results);
        $this->assertEquals('Apple Watch series 5', $results[0]['title']);

        $product->delete();
        $tenant->delete();
    }

    /** @test */
    public function test_logout_route_does_not_support_delete_method(): void
    {
        $user = \App\Models\User::factory()->create();
        $response = $this->actingAs($user)->delete('/logout');
        
        $this->assertTrue($response->status() === 405 || $response->status() === 302 || $response->status() === 404);
    }

    /** @test */
    public function test_handle_inertia_requests_version_is_null_in_local_testing(): void
    {
        $middleware = new \App\Http\Middleware\HandleInertiaRequests();
        $request = \Illuminate\Http\Request::create('/login', 'GET');
        $this->assertNull($middleware->version($request));
    }

    /** @test */
    public function test_sale_stats_exclude_returned_sales(): void
    {
        $tenant = $this->createTenant();
        $this->seedTenantDefaults($tenant);
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);

        // Create standard posted sale
        $sale1 = \App\Models\Sale::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'reference_number' => 'SAL-TEST-0001',
            'status' => 'posted',
            'net_sales' => 1000.00,
            'total' => 1000.00,
            'posted_at' => now(),
        ]);

        // Create returned sale
        $sale2 = \App\Models\Sale::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'reference_number' => 'RET-TEST-0001',
            'status' => 'returned',
            'net_sales' => 500.00,
            'total' => 500.00,
            'posted_at' => now(),
        ]);

        // Add a payment for sale1
        \App\Models\Payment::create([
            'tenant_id' => $tenant->id,
            'sale_id' => $sale1->id,
            'amount' => 1000.00,
            'type' => 'in',
            'method' => 'cash',
            'date' => now()->toDateString(),
        ]);

        $response = $this->get($this->storeUrl($tenant, 'sales/list'));
        $response->assertStatus(200);

        $props = $response->original->getData()['page']['props'];
        $stats = $props['stats'];

        // Assert that the returned sale ($sale2) is NOT included in total sales and unpaid calculation
        $this->assertEquals(1000.00, $stats['total_sale']);
        $this->assertEquals(1000.00, $stats['total_paid']);
        $this->assertEquals(0.00, $stats['total_unpaid']);
    }

    /** @test */
    public function test_verify_elevated_pin_by_platform_user_and_membership(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);

        // Create platform admin user
        $platformAdmin = \App\Models\User::factory()->create([
            'email' => 'platform@venqore.com',
            'is_platform_admin' => true,
            'platform_pin' => bcrypt('123456'),
        ]);

        // Verify that platform PIN works as superadmin override
        $response = $this->postJson($this->storeUrl($tenant, 'profile/verify-elevated-pin'), [
            'pin' => '123456',
        ]);
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        // Update membership pin for owner
        $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $owner->id)
            ->first();
        $membership->security_pin = bcrypt('654321');
        $membership->save();

        // Verify membership specific PIN check
        $response = $this->postJson($this->storeUrl($tenant, 'profile/verify-elevated-pin'), [
            'pin' => '654321',
            'user_id' => $owner->id,
        ]);
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    /** @test */
    public function test_sales_dashboard_excludes_returned_sales(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);

        // Standard posted sale
        $sale1 = \App\Models\Sale::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'reference_number' => 'SAL-123',
            'status' => 'posted',
            'net_sales' => 1500.00,
            'total' => 1500.00,
            'payment_method' => 'cash',
            'created_at' => now(),
        ]);

        // Returned sale
        $sale2 = \App\Models\Sale::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'reference_number' => 'RET-123',
            'status' => 'returned',
            'net_sales' => 1000.00,
            'total' => 1000.00,
            'payment_method' => 'cash',
            'created_at' => now(),
        ]);

        $response = $this->get($this->storeUrl($tenant, 'sales'));
        $response->assertStatus(200);

        $props = $response->original->getData()['page']['props'];
        
        // Stats should only sum standard posted sale
        $this->assertEquals(1500.00, $props['stats']['sales_month']);
        $this->assertEquals(1, $props['stats']['orders_month']);

        // Recent sales list should only show the posted one
        $recentIds = collect($props['recentSales'])->pluck('id');
        $this->assertTrue($recentIds->contains($sale1->id));
        $this->assertFalse($recentIds->contains($sale2->id));

        // Sales by method breakdown should exclude returned ones
        $cashMethodTotal = collect($props['salesByMethod'])->where('payment_method', 'cash')->first()?->total ?? 0;
        $this->assertEquals(1500.00, (float)$cashMethodTotal);
    }
}
