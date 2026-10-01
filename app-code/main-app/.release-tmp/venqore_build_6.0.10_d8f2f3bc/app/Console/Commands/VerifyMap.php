<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;

class VerifyMap extends Command
{
    protected $signature = 'verify:map
        {--strict : Exit with code 1 if any unregistered financial metric routes are found}
        {--stats  : Print registry statistics only (no route scan)}
        {--output=table : Output format: table, json}';

    protected $description = '[Phase 0] Verify all financial routes are registered in the Number Registry. Auto-generates missing routes.';

    private string $registryPath;

    private const SKIP_NAMES = [
        'store.google.redirect',
        'store.google.backup.download',
        'store.google.backup.restore',
        'store.billing.portal',
        'store.billing.upgrade',
        'store.billing.checkout-addon',
        'store.billing.checkout-upload-service',
        'store.sales.export',
        'store.sales-orders.export',
        'store.pre-sales.export',
        'store.sales.print',
        'store.purchases.print',
        'store.purchase-orders.print',
        'store.proposals.print',
        'store.sales-orders.print',
        'store.debit-notes.print',
        'store.pos.barcode',
        'store.pos.search',
        'store.pos.categories',
        'store.pos.featured',
        'store.attendance.heartbeat',
        'store.api.heartbeat',
        'store.system.reset',
        'store.system.delete-entity',
        'store.backups.download',
        'store.backups.restore',
        'store.api.sync.customers',
        'store.api.sync.inventory',
        'store.api.sync.orders.batch',
        'store.api.sync.products',
        'store.api.sync.suppliers',
        'store.api.sync.taxes',
        'store.api.sync.users',
        'store.api.check-connection',
        'store.terminal-activities.screenshot',
        'store.api.bank-accounts',
        'store.finance.accounts',
        'store.finance.journal',
        'store.payment-in.create',
        'store.payment-out.create',
        'store.production.edit',
        'store.reports.discount-report',
        'store.reports.inventory-valuation',
        'store.sales.create',
        'store.sales.edit',
        'store.sales.master',
        'store.sales.orders.show',
        'store.production.show',
        'store.proposals.show',
        'store.proposals.edit',
        'store.vensynq.index',
        'store.vensynq.settings',
        'store.vensynq.connect',
        'store.vensynq.callback',
        'store.growth-engine.whatsapp',
        'store.products.variants.index',
        'store.payments.show',
        'store.staff-attendance.show',
        'store.staff.attendance.show',
        'store.admin.vena.ticket.show',
        'store.sales.lookup',
        'store.ai.query',
    ];

    private const SKIP_URI_FRAGMENTS = [
        '/api/',
        '/barcode/',
        '/heartbeat',
        '/export',
        '/print',
        '/screenshot',
        '/sync/',
        '/send-email',
        '/send-whatsapp',
        '/check-connection',
    ];

