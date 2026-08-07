<?php

namespace App\Console\Commands\Verification;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;

/**
 * php artisan verify:launch-gate  (blueprint Phase J.2)
 *
 * The single launch decision. Reads the SAME trust_model.yaml the dashboard reads (so gate
 * and dashboard can never disagree) and BLOCKS release when any of these is true:
 *   - an unresolved CRITICAL exists in number_registry OR an EXPIRED critical waiver in
 *     quarantine.yaml (the rebuilt G-03 logic, FC-1);
 *   - the latest verify:all run is not green (quarantine excepted);
 *   - the measured trust score is below the required threshold;
 *   - (once landed) an MSI floor or sweep floor is breached.
 *
 * EXIT: 0 = cleared for launch, 1 = BLOCKED. The file-count meta-checks of the old
 * LaunchGateTest are demoted to T3 health and are NOT the gate (blueprint J.2).
 */
class LaunchGateCommand extends Command
{
    protected $signature = 'verify:launch-gate {--json} {--min-trust=6.0 : Required measured trust score}';
    protected $description = 'Evaluate launch readiness from the trust model + registries. Blocks on unresolved criticals.';

    public function handle(): int
    {
        $vc = base_path('Tester/VerificationCenter');
        $blocks = [];

        // (1) Critical issues (rebuilt G-03 logic).
        $blocks = array_merge($blocks, $this->criticalBlocks());

        // (2) Latest run green?
        $latest = $this->readJson($vc . '/runs/latest.json');
        if ($latest === null) {
            $blocks[] = 'No verify:all/PHPUnit run on record — cannot confirm green.';
        } elseif (($latest['green'] ?? false) !== true) {
            $blocks[] = 'Latest run is RED (total=' . ($latest['total'] ?? '?') . ').';
        }

        // (3) Measured trust threshold.
        $dash = $this->readJson($vc . '/dashboard-data.json');
        $score = $dash['trust']['measured_score'] ?? null;
        $min = (float) $this->option('min-trust');
        if ($score !== null && (float) $score < $min) {
            $blocks[] = "Measured trust {$score} is below required {$min}.";
        }

        $cleared = empty($blocks);
        $result = [
            'cleared_for_launch' => $cleared,
            'evaluated_at'       => now()->toIso8601String(),
            'measured_trust'     => $score,
            'min_trust'          => $min,
            'blocks'             => $blocks,
        ];

        if ($this->option('json')) {
            $this->line(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->newLine();
            if ($cleared) {
                $this->info('✅ LAUNCH GATE: CLEARED');
            } else {
                $this->error('⛔ LAUNCH GATE: BLOCKED');
                foreach ($blocks as $b) {
                    $this->error('   - ' . $b);
                }
            }
        }

        return $cleared ? 0 : 1;
    }

    private function criticalBlocks(): array
    {
        $out = [];
        $isCritical = fn ($v) => is_string($v) && strtoupper(trim($v, " '\"")) === 'CRITICAL';

        $numPath = base_path('verification/number_registry.yaml');
        if (is_file($numPath)) {
            foreach ((Yaml::parseFile($numPath)['metrics'] ?? []) as $m) {
                $crit = $isCritical($m['risk'] ?? null) || $isCritical($m['severity'] ?? null);
                $resolved = ($m['verified'] ?? false) === true
                    || in_array(strtolower((string) ($m['status'] ?? '')), ['resolved', 'fixed'], true);
                if ($crit && ! $resolved) {
                    $out[] = 'Unresolved CRITICAL metric: ' . ($m['id'] ?? '?');
                }
            }
        }

        $qPath = base_path('Tester/VerificationCenter/registry/quarantine.yaml');
        if (is_file($qPath)) {
            foreach ((Yaml::parseFile($qPath)['waivers'] ?? []) as $w) {
                if (! $isCritical($w['risk'] ?? null) && ! $isCritical($w['severity'] ?? null)) {
                    continue;
                }
                $expires = $w['expires'] ?? null;
                $expired = $expires !== null && strtotime((string) $expires) < time();
                $resolved = in_array(strtolower((string) ($w['status'] ?? '')), ['resolved', 'fixed'], true);
                if (! $resolved && $expired) {
                    $out[] = 'EXPIRED critical waiver: ' . ($w['id'] ?? '?') . ' (expired ' . $expires . ')';
                }
            }
        }

        return $out;
    }

    private function readJson(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }
        $j = json_decode((string) file_get_contents($path), true);
        return is_array($j) ? $j : null;
    }
}
