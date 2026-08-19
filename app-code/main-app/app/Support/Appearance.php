<?php

namespace App\Support;

use App\Models\UserPreference;
use Illuminate\Support\Facades\Schema;

/**
 * Resolves how VenQore should look and which shell it should render, for the
 * current request.
 *
 * ── Why this is a plain static helper and not a service ─────────────────────
 *
 * It is called from two places that cannot share a container-resolved instance:
 * `HandleInertiaRequests::share()`, and `app.blade.php` — the latter needing an
 * answer *before* Inertia boots so the correct theme attributes are already on
 * <html> when the browser paints. A helper that both can call, and that fails
 * closed to the defaults, is the smallest thing that satisfies both.
 *
 * ── Resolution order ────────────────────────────────────────────────────────
 *
 *   1. The user's preference for this specific store
 *   2. The user's account-wide preference
 *   3. The store's default (set by an admin in Settings)
 *   4. System defaults
 *
 * A store default therefore *seeds* what a new staff member sees, but never
 * overrides a choice that person has already made — which is the behaviour
 * people expect from a "default", and the opposite of what a naive
 * store-wins-always order would give them.
 */
class Appearance
{
    /**
     * Kept in step with resources/js/theme/active.js — SELECTABLE_THEMES.
     *
     * Two, deliberately. Midnight is the product's look and the default every
     * user gets; Daylight is the same interface in light colours for people
     * working under bright light. Minimal, Classic and Colour were built but
     * never verified across all screens, and a theme that has not been looked
     * at on every page is a promise the product cannot keep.
     */
    public const THEMES = ['midnight-nebula', 'daylight-calm'];

    public const MODES = ['light', 'dark', 'system'];

    public const FONTS = ['theme', 'inter', 'figtree', 'system', 'grotesk', 'serif', 'mono'];

    public const DENSITIES = ['compact', 'comfortable', 'spacious'];

    public const RADII = ['sharp', 'default', 'round'];

    public const EXPERIENCES = ['classic', 'new'];

    /**
     * Classic is the default, and that is a product decision rather than a
     * technical one: an existing customer must never be moved into a new
     * interface by a deploy. They opt in.
     */
    public const DEFAULT_EXPERIENCE = 'classic';

    /** The store-level setting key holding a JSON appearance default. */
    public const TENANT_SETTING_KEY = 'appearance_default';

    /**
     * The New Experience kill switch.
     *
     * 2026-08-09: the appearance picker and the New Experience dashboard are
     * pulled from the product while they are reworked against the mockups.
     * "Pulled" means hidden, not removed — the settings page, the Overview
     * screen, the routes, the widget registry, the saved-preference tables, all
     * of it is intact underneath this flag. Flip it back to `true` and every
     * piece of work from this cycle reappears exactly as it was left.
     *
     * With this `false`, `forRequest()` below returns the same fixed payload
     * for every request — Midnight Nebula, system mode, Classic shell — and
     * never reads `user_preferences` or the tenant default at all. That is
     * deliberate: hiding the *settings page* alone would still let a theme or
     * experience someone saved before this flag existed keep rendering, which
     * is a different bug wearing the same hidden-page costume. Nobody sees
     * anything but Midnight Nebula and Classic until this flips back.
     */
    public const NEW_EXPERIENCE_ENABLED = true;

    public static function defaults(): array
    {
        return [
            // Must stay in step with ACTIVE_THEME in resources/js/theme/active.js.
            // These disagreeing is what drained the colour out of the product:
            // the build painted Midnight into `:root`, then this default told
            // every request the user wanted Minimal, and Minimal won.
            'theme' => 'midnight-nebula',
            'mode' => 'system',
            'primary' => null,   // null = use the theme's own brand ramp
            'accent' => null,
            'font' => 'theme',   // 'theme' = use the theme's own typography
            'density' => 'comfortable',
            'radius' => 'default',
        ];
    }

    /**
     * The full appearance + experience payload for the current request.
     *
     * Every failure path returns defaults rather than throwing. This runs on the
     * marketing site, on the installer, during migrations and before the
     * database exists; a theme resolver is never a good enough reason to 500 a
     * page.
     */
    /**
     * Memoised for the life of the request.
     *
     * This is called at least twice on every page — once by app.blade.php to put
     * the attributes on <html> before the browser paints, and once by
     * HandleInertiaRequests to share the same values with React. Both need the
     * same answer, and neither should pay for a second lookup to get it.
     *
     * The memo lives in the container rather than in a static property on
     * purpose. A static would survive between tests in one PHP process — and
     * under Octane, between requests from different users — which is precisely
     * the class of bug where one customer sees another's theme. The container is
     * rebuilt for each, so this cache can never outlive the request it belongs
     * to.
     */
    protected const MEMO_KEY = 'vq.appearance.resolved';

