<?php

namespace Tests\Feature\V3\Scenarios;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;
use App\Services\V3\AccountingService;

class AccountingServiceTest extends TestCase
{
    use DatabaseTransactions;

    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();
        $this->accounting = app(AccountingService::class);
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        // Seed necessary accounts that normally come from global seeders
        \App\Models\Account::firstOrCreate(
            ['code' => '1000'],
            ['name' => 'Cash in Hand', 'type' => 'asset', 'normal_balance' => 'debit']
        );
        \App\Models\Account::firstOrCreate(
            ['code' => '4000'],
            ['name' => 'Sales Revenue', 'type' => 'income', 'normal_balance' => 'credit']
        );
    }

    /** @test */
    public function it_rejects_an_unbalanced_entry(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'test',
            'reference_id'   => 1,
            'description'    => 'Unbalanced test',
        ], [
            ['account_code' => '1000', 'debit' => 500.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0,      'credit' => 400.00], // intentionally wrong
        ]);
    }

    /** @test */
    public function it_creates_a_balanced_entry_and_returns_a_journal_entry(): void
    {
        $entry = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'test',
            'reference_id'   => 1,
            'description'    => 'Balanced test',
        ], [
            ['account_code' => '1000', 'debit' => 1000.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 1000.00],
        ]);

        $this->assertDatabaseHas('journal_entries', ['id' => $entry->id]);
        $this->assertDatabaseHas('journal_items',   ['journal_entry_id' => $entry->id, 'debit' => 1000.00]);
        $this->assertDatabaseHas('journal_items',   ['journal_entry_id' => $entry->id, 'credit' => 1000.00]);
    }

    /** @test */
    public function it_rejects_a_journal_item_with_both_debit_and_credit_populated(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'test',
            'reference_id'   => 1,
            'description'    => 'Bad row test',
        ], [
            ['account_code' => '1000', 'debit' => 500.00, 'credit' => 500.00], // both populated
            ['account_code' => '4000', 'debit' => 0,      'credit' => 0],
        ]);
    }

    /** @test */
    public function get_balance_returns_correct_debit_normal_balance(): void
    {
        // Seed a known entry
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'test',
            'reference_id'   => 99,
            'description'    => 'Balance test',
        ], [
            ['account_code' => '1000', 'debit' => 3000.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 3000.00],
        ]);

        $balance = $this->accounting->getBalance('1000');
        $this->assertEquals(3000.00, $balance);
    }

    /** @test */
    public function reverse_entry_voids_all_active_payment_allocations_in_same_transaction(): void
    {
        // This test will be completed in Task 1.11
        // For now just assert the method exists and is callable
        $this->assertTrue(method_exists($this->accounting, 'reverseEntry'));
    }
}
