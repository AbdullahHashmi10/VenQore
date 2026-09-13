<?php

namespace App\Reckoner;

/**
 * DashboardSanitizer — cleans, validates, and sanitizes layout cards against
 * current tenant plans, capabilities, and permissions.
 *
 * Enforces the layout hygiene rules from §7.3.
 */
class DashboardSanitizer
{
    /**
     * The twelve `2x4 … 8x8` presets that used to live here are gone.
     *
     * They were superseded by Layout Law v2.0's six categories and eighteen
     * fits, and they were wrong in three ways that mattered: they could not
     * express a C1 tile or a 4x1 inline strip, they carried no legibility floor
     * (a pie chart could be persisted at 2x4 and render as an unreadable disc),
     * and they were declared a second time in DashboardBuilderSheet.jsx with
     * nothing checking the two lists agreed.
     *
     * Geometry now comes from resources/layout-law.json via App\Reckoner\LayoutLaw,
     * which the JS resolver reads too. Stored rows still carrying a legacy
     * `size` are translated by LayoutLaw::fromLegacySize().
     *
     * @deprecated Kept only so any caller still reading it fails loudly rather
     *             than silently sizing every card 4x4.
     * @see \App\Reckoner\LayoutLaw
     */
    public const SIZES = [];

    /** Deprecated metric keys migration map. */
    private const DEPRECATED_MAP = [
        // Example: 'sales.old_revenue' => 'sales.revenue'
    ];

    /**
     * Sanitize a list of cards against available metric keys.
     *
     * @param  array  $cards          The array of cards input (e.g. from API request)
     * @param  array  $availableKeys  Registry keys currently available to the tenant/user
     * @return array                  Sanitized card array
     */
    public static function sanitize(array $cards, array $availableKeys): array
    {
        $clean = [];
        $count = 0;

        foreach ($cards as $item) {
            if ($count >= 40) {
                break;
            }

            if (! is_array($item)) {
                continue;
            }

            $readingKey = $item['reading_key'] ?? null;
            if (! is_string($readingKey)) {
                continue;
            }

            // Reject platform-scoped keys outright
            if (str_starts_with($readingKey, 'platform.')) {
                continue;
            }

            // Migrate deprecated keys
            if (isset(self::DEPRECATED_MAP[$readingKey])) {
                $readingKey = self::DEPRECATED_MAP[$readingKey];
            }

            // Drop cards whose reading key is unknown or currently gated (not available)
            if (! in_array($readingKey, $availableKeys, true)) {
                continue;
            }

            $definition = ReckonerRegistry::find($readingKey);
            if ($definition === null) {
                continue;
            }

            // Validate and force period
            $period = $item['period'] ?? null;
            $allowedPeriods = $definition['periods'] ?? [];
            if (! is_string($period) || ! in_array($period, $allowedPeriods, true)) {
                $period = $definition['default_period'] ?? 'today';
            }

            // Validate and force chart
            $chart = $item['chart'] ?? null;
            $shape = $definition['shape'];
            if (! is_string($chart) || ! ReckonerCharts::isLegal($shape, $chart)) {
                $chart = ReckonerCharts::default($shape);
            }

            // Category, fit and span, forced legal by the Layout Law. This
            // also absorbs rows written under the old preset system: an
            // incoming `size` of '4x8' is mapped to the nearest legal fit
            // rather than dropped, so a board survives the migration looking
            // like the board the user built.
            //
            // A hand-dragged span arrives as w/h that no longer match the
            // stored fit. Geometry lives in the fit, not in loose numbers, so
            // rather than discard the drag (which made the card visibly snap
            // back after every save) the drag is re-expressed as a size and
            // mapped to the nearest legal fit. The user gets the closest legal
            // shape to what they drew, and the board stays inside the law.
            $category = $item['category'] ?? null;
            $fit = $item['fit'] ?? null;
            $size = $item['size'] ?? null;

            $draggedW = isset($item['w']) ? (int) $item['w'] : null;
            $draggedH = isset($item['h']) ? (int) $item['h'] : null;

            if ($draggedW !== null && $draggedH !== null && is_string($category) && is_string($fit)) {
                $declared = LayoutLaw::findFit($category, $fit);
                if ($declared !== null && ($declared['w'] !== $draggedW || $declared['h'] !== $draggedH)) {
                    $size = "{$draggedW}x{$draggedH}";
                    $category = null;
                    $fit = null;
                }
            }

            $geometry = LayoutLaw::coerce([
                'chart' => $chart,
                'category' => $category,
                'fit' => $fit,
                'size' => $size,
                'x' => $item['x'] ?? 0,
                'y' => $item['y'] ?? 0,
            ]);

            // Whitelist args (currently we allow null or array, in a real env we can filter further)
            $args = $item['args'] ?? null;
            if ($args !== null && ! is_array($args)) {
                $args = null;
            }

            // Parse custom period dates if custom period selected
            $periodCustom = $item['period_custom'] ?? null;
            if ($periodCustom !== null && ! is_array($periodCustom)) {
                $periodCustom = null;
            }

            // The `style` bag carries the knobs the prototype exposed and the
            // shipped builder never did: variant, accent, period picker. The
            // column has existed since the dashboards migration and nothing
            // read it. Whitelisted rather than passed through, because it is
            // user-supplied JSON that ends up in a style attribute.
            $style = $item['style'] ?? null;
            $style = is_array($style) ? self::sanitizeStyle($style) : null;

            $clean[] = [
                'id' => $item['id'] ?? null, // keep ID if updating
                'reading_key' => $readingKey,
                'period' => $period,
                'period_custom' => $periodCustom,
                'granularity' => $item['granularity'] ?? null,
                'chart' => $chart,
                'category' => $geometry['category'],
                'fit' => $geometry['fit'],
                'x' => $geometry['x'],
                'y' => min(500, $geometry['y']),
                'w' => $geometry['w'],
                'h' => $geometry['h'],
                'title_override' => isset($item['title_override']) ? substr((string)$item['title_override'], 0, 80) : null,
                'args' => $args,
                'style' => $style,
            ];

            $count++;
        }

        // Mechanism M1: the accent is spent once per board, on the headline
        // metric. Enforced on write so a board can never be stored in a state
        // the validator would reject.
        return LayoutLaw::enforceAccentBudget($clean);
    }

