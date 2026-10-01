<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\SmartCapture\AiEntitlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AiUsageController extends Controller
{
    /**
     * Display the tenant-facing AI usage metering page.
     */
    public function index(Request $request): Response
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        abort_unless($tenant, 404, 'Store context not found.');

        // Fetch recent AI usage events for this tenant (last 50)
        $recentEvents = DB::table('ai_usage_events')
            ->where('tenant_id', $tenant->id)
            ->latest('created_at')
            ->limit(50)
            ->get([
                'id',
                'feature',
                'provider',
                'model',
                'pages',
                'prompt_tokens',
                'output_tokens',
                'cost_usd',
                'success',
                'created_at',
            ]);

        // Add-ons catalogue for AI packages
        $addons = [
            'ai_topup' => config('pricing.add_ons.ai_topup', [
                'name'            => '1,000 AI Credits Top-up',
                'price'           => 10,
                'price_formatted' => '$10',
                'credits'         => 1000,
                'purchasable'     => true,
            ]),
            'ai_rebuilds' => config('pricing.add_ons.ai_rebuilds', [
                'name'            => '5 Structural Rebuilds',
                'price'           => 10,
                'price_formatted' => '$10',
                'rebuilds'        => 5,
                'purchasable'     => false,
            ]),
        ];

        return Inertia::render('AiUsage/Index', [
            'recent_events'       => $recentEvents,
            'addon_catalogue'     => $addons,
            'free_scan_allowance' => AiEntitlementService::freeScanAllowance(),
        ]);
    }
}
