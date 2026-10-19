<?php

namespace App\Console\Commands;

use App\Services\Platform\PlanRestorer;
use Illuminate\Console\Command;

class RestoreCorePlans extends Command
{
    protected $signature = 'vq:plans:restore {slug? : One core plan to restore (trial, solo, starter, core, scale, custom). Omit to restore every missing one.}';

    protected $description = 'Re-create core plans deleted from Platform HQ, with their full limit set. Never edits existing plans.';

    public function handle(PlanRestorer $restorer): int
    {
        $slug = $this->argument('slug');

        if ($slug) {
            try {
                $done = $restorer->restore(strtolower($slug));
            } catch (\Throwable $e) {
                $this->error($e->getMessage());
                return self::FAILURE;
            }
            $this->info($done ? "Plan '{$slug}' restored." : "Plan '{$slug}' already exists — nothing changed.");
            return self::SUCCESS;
        }

        $missing = $restorer->missingCore();
        if (!$missing) {
            $this->info('All core plans are present. Nothing to do.');
            return self::SUCCESS;
        }

        $created = $restorer->restoreMissing();
        $this->info('Restored: ' . implode(', ', $created));

        return self::SUCCESS;
    }
}
