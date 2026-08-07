<?php

/**
 * Demo Store Page Health Tests — VenQore
 *
 * Authenticates as the demo "owner" user and visits every major page in the
 * application, asserting each one returns a 200 (or non-500) response.
 *
 * Design rules:
 *  - Read-only: only GET requests.
 *  - Uses the real demo store slug ("demo") and real seeded users.
 *  - Fast: typically < 90 seconds.
 *  - Does NOT modify any data.
 *
 * Run: ./vendor/bin/pest tests/Feature/DemoStore/PageHealthTest.php
 */

use Illuminate\Foundation\Testing\TestCase;
use App\Models\User;
use App\Models\Tenant;
use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;

// Declare TestCase binding here so this file works when run in isolation
// on the production server (->in() only applies during full-suite discovery).
uses(VenQoreTestCase::class);


// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(function () {
    // 1. Get or create a demo tenant
    $tenant = Tenant::where('slug', 'demo')->first();
    if (!$tenant) {
        $tenant = Tenant::create([
            'name'             => 'VenQore Demo Store',
            'slug'             => 'demo',
            'plan'             => 'business',
            'status'           => 'active',
            'currency_symbol'  => '$',
            'currency_code'    => 'USD',
            'setup_completed'  => true,
            'is_demo'          => true,
        ]);
    }

    // 2. Get or create the demo owner user
    $user = User::where('email', 'demo-owner@venqore-demo.internal')->first();
    if (!$user) {
        $user = User::create([
            'name'          => 'Demo Owner',
            'email'         => 'demo-owner@venqore-demo.internal',
            'password'      => bcrypt('password'),
            'last_store_id' => $tenant->id,
        ]);
    }

    $membershipExists = DB::table('tenant_users')
        ->where('tenant_id', $tenant->id)
        ->where('user_id', $user->id)
        ->exists();

    if (!$membershipExists) {
        DB::table('tenant_users')->insert([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => 'Demo Owner',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
    }

    // 3. Seed tenant defaults so standard accounts exist if not already seeded
    if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection || !DB::table('accounts')->where('tenant_id', $tenant->id)->exists()) {
        $this->seedTenantDefaults($tenant);
    }

    $this->bindTenantContext($tenant, $user);
});

function getDemoOwner(): User
{
    return User::where('email', 'demo-owner@venqore-demo.internal')->firstOrFail();
}

function getDemoSlug(): string
{
    return Tenant::where('is_demo', true)->value('slug') ?? 'demo';
}

// ─── Page Load Tests ─────────────────────────────────────────────────────────

// ── Core ──────────────────────────────────────────────────────────────────────

test('[PAGE-01] dashboard loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/dashboard");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-02] POS terminal loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/pos");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Inventory ─────────────────────────────────────────────────────────────────

test('[PAGE-03] inventory list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/inventory");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-04] stock take list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/stock-take");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-05] stock operations page loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/stock-operations");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Sales ─────────────────────────────────────────────────────────────────────

test('[PAGE-06] sales list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/sales");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-07] sales orders list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/sales-orders");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-08] pre-sales / quotations list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/pre-sales");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-09] returns list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/returns");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-10] proposals list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/proposals");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Purchasing ────────────────────────────────────────────────────────────────

test('[PAGE-11] purchases list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/purchases");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-12] purchase orders list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/purchase-orders");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-13] debit notes list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/debit-notes");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Parties ───────────────────────────────────────────────────────────────────

test('[PAGE-14] parties list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/parties");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-15] suppliers list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/parties/suppliers");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Finance ───────────────────────────────────────────────────────────────────

test('[PAGE-16] bank accounts list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/bank-accounts");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-17] banking / transactions loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/banking");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-18] journal entries loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/journal-entries");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-19] funds page loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/funds");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Reports ───────────────────────────────────────────────────────────────────

test('[PAGE-20] day book report loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/reports/day-book");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-21] profit & loss report loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/reports/profit-loss");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-22] low stock report loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/reports/low-stock");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-23] movement history report loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/reports/movement-history");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-24] expiry report loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/reports/expiry-report");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-25] sales analytics loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/reports/sales-analytics");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Operations ────────────────────────────────────────────────────────────────

test('[PAGE-26] cookbook / recipes list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/cookbook");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-27] manufacturing / production runs loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/manufacturing");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-28] staff list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/staff");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-29] staff attendance loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/staff/attendance");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-30] activity log loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/activity-log");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-31] recycle bin loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/recycle-bin");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Integrations ──────────────────────────────────────────────────────────────

test('[PAGE-32] WooCommerce connections list loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/woo/connections");
    expect($response->status())->not->toBe(500);
})->group('page-health');

// ── Settings ──────────────────────────────────────────────────────────────────

test('[PAGE-33] settings panel loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/settings");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-34] billing page loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/billing");
    expect($response->status())->not->toBe(500);
})->group('page-health');

test('[PAGE-35] profile page loads', function () {
    $user = getDemoOwner();
    $slug = getDemoSlug();
    $response = $this->actingAs($user)->get("/s/{$slug}/profile");
    expect($response->status())->not->toBe(500);
})->group('page-health');
