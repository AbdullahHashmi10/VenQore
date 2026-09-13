<?php

namespace App\Http\Controllers;

use App\Models\LayoutPreference;
use App\Services\Dashboard\DashboardRegistry;
use App\Traits\ResolvesDashboardWidgets;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * The New Experience dashboard.
 *
 * Sits alongside DashboardController rather than replacing it. Classic keeps its
 * route, its controller and its behaviour untouched; a user's experience
 * preference decides which of the two they are sent to, and switching back is a
 * setting change with no data consequence.
 *
 * ── What the page load does NOT do ─────────────────────────────────────────
 *
 * It resolves no widget data. The initial response carries the catalogue and the
 * saved arrangement — a few kilobytes of structure — and each card then asks for
 * its own figures. That is the whole performance argument: a user with five
 * cards runs five queries, not the fifty the classic controller runs to build
 * every section whether or not it is visible.
 */
class WorkspaceDashboardController extends Controller
{
    use ResolvesDashboardWidgets;

    public function index(Request $request)
    {
        abort_unless(\App\Support\Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        abort_unless($tenant, 403, 'Tenant context not resolved.');

        $available = DashboardRegistry::availableFor($user, $tenant);
        $layout = $this->resolveLayout($user, $tenant, $available);

        return Inertia::render('Workspace/Dashboard', [
            // Presentation metadata only — no figures. Sizes are included so the
            // client can resize a card without a round trip.
            'catalog' => collect($available)->map(fn ($widget, $id) => [
                'id' => $id,
                'title' => $widget['title'],
                'description' => $widget['description'],
                'category' => $widget['category'],
                'sizes' => $widget['sizes'],
                'default_size' => $widget['default_size'],
            ])->values(),

            'sizePresets' => DashboardRegistry::SIZES,
            'layout' => $layout,
            'greetingName' => $user->name,
        ]);
    }

    /**
     * Save an arrangement.
     *
     * The incoming layout is rebuilt from the registry rather than stored as
     * sent: widths come from the size preset, unknown widget ids are dropped,
     * and coordinates are clamped. A layout row is user-supplied data that will
     * later drive a data request, so it is treated as untrusted at the boundary
     * and never after.
     */
    public function save(Request $request)
    {
        abort_unless(\App\Support\Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        abort_unless($tenant, 403, 'Tenant context not resolved.');

        $validated = $request->validate([
            'layout' => ['present', 'array', 'max:40'],
            'layout.*.widget' => ['required', 'string', 'max:64'],
            'layout.*.x' => ['nullable', 'integer'],
            'layout.*.y' => ['nullable', 'integer'],
            'layout.*.size' => ['nullable', 'string', 'max:16'],
        ]);

        $available = DashboardRegistry::availableFor($user, $tenant);
        $clean = DashboardRegistry::sanitizeLayout($validated['layout'], $available);

        LayoutPreference::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'surface' => LayoutPreference::DEFAULT_KEY,
            ],
            ['layout' => $clean],
        );

        return response()->json(['ok' => true, 'layout' => $clean]);
    }

    /**
     * Throw the saved arrangement away and go back to the computed default.
     *
     * The row is deleted rather than overwritten with the default. That keeps
     * "has never customised" and "customised, then reset" the same state, so a
     * user who resets today and gains a new widget entitlement tomorrow picks it
     * up in their default layout automatically.
     */
    public function reset(Request $request)
    {
        abort_unless(\App\Support\Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        abort_unless($tenant, 403, 'Tenant context not resolved.');

        LayoutPreference::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('surface', LayoutPreference::DEFAULT_KEY)
            ->delete();

        return response()->json([
            'ok' => true,
            'layout' => DashboardRegistry::defaultLayout($user, $tenant),
        ]);
    }

    /**
     * Figures for a named set of cards.
     *
     * The requested ids are intersected with what this user may see before
     * anything is resolved. Gating in the picker is a convenience; this is the
     * control — a request naming `net_profit` from a cashier's session resolves
     * nothing and returns nothing, rather than returning a number they are not
     * entitled to.
     */
    public function data(Request $request)
    {
        abort_unless(\App\Support\Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        abort_unless($tenant, 403, 'Tenant context not resolved.');

        $validated = $request->validate([
            'widgets' => ['required', 'array', 'max:40'],
            'widgets.*' => ['string', 'max:64'],
        ]);

        $available = DashboardRegistry::availableFor($user, $tenant);
        $permitted = array_values(array_intersect($validated['widgets'], array_keys($available)));

        return response()->json([
            'widgets' => $this->resolveWidgets($permitted, $user, $tenant),
            // Sent alongside so the client can format money without a second
            // source of truth for the store's currency.
            'currency' => [
                'symbol' => $tenant->currency_symbol ?? '',
                'code' => $tenant->currency_code ?? null,
            ],
        ]);
    }

    /* ------------------------------------------------------------------ *
     * Internals
     * ------------------------------------------------------------------ */

    /**
     * The arrangement to render: the saved one if there is a usable one, the
     * computed default otherwise.
     *
     * A saved layout that sanitises down to nothing — every card in it has
     * become unavailable, which is what a plan downgrade looks like — falls back
     * to the default rather than rendering an empty page the user cannot explain.
     */
    protected function resolveLayout($user, $tenant, array $available): array
    {
        $membership = app()->bound('current.membership') ? app('current.membership') : null;
        $storeRole = $membership?->role;

        // 1. User-specific layout preference
        $saved = LayoutPreference::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('surface', LayoutPreference::DEFAULT_KEY)
            ->first();

        // 2. Role-specific layout preference
        if (! $saved && $storeRole) {
            $saved = LayoutPreference::where('tenant_id', $tenant->id)
                ->whereNull('user_id')
                ->where('role', $storeRole)
                ->where('surface', LayoutPreference::DEFAULT_KEY)
                ->first();
        }

        // 3. Store-wide layout preference
        if (! $saved) {
            $saved = LayoutPreference::where('tenant_id', $tenant->id)
                ->whereNull('user_id')
                ->whereNull('role')
                ->where('surface', LayoutPreference::DEFAULT_KEY)
                ->first();
        }

        if ($saved && is_array($saved->layout)) {
            $clean = DashboardRegistry::sanitizeLayout($saved->layout, $available);

            if (! empty($clean)) {
                return $clean;
            }
        }

        return DashboardRegistry::defaultLayout($user, $tenant);
    }
}
