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

$routesToTest = [
    's/golden-audit/finance/accounts',
    's/golden-audit/reports/dashboard',
    's/golden-audit/sales/create',
];

foreach ($routesToTest as $uri) {
    echo "\n-------------------------------------------------\n";
    echo "Requesting: /$uri\n";
    
    $request = Request::create($uri, 'GET', [], [], [], [
        'HTTP_X_INERTIA' => 'true',
    ]);
    
    try {
        $response = app()->handle($request);
        echo "Response status code: " . $response->getStatusCode() . "\n";
        echo "Headers:\n";
        foreach ($response->headers->all() as $name => $values) {
            echo "  $name: " . implode(', ', $values) . "\n";
        }
        echo "Content snippet:\n";
        echo substr(strip_tags($response->getContent()), 0, 500) . "\n";
    } catch (\Throwable $e) {
        echo "EXCEPTION: " . $e->getMessage() . "\n";
    }
}
