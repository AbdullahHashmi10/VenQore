<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalRevision;
use App\Models\ApprovalReturnReason;
use App\Models\ApprovalTransition;
use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\ApprovalPolicyResolver;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * ApprovalPolicyMatrixIntegrationTest
 *
 * Full matrix integration tests covering all store-level and employee-level approval policy
 * scenarios required by Doc 17 Step 5 across all 4 release document types.
 */
class ApprovalPolicyMatrixIntegrationTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private User $manager;
    private User $cashier;
    private User $accountant;
    private Party $customer;
    private Party $supplier;
    private ExpenseCategory $expenseCategory;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('matrix-test-' . uniqid(), 'ltd_3');
        $this->tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($this->tenant);
        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->manager = $this->createTenantUser($this->tenant, 'manager');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->accountant = $this->createTenantUser($this->tenant, 'accountant');

        $this->customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Matrix Customer',
            'type'      => 'customer',
        ]);

        $this->supplier = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Matrix Supplier',
            'type'      => 'supplier',
        ]);

        $this->expenseCategory = ExpenseCategory::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Office Supplies',
        ]);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $this->product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Matrix Test Item',
            'sku'         => 'MAT-01',
            'price'       => 150.00,
            'cost_price'  => 80.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'standard',
        ]);
    }

    /**
     * 1. Store approval disabled permits direct posting only when the employee has the normal transaction permission.
     */
    public function test_store_approval_disabled_permits_direct_posting_with_permission(): void
    {
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => 'false']
        );

        $this->actingAsTenantUserModel($this->accountant, $this->tenant);

        $response = $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'expense_category_id' => $this->expenseCategory->id,
            'amount'              => 120.00,
            'payment_method'      => 'cash',
            'date'                => now()->toDateString(),
            'notes'               => 'Store approval disabled expense',
        ]);

        $response->assertSuccessful();
        $this->assertDatabaseHas('expenses', [
            'tenant_id' => $this->tenant->id,
            'amount'    => 120.00,
        ]);
    }

    /**
     * 2. Employee mode 'direct' cannot bypass the normal transaction permission.
     */
    public function test_employee_mode_direct_cannot_bypass_underlying_permission(): void
    {
        // Viewer has no expenses.create permission
        $viewer = $this->createTenantUser($this->tenant, 'viewer');
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $viewer->id)
            ->update(['transaction_approval_mode' => 'direct']);

        $this->actingAsTenantUserModel($viewer, $this->tenant);

        $response = $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'expense_category_id' => $this->expenseCategory->id,
            'amount'              => 50.00,
            'payment_method'      => 'cash',
            'date'                => now()->toDateString(),
        ]);

        $response->assertStatus(403);
    }

    /**
     * 3. Employee mode 'required' creates a pending document and leaves financial tables untouched.
     */
    public function test_employee_mode_required_creates_pending_document_and_leaves_financials_untouched(): void
    {
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->accountant->id)
            ->update(['transaction_approval_mode' => 'required']);

        $this->actingAsTenantUserModel($this->accountant, $this->tenant);

        $initialJournalCount = JournalEntry::where('tenant_id', $this->tenant->id)->count();
        $initialExpenseCount = Expense::where('tenant_id', $this->tenant->id)->count();

        $response = $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'expense_category_id' => $this->expenseCategory->id,
            'amount'              => 340.00,
            'payment_method'      => 'cash',
            'date'                => now()->toDateString(),
            'notes'               => 'Pending approval expense',
        ]);

        $response->assertStatus(202);

        // Financial tables untouched
        $this->assertEquals($initialJournalCount, JournalEntry::where('tenant_id', $this->tenant->id)->count());
        $this->assertEquals($initialExpenseCount, Expense::where('tenant_id', $this->tenant->id)->count());

        // Pending approval document created
        $this->assertDatabaseHas('approval_documents', [
            'tenant_id'     => $this->tenant->id,
            'maker_id'      => $this->accountant->id,
            'document_type' => ApprovalDocument::TYPE_OPERATING_EXPENSE,
            'status'        => ApprovalDocument::STATUS_PENDING,
            'amount'        => 340.00,
        ]);
    }

    /**
     * 4. Employee mode 'inherit' follows the current store policy.
     */
    public function test_employee_mode_inherit_follows_current_store_policy(): void
    {
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->manager->id)
            ->update(['transaction_approval_mode' => 'inherit']);

        $resolver = app(ApprovalPolicyResolver::class);

        // Under default store settings (manager role defaults to direct)
        $resDefault = $resolver->resolve($this->tenant, $this->manager, ApprovalDocument::TYPE_OPERATING_EXPENSE, 100.00);
        $this->assertFalse($resDefault['requires_approval']);

        // Set store policy to require approval for operating expenses
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_policy_operating_expense'],
            ['value' => 'required']
        );

        $resOverridden = $resolver->resolve($this->tenant, $this->manager, ApprovalDocument::TYPE_OPERATING_EXPENSE, 100.00);
        $this->assertTrue($resOverridden['requires_approval']);
        $this->assertSame('document_policy_required', $resOverridden['reason']);
    }

    /**
     * 5. Amount/document policy can still force approval where designed.
     */
    public function test_amount_threshold_forces_approval_even_for_direct_mode(): void
    {
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->cashier->id)
            ->update(['transaction_approval_mode' => 'direct']);

        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '500.00']
        );

        $resolver = app(ApprovalPolicyResolver::class);

        // $400 is under threshold -> direct
        $resUnder = $resolver->resolve($this->tenant, $this->cashier, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 400.00);
        $this->assertFalse($resUnder['requires_approval']);

        // $600 exceeds threshold -> forced approval
        $resOver = $resolver->resolve($this->tenant, $this->cashier, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 600.00);
        $this->assertTrue($resOver['requires_approval']);
        $this->assertSame('amount_threshold_exceeded', $resOver['reason']);
    }

    /**
     * 6 & 7. Changing an employee or store setting affects future submissions only;
     * existing pending documents remain pending after settings change and never auto-post.
     */
    public function test_settings_mutations_affect_future_only_and_existing_pending_remain_untouched(): void
    {
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->accountant->id)
            ->update(['transaction_approval_mode' => 'required']);

        $this->actingAsTenantUserModel($this->accountant, $this->tenant);

        // Submit expense under 'required' setting
        $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'expense_category_id' => $this->expenseCategory->id,
            'amount'              => 800.00,
            'payment_method'      => 'cash',
            'date'                => now()->toDateString(),
        ]);

        $pendingDoc = ApprovalDocument::where('tenant_id', $this->tenant->id)
            ->where('maker_id', $this->accountant->id)
            ->where('status', ApprovalDocument::STATUS_PENDING)
            ->latest('id')
            ->firstOrFail();

        // Mutate store settings to disable approval completely
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => 'false']
        );

        // Mutate accountant mode to 'direct'
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->accountant->id)
            ->update(['transaction_approval_mode' => 'direct']);

        // 1. Existing document MUST REMAIN PENDING and financial tables remain untouched
        $pendingDoc->refresh();
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $pendingDoc->status);
        $this->assertDatabaseMissing('expenses', ['amount' => 800.00]);

        // 2. Future submissions now post directly
        $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'expense_category_id' => $this->expenseCategory->id,
            'amount'              => 150.00,
            'payment_method'      => 'cash',
            'date'                => now()->toDateString(),
        ]);

        $this->assertDatabaseHas('expenses', [
            'tenant_id' => $this->tenant->id,
            'amount'    => 150.00,
        ]);
    }

    /**
     * 8 & 9. Employees cannot change their own approval mode; setting change records actor and timestamp.
     */
    public function test_employees_cannot_change_own_approval_mode_and_owner_change_is_audited(): void
    {
        $cashierMembership = TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->cashier->id)
            ->firstOrFail();

        // 1. Cashier attempts to change their own approval mode -> 403
        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
        $resSelf = $this->patchJson("/s/{$this->tenant->slug}/admin/users/{$cashierMembership->id}", [
            'transaction_approval_mode' => 'direct',
        ]);
        $resSelf->assertStatus(403);

        // 2. Owner changes cashier's approval mode -> Succeeds & records actor + timestamp
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        $resOwner = $this->patchJson("/s/{$this->tenant->slug}/admin/users/{$cashierMembership->id}", [
            'transaction_approval_mode' => 'required',
        ]);
        $resOwner->assertRedirect();

        $cashierMembership->refresh();
        $this->assertSame('required', $cashierMembership->transaction_approval_mode);
        $this->assertSame($this->owner->id, (int) $cashierMembership->approval_mode_changed_by);
        $this->assertNotNull($cashierMembership->approval_mode_changed_at);
    }

    /**
     * 10 & 11. Owner direct posting is the default; strict owner separation works when enabled.
     */
    public function test_owner_direct_posting_and_strict_separation_toggle(): void
    {
        $resolver = app(ApprovalPolicyResolver::class);

        // Default: owner posts direct
        $resDefault = $resolver->resolve($this->tenant, $this->owner, ApprovalDocument::TYPE_OPERATING_EXPENSE, 5000.00);
        $this->assertFalse($resDefault['requires_approval']);
        $this->assertSame('owner_direct_post', $resDefault['reason']);

        // Enable strict owner separation + $1,000 threshold
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_strict_owner_separation'],
            ['value' => 'true']
        );
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '1000.00']
        );

        $resOver = $resolver->resolve($this->tenant, $this->owner, ApprovalDocument::TYPE_OPERATING_EXPENSE, 5000.00);
        $this->assertTrue($resOver['requires_approval']);
        $this->assertSame('amount_threshold_exceeded', $resOver['reason']);
    }

    /**
     * 12. POS checkout follows its separately documented immediate-post policy.
     */
    public function test_pos_checkout_follows_immediate_post_policy(): void
    {
        $register = \App\Models\Register::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Main Counter Till',
            'status'    => 'active',
        ]);

        $shift = \App\Models\RegisterShift::create([
            'tenant_id'       => $this->tenant->id,
            'register_id'     => $register->id,
            'opened_by'       => $this->cashier->id,
            'opening_balance' => 500.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        // Even if cashier has 'required' mode and low threshold is active
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->cashier->id)
            ->update(['transaction_approval_mode' => 'required']);

        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '10.00']
        );

        $this->actingAsTenantUserModel($this->cashier, $this->tenant);

        // POS checkout call
        $response = $this->postJson("/s/{$this->tenant->slug}/pos/sales", [
            'register_id'    => $register->id,
            'payment_method' => 'cash',
            'paid_amount'    => 150.00,
            'total'          => 150.00,
            'items'          => [
                ['product_id' => $this->product->id, 'quantity' => 1, 'unit_price' => 150.00],
            ],
        ]);

        $response->assertStatus(201);

        // Verified directly posted in sales table and zero pending approval document
        $this->assertDatabaseHas('sales', [
            'tenant_id'         => $this->tenant->id,
            'register_shift_id' => $shift->id,
            'status'            => 'posted',
        ]);
        $this->assertSame(0, ApprovalDocument::where('tenant_id', $this->tenant->id)->count());
    }
}
