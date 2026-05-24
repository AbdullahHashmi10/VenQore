<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Party;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class MigrateOpeningBalancesTest extends VenQoreTestCase
{
    /** @test */
    public function it_seeds_opening_balances_with_correct_tenant_scoping(): void
    {
        // Revert any previous migration entries
        $this->artisan('migrate:opening-balances --reverse');

        // Create a test tenant and an owner user
        $tenant = $this->createTenant('ob-migrate-tenant');
        $user = $this->createTenantUser($tenant, 'owner');

        // Seed Chart of Accounts and other defaults for this tenant
        \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);

        // Verify accounts table has the necessary codes for this tenant
        $arAccount = Account::where('tenant_id', $tenant->id)->where('code', '1200')->first();
        $this->assertNotNull($arAccount, "Accounts Receivable (code 1200) should be seeded for this tenant.");

        $partyId = (string) \Illuminate\Support\Str::orderedUuid();
        DB::table('parties')->insert([
            'id' => $partyId,
            'tenant_id' => $tenant->id,
            'name' => 'John Doe',
            'type' => 'customer',
            'opening_balance' => 5000,
            'opening_balance_type' => 'receivable',
            'current_balance' => 5000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Run the opening balance migration command
        $this->artisan('migrate:opening-balances')
            ->expectsOutput("Processing Tenant: {$tenant->name} (ID: {$tenant->id}, Slug: {$tenant->slug})")
            ->assertExitCode(0);

        $obEquity = Account::where('tenant_id', $tenant->id)->where('code', '7000')->first();
        $this->assertNotNull($obEquity, "Historical Variance (code 7000) should be created during the migration.");

        // Assert journal entry was created with correct tenant_id
        $entry = DB::table('journal_entries')
            ->where('party_id', $partyId)
            ->first();

        $this->assertNotNull($entry, "A journal entry should have been created for John Doe.");
        $this->assertEquals($tenant->id, $entry->tenant_id, "Journal entry tenant_id should match the tenant's ID.");

        // Assert journal items were created with correct tenant_id and account_id
        $items = DB::table('journal_items')
            ->where('journal_entry_id', $entry->id)
            ->get();

        $this->assertCount(2, $items, "There should be exactly two journal items (debit and credit).");

        foreach ($items as $item) {
            $this->assertEquals($tenant->id, $item->tenant_id, "Journal item tenant_id should match the tenant's ID.");
        }

        // Verify that the debit item has the correct tenant-specific AR account ID
        $debitItem = $items->where('debit', '>', 0)->first();
        $this->assertNotNull($debitItem);
        $this->assertEquals($arAccount->id, $debitItem->account_id, "Debit item should reference the tenant's specific Accounts Receivable account.");
    }
}
