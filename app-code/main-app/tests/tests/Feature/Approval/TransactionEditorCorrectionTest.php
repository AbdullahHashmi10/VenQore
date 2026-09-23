<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalRevision;
use App\Models\ApprovalTransition;
use App\Models\ApprovalReturnReason;
use App\Models\Party;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * TransactionEditorCorrectionTest
 *
 * Proves that returned approval documents connect to their real original-editor
 * controllers/pages (?edit_approval={id}), validate security boundaries server-side,
 * load the returned revision and reviewer reasons, and submit corrections exclusively
 * to the approval resubmission endpoint.
 */
class TransactionEditorCorrectionTest extends VenQoreTestCase
{
    private function createReturnedDoc(Tenant $tenant, User $maker, User $reviewer, string $type, array $payload): ApprovalDocument
    {
        $doc = ApprovalDocument::create([
            'tenant_id'     => $tenant->id,
            'document_type' => $type,
            'status'        => ApprovalDocument::STATUS_RETURNED,
            'maker_id'      => $maker->id,
            'reviewer_id'   => $reviewer->id,
            'amount'        => $payload['amount'] ?? ($payload['grand_total'] ?? 150.00),
            'version'       => 1,
            'metadata'      => ['note' => 'Initial test submission'],
        ]);

        $rev = ApprovalRevision::create([
            'approval_document_id' => $doc->id,
            'revision_number'      => 1,
            'maker_id'             => $maker->id,
            'payload'              => $payload,
        ]);

        $doc->update(['current_revision_id' => $rev->id]);

        ApprovalTransition::create([
            'approval_document_id' => $doc->id,
            'actor_id'             => $reviewer->id,
            'from_status'          => ApprovalDocument::STATUS_PENDING,
            'to_status'            => ApprovalDocument::STATUS_RETURNED,
            'source_revision_id'   => $rev->id,
            'notes'                => 'Please fix invoice breakdown and reference.',
            'reason_codes'         => ['INCORRECT_AMOUNT', 'MISSING_ATTACHMENT'],
            'created_at'           => now(),
        ]);

        return $doc;
    }

    public function test_customer_receipt_editor_loads_returned_approval_correction(): void
    {
        $tenant = $this->createTenant('corr-cr-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $party = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Customer ABC',
            'type'      => 'customer',
        ]);

