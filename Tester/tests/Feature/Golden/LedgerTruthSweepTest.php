<?php

use App\Models\Tenant;
use App\Models\User;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

uses(Tests\Feature\VenQoreTestCase::class);

beforeEach(function () {
    $this->seed(Database\Seeders\GoldenAuditSeeder::class);
    $this->tenant = Tenant::find(999998);
    $membership = DB::table('tenant_users')->where('tenant_id', $this->tenant->id)->where('role', 'owner')->first();
    $this->user = User::find($membership->user_id);
    $this->actingAs($this->user);
    app()->instance('current.tenant', $this->tenant);
    $this->frs = app(FinancialReportingService::class);
});

test('main dashboard has correct ledger values', function () {
    $url = route('store.dashboard', ['store_slug' => $this->tenant->slug]);
    
    $request = Request::create($url, 'GET');
    $request->headers->set('X-Inertia', 'true');
    
    $response = app()->handle($request);
    expect($response->getStatusCode())->toBe(200);
    
    $props = json_decode($response->getContent(), true);

    $expectedRevenue = $this->frs->getProfitAndLoss(today()->startOfMonth(), today()->endOfMonth())['revenue'];
    $pageRevenue = $props['props']['performance']['Month']['sales'] ?? 0;

    // Assert that the page matches the Ledger exactly (or within 0.01 tolerance)
    expect(abs((float)$pageRevenue - (float)$expectedRevenue))->toBeLessThan(0.01);
});
