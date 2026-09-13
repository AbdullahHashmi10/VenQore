<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AiCostController extends Controller
{
    /**
     * Display the Platform Owner AI Cost & Billing Dashboard.
     */
    public function index(Request $request): Response
    {
        $today = now()->toDateString();
        $startOfMonth = now()->startOfMonth();
        $thirtyDaysAgo = now()->subDays(30)->startOfDay();
        $sevenDaysAgo = now()->subDays(7)->startOfDay();

        // 1. Cost & Volume KPIs
        $todaySpend = (float) DB::table('ai_usage_events')
            ->where('key_mode', '!=', 'byok')
            ->whereDate('created_at', $today)
            ->sum('cost_usd');

        $todayCalls = (int) DB::table('ai_usage_events')
            ->whereDate('created_at', $today)
            ->count();

        $monthSpend = (float) DB::table('ai_usage_events')
            ->where('key_mode', '!=', 'byok')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('cost_usd');

        $monthCalls = (int) DB::table('ai_usage_events')
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // Trailing 7-day average daily spend for run-rate projection
        $last7DaysSpend = (float) DB::table('ai_usage_events')
            ->where('key_mode', '!=', 'byok')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->sum('cost_usd');
        $avgDailySpend7d = round($last7DaysSpend / 7, 4);

        $daysRemainingInMonth = max(0, (int) now()->daysInMonth - (int) now()->format('j'));
        $projectedMonthEnd = round($monthSpend + ($avgDailySpend7d * $daysRemainingInMonth), 2);

        // Daily spend cap configured across features
        $featureLimits = config('ai_limits.features', []);
        $totalDailyCap = 0;
        foreach ($featureLimits as $featConfig) {
            $totalDailyCap += (float) ($featConfig['spend_cap'] ?? 0);
        }
        if ($totalDailyCap <= 0) {
            $totalDailyCap = 25.00; // Sensible default platform ceiling
        }

        // 2. Trailing 30-day spend & call trend (daily points)
        $dailyTrendRaw = DB::table('ai_usage_events')
            ->selectRaw("DATE(created_at) as date,
                         SUM(CASE WHEN key_mode != 'byok' THEN cost_usd ELSE 0 END) as cost_usd,
                         SUM(CASE WHEN key_mode = 'byok' THEN cost_usd ELSE 0 END) as byok_cost_usd,
                         COUNT(*) as total_calls")
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // 3. Per-Tenant Breakdown (Past 30 days)
        $tenantUsageRaw = DB::table('ai_usage_events')
            ->selectRaw("tenant_id,
                         COUNT(*) as total_calls,
                         SUM(CASE WHEN key_mode != 'byok' THEN cost_usd ELSE 0 END) as cost_usd,
                         SUM(prompt_tokens + output_tokens) as total_tokens,
                         MAX(created_at) as last_activity,
                         feature as top_feature")
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->whereNotNull('tenant_id')
            ->groupBy('tenant_id', 'feature')
            ->get();

        // Group per tenant to find top feature and total cost
        $tenantsGrouped = [];
        foreach ($tenantUsageRaw as $row) {
            $tid = $row->tenant_id;
            if (!isset($tenantsGrouped[$tid])) {
                $tenantsGrouped[$tid] = [
                    'tenant_id'     => $tid,
                    'total_calls'   => 0,
                    'cost_usd'      => 0,
                    'total_tokens'  => 0,
                    'last_activity' => $row->last_activity,
                    'top_feature'   => $row->top_feature,
                    'max_feat_calls'=> 0,
                ];
            }
            $tenantsGrouped[$tid]['total_calls'] += (int) $row->total_calls;
            $tenantsGrouped[$tid]['cost_usd'] += (float) $row->cost_usd;
            $tenantsGrouped[$tid]['total_tokens'] += (int) $row->total_tokens;
            if ($row->last_activity > $tenantsGrouped[$tid]['last_activity']) {
                $tenantsGrouped[$tid]['last_activity'] = $row->last_activity;
            }
            if ((int) $row->total_calls > $tenantsGrouped[$tid]['max_feat_calls']) {
                $tenantsGrouped[$tid]['top_feature'] = $row->top_feature;
                $tenantsGrouped[$tid]['max_feat_calls'] = (int) $row->total_calls;
            }
        }

        // Load tenant metadata
        $tenantIds = array_keys($tenantsGrouped);
        $tenantsModels = Tenant::whereIn('id', $tenantIds)->get(['id', 'name', 'slug', 'plan', 'ai_status', 'ai_pages_used', 'ai_pages_limit'])->keyBy('id');

        $tenantBreakdown = [];
        foreach ($tenantsGrouped as $tid => $data) {
            $t = $tenantsModels->get($tid);
            $tenantBreakdown[] = [
                'tenant_id'     => $tid,
                'name'          => $t?->name ?? "Store #{$tid}",
                'slug'          => $t?->slug ?? '',
                'plan'          => $t?->plan ?? 'trial',
                'ai_status'     => $t?->ai_status ?? 'none',
                'ai_pages_used' => $t?->ai_pages_used ?? 0,
                'ai_pages_limit'=> $t?->ai_pages_limit,
                'total_calls'   => $data['total_calls'],
                'cost_usd'      => round($data['cost_usd'], 4),
                'total_tokens'  => $data['total_tokens'],
                'top_feature'   => $data['top_feature'],
                'last_activity' => $data['last_activity'],
            ];
        }

        // Sort tenants by cost descending
        usort($tenantBreakdown, fn($a, $b) => $b['cost_usd'] <=> $a['cost_usd']);

        // 4. Per-Provider & Model Breakdown
        $modelBreakdown = DB::table('ai_usage_events')
            ->selectRaw("provider, model,
                         COUNT(*) as total_calls,
                         SUM(prompt_tokens) as total_prompt_tokens,
                         SUM(output_tokens) as total_output_tokens,
                         SUM(cost_usd) as cost_usd,
                         AVG(latency_ms) as avg_latency_ms")
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->groupBy('provider', 'model')
            ->orderByDesc('cost_usd')
            ->get()
            ->map(function ($row) {
                return [
                    'provider'            => $row->provider,
                    'model'               => $row->model,
                    'total_calls'         => (int) $row->total_calls,
                    'total_prompt_tokens' => (int) $row->total_prompt_tokens,
                    'total_output_tokens' => (int) $row->total_output_tokens,
                    'cost_usd'            => round((float) $row->cost_usd, 4),
                    'avg_latency_ms'      => round((float) $row->avg_latency_ms, 0),
                ];
            });

        return Inertia::render('SuperAdmin/AiUsage/Index', [
            'kpis' => [
                'today_spend'         => round($todaySpend, 4),
                'today_calls'         => $todayCalls,
                'month_spend'         => round($monthSpend, 2),
                'month_calls'         => $monthCalls,
                'avg_daily_spend_7d'  => $avgDailySpend7d,
                'projected_month_end' => $projectedMonthEnd,
                'daily_spend_cap'     => $totalDailyCap,
            ],
            'daily_trend'      => $dailyTrendRaw,
            'tenant_breakdown' => $tenantBreakdown,
            'model_breakdown'  => $modelBreakdown,
        ]);
    }
}
