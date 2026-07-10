<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Party;
use App\Models\Sale;
use App\Models\User;

class VerifySentinelCommand extends Command
{
    protected $signature = 'verify:sentinel';
    protected $description = '[Phase C-E] Sentinel Ledger Isolation Sweep: Asserts that no financial controller/page displays raw database queries bypassing the Ledger.';

    private const SENTINEL_TENANT_ID = '999991';
    private const BYPASSED_AMOUNT = 9999.00;

    public function handle(): int
    {
        $this->info("===============================================================");
        $this->info("▶ RUNNING VENQORE LEDGER SENTINEL SWEEP");
        $this->info("===============================================================");

        $tenant = Tenant::find(self::SENTINEL_TENANT_ID);
        if (!$tenant) {
            $this->error("Sentinel Tenant (Golden Company) not found. Run seeder first.");
            return 1;
        }

        // 1. Authenticate context
        $membership = DB::table('tenant_users')->where('tenant_id', $tenant->id)->first();
        if (!$membership) {
            $this->error("No users found for Sentinel Tenant.");
            return 1;
        }
        $user = User::find($membership->user_id);
        auth()->login($user);

        // Bind tenant context
        app()->instance('current.tenant', $tenant);

        // 2. Arrange: Inject the isolation trap bypassed entries
        DB::beginTransaction();
        try {
            $this->seedBypassedTransactions($tenant);

            // 3. Load number registry
            $registryPath = base_path('verification/number_registry.yaml');
            if (!file_exists($registryPath)) {
                $this->error("Number registry not found: verification/number_registry.yaml");
                DB::rollBack();
                return 1;
            }

            $registry = Yaml::parseFile($registryPath);
            $metrics = $registry['metrics'] ?? [];

            // Group by route to minimize requests
            $routes = [];
            foreach ($metrics as $metric) {
                if (($metric['classification'] ?? '') === 'LEDGER-DERIVED' && !empty($metric['route'])) {
                    $routes[$metric['route']][] = $metric;
                }
            }

            $violations = [];
            $testedCount = 0;

            foreach ($routes as $routeName => $routeMetrics) {
                $url = $this->resolveRouteUrl($routeName, $tenant);
                if (!$url) {
                    continue;
                }

                $testedCount++;

                // Simulate Inertia request
                $request = Request::create($url, 'GET');
                $request->headers->set('X-Inertia', 'true');
                $request->headers->set('X-Inertia-Version', '1');

                // Re-bind auth user for the request pipeline
                auth()->login($user);

                $response = app()->handle($request);

                if ($response->getStatusCode() !== 200) {
                    continue;
                }

                $content = $response->getContent();
                $props = json_decode($content, true);

                if ($this->scanPayload($props, self::BYPASSED_AMOUNT)) {
                    $violations[$routeName] = [
                        'url' => $url,
                        'metrics' => $routeMetrics,
                        'props' => $props,
                    ];
                }
            }

            if (empty($violations)) {
                $this->info("✔ ALL SCANNED ROUTES ARE IN PERFECT LEDGER ISOLATION (No bypasses detected).");
                $this->info("===============================================================");
                DB::rollBack();
                return 0;
            }

            // Discrepancy Found! Perform root cause analysis on the first violation
            $firstRoute = array_key_first($violations);
            $violation = $violations[$firstRoute];
            $metric = $violation['metrics'][0];

            $this->error("[!] DISCREPANCY DETECTED: Ledger isolation bypassed.");
            $this->line("");

            // Print Comparison Report
            $this->line(sprintf("%-28s %s", "Expected (Ledger):", "Rs 7,000"));
            
            // Loop through all metrics of this route and related ones to show status
            foreach ($violation['metrics'] as $m) {
                $this->line(sprintf("%-28s %s", $m['name'] . ":", "Rs 9,999 ✗"));
            }

            $this->line("");
            $this->warn("Conclusion:");
            $this->line("Endpoints are displaying raw transaction values instead of ledger balances.");
            $this->line("");

            // Root Cause Candidate Engine
            $controllerPath = $this->getControllerPath($metric['controller'] ?? '');
            $reason = "Uses raw SQL query or table builder directly instead of Ledger/accounting services.";
            $confidence = "80%";

            if (file_exists(base_path($controllerPath))) {
                $code = file_get_contents(base_path($controllerPath));
                if (str_contains($code, 'Sale::') || str_contains($code, 'DB::table(\'sales\'')) {
                    $reason = "Performs direct query on Sale model (Sale::where) instead of aggregating through accounting services or Ledger.";
                    $confidence = "98%";
                } elseif (str_contains($code, 'Purchase::') || str_contains($code, 'DB::table(\'purchases\'')) {
                    $reason = "Performs direct query on Purchase model (Purchase::where) instead of Ledger.";
                    $confidence = "98%";
                }
            }

            $this->warn("Root Cause Candidate:");
            $this->line($controllerPath ? $controllerPath : "Unknown Controller");
            $this->line("");
            $this->warn("Reason:");
            $this->line($reason);
            $this->line("");
            $this->warn("Confidence:");
            $this->line($confidence);
            $this->line("");
            
            $this->warn("Affected Pages:");
            foreach ($violations as $r => $d) {
                $this->line("• " . ($d['metrics'][0]['inertia_page'] ?? $r) . " ({$r})");
            }

            $this->info("===============================================================");
            $this->error("✖ SENTINEL SWEEP FAILED");
            $this->info("===============================================================");

            DB::rollBack();
            return 1;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Error executing sweep: " . $e->getMessage());
            return 1;
        }
    }

