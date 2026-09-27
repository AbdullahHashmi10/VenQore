<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\ApprovalPolicyResolver;
use Tests\Feature\VenQoreTestCase;

class StorePolicyPrecedenceTest extends VenQoreTestCase
{
    private ApprovalPolicyResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = app(ApprovalPolicyResolver::class);
    }

    public function test_global_store_disabled_overrides_all_rules(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        // Turn OFF store approval master toggle
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => 'false']
        );

        $res = $this->resolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 50000.00);

        $this->assertFalse($res['requires_approval']);
        $this->assertSame('store_approval_disabled', $res['reason']);
        $this->assertSame('direct', $res['effective_mode']);
    }

    public function test_owner_without_strict_separation_posts_direct(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_strict_owner_separation'],
            ['value' => 'false']
        );

        $res = $this->resolver->resolve($tenant, $owner, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 10000.00);

        $this->assertFalse($res['requires_approval']);
        $this->assertSame('owner_direct_post', $res['reason']);
    }

    public function test_owner_with_strict_separation_follows_threshold_and_role(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_strict_owner_separation'],
            ['value' => 'true']
        );
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '500.00']
        );

        // Under threshold: owner posts direct
        $resUnder = $this->resolver->resolve($tenant, $owner, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 300.00);
        $this->assertFalse($resUnder['requires_approval']);

        // Exceeding threshold: requires approval
        $resOver = $this->resolver->resolve($tenant, $owner, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 750.00);
        $this->assertTrue($resOver['requires_approval']);
        $this->assertSame('amount_threshold_exceeded', $resOver['reason']);
    }

    public function test_per_document_policy_overrides_role_default(): void
    {
        $tenant = $this->createTenant();
        $manager = $this->createTenantUser($tenant, 'manager');
        $this->bindTenantContext($tenant, $manager);

        // Require approval specifically for supplier payments
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_policy_supplier_payment'],
            ['value' => 'required']
        );

        // Customer receipt follows manager direct default
        $resReceipt = $this->resolver->resolve($tenant, $manager, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 100.00);
        $this->assertFalse($resReceipt['requires_approval']);

        // Supplier payment is intercepted due to per-document policy
        $resSupplier = $this->resolver->resolve($tenant, $manager, ApprovalDocument::TYPE_SUPPLIER_PAYMENT, 100.00);
        $this->assertTrue($resSupplier['requires_approval']);
        $this->assertSame('document_policy_required', $resSupplier['reason']);
    }

    public function test_user_mode_override_precedence(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        // Cashier with explicit 'direct' override
        TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $cashier->id)
            ->update(['transaction_approval_mode' => 'direct']);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '1000.00']
        );

        // Under threshold -> direct
        $resDirect = $this->resolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 200.00);
        $this->assertFalse($resDirect['requires_approval']);
        $this->assertSame('user_direct_mode', $resDirect['reason']);

        // Over threshold -> threshold takes over
        $resOver = $this->resolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 1500.00);
        $this->assertTrue($resOver['requires_approval']);
        $this->assertSame('amount_threshold_exceeded', $resOver['reason']);
    }

    public function test_trusted_pos_clearance_precedence(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        // Even with user mode required and low threshold
        TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $cashier->id)
            ->update(['transaction_approval_mode' => 'required']);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '10.00']
        );

        $res = $this->resolver->resolve(
            tenant: $tenant,
            user: $cashier,
            documentType: ApprovalDocument::TYPE_SALES_INVOICE,
            amount: 5000.00,
            isTrustedPos: true
        );

        $this->assertFalse($res['requires_approval']);
        $this->assertSame('trusted_pos_clearance', $res['reason']);
    }

    public function test_per_employee_per_action_override_required_forces_approval(): void
    {
        $tenant = $this->createTenant();
        $manager = $this->createTenantUser($tenant, 'manager');
        $this->bindTenantContext($tenant, $manager);

        // Manager normally posts directly, but has per-action override 'required' for customer_receipt
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => "approval_user_{$manager->id}_" . ApprovalDocument::TYPE_CUSTOMER_RECEIPT],
            ['value' => 'required']
        );

        $resReceipt = $this->resolver->resolve($tenant, $manager, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, 50.00);
        $this->assertTrue($resReceipt['requires_approval']);
        $this->assertSame('user_document_override_required', $resReceipt['reason']);

        // Other documents still use manager direct default
        $resSupplier = $this->resolver->resolve($tenant, $manager, ApprovalDocument::TYPE_SUPPLIER_PAYMENT, 50.00);
        $this->assertFalse($resSupplier['requires_approval']);
        $this->assertSame('role_default_direct', $resSupplier['reason']);
    }

    public function test_per_employee_per_action_override_direct_bypasses_document_and_global_required(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        // Cashier has global required mode AND document policy is required
        TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $cashier->id)
            ->update(['transaction_approval_mode' => 'required']);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_policy_' . ApprovalDocument::TYPE_SALES_INVOICE],
            ['value' => 'required']
        );

        // Explicit per-employee per-action override to 'direct' for sales_invoice
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => "approval_user_{$cashier->id}_" . ApprovalDocument::TYPE_SALES_INVOICE],
            ['value' => 'direct']
        );

        $resInvoice = $this->resolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_SALES_INVOICE, 250.00);
        $this->assertFalse($resInvoice['requires_approval']);
        $this->assertSame('user_document_override_direct', $resInvoice['reason']);
    }

    public function test_per_employee_per_action_override_direct_exceeding_threshold_requires_approval(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '1000.00']
        );

        // Explicit per-employee per-action override to 'direct'
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => "approval_user_{$cashier->id}_" . ApprovalDocument::TYPE_OPERATING_EXPENSE],
            ['value' => 'direct']
        );

        // Under threshold: direct
        $resUnder = $this->resolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_OPERATING_EXPENSE, 500.00);
        $this->assertFalse($resUnder['requires_approval']);
        $this->assertSame('user_document_override_direct', $resUnder['reason']);

        // Over threshold: required by threshold
        $resOver = $this->resolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_OPERATING_EXPENSE, 1500.00);
        $this->assertTrue($resOver['requires_approval']);
        $this->assertSame('amount_threshold_exceeded', $resOver['reason']);
    }

    public function test_admin_can_update_and_retrieve_employee_action_approval_overrides(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $owner);

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $cashier->id)->firstOrFail();

        // 1. Owner updates cashier with action-specific overrides
        $response = $this->actingAs($owner)->patch(
            "/s/{$tenant->slug}/admin/users/{$membership->id}",
            [
                'role'                      => 'cashier',
                'transaction_approval_mode' => 'inherit',
                'approval_overrides'        => [
                    ApprovalDocument::TYPE_CUSTOMER_RECEIPT => 'direct',
                    ApprovalDocument::TYPE_OPERATING_EXPENSE => 'required',
                ],
            ]
        );

        $response->assertSessionHasNoErrors();

        // Verify persisted settings
        $receiptSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_user_{$cashier->id}_" . ApprovalDocument::TYPE_CUSTOMER_RECEIPT)
            ->value('value');
        $expenseSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_user_{$cashier->id}_" . ApprovalDocument::TYPE_OPERATING_EXPENSE)
            ->value('value');

        $this->assertSame('direct', $receiptSetting);
        $this->assertSame('required', $expenseSetting);

        // 2. Clear one override by setting to inherit
        $this->actingAs($owner)->patch(
            "/s/{$tenant->slug}/admin/users/{$membership->id}",
            [
                'role'               => 'cashier',
                'approval_overrides' => [
                    ApprovalDocument::TYPE_CUSTOMER_RECEIPT => 'inherit',
                ],
            ]
        );

        $receiptSettingAfter = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_user_{$cashier->id}_" . ApprovalDocument::TYPE_CUSTOMER_RECEIPT)
            ->first();
        $this->assertNull($receiptSettingAfter);
    }
}
