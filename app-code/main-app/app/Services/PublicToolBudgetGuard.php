<?php

namespace App\Services;

use App\Models\PublicToolRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PublicToolBudgetGuard
{
    /**
     * Atomically check and reserve budget & rate limits using DB row-level locking.
     * Prevents race conditions under concurrent public requests.
     */
    public function checkAndReserve(string $email, string $ipAddress, float $estimatedCost = 0.0120, float $maxDailyBudget = 10.00): array
    {
        $todayStr   = Carbon::today()->toDateString();
        $todayStart = Carbon::today();
        $cleanEmail = strtolower(trim($email));

        return DB::transaction(function () use ($todayStr, $todayStart, $cleanEmail, $ipAddress, $estimatedCost, $maxDailyBudget) {
            // 1. Atomic Row-Level Lock on ai_spend_counters for public_tool scope
            $counter = DB::table('ai_spend_counters')
                ->where('scope', 'public_tool')
                ->where('day', $todayStr)
                ->lockForUpdate()
                ->first();

            $currentSpend = $counter ? (float) $counter->spend_usd : 0.0;

            if ($counter && ($counter->tripped || $currentSpend >= $maxDailyBudget)) {
                return [
                    'allowed' => false,
                    'reason'  => 'budget_exceeded',
                    'message' => 'Daily free tool budget limit reached. Please join the waitlist or sign up for a free account.',
                ];
            }

            if ($currentSpend + $estimatedCost > $maxDailyBudget) {
                return [
                    'allowed' => false,
                    'reason'  => 'budget_exceeded',
                    'message' => 'Daily free tool budget limit reached. Please join the waitlist or sign up for a free account.',
                ];
            }

            // 2. Check Per-Email Limit (3/day)
            $emailCount = PublicToolRequest::where('email', $cleanEmail)
                ->where('created_at', '>=', $todayStart)
                ->count();

            if ($emailCount >= 3) {
                return [
                    'allowed' => false,
                    'reason'  => 'email_limit_exceeded',
                    'message' => 'You have reached the daily limit of 3 free scans per email.',
                ];
            }

            // 3. Check Per-IP Limit (10/day)
            $ipCount = PublicToolRequest::where('ip_address', $ipAddress)
                ->where('created_at', '>=', $todayStart)
                ->count();

            if ($ipCount >= 10) {
                return [
                    'allowed' => false,
                    'reason'  => 'ip_limit_exceeded',
                    'message' => 'Your IP address has reached the limit of 10 free scans per day.',
                ];
            }

            // 4. Update / Insert Spend Counter under lock
            $newSpend = $currentSpend + $estimatedCost;
            $tripped  = $newSpend >= $maxDailyBudget;

            if ($counter) {
                DB::table('ai_spend_counters')
                    ->where('id', $counter->id)
                    ->update([
                        'spend_usd' => $newSpend,
                        'tripped'   => $tripped,
                    ]);
            } else {
                DB::table('ai_spend_counters')->insert([
                    'scope'     => 'public_tool',
                    'day'       => $todayStr,
                    'spend_usd' => $newSpend,
                    'cap_usd'   => $maxDailyBudget,
                    'tripped'   => $tripped,
                ]);
            }

            return ['allowed' => true];
        }, 3);
    }
}
