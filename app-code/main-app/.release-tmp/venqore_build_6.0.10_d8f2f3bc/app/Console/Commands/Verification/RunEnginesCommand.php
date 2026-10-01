<?php

namespace App\Console\Commands\Verification;

use Illuminate\Console\Command;
use Tests\Feature\Golden\Verification\Engines\LedgerHealthEngine;
use Tests\Feature\Golden\Verification\Engines\LedgerComparisonEngine;
use Tests\Feature\Golden\Verification\Engines\ConsistencyEngine;
use Tests\Feature\Golden\Verification\Engines\SourceOfTruthEngine;
use Tests\Feature\Golden\Verification\Engines\TraceabilityEngine;
use Tests\Feature\Golden\Verification\Engines\BlastRadiusEngine;
use Tests\Feature\Golden\Verification\Engines\RootCauseEngine;
use Tests\Feature\Golden\Verification\Engines\ContradictionEngine;
use Tests\Feature\Golden\Verification\Engines\ConfidenceEngine;
use Tests\Feature\Golden\Verification\Engines\EvidencePackGenerator;

class RunEnginesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verify:engines {--file= : Path to the verification_claims.jsonl file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run Golden Verification Engines over the claim log';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $file = $this->option('file') ?: storage_path('logs/verification_claims.jsonl');

        if (!file_exists($file)) {
            $this->error("Claims file not found: {$file}");
            $this->info("Run the Golden Tests first (php artisan test --filter Golden) to generate claims.");
            return 1;
        }

        $this->info("Loading claims from {$file}...");
        
        $claims = [];
        $handle = fopen($file, "r");
        if ($handle) {
            while (($line = fgets($handle)) !== false) {
                $claims[] = json_decode($line, true);
            }
            fclose($handle);
        } else {
            $this->error("Error opening file.");
            return 1;
        }

        $this->info("Loaded " . count($claims) . " claims.");
        $this->line("");

        // 1. Run Ledger Health Engine
        $this->info("--- Phase B: Ledger Health Engine ---");
        $healthEngine = new LedgerHealthEngine($claims);
        $healthResult = $healthEngine->run();

        if ($healthResult['status'] === 'HEALTHY') {
            $this->info("Ledger Health: [ HEALTHY ]");
        } else {
            $this->error("Ledger Health: [ UNHEALTHY ]");
            $this->warn("Broken Invariants:");
            foreach ($healthResult['broken_invariants'] as $broken) {
                $this->line("  - " . $broken['metric'] . ": Expected " . $broken['expected_value'] . ", Actual " . $broken['actual_value']);
            }
        }
        $this->line("");

        // 2. Run Ledger Comparison Engine
        $this->info("--- Phase B: Ledger Comparison Engine ---");
        $comparisonEngine = new LedgerComparisonEngine($claims);
        $comparisonResults = $comparisonEngine->run();

        $agree = 0;
        $partialAgree = 0;
        $disagree = 0;

        foreach ($comparisonResults as $res) {
            if ($res['status'] === 'AGREE') {
                $agree++;
            } elseif ($res['status'] === 'PARTIAL-AGREE') {
                $partialAgree++;
            } elseif ($res['status'] === 'DISAGREE') {
                $disagree++;
            }
        }

        $this->line("Comparison Results:");
        $this->line("  AGREE:         " . $agree);
        $this->line("  PARTIAL-AGREE: " . $partialAgree);
        $this->line("  DISAGREE:      " . $disagree);
        
        if ($disagree > 0) {
            $this->error("Some comparisons failed.");
        } else {
            $this->info("All non-health comparisons passed successfully.");
        }
        $this->line("");

        // 3. Run Consistency Engine
        $this->info("--- Phase C: Consistency Engine ---");
        $consistencyEngine = new ConsistencyEngine($claims);
        $consistencyGroups = $consistencyEngine->run();

        $consistentGroups = 0;
        $inconsistentGroups = 0;

        foreach ($consistencyGroups as $group) {
            if ($group['status'] === 'CONSISTENT') {
                $consistentGroups++;
            } else {
                $inconsistentGroups++;
                $this->warn("  [INCONSISTENT] " . $group['name']);
            }
        }

        $this->line("Consistency Results:");
        $this->line("  CONSISTENT GROUPS:   " . $consistentGroups);
        $this->line("  INCONSISTENT GROUPS: " . $inconsistentGroups);
        $this->line("");