    public static function forRequest(): array
    {
        if (app()->bound(static::MEMO_KEY)) {
            return app(static::MEMO_KEY);
        }

        // Kill switch: skip every source of a non-default look — saved
        // per-user preference, per-account preference, tenant default — and
        // hand back the fixed payload. See the constant's doc comment for why
        // this has to sit above the lookups rather than only hide the page
        // that writes them.
        if (! static::NEW_EXPERIENCE_ENABLED) {
            $resolved = [
                ...static::sanitize(static::defaults()),
                'experience' => static::DEFAULT_EXPERIENCE,
            ];

            app()->instance(static::MEMO_KEY, $resolved);

            return $resolved;
        }

        $appearance = static::defaults();
        $experience = static::DEFAULT_EXPERIENCE;

        try {
            $user = auth()->hasUser() ? auth()->user() : null;
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            $tenantId = $tenant?->id;

            if ($tenantId) {
                $appearance = array_merge($appearance, static::tenantDefault());
            }

            if ($user && Schema::hasTable('user_preferences')) {
                $saved = UserPreference::resolve($user->id, $tenantId, UserPreference::KEY_APPEARANCE);
                if ($saved) {
                    $appearance = array_merge($appearance, static::sanitize($saved));
                }

                $savedExperience = UserPreference::resolve($user->id, $tenantId, UserPreference::KEY_EXPERIENCE);
                if (isset($savedExperience['value']) && in_array($savedExperience['value'], static::EXPERIENCES, true)) {
                    $experience = $savedExperience['value'];
                }
            }
        } catch (\Throwable) {
            // Database not ready, no session, console context — defaults stand.
        }

        $resolved = [
            ...static::sanitize($appearance),
            'experience' => $experience,
        ];

        app()->instance(static::MEMO_KEY, $resolved);

        return $resolved;
    }

    /**
     * Drop the memoised value.
     *
     * Needed after a save inside the same request: AppearanceController writes
     * the preference and then returns `back()`, and without this the redirect
     * would re-share the appearance the user had a moment before they changed it
     * — the setting would look like it had not taken effect until the next
     * navigation.
     */
    public static function flush(): void
    {
        app()->forgetInstance(static::MEMO_KEY);
    }

    /**
     * The store's own default, read through the existing settings helper so it
     * shares the same tenant scoping and cache as every other store setting.
     */
    public static function tenantDefault(): array
    {
        try {
            if (! Schema::hasTable('settings')) {
                return [];
            }

            $raw = \App\Helpers\SettingsHelper::get(static::TENANT_SETTING_KEY);

            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                return is_array($decoded) ? static::sanitize($decoded, false) : [];
            }
        } catch (\Throwable) {
            // Setting absent or malformed — the store simply has no default.
        }

        return [];
    }

    /**
     * Drop anything that is not a recognised value.
     *
     * These land on <html> as attributes and, for the two colours, inside an
     * inline `style`, so this is an escaping boundary as much as a validation
     * one: an unvalidated string here would be an attribute-injection vector on
     * every page in the product.
     *
     * @param  bool  $fill  Whether to backfill missing keys with defaults.
     */
    public static function sanitize(array $input, bool $fill = true): array
    {
        $defaults = static::defaults();
        $out = [];

        $enums = [
            'theme' => static::THEMES,
            'mode' => static::MODES,
        ];

        foreach ($enums as $key => $allowed) {
            if (isset($input[$key]) && in_array($input[$key], $allowed, true)) {
                $out[$key] = $input[$key];
            } elseif ($fill) {
                $out[$key] = $defaults[$key];
            }
        }

        // Typography, density and corner radius are pinned.
        //
        // The constants survive so the CSS generator keeps emitting the scoped
        // blocks and a future decision to re-expose one is a UI change rather
        // than a migration. But this is the single gate every write passes
        // through, so pinning here means no request — hand-crafted, replayed
        // from an old client, or restored from a row saved before these were
        // withdrawn — can put the app back into an untested size.
        if ($fill) {
            $out['font'] = $defaults['font'];
            $out['density'] = $defaults['density'];
            $out['radius'] = $defaults['radius'];
        }

        foreach (['primary', 'accent'] as $key) {
            if (array_key_exists($key, $input)) {
                $out[$key] = static::hex($input[$key]);
            } elseif ($fill) {
                $out[$key] = null;
            }
        }

        return $out;
    }

    /** A 6-digit hex colour, or null. Nothing else gets through. */
    public static function hex(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return preg_match('/^#[0-9a-fA-F]{6}$/', $value) === 1
            ? strtolower($value)
            : null;
    }

    /**
     * The attributes to put on <html> server-side.
     *
     * Rendering these in Blade rather than setting them from React is what stops
     * the app flashing the build-time default theme on every full page load.
     * The two custom colours are not here — they need the colour-ramp maths that
     * lives in resources/js/theme, and are applied synchronously in app.jsx
     * before the first React render.
     */
    public static function htmlAttributes(array $appearance): array
    {
        // Every fallback here reads from defaults() rather than repeating a
        // literal. This line hardcoded 'minimal', which meant any request that
        // reached Blade without a resolved theme painted the retired theme onto
        // <html> before the first paint — the exact flash these attributes exist
        // to prevent.
        $defaults = static::defaults();

        $attributes = [
            'data-vq-theme' => $appearance['theme'] ?? $defaults['theme'],
            'data-vq-density' => $appearance['density'] ?? $defaults['density'],
            'data-vq-radius' => $appearance['radius'] ?? $defaults['radius'],
        ];

        if (($appearance['font'] ?? 'theme') !== 'theme') {
            $attributes['data-vq-font'] = $appearance['font'];
        }

        return $attributes;
    }
}
