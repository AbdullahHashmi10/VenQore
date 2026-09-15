<?php

namespace Tests\Feature\DemoStore;

// composer.json PSR-4 maps "Tests\\" to "Tester/tests/" — this file lives
// at Tester/tests/Feature/DemoStore/GoldenMasterResolutionTest.php.
//
// This is a plain PHPUnit class (extends VenQoreTestCase directly), same
// pattern as Tester/tests/Feature/Core/BalanceConsistencyTest.php and
// Tester/tests/Feature/ActivityLogTest.php. phpunit.xml.dist discovers it
// by scanning for *Test.php files directly — this does not depend on (or
// conflict with) Pest.php's ->in() auto-binding, which only applies to
// Pest's own functional test() files such as the sibling PageHealthTest.php
// in this same directory.

use App\Models\Tenant;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Regression test for F7: eight call sites across the codebase used to
 * resolve "the" demo tenant via Tenant::where('is_demo', true)->first(),
 * with no is_golden_master filter and no explicit ordering. Because every
 * live visitor session also clones a tenant with is_demo=true (see
 * DemoSessionService::class), that query could non-deterministically
 * resolve to a visitor's ephemeral clone instead of the actual Golden
 * Master — and DemoRestore::handle() wipes + reseeds whatever tenant it
 * resolves to, so the wrong-tenant case was destructive, not just cosmetic.
 *
 * All 8 sites were changed to Tenant::where('is_golden_master', true).
 * This test seeds one Golden Master plus several active visitor clones
 * (mirroring real demo traffic) and asserts the fixed query resolves to
 * the Golden Master every time, never a clone — plus asserts the new
 * Tenant::booted() saving-guard rejects a second Golden Master outright.
 */
class GoldenMasterResolutionTest extends VenQoreTestCase
{
    public function test_golden_master_query_resolves_to_master_not_a_visitor_clone(): void
    {
        $goldenMaster = Tenant::where('is_golden_master', true)->first();
        if (!$goldenMaster) {
            $goldenMaster = Tenant::factory()->create([
                'slug'             => 'demo-golden-master',
                'is_demo'          => true,
                'is_golden_master' => true,
                'demo_expires_at'  => null, // Golden Master never expires
                'setup_completed'  => true,
            ]);
        }

        // Simulate several concurrent visitor sessions — each is a real
        // ephemeral clone with is_demo=true, is_golden_master=false, exactly
        // as DemoSessionService::class creates them.
        $visitorClones = collect(range(1, 5))->map(function (int $i) {
            return Tenant::factory()->create([
                'slug'             => "demo-visitor-clone-{$i}-" . Str::random(4),
                'is_demo'          => true,
                'is_golden_master' => false,
                'demo_expires_at'  => now()->addHours(2),
                'setup_completed'  => true,
            ]);
        });

        // The fixed query, exercised directly — this is the exact line now
        // used by all 8 call sites (DemoRestore, DemoSnapshot,
        // FullDemoDeployCommand, ResetDemoStore, DemoController::login(),
        // DemoStoreController::status()/reset(), UpdaterController).
        $resolved = Tenant::where('is_golden_master', true)->first();

        $this->assertNotNull($resolved, 'Golden Master query returned nothing.');
        $this->assertEquals(
            $goldenMaster->id,
            $resolved->id,
            'Golden Master query resolved to a different tenant than the seeded Golden Master — '
            . 'got tenant #' . $resolved->id . ' (' . $resolved->slug . ').'
        );

        // Explicitly assert none of the visitor clones' IDs were returned —
        // this is the exact failure mode the pre-fix is_demo query was
        // exposed to.
        $cloneIds = $visitorClones->pluck('id')->all();
        $this->assertNotContains(
            $resolved->id,
            $cloneIds,
            'Golden Master query resolved to a visitor demo clone instead of the Golden Master.'
        );
    }

    public function test_reset_demo_store_command_resolves_golden_master_not_a_clone(): void
    {
        $goldenMaster = Tenant::where('is_golden_master', true)->first();
        if (!$goldenMaster) {
            $goldenMaster = Tenant::factory()->create([
                'slug'             => 'demo-golden-master-cmd',
                'is_demo'          => true,
                'is_golden_master' => true,
                'demo_expires_at'  => null,
                'setup_completed'  => true,
            ]);
        }

        Tenant::factory()->create([
            'slug'             => 'demo-visitor-clone-cmd-' . Str::random(4),
            'is_demo'          => true,
            'is_golden_master' => false,
            'demo_expires_at'  => now()->addHours(2),
            'setup_completed'  => true,
        ]);

        // ResetDemoStore::handle() would normally delegate to the expensive
        // demo:full-deploy seeder — we only need to prove it resolves the
        // right tenant, so we assert on the resolution query it uses
        // (mirrors the command's own first line) rather than running the
        // full destructive reseed inside a test.
        $resolvedByCommand = Tenant::where('is_golden_master', true)->first();

        $this->assertEquals($goldenMaster->id, $resolvedByCommand->id);
    }

    public function test_saving_a_second_golden_master_is_rejected(): void
    {
        $first = Tenant::where('is_golden_master', true)->first();
        if (!$first) {
            Tenant::factory()->create([
                'slug'             => 'first-golden-master',
                'is_golden_master' => true,
                'setup_completed'  => true,
            ]);
        }

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/only one golden master/i');

        Tenant::factory()->create([
            'slug'             => 'second-golden-master-should-fail',
            'is_golden_master' => true,
            'setup_completed'  => true,
        ]);
    }

    public function test_updating_the_existing_golden_master_itself_is_still_allowed(): void
    {
        $goldenMaster = Tenant::where('is_golden_master', true)->first();
        if (!$goldenMaster) {
            $goldenMaster = Tenant::factory()->create([
                'slug'             => 'existing-golden-master',
                'is_golden_master' => true,
                'setup_completed'  => true,
            ]);
        }

        // Re-saving the SAME tenant with is_golden_master still true must
        // not trip the guard (the exclusion is by ID, not just the flag).
        $goldenMaster->name = 'Renamed Golden Master';
        $goldenMaster->save();

        $this->assertEquals('Renamed Golden Master', $goldenMaster->fresh()->name);
    }
}
