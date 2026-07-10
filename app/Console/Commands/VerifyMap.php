<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;

/**
 * Phase 0 — VenQore Verification Blueprint
 *
 * Artisan command: verify:map
 *
 * Regenerates and validates the Number Registry (verification/number_registry.yaml).
 * Every route that displays a financial metric MUST be registered in the registry.
 * If an unregistered financial route is found, this command exits with code 1
 * and the CI pipeline fails.
 *
 * Usage:
 *   php artisan verify:map              # full scan + report
 *   php artisan verify:map --strict     # exit 1 on any unregistered metric
 *   php artisan verify:map --stats      # print summary statistics only
 *   php artisan verify:map --output=json  # machine-readable JSON output
 */
class VerifyMap extends Command
{
    protected $signature = 'verify:map
        {--strict : Exit with code 1 if any unregistered financial metric routes are found}
        {--stats  : Print registry statistics only (no route scan)}
        {--output=table : Output format: table, json}';

    protected $description = '[Phase 0] Verify all financial routes are registered in the Number Registry. Fails CI if a new metric route appears unregistered.';

    /**
     * Path to the Number Registry YAML.
     */
    private string $registryPath;

    /**
     * Namespaces / controller patterns that expose financial metrics.
     * Any route pointing to these controllers is considered "financial".
     */
    private array $financialControllerPatterns = [
        'V3\\DashboardController',
        'V3\\ReportController',
        'V3\\ReportExportController',
        'V3\\SaleController',
        'V3\\SaleReturnController',
        'V3\\PurchaseController',
        'V3\\PurchaseReturnController',
        'V3\\ExpenseController',
        'V3\\PayrollController',
        'V3\\CustomerStatementController',
        'V3\\SupplierStatementController',
        'V3\\CustomerPaymentController',
        'V3\\SupplierPaymentController',
        'V3\\CustomerAdvanceController',
        'V3\\SupplierAdvanceController',
        'V3\\AssetController',
        'V3\\DepreciationController',
        'V3\\LoanController',
        'V3\\FundController',
        'V3\\BankTransferController',
        'V3\\OpeningBalanceController',
        'V3\\BadDebtController',
        'V3\\BounceController',
        'V3\\FiscalYearController',
        'V3\\CashShortageController',
        'V3\\DisasterClaimController',
        'V3\\DonationController',
        'V3\\ProductionRunController',
        'V3\\EmployeeSettlementController',
        'SaleController',             // Legacy POS checkout
        'WooCommerceController',       // WooCommerce webhook
        'WooSync\\WooWebhookController',
        'PosController',
        'Api\\PosSearchController',
        'Api\\BankAccountController',
    ];

