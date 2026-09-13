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
 *                                    usage is metered via ai_pages_used/ai_pages_limit
 *                                    (SmartCapture) and ai_queries_used/ai_queries_limit
 *                                    (OmniSearch AI / assistant).
 */
class AiEntitlementService
{
    public function __construct(private AiExtractionService $ai) {}

    public static function freeScanAllowance(): int
    {
        return (int) config('smartcapture.free_scan_allowance', 10);
    }

    /**
     * Calculate page credits for audio duration (1 credit per 30s started).
     */
    public static function calculateAudioPages(int $durationSeconds): int
    {
        if ($durationSeconds <= 0) {
            return 1;
        }
        return (int) ceil($durationSeconds / 30);
    }

    /**
     * Check whether the current tenant may run an AI SCAN (SmartCapture) right now.
     *
     * @return array{allowed:bool, reason:?string, mode:?string, pages_used:?int, pages_limit:?int}
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
            return ['allowed' => true, 'reason' => null, 'mode' => 'staff', 'pages_used' => null, 'pages_limit' => null];
        }

        if (!app()->bound('current.tenant') || !app('current.tenant')) {
            return ['allowed' => false, 'reason' => 'no_tenant', 'mode' => null, 'pages_used' => null, 'pages_limit' => null];
        }

        $tenant = app('current.tenant');
        $status = $tenant->ai_status ?? 'none';

        $usedCol  = $type === 'scan' ? 'ai_pages_used'  : 'ai_queries_used';
        $limitCol = $type === 'scan' ? 'ai_pages_limit' : 'ai_queries_limit';

        $used  = (int) ($tenant->{$usedCol} ?? 0);
        $limit = isset($tenant->{$limitCol}) && $tenant->{$limitCol} !== null ? (int) $tenant->{$limitCol} : 0;

        // ── Managed tier: platform key + metered usage ────────────────────────
        if ($status === 'managed') {
            // -1 indicates explicit unlimited (e.g. staff/special grants)
            if ($limit === -1) {
                return ['allowed' => true, 'reason' => null, 'mode' => 'managed', 'pages_used' => $used, 'pages_limit' => $limit];
            }

            // 0 or null or limit reached ⇒ blocked unless BYOK configured
            if ($limit <= 0 || $used >= $limit) {
                if ($this->ai->hasOwnKey()) {
                    return ['allowed' => true, 'reason' => null, 'mode' => 'byok', 'pages_used' => $used, 'pages_limit' => $limit];
                }
                return ['allowed' => false, 'reason' => 'limit_reached', 'mode' => 'managed', 'pages_used' => $used, 'pages_limit' => $limit];
            }
            return ['allowed' => true, 'reason' => null, 'mode' => 'managed', 'pages_used' => $used, 'pages_limit' => $limit];
        }

        // ── BYOK unlock: their own key, unlimited ─────────────────────────────
        $entitledByok = $status === 'byok';

        if ($entitledByok) {
            if (!$this->ai->hasOwnKey()) {
                return ['allowed' => false, 'reason' => 'no_key', 'mode' => 'byok', 'pages_used' => $used, 'pages_limit' => $limit];
            }
            return ['allowed' => true, 'reason' => null, 'mode' => 'byok', 'pages_used' => $used, 'pages_limit' => $limit];
        }

        // ── Free tier allowance ─────────────────────────────────────────────
        if ($status === 'none') {
            $freeLimit = self::freeScanAllowance();
            if ($used >= $freeLimit) {
                return ['allowed' => false, 'reason' => 'free_limit_reached', 'mode' => 'free', 'pages_used' => $used, 'pages_limit' => $freeLimit];
            }
            return ['allowed' => true, 'reason' => null, 'mode' => 'free', 'pages_used' => $used, 'pages_limit' => $freeLimit];
        }

        return ['allowed' => false, 'reason' => 'no_addon', 'mode' => null, 'pages_used' => $used, 'pages_limit' => $limit];
    }

    /**
     * Record one successful AI scan against the managed/free meter.
     */
    public function recordScan(string $mode, int $pages = 1): void
    {
        $this->debitPage($mode, $pages);
    }

    /**
     * Debit page credits from tenant meter.
     */
    public function debitPage(string $mode, int $pages = 1): void
    {
        if ($mode !== 'managed' && $mode !== 'free') {
            return;
        }

        try {
            if (app()->bound('current.tenant') && app('current.tenant')) {
                app('current.tenant')->increment('ai_pages_used', $pages);
            }
        } catch (\Exception $e) {
            Log::warning("AiEntitlementService: failed to debit ai_pages_used — " . $e->getMessage());
        }
    }

    /**
     * Refund page credits to tenant meter on failure.
     */
    public function refundPage(string $mode, int $pages = 1): void
    {
        if ($mode !== 'managed' && $mode !== 'free') {
            return;
        }

        try {
            if (app()->bound('current.tenant') && app('current.tenant')) {
                $tenant = app('current.tenant');
                $tenant->ai_pages_used = max(0, ((int) $tenant->ai_pages_used) - $pages);
                $tenant->save();
            }
        } catch (\Exception $e) {
            Log::warning("AiEntitlementService: failed to refund ai_pages_used — " . $e->getMessage());
        }
    }

    /**
     * Check if tenant usage has passed 80% warning threshold or 100% cap.
     * @return 'ok'|'warning'|'limit'
     */
    public function checkWarningThreshold(): string
    {
        if (!app()->bound('current.tenant') || !app('current.tenant')) {
            return 'ok';
        }

        $tenant = app('current.tenant');
        if ($tenant->ai_status !== 'managed') {
            return 'ok';
        }

        $limit = (int) ($tenant->ai_pages_limit ?? 0);
        if ($limit <= 0) {
            return 'ok';
        }

        $used = (int) ($tenant->ai_pages_used ?? 0);
        $ratio = $used / $limit;

        if ($ratio >= 1.0) {
            return 'limit';
        }

        if ($ratio >= 0.8) {
            return 'warning';
        }

        return 'ok';
    }

    /**
     * Record one successful AI query against the managed/free meter.
     */
    public function recordQuery(string $mode): void
    {
        if ($mode !== 'managed' && $mode !== 'free') {
            return;
        }

        try {
            if (app()->bound('current.tenant') && app('current.tenant')) {
                app('current.tenant')->increment('ai_queries_used');
            }
        } catch (\Exception $e) {
            Log::warning("AiEntitlementService: failed to increment ai_queries_used — " . $e->getMessage());
        }
    }

    /**
     * Human-friendly lock message for a failed check (used by both API responses and UI).
     */
    public function lockMessage(array $check, string $feature = 'AI Scan'): string
    {
        $used = $check['pages_used'] ?? $check['scans_used'] ?? 0;
        $limit = $check['pages_limit'] ?? $check['scans_limit'] ?? 0;

        return match ($check['reason']) {
            'free_limit_reached'=> "You've used all your 10 free AI chances. Subscribe to one of our managed plans, or purchase the Bring-Your-Own-Key lifetime unlock.",
            'no_addon'      => "{$feature} requires the AI add-on. Buy managed AI usage from us, or purchase the Bring-Your-Own-Key unlock and use your own API key.",
            'no_key'        => "You have the Bring-Your-Own-Key unlock, but no API key is configured yet. Add your Gemini / OpenAI / Claude / DeepSeek key in AI settings.",
            'limit_reached' => "You've used all your included AI usage for this month ({$used}/{$limit}). Upgrade your AI tier, or add your own API key to continue without limits.",
            'no_tenant'     => 'No active store context.',
            default         => "{$feature} is not available.",
        };
    }
}

