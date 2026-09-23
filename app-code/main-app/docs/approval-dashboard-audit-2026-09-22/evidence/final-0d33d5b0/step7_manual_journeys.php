<?php
// docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/step7_manual_journeys.php

require_once __DIR__ . '/../../../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../../../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Force current test database
config(['database.connections.mysql.database' => 'amd_pos_test_current_0d33d5b0']);
\Illuminate\Support\Facades\DB::purge('mysql');
\Illuminate\Support\Facades\DB::reconnect('mysql');

use App\Models\ApprovalDocument;
use App\Models\ApprovalPolicy;
use App\Models\ApprovalReturnReason;
use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\ApprovalCorrectionResolver;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalStateMachine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$evidenceDir = __DIR__;
$journeyResults = [];

echo "=== EXECUTING STEP 7: FOUR REAL CORRECTION JOURNEYS ===\n";
echo "Active DB: " . DB::connection()->getDatabaseName() . "\n";

// 1. Setup 2 Tenants and Users
$tenantA = Tenant::create([
    'name' => 'Store Alpha Journeys',
    'slug' => 'store-alpha-' . uniqid(),
    'status' => 'active',
    'plan' => 'trial',
]);
$tenantB = Tenant::create([
    'name' => 'Store Beta Journeys',
    'slug' => 'store-beta-' . uniqid(),
    'status' => 'active',
    'plan' => 'trial',
]);

\Database\Seeders\TenantDefaultSeeder::seedFor($tenantA);
\Database\Seeders\TenantDefaultSeeder::seedFor($tenantB);
ApprovalReturnReason::seedDefaultReasons($tenantA->id);
ApprovalReturnReason::seedDefaultReasons($tenantB->id);

// Employee 1 (Maker in Tenant A)
$makerUser = User::create([
    'name' => 'Maker Employee Alice',
    'email' => 'alice.' . uniqid() . '@example.com',
    'password' => bcrypt('password'),
    'is_platform_admin' => false,
]);
TenantUser::create([
    'tenant_id' => $tenantA->id,
    'user_id' => $makerUser->id,
    'role' => 'cashier',
    'status' => 'active',
    'permission_override_mode' => 'custom',
    'permissions' => ['pos.checkout', 'sales.create', 'expenses.create', 'payments.create', 'purchases.create'],
]);

// Employee 2 (Maker 2 / Intruder in Tenant A)
$otherUser = User::create([
    'name' => 'Other Employee Bob',
    'email' => 'bob.' . uniqid() . '@example.com',
    'password' => bcrypt('password'),
    'is_platform_admin' => false,
]);
TenantUser::create([
    'tenant_id' => $tenantA->id,
    'user_id' => $otherUser->id,
    'role' => 'cashier',
    'status' => 'active',
    'permission_override_mode' => 'custom',
    'permissions' => ['pos.checkout', 'sales.create', 'expenses.create', 'payments.create'],
]);

// Approver (Manager / Reviewer in Tenant A)
$approverUser = User::create([
    'name' => 'Approver Manager Carol',
    'email' => 'carol.' . uniqid() . '@example.com',
    'password' => bcrypt('password'),
    'is_platform_admin' => false,
]);
TenantUser::create([
    'tenant_id' => $tenantA->id,
    'user_id' => $approverUser->id,
    'role' => 'manager',
    'status' => 'active',
    'permission_override_mode' => 'custom',
    'permissions' => ['approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.inbox'],
]);

// User in Tenant B (Cross-tenant Intruder)
$tenantBUser = User::create([
    'name' => 'Tenant B User Dave',
    'email' => 'dave.' . uniqid() . '@example.com',
    'password' => bcrypt('password'),
    'is_platform_admin' => false,
]);
TenantUser::create([
    'tenant_id' => $tenantB->id,
    'user_id' => $tenantBUser->id,
    'role' => 'manager',
    'status' => 'active',
    'permission_override_mode' => 'custom',
    'permissions' => ['approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.inbox'],
]);