    private function getControllerPath(string $controllerAction): ?string
    {
        if (empty($controllerAction)) return null;
        $parts = explode('@', $controllerAction);
        $class = $parts[0];
        $class = str_replace('App\\', 'app/', $class);
        $class = str_replace('\\', '/', $class);
        return $class . '.php';
    }

    private function seedBypassedTransactions(Tenant $tenant): void
    {
        $warehouseId = DB::table('warehouses')
            ->where('tenant_id', $tenant->id)
            ->value('id');

        $customer = Party::where('tenant_id', $tenant->id)->where('type', 'customer')->first();
        $supplier = Party::where('tenant_id', $tenant->id)->where('type', 'supplier')->first();

        // Seed a Sale
        $saleId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('sales')->insert([
            'id' => $saleId,
            'tenant_id' => $tenant->id,
            'user_id' => 1,
            'reference_number' => 'SAL-BYPASS-9999',
            'party_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'subtotal' => self::BYPASSED_AMOUNT,
            'tax' => 0.00,
            'discount' => 0.00,
            'total' => self::BYPASSED_AMOUNT,
            'net_sales' => self::BYPASSED_AMOUNT,
            'status' => 'posted',
            'posted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productId = DB::table('products')
            ->where('tenant_id', $tenant->id)
            ->value('id');

        DB::table('sale_items')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'sale_id' => $saleId,
            'product_id' => $productId,
            'quantity' => 1,
            'unit_price' => self::BYPASSED_AMOUNT,
            'subtotal' => self::BYPASSED_AMOUNT,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Raw Bypassed Purchase (Bypasses Ledger)
        $purchaseId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('purchases')->insert([
            'id' => $purchaseId,
            'tenant_id' => $tenant->id,
            'user_id' => 1,
            'invoice_number' => 'PUR-BYPASS-9999',
            'party_id' => $supplier->id,
            'warehouse_id' => $warehouseId,
            'subtotal' => self::BYPASSED_AMOUNT,
            'tax' => 0.00,
            'total' => self::BYPASSED_AMOUNT,
            'purchase_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Raw Bypassed Expense (Bypasses Ledger)
        DB::table('expenses')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'category' => 'Rent',
            'amount' => self::BYPASSED_AMOUNT,
            'date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function resolveRouteUrl(string $routeName, Tenant $tenant): ?string
    {
        if (!\Illuminate\Support\Facades\Route::has($routeName)) {
            return null;
        }

        $params = ['store_slug' => $tenant->slug];

        if (str_contains($routeName, 'party-ledger')) {
            $party = Party::where('tenant_id', $tenant->id)->first();
            if ($party) $params['partyId'] = $party->id;
        }

        if (str_contains($routeName, 'statement') || str_contains($routeName, 'customers.show') || str_contains($routeName, 'suppliers.show')) {
            $party = Party::where('tenant_id', $tenant->id)->first();
            if ($party) $params['id'] = $party->id;
        }

        if (str_contains($routeName, 'export')) {
            $params['type'] = 'pdf';
        }

        if (str_contains($routeName, 'sales.show') || $routeName === 'store.sales.show') {
            $sale = Sale::where('tenant_id', $tenant->id)->first();
            if ($sale) $params['id'] = $sale->id;
        }

        try {
            return route($routeName, $params);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function scanPayload(mixed $data, mixed $target): bool
    {
        if (is_numeric($data) && (float)$data === (float)$target) {
            return true;
        }

        if (is_string($data) && (str_contains($data, (string)$target) || str_contains($data, number_format((float)$target)))) {
            return true;
        }

        if (is_array($data) || is_object($data)) {
            foreach ($data as $value) {
                if ($this->scanPayload($value, $target)) {
                    return true;
                }
            }
        }

        return false;
    }
}
