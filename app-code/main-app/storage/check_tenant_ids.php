<?php
// Run from project root
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

$tenant = Tenant::where('slug', 'golden-audit')->first();
if (!$tenant) {
    echo "ERROR: Golden Audit tenant not found!\n";
    exit(1);
}

echo "Golden Audit Tenant ID: " . $tenant->id . "\n";
echo "Tenant slug: " . $tenant->slug . "\n";
echo "Tenant timezone: " . ($tenant->timezone ?? 'NOT SET') . "\n\n";

try {
    // Check what's in suppliers
    $supplierCount = DB::table('suppliers')->count();
    echo "Total suppliers (no scope): $supplierCount\n";
    $supplierTenants = DB::table('suppliers')->distinct()->pluck('tenant_id')->toArray();
    echo "Distinct tenant_ids in suppliers: " . implode(', ', $supplierTenants) . "\n\n";
    
    // Check customers
    $customerCount = DB::table('customers')->count();
    echo "Total customers (no scope): $customerCount\n";
    $customerTenants = DB::table('customers')->distinct()->pluck('tenant_id')->toArray();
    echo "Distinct tenant_ids in customers: " . implode(', ', $customerTenants) . "\n\n";
    
    // Check sales
    $salesCount = DB::table('sales')->count();
    echo "Total sales (no scope): $salesCount\n";
    $salesTenants = DB::table('sales')->distinct()->pluck('tenant_id')->toArray();
    echo "Distinct tenant_ids in sales: " . implode(', ', $salesTenants) . "\n\n";
    
    // Check accounts
    $accountsCount = DB::table('accounts')->count();
    echo "Total accounts (no scope): $accountsCount\n";
    $accountsTenants = DB::table('accounts')->distinct()->pluck('tenant_id')->toArray();
    echo "Distinct tenant_ids in accounts: " . implode(', ', $accountsTenants) . "\n\n";
    
    // Check payments
    $paymentsCount = DB::table('payments')->count();
    echo "Total payments (no scope): $paymentsCount\n";
    $paymentsTenants = DB::table('payments')->distinct()->pluck('tenant_id')->toArray();
    echo "Distinct tenant_ids in payments: " . implode(', ', $paymentsTenants) . "\n\n";
    
    // Check sale_item_batches
    $sibCount = DB::table('sale_item_batches')->count();
    echo "Total sale_item_batches (no scope): $sibCount\n\n";
    
    // Check purchase journal entries reference_types
    $purchaseJe = DB::table('journal_entries')
        ->where('tenant_id', $tenant->id)
        ->select('reference_type', DB::raw('count(*) as cnt'))
        ->groupBy('reference_type')
        ->orderByDesc('cnt')
        ->get();
    echo "Journal entries by reference_type for tenant {$tenant->id}:\n";
    foreach ($purchaseJe as $row) {
        echo "  '{$row->reference_type}': {$row->cnt}\n";
    }
    echo "\n";
    
    // Check returns in sales 
    $returnsCount = DB::table('sales')
        ->where('tenant_id', $tenant->id)
        ->where('status', 'returned')
        ->count();
    echo "Sales with status=returned for tenant {$tenant->id}: $returnsCount\n";
    
    // Check discount in sales
    $salesWithDiscount = DB::table('sales')
        ->where('tenant_id', $tenant->id)
        ->where('discount', '>', 0)
        ->count();
    echo "Sales with discount>0 for tenant {$tenant->id}: $salesWithDiscount\n\n";
    
    // Check suppliers scoped to current tenant
    $suppliersScopedCount = DB::table('suppliers')->where('tenant_id', $tenant->id)->count();
    echo "Suppliers with tenant_id={$tenant->id}: $suppliersScopedCount\n";
    
    $customersScopedCount = DB::table('customers')->where('tenant_id', $tenant->id)->count();
    echo "Customers with tenant_id={$tenant->id}: $customersScopedCount\n";
    
    $paymentsScopedCount = DB::table('payments')->where('tenant_id', $tenant->id)->count();
    echo "Payments with tenant_id={$tenant->id}: $paymentsScopedCount\n";
    
    // Check sale_item_batches tenant_id
    if ($sibCount > 0) {
        $sibTenants = DB::table('sale_item_batches')->distinct()->pluck('tenant_id')->toArray();
        echo "Distinct tenant_ids in sale_item_batches: " . implode(', ', $sibTenants) . "\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
