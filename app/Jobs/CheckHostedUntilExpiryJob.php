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
            // hosted_until is not date-cast on Tenant — parse it before calling
            // Carbon methods on it (->toDateString() on the raw string was fatal).
            $hostedUntil = \Illuminate\Support\Carbon::parse($tenant->hosted_until);
            $daysLeft = (int) $now->diffInDays($hostedUntil, false);

            if ($daysLeft === 60 || $daysLeft === 30 || $daysLeft === 7) {
                Log::info("CheckHostedUntilExpiryJob: Store '{$tenant->slug}' (ID: {$tenant->id}) hosting expires in {$daysLeft} days on {$hostedUntil->toDateString()}.");
                
                // users has no tenant_id column — the owner is found through the
                // tenant_users membership (was a SQL error for every expiring store).
                $ownerId = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                    ->whereNotNull('user_id')
                    ->where('status', 'active')
                    ->orderByRaw("CASE WHEN role = 'owner' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END")
                    ->orderBy('id')
                    ->value('user_id');
                $owner = $ownerId ? \App\Models\User::find($ownerId) : null;
                if ($owner && !empty($owner->email)) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($owner->email)
                            ->send(new \App\Mail\SubscriptionExpiryReminderMail($tenant, $owner, $daysLeft));
                    } catch (\Throwable $e) {
                        Log::error("CheckHostedUntilExpiryJob: Failed to send expiry email for tenant {$tenant->id}: " . $e->getMessage());
                    }
                }
            } elseif ($daysLeft <= 0) {
                Log::warning("CheckHostedUntilExpiryJob: Store '{$tenant->slug}' (ID: {$tenant->id}) hosting EXPIRED on {$hostedUntil->toDateString()}. Write operations restricted.");
            }
        }
    }
}
