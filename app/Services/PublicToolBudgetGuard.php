<?php

namespace App\Services;

use App\Models\PublicToolRequest;
use Carbon\Carbon;

class PublicToolBudgetGuard
{
    public function checkBudgetAndLimits(string $email, string $ipAddress, float $maxDailyBudget = 10.00): array
    {
        $todayStart = Carbon::today();

        // 1. Check Global Daily USD Budget Cap
        $todaySpend = PublicToolRequest::where('created_at', '>=', $todayStart)
            ->sum('cost_usd');

        if ($todaySpend >= $maxDailyBudget) {
            return [
                'allowed' => false,
                'reason'  => 'budget_exceeded',
                'message' => 'Daily free tool budget limit reached. Please join the waitlist or sign up for a free account.',
            ];
        }

        // 2. Check Per-Email Limit (3/day)
        $emailCount = PublicToolRequest::where('email', strtolower(trim($email)))
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

        return ['allowed' => true];
    }
}
