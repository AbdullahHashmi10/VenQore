<?php

namespace Tests\Feature\Reckoner;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use App\Services\Approval\ApprovalExecutionEngine;
use Illuminate\Support\Facades\Cache;
use Tests\Feature\VenQoreTestCase;

class ApprovalCardsAndScopeTest extends VenQoreTestCase
{
    private Reckoner $reckoner;
    private ApprovalExecutionEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->reckoner = app(Reckoner::class);
        $this->engine = app(ApprovalExecutionEngine::class);
        ReckonerRegistry::clearCache();
        Cache::flush();
    }

    public function test_catalogue_contains_at_least_349_cards(): void
    {
        $cards = CardRegistry::all();
        $this->assertGreaterThanOrEqual(349, count($cards));
    }

    public function test_approval_cards_resolve_correctly_for_maker_and_reviewer(): void
    {
        $tenant = $this->createTenant('reck-appr-' . uniqid(), 'ltd_3');
        $makerA = $this->createTenantUser($tenant, 'cashier');
        $makerB = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        // Create 2 pending docs for maker A ($500 each)
        $doc1 = $this->engine->submit(
            tenant: $tenant,
            maker: $makerA,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: ['amount' => 500.00, 'payment_method' => 'cash'],
            amount: 500.00
        );

        $doc2 = $this->engine->submit(
            tenant: $tenant,
            maker: $makerA,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: ['amount' => 500.00, 'payment_method' => 'cash'],
            amount: 500.00
        );

        // Create 1 pending doc for maker B ($1200)
        $doc3 = $this->engine->submit(
            tenant: $tenant,
            maker: $makerB,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: ['amount' => 1200.00, 'payment_method' => 'cash'],
            amount: 1200.00
        );

        // Return doc2 for maker A
        $reason = ApprovalReturnReason::firstOrCreate(['code' => 'INCORRECT_AMOUNT'], ['label' => 'Amount mismatch']);
        $this->engine->returnDocument(
            documentId: $doc2->id,
            tenant: $tenant,
            reviewer: $reviewer,
            reasonCodes: ['INCORRECT_AMOUNT'],
            notes: 'Please verify receipt total'
        );

        // 1. Resolve cards for Maker A
        $this->bindTenantContext($tenant, $makerA);
        $requestsMakerA = [
            new ReckonerRequest('approval.my_pending', 'today'),
            new ReckonerRequest('approval.my_returned', 'today'),
        ];

        $idPendingA = $requestsMakerA[0]->getCompositeId();
        $idReturnedA = $requestsMakerA[1]->getCompositeId();

        $resultsMakerA = $this->reckoner->readMany($requestsMakerA, $makerA, $tenant);
        $this->assertTrue($resultsMakerA[$idPendingA]->ok);
        $this->assertSame(1, $resultsMakerA[$idPendingA]->data['count']); // doc1 is pending
        $this->assertEquals(500.00, $resultsMakerA[$idPendingA]->data['amount']);

        $this->assertTrue($resultsMakerA[$idReturnedA]->ok);
        $this->assertSame(1, $resultsMakerA[$idReturnedA]->data['count']); // doc2 is returned
        $this->assertEquals(500.00, $resultsMakerA[$idReturnedA]->data['amount']);

        // 2. Resolve cards for Maker B (Isolation from Maker A)
        $this->bindTenantContext($tenant, $makerB);
        $requestsMakerB = [
            new ReckonerRequest('approval.my_pending', 'today'),
            new ReckonerRequest('approval.my_returned', 'today'),
        ];
        $idPendingB = $requestsMakerB[0]->getCompositeId();
        $idReturnedB = $requestsMakerB[1]->getCompositeId();

        $resultsMakerB = $this->reckoner->readMany($requestsMakerB, $makerB, $tenant);
        $this->assertSame(1, $resultsMakerB[$idPendingB]->data['count']); // doc3 only
        $this->assertEquals(1200.00, $resultsMakerB[$idPendingB]->data['amount']);
        $this->assertSame(0, $resultsMakerB[$idReturnedB]->data['count']);

        // 3. Resolve store review queue for Reviewer
        $this->bindTenantContext($tenant, $reviewer);
        $requestsReviewer = [
            new ReckonerRequest('approval.awaiting_review', 'today'),
            new ReckonerRequest('approval.pending_aging', 'today'),
        ];
        $idReview = $requestsReviewer[0]->getCompositeId();
        $idAging = $requestsReviewer[1]->getCompositeId();

        $resultsReviewer = $this->reckoner->readMany($requestsReviewer, $reviewer, $tenant);
        $this->assertSame(2, $resultsReviewer[$idReview]->data['count']); // doc1 + doc3 are pending
        $this->assertEquals(1700.00, $resultsReviewer[$idReview]->data['amount']);
        $this->assertSame(2, $resultsReviewer[$idAging]->data['under_24h']);
    }

    public function test_personal_card_cache_is_strictly_scoped_per_user(): void
    {
        $tenant = $this->createTenant('reck-cache-' . uniqid(), 'ltd_3');
        $user1 = $this->createTenantUser($tenant, 'cashier');
        $user2 = $this->createTenantUser($tenant, 'cashier');

        $this->engine->submit(
            tenant: $tenant,
            maker: $user1,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: ['amount' => 300.00, 'payment_method' => 'cash'],
            amount: 300.00
        );

        $req = [new ReckonerRequest('approval.my_pending', 'today')];
        $id = $req[0]->getCompositeId();

        // Resolve and cache for user 1
        $this->bindTenantContext($tenant, $user1);
        $res1 = $this->reckoner->readMany($req, $user1, $tenant);
        $this->assertTrue($res1[$id]->ok);
        $this->assertSame(1, $res1[$id]->data['count']);

        // Resolve for user 2 — must NOT serve user 1's cached count of 1!
        $this->bindTenantContext($tenant, $user2);
        $res2 = $this->reckoner->readMany($req, $user2, $tenant);
        $this->assertTrue($res2[$id]->ok);
        $this->assertSame(0, $res2[$id]->data['count']);
    }

    public function test_data_scope_differentiates_cache_fingerprint(): void
    {
        $tenant = $this->createTenant('reck-scope-' . uniqid(), 'ltd_3');
        $user = $this->createTenantUser($tenant, 'cashier');

        $ctx1 = new \App\Reckoner\ReckonerContext($tenant, $user, 'cashier', ['sales.view'], ['warehouse_id' => 1]);
        $ctx2 = new \App\Reckoner\ReckonerContext($tenant, $user, 'cashier', ['sales.view'], ['warehouse_id' => 2]);

        $fp1 = $ctx1->scopeFingerprint('sales.daily_volume');
        $fp2 = $ctx2->scopeFingerprint('sales.daily_volume');

        $this->assertNotEquals($fp1, $fp2, 'Users with different dataScopes must produce distinct cache fingerprints.');
    }

    public function test_data_scope_key_order_normalization_invariance(): void
    {
        $tenant = $this->createTenant('reck-order-' . uniqid(), 'ltd_3');
        $user = $this->createTenantUser($tenant, 'cashier');

        // Same nested data scope supplied with keys in different order
        $scopeA = [
            'warehouse_id' => 5,
            'branch_id'    => 12,
            'assignments'  => ['role' => 'lead', 'zone' => 'north'],
            'customer_ids' => [101, 102],
        ];

        $scopeB = [
            'customer_ids' => [101, 102],
            'assignments'  => ['zone' => 'north', 'role' => 'lead'],
            'branch_id'    => 12,
            'warehouse_id' => 5,
        ];

        $ctxA = new \App\Reckoner\ReckonerContext($tenant, $user, 'cashier', ['sales.view'], $scopeA);
        $ctxB = new \App\Reckoner\ReckonerContext($tenant, $user, 'cashier', ['sales.view'], $scopeB);

        $this->assertSame(
            $ctxA->scopeFingerprint('sales.daily_volume'),
            $ctxB->scopeFingerprint('sales.daily_volume'),
            'Identical data scopes in different key orders must produce the exact same fingerprint.'
        );
    }
}
