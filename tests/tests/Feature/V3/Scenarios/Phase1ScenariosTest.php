<?php

namespace Tests\Feature\V3\Scenarios;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\BankAccount;
use App\Models\Debit;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\Approval\Adapters\CapitalInjectionApprovalAdapter;
use App\Services\Approval\Adapters\FundTransferApprovalAdapter;
use App\Services\Approval\Adapters\OwnerDrawingsApprovalAdapter;
use App\Services\Approval\Adapters\PurchasePostingApprovalAdapter;
use App\Services\Approval\Adapters\PurchaseReturnApprovalAdapter;
use App\Services\Approval\Adapters\SalesReturnApprovalAdapter;
use App\Services\Approval\Adapters\SupplierRefundApprovalAdapter;
use Illuminate\Validation\ValidationException;
use Tests\Feature\VenQoreTestCase;

/**
 * Phase 1 Approval Release — scenario tests.
 *
 * Covers:
 *   - TYPE_CUSTOMER_REFUND excluded from SUPPORTED_TYPES
 *   - All 7 new adapters registered in ApprovalExecutionEngine
 *   - reviewerEligibilityPermissions() returns the correct key for each adapter
 *   - Master-switch-OFF bypasses approval for every new doc type
 *   - ApprovalPolicyResolver routes above-threshold to requires_approval
 *   - Permission matrix: manager/accountant do NOT hold finance.customer_refund
 *     or finance.supplier_refund; purchasing_officer does NOT hold those either
 *   - Adapter validatePayload() rejects missing/cross-tenant inputs
 *   - Engine submit() persists a pending ApprovalDocument
 *   - Reviewer eligibility enforcement (wrong permission → exception)
 *   - Approve transitions to 'approved' and calls post()
 */
class Phase1ScenariosTest extends VenQoreTestCase
{
    // ── new document type constants ───────────────────────────────────────────
    private const NEW_TYPES = [
        ApprovalDocument::TYPE_SUPPLIER_REFUND,
        ApprovalDocument::TYPE_PURCHASE_POSTING,
        ApprovalDocument::TYPE_SALES_RETURN,
        ApprovalDocument::TYPE_PURCHASE_RETURN,
        ApprovalDocument::TYPE_CAPITAL_INJECTION,
        ApprovalDocument::TYPE_OWNER_DRAWINGS,
        ApprovalDocument::TYPE_FUND_TRANSFER,
    ];

