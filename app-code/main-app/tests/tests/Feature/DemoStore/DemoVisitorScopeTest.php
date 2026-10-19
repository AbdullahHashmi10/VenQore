<?php

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Tests\Feature\VenQoreTestCase;

uses(VenQoreTestCase::class);

/** Bind a tenant and a request whose session holds the given demo visitor id. */
function bindDemoRequest(bool $isDemo, ?string $visitor): void
{
    $tenant = new Tenant();
    $tenant->id = 1;
    $tenant->is_demo = $isDemo;
    app()->instance('current.tenant', $tenant);

    $request = Request::create('/s/demo/dashboard');
    $session = app('session')->driver();
    if ($visitor) {
        $session->put('demo_visitor_id', $visitor);
    }
    $request->setLaravelSession($session);
    app()->instance('request', $request);
}

afterEach(function () {
    app()->forgetInstance('current.tenant');
});

test('in the demo, sales, customers and products show sample rows plus the visitor\'s own', function () {
    bindDemoRequest(true, 'visitor-a');

    foreach ([Sale::class, Party::class, Product::class] as $model) {
        $sql = $model::query()->toSql();
        expect($sql)->toMatch('/demo_session[`"]?\s+is null/i');
        $bindings = $model::query()->getBindings();
        expect($bindings)->toContain('visitor-a');
    }
});

test('a visitor with no id yet sees only the shared sample rows', function () {
    bindDemoRequest(true, null);

    $query = Party::query();
    expect($query->toSql())->toContain('is null');
    expect($query->getBindings())->not->toContain('visitor-a');
});

test('real stores are never filtered by demo_session', function () {
    bindDemoRequest(false, 'visitor-a');

    foreach ([Sale::class, Party::class, Product::class] as $model) {
        expect($model::query()->toSql())->not->toContain('demo_session');
    }
});

test('visitor ids survive a business or role switch but are unique per visitor', function () {
    $a = $this->post('/demo/login', ['role' => 'owner', 'business_type' => 'grocery']);
    $idA = session('demo_visitor_id');
    expect($idA)->not->toBeEmpty();

    $this->post('/demo/switch-business', ['role' => 'cashier', 'business_type' => 'restaurant']);
    expect(session('demo_visitor_id'))->toBe($idA);
});
