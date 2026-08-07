<?php

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckHostedUntilExpiryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = now();

        $expiringTenants = Tenant::whereNotNull('hosted_until')
            ->where('hosted_until', '<=', $now->copy()->addDays(60))
            ->get();

        foreach ($expiringTenants as $tenant) {
            $daysLeft = (int) $now->diffInDays($tenant->hosted_until, false);

            if ($daysLeft === 60 || $daysLeft === 30 || $daysLeft === 7) {
                Log::info("CheckHostedUntilExpiryJob: Store '{$tenant->slug}' (ID: {$tenant->id}) hosting expires in {$daysLeft} days on {$tenant->hosted_until->toDateString()}.");
                
                $owner = \App\Models\User::where('tenant_id', $tenant->id)->orderBy('id')->first();
                if ($owner && !empty($owner->email)) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($owner->email)
                            ->send(new \App\Mail\SubscriptionExpiryReminderMail($tenant, $owner, $daysLeft));
                    } catch (\Throwable $e) {
                        Log::error("CheckHostedUntilExpiryJob: Failed to send expiry email for tenant {$tenant->id}: " . $e->getMessage());
                    }
                }
            } elseif ($daysLeft <= 0) {
                Log::warning("CheckHostedUntilExpiryJob: Store '{$tenant->slug}' (ID: {$tenant->id}) hosting EXPIRED on {$tenant->hosted_until->toDateString()}. Write operations restricted.");
            }
        }
    }
}
