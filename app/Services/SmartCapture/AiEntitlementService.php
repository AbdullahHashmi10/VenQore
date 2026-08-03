<?php

namespace App\Services\SmartCapture;

use App\Services\PlanGate;
use Illuminate\Support\Facades\Log;

/**
 * AiEntitlementService — single source of truth for "is this tenant allowed to
 * use AI features, and on whose dime?".
 *
 * Monetization model (Pricing page / Lemon Squeezy provisioning):
 *  - tenant.ai_status = 'none'    → no AI add-on purchased. AI features locked.
 *  - tenant.ai_status = 'byok'    → paid the one-time BYOK unlock. Must configure
 *                                    their OWN API key; unlimited usage on their key.
 *  - tenant.ai_status = 'managed' → monthly managed tier. Platform key is used and
 *                                    usage is metered via ai_scans_used/ai_scans_limit
 *                                    (SmartCapture) and ai_queries_used/ai_queries_limit
 *                                    (OmniSearch AI / assistant).
 *
 * A tenant_plan_overrides row ('smart_capture' = '1') is granted alongside the AI
 * add-on, so PlanGate::check('smart_capture') is honored as an equivalent entitlement
 * (covers manually-granted tenants).
 */
class AiEntitlementService
{
    public function __construct(private AiExtractionService $ai) {}

    public static function freeScanAllowance(): int
    {
        return (int) config('smartcapture.free_scan_allowance', 10);
    }

    /**
     * Check whether the current tenant may run an AI SCAN (SmartCapture) right now.
     *
     * @return array{allowed:bool, reason:?string, mode:?string, scans_used:?int, scans_limit:?int}
     *         reason: 'no_tenant' | 'no_addon' | 'no_key' | 'limit_reached' | null
     *         mode:   'byok' | 'managed' | 'staff' | null
     */
    public function checkScan(): array
    {
        return $this->check('scan');
    }

    /**
     * Check whether the current tenant may run an AI QUERY (OmniSearch / assistant).
     */
    public function checkQuery(): array
    {
        return $this->check('query');
    }

    private function check(string $type): array
    {
        $user = auth()->user();
        if ($user && method_exists($user, 'isPlatformStaff') && $user->isPlatformStaff()) {
            return ['allowed' => true, 'reason' => null, 'mode' => 'staff', 'scans_used' => null, 'scans_limit' => null];
        }

        if (!app()->bound('current.tenant') || !app('current.tenant')) {
            return ['allowed' => false, 'reason' => 'no_tenant', 'mode' => null, 'scans_used' => null, 'scans_limit' => null];
        }

        $tenant = app('current.tenant');
        $status = $tenant->ai_status ?? 'none';

        $usedCol  = $type === 'scan' ? 'ai_scans_used'  : 'ai_queries_used';
        $limitCol = $type === 'scan' ? 'ai_scans_limit' : 'ai_queries_limit';

        $used  = (int) ($tenant->{$usedCol} ?? 0);
        $limit = (int) ($tenant->{$limitCol} ?? 0);

        // ── Managed tier: platform key + metered usage ────────────────────────
        if ($status === 'managed') {
            if ($limit > 0 && $used >= $limit) {
                // Managed cap hit — they may still proceed if they configured their own key
                if ($this->ai->hasOwnKey()) {
                    return ['allowed' => true, 'reason' => null, 'mode' => 'byok', 'scans_used' => $used, 'scans_limit' => $limit];
                }
                return ['allowed' => false, 'reason' => 'limit_reached', 'mode' => 'managed', 'scans_used' => $used, 'scans_limit' => $limit];
            }
            return ['allowed' => true, 'reason' => null, 'mode' => 'managed', 'scans_used' => $used, 'scans_limit' => $limit];
        }

        // ── BYOK unlock: their own key, unlimited ─────────────────────────────
        $entitledByok = $status === 'byok' || PlanGate::check('smart_capture');

        if ($entitledByok) {
            if (!$this->ai->hasOwnKey()) {
                return ['allowed' => false, 'reason' => 'no_key', 'mode' => 'byok', 'scans_used' => $used, 'scans_limit' => $limit];
            }
            return ['allowed' => true, 'reason' => null, 'mode' => 'byok', 'scans_used' => $used, 'scans_limit' => $limit];
        }

        // ── Free tier: 10 chances ─────────────────────────────────────────────
        if ($status === 'none') {
            if ($used >= 10) {
                return ['allowed' => false, 'reason' => 'free_limit_reached', 'mode' => 'free', 'scans_used' => $used, 'scans_limit' => 10];
            }
            return ['allowed' => true, 'reason' => null, 'mode' => 'free', 'scans_used' => $used, 'scans_limit' => 10];
        }

        return ['allowed' => false, 'reason' => 'no_addon', 'mode' => null, 'scans_used' => $used, 'scans_limit' => $limit];
    }

    /**
     * Record one successful AI scan against the managed/free meter.
     * BYOK / staff usage is never metered.
     */
    public function recordScan(string $mode): void
    {
        $this->record($mode, 'ai_scans_used');
    }

    /**
     * Record one successful AI query against the managed/free meter.
     */
    public function recordQuery(string $mode): void
    {
        $this->record($mode, 'ai_queries_used');
    }

    private function record(string $mode, string $column): void
    {
        if ($mode !== 'managed' && $mode !== 'free') {
            return;
        }

        try {
            if (app()->bound('current.tenant') && app('current.tenant')) {
                app('current.tenant')->increment($column);
            }
        } catch (\Exception $e) {
            // Metering must never break the user's transaction flow.
            Log::warning("AiEntitlementService: failed to increment {$column} — " . $e->getMessage());
        }
    }

    /**
     * Human-friendly lock message for a failed check (used by both API responses and UI).
     */
    public function lockMessage(array $check, string $feature = 'AI Scan'): string
    {
        return match ($check['reason']) {
            'free_limit_reached'=> "You've used all your 10 free AI chances. Subscribe to one of our managed plans, or purchase the Bring-Your-Own-Key lifetime unlock.",
            'no_addon'      => "{$feature} requires the AI add-on. Buy managed AI usage from us, or purchase the Bring-Your-Own-Key unlock and use your own API key.",
            'no_key'        => "You have the Bring-Your-Own-Key unlock, but no API key is configured yet. Add your Gemini / OpenAI / Claude / DeepSeek key in AI settings.",
            'limit_reached' => "You've used all your included AI usage for this month ({$check['scans_used']}/{$check['scans_limit']}). Upgrade your AI tier, or add your own API key to continue without limits.",
            'no_tenant'     => 'No active store context.',
            default         => "{$feature} is not available.",
        };
    }
}
