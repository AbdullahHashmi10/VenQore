<?php
// Executes real controller methods with mocked persistence. No Laravel boot,
// database, network, real accounts, or external services are used.
namespace App\Http\Controllers {
    function redirect() { return new class {
        public function back() { return $this; }
        public function with(...$args) { return $this; }
    }; }
}
namespace App\Http\Controllers\Api {
    function auth() { return new class {
        public function user() { return (object) ['id' => 7, 'last_store_id' => 42]; }
    }; }
    function response() { return new class {
        public function json($data, $status = 200) { return new \Illuminate\Http\JsonResponse($data, $status); }
    }; }
}
namespace {
    require dirname(__DIR__, 2) . '/vendor/autoload.php';
    $results = [];
    $users = \Mockery::mock('alias:App\Models\User');
    $victim = \Mockery::mock();
    $victim->id = 900;
    $victim->shouldReceive('delete')->once()->andReturn(true);
    $users->shouldReceive('findOrFail')->with(900)->once()->andReturn($victim);
    $auth = \Mockery::mock();
    $auth->shouldReceive('id')->andReturn(7);
    \Illuminate\Support\Facades\Auth::swap($auth);
    (new \App\Http\Controllers\AdminController)->destroyUser(900);
    $results[] = 'CONFIRMED at controller layer: actor 7 can delete unrelated global user 900; no membership check occurs. Route access still requires store admin permissions.';

    $sync = new \App\Http\Controllers\Api\SyncController;
    $method = new \ReflectionMethod($sync, 'getStoreId');
    $id = $method->invoke($sync);
    if ($id !== 42) throw new \RuntimeException('Unexpected store resolution');
    $results[] = 'CONFIRMED at resolver layer: saved store 42 accepted without any active-membership lookup. This is not an HTTP-level revocation test.';

    $tenants = \Mockery::mock('alias:App\Models\Tenant');
    $tenantQuery = \Mockery::mock();
    $tenants->shouldReceive('where')->with('slug', 'audit-victim')->andReturn($tenantQuery);
    $tenantQuery->shouldReceive('first')->andReturn((object) ['id' => 42]);
    $terminals = \Mockery::mock('alias:App\Models\Terminal');
    $terminalQuery = \Mockery::mock();
    $terminals->shouldReceive('withoutGlobalScope')->with('tenant')->andReturn($terminalQuery);
    $terminalQuery->shouldReceive('where')->with('device_id', 'unregistered-audit-device')->andReturnSelf();
    $terminalQuery->shouldReceive('first')->andReturn(null);
    $activities = \Mockery::mock('alias:App\Models\TerminalActivity');
    $activities->shouldReceive('create')->once()->with(\Mockery::on(fn($row) => $row['tenant_id'] === 42 && $row['terminal_id'] === null))->andReturn(null);
    $request = new \Illuminate\Http\Request([
        'device_id' => 'unregistered-audit-device', 'store_slug' => 'audit-victim',
        'activities' => [['away_at' => '2026-09-10 00:00:00', 'back_at' => '2026-09-10 00:00:01', 'duration_seconds' => 1]],
    ]);
    $response = (new \App\Http\Controllers\Api\TerminalActivityController)->store($request);
    if ($response->getStatusCode() !== 200) throw new \RuntimeException('Unexpected telemetry response');
    $results[] = 'CONFIRMED at controller layer: unauthenticated, unregistered device can create activity attributed to a supplied store slug (HTTP 200). Persistence was mocked.';
    \Mockery::close();
    echo json_encode(['scope' => 'isolated controller probes, not full HTTP penetration tests', 'probes' => $results], JSON_PRETTY_PRINT), PHP_EOL;
}
