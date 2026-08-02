<?php

namespace App\Http\Controllers;

use App\Jobs\RunGrowthEngineForTenant;
use App\Models\AiRecommendation;
use App\Models\CustomerAnalytics;
use App\Models\GiftCard;
use App\Models\GrowthMetricSnapshot;
use App\Models\GrowthRun;
use App\Models\GrowthSignalEvent;
use App\Models\Invoice;
use App\Models\LoyaltyBalance;
use App\Models\Party;
use App\Models\ProductAnalytics;
use App\Models\StoreCreditBalance;
use App\Services\Growth\GrowthContext;
use App\Services\Growth\GrowthEngine;
use App\Services\Growth\InsightCatalog;
use App\Services\Growth\SignalRepository;
use App\Services\Growth\ThresholdTuner;
use App\Services\PlanGate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * GrowthEngineController
 *
 * Read/interaction surface for the Growth Engine, plus the loyalty, gift-card
 * and store-credit endpoints that have always lived alongside it.
 *
 * ## What changed from V1
 *
 *  - `refresh()` used to call `Artisan::call('growth:analyze', ['--force' =>
 *    true])` synchronously, with no tenant filter. One tenant pressing the
 *    button wiped and regenerated recommendations for EVERY tenant on the
 *    platform while their browser waited. It now queues a single job for the
 *    current tenant only, and is rate-limited.
 *
 *  - `index()` and `dashboard()` had no explicit tenant filter, relying purely
 *    on the HasTenant global scope. Correct in practice, but a single missing
 *    `use` would have silently leaked cross-tenant data. Now scoped explicitly
 *    as well — defence in depth, per the project's tenancy rules.
 *
 *  - `index()` computed `stats.potential_revenue` from `$query->sum(...)` AFTER
 *    the query had been paginated. On Laravel that re-runs the builder with the
 *    limit still applied in some drivers and, more importantly, summed a
 *    filtered subset while presenting it as a total.
 *
 *  - The dashboard now also returns the engine's own accuracy scorecard, so the
 *    owner can see how much to trust each brain.
 */
class GrowthEngineController extends Controller
{
    public function __construct(
        private readonly SignalRepository $signals,
        private readonly ThresholdTuner $tuner,
        private readonly GrowthEngine $engine,
    ) {
    }

