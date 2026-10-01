<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * CustomerLoyaltyStream: Pure tenant-explicit reader for customers, loyalty balances, gift cards,
 * pricing tiers, staff attendance, and services.
 */
class CustomerLoyaltyStream
{
    // ── Customers ──────────────────────────────────────────────────────────────

    /**
     * Customer summary: count, active, new, repeat rate, owing.
     */
    public function customerSummary(string $from, string $to, int|string $tenantId): array
    {
        // Use parties table (type=customer), excluding anonymous walk-in customers
        $base = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->where('name', 'not like', '%Walk-in%')
            ->whereNull('deleted_at');

        $totalCount = (int) $base->count();
        $activeCount = (int) (clone $base)->where('is_active', 1)->count();
        if ($activeCount === 0) {
            $activeCount = (int) DB::table('sales')
                ->join('parties', 'sales.party_id', '=', 'parties.id')
                ->where('sales.tenant_id', $tenantId)
                ->where('parties.type', 'customer')
                ->where('parties.name', 'not like', '%Walk-in%')
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->distinct('sales.party_id')
                ->count('sales.party_id');
        }

        // New customers in date range (created_at within range, or first transaction in period)
        $newCount = (int) (clone $base)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->count();
        if ($newCount === 0) {
            $newCount = (int) DB::table('sales')
                ->join('parties', 'sales.party_id', '=', 'parties.id')
                ->where('sales.tenant_id', $tenantId)
                ->where('parties.type', 'customer')
                ->where('parties.name', 'not like', '%Walk-in%')
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->distinct('sales.party_id')
                ->count('sales.party_id');
        }

        // Customers owing (from AR journal items, or party current_balance)
        $owing = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('ji.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $to)
            ->where(function ($q) {
                $q->where('a.role', 'ar')->orWhere('a.code', '1200');
            })
            ->sum(DB::raw('ji.debit - ji.credit')) ?? 0.0;
        if ($owing <= 0) {
            $owing = (float) ((clone $base)
                ->where('opening_balance_type', 'receivable')
                ->where('current_balance', '>', 0)
                ->sum('current_balance') ?? 0.0);
        }

        // Repeat rate: customers who appear in more than one sale in the period
        // Use sales table filtered by tenant
        try {
            $repeatCount = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->whereNotNull('party_id')
                ->select('party_id')
                ->groupBy('party_id')
                ->havingRaw('COUNT(*) > 1')
                ->count();

            $totalBuyers = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->whereNotNull('party_id')
                ->distinct('party_id')
                ->count('party_id');

            $repeatRate = $totalBuyers > 0 ? round($repeatCount / $totalBuyers * 100, 2) : 0.0;
        } catch (\Exception $e) {
            $repeatRate = null;
        }

        return [
            'count'       => $totalCount,
            'active'      => $activeCount,
            'new'         => $newCount,
            'owing'       => $owing,
            'repeat_rate' => $repeatRate,
        ];
    }

    /**
     * Customers by area / category.
     */
    public function customersByArea(int|string $tenantId): array
    {
        $rows = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->whereNull('deleted_at')
            ->whereNotNull('category')
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->toArray();

        return array_map(fn($r) => ['area' => $r->category, 'count' => (int)$r->count], $rows);
    }

    // ── Pricing Tiers ─────────────────────────────────────────────────────────

    /**
     * Pricing tier summary from customers table (has pricing_tier column).
     */
    public function pricingTierSummary(string $from, string $to, int|string $tenantId): array
    {
        // customers table has pricing_tier column
        try {
            $tierRows = DB::table('customers')
                ->where('tenant_id', $tenantId)
                ->whereNull('deleted_at')
                ->whereNotNull('pricing_tier')
                ->selectRaw('pricing_tier, COUNT(*) as customer_count')
                ->groupBy('pricing_tier')
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            $tierRows = [];
        }

        $tierCount = count($tierRows);
        $byTier = array_map(fn($r) => [
            'tier'   => $r->pricing_tier,
            'count'  => (int)$r->customer_count,
        ], $tierRows);

        // Revenue by tier: join sales with customers
        try {
            $revenueByTier = DB::table('sales')
                ->join('customers', function ($join) use ($tenantId) {
                    $join->on('sales.party_id', '=', 'customers.party_id')
                         ->where('customers.tenant_id', $tenantId)
                         ->whereNull('customers.deleted_at');
                })
                ->where('sales.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->whereNotNull('customers.pricing_tier')
                ->selectRaw('customers.pricing_tier, SUM(sales.net_sales) as revenue')
                ->groupBy('customers.pricing_tier')
                ->get()
                ->toArray();

            $revenueByTier = array_map(fn($r) => [
                'tier'    => $r->pricing_tier,
                'revenue' => (float)$r->revenue,
            ], $revenueByTier);
        } catch (\Exception $e) {
            $revenueByTier = [];
        }

        return [
            'tier_count'      => $tierCount,
            'by_tier'         => $byTier,
            'revenue_by_tier' => $revenueByTier,
        ];
    }

    // ── Loyalty ───────────────────────────────────────────────────────────────

    /**
     * Loyalty balances summary.
     */
    public function loyaltySummary(string $from, string $to, int|string $tenantId): array
    {
        // loyalty_balances table: tenant_id, party_id, balance, lifetime_earned, lifetime_redeemed
        $memberCount = (int) DB::table('loyalty_balances')
            ->where('tenant_id', $tenantId)
            ->where('balance', '>', 0)
            ->count();

        $totalLiability = (float) (DB::table('loyalty_balances')
            ->where('tenant_id', $tenantId)
            ->sum('balance') ?? 0.0);

        $lifetimeEarned = (float) (DB::table('loyalty_balances')
            ->where('tenant_id', $tenantId)
            ->sum('lifetime_earned') ?? 0.0);

        $lifetimeRedeemed = (float) (DB::table('loyalty_balances')
            ->where('tenant_id', $tenantId)
            ->sum('lifetime_redeemed') ?? 0.0);

        // New members in period: joined via loyalty_balances created_at
        $newMembers = (int) DB::table('loyalty_balances')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->count();

        // Member revenue share: sales linked to loyalty members (party_id in loyalty_balances)
        try {
            $memberPartyIds = DB::table('loyalty_balances')
                ->where('tenant_id', $tenantId)
                ->pluck('party_id');

            $totalRevenue = (float) (DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->sum('net_sales') ?? 0.0);

            $memberRevenue = (float) (DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->whereIn('party_id', $memberPartyIds)
                ->sum('net_sales') ?? 0.0);

            $memberRevenueShare = $totalRevenue > 0 ? round($memberRevenue / $totalRevenue * 100, 2) : 0.0;
            $memberAvgSpend = count($memberPartyIds) > 0
                ? round($memberRevenue / count($memberPartyIds), 2)
                : 0.0;
        } catch (\Exception $e) {
            $memberRevenueShare = 0.0;
            $memberAvgSpend = 0.0;
        }

        return [
            'member_count'         => $memberCount,
            'new_members'          => $newMembers,
            'liability'            => $totalLiability,
            'lifetime_earned'      => $lifetimeEarned,
            'lifetime_redeemed'    => $lifetimeRedeemed,
            'member_revenue_share' => $memberRevenueShare,
            'member_avg_spend'     => $memberAvgSpend,
        ];
    }

    // ── Gift Cards ────────────────────────────────────────────────────────────

    /**
     * Gift card summary.
     */
    public function giftCardSummary(int|string $tenantId): array
    {
        // gift_cards: id, tenant_id, code, initial_value, current_balance, status, expires_at
        $activeBalance = (float) (DB::table('gift_cards')
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->sum('current_balance') ?? 0.0);

        $totalIssued = (float) (DB::table('gift_cards')
            ->where('tenant_id', $tenantId)
            ->sum('initial_value') ?? 0.0);

        $activeCount = (int) DB::table('gift_cards')
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->count();

        $expiringSoon = (int) DB::table('gift_cards')
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->where('current_balance', '>', 0)
            ->whereBetween('expires_at', [now(), now()->addDays(30)])
            ->count();

        return [
            'active_balance' => $activeBalance,
            'total_issued'   => $totalIssued,
            'active_count'   => $activeCount,
            'expiring_soon'  => $expiringSoon,
        ];
    }

    // ── Staff Attendance ──────────────────────────────────────────────────────

    /**
     * Staff attendance metrics.
     */
    public function staffAttendanceSummary(string $from, string $to, int|string $tenantId): array
    {
        // staff_attendances: tenant_id, user_id, check_in, check_out, total_gap_minutes, status
        $base = DB::table('staff_attendances')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(check_in)'), [$from, $to]);

        // Today's attendance
        $today = now()->toDateString();
        $presentToday = (int) DB::table('staff_attendances')
            ->where('tenant_id', $tenantId)
            ->whereDate('check_in', $today)
            ->distinct('user_id')
            ->count('user_id');

        // Total distinct staff
        $memberCount = (int) DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->count();
        if ($memberCount === 0) {
            $memberCount = (int) DB::table('staff_attendances')
                ->where('tenant_id', $tenantId)
                ->distinct('user_id')
                ->count('user_id');
        }

        // On shift now (checked in but not checked out)
        $onShift = (int) DB::table('staff_attendances')
            ->where('tenant_id', $tenantId)
            ->whereNull('check_out')
            ->whereDate('check_in', $today)
            ->count();

        // Hours worked in period
        $hoursWorked = (float) ((clone $base)
            ->whereNotNull('check_out')
            ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, check_in, check_out) / 60 - COALESCE(total_gap_minutes, 0) / 60) as hours')
            ->value('hours') ?? 0.0);

        // Attendance rate: present_days / (expected_days * staff_count)
        $totalDays = (int) (clone $base)->distinct('user_id')->count('user_id');
        // Business days in range
        $fromDate = Carbon::parse($from);
        $toDate   = Carbon::parse($to);
        $businessDays = max(1, $fromDate->diffInWeekdays($toDate) + 1);
        $attendanceRate = ($memberCount > 0 && $businessDays > 0)
            ? round($totalDays / ($memberCount * $businessDays) * 100, 2)
            : 0.0;

        // Sales by staff in period
        try {
            $salesByStaff = DB::table('sales')
                ->join('staff_attendances', function ($join) use ($tenantId) {
                    $join->on('sales.user_id', '=', 'staff_attendances.user_id')
                         ->where('staff_attendances.tenant_id', $tenantId);
                })
                ->where('sales.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->selectRaw('staff_attendances.user_id, SUM(sales.net_sales) as revenue')
                ->groupBy('staff_attendances.user_id')
                ->orderByDesc('revenue')
                ->limit(10)
                ->get()
                ->toArray();

            $salesByStaff = array_map(fn($r) => [
                'user_id' => $r->user_id,
                'revenue' => (float)$r->revenue,
            ], $salesByStaff);
        } catch (\Exception $e) {
            $salesByStaff = [];
        }

        $totalRevenue = (float) (DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->sum('net_sales') ?? 0.0);

        $revenuePerStaff = $memberCount > 0 ? round($totalRevenue / $memberCount, 2) : 0.0;

        return [
            'member_count'    => $memberCount,
            'present_today'   => $presentToday,
            'on_shift'        => $onShift,
            'hours_worked'    => round($hoursWorked, 2),
            'attendance_rate' => $attendanceRate,
            'sales_by_staff'  => $salesByStaff,
            'revenue_per_staff' => $revenuePerStaff,
        ];
    }
}
