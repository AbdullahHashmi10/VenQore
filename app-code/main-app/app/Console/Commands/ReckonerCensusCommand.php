<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\Resolvers\ResolverRegistry;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ReckonerCensusCommand extends Command
{
    protected $signature = 'reckoner:census
                            {--tenant= : Tenant ID or slug (required)}
                            {--from=2026-08-01 : Start date for the window}
                            {--to=2026-08-31 : End date for the window}
                            {--format=md : Output format (md, json)}
                            {--output= : Optional file path to write markdown output}';

    protected $description = 'Audit and census all 349 Reckoner cards for a tenant';

    /**
     * Hand-computed expected values from Section 8.1 of RECKONER_TRUTH_REBUILD_PLAN.md
     */
    private const GOLDEN_EXPECTED = [
        'core.revenue' => 7700.0,
        'core.cogs' => 3200.0,
        'core.gross_profit' => 4500.0,
        'core.expenses_total' => 4000.0,
        'core.net_profit' => 500.0,
        'core.gross_margin_pct' => 58.44,
        'core.net_margin_pct' => 6.49,
        'core.expense_ratio' => 51.95,
        'core.revenue_vs_prev' => 285.0,
        'core.profit_vs_prev' => -700.0,
        'core.receivables' => 2500.0,
        'core.payables' => 3000.0,
        'core.total_liquidity' => 196200.0,
        'core.working_capital' => 201700.0,
        'core.net_cash_position' => 192700.0,
        'core.journal_entries_count' => 7.0,
        'core.reversal_count' => 1.0,
        'inventory.stock_value' => 6500.0,
        'inventory.units_on_hand' => 20.0,
        'bank.balances_total' => 48000.0,
        'bank.money_in' => 53000.0,
        'bank.money_out' => 5000.0,
        'payments.received' => 5700.0,
        'payments.paid' => 11500.0,
        'payments.net_flow' => -5800.0,
        'khata.receivable_total' => 2500.0,
        'khata.payable_total' => 3000.0,
        'khata.net_position' => -500.0,
        'khata.collected' => 3000.0,
        'purchases.unpaid_value' => 3000.0,
        'purchases.overdue_value' => 3000.0,
        'purchases.spend' => 2500.0,
        'purchases.count' => 1.0,
        'purchases.paid_to_suppliers' => 5000.0,
        'accounting.assets_total' => 205200.0,
        'accounting.liabilities_total' => 3500.0,
        'accounting.equity_total' => 201700.0,
        'tax.collected' => 500.0,
        'tax.paid' => 0.0,
        'tax.net_liability' => 500.0,
        'customers.owing' => 2500.0,
        'suppliers.owed_list' => 3000.0,
        'expenses.count' => 1.0,
        'expenses.unpaid' => 0.0,
        'accounting.trial_balance_ok' => 1.0,
        'core.balance_sheet_ok' => 1.0,
    ];

    public function handle(): int
    {
        $tenantIdentifier = $this->option('tenant');
        if (!$tenantIdentifier) {
            $this->error('Error: --tenant option is required (id or slug). Refusing to run without tenant context.');
            return 1;
        }

        $tenant = is_numeric($tenantIdentifier)
            ? Tenant::find($tenantIdentifier)
            : Tenant::where('slug', $tenantIdentifier)->first();

        if (!$tenant) {
            $this->error("Error: Tenant '{$tenantIdentifier}' not found.");
            return 1;
        }

        // Bind tenant into container
        app()->instance('current.tenant', $tenant);

        $user = $tenant->users()->first() ?? User::first();
        if (!$user) {
            $this->error("Error: No user found for tenant '{$tenant->name}' ({$tenant->id}).");
            return 1;
        }

        $from = $this->option('from') ?: '2026-08-01';
        $to = $this->option('to') ?: '2026-08-31';

        $this->info("Running Reckoner Census on tenant: {$tenant->name} (ID: {$tenant->id}, Slug: {$tenant->slug})");
        $this->info("Window: {$from} to {$to}");

        $cards = CardRegistry::all();
        $totalCards = count($cards);

        $reckoner = app(Reckoner::class);
        $rows = [];

        $dispatchCounts = ['Source' => 0, 'Resolver' => 0, 'Unmapped' => 0];
        $statusCounts = [];
        $contractCounts = ['unimplemented' => 0, 'implemented_unverified' => 0, 'verified' => 0];
        $verifiedAndMatching = 0;

        // Process in batches
        $chunks = array_chunk(array_keys($cards), Reckoner::MAX_BATCH);

        foreach ($chunks as $chunkKeys) {
            $requests = array_map(function ($k) use ($from, $to) {
                return new ReckonerRequest(
                    key: $k,
                    period: 'this_month',
                    custom: ['from' => $from, 'to' => $to]
                );
            }, $chunkKeys);

            $results = $reckoner->readMany($requests, $user, $tenant);

            foreach ($chunkKeys as $cardKey) {
                $card = $cards[$cardKey];
                $def = ReckonerRegistry::find($cardKey);

                // Dispatch path
                $sourceClass = $def['source'] ?? null;
                if ($sourceClass && class_exists($sourceClass)) {
                    $dispatch = 'Legacy Source';
                    $dispatchCounts['Source']++;
                } elseif (ResolverRegistry::has($cardKey)) {
                    $dispatch = 'Generic Resolver';
                    $dispatchCounts['Resolver']++;
                } else {
                    $dispatch = 'Unmapped';
                    $dispatchCounts['Unmapped']++;
                }

                // Contract state (Phase 0 baseline: cards are unimplemented)
                $contractState = $card['contract_state'] ?? 'unimplemented';
                $contractCounts[$contractState] = ($contractCounts[$contractState] ?? 0) + 1;

                // Find result
                $req = new ReckonerRequest($cardKey, 'this_month', custom: ['from' => $from, 'to' => $to]);
                $compId = $req->getCompositeId();
                $result = $results[$compId] ?? null;

                $status = $result ? $result->status : 'no_result';
                $statusCounts[$status] = ($statusCounts[$status] ?? 0) + 1;

                $actualValue = null;
                if ($result) {
                    if (is_numeric($result->value)) {
                        $actualValue = (float) $result->value;
                    } elseif (is_array($result->data) && isset($result->data['value']) && is_numeric($result->data['value'])) {
                        $actualValue = (float) $result->data['value'];
                    } elseif (is_numeric($result->data)) {
                        $actualValue = (float) $result->data;
                    }
                }

                $expected = self::GOLDEN_EXPECTED[$cardKey] ?? null;
                $match = '-';
                if ($expected !== null) {
                    if ($actualValue !== null && abs($actualValue - $expected) < 0.05 && $status === 'ok') {
                        $match = 'YES';
                        if ($contractState === 'verified') {
                            $verifiedAndMatching++;
                        }
                    } else {
                        $match = 'NO';
                    }
                }

                $rows[] = [
                    'key' => $cardKey,
                    'module' => $card['module'] ?? 'Qore',
                    'shape' => $card['shape'] ?? 'stat',
                    'dispatch' => $dispatch,
                    'contract' => $contractState,
                    'status' => $status,
                    'value' => $actualValue !== null ? $actualValue : ($status === 'empty' ? 'null' : '-'),
                    'expected' => $expected !== null ? $expected : '-',
                    'match' => $match,
                ];
            }
        }

        // Build Markdown content
        $md = [];
        $md[] = "# Reckoner Baseline Census Report";
        $md[] = "";
        $md[] = "**Date:** " . Carbon::now()->toIso8601String();
        $md[] = "**Tenant:** `{$tenant->name}` (ID: `{$tenant->id}`, Slug: `{$tenant->slug}`, Plan: `{$tenant->plan}`)";
        $md[] = "**Window:** `{$from}` to `{$to}`";
        $md[] = "";
        $md[] = "## 1. Summary Scorecard";
        $md[] = "";
        $md[] = "| Metric | Count / Status |";
        $md[] = "|---|---|";
        $md[] = "| **Total registered cards** | **{$totalCards}** |";
        $md[] = "| **Verified and matching golden** | **{$verifiedAndMatching} / {$totalCards}** |";
        $md[] = "| **Contract State: Unimplemented** | {$contractCounts['unimplemented']} |";
        $md[] = "| **Contract State: Implemented Unverified** | " . ($contractCounts['implemented_unverified'] ?? 0) . " |";
        $md[] = "| **Contract State: Verified** | " . ($contractCounts['verified'] ?? 0) . " |";
        $md[] = "| **Dispatch: Generic Resolver** | {$dispatchCounts['Resolver']} |";
        $md[] = "| **Dispatch: Legacy Source** | {$dispatchCounts['Source']} |";
        $md[] = "| **Dispatch: Unmapped** | {$dispatchCounts['Unmapped']} |";
        $md[] = "";
        $md[] = "### Envelope Status Breakdown";
        $md[] = "";
        $md[] = "| Status | Count | Meaning |";
        $md[] = "|---|---|---|";
        foreach ($statusCounts as $st => $c) {
            $desc = match($st) {
                'ok' => 'Resolver executed and reported success',
                'empty' => 'Resolver executed, reported empty/no data',
                'module_locked' => 'Gated by disabled module',
                'plan_locked' => 'Gated by subscription plan',
                'forbidden' => 'Gated by user permissions',
                'unavailable' => 'Contract not implemented or data not captured',
                'error', 'resolver_failed' => 'Resolver threw an error',
                default => 'Unknown / other',
            };
            $md[] = "| `{$st}` | **{$c}** | {$desc} |";
        }
        $md[] = "";
        $md[] = "## 2. All 349 Cards Census";
        $md[] = "";
        $md[] = "| # | Key | Module | Shape | Dispatch | Contract | Status | Value Today | Golden Expected | Match |";
        $md[] = "|---|---|---|---|---|---|---|---|---|---|";

        foreach ($rows as $idx => $r) {
            $num = $idx + 1;
            $valStr = is_float($r['value']) ? number_format($r['value'], 2) : (string)$r['value'];
            $expStr = is_float($r['expected']) ? number_format($r['expected'], 2) : (string)$r['expected'];
            $md[] = "| {$num} | `{$r['key']}` | {$r['module']} | {$r['shape']} | {$r['dispatch']} | {$r['contract']} | `{$r['status']}` | {$valStr} | {$expStr} | {$r['match']} |";
        }

        $outputMd = implode("\n", $md) . "\n";

        $outputPath = $this->option('output');
        if ($outputPath) {
            // Support absolute path or project relative path
            $target = (str_starts_with($outputPath, '/') || (strlen($outputPath) > 2 && $outputPath[1] === ':'))
                ? $outputPath
                : base_path($outputPath);
            @mkdir(dirname($target), 0777, true);
            file_put_contents($target, $outputMd);
            $this->info("Census markdown report saved to: {$target}");
        }

        if ($this->option('format') === 'json') {
            $this->line(json_encode([
                'total' => $totalCards,
                'verified_and_matching' => $verifiedAndMatching,
                'dispatch' => $dispatchCounts,
                'status' => $statusCounts,
                'rows' => $rows,
            ], JSON_PRETTY_PRINT));
        } else {
            $this->line($outputMd);
        }

        return 0;
    }
}
