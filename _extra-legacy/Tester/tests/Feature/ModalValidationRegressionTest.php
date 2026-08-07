<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\BankAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\VenQoreTestCase;

class ModalValidationRegressionTest extends VenQoreTestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_parties_validation_rules_and_error_handling(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // 1. Missing name should fail validation
        $response = $this->postJson($this->storeUrl($tenant, 'parties'), [
            'type' => 'customer',
            'opening_balance_type' => 'receivable',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        // 2. Invalid contact type (e.g. 'all') should fail validation
        $response = $this->postJson($this->storeUrl($tenant, 'parties'), [
            'name' => 'John Doe',
            'type' => 'all',
            'opening_balance_type' => 'receivable',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['type']);

        // 3. Valid customer creation should succeed
        $response = $this->postJson($this->storeUrl($tenant, 'parties'), [
            'name' => 'Valid Customer',
            'type' => 'customer',
            'opening_balance_type' => 'receivable',
        ]);
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure(['party' => ['id', 'name', 'type']]);
    }

    /** @test */
    public function test_bank_accounts_validation_rules_and_error_handling(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // 1. Missing name should fail validation
        $response = $this->postJson($this->storeUrl($tenant, 'bank-accounts'), [
            'account_type' => 'checking',
            'opening_balance' => 0,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        // 2. Valid bank account creation should succeed
        $response = $this->postJson($this->storeUrl($tenant, 'bank-accounts'), [
            'name' => 'Business Savings',
            'account_type' => 'checking',
            'opening_balance' => 1000,
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('bank_accounts', [
            'tenant_id' => $tenant->id,
            'name' => 'Business Savings',
        ]);
    }

    /** @test */
    public function test_categories_validation_rules_and_error_handling(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // 1. Missing name should fail validation
        $response = $this->postJson($this->storeUrl($tenant, 'categories'), [
            'description' => 'A category without a name',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        // 2. Valid category creation should succeed
        $response = $this->postJson($this->storeUrl($tenant, 'categories'), [
            'name' => 'Beverages',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', [
            'tenant_id' => $tenant->id,
            'name' => 'Beverages',
        ]);
    }

    /** @test */
    public function test_expenses_validation_rules_and_error_handling(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $bank = BankAccount::create([
            'tenant_id' => $tenant->id,
            'name' => 'Cash in Hand',
            'account_type' => 'cash',
            'current_balance' => 1000,
        ]);
        
        $expenseCategory = ExpenseCategory::create([
            'tenant_id' => $tenant->id,
            'name' => 'Rent',
        ]);

        // 1. Missing category or amount should fail validation
        $response = $this->postJson($this->storeUrl($tenant, 'expenses'), [
            'bank_account_id' => $bank->id,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['expense_category_id', 'amount']);

        // 2. Valid expense creation should succeed
        $response = $this->postJson($this->storeUrl($tenant, 'expenses'), [
            'expense_category_id' => $expenseCategory->id,
            'amount' => 500,
            'bank_account_id' => $bank->id,
            'description' => 'Office Rent',
            'date' => '2026-06-04',
            'payment_method' => 'cash',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('expenses', [
            'tenant_id' => $tenant->id,
            'amount' => 500,
        ]);
    }

    /** @test */
    public function test_inventory_validation_rules_and_error_handling(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // 1. Missing name should fail validation
        $response = $this->postJson($this->storeUrl($tenant, 'inventory'), [
            'price' => 100,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }
}
