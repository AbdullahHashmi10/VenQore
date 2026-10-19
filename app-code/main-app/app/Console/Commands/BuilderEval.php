<?php

namespace App\Console\Commands;

use App\Services\Builder\AiFactReader;
use App\Services\Builder\BuilderEngine;
use App\Services\Builder\BuilderPolicy;
use App\Services\Builder\CapabilityGate;
use Illuminate\Console\Command;

/**
 * Scores how well the builder LISTENS, against config/builder/eval_cases.php.
 *
 *   php artisan builder:eval            keyword rules only — free, run it on every change
 *   php artisan builder:eval --live     with the real AI reader (one flash-lite call per case, cached a day)
 *   php artisan builder:eval --only=7   one case, with detail
 *
 * A case fails when an expected fact is missing or wrong, an `absent` fact was
 * invented, or a `never_ask` screen was shown (we asked what they already said).
 */
class BuilderEval extends Command
{
    protected $signature = 'builder:eval {--live : Use the real AI reader} {--only= : Run one case by index}';

    protected $description = 'Score the signup builder against a set of real-world business descriptions';

    public function handle(BuilderPolicy $policy): int
    {
        $calls = 0;
        $ai = null;
        if ($this->option('live')) {
            $reader = app(AiFactReader::class);
            $ai = function (string $t, string $c = '') use ($reader, &$calls) {
                $calls++;

                return $reader($t, $c);
            };
        }
        $engine = new BuilderEngine($policy, new CapabilityGate($policy), $ai);
        $cases = (array) config('builder.eval_cases', []);
        $only = $this->option('only');
        $pass = 0;
        $run = 0;

        foreach ($cases as $i => $c) {
            if ($only !== null && (int) $only !== $i) {
                continue;
            }
            $run++;
            $s = $engine->start($c['t']);
            $engine->resolveConfirmCard($s, true);
            $asked = [];
            for ($n = 0; $n < 12; $n++) {
                $step = $engine->step($s);
                if (! empty($step['done'])) {
                    break;
                }
                foreach ($step['screen']['panels'] as $p) {
                    $asked[] = $p['id'] . ($p['id'][0] === 'A' ? ' "' . $p['title'] . '"' : '');
                }
                $engine->answer($s, $step['screen']['screen_id'], $step['screen']['version'], [], false, true);
            }

            $problems = [];
            foreach ((array) ($c['expect'] ?? []) as $fact => $want) {
                $got = $s->facts->isNegative($fact) ? false : $s->facts->value($fact);
                if ($got !== $want) {
                    $problems[] = "missed {$fact}=" . var_export($want, true) . ' (got ' . var_export($got, true) . ')';
                }
            }
            foreach ((array) ($c['absent'] ?? []) as $fact) {
                if ($s->facts->isTrue($fact)) {
                    $problems[] = "invented {$fact}";
                }
            }
            $askedIds = array_map(fn ($a) => strtok($a, ' '), $asked);
            foreach ((array) ($c['never_ask'] ?? []) as $q) {
                if (in_array($q, $askedIds, true)) {
                    $problems[] = "re-asked {$q}";
                }
            }

            if (! $problems) {
                $pass++;
            }
            if ($problems || $only !== null) {
                $this->line(($problems ? '<fg=red>FAIL</>' : '<fg=green>PASS</>') . " #{$i}  {$c['t']}");
                foreach ($problems as $p) {
                    $this->line("       - {$p}");
                }
                if ($s->heard) {
                    $this->line("       heard: {$s->heard}");
                }
                $this->line('       asked: ' . ($asked ? implode(' → ', $asked) : '(nothing)'));
            }
        }

        $this->newLine();
        $this->info("{$pass}/{$run} cases understood" . ($this->option('live') ? ' (live AI)' : ' (keyword rules only)'));
        if ($this->option('live')) {
            $est = (float) config('ai_models.config_ai.est_cost_usd', 0.001);
            $this->line("AI calls made: {$calls} (cached repeats are free); budgeted at most \$" . number_format($calls * $est, 4));
        }

        return self::SUCCESS;
    }
}