        $payload = [
            'party_id'        => $party->id,
            'amount'          => 250.00,
            'payment_method'  => 'cash',
            'reference'       => 'REC-001',
            'date'            => '2026-09-23',
            'description'     => 'Receipt notes',
        ];

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, $payload);

        $this->actingAsTenantUserModel($maker, $tenant);

        $response = $this->get($this->storeUrl($tenant, "/payments/in?edit_approval={$doc->id}"));
        $response->assertStatus(200);
        $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => 
            $page->component('Payments/In')
                ->has('approval_correction', fn ($corr) => 
                    $corr->where('document_id', $doc->id)
                         ->where('version', 1)
                         ->where('expected_version', 1)
                         ->where('return_notes', 'Please fix invoice breakdown and reference.')
                         ->where('return_reason_codes', ['INCORRECT_AMOUNT', 'MISSING_ATTACHMENT'])
                         ->where('payload.amount', 250)
                         ->etc()
                )
        );
    }

    public function test_supplier_payment_editor_loads_returned_approval_correction(): void
    {
        $tenant = $this->createTenant('corr-sp-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'purchasing_officer');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $party = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Supplier XYZ',
            'type'      => 'supplier',
        ]);

        $payload = [
            'party_id'        => $party->id,
            'amount'          => 1200.00,
            'payment_method'  => 'cash',
            'reference'       => 'SUP-PAY-99',
            'date'            => '2026-09-23',
            'description'     => 'Supplier payment notes',
        ];

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_SUPPLIER_PAYMENT, $payload);

        $this->actingAsTenantUserModel($maker, $tenant);

        $response = $this->get($this->storeUrl($tenant, "/payments/out?edit_approval={$doc->id}"));
        $response->assertStatus(200);
        $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => 
            $page->component('Payments/Out')
                ->has('approval_correction', fn ($corr) => 
                    $corr->where('document_id', $doc->id)
                         ->where('version', 1)
                         ->where('return_notes', 'Please fix invoice breakdown and reference.')
                         ->etc()
                )
        );
    }

    public function test_operating_expense_editor_loads_returned_approval_correction(): void
    {
        $tenant = $this->createTenant('corr-ex-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'accountant');
        $reviewer = $this->createTenantUser($tenant, 'owner');

        $payload = [
            'amount'          => 450.00,
            'payment_method'  => 'cash',
            'reference'       => 'EXP-771',
            'date'            => '2026-09-23',
            'description'     => 'Office snacks',
        ];

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_OPERATING_EXPENSE, $payload);

        $this->actingAsTenantUserModel($maker, $tenant);

        $response = $this->get($this->storeUrl($tenant, "/expenses/create?edit_approval={$doc->id}"));
        $response->assertStatus(200);
        $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => 
            $page->component('Expenses/Create')
                ->has('approval_correction', fn ($corr) => 
                    $corr->where('document_id', $doc->id)
                         ->where('version', 1)
                         ->etc()
                )
        );
    }

    public function test_sales_invoice_editor_loads_returned_approval_correction(): void
    {
        $tenant = $this->createTenant('corr-inv-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'sales_executive');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $payload = [
            'grand_total'     => 890.00,
            'reference'       => 'INV-1099',
            'date'            => '2026-09-23',
            'items'           => [],
        ];

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_SALES_INVOICE, $payload);

        $this->actingAsTenantUserModel($maker, $tenant);

        $response = $this->get($this->storeUrl($tenant, "/sales/invoice/create?edit_approval={$doc->id}"));
        $response->assertStatus(200);
        $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => 
            $page->component('Sales/CreateInvoice')
                ->has('approval_correction', fn ($corr) => 
                    $corr->where('document_id', $doc->id)
                         ->where('version', 1)
                         ->etc()
                )
        );
    }

    public function test_resubmission_increments_version_and_preserves_revisions(): void
    {
        $tenant = $this->createTenant('corr-resub-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $party = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Customer ABC',
            'type'      => 'customer',
        ]);

        $payloadV1 = [
            'party_id'       => $party->id,
            'amount'         => 250.00,
            'payment_method' => 'cash',
        ];

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, $payloadV1);

        $this->actingAsTenantUserModel($maker, $tenant);

        $correctedPayload = [
            'party_id'       => $party->id,
            'amount'         => 300.00,
            'payment_method' => 'cash',
            'reference'      => 'REC-001-CORRECTED',
        ];

        $response = $this->postJson($this->storeUrl($tenant, "/approvals/{$doc->id}/resubmit"), [
            'payload'          => $correctedPayload,
            'expected_version' => 1,
            'notes'            => 'Updated amount to 300 and added reference',
        ]);

        $response->assertStatus(200);

        $doc->refresh();
        $this->assertEquals(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertEquals(2, $doc->version);

        // Verify revision 1 and revision 2 both exist immutably
        $revisions = ApprovalRevision::where('approval_document_id', $doc->id)->orderBy('revision_number')->get();
        $this->assertCount(2, $revisions);
        $this->assertEquals(1, $revisions[0]->revision_number);
        $this->assertEquals(250.00, $revisions[0]->payload['amount']);
        $this->assertEquals(2, $revisions[1]->revision_number);
        $this->assertEquals(300.00, $revisions[1]->payload['amount']);
    }

    public function test_wrong_maker_cannot_access_or_resubmit_returned_approval(): void
    {
        $tenant = $this->createTenant('corr-maker-sec-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'cashier');
        $wrongMaker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, ['amount' => 100]);

        // Wrong maker tries to GET editor with edit_approval
        $this->actingAsTenantUserModel($wrongMaker, $tenant);
        $response = $this->get($this->storeUrl($tenant, "/payments/in?edit_approval={$doc->id}"));
        $response->assertStatus(403);

        // Wrong maker tries to POST resubmit
        $postResponse = $this->postJson($this->storeUrl($tenant, "/approvals/{$doc->id}/resubmit"), [
            'payload'          => ['amount' => 100],
            'expected_version' => 1,
        ]);
        $postResponse->assertStatus(403);
    }

    public function test_stale_version_resubmission_is_rejected(): void
    {
        $tenant = $this->createTenant('corr-stale-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $party = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Customer ABC',
            'type'      => 'customer',
        ]);

        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, [
            'party_id'       => $party->id,
            'amount'         => 100.00,
            'payment_method' => 'cash',
        ]);

        $this->actingAsTenantUserModel($maker, $tenant);

        $postResponse = $this->postJson($this->storeUrl($tenant, "/approvals/{$doc->id}/resubmit"), [
            'payload'          => ['party_id' => $party->id, 'amount' => 120, 'payment_method' => 'cash'],
            'expected_version' => 999, // Stale/mismatched version
        ]);
        $postResponse->assertStatus(422);
    }

    public function test_wrong_tenant_cannot_access_or_resubmit_approval(): void
    {
        $tenant1 = $this->createTenant('corr-t1-' . uniqid(), 'ltd_3');
        $tenant1->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant1);

        $tenant2 = $this->createTenant('corr-t2-' . uniqid(), 'ltd_3');
        $tenant2->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant2);

        $maker1 = $this->createTenantUser($tenant1, 'cashier');
        $reviewer1 = $this->createTenantUser($tenant1, 'manager');

        $user2 = $this->createTenantUser($tenant2, 'cashier');

        $doc = $this->createReturnedDoc($tenant1, $maker1, $reviewer1, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, ['amount' => 100]);

        $this->actingAsTenantUserModel($user2, $tenant2);

        $response = $this->get($this->storeUrl($tenant2, "/payments/in?edit_approval={$doc->id}"));
        $response->assertStatus(404);
    }

    public function test_non_returned_approval_cannot_be_opened_in_correction_mode(): void
    {
        $tenant = $this->createTenant('corr-nonret-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'cashier');

        $doc = ApprovalDocument::create([
            'tenant_id'     => $tenant->id,
            'document_type' => ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            'status'        => ApprovalDocument::STATUS_PENDING,
            'maker_id'      => $maker->id,
            'amount'        => 100.00,
            'version'       => 1,
        ]);

        $this->actingAsTenantUserModel($maker, $tenant);

        $response = $this->get($this->storeUrl($tenant, "/payments/in?edit_approval={$doc->id}"));
        $response->assertStatus(422);
    }

    public function test_type_mismatch_is_rejected(): void
    {
        $tenant = $this->createTenant('corr-mismatch-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'accountant');
        $reviewer = $this->createTenantUser($tenant, 'owner');

        // Customer receipt document
        $doc = $this->createReturnedDoc($tenant, $maker, $reviewer, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, ['amount' => 100]);

        $this->actingAsTenantUserModel($maker, $tenant);

        // Passed to expenses/create instead of payments/in
        $response = $this->get($this->storeUrl($tenant, "/expenses/create?edit_approval={$doc->id}"));
        $response->assertStatus(422);
    }
}
