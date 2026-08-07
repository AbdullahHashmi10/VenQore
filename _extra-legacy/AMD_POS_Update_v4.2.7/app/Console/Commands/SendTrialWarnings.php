<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Illuminate\Support\Facades\Mail;
use App\Mail\TrialReminderMail;
use Carbon\Carbon;

class SendTrialWarnings extends Command
{
    protected $signature = 'venqore:trial-warnings';
    protected $description = 'Send automated 7-day and 2-day trial expiration warnings';

    public function handle()
    {
        $tenants = Tenant::where('status', 'trial')->whereNotNull('trial_ends_at')->get();

        foreach ($tenants as $tenant) {
            $daysLeft = Carbon::now()->diffInDays(Carbon::parse($tenant->trial_ends_at), false);
            
            // Allow a small window to avoid missing the day
            // Usually we'd use whereDate but this handles timezones better for now
            $daysLeftCeil = ceil($daysLeft);

            if ($daysLeftCeil == 7 || $daysLeftCeil == 2) {
                // Find owner
                $owner = $tenant->owner();
                if ($owner) {
                    Mail::to($owner->email)->send(new TrialReminderMail($tenant, $owner, (int)$daysLeftCeil));
                    $this->info("Sent {$daysLeftCeil}-day warning to {$owner->email} for store {$tenant->slug}");
                }
            }
        }
        
        $this->info('Trial warnings processed.');
    }
}
