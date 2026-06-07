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
}