// Shared Bank Account, Category, Customer, Supplier, Product
$bankAccount = BankAccount::create([
    'tenant_id' => $tenantA->id,
    'name' => 'Main Operating Bank',
    'account_type' => 'bank',
    'account_number' => 'ACC-12345',
    'balance' => 50000.00,
]);
$customer = Party::create([
    'tenant_id' => $tenantA->id,
    'name' => 'Acme Customer Corp',
    'type' => 'customer',
]);
$supplier = Party::create([
    'tenant_id' => $tenantA->id,
    'name' => 'Apex Supplies Ltd',
    'type' => 'supplier',
]);
$category = ExpenseCategory::create([
    'tenant_id' => $tenantA->id,
    'name' => 'Utilities & Rent',
]);
$product = Product::create([
    'tenant_id' => $tenantA->id,
    'name' => 'Enterprise Widget',
    'sku' => 'WIDGET-' . uniqid(),
    'price' => 200.00,
    'cost_price' => 100.00,
    'stock_quantity' => 100,
]);

$stateMachine = app(ApprovalStateMachine::class);
$executionEngine = app(ApprovalExecutionEngine::class);

$docTypes = [
    'customer_receipt' => [
        'title' => 'Customer Receipt Journey',
        'expected_type' => 'customer_receipt',
        'initial_payload' => [
            'type' => 'in',
            'party_id' => $customer->id,
            'customer_id' => $customer->id,
            'amount' => 450.00,
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
            'reference' => 'REC-INIT-001',
            'notes' => 'Customer payment on account',
            'allocations' => [],
        ],
        'corrected_payload' => [
            'type' => 'in',
            'party_id' => $customer->id,
            'customer_id' => $customer->id,
            'amount' => 500.00,
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
            'reference' => 'REC-CORR-001',
            'notes' => 'Customer payment corrected to 500',
            'allocations' => [],
        ],
    ],
    'supplier_payment' => [
        'title' => 'Supplier Payment Journey',
        'expected_type' => 'supplier_payment',
        'initial_payload' => [
            'type' => 'out',
            'party_id' => $supplier->id,
            'supplier_id' => $supplier->id,
            'amount' => 800.00,
            'payment_method' => 'cash',
            'reference' => 'SUP-INIT-001',
            'notes' => 'Initial supplier payment',
            'allocations' => [],
        ],
        'corrected_payload' => [
            'type' => 'out',
            'party_id' => $supplier->id,
            'supplier_id' => $supplier->id,
            'amount' => 850.00,
            'payment_method' => 'cash',
            'reference' => 'SUP-CORR-001',
            'notes' => 'Corrected supplier payment to 850',
            'allocations' => [],
        ],
    ],
    'operating_expense' => [
        'title' => 'Operating Expense Journey',
        'expected_type' => 'operating_expense',
        'initial_payload' => [
            'expense_category_id' => $category->id,
            'category_id' => $category->id,
            'payee' => 'Electric Utility Co',
            'party_id' => null,
            'amount' => 350.00,
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
            'description' => 'Office electric bill initial',
        ],
        'corrected_payload' => [
            'expense_category_id' => $category->id,
            'category_id' => $category->id,
            'payee' => 'Electric Utility Co',
            'party_id' => null,
            'amount' => 400.00,
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
            'description' => 'Office electric bill corrected',
        ],
    ],
    'sales_invoice' => [
        'title' => 'Sales Invoice Journey',
        'expected_type' => 'sales_invoice',
        'initial_payload' => [
            'customer_id' => $customer->id,
            'payment_method' => 'credit',
            'notes' => 'Bulk sales order invoice',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5, 'unit_price' => 200.00, 'total' => 1000.00]
            ],
            'subtotal' => 1000.00,
            'total' => 1000.00,
        ],
        'corrected_payload' => [
            'customer_id' => $customer->id,
            'payment_method' => 'credit',
            'notes' => 'Bulk sales order invoice corrected to 6 units',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 6, 'unit_price' => 200.00, 'total' => 1200.00]
            ],
            'subtotal' => 1200.00,
            'total' => 1200.00,
        ],
    ],
];

