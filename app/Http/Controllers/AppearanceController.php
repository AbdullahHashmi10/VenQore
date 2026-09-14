<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\UserPreference;
use App\Support\Appearance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Reads and writes the presentation-layer preferences: theme, mode, custom
 * colours, typeface, density, corner radius, and which shell to render.
 *
 * Nothing here touches business configuration. That is the guarantee the
 * experience switch rests on — a user flipping to the New Experience and back
 * changes which React page renders and nothing else. No permission is granted or
 * revoked, no total is recalculated, no record is written outside the two
 * preference tables.
 */
class AppearanceController extends Controller
{
    /** Persist a user's appearance choice. */
    public function update(Request $request)
    {
        // Belt-and-braces: the routes into this controller are commented out
        // while Appearance::NEW_EXPERIENCE_ENABLED is false, so this should be
        // unreachable in the running app. It stays here so that re-enabling one
        // route without flipping the flag back on fails loudly instead of
        // quietly writing a preference nothing will ever read.
        abort_unless(Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        $validated = $request->validate([
            'theme' => ['nullable', 'string', 'in:' . implode(',', Appearance::THEMES)],
            'mode' => ['nullable', 'string', 'in:' . implode(',', Appearance::MODES)],
            'primary' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'accent' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],

            // Whether this applies to every store the user belongs to, or only
            // the one they are in. Someone running a café and a workshop may well
            // want to tell them apart at a glance.
            'scope' => ['nullable', 'string', 'in:store,account'],
        ]);

        $scope = $validated['scope'] ?? 'store';
        unset($validated['scope']);

        // Merge over what they already have, so a request that only changes the
        // density does not silently reset their colours.
        $current = Appearance::forRequest();
        unset($current['experience']);

        $merged = Appearance::sanitize(array_merge($current, array_filter(
            $validated,
            fn ($value) => $value !== null,
        )));

        // A colour explicitly cleared has to survive array_filter above, which
        // would otherwise read "reset to the theme's own colour" as "no change".
        foreach (['primary', 'accent'] as $key) {
            if ($request->exists($key) && $request->input($key) === null) {
                $merged[$key] = null;
            }
        }

        UserPreference::put(
            $user->id,
            $scope === 'account' ? null : $tenant?->id,
            UserPreference::KEY_APPEARANCE,
            $merged,
        );

        // A store-scoped save leaves a stale account-wide row shadowing nothing —
        // resolution prefers the scoped row — but an account-wide save must clear
        // the scoped one, or the user changes their global theme and sees no
        // effect in the store they are standing in.
        if ($scope === 'account' && $tenant) {
            UserPreference::where('user_id', $user->id)
                ->where('tenant_id', $tenant->id)
                ->where('key', UserPreference::KEY_APPEARANCE)
                ->delete();
        }

        // The redirect re-shares the appearance prop; without dropping the
        // request-scoped memo it would carry the value from before this save.
        Appearance::flush();

        return back()->with('success', 'Appearance updated.');
    }

    /** Switch a user between the Classic and New shells. */
    public function switchExperience(Request $request)
    {
        abort_unless(Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $user = $request->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        $validated = $request->validate([
            'experience' => ['required', 'string', 'in:' . implode(',', Appearance::EXPERIENCES)],
        ]);

        UserPreference::put(
            $user->id,
            $tenant?->id,
            UserPreference::KEY_EXPERIENCE,
            ['value' => $validated['experience']],
        );

        Appearance::flush();

        // Land the user on the shell they just chose, rather than telling them
        // it changed and leaving them looking at the other one.
        // The New Experience opens on the Overview (mockup 1a), not the bare
        // widget grid — the grid is what the Overview's "Add a card" strip feeds
        // into, not the front door.
        $route = $validated['experience'] === 'new' ? 'store.overview' : 'store.dashboard-v1';

        return redirect()->route($route, ['store_slug' => $tenant?->slug]);
    }

    /**
     * Set the store-wide default that new staff inherit.
     *
     * Stored in the existing settings table so it shares that table's tenant
     * scoping and cache rather than introducing a parallel one. It seeds; it does
     * not override anyone who has already chosen for themselves.
     */
    public function updateTenantDefault(Request $request)
    {
        abort_unless(Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        abort_unless($tenant, 403, 'Tenant context not resolved.');

        $validated = $request->validate([
            'theme' => ['nullable', 'string', 'in:' . implode(',', Appearance::THEMES)],
            'mode' => ['nullable', 'string', 'in:' . implode(',', Appearance::MODES)],
            'primary' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'accent' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => Appearance::TENANT_SETTING_KEY],
            ['value' => json_encode(Appearance::sanitize($validated, false))],
        );

        Cache::forget("settings:{$tenant->id}");
        Appearance::flush();

        return back()->with('success', 'Store appearance default updated.');
    }
}
