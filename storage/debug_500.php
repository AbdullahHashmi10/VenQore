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

// We need to resolve route parameters
$paramMap = [
    'store_slug' => 'golden-audit',
    'id' => '1',
    'supplier' => '1',
    'customer' => '1',
    'product' => '1',
    'warehouse' => '1',
    'sale' => '1',
    'purchase' => '1',
    'order' => '1',
    'run' => '1',
];

// Query real IDs if possible
$sale = DB::table('sales')->where('tenant_id', $tenant->id)->first();
$supplier = DB::table('parties')->where('tenant_id', $tenant->id)->where('type', 'supplier')->first();
$customer = DB::table('parties')->where('tenant_id', $tenant->id)->where('type', 'customer')->first();
$product = DB::table('products')->where('tenant_id', $tenant->id)->first();
$warehouse = DB::table('warehouses')->where('tenant_id', $tenant->id)->first();

if ($sale) {
    $paramMap['sale'] = $sale->id;
    $paramMap['id'] = $sale->id;
}
if ($supplier) {
    $paramMap['supplier'] = $supplier->id;
}
if ($customer) {
    $paramMap['customer'] = $customer->id;
}
if ($product) {
    $paramMap['product'] = $product->id;
    $paramMap['productId'] = $product->id;
}
if ($warehouse) {
    $paramMap['warehouse'] = $warehouse->id;
}

$routesToTest = [
    'store.suppliers.create' => ['store_slug' => 'golden-audit'],
    'store.suppliers.show' => ['store_slug' => 'golden-audit', 'supplier' => $paramMap['supplier']],
    'store.suppliers.edit' => ['store_slug' => 'golden-audit', 'supplier' => $paramMap['supplier']],
    'store.customers.show' => ['store_slug' => 'golden-audit', 'customer' => $paramMap['customer']],
    'store.customers.edit' => ['store_slug' => 'golden-audit', 'customer' => $paramMap['customer']],
    'store.parked-sales.index' => ['store_slug' => 'golden-audit'],
    'store.funds.history.ledger' => ['store_slug' => 'golden-audit'],
    'store.v3.products.show' => ['store_slug' => 'golden-audit', 'product' => $paramMap['product']],
    'store.v3.warehouses.show' => ['store_slug' => 'golden-audit', 'warehouse' => $paramMap['warehouse']],
];

foreach ($routesToTest as $name => $params) {
    echo "\n-------------------------------------------------\n";
    try {
        $url = route($name, $params);
        echo "Testing route: $name ($url)\n";
        
        $request = Request::create($url, 'GET', [], [], [], [
            'HTTP_X_INERTIA' => 'true',
        ]);
        
        // Handle exception manually to print trace
        $response = app()->handle($request);
        echo "Response code: " . $response->getStatusCode() . "\n";
        if ($response->getStatusCode() === 409) {
            echo "Inertia Location: " . $response->headers->get('X-Inertia-Location') . "\n";
        }
    } catch (\Throwable $e) {
        echo "CRASH: " . get_class($e) . " - " . $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
        echo "Trace:\n" . substr($e->getTraceAsString(), 0, 1000) . "\n";
    }
}