foreach ($docTypes as $key => $journey) {
    echo "\nTesting Journey: {$journey['title']}...\n";
    $jLog = [];

    // Step 1: Create pending document without touching financial tables
    $journalCountBefore = JournalEntry::where('tenant_id', $tenantA->id)->count();
    $paymentCountBefore = Payment::where('tenant_id', $tenantA->id)->count();
    $expenseCountBefore = Expense::where('tenant_id', $tenantA->id)->count();
    $saleCountBefore = Sale::where('tenant_id', $tenantA->id)->count();

    $initialAmount = (float)($journey['initial_payload']['amount'] ?? $journey['initial_payload']['total'] ?? 0.0);
    $correctedAmount = (float)($journey['corrected_payload']['amount'] ?? $journey['corrected_payload']['total'] ?? 0.0);

    $doc = $executionEngine->submit(
        tenant: $tenantA,
        maker: $makerUser,
        documentType: $journey['expected_type'],
        payload: $journey['initial_payload'],
        amount: $initialAmount,
        description: "Test Submission {$key}"
    );

    $journalCountAfterPending = JournalEntry::where('tenant_id', $tenantA->id)->count();
    $financialZeroFootprint = ($journalCountBefore === $journalCountAfterPending);
    $jLog['1_pending_zero_financial_footprint'] = $financialZeroFootprint ? 'PASS' : 'FAIL';

    // Step 2: Approver returns it with reason and notes
    $returnedDoc = $executionEngine->returnDocument(
        documentId: $doc->id,
        tenant: $tenantA,
        reviewer: $approverUser,
        reasonCodes: ['INCORRECT_AMOUNT'],
        notes: 'Please verify invoice numbers and total calculation'
    );
    $jLog['2_approver_return_with_reason'] = ($returnedDoc->status === ApprovalDocument::STATUS_RETURNED) ? 'PASS' : 'FAIL';
    $jLog['2_return_reason'] = $returnedDoc->transitions()->latest('id')->first()?->reason_codes;

    // Step 3: Access control checks on real editor resolution
    $correctionResolver = app(ApprovalCorrectionResolver::class);
    app()->instance('current.tenant', $tenantA);
    auth()->login($otherUser);
    $otherReq = new Request(['edit_approval' => $doc->id]);
    $otherAttemptBlocked = false;
    try {
        $correctionResolver->resolveForEdit($otherReq, $journey['expected_type']);
    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        $otherAttemptBlocked = ($e->getStatusCode() === 403);
    } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
        $otherAttemptBlocked = ($e->getResponse()->getStatusCode() === 403);
    }
    $jLog['3_other_maker_blocked'] = $otherAttemptBlocked ? 'PASS' : 'FAIL';

    // Cross-tenant user access attempt
    app()->instance('current.tenant', $tenantB);
    auth()->login($tenantBUser);
    $crossTenantReq = new Request(['edit_approval' => $doc->id]);
    $crossTenantBlocked = false;
    try {
        $correctionResolver->resolveForEdit($crossTenantReq, $journey['expected_type']);
    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        $crossTenantBlocked = in_array($e->getStatusCode(), [403, 404]);
    } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
        $crossTenantBlocked = in_array($e->getResponse()->getStatusCode(), [403, 404]);
    }
    $jLog['3_cross_tenant_blocked'] = $crossTenantBlocked ? 'PASS' : 'FAIL';

    // Original maker access in same tenant
    app()->instance('current.tenant', $tenantA);
    auth()->login($makerUser);
    $makerReq = new Request(['edit_approval' => $doc->id]);
    $resolvedData = $correctionResolver->resolveForEdit($makerReq, $journey['expected_type']);
    $jLog['3_original_maker_allowed'] = ($resolvedData !== null && $resolvedData['document_id'] === $doc->id) ? 'PASS' : 'FAIL';
    $jLog['4_editor_prefilled_payload'] = !empty($resolvedData['payload']) ? 'PASS' : 'FAIL';
    $jLog['4_editor_reviewer_notes'] = ($resolvedData['return_notes'] === 'Please verify invoice numbers and total calculation') ? 'PASS' : 'FAIL';
    $jLog['4_editor_resubmit_url'] = !empty($resolvedData['resubmit_url']) ? 'PASS' : 'FAIL';

    // Step 5: Stale expected_version rejection
    $staleRejected = false;
    try {
        $stateMachine->resubmit(
            document: $doc->fresh(),
            maker: $makerUser,
            updatedPayload: $journey['corrected_payload'],
            updatedAmount: $correctedAmount,
            makerNotes: 'Stale attempt',
            expectedVersion: 999 // Stale
        );
    } catch (\Throwable $e) {
        $staleRejected = true;
    }
    $jLog['5_stale_version_rejected'] = $staleRejected ? 'PASS' : 'FAIL';

    // Step 6: Proper resubmission creates immutable new revision
    $resubmittedDoc = $stateMachine->resubmit(
        document: $doc->fresh(),
        maker: $makerUser,
        updatedPayload: $journey['corrected_payload'],
        updatedAmount: $correctedAmount,
        makerNotes: 'Resubmitted corrected payload',
        expectedVersion: $doc->fresh()->version
    );
    $revCount = $resubmittedDoc->revisions()->count();
    $jLog['6_resubmission_increments_version'] = ($resubmittedDoc->version === 3 && $revCount === 2) ? 'PASS' : 'FAIL';

    // Step 7: Approval posts exactly once
    auth()->login($approverUser);
    $execResult = $executionEngine->approve(
        documentId: $resubmittedDoc->id,
        tenant: $tenantA,
        reviewer: $approverUser,
        expectedVersion: $resubmittedDoc->fresh()->version,
        reviewerNotes: 'Approved after correction'
    );
    $journalCountAfterApproval = JournalEntry::where('tenant_id', $tenantA->id)->count();
    $postedExactlyOnce = ($journalCountAfterApproval === $journalCountBefore + 1);
    $jLog['7_approved_posts_exactly_once'] = $postedExactlyOnce ? 'PASS' : 'FAIL';

    // Step 8: Retrying approval does not post twice
    $retryBlocked = false;
    try {
        $executionEngine->approve(
            documentId: $resubmittedDoc->id,
            tenant: $tenantA,
            reviewer: $approverUser,
            expectedVersion: $resubmittedDoc->fresh()->version,
            reviewerNotes: 'Duplicate approval attempt'
        );
    } catch (\Throwable $e) {
        $retryBlocked = true;
    }
    $journalCountAfterRetry = JournalEntry::where('tenant_id', $tenantA->id)->count();
    $jLog['8_retry_approval_no_double_post'] = ($retryBlocked && $journalCountAfterRetry === $journalCountAfterApproval) ? 'PASS' : 'FAIL';

    // Step 9: Rejection never posts
    $docForReject = $executionEngine->submit(
        tenant: $tenantA,
        maker: $makerUser,
        documentType: $journey['expected_type'],
        payload: $journey['initial_payload'],
        amount: 100.0,
        description: "Test Reject {$key}"
    );
    $journalCountBeforeReject = JournalEntry::where('tenant_id', $tenantA->id)->count();
    $rejectedDoc = $executionEngine->reject(
        documentId: $docForReject->id,
        tenant: $tenantA,
        reviewer: $approverUser,
        reason: 'Permanent rejection test',
        expectedVersion: $docForReject->fresh()->version
    );
    $journalCountAfterReject = JournalEntry::where('tenant_id', $tenantA->id)->count();
    $jLog['9_rejection_never_posts'] = ($rejectedDoc->status === ApprovalDocument::STATUS_REJECTED && $journalCountBeforeReject === $journalCountAfterReject) ? 'PASS' : 'FAIL';

    echo "  Summary for {$journey['title']}: " . json_encode($jLog) . "\n";
    $journeyResults[$key] = $jLog;
}

// Check Platform Admin Exception in ApprovalCorrectionResolver
$jLogAdminPolicy = [
    'policy_status' => 'Platform admins bypass maker check by design in ApprovalCorrectionResolver (is_platform_admin == true) for platform-wide troubleshooting/support oversight, but ordinary makers are strictly tenant and user-isolated.',
];

$output = [
    'generated_at' => date('c'),
    'database' => 'amd_pos_test_current_0d33d5b0',
    'tenant_a' => $tenantA->slug,
    'tenant_b' => $tenantB->slug,
    'maker_user' => $makerUser->id,
    'other_user' => $otherUser->id,
    'approver_user' => $approverUser->id,
    'platform_admin_policy_note' => $jLogAdminPolicy,
    'journeys' => $journeyResults,
];

file_put_contents($evidenceDir . '/step7_manual_journeys_evidence.json', json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\nSaved Step 7 journey evidence: {$evidenceDir}/step7_manual_journeys_evidence.json\n";
