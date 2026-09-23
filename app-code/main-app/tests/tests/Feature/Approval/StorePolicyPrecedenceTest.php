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
}