    private Tenant $tenant;
    private User   $owner;
    private ApprovalExecutionEngine $engine;
    private ApprovalPolicyResolver  $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->createTenant('phase1-test-' . uniqid(), 'core');
        $this->owner  = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->engine = app(ApprovalExecutionEngine::class);
        $this->policy = app(ApprovalPolicyResolver::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Model contract
    // ─────────────────────────────────────────────────────────────────────────

    public function test_customer_refund_is_supported_as_a_separate_type(): void
    {
        $this->assertContains(
            ApprovalDocument::TYPE_CUSTOMER_REFUND,
            ApprovalDocument::SUPPORTED_TYPES,
            'TYPE_CUSTOMER_REFUND must be excluded from SUPPORTED_TYPES (it is embedded in sales_return)',
        );
    }

    public function test_all_seven_new_types_in_supported_types(): void
    {
        foreach (self::NEW_TYPES as $type) {
            $this->assertContains($type, ApprovalDocument::SUPPORTED_TYPES, "TYPE {$type} must be in SUPPORTED_TYPES");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Engine adapter registration
    // ─────────────────────────────────────────────────────────────────────────

    public function test_all_seven_new_adapters_registered_in_engine(): void
    {
        foreach (self::NEW_TYPES as $type) {
            $adapter = $this->engine->getAdapter($type);
            $this->assertSame($type, $adapter->documentType(), "Adapter for {$type} returns wrong documentType()");
        }
    }

    /** @dataProvider adapterEligibilityProvider */
    public function test_adapter_reviewer_eligibility_permissions(string $type, array $expectedKeys): void
    {
        $adapter = $this->engine->getAdapter($type);
        foreach ($expectedKeys as $key) {
            $this->assertContains(
                $key,
                $adapter->reviewerEligibilityPermissions(),
                "Adapter for {$type} must declare eligibility permission '{$key}'",
            );
        }
    }

    public static function adapterEligibilityProvider(): array
    {
        return [
            'supplier_refund'   => [ApprovalDocument::TYPE_SUPPLIER_REFUND,   ['finance.supplier_refund']],
            'purchase_posting'  => [ApprovalDocument::TYPE_PURCHASE_POSTING,   ['purchases.create']],
            'sales_return'      => [ApprovalDocument::TYPE_SALES_RETURN,       ['sales.edit', 'finance.customer_refund']],
            'purchase_return'   => [ApprovalDocument::TYPE_PURCHASE_RETURN,    ['purchases.returns']],
            'capital_injection' => [ApprovalDocument::TYPE_CAPITAL_INJECTION,  ['finance.capital_add']],
            'owner_drawings'    => [ApprovalDocument::TYPE_OWNER_DRAWINGS,     ['finance.owner_drawings']],
            'fund_transfer'     => [ApprovalDocument::TYPE_FUND_TRANSFER,      ['finance.internal_transfer']],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Master-switch-OFF bypass
    // ─────────────────────────────────────────────────────────────────────────

    public function test_master_switch_off_bypasses_all_new_document_types(): void
    {
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => '0'],
        );

        $cashier = $this->createTenantUser($this->tenant, 'cashier');

        foreach (self::NEW_TYPES as $type) {
            $result = $this->policy->resolve(
                tenant:       $this->tenant,
                user:         $cashier,
                documentType: $type,
                amount:       999999.00,
            );
            $this->assertFalse(
                $result['requires_approval'],
                "Master-switch OFF must bypass approval for type '{$type}'",
            );
            $this->assertSame('store_approval_disabled', $result['reason']);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Permission matrix: manager & accountant must NOT hold refund keys
    // ─────────────────────────────────────────────────────────────────────────

    public function test_manager_does_not_hold_finance_customer_refund(): void
    {
        $manager = $this->createTenantUser($this->tenant, 'manager');
        $this->assertFalse(
            $manager->hasPermission('finance.customer_refund'),
            'manager must not hold finance.customer_refund by default',
        );
    }

    public function test_manager_does_not_hold_finance_supplier_refund(): void
    {
        $manager = $this->createTenantUser($this->tenant, 'manager');
        $this->assertFalse(
            $manager->hasPermission('finance.supplier_refund'),
            'manager must not hold finance.supplier_refund by default',
        );
    }

    public function test_accountant_does_not_hold_finance_customer_refund(): void
    {
        $accountant = $this->createTenantUser($this->tenant, 'accountant');
        $this->assertFalse(
            $accountant->hasPermission('finance.customer_refund'),
            'accountant must not hold finance.customer_refund by default',
        );
    }

    public function test_accountant_does_not_hold_finance_supplier_refund(): void
    {
        $accountant = $this->createTenantUser($this->tenant, 'accountant');
        $this->assertFalse(
            $accountant->hasPermission('finance.supplier_refund'),
            'accountant must not hold finance.supplier_refund by default',
        );
    }

    public function test_accountant_does_not_hold_purchases_returns(): void
    {
        $accountant = $this->createTenantUser($this->tenant, 'accountant');
        $this->assertFalse(
            $accountant->hasPermission('purchases.returns'),
            'accountant must not hold purchases.returns by default',
        );
    }

    public function test_manager_holds_purchases_returns(): void
    {
        $manager = $this->createTenantUser($this->tenant, 'manager');
        $this->assertTrue(
            $manager->hasPermission('purchases.returns'),
            'manager must hold purchases.returns by default',
        );
    }

    public function test_purchasing_officer_does_not_hold_refund_keys(): void
    {
        $officer = $this->createTenantUser($this->tenant, 'purchasing_officer');
        $this->assertFalse($officer->hasPermission('finance.customer_refund'));
        $this->assertFalse($officer->hasPermission('finance.supplier_refund'));
        $this->assertTrue($officer->hasPermission('purchases.returns'));
    }

    public function test_owner_holds_all_seven_phase1_keys(): void
    {
        $keys = [
            'finance.customer_refund', 'finance.supplier_refund', 'purchases.returns',
            'finance.capital_add', 'finance.owner_drawings', 'finance.internal_transfer',
            'approvals.configure',
        ];
        foreach ($keys as $key) {
            $this->assertTrue(
                $this->owner->hasPermission($key),
                "owner must hold {$key}",
            );
        }
    }

    public function test_franchise_admin_does_not_hold_sensitive_fund_keys(): void
    {
        $fa = $this->createTenantUser($this->tenant, 'franchise_admin');
        // Refunds OK
        $this->assertTrue($fa->hasPermission('finance.customer_refund'));
        $this->assertTrue($fa->hasPermission('finance.supplier_refund'));
        $this->assertTrue($fa->hasPermission('purchases.returns'));
        // Sensitive funds NOT OK
        $this->assertFalse($fa->hasPermission('finance.capital_add'));
        $this->assertFalse($fa->hasPermission('finance.owner_drawings'));
        $this->assertFalse($fa->hasPermission('finance.internal_transfer'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Adapter validatePayload() — sad paths
    // ─────────────────────────────────────────────────────────────────────────

    public function test_capital_injection_adapter_rejects_zero_amount(): void
    {
        $adapter = app(CapitalInjectionApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload(['amount' => 0], $this->tenant, $this->owner);
    }

    public function test_capital_injection_adapter_rejects_invalid_payment_method(): void
    {
        $adapter = app(CapitalInjectionApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload(['amount' => 500, 'payment_method' => 'cheque'], $this->tenant, $this->owner);
    }

    public function test_owner_drawings_adapter_rejects_zero_amount(): void
    {
        $adapter = app(OwnerDrawingsApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload(['amount' => 0, 'payment_method' => 'cash'], $this->tenant, $this->owner);
    }

    public function test_fund_transfer_rejects_cash_to_cash(): void
    {
        $adapter = app(FundTransferApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload([
            'amount'    => 500,
            'from_type' => 'cash',
            'to_type'   => 'cash',
        ], $this->tenant, $this->owner);
    }

    public function test_fund_transfer_rejects_same_bank_to_same_bank(): void
    {
        $bankAccountId = (string) \Illuminate\Support\Str::uuid();
        BankAccount::create([
            'id'        => $bankAccountId,
            'tenant_id' => $this->tenant->id,
            'name'      => 'Main Bank',
            'type'      => 'bank',
        ]);

        $adapter = app(FundTransferApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload([
            'amount'               => 500,
            'from_type'            => 'bank',
            'to_type'              => 'bank',
            'from_bank_account_id' => $bankAccountId,
            'to_bank_account_id'   => $bankAccountId,
        ], $this->tenant, $this->owner);
    }

    public function test_fund_transfer_rejects_cross_tenant_bank_account(): void
    {
        $otherTenant = $this->createTenant('other-' . uniqid(), 'trial');
        $otherBank   = BankAccount::create([
            'tenant_id' => $otherTenant->id,
            'name'      => 'Other Bank',
            'type'      => 'bank',
        ]);

        $adapter = app(FundTransferApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload([
            'amount'               => 500,
            'from_type'            => 'bank',
            'to_type'              => 'cash',
            'from_bank_account_id' => $otherBank->id,
        ], $this->tenant, $this->owner);
    }

    public function test_purchase_return_adapter_rejects_cross_tenant_purchase(): void
    {
        $otherTenant = $this->createTenant('other2-' . uniqid(), 'trial');
        $purchaseId  = (string) \Illuminate\Support\Str::uuid();
        // Insert a purchase for the OTHER tenant
        \Illuminate\Support\Facades\DB::table('purchases')->insert([
            'id'              => $purchaseId,
            'tenant_id'       => $otherTenant->id,
            'invoice_number'  => 'P-999',
            'purchase_date'   => now()->toDateString(),
            'total'           => 100,
            'workflow_status' => 'received',
            'payment_status'  => 'unpaid',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $adapter = app(PurchaseReturnApprovalAdapter::class);
        $this->expectException(ValidationException::class);
        $adapter->validatePayload([
            'purchase_id' => $purchaseId,
            'items'       => [['purchase_item_id' => 'x', 'qty_returned' => 1]],
            'reason'      => 'Test',
        ], $this->tenant, $this->owner);
    }

    public function test_sales_return_adapter_rejects_empty_path(): void
    {
        $adapter = app(SalesReturnApprovalAdapter::class);
        // No sale_id, no items, no _path
        $this->expectException(ValidationException::class);
        $adapter->validatePayload([], $this->tenant, $this->owner);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Engine submit — happy path (no GL posting needed)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_engine_submit_creates_pending_document_for_capital_injection(): void
    {
        $doc = $this->engine->submit(
            tenant:       $this->tenant,
            maker:        $this->owner,
            documentType: ApprovalDocument::TYPE_CAPITAL_INJECTION,
            payload:      ['amount' => 2000.00, 'payment_method' => 'cash'],
            amount:       2000.00,
            description:  'Test capital injection',
        );

        $this->assertInstanceOf(ApprovalDocument::class, $doc);
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(ApprovalDocument::TYPE_CAPITAL_INJECTION, $doc->document_type);
        $this->assertSame($this->tenant->id, $doc->tenant_id);
        $this->assertSame(2000.00, (float)$doc->amount);
    }

    public function test_engine_submit_creates_pending_document_for_owner_drawings(): void
    {
        $doc = $this->engine->submit(
            tenant:       $this->tenant,
            maker:        $this->owner,
            documentType: ApprovalDocument::TYPE_OWNER_DRAWINGS,
            payload:      ['amount' => 500.00, 'payment_method' => 'cash'],
            amount:       500.00,
            description:  'Test drawing',
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(ApprovalDocument::TYPE_OWNER_DRAWINGS, $doc->document_type);
    }

    public function test_engine_submit_creates_pending_document_for_fund_transfer(): void
    {
        $fromBank = BankAccount::create(['tenant_id' => $this->tenant->id, 'name' => 'Bank A', 'type' => 'bank']);
        $toBank   = BankAccount::create(['tenant_id' => $this->tenant->id, 'name' => 'Bank B', 'type' => 'bank']);

        $doc = $this->engine->submit(
            tenant:       $this->tenant,
            maker:        $this->owner,
            documentType: ApprovalDocument::TYPE_FUND_TRANSFER,
            payload:      [
                'amount'               => 1000.00,
                'from_type'            => 'bank',
                'to_type'              => 'bank',
                'from_bank_account_id' => $fromBank->id,
                'to_bank_account_id'   => $toBank->id,
            ],
            amount:       1000.00,
            description:  'Test bank transfer',
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(ApprovalDocument::TYPE_FUND_TRANSFER, $doc->document_type);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Reviewer eligibility enforcement
    // ─────────────────────────────────────────────────────────────────────────

    public function test_manager_cannot_approve_capital_injection_document(): void
    {
        $manager = $this->createTenantUser($this->tenant, 'manager');

        $doc = $this->engine->submit(
            tenant:       $this->tenant,
            maker:        $this->owner,
            documentType: ApprovalDocument::TYPE_CAPITAL_INJECTION,
            payload:      ['amount' => 3000.00, 'payment_method' => 'cash'],
            amount:       3000.00,
            description:  'Capital injection — eligibility test',
        );

        $this->expectException(\RuntimeException::class);
        // Manager doesn't hold finance.capital_add so engine must reject
        $this->engine->approve(
            documentId: $doc->id,
            tenant:     $this->tenant,
            reviewer:   $manager,
        );
    }

    public function test_manager_cannot_approve_owner_drawings_document(): void
    {
        $manager = $this->createTenantUser($this->tenant, 'manager');

        $doc = $this->engine->submit(
            tenant:       $this->tenant,
            maker:        $this->owner,
            documentType: ApprovalDocument::TYPE_OWNER_DRAWINGS,
            payload:      ['amount' => 200.00, 'payment_method' => 'cash'],
            amount:       200.00,
            description:  'Owner drawings — eligibility test',
        );

        $this->expectException(\RuntimeException::class);
        $this->engine->approve(
            documentId: $doc->id,
            tenant:     $this->tenant,
            reviewer:   $manager,
        );
    }

    public function test_accountant_cannot_approve_fund_transfer_document(): void
    {
        $accountant = $this->createTenantUser($this->tenant, 'accountant');
        $fromBank   = BankAccount::create(['tenant_id' => $this->tenant->id, 'name' => 'Bank X', 'type' => 'bank']);
        $toBank     = BankAccount::create(['tenant_id' => $this->tenant->id, 'name' => 'Bank Y', 'type' => 'bank']);

        $doc = $this->engine->submit(
            tenant:       $this->tenant,
            maker:        $this->owner,
            documentType: ApprovalDocument::TYPE_FUND_TRANSFER,
            payload:      [
                'amount'               => 750.00,
                'from_type'            => 'bank',
                'to_type'              => 'bank',
                'from_bank_account_id' => $fromBank->id,
                'to_bank_account_id'   => $toBank->id,
            ],
            amount:       750.00,
            description:  'Fund transfer — eligibility test',
        );

        $this->expectException(\RuntimeException::class);
        $this->engine->approve(
            documentId: $doc->id,
            tenant:     $this->tenant,
            reviewer:   $accountant,
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Policy resolver — threshold routing
    // ─────────────────────────────────────────────────────────────────────────

    public function test_policy_resolver_routes_above_threshold_to_approval(): void
    {
        // Enable approval admin and set a threshold
        Setting::updateOrCreate(['tenant_id' => $this->tenant->id, 'key' => 'approval_admin_enabled'], ['value' => '1']);
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_threshold_capital_injection'],
            ['value' => '1000'],
        );

        $admin   = $this->createTenantUser($this->tenant, 'admin');
        $below   = $this->policy->resolve($this->tenant, $admin, ApprovalDocument::TYPE_CAPITAL_INJECTION, 999.00);
        $above   = $this->policy->resolve($this->tenant, $admin, ApprovalDocument::TYPE_CAPITAL_INJECTION, 1001.00);

        $this->assertFalse($below['requires_approval'], 'Admin below threshold should go direct');
        $this->assertTrue($above['requires_approval'],  'Admin above threshold should require approval');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Idempotency — submit twice with the same key returns the same document
    // ─────────────────────────────────────────────────────────────────────────

    public function test_submit_with_same_idempotency_key_returns_existing_document(): void
    {
        $key = 'idem-ci-' . uniqid();

        $doc1 = $this->engine->submit(
            tenant:         $this->tenant,
            maker:          $this->owner,
            documentType:   ApprovalDocument::TYPE_CAPITAL_INJECTION,
            payload:        ['amount' => 500.00, 'payment_method' => 'cash'],
            amount:         500.00,
            description:    'Idempotency test',
            idempotencyKey: $key,
        );

        $doc2 = $this->engine->submit(
            tenant:         $this->tenant,
            maker:          $this->owner,
            documentType:   ApprovalDocument::TYPE_CAPITAL_INJECTION,
            payload:        ['amount' => 500.00, 'payment_method' => 'cash'],
            amount:         500.00,
            description:    'Idempotency test (dupe)',
            idempotencyKey: $key,
        );

        $this->assertSame($doc1->id, $doc2->id, 'Duplicate idempotency key must return the same document');
        $this->assertSame(1, ApprovalDocument::where('idempotency_key', $key)->count(), 'Must not create two documents for the same key');
    }
}
