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
    /** Four grid size presets. */
    public const SIZES = [
        'small'  => ['w' => 3,  'h' => 2],
        'medium' => ['w' => 6,  'h' => 2],
        'large'  => ['w' => 6,  'h' => 4],
        'full'   => ['w' => 12, 'h' => 3],
    ];

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

            // Validate and force size presets
            $size = $item['size'] ?? 'small';
            if (! array_key_exists($size, self::SIZES)) {
                $size = 'small';
            }

            $dimensions = self::SIZES[$size];

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

            $clean[] = [
                'id' => $item['id'] ?? null, // keep ID if updating
                'reading_key' => $readingKey,
                'period' => $period,
                'period_custom' => $periodCustom,
                'granularity' => $item['granularity'] ?? null,
                'chart' => $chart,
                'size' => $size,
                'x' => max(0, min(11, (int) ($item['x'] ?? 0))),
                'y' => max(0, min(500, (int) ($item['y'] ?? 0))),
                'w' => $dimensions['w'],
                'h' => $dimensions['h'],
                'title_override' => isset($item['title_override']) ? substr((string)$item['title_override'], 0, 80) : null,
                'args' => $args,
                'style' => $item['style'] ?? null,
            ];

            $count++;
        }

        return $clean;
    }
}
