<?php

namespace App\Console\Commands;

use App\Services\Builder\BuilderEngine;
use Illuminate\Console\Command;

/**
 * Plan §13 phase 7 — "Builder Playground": type a business, see the facts, the
 * next screen and why, and the composition with reasons.
 *
 *   php artisan builder:playground "I run a grocery with one shop" --type=grocery
 *   php artisan builder:playground --type=plumber --answer=Q2s.job_tracked,Q2s.bill --answer=Q3.work_materials
 *
 * Each --answer is the option ids for ONE screen, in the order screens appear;
 * screens with no answer left are skipped.
 */
class BuilderPlayground extends Command
{
    protected $signature = 'builder:playground {sentence? : What the owner typed} {--type= : Business type key} {--preset= : Preset key} {--answer=* : Comma-separated option ids for one screen}';

    protected $description = 'Walk the signup builder v2 from the terminal and explain every decision';

    public function handle(BuilderEngine $engine): int
    {
        $s = $engine->start($this->argument('sentence'), $this->option('type') ?: null, $this->option('preset') ?: null);
        $answers = array_map(fn ($a) => array_filter(explode(',', $a)), (array) $this->option('answer'));

        if ($card = $engine->confirmCard($s)) {
            $this->info('Confirmation card:');
            foreach ($card['items'] as $i) {
                $this->line("  - {$i['text']}  [{$i['fact']}]");
            }
            $engine->resolveConfirmCard($s, true);
        }

        for ($n = 0; $n < 12; $n++) {
            $step = $engine->step($s);
            if (! empty($step['done'])) {
                $this->info('No more essential questions.');
                break;
            }
            $sc = $step['screen'];
            $this->newLine();
            $this->info("Screen {$sc['number']} (band {$sc['band']}, ~{$sc['estimate_remaining']} more): " . implode(' + ', array_column($sc['panels'], 'title')));
            foreach ($sc['panels'] as $p) {
                foreach ($p['options'] as $o) {
                    $this->line("    {$o['id']}  {$o['label']}");
                }
            }
            $pick = array_shift($answers);
            $this->line($pick ? '  → answered: ' . implode(', ', $pick) : '  → skipped');
            $engine->answer($s, $sc['screen_id'], $sc['version'], $pick ?: [], false, ! $pick);
        }

        $this->newLine();
        $this->info('Facts:');
        foreach ($s->facts->all() as $k => $r) {
            $v = is_bool($r['value']) ? ($r['value'] ? 'true' : 'false') : $r['value'];
            $this->line(sprintf('  %-28s %-8s %-14s %s', $k, $v, $r['status'], $r['source'] . ($r['asked'] ? " ({$r['asked']})" : '')));
        }

        $review = $engine->review($s);
        $this->newLine();
        $this->info($review['label']);
        $this->line($review['summary'] ?: '(nothing confirmed yet)');
        foreach ($engine->composer->compose($s)['areas'] as $a) {
            $this->newLine();
            $this->line("<options=bold>{$a['name']}</>");
            foreach ($a['modules'] as $m) {
                $this->line("  {$m['key']}" . ($m['assumed'] ? '  (assumed)' : ''));
                foreach ($m['reasons'] as $r) {
                    $this->line("      · {$r['text']}");
                }
            }
        }
        foreach (['assumptions' => 'We assumed', 'not_included' => 'Not included', 'gaps' => 'Coming soon'] as $k => $title) {
            if ($review[$k]) {
                $this->newLine();
                $this->info($title . ':');
                foreach ($review[$k] as $row) {
                    $this->line('  - ' . ($row['text'] ?? $row['reason'] ?? $row['label'] ?? json_encode($row)));
                }
            }
        }

        return self::SUCCESS;
    }
}
