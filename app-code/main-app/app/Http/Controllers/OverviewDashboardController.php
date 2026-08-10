<?php

namespace App\Http\Controllers;

use App\Models\DashboardLayout;
use App\Services\Dashboard\WidgetDataService;
use App\Services\Dashboard\WidgetRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * The Overview dashboard — mockup 1a.
 *
 * ── Why this is a composed page and not another widget grid ────────────────
 *
 * The first attempt at the New Experience rendered a generic twelve-column grid
 * and let every card find its own place in it. That is the right shape for
 * "arrange your own workspace", and the wrong shape for this screen. Mockup 1a
 * is a *composed* layout: one hero metric, a black cash card beside it, four
 * essentials in a row, then everything else earned by scrolling. Those
 * relationships — the chart being wide, the cash card being dark and narrow, the
 * four stats being equal — are the design. A grid that can express any
 * arrangement cannot guarantee that one.
 *
 * So the fixed part of the page is fixed, and only the cards below "More on your
 * day" are user-arranged. That is also what the mockup shows: the "+ Add a card"
 * strip sits at the bottom, under the composed section, not around it.
 *
 * ── Data ───────────────────────────────────────────────────────────────────
 *
 * Resolved server-side in one pass rather than per-card over XHR. The composed
 * section is the same six figures for everyone who can see it, so six queries on
 * the page request beat six round trips after it. The optional cards below keep
 * the existing lazy `workspace.data` endpoint.
 */
class OverviewDashboardController extends Controller
{
    /**
     * The cards that make up the fixed composed section of 1a.
     *
     * Named here rather than inferred so that a change to the widget registry
     * cannot silently restructure this screen.
     */
    protected const HERO_WIDGETS = [
        'revenue_trend',
        'cash_position',
        'needs_attention',
        'receivables',
        'payables',
        'inventory_value',
        'net_profit',
        'top_products',
    ];

    public function index(Request $request, WidgetDataService $widgets)
    {
        abort_unless(\App\Support\Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        abort_unless($tenant, 403, 'Tenant context not resolved.');

        $available = WidgetRegistry::availableFor($user, $tenant);

        // The same permission gate the lazy endpoint uses. A cashier opening this
        // screen gets the shell and the cards they are entitled to, and the
        // finance figures simply are not in the payload — not blanked out in the
        // UI, not present and hidden.
        $permitted = array_values(array_intersect(
            static::HERO_WIDGETS,
            array_keys($available),
        ));

        return Inertia::render('Workspace/Overview', [
            'hero' => $widgets->resolve($permitted),

            'extras' => $this->resolveExtras($user, $tenant, $available),

            'catalog' => collect($available)->map(fn ($widget, $id) => [
                'id' => $id,
                'title' => $widget['title'],
                'description' => $widget['description'],
                'category' => $widget['category'],
            ])->values(),

            'greetingName' => $user->name,

            'storeName' => $tenant->name,

            'currency' => [
                'symbol' => $tenant->currency_symbol ?? '',
                'code' => $tenant->currency_code ?? null,
            ],
        ]);
    }

    /**
     * The user-chosen cards below "More on your day".
     *
     * Distinct from the composed section above: these are the ones the "+ Add a
     * card" sheet writes to, and the only ones a saved layout can affect.
     */
    protected function resolveExtras($user, $tenant, array $available): array
    {
        $saved = DashboardLayout::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('dashboard_key', DashboardLayout::DEFAULT_KEY)
            ->first();

        if (! $saved || ! is_array($saved->layout)) {
            return [];
        }

        return collect(WidgetRegistry::sanitizeLayout($saved->layout, $available))
            ->pluck('widget')
            // The composed section already shows these; repeating one below it
            // would read as a bug rather than a choice.
            ->reject(fn ($id) => in_array($id, static::HERO_WIDGETS, true))
            ->values()
            ->all();
    }
}
