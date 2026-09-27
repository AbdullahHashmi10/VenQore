<?php

namespace Tests\Feature\Reckoner;

use App\Models\BankAccount;
use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\Resolvers\ResolverRegistry;
use App\Services\Cheque\ChequeBookService;
use Tests\Feature\VenQoreTestCase;

class ChequeCardsAndScopeTest extends VenQoreTestCase
{
    private Reckoner $reckoner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->reckoner = app(Reckoner::class);
    }

    public function test_all_seven_cheque_cards_are_registered_and_resolve_ok(): void
    {
        $tenant = $this->createTenant('reck-chq-' . uniqid());
        $user = $this->createTenantUser($tenant, 'accountant');
        $this->bindTenantContext($tenant, $user);

        $cards = [
            'cheque.available_leaves',
            'cheque.issued_uncleared',
            'cheque.cheques_in_hand',
            'cheque.deposited_uncleared',
            'cheque.bounced_total',
            'cheque.stopped_total',
            'cheque.post_dated_due',
        ];

        foreach ($cards as $key) {
            $this->assertTrue(CardRegistry::has($key), "Card {$key} must exist in CardRegistry.");
            $this->assertTrue(ResolverRegistry::has($key), "Card {$key} must exist in ResolverRegistry.");

            $req = [new ReckonerRequest($key, 'today')];
            $results = $this->reckoner->readMany($req, $user, $tenant);

            $id = $req[0]->getCompositeId();
            $this->assertArrayHasKey($id, $results, "Results must contain key {$id}");
            $this->assertTrue($results[$id]->ok, "Reading {$key} must resolve ok=true");
        }
    }

    public function test_two_tenants_and_two_users_produce_strictly_isolated_cache_keys(): void
    {
        $tenantA = $this->createTenant('reck-iso-a-' . uniqid());
        $userA = $this->createTenantUser($tenantA, 'accountant');

        $tenantB = $this->createTenant('reck-iso-b-' . uniqid());
        $userB = $this->createTenantUser($tenantB, 'accountant');

        // Bind tenant A context
        $this->bindTenantContext($tenantA, $userA);

        // Tenant A has 10 available leaves
        $bankA = BankAccount::create([
            'tenant_id' => $tenantA->id,
            'name' => 'HBL A',
            'account_number' => '1234567890',
            'type' => 'bank',
            'account_type' => 'bank',
            'current_balance' => 500000,
        ]);
        app(ChequeBookService::class)->registerChequeBook($tenantA, [
            'bank_account_id' => $bankA->id,
            'serial_start' => 100,
            'serial_end' => 109,
        ], $userA);

        $period = ReckonerPeriod::resolve('today', null, $tenantA);

        // 1. Verify cache keys between Tenant A and Tenant B are strictly isolated
        $refMethod = new \ReflectionMethod($this->reckoner, 'cacheKey');
        $keyA = $refMethod->invoke($this->reckoner, (int)$tenantA->id, 'cheque.available_leaves', $period, null, [], $userA);
        $keyB = $refMethod->invoke($this->reckoner, (int)$tenantB->id, 'cheque.available_leaves', $period, null, [], $userB);

        $this->assertNotEquals($keyA, $keyB, 'Different tenants must produce distinct Reckoner cache keys.');
        $this->assertStringContainsString((string)$tenantA->id, $keyA);
        $this->assertStringContainsString((string)$tenantB->id, $keyB);

        // 2. Verify cache keys between 2 users with different branch data scopes differ
        $ctxUser1 = new ReckonerContext($tenantA, $userA, 'accountant', ['finance.cheque_books.view'], ['branch_id' => 1]);
        $ctxUser2 = new ReckonerContext($tenantA, $userA, 'accountant', ['finance.cheque_books.view'], ['branch_id' => 2]);
        $this->assertNotEquals(
            $ctxUser1->scopeFingerprint('cheque.available_leaves'),
            $ctxUser2->scopeFingerprint('cheque.available_leaves'),
            'Users with different branch scopes must produce distinct fingerprints.'
        );

        // 3. Read for Tenant A
        $this->bindTenantContext($tenantA, $userA);
        $reqA = [new ReckonerRequest('cheque.available_leaves', 'today')];
        $resA = $this->reckoner->readMany($reqA, $userA, $tenantA);
        $idA = $reqA[0]->getCompositeId();
        $this->assertTrue($resA[$idA]->ok);
        $this->assertEquals(10, $resA[$idA]->data['value']);

        // 4. Read for Tenant B — must NOT serve Tenant A's cached value of 10!
        $this->bindTenantContext($tenantB, $userB);
        $reqB = [new ReckonerRequest('cheque.available_leaves', 'today')];
        $resB = $this->reckoner->readMany($reqB, $userB, $tenantB);
        $idB = $reqB[0]->getCompositeId();
        $this->assertTrue($resB[$idB]->ok);
        $this->assertEquals(0, $resB[$idB]->data['value']);
    }
}