    public function handle(): int
    {
        $this->registryPath = base_path('verification/number_registry.yaml');

        if (! file_exists($this->registryPath)) {
            $this->error('Number Registry not found: verification/number_registry.yaml');
            $this->line('Run Phase 0 of the Verification Blueprint to create it.');
            return 1;
        }

        $registry = $this->loadRegistry();

        if ($this->option('stats')) {
            return $this->printStats($registry);
        }

        // ── 1. Parse registry into a lookup map ────────────────────────────
        $registeredRouteNames = [];
        $registeredControllers = [];

        foreach ($registry['metrics'] ?? [] as $metric) {
            // Extract route name
            if (! empty($metric['route'])) {
                $registeredRouteNames[$metric['route']] = $metric['id'];
            }
            // Extract controller string (without method)
            if (! empty($metric['controller'])) {
                $base = str_contains($metric['controller'], '@')
                    ? explode('@', $metric['controller'])[0]
                    : $metric['controller'];
                $base = ltrim($base, '\\App\\Http\\Controllers\\');
                $registeredControllers[$base] = $metric['id'];
            }
        }

        // ── 2. Scan live routes ────────────────────────────────────────────
        $allRoutes = \Illuminate\Support\Facades\Route::getRoutes()->getRoutes();
        $unregistered = [];
        $registered   = [];

        foreach ($allRoutes as $route) {
            $action = $route->getActionName();
            if (! str_contains($action, '@')) {
                continue; // skip closures / redirect routes
            }

            [$controllerFqn, $method] = explode('@', $action);
            $controllerShort = str_replace('App\\Http\\Controllers\\', '', $controllerFqn);

            // Is this a financial controller?
            $isFinancial = false;
            foreach ($this->financialControllerPatterns as $pattern) {
                if (str_contains($controllerShort, $pattern)) {
                    $isFinancial = true;
                    break;
                }
            }

            if (! $isFinancial) {
                continue;
            }

            $routeName = $route->getName() ?? '(unnamed)';
            $uri       = $route->uri();
            $httpMethods = implode('|', $route->methods());

            // Check if registered
            $isRegistered = isset($registeredRouteNames[$routeName])
                || isset($registeredControllers[$controllerShort]);

            $entry = [
                'route_name'  => $routeName,
                'uri'         => $uri,
                'method'      => $httpMethods,
                'controller'  => "{$controllerShort}@{$method}",
                'registered'  => $isRegistered,
                'registry_id' => $registeredRouteNames[$routeName]
                    ?? $registeredControllers[$controllerShort]
                    ?? 'UNREGISTERED',
            ];

            if ($isRegistered) {
                $registered[] = $entry;
            } else {
                $unregistered[] = $entry;
            }
        }

        // ── 3. Report ──────────────────────────────────────────────────────
        $outputFormat = $this->option('output');

        if ($outputFormat === 'json') {
            $this->line(json_encode([
                'registered'   => $registered,
                'unregistered' => $unregistered,
                'stats'        => $this->buildStats($registry, $registered, $unregistered),
            ], JSON_PRETTY_PRINT));
        } else {
            $this->printTableReport($registry, $registered, $unregistered);
        }

        // ── 4. CI gate ─────────────────────────────────────────────────────
        if (! empty($unregistered)) {
            $this->error('');
            $this->error('🚨 PHASE 0 GATE FAILED: ' . count($unregistered) . ' financial route(s) are not registered in the Number Registry.');
            $this->error('Add them to verification/number_registry.yaml before merging.');

            if ($this->option('strict')) {
                return 1;
            }
        } else {
            $this->info('');
            $this->info('✅ PHASE 0 GATE PASSED: All ' . count($registered) . ' financial routes are registered in the Number Registry.');
        }

        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function loadRegistry(): array
    {
        if (! class_exists(Yaml::class)) {
            // Fallback: parse minimal YAML manually if symfony/yaml is not installed
            $raw = file_get_contents($this->registryPath);
            // Only parse the stats section for --stats mode
            return ['metrics' => [], '_raw' => $raw, 'stats' => []];
        }

        return Yaml::parseFile($this->registryPath) ?? [];
    }

    private function printStats(array $registry): int
    {
        $stats = $registry['stats'] ?? [];
        $metrics = $registry['metrics'] ?? [];

        $counts = ['LEDGER-DERIVED' => 0, 'TRANSACTION-DERIVED' => 0, 'HYBRID' => 0, 'NON-FINANCIAL' => 0];
        $verified = 0;
        foreach ($metrics as $m) {
            $cls = $m['classification'] ?? 'UNKNOWN';
            $counts[$cls] = ($counts[$cls] ?? 0) + 1;
            if ($m['verified'] ?? false) {
                $verified++;
            }
        }

        $total = count($metrics);

        $this->info('');
        $this->info('═══════════════════════════════════════════════');
        $this->info('  VenQore Number Registry — Phase 0 Statistics');
        $this->info('═══════════════════════════════════════════════');
        $this->table(
            ['Dimension', 'Count'],
            [
                ['Total registered metrics',     $total],
                ['✅ LEDGER-DERIVED (correct)',   $counts['LEDGER-DERIVED']],
                ['⚠️  TRANSACTION-DERIVED (suspect)', $counts['TRANSACTION-DERIVED']],
                ['⚠️  HYBRID (suspect)',          $counts['HYBRID']],
                ['⬜ NON-FINANCIAL (out of scope)', $counts['NON-FINANCIAL']],
                ['✔️  Verified by tests',          $verified],
                ['Coverage %',                    $total > 0 ? round($verified / $total * 100, 1) . '%' : '0%'],
                ['Consistency groups',            count($registry['consistency_groups'] ?? [])],
                ['Flagged for remediation',       count($registry['flagged_for_remediation'] ?? [])],
            ]
        );
        return 0;
    }

    private function printTableReport(array $registry, array $registered, array $unregistered): void
    {
        $this->info('');
        $this->info('═══════════════════════════════════════════════');
        $this->info('  VenQore Number Registry — Route Scan Report');
        $this->info('═══════════════════════════════════════════════');
        $this->info('Registry: verification/number_registry.yaml');
        $this->info('');

        // Registry stats
        $this->call('verify:map', ['--stats' => true, '--output' => 'table']);

        // Unregistered routes (the important ones)
        if (! empty($unregistered)) {
            $this->warn('');
            $this->warn('── UNREGISTERED FINANCIAL ROUTES (must be added to registry) ──');
            $this->table(
                ['Route Name', 'URI', 'Method', 'Controller'],
                array_map(fn($r) => [
                    $r['route_name'],
                    $r['uri'],
                    $r['method'],
                    $r['controller'],
                ], $unregistered)
            );
        }

        // Registered routes summary
        $this->info('');
        $this->info('── REGISTERED FINANCIAL ROUTES (' . count($registered) . ') ──');
        $this->table(
            ['Registry ID', 'Route Name', 'URI', 'Controller'],
            array_map(fn($r) => [
                $r['registry_id'],
                $r['route_name'],
                substr($r['uri'], 0, 60),
                substr($r['controller'], 0, 55),
            ], $registered)
        );

        // Flagged metrics
        $flagged = $registry['flagged_for_remediation'] ?? [];
        if (! empty($flagged)) {
            $this->warn('');
            $this->warn('── METRICS FLAGGED FOR REMEDIATION ──');
            $this->table(
                ['ID', 'Reason', 'Plan Task'],
                array_map(fn($f) => [
                    $f['id'],
                    $f['reason'],
                    $f['plan_task'],
                ], $flagged)
            );
        }
    }

    private function buildStats(array $registry, array $registered, array $unregistered): array
    {
        return [
            'total_in_registry'  => count($registry['metrics'] ?? []),
            'financial_routes_found'   => count($registered) + count($unregistered),
            'registered_routes'  => count($registered),
            'unregistered_routes' => count($unregistered),
            'gate_passed'        => empty($unregistered),
        ];
    }
}