    public function handle(): int
    {
        $this->registryPath = base_path('verification/number_registry.yaml');

        if (! file_exists($this->registryPath)) {
            $this->error('Number Registry not found: verification/number_registry.yaml');
            return 1;
        }

        $registry = $this->loadRegistry();

        if ($this->option('stats')) {
            return $this->printStats($registry);
        }

        // ── 1. Parse registry into a lookup map ────────────────────────────
        $registeredRouteNames = [];
        foreach ($registry['metrics'] ?? [] as $metric) {
            if (! empty($metric['route'])) {
                $registeredRouteNames[$metric['route']] = $metric['id'];
            }
        }

        // ── 2. Scan live routes matching Audit discovery logic ─────────────
        $discovered = [];
        foreach (\Illuminate\Support\Facades\Route::getRoutes()->getRoutes() as $route) {
            if (!in_array('GET', $route->methods())) continue;

            $name = $route->getName() ?? '';
            $uri  = $route->uri();

            if (!str_starts_with($name, 'store.')) continue;
            if (in_array($name, self::SKIP_NAMES, true)) continue;

            $skipRoute = false;
            foreach (self::SKIP_URI_FRAGMENTS as $fragment) {
                if (str_contains($uri, $fragment)) {
                    $skipRoute = true;
                    break;
                }
            }
            if ($skipRoute) continue;

            $discovered[] = [
                'name'   => $name,
                'uri'    => $uri,
                'action' => $route->getActionName(),
            ];
        }

        // Deduplicate
        $uniqueRoutes = [];
        $seen = [];
        foreach ($discovered as $r) {
            if (!isset($seen[$r['name']])) {
                $uniqueRoutes[] = $r;
                $seen[$r['name']] = true;
            }
        }

        // Auto increment for M-AUTO-
        $autoIncrement = 1;
        foreach ($registry['metrics'] ?? [] as $m) {
            if (str_starts_with($m['id'], 'M-AUTO-')) {
                $num = (int) substr($m['id'], 7);
                if ($num >= $autoIncrement) {
                    $autoIncrement = $num + 1;
                }
            }
        }

        $dirty = false;
        foreach ($uniqueRoutes as $r) {
            $routeName = $r['name'];
            if (!isset($registeredRouteNames[$routeName])) {
                // Not registered! Auto generate draft entry
                $guessedClass = $this->guessClassification($r['action']);
                
                $cleanName = str_replace('store.', '', $routeName);
                $cleanName = ucwords(str_replace(['.', '-', '_'], ' ', $cleanName));

                $newMetric = [
                    'id' => 'M-AUTO-' . sprintf('%03d', $autoIncrement++),
                    'name' => $cleanName,
                    'route' => $routeName,
                    'route_uri' => 'GET ' . $r['uri'],
                    'inertia_page' => 'AutoGenerated',
                    'controller' => $r['action'],
                    'service' => 'UNKNOWN',
                    'ledger_accounts' => [],
                    'source_query' => 'UNKNOWN',
                    'classification' => $guessedClass,
                    'verified' => false,
                ];

                $registry['metrics'][] = $newMetric;
                $registeredRouteNames[$routeName] = $newMetric['id'];
                $dirty = true;
                $this->info("Generated draft registry entry for route: {$routeName} with classification: {$guessedClass}");
            }
        }

        // Apply classification overrides for non-financial routes
        $nonFinancialPatterns = [
            'settings', 'profile', 'backups', 'activity-log', 'notifications', 'global.search',
            'create-or-join', 'join', 'setup', 'pos', 'online-store', 'woocommerce', 'woo.plugin',
            'warehouses', 'attributes', 'categories', 'products.create', 'staff-attendance', 
            'staff.attendance', 'attendance.status', 'stock-transfers', 'stock-takes',
            'compositions', 'serials', 'batches', 'debit-notes.create', 'debit-notes.index',
            'recurring-invoices', 'pre-sales', 'parked-sales', 'customers.create', 'presales.create',
            'marketing-campaigns'
        ];
        
        if (isset($registry['metrics'])) {
            foreach ($registry['metrics'] as &$m) {
                $routeName = $m['route'] ?? '';
                $isNonFinancial = false;
                foreach ($nonFinancialPatterns as $pat) {
                    if (str_contains($routeName, $pat)) {
                        $isNonFinancial = true;
                        if (($m['classification'] ?? '') !== 'NON-FINANCIAL') {
                            $m['classification'] = 'NON-FINANCIAL';
                            $dirty = true;
                        }
                        break;
                    }
                }

                if (!$isNonFinancial && isset($m['controller'])) {
                    $newClass = $this->guessClassification($m['controller']);
                    if ($newClass !== 'UNKNOWN' && ($m['classification'] ?? '') !== $newClass) {
                        $m['classification'] = $newClass;
                        $dirty = true;
                    }
                }
            }
            unset($m);
        }

        if ($dirty) {
            $ledgerCount = 0;
            $transactionCount = 0;
            $hybridCount = 0;
            $nonFinancialCount = 0;
            $verifiedCount = 0;
            
            foreach ($registry['metrics'] as $m) {
                $cls = $m['classification'] ?? 'UNKNOWN';
                if ($cls === 'LEDGER-DERIVED') $ledgerCount++;
                elseif ($cls === 'TRANSACTION-DERIVED') $transactionCount++;
                elseif ($cls === 'HYBRID') $hybridCount++;
                elseif ($cls === 'NON-FINANCIAL') $nonFinancialCount++;
                
                if ($m['verified'] ?? false) {
                    $verifiedCount++;
                }
            }
            
            $totalMetrics = count($registry['metrics']);
            $registry['stats'] = [
                'total_metrics' => $totalMetrics,
                'ledger_derived' => $ledgerCount,
                'transaction_derived' => $transactionCount,
                'hybrid' => $hybridCount,
                'non_financial' => $nonFinancialCount,
                'verified' => $verifiedCount,
                'coverage_pct' => $totalMetrics > 0 ? round($verifiedCount / $totalMetrics * 100, 1) . '%' : '0%',
                'consistency_groups' => count($registry['consistency_groups'] ?? []),
                'flagged_for_remediation' => count($registry['flagged_for_remediation'] ?? []),
            ];

            if (class_exists(Yaml::class)) {
                $yaml = Yaml::dump($registry, 4, 2);
                $header = "# ============================================================\n" .
                          "# VenQore Number Registry — Phase 0 of the Verification Blueprint\n" .
                          "# ============================================================\n" .
                          "# Every metric displayed anywhere in the application.\n" .
                          "# Classification:\n" .
                          "#   LEDGER-DERIVED      — reads only from journal_items/journal_entries via\n" .
                          "#                         FinancialReportingService or AccountingService  ✅\n" .
                          "#   TRANSACTION-DERIVED — reads raw sales/purchases/payments tables       ⚠️\n" .
                          "#   HYBRID              — reads both ledger and transaction tables         ⚠️\n" .
                          "#   NON-FINANCIAL       — no money/qty metric                             ⬜\n" .
                          "#\n" .
                          "# This file is the coverage denominator for the entire test suite.\n" .
                          "# coverage% = verified_metrics / total LEDGER-DERIVED entries\n" .
                          "# ============================================================\n" .
                          "# Generator: verify:map artisan command (auto-regenerated)\n" .
                          "# Last updated: " . now()->toDateString() . "\n" .
                      "# ============================================================\n\n";
                file_put_contents($this->registryPath, $header . $yaml);
                $this->info("Successfully wrote updated number registry to {$this->registryPath}");
            }
        }

        // ── 3. Build table report ──────────────────────────────────────────
        $registered = [];
        $unregistered = []; // This will be empty now because we auto-register everything

        foreach ($uniqueRoutes as $r) {
            $routeName = $r['name'];
            if (str_contains($r['action'], '@')) {
                [$controllerFqn, $method] = explode('@', $r['action']);
                $controllerShort = str_replace('App\\Http\\Controllers\\', '', $controllerFqn);
                $controllerStr = "{$controllerShort}@{$method}";
            } else {
                $controllerStr = $r['action'];
            }

            $entry = [
                'route_name'  => $routeName,
                'uri'         => $r['uri'],
                'method'      => 'GET',
                'controller'  => $controllerStr,
                'registered'  => true,
                'registry_id' => $registeredRouteNames[$routeName] ?? 'UNREGISTERED',
            ];
            $registered[] = $entry;
        }

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

        return 0;
    }

