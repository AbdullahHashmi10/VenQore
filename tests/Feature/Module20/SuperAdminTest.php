<?php

namespace Tests\Feature\Module20;

use Tests\Feature\VenQoreTestCase;

/**
 * Module 20 — SuperAdmin Panel (post-launch feature)
 * Platform-level administration: tenant management, plan upgrades,
 * suspension/reactivation, and global metrics.
 * Cross-tenant admin flows are tested at the unit level in console command
 * tests (CleanupDeadAccounts, ProcessExpiredTrials). HTTP SuperAdmin panel
 * tests are stubbed here pending front-end integration.
 */
test('super_admin_can_list_all_tenants', function () {
    // TODO: SuperAdmin panel — post-launch feature
})->todo();

test('super_admin_can_suspend_tenant', function () {
    // TODO: SuperAdmin panel — post-launch feature
})->todo();

test('super_admin_can_upgrade_tenant_plan', function () {
    // TODO: SuperAdmin panel — post-launch feature
})->todo();

test('non_admin_cannot_access_platform_dashboard', function () {
    // TODO: SuperAdmin panel — authorization guard
})->todo();
