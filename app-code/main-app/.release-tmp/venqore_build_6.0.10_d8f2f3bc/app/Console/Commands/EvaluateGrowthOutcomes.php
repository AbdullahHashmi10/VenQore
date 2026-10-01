<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Growth\OutcomeEvaluator;
use App\Services\Growth\ThresholdTuner;
use Illuminate\Console\Command;

/**
 * growth:evaluate — grade past predictions and re-tune the engine.
 *
 * This is the command that makes the Growth Engine improve over time. It has
 * no V1 equivalent, because V1 never checked whether anything it said was
 * true.
 *
 * Deliberately separated from `growth:analyze` and scheduled at a different
 * hour: grading is read-mostly and cheap, generation is write-heavy. Keeping
 * them apart means a slow analysis pass can never delay the learning loop, and
 * an operator can re-grade history without regenerating anything.
 */
class EvaluateGrowthOutcomes extends Command
{
    protected $signature = 'growth:evaluate
        {--tenant= : Evaluate a single tenant}
        {--no-tune : Grade outcomes but do not adjust sensitivity}';

    protected $description = 'Grade Growth Engine predictions against what actually happened, then re-tune thresholds';

    public function handle(OutcomeEvaluator $evaluator, ThresholdTuner $tuner): int
    {
        $query = Tenant::query()->whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $query->where('id', $this->option('tenant'));
        }

        $tenants = $query->get(['id', 'name']);

        if ($tenants->isEmpty()) {
            $this->warn('No active tenants found.');
            return self::SUCCESS;
        }

        $totalGraded = $totalHits = $totalMisses = $totalMuted = $totalTuned = 0;

        foreach ($tenants as $tenant) {
            try {
                $result = $evaluator->evaluate($tenant->id);

                $tune = ['tuned' => 0, 'muted' => 0, 'unmuted' => 0];
                if (!$this->option('no-tune')) {
                    $tuner->reconcileIgnored($tenant->id);
                    $tune = $tuner->tune($tenant->id);
                }

                $totalGraded += $result['graded'];
                $totalHits   += $result['hits'];
                $totalMisses += $result['misses'];
                $totalTuned  += $tune['tuned'];
                $totalMuted  += $tune['muted'];

                if ($result['graded'] > 0 || $tune['tuned'] > 0) {
                    $precision = ($result['hits'] + $result['misses']) > 0
                        ? round($result['hits'] / ($result['hits'] + $result['misses']) * 100)
                        : null;

                    $this->line(sprintf(
                        '  [%d] %-26s graded %3d  hit %3d  miss %3d  %s  tuned %d  muted %d',
                        $tenant->id,
                        \Illuminate\Support\Str::limit($tenant->name, 24),
                        $result['graded'],
                        $result['hits'],
                        $result['misses'],
                        $precision !== null ? str_pad($precision . '%', 5, ' ', STR_PAD_LEFT) : '   — ',
                        $tune['tuned'],
                        $tune['muted']
                    ));
                }
            } catch (\Throwable $e) {
                $this->error("  [{$tenant->id}] failed: " . $e->getMessage());
            }
        }

        $this->newLine();

        if ($totalGraded === 0) {
            $this->comment('Nothing was due for grading. Predictions become gradeable only after their horizon passes.');
            return self::SUCCESS;
        }

        $overall = ($totalHits + $totalMisses) > 0
            ? round($totalHits / ($totalHits + $totalMisses) * 100, 1)
            : 0;

        $this->info("Graded {$totalGraded} predictions — {$totalHits} correct, {$totalMisses} wrong ({$overall}% precision).");
        $this->info("Adjusted {$totalTuned} insight thresholds, muted {$totalMuted} under-performing insight types.");

        return self::SUCCESS;
    }
}
