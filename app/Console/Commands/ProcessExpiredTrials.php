<?php

namespace App\Console\Commands;

use App\Mail\TrialExpiredMail;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * ProcessExpiredTrials — Phase 2.4
 *
 * Scheduled hourly. Finds trials that ended in the past hour,
 * suspends them, and sends the trial-expired email.
 *
 * Runs hourly (not daily) so users aren't left in limbo longer than 1 hour
 * after their trial technically ends.
 *
 * Usage: php artisan tenants:process-expired-trials
 */
class ProcessExpiredTrials extends Command
{
    protected $signature   = 'tenants:process-expired-trials';
    protected $description = 'Transition expired trials to the Solo free tier and send notification emails';

    public function handle(): void
    {
        $expiredTrials = Tenant::withoutTenantScope()
            ->where('status', 'trial')
            ->where('trial_ends_at', '<', now())
            ->get();

        if ($expiredTrials->isEmpty()) {
            $this->line('No expired trials to process.');
            return;
        }

        foreach ($expiredTrials as $tenant) {
            // Drop cleanly to Solo free plan so trading and data remain functional
            \App\Services\PlanDowngradeService::dropToSolo($tenant);

            $adminUser = $tenant->ownerUser();

            if ($adminUser) {
                try {
                    Mail::to($adminUser->email)
                        ->send(new TrialExpiredMail($tenant, $adminUser));

                    Log::info("Trial transitioned to Solo free tier: {$tenant->slug}");
                } catch (\Throwable $e) {
                    Log::error("Failed to send trial transition email to {$adminUser->email}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $this->info("✓ Transitioned to Solo: {$tenant->slug}");
        }

        $this->info("Processed {$expiredTrials->count()} expired trial(s).");
    }
}
