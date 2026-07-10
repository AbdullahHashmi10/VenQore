<?php
// Run from project root
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\User;

$tenant = Tenant::find(999998); // Golden Audit
if (!$tenant) {
    echo "ERROR: Tenant not found\n";
    exit(1);
}

$membership = DB::table('tenant_users')
    ->where('tenant_id', $tenant->id)
    ->where('role', 'owner')
    ->first();
$user = User::find($membership->user_id);

auth()->login($user);
app()->instance('current.tenant', $tenant);

$routes = [
    's/golden-audit/finance/receivables',
    's/golden-audit/finance/payables',
];

foreach ($routes as $uri) {
    echo "\n-------------------------------------------------\n";
    echo "URI: /$uri\n";
    $request = Request::create($uri, 'GET', [], [], [], [
        'HTTP_X_INERTIA' => 'true',
    ]);
    
    $response = app()->handle($request);
    $data = json_decode($response->getContent(), true);
    
    if (isset($data['props']['parties'])) {
        $parties = $data['props']['parties'];
        echo "Parties count: " . count($parties) . "\n";
        $totalBalance = collect($parties)->sum('balance');
        echo "Total balance in parties prop: " . number_format($totalBalance, 2) . "\n";
        if (count($parties) > 0) {
            echo "First party: " . json_encode($parties[0]) . "\n";
        }
    } else {
        echo "No parties prop found!\n";
    }
}