    /**
     * Whitelist the card `style` bag.
     *
     * Everything here is a closed set or a boolean. Nothing free-form reaches a
     * style attribute: `variant` and `emphasis` are matched against the values
     * the card renderer knows, and an unrecognised value is dropped rather than
     * passed through, because this JSON is user-supplied and ends up in the DOM.
     *
     * @param  array<string,mixed>  $style
     * @return array<string,mixed>|null
     */
    private static function sanitizeStyle(array $style): ?array
    {
        $clean = [];

        // The one accent-filled card on the board (M1).
        if (isset($style['accent'])) {
            $clean['accent'] = (bool) $style['accent'];
        }

        // Which look a chart wears. Free text would be a style-injection
        // vector, so it is slug-shaped or nothing.
        if (isset($style['variant']) && is_string($style['variant'])
            && preg_match('/^[a-z][a-z0-9_-]{0,31}$/', $style['variant'])) {
            $clean['variant'] = $style['variant'];
        }

        // Per-card period control (PREFS.periodPicker in the prototype).
        if (isset($style['periodPicker'])) {
            $clean['periodPicker'] = (bool) $style['periodPicker'];
        }

        // Extra series for comparison. Reading keys are validated against the
        // registry by the caller; here they are only shape-checked and capped
        // at three, which is the prototype's limit.
        if (isset($style['extraKeys']) && is_array($style['extraKeys'])) {
            $keys = array_values(array_filter(
                $style['extraKeys'],
                fn ($k) => is_string($k) && $k !== '' && ! str_starts_with($k, 'platform.'),
            ));
            if ($keys !== []) {
                $clean['extraKeys'] = array_slice($keys, 0, 3);
            }
        }

        return $clean === [] ? null : $clean;
    }
}
