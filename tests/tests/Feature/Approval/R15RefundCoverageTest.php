<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Services\Approval\ApprovalExecutionEngine;
use Tests\Feature\VenQoreTestCase;

/**
 * R15: Standalone Customer Refund Coverage
 *
 * Verifies that standalone customer refund:
 * 1. Checks finance.customer_refund permission.
 * 2. When approval is required, creates ApprovalDocument (customer_refund) and returns 202.
 * 3. Does NOT post journal entries or payments while pending.
 * 4. When approved, creates DR 1200 / CR 1000 GL entry and Payment record.
 * 5. Does not cause stock movements or duplicate sale reversals.
 */
class R15RefundCoverageTest extends VenQoreTestCase
{
    public function test_customer_refund_approval_workflow_and_gl_posting(): void
    {
        $tenant = $this->createTenant('r15-refund-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        // Require approval for customer refunds
        Setting::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'key'       => 'approval_policy_customer_refund',
            'value'     => 'required',
        ]);

        $maker = $this->createTenantUser($tenant, 'admin');
        $this->actingAsTenantUserModel($maker, $tenant);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Refundable Customer',
            'type'      => 'customer',
        ]);

        // 1. Submit customer refund via PaymentController
        $response = $this->postJson($this->storeUrl($tenant, '/payments'), [
            'type'           => 'out',
            'party_id'       => $customer->id,
            'amount'         => 150.00,
            'payment_method' => 'cash',
            'date'           => now()->toDateString(),
            'description'    => 'Overpayment settlement refund',
            'reference'      => 'REF-R15-001',
        ]);

        $response->assertStatus(202);
        $response->assertJson([
            'status'  => 'pending_approval',
            'message' => 'Customer refund submitted for approval.',
        ]);

        // 2. Verify ApprovalDocument created and no financial mutation yet
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_CUSTOMER_REFUND)
            ->first();

        $this->assertNotNull($doc, 'ApprovalDocument for customer_refund must exist');
        $this->assertSame('pending', $doc->status);
        $this->assertEquals(150.00, (float) $doc->amount);
        $this->assertSame(0, Payment::where('tenant_id', $tenant->id)->count(), 'No Payment row before approval');
        $this->assertSame(0, JournalEntry::where('tenant_id', $tenant->id)->count(), 'No JournalEntry before approval');
        $this->assertSame(0, StockMovement::where('tenant_id', $tenant->id)->count(), 'No StockMovement for customer refund');

        // 3. Approve via reviewer with finance.customer_refund (admin has this permission)
        $reviewer = $this->createTenantUser($tenant, 'admin');

        $engine = resolve(ApprovalExecutionEngine::class);
        $engine->approve(
            documentId:    $doc->id,
            tenant:        $tenant,
            reviewer:      $reviewer,
            reviewerNotes: 'Approved customer refund'
        );

        $doc->refresh();
        $this->assertSame('approved', $doc->status);

        // 4. Verify GL posting & Payment record
        $this->assertSame(1, Payment::where('tenant_id', $tenant->id)->count(), 'Payment row must be created upon approval');
        $payment = Payment::where('tenant_id', $tenant->id)->first();
        $this->assertSame('out', $payment->type);
        $this->assertSame($customer->id, $payment->party_id);
        $this->assertEquals(150.00, (float) $payment->amount);

        $entry = JournalEntry::where('tenant_id', $tenant->id)
            ->where('reference_type', 'customer_refund')
            ->first();
        $this->assertNotNull($entry, 'Journal entry must be posted for customer refund');

        $lines = $entry->items->load('account');
        $this->assertCount(2, $lines);

        $debitLine = $lines->first(fn($i) => $i->account?->code === '1200');
        $creditLine = $lines->first(fn($i) => $i->account?->code === '1000');

        $this->assertNotNull($debitLine, 'Debit to Accounts Receivable (1200) expected');
        $this->assertEquals(150.00, (float) $debitLine->debit);
        $this->assertEquals(0.00, (float) $debitLine->credit);

        $this->assertNotNull($creditLine, 'Credit to Cash (1000) expected');
        $this->assertEquals(0.00, (float) $creditLine->debit);
        $this->assertEquals(150.00, (float) $creditLine->credit);

        // 5. Zero stock movement throughout
        $this->assertSame(0, StockMovement::where('tenant_id', $tenant->id)->count(), 'Stock must remain untouched');
    }
}