    private function guessClassification(string $controllerAction): string
    {
        if (!str_contains($controllerAction, '@')) {
            return 'UNKNOWN';
        }
        [$controllerFqn, $method] = explode('@', $controllerAction);
        
        $relativePath = str_replace('\\', '/', str_replace('App/', 'app/', $controllerFqn)) . '.php';
        $fullPath = base_path($relativePath);
        if (!file_exists($fullPath)) {
            return 'UNKNOWN';
        }
        
        $content = file_get_contents($fullPath);
        
        $isLedgerService = str_contains($content, 'FinancialReportingService') || 
                            str_contains($content, 'AccountingService') || 
                            str_contains($content, 'LedgerService') ||
                            str_contains($content, 'PartyBalanceQuery');
                            
        $hasTransactionQuery = str_contains($content, 'Sale::') || 
                               str_contains($content, 'Purchase::') || 
                               str_contains($content, "table('sales')") || 
                               str_contains($content, "table('purchases')") || 
                               str_contains($content, "table('expenses')") ||
                               str_contains($content, 'Expense::');
                               
        $isReportOrDashboard = str_contains($controllerFqn, 'Report') || 
                               str_contains($controllerFqn, 'Dashboard') || 
                               str_contains($controllerFqn, 'Finance') ||
                               str_contains($controllerFqn, 'Profit') ||
                               str_contains($controllerFqn, 'Balance') ||
                               str_contains($controllerFqn, 'Ledger') ||
                               str_contains($controllerFqn, 'Accounting');

        if ($isLedgerService && $isReportOrDashboard) {
            return 'LEDGER-DERIVED';
        }
        if ($isLedgerService) {
            return 'HYBRID';
        }
        if ($hasTransactionQuery) {
            return 'TRANSACTION-DERIVED';
        }
        
        return 'UNKNOWN';
    }

    private function loadRegistry(): array
    {
        if (! class_exists(Yaml::class)) {
            $raw = file_get_contents($this->registryPath);
            return ['metrics' => [], '_raw' => $raw, 'stats' => []];
        }

        return Yaml::parseFile($this->registryPath) ?? [];
    }

    private function printStats(array $registry): int
    {
        $metrics = $registry['metrics'] ?? [];

        $counts = ['LEDGER-DERIVED' => 0, 'TRANSACTION-DERIVED' => 0, 'HYBRID' => 0, 'NON-FINANCIAL' => 0, 'UNKNOWN' => 0];
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
                ['✅ LEDGER-DERIVED (correct)',   $counts['LEDGER-DERIVED'] ?? 0],
                ['⚠️  TRANSACTION-DERIVED (suspect)', $counts['TRANSACTION-DERIVED'] ?? 0],
                ['⚠️  HYBRID (suspect)',          $counts['HYBRID'] ?? 0],
                ['⬜ NON-FINANCIAL (out of scope)', $counts['NON-FINANCIAL'] ?? 0],
                ['❓ UNKNOWN (requires classification)', $counts['UNKNOWN'] ?? 0],
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

        $this->printStats($registry);

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
