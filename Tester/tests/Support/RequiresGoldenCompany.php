<?php

namespace Tests\Support;

/**
 * Marker interface: a test class that requires the Golden Company dataset
 * (tenants 999991/999992, seeded by GoldenCompanySeeder).
 *
 * VenQoreTestCase::refreshTestDatabase() detects this marker and calls
 * GoldenSeedManager::ensureSeeded() OUTSIDE the per-test transaction —
 * replacing the fragile in-test DB::commit()/beginTransaction() surgery
 * that the Phase 1 forensic audit identified as the most plausible root
 * cause of the 109-error cascade (finding F-03).
 *
 * Usage:
 *   class MyGoldenTest extends VenQoreTestCase implements RequiresGoldenCompany { ... }
 */
interface RequiresGoldenCompany
{
}
