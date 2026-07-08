<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Models\Account;
use App\Models\CouponRedemption;
use App\Models\Party;
use App\Models\PlanChangeNotification;
use App\Models\Product;
use App\Models\StaffInvitation;
use App\Models\Warehouse;
use Tests\Feature\VenQoreTestCase;

/**
 * TenantIsolationSweepGuardTest — cross-tenant leak sweep over core models.
 *
 * Global tenant scoping (App\Traits\HasTenant) is the wall that keeps one
 * store's data invisible to another. A single model missing the trait, or a
 * query using withoutGlobalScope() carelessly, punches a hole in that wall
 * that no happy-path test would ever notice.
 *
 * This provisions TWO real tenants via the same code path store creation uses
 * (seedTenantDefaults), plus a customer and a product each, then asserts — for
 * every core tenant-scoped model — that Tenant A's rows are completely
 * invisible while Tenant B's context is bound. Uses the existing
 * assertNoCrossTenantLeak helper.
 *
 * ── Intentionally-unscoped models (P2-2 audit — do NOT add HasTenant) ────────
 *
 * WooConnection:
 *   - WooSyncScheduler queries all tenants' connections (global sweep).
 *   - Queue jobs (InitialImportJob, ProcessSyncQueueJob, etc.) look up by PK
 *     after the job is dispatched with a connectionId — no bound tenant.
 *   - Webhook/handshake lookups use UUID/setup_token (globally unique).
 *   - All per-tenant controller queries already use where('tenant_id', ...).
 *   - VERDICT: leave unscoped; all controller paths are already explicit.
 *
 * StaffInvitation:
 *   - Invitation acceptance flows look up by token/short_code (globally unique
 *     random strings). The invitee has no bound tenant context at accept time.
 *   - HubController lists pending invites by invitee_email across tenants.
 *   - All admin list queries already use where('tenant_id', ...).
 *   - VERDICT: leave unscoped; token-lookup paths must remain tenant-agnostic.
 *
 * CouponRedemption:
 *   - AdminDashboardController iterates all tenants' redemptions in a loop and
 *     passes tenant_id explicitly on each iteration.
 *   - VERDICT: leave unscoped; explicit tenant filter on every read site.
 *
 * PkVerification:
 *   - SuperAdminController displays all verifications across tenants for
 *     platform admin review (::where('status', ...) without tenant filter).
 *   - VERDICT: leave unscoped; platform-admin model by design.
 *
 * TenantPlanOverride:
 *   - SuperAdminController counts and lists all overrides globally (platform
 *     admin view). PlanRepository always supplies tenant_id explicitly.
 *   - VERDICT: leave unscoped; platform-admin model by design.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class TenantIsolationSweepGuardTest extends VenQoreTestCase
{
    public function test_core_models_do_not_leak_across_tenants(): void
    {
        // Tenant A — fully provisioned + a customer and a product.
        $tenantA = $this->createTenant('iso-a', 'ltd_3', 'active');
        $this->seedTenantDefaults($tenantA);
        app()->instance('current.tenant', $tenantA);
        Party::create(['name' => 'A Customer', 'type' => 'customer', 'tenant_id' => $tenantA->id]);
        Product::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'A Widget', 'sku' => 'A-1']);

        // Tenant B — fully provisioned + its own customer and product.
        $tenantB = $this->createTenant('iso-b', 'ltd_3', 'active');
        $this->seedTenantDefaults($tenantB);
        app()->instance('current.tenant', $tenantB);
        Party::create(['name' => 'B Customer', 'type' => 'customer', 'tenant_id' => $tenantB->id]);
        Product::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'B Widget', 'sku' => 'B-1']);

        // Restore A as the active context for the assertions' baseline.
        app()->instance('current.tenant', $tenantA);

        $models = [
            Account::class,
            Warehouse::class,
            Party::class,
            Product::class,
        ];

        foreach ($models as $model) {
            // A's rows must be invisible from B's context, and vice-versa.
            $this->assertNoCrossTenantLeak($model, $tenantA, $tenantB);
            $this->assertNoCrossTenantLeak($model, $tenantB, $tenantA);
        }
    }

    /**
     * PlanChangeNotification now carries HasTenant — verify it isolates.
     * (P2-2: was missing the trait; added 2026-07-08)
     */
    public function test_plan_change_notifications_do_not_leak_across_tenants(): void
    {
        $tenantA = $this->createTenant('notif-iso-a', 'ltd_3', 'active');
        $tenantB = $this->createTenant('notif-iso-b', 'ltd_3', 'active');

        app()->instance('current.tenant', $tenantA);
        PlanChangeNotification::create([
            'tenant_id' => $tenantA->id,
            'type'      => 'upgrade',
            'title'     => 'Plan Upgraded',
            'message'   => 'You are now on Growth.',
        ]);

        // Switch to Tenant B — Tenant A's notification must be invisible.
        app()->instance('current.tenant', $tenantB);
        $this->assertEquals(
            0,
            PlanChangeNotification::count(),
            'PlanChangeNotification LEAKED: Tenant B can see Tenant A\'s plan notifications.'
        );
    }

    /**
     * StaffInvitation — list queries must be tenant-isolated even though
     * the model has no HasTenant (token lookups are intentionally global).
     *
     * This test asserts that the explicit where('tenant_id', ...) pattern
     * used in all admin list controllers correctly filters invitations.
     */
    public function test_staff_invitations_list_is_isolated_per_tenant(): void
    {
        $tenantA = $this->createTenant('invite-iso-a', 'ltd_3', 'active');
        $tenantB = $this->createTenant('invite-iso-b', 'ltd_3', 'active');

        $ownerA = $this->createTenantUser($tenantA, 'owner');
        app()->instance('current.tenant', $tenantA);
        StaffInvitation::create([
            'tenant_id'      => $tenantA->id,
            'invited_by'     => $ownerA->id,
            'invitee_name'   => 'Alice A',
            'invitee_email'  => 'alice@a.com',
            'roles'          => ['cashier'],
            'token'          => \Illuminate\Support\Str::random(64),
            'short_code'     => 'VQ-AATEST',
            'status'         => 'pending',
            'expires_at'     => now()->addDays(7),
        ]);

        // Tenant B's list query (explicit tenant_id) must NOT include A's invite.
        $bInvites = StaffInvitation::where('tenant_id', $tenantB->id)->get();
        $this->assertCount(0, $bInvites, 'StaffInvitation LEAKED: Tenant B can see Tenant A\'s invitations via list query.');

        // Token lookup must still work globally (invitation acceptance).
        $found = StaffInvitation::where('short_code', 'VQ-AATEST')->first();
        $this->assertNotNull($found, 'Token-based StaffInvitation lookup must remain globally accessible.');
    }
}
