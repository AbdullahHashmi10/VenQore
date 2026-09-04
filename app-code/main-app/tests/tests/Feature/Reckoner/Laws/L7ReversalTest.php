<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Sale;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * L7 — Reversal Law
 *
 * Posting a transaction then reversing it returns every affected reading to
 * its prior value exactly.
 */
class L7ReversalTest extends VenQoreTestCase
{
    public function test_reversing_a_sale_restores_sales_revenue(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $reckoner = new Reckoner();

        // ── Snapshot before posting ──────────────────────────────────────────
        $before = $this->readScalar($reckoner, 'sales.revenue', 'today', $user, $tenant);

        // ── Ensure accounts exist ────────────────────────────────────────────
        $arAccount = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '1200'],
            ['name' => 'Accounts Receivable', 'type' => 'asset', 'is_active' => true]
        );
        $revenueAccount = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '4000'],
            ['name' => 'Sales Revenue', 'type' => 'income', 'is_active' => true]
        );

        $saleAmount = 1000.00;

        // Post a JournalEntry with items for today
        $entry = JournalEntry::create([
            'id'          => (string) Str::uuid(),
            'tenant_id'   => $tenant->id,
            'date'        => now()->toDateString(),
            'reference'   => 'SALE-001',
            'description' => 'Test Sale',
            'user_id'     => $user->id,
            'is_reversed' => false,
        ]);

        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => $arAccount->id,
            'debit'            => $saleAmount,
            'credit'           => 0,
        ]);

        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => $revenueAccount->id,
            'debit'            => 0,
            'credit'           => $saleAmount,
        ]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenant->id);

        // ── Assert revenue increased ─────────────────────────────────────────
        $after = $this->readScalar($reckoner, 'sales.revenue', 'today', $user, $tenant);
        $this->assertEqualsWithDelta(
            $before + $saleAmount,
            $after,
            0.01,
            "Revenue should have increased by {$saleAmount} after posting."
        );

        // ── Reverse the entry ────────────────────────────────────────────────
        $entry->update(['is_reversed' => true]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenant->id);

        // ── Assert revenue restored ──────────────────────────────────────────
        $afterReversal = $this->readScalar($reckoner, 'sales.revenue', 'today', $user, $tenant);
        $this->assertEqualsWithDelta(
            $before,
            $afterReversal,
            0.01,
            "Revenue should have returned to {$before} after reversing the sale. Got {$afterReversal}."
        );
    }

    public function test_reversing_a_sale_restores_finance_gross_profit(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $reckoner = new Reckoner();

        $before = $this->readScalar($reckoner, 'finance.gross_profit', 'today', $user, $tenant);

        $arAccount = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '1200'],
            ['name' => 'Accounts Receivable', 'type' => 'asset', 'is_active' => true]
        );
        $revenueAccount = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '4000'],
            ['name' => 'Sales Revenue', 'type' => 'income', 'is_active' => true]
        );
        $cogsAccount = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '5000'],
            ['name' => 'Cost of Goods Sold', 'type' => 'expense', 'is_active' => true]
        );
        $inventoryAccount = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '1300'],
            ['name' => 'Inventory', 'type' => 'asset', 'is_active' => true]
        );

        $saleAmount = 500.00;
        $cogsAmount = 200.00;

        $entry = JournalEntry::create([
            'id'          => (string) Str::uuid(),
            'tenant_id'   => $tenant->id,
            'date'        => now()->toDateString(),
            'reference'   => 'SALE-002',
            'description' => 'Test Sale 2',
            'user_id'     => $user->id,
            'is_reversed' => false,
        ]);

        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => $arAccount->id,
            'debit'            => $saleAmount,
            'credit'           => 0,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => $revenueAccount->id,
            'debit'            => 0,
            'credit'           => $saleAmount,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => $cogsAccount->id,
            'debit'            => $cogsAmount,
            'credit'           => 0,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => $inventoryAccount->id,
            'debit'            => 0,
            'credit'           => $cogsAmount,
        ]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenant->id);

        $afterPost = $this->readScalar($reckoner, 'finance.gross_profit', 'today', $user, $tenant);
        $this->assertEqualsWithDelta(
            $before + ($saleAmount - $cogsAmount),
            $afterPost,
            0.01,
            "Gross profit should have risen by " . ($saleAmount - $cogsAmount) . " after posting."
        );

        // Reverse
        $entry->update(['is_reversed' => true]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenant->id);

        $afterReversal = $this->readScalar($reckoner, 'finance.gross_profit', 'today', $user, $tenant);
        $this->assertEqualsWithDelta(
            $before,
            $afterReversal,
            0.01,
            "Gross profit should have returned to {$before} after reversal. Got {$afterReversal}."
        );
    }

    private function readScalar(Reckoner $r, string $key, string $period, $user, $tenant): float
    {
        $result = $r->read(new ReckonerRequest($key, $period), $user, $tenant);
        if (! $result->ok) {
            return 0.0;
        }
        return (float) (is_array($result->data) ? ($result->data['value'] ?? 0) : 0);
    }
}