    private function tenantId(): int|string
    {
        return app('current.tenant')->id;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  MAIN PAGE
    // ═══════════════════════════════════════════════════════════════════════

    public function index(Request $request)
    {
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('growth_engine');
        }

        $tenantId = $this->tenantId();

        $base = AiRecommendation::query()
            ->where('tenant_id', $tenantId)
            ->active();

        // ── Facet counts, computed BEFORE filtering ──────────────────────
        // The filter rail must show what is available overall, not what
        // survived the filter the user already applied.
        //
        // `toBase()` matters here: this project runs
        // Model::preventAccessingMissingAttributes() outside production, and
        // AiRecommendation has $appends accessors that read `type` and
        // `brain`. Hydrating an aggregate row into the model would fire those
        // accessors against columns the SELECT never returned and throw.
        // Aggregates return plain rows.
        $facets = (clone $base)->toBase()
            ->select('brain', 'type', 'priority', DB::raw('COUNT(*) as n'), DB::raw('SUM(potential_revenue) as v'))
            ->groupBy('brain', 'type', 'priority')
            ->get();

        $query = (clone $base)->with(['party:id,name,phone', 'product:id,name,sku']);

        if ($request->filled('brain')) {
            $query->where('brain', $request->string('brain'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }
        if ($request->filled('category')) {
            $types = array_keys(array_filter(
                InsightCatalog::all(),
                fn ($m) => $m['category'] === $request->string('category')->toString()
            ));
            $query->whereIn('type', $types ?: ['__none__']);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }
        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        $recommendations = $query->ranked()->paginate(30)->withQueryString();

        // Telemetry: what the owner was actually shown. Feeds engagement rates.
        $this->recordImpressions($tenantId, $recommendations->getCollection());

        return Inertia::render('GrowthEngine/GrowthDashboard', [
            'recommendations' => $recommendations,
            'stats'           => $this->headlineStats($tenantId, $base),
            'facets'          => $this->buildFacets($facets),
            'scorecard'       => $this->tuner->scorecard($tenantId),
            'engineStatus'    => $this->engine->status($tenantId),
            'trend'           => $this->trendSeries($tenantId),
            'filters'         => $request->only(['brain', 'type', 'category', 'priority', 'unread_only']),
        ]);
    }

    /**
     * Compact JSON summary for the "Today's Opportunities" widget on the main
     * dashboard.
     */
    public function dashboard()
    {
        $tenantId = $this->tenantId();

        $base = AiRecommendation::query()->where('tenant_id', $tenantId)->active();

        $top = (clone $base)
            ->with(['party:id,name,phone', 'product:id,name,sku'])
            ->ranked()
            ->limit(12)
            ->get();

        return response()->json([
            'recommendations' => $top,
            'stats'           => $this->headlineStats($tenantId, $base),
            'engine'          => $this->engine->status($tenantId),
            'maturity'        => $this->tuner->scorecard($tenantId)['maturity'] ?? null,
        ]);
    }

    /**
     * Headline numbers.
     *
     * `potential_revenue` is computed over the WHOLE active set with a single
     * aggregate — not summed from the current page, and not double counted
     * across brains as V1's array_sum over grouped collections did.
     */
    private function headlineStats(int|string $tenantId, $base): array
    {
        // toBase() — see the note in index(); aggregate rows must not be
        // hydrated into a model whose accessors expect real columns.
        $agg = (clone $base)->toBase()
            ->selectRaw("
                COUNT(*)                                              AS total,
                COALESCE(SUM(potential_revenue), 0)                   AS opportunity,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END)          AS unread,
                SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END)  AS urgent
            ")
            ->first();

        $byBrain = (clone $base)->toBase()
            ->select('brain', DB::raw('COUNT(*) as n'), DB::raw('COALESCE(SUM(potential_revenue),0) as v'))
            ->groupBy('brain')
            ->get()
            ->keyBy('brain');

        // Value the engine has demonstrably produced — only from signals the
        // owner acted on that were then graded a hit. Deliberately strict:
        // an inflated number here would destroy trust the first time it was
        // checked against reality.
        $realised = (float) AiRecommendation::query()
            ->where('tenant_id', $tenantId)
            ->where('outcome', 'hit')
            ->whereNotNull('acted_at')
            ->sum('outcome_value');

        return [
            'total_signals'     => (int) ($agg->total ?? 0),
            'unread_count'      => (int) ($agg->unread ?? 0),
            'urgent_count'      => (int) ($agg->urgent ?? 0),
            'potential_revenue' => round((float) ($agg->opportunity ?? 0), 2),
            'realised_value'    => round($realised, 2),
            'by_brain'          => collect(InsightCatalog::brains())->map(fn ($b) => [
                'brain' => $b,
                'label' => InsightCatalog::brainLabel($b),
                'count' => (int) ($byBrain[$b]->n ?? 0),
                'value' => round((float) ($byBrain[$b]->v ?? 0), 2),
            ])->values()->all(),
        ];
    }

    private function buildFacets($rows): array
    {
        $catalog = InsightCatalog::all();

        $byCategory = [];
        $byType     = [];

        foreach ($rows as $r) {
            $meta = $catalog[$r->type] ?? null;
            $cat  = $meta['category'] ?? 'general';

            $byCategory[$cat] = ($byCategory[$cat] ?? 0) + (int) $r->n;

            if (!isset($byType[$r->type])) {
                $byType[$r->type] = [
                    'type'  => $r->type,
                    'label' => $meta['label'] ?? ucfirst(str_replace('_', ' ', $r->type)),
                    'brain' => $meta['brain'] ?? $r->brain,
                    'count' => 0,
                ];
            }
            $byType[$r->type]['count'] += (int) $r->n;
        }

        arsort($byCategory);

        return [
            'categories' => collect($byCategory)->map(fn ($n, $c) => [
                'key'   => $c,
                'label' => ucfirst(str_replace('_', ' ', $c)),
                'count' => $n,
            ])->values()->all(),
            'types' => collect($byType)->sortByDesc('count')->values()->all(),
        ];
    }

    /**
     * 60 days of revenue / margin / order history for the dashboard sparkline.
     * Comes from the pre-computed snapshot table, so it is one indexed read
     * rather than an aggregate over the sales tables on every page load.
     */
    private function trendSeries(int|string $tenantId): array
    {
        return GrowthMetricSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->where('snapshot_date', '>=', now()->subDays(60)->toDateString())
            ->orderBy('snapshot_date')
            ->get(['snapshot_date', 'revenue', 'gross_margin', 'margin_pct', 'order_count'])
            ->map(fn ($s) => [
                'date'    => $s->snapshot_date->toDateString(),
                'revenue' => (float) $s->revenue,
                'margin'  => (float) $s->gross_margin,
                'margin_pct' => (float) $s->margin_pct,
                'orders'  => (int) $s->order_count,
            ])->all();
    }

    private function recordImpressions(int|string $tenantId, $collection): void
    {
        $fresh = $collection->where('is_read', false);

        if ($fresh->isEmpty()) {
            return;
        }

        // Mark as shown, but NOT as read — read is an explicit user action.
        foreach ($fresh->take(30) as $rec) {
            GrowthSignalEvent::record(
                $tenantId, GrowthSignalEvent::SHOWN, $rec->id, $rec->type,
                (float) $rec->potential_revenue
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SIGNAL DETAIL + INTERACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Full detail for one signal: the evidence, the customer's or product's
     * recent history, and what the engine's track record is for this insight
     * type. V1 had no detail endpoint at all — the side panel rendered
     * whatever happened to be on the list row.
     */
    public function show($id)
    {
        $tenantId = $this->tenantId();

        $rec = AiRecommendation::query()
            ->where('tenant_id', $tenantId)
            ->with(['party:id,name,phone,current_balance', 'product:id,name,sku,price,cost_price'])
            ->findOrFail($id);

        if (!$rec->is_read) {
            $rec->update(['is_read' => true]);
        }

        GrowthSignalEvent::record($tenantId, GrowthSignalEvent::OPENED, $rec->id, $rec->type);

        $stat = $this->tuner->statsFor($tenantId)->get($rec->type);

        return response()->json([
            'recommendation' => $rec,
            'context'        => $this->contextFor($tenantId, $rec),
            'track_record'   => $stat ? [
                'generated'   => $stat->generated_count,
                'acted'       => $stat->acted_count,
                'precision'   => $stat->gradedCount() >= 3 ? $stat->precision_pct : null,
                'graded'      => $stat->gradedCount(),
                'gradeable'   => $rec->isGradeable(),
                'sensitivity' => (float) $stat->sensitivity,
            ] : null,
        ]);
    }

    /**
     * Supporting history so the owner can sanity-check the claim themselves.
     * An insight nobody can verify is an insight nobody will act on.
     */
    private function contextFor(int|string $tenantId, AiRecommendation $rec): array
    {
        $ctx = [];

        if ($rec->party_id) {
            $ctx['customer'] = CustomerAnalytics::query()
                ->where('tenant_id', $tenantId)
                ->where('party_id', $rec->party_id)
                ->first();

            $ctx['recent_orders'] = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->where('party_id', $rec->party_id)
                ->whereNull('deleted_at')
                ->whereIn('status', ['posted', 'partially_returned'])
                ->orderByDesc('posted_at')
                ->limit(12)
                ->get(['reference_number', 'posted_at', 'invoice_total', 'payment_status'])
                ->map(fn ($s) => [
                    'reference' => $s->reference_number,
                    'date'      => $s->posted_at,
                    'amount'    => (float) $s->invoice_total,
                    'payment'   => $s->payment_status,
                ]);
        }

        if ($rec->product_id) {
            $ctx['product'] = ProductAnalytics::query()
                ->where('tenant_id', $tenantId)
                ->where('product_id', $rec->product_id)
                ->first();
        }

        return $ctx;
    }

    /**
     * The owner acted on this. The single most valuable event in the whole
     * system: it is what the outcome evaluator uses to distinguish "the
     * prediction was wrong" from "the prediction was right and you prevented
     * it".
     */
    public function act($id)
    {
        $rec = AiRecommendation::query()
            ->where('tenant_id', $this->tenantId())
            ->findOrFail($id);

        $this->signals->markActed($rec);

        return response()->json(['success' => true, 'status' => 'acted']);
    }

    public function dismiss(Request $request, $id)
    {
        $rec = AiRecommendation::query()
            ->where('tenant_id', $this->tenantId())
            ->findOrFail($id);

        $this->signals->markDismissed($rec, $request->input('reason'));

        return response()->json(['success' => true, 'status' => 'dismissed']);
    }

    /**
     * "Not now" — distinct from dismissal.
     *
     * V1 had only dismiss, which meant the owner had to choose between
     * permanently rejecting a valid insight and leaving it cluttering the feed.
     * Snoozing keeps the signal without penalising the insight type's stats.
     */
    public function snooze(Request $request, $id)
    {
        $validated = $request->validate([
            'days' => 'nullable|integer|min:1|max:90',
        ]);

        $rec = AiRecommendation::query()
            ->where('tenant_id', $this->tenantId())
            ->findOrFail($id);

        $this->signals->markSnoozed($rec, $validated['days'] ?? 7);

        return response()->json(['success' => true, 'status' => 'snoozed']);
    }

    public function markRead($id)
    {
        AiRecommendation::query()
            ->where('tenant_id', $this->tenantId())
            ->findOrFail($id)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * The engine's report card. Shown to the owner verbatim.
     * Being openly honest about accuracy is what earns the right to be trusted.
     */
    public function scorecard()
    {
        return response()->json($this->tuner->scorecard($this->tenantId()));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  REFRESH
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Queue an immediate re-analysis for THIS tenant only.
     *
     * Compare with V1: `Artisan::call('growth:analyze', ['--force' => true])`
     * inline, for every tenant on the platform, inside the HTTP request, with
     * `--force` first DELETING all recommendations and analytics.
     */
    public function refresh()
    {
        $tenantId = $this->tenantId();

        $recent = GrowthRun::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subMinutes(2))
            ->exists();

        if ($recent) {
            return response()->json([
                'success' => false,
                'message' => 'A refresh is already running. Give it a moment.',
            ], 429);
        }

        RunGrowthEngineForTenant::dispatch($tenantId, 'deep', true);

        return response()->json([
            'success' => true,
            'message' => 'Analysis queued — new insights will appear here in a few moments.',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  OUTREACH
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Build a WhatsApp deep link.
     *
     * V1 hardcoded one Urdu/Roman greeting for every situation and assumed a
     * Pakistani number, prefixing '92' to any 10-digit string. The message now
     * comes from the signal itself (each brain writes one that fits its own
     * context), and the country code is taken from tenant settings with the
     * old behaviour retained only as a fallback.
     */
    public function generateWhatsApp($id)
    {
        $tenantId = $this->tenantId();

        $rec = AiRecommendation::query()
            ->where('tenant_id', $tenantId)
            ->with('party')
            ->findOrFail($id);

        $phone = $rec->party?->phone ?? ($rec->data['phone'] ?? null);

        if (!$phone) {
            return response()->json(['error' => 'No phone number on file for this customer'], 400);
        }

        $text = $rec->data['suggested_message']
            ?? "Assalam-o-alaikum, just checking in from our store — can we help with your next order?";

        $digits = preg_replace('/[^0-9]/', '', $phone);
        $cc     = (string) (DB::table('settings')
            ->where('tenant_id', $tenantId)
            ->where('key', 'country_calling_code')
            ->value('value') ?: '92');

        // Local formats: 03001234567 (11 digits, leading 0) or 3001234567.
        if (str_starts_with($digits, '0')) {
            $digits = $cc . substr($digits, 1);
        } elseif (strlen($digits) === 10) {
            $digits = $cc . $digits;
        }

        return response()->json([
            'success' => true,
            'url'     => 'https://wa.me/' . $digits . '?text=' . urlencode($text),
            'phone'   => $digits,
            'message' => $text,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SETTINGS
    // ═══════════════════════════════════════════════════════════════════════

    public function settings()
    {
        $tenantId = $this->tenantId();

        $dbSettings = DB::table('ai_settings')
            ->where('tenant_id', $tenantId)
            ->pluck('value', 'key')
            ->toArray();

        // These MUST match Database\Seeders\TenantDefaultSeeder::seedAiSettings()
        // exactly. They used to diverge on 3 of the 7 keys (min_orders 2 vs 3,
        // period_days 90 vs 60, min_order_value_filter 0 vs 5000) — every tenant
        // provisioned before ai_settings rows existed for it fell through to
        // THIS array, so two tenants could get different Growth Engine behaviour
        // purely based on signup date. Now that seedAiSettings() runs for every
        // new tenant, this array only matters as a defensive fallback for a row
        // that's somehow still missing — it should never be reached in practice,
        // but if it is, it must produce the SAME behaviour as a freshly seeded
        // tenant, not a different one.
        $defaults = [
            'regular_customer_min_orders'    => '3',
            'regular_customer_period_days'   => '60',
            'min_order_value_filter'         => '5000',
            'lookahead_days'                 => '7',
            'loyalty_points_per_amount'      => '100',
            'loyalty_points_earned_per_unit' => '1',
            'loyalty_redemption_rate'        => '10',
        ];

        return Inertia::render('GrowthEngine/Settings', [
            'settings'  => array_merge($defaults, $dbSettings),
            'scorecard' => $this->tuner->scorecard($tenantId),
            'catalog'   => collect(InsightCatalog::all())->map(fn ($m, $k) => [
                'type'      => $k,
                'label'     => $m['label'],
                'brain'     => $m['brain'],
                'brain_label' => InsightCatalog::brainLabel($m['brain']),
                'category'  => $m['category'],
                'gradeable' => $m['gradeable'],
                'actionable'=> $m['actionable'],
            ])->values()->all(),
            'learned'   => $this->learnedScale($tenantId),
        ]);
    }

    /**
     * Surface the figures the engine worked out for itself.
     *
     * Worth showing: it demonstrates that thresholds are derived from the
     * tenant's own trading, not from constants someone picked. That is the
     * difference between "the software guessed" and "the software measured".
     */
    private function learnedScale(int|string $tenantId): array
    {
        $ctx = new GrowthContext(
            tenantId: $tenantId,
            data:     app(\App\Services\Growth\GrowthDataSource::class),
            tuner:    $this->tuner,
        );

        return [
            'median_order_value' => round($ctx->medianOrderValue(), 2),
            'median_reorder_gap' => round($ctx->tenantMedianGap()),
            'supplier_lead_time' => $ctx->leadTimeDays(),
            'payment_terms'      => $ctx->paymentTermDays(),
            'materiality_floor'  => round($ctx->materialityFloor(), 2),
        ];
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'regular_customer_min_orders'    => 'required|integer|min:1',
            'regular_customer_period_days'   => 'required|integer|min:7',
            'min_order_value_filter'         => 'required|numeric|min:0',
            'lookahead_days'                 => 'required|integer|min:1|max:30',
            'loyalty_points_per_amount'      => 'required|integer|min:1',
            'loyalty_points_earned_per_unit' => 'required|integer|min:1',
            'loyalty_redemption_rate'        => 'required|integer|min:1',
        ]);

        $tenantId = $this->tenantId();

        // V1 did an exists() + update()/insert() per key — 14 queries for 7
        // settings. One upsert instead.
        $rows = [];
        foreach ($validated as $key => $value) {
            $rows[] = [
                'id'         => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id'  => $tenantId,
                'key'        => $key,
                'value'      => (string) $value,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('ai_settings')->upsert($rows, ['tenant_id', 'key'], ['value', 'updated_at']);

        // Learned-scale figures are cached for 12–24h; settings changes should
        // take effect on the next run, not tomorrow.
        GrowthContext::forgetCaches($tenantId);

        return back()->with('success', 'Growth Engine settings updated.');
    }

    /**
     * Un-mute an insight type the engine suppressed.
     *
     * The owner always gets the final say over their own dashboard. Automatic
     * suppression is a convenience, not a lock.
     */
    public function unmute(Request $request)
    {
        $validated = $request->validate([
            'insight_type' => 'required|string|max:64',
        ]);

        $stat = $this->tuner->ensure($this->tenantId(), $validated['insight_type']);
        $stat->forceFill([
            'is_muted'    => false,
            'muted_until' => null,
            'mute_reason' => null,
            'sensitivity' => 1.0,
        ])->save();

        $this->tuner->forget($this->tenantId());

        return back()->with('success', 'That insight type will appear again on the next run.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LOYALTY  (unchanged behaviour — carried over from V1)
    // ═══════════════════════════════════════════════════════════════════════

    public function customerLoyalty($partyId)
    {
        // Tenant-scoped existence check BEFORE the plan gate (Session-3 fix):
        // a party that doesn't belong to the current tenant must 404 regardless
        // of plan tier, matching this codebase's existing "no existence oracle"
        // pattern (see SuperAdminMiddleware). Checking the plan gate first leaked
        // a distinguishable 403 for cross-tenant requests on non-entitled plans.
        $party = Party::findOrFail($partyId);

        if (!PlanGate::check('loyalty_points')) {
            return response()->json(['error' => 'Loyalty points are available on the Enterprise plan.'], 403);
        }

        $balance     = LoyaltyBalance::where('party_id', $party->id)->first();
        $storeCredit = StoreCreditBalance::where('party_id', $party->id)->first();

        return response()->json([
            'loyalty_points'    => $balance?->balance ?? 0,
            'lifetime_earned'   => $balance?->lifetime_earned ?? 0,
            'lifetime_redeemed' => $balance?->lifetime_redeemed ?? 0,
            'store_credit'      => $storeCredit?->balance ?? 0,
        ]);
    }

    public function awardPoints(Request $request)
    {
        $validated = $request->validate([
            'party_id'    => 'required|string',
            'points'      => 'required|integer|min:1',
            'description' => 'nullable|string|max:255',
            'invoice_id'  => 'nullable|string',
        ]);

        // Tenant-scoped existence check BEFORE the plan gate (Session-3 fix) —
        // see customerLoyalty() above for why the order matters.
        $party = Party::findOrFail($validated['party_id']);

        if (!empty($validated['invoice_id'])) {
            Invoice::findOrFail($validated['invoice_id']);
        }

        // Awarding NEW points is the Enterprise-tier feature being sold on the
        // pricing page — this gate stays. (Spending points a customer already
        // has is a different question; see redeemPoints() below.)
        if (!PlanGate::check('loyalty_points')) {
            return response()->json(['error' => 'Loyalty points are available on the Enterprise plan.'], 403);
        }

        $balance = LoyaltyBalance::awardPoints(
            $party->id,
            $validated['points'],
            $validated['description'] ?? null,
            $validated['invoice_id'] ?? null
        );

        return response()->json(['success' => true, 'new_balance' => $balance->balance]);
    }

    public function redeemPoints(Request $request)
    {
        $validated = $request->validate([
            'party_id'   => 'required|string',
            'points'     => 'required|integer|min:1',
            'invoice_id' => 'nullable|string',
        ]);

        // Tenant-scoped existence check first (Session-3 fix) — see
        // customerLoyalty() above for why the order matters.
        $party = Party::findOrFail($validated['party_id']);

        $invoice = null;
        if (!empty($validated['invoice_id'])) {
            $invoice = Invoice::findOrFail($validated['invoice_id']);
        }

        // No PlanGate check here (Session-3 fix, deliberate): earning NEW
        // points is the gated Enterprise feature (see awardPoints()), but a
        // balance that already exists — awarded before a downgrade, or by a
        // platform admin — is money the store already owes this customer.
        // Blocking its redemption doesn't recover anything for the business;
        // it just traps the customer's existing balance. This mirrors the
        // store-credit endpoints below, which have never gated useStoreCredit()
        // by plan for the same reason. The invoice-total cap directly below
        // is the real safety control for this endpoint, regardless of plan.

        try {
            $tenantId = $this->tenantId();
            $rate = DB::table('ai_settings')
                ->where('tenant_id', $tenantId)
                ->where('key', 'loyalty_redemption_rate')
                ->value('value') ?? 10;

            $value = $validated['points'] / $rate;

            if ($invoice && $value > $invoice->total_amount) {
                return response()->json(['error' => 'Redemption value cannot exceed the invoice total amount'], 400);
            }

            $balance = LoyaltyBalance::redeemPoints(
                $party->id,
                $validated['points'],
                'Points redeemed at checkout',
                $validated['invoice_id'] ?? null
            );

            return response()->json([
                'success'        => true,
                'new_balance'    => $balance->balance,
                'discount_value' => $value,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  GIFT CARDS  (unchanged)
    // ═══════════════════════════════════════════════════════════════════════

    public function createGiftCard(Request $request)
    {
        if (!PlanGate::check('digital_gift_cards')) {
            return response()->json(['error' => 'Digital gift cards are available on the Enterprise plan.'], 403);
        }

        $validated = $request->validate([
            'value'        => 'required|numeric|min:100',
            'purchased_by' => 'nullable|string',
            'assigned_to'  => 'nullable|string',
            'expires_at'   => 'nullable|date|after:today',
        ]);

        if (!empty($validated['purchased_by'])) {
            Party::findOrFail($validated['purchased_by']);
        }
        if (!empty($validated['assigned_to'])) {
            Party::findOrFail($validated['assigned_to']);
        }

        $card = GiftCard::create([
            'code'            => GiftCard::generateCode(),
            'initial_value'   => $validated['value'],
            'current_balance' => $validated['value'],
            'purchased_by'    => $validated['purchased_by'] ?? null,
            'assigned_to'     => $validated['assigned_to'] ?? null,
            'status'          => 'active',
            'expires_at'      => $validated['expires_at'] ?? null,
        ]);

        return response()->json(['success' => true, 'gift_card' => $card]);
    }

    public function checkGiftCard($code)
    {
        if (!PlanGate::check('digital_gift_cards')) {
            return response()->json(['error' => 'Digital gift cards are available on the Enterprise plan.'], 403);
        }

        $card = GiftCard::where('code', $code)->first();

        if (!$card) {
            return response()->json(['error' => 'Gift card not found'], 404);
        }

        return response()->json([
            'code'       => $card->code,
            'balance'    => $card->current_balance,
            'status'     => $card->status,
            'is_usable'  => $card->isUsable(),
            'expires_at' => $card->expires_at?->format('Y-m-d'),
        ]);
    }

    public function useGiftCard(Request $request)
    {
        if (!PlanGate::check('digital_gift_cards')) {
            return response()->json(['error' => 'Digital gift cards are available on the Enterprise plan.'], 403);
        }

        $validated = $request->validate([
            'code'   => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $card = GiftCard::where('code', $validated['code'])->first();

        if (!$card || !$card->isUsable()) {
            return response()->json(['error' => 'Gift card is not valid or has expired'], 400);
        }

        try {
            $card->deduct($validated['amount']);
            return response()->json(['success' => true, 'remaining_balance' => $card->current_balance]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  STORE CREDIT  (unchanged)
    // ═══════════════════════════════════════════════════════════════════════

    public function addStoreCredit(Request $request)
    {
        $validated = $request->validate([
            'party_id'   => 'required|string',
            'amount'     => 'required|numeric|min:0.01',
            'reason'     => 'nullable|string|max:255',
            'invoice_id' => 'nullable|string',
        ]);

        $party = Party::findOrFail($validated['party_id']);

        if (!empty($validated['invoice_id'])) {
            Invoice::findOrFail($validated['invoice_id']);
        }

        $balance = StoreCreditBalance::addCredit(
            $party->id,
            $validated['amount'],
            $validated['reason'] ?? 'Store credit added',
            $validated['invoice_id'] ?? null
        );

        return response()->json(['success' => true, 'new_balance' => $balance->balance]);
    }

    public function useStoreCredit(Request $request)
    {
        $validated = $request->validate([
            'party_id'   => 'required|string',
            'amount'     => 'required|numeric|min:0.01',
            'invoice_id' => 'nullable|string',
        ]);

        $party = Party::findOrFail($validated['party_id']);

        $invoice = null;
        if (!empty($validated['invoice_id'])) {
            $invoice = Invoice::findOrFail($validated['invoice_id']);
        }

        if ($invoice && $validated['amount'] > $invoice->total_amount) {
            return response()->json(['error' => 'Store credit amount cannot exceed the invoice total amount'], 400);
        }

        try {
            $balance = StoreCreditBalance::useCredit(
                $party->id,
                $validated['amount'],
                'Used at checkout',
                $validated['invoice_id'] ?? null
            );

            return response()->json(['success' => true, 'new_balance' => $balance->balance]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