        // 4. Run Source Of Truth Engine
        $this->info("--- Phase C: Source Of Truth Detection ---");
        $sotEngine = new SourceOfTruthEngine($claims);
        $sotResults = $sotEngine->run();

        foreach ($sotResults as $res) {
            $tag = str_pad("[ {$res['status']} ]", 25);
            if ($res['status'] === 'LEDGER-DERIVED') {
                $this->info("{$tag} {$res['surface']}");
            } else {
                $this->error("{$tag} {$res['surface']}");
                $this->warn("    Evidence: {$res['evidence']}");
            }
        }
        $this->line("");

        // 5. Phase D: Traceability & Root Cause & Blast Radius
        $this->info("--- Phase D: Traceability & Root Cause ---");
        $traceability = new TraceabilityEngine();
        $this->info("Generated static call graph spanning " . count($traceability->getGraph()) . " controllers.");

        // Identify failing claims for root cause analysis
        $failingClaims = [];
        
        // Add failing comparison claims
        foreach ($comparisonResults as $res) {
            if ($res['status'] === 'DISAGREE') {
                $failingClaims[] = $res;
            }
        }
        // Add failing source of truth claims (just to have some test data)
        foreach ($sotResults as $res) {
            if ($res['status'] !== 'LEDGER-DERIVED') {
                $failingClaims[] = ['surface' => $res['surface'], 'metric' => 'Source Of Truth Violation'];
            }
        }

        $rootCauseEngine = new RootCauseEngine($traceability, $failingClaims);
        $rootCauses = $rootCauseEngine->run();

        if (empty($rootCauses)) {
            $this->info("No failed claims to analyze for root causes. Perfect health!");
        } else {
            $this->warn("Root Cause Candidates (Ranked):");
            foreach ($rootCauses as $idx => $cause) {
                $this->line(sprintf("  #%d: %s", $idx + 1, $cause['candidate']));
                $this->line(sprintf("      Symptoms: %d across %d distinct surfaces", $cause['symptoms'], count($cause['affected_surfaces'])));
                $this->line(sprintf("      Affected: %s", implode(', ', $cause['affected_surfaces'])));
            }
        }
        
        $this->line("");
        $this->info("--- Phase D: Blast Radius Analysis ---");
        $blastEngine = new BlastRadiusEngine($traceability);
        $targetService = 'FinancialReportingService';
        $impacted = $blastEngine->calculateRadius($targetService);
        
        $this->line("If you modify {$targetService}, the following surfaces must be re-verified:");
        if (empty($impacted)) {
            $this->line("  (None found in graph)");
        } else {
            foreach ($impacted as $ctrl) {
                $this->line("  - {$ctrl}");
            }
        }
        $this->line("");

        // 6. Phase E: Contradiction & Evidence Packs
        $this->info("--- Phase E: Contradiction Detection ---");
        $contradictionEngine = new ContradictionEngine($comparisonResults, $consistencyGroups);
        $contradictions = $contradictionEngine->run();

        if (empty($contradictions)) {
            $this->info("No contradictions detected among the groups.");
        } else {
            foreach ($contradictions as $cont) {
                $this->error("Contradiction in {$cont['group']}:");
                $this->warn("  {$cont['explanation']}");
            }
        }
        $this->line("");

        $this->info("--- Phase E: Evidence Packs ---");
        $confidenceEngine = new ConfidenceEngine();
        $packGenerator = new EvidencePackGenerator($rootCauses, $sotResults, $blastEngine, $confidenceEngine);

        if (empty($failingClaims)) {
            $this->info("0 Evidence Packs generated (No failures found).");
        } else {
            foreach ($failingClaims as $idx => $claim) {
                $pack = $packGenerator->generate($claim);
                $this->warn("Evidence Pack #" . ($idx + 1));
                $this->line("  Metric: " . $pack['metric']);
                $this->line("  Surface: " . $pack['surface']);
                $this->line("  Root Cause: " . $pack['root_cause_candidate'] . " (" . $pack['confidence_score'] . "% confidence)");
                $this->line("  SOT Verdict: " . $pack['source_of_truth_verdict']);
                $this->line("  Human Explanation: " . $pack['human_explanation']);
                $this->line("");
            }
        }

        return 0;
    }
}
