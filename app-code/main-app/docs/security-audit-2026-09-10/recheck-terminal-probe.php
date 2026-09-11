<?php
// Real controller and credential code; persistence mocked. No DB/network writes.
namespace App\Http\Controllers\Api {
    function now() { return \Carbon\Carbon::now(); }
    function response() { return new class {
        public function json($data, $status = 200) { return new \Illuminate\Http\JsonResponse($data, $status); }
    }; }
}
namespace App\Support { function now() { return \Carbon\Carbon::now(); } }
namespace {
    require dirname(__DIR__, 2) . '/vendor/autoload.php';
    $terminal = \Mockery::mock('alias:App\Models\Terminal');
    $terminal->id = 'audit-terminal';
    $terminal->tenant_id = 42;
    $terminal->device_id = 'known-legacy-device-id';
    $terminal->device_secret_hash = null;
    $terminal->status = 'OPEN';
    $terminal->last_heartbeat_at = \Carbon\Carbon::now();
    $query = \Mockery::mock();
    $terminal->shouldReceive('withoutGlobalScope')->with('tenant')->andReturn($query);
    $query->shouldReceive('where')->with('device_id', 'known-legacy-device-id')->andReturnSelf();
    $query->shouldReceive('first')->andReturn($terminal);
    $terminal->shouldReceive('forceFill')->once()->andReturnUsing(function ($attrs) use ($terminal) {
        foreach ($attrs as $k => $v) $terminal->$k = $v;
        return $terminal;
    });
    $terminal->shouldReceive('save')->once()->andReturn(true);
    $terminal->shouldReceive('update')->once()->andReturn(true);
    $db = \Mockery::mock();
    $dbQuery = \Mockery::mock();
    $db->shouldReceive('table')->andReturn($dbQuery);
    $dbQuery->shouldReceive('where')->andReturnSelf();
    $dbQuery->shouldReceive('when')->andReturnSelf();
    $dbQuery->shouldReceive('exists')->andReturn(false);
    \Illuminate\Support\Facades\DB::swap($db);
    $request = new \Illuminate\Http\Request(['device_id' => 'known-legacy-device-id']);
    $response = (new \App\Http\Controllers\Api\HeartbeatController)->store($request);
    $body = $response->getData(true);
    $issued = $body['device_secret'] ?? '';
    if ($response->getStatusCode() !== 200 || strlen($issued) !== 64
        || !hash_equals($terminal->device_secret_hash, hash('sha256', $issued))) {
        throw new \RuntimeException('Legacy secret issuance was not reproduced');
    }
    \Mockery::close();
    echo json_encode([
        'scope' => 'Real controller and TerminalDeviceAuth; persistence mocked; not live HTTP test',
        'confirmed' => 'An already paired legacy terminal without a secret issues a valid 64-character secret to a request containing only its device ID. No session, pairing code, or previous device credential was supplied.',
        'status' => $response->getStatusCode(),
    ], JSON_PRETTY_PRINT), PHP_EOL;
}
