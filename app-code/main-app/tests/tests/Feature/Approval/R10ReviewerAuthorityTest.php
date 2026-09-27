<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalRevision;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use RuntimeException;
use Tests\Feature\VenQoreTestCase;

class R10ReviewerAuthorityTest extends VenQoreTestCase
{
    public function test_sales_return_requires_both_sales_edit_and_finance_customer_refund_authorities(): void
    {
        $tenant = $this->createTenant('r10-auth-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'cashier');
        $managerOnlySales = $this->createTenantUser($tenant, 'manager');
        $managerFull = $this->createTenantUser($tenant, 'manager');

        // Set permissions explicitly
        $tuSalesOnly = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $managerOnlySales->id)->first();
        $tuSalesOnly->update([
            'permissions' => ['approvals.review', 'approvals.inbox', 'sales.edit'],
            'permission_override_mode' => 'custom',
        ]);

        $tuFull = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $managerFull->id)->first();
        $tuFull->update([
            'permissions' => ['approvals.review', 'approvals.inbox', 'sales.edit', 'finance.customer_refund'],
            'permission_override_mode' => 'custom',
        ]);

        // Create a pending sales return approval document
        $engine = app(ApprovalExecutionEngine::class);

        // Check getEligibleDocumentTypes
        $eligibleSalesOnly = $engine->getEligibleDocumentTypes($tenant, $managerOnlySales);
        $this->assertNotContains(
            ApprovalDocument::TYPE_SALES_RETURN,
            $eligibleSalesOnly,
            'Reviewer holding only sales.edit must NOT be eligible for sales_return documents'
        );

        $eligibleFull = $engine->getEligibleDocumentTypes($tenant, $managerFull);
        $this->assertContains(
            ApprovalDocument::TYPE_SALES_RETURN,
            $eligibleFull,
            'Reviewer holding both sales.edit and finance.customer_refund MUST be eligible for sales_return documents'
        );
    }
}
