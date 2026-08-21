<?php

namespace App\Reckoner;

/**
 * Layout Law v2.0 — the server-side resolver.
 *
 * The PHP half of `resources/js/Dashboard/layoutLaw.js`. Both read the same
 * `resources/layout-law.json`; neither restates a number.
 *
 * That is the whole point of this class. The twelve `2x4 … 8x8` presets it
 * replaces were declared twice — once in `DashboardBuilderSheet.jsx` and once
 * in `DashboardSanitizer::SIZES` — and nothing checked the two lists agreed.
 * A geometry constant that exists in two files is a constant that will drift.
 *
 * Reads:
 *   size(n) = n*UNIT + (n-1)*GUTTER,  UNIT 64px vertical, GUTTER 24px both axes
 *   Six categories C1..C6, each with a max and an ordered list of fits.
 *   A fit is cols x rows plus a pixel width floor. The leanest fit IS the minimum.
 *
 * @see resources/layout-law.json
 * @see VENQORE_LAYOUT_LAW.md
 */
class LayoutLaw
{
    public const CATEGORY_KEYS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

    /** @var array<string,mixed>|null Parsed once per request. */
    private static ?array $law = null;

    /**
     * The law, loaded from JSON.
     *
     * Fails loudly rather than falling back to a hardcoded default: a silent
     * default here would be a second source of geometry, which is exactly the
     * failure this class exists to prevent.
     */
    public static function law(): array
    {
        if (self::$law !== null) {
            return self::$law;
        }

        $path = resource_path('layout-law.json');

        if (! is_readable($path)) {
            throw new \RuntimeException(
                "[LayoutLaw] resources/layout-law.json is missing or unreadable. "
                . "It is the single source for card geometry — see VENQORE_LAYOUT_LAW.md."
            );
        }

        $decoded = json_decode(file_get_contents($path), true);

        if (! is_array($decoded) || ! isset($decoded['grid'], $decoded['categories'])) {
            throw new \RuntimeException('[LayoutLaw] layout-law.json is malformed.');
        }

        return self::$law = $decoded;
    }

    public static function grid(): array
    {
        return self::law()['grid'];
    }

    public static function columns(): int
    {
        return (int) self::grid()['columns'];
    }

    /** size(n) = n*unit + (n-1)*gutter. The one law, both axes. */
    public static function size(int $n): int
    {
        if ($n < 1) {
            return 0;
        }

        $grid = self::grid();

        return $n * (int) $grid['unit'] + ($n - 1) * (int) $grid['gutter'];
    }

    /* ------------------------------------------------------------------ *
     * Categories and fits
     * ------------------------------------------------------------------ */

    public static function categories(): array
    {
        return self::law()['categories'];
    }

    /** @return array<int,array<string,mixed>> Widest first, as declared. */
    public static function fitsFor(string $category): array
    {
        return self::categories()[$category]['fits'] ?? [];
    }

    public static function defaultFit(string $category): ?array
    {
        $fits = self::fitsFor($category);

        foreach ($fits as $fit) {
            if (! empty($fit['default'])) {
                return $fit;
            }
        }

        return $fits[0] ?? null;
    }

    public static function findFit(string $category, ?string $fitKey): ?array
    {
        if ($fitKey === null) {
            return null;
        }

        foreach (self::fitsFor($category) as $fit) {
            if ($fit['key'] === $fitKey) {
                return $fit;
            }
        }

        return null;
    }

    /** `['w' => int, 'h' => int]`, clamped to the category's declared max. */
    public static function dimensionsOf(string $category, ?string $fitKey): array
    {
        $cat = self::categories()[$category] ?? null;
        $fit = self::findFit($category, $fitKey) ?? self::defaultFit($category);

        if ($cat === null || $fit === null) {
            return ['w' => 4, 'h' => 4];
        }

        return [
            'w' => min((int) $fit['w'], (int) $cat['max']['w'], self::columns()),
            'h' => min((int) $fit['h'], (int) $cat['max']['h']),
        ];
    }

    /* ------------------------------------------------------------------ *
     * Chart legality
     * ------------------------------------------------------------------ */

    /** @return array<int,string> First entry is the default. */
    public static function chartsForShape(string $shape): array
    {
        return self::law()['chartLegality'][$shape] ?? [];
    }

    public static function defaultChartForShape(string $shape): string
    {
        return self::chartsForShape($shape)[0] ?? 'stat';
    }

    public static function isChartLegal(string $shape, string $chart): bool
    {
        return in_array($chart, self::chartsForShape($shape), true);
    }

    /** @return array<int,string> Leanest first. */
    public static function categoriesForChart(string $chart): array
    {
        return self::law()['chartCategories'][$chart] ?? ['C4', 'C5'];
    }

    /**
     * The legibility floor — the leanest category a chart may render in.
     *
     * The twelve-preset system had no way to express this, which is how a pie
     * chart could be persisted at 2x4 and render as an unreadable disc.
     */
    public static function minCategoryForChart(string $chart): string
    {
        return self::categoriesForChart($chart)[0] ?? 'C4';
    }

    /**
     * Stated per chart rather than derived — see the note in layout-law.json.
     * Taking index 1 of the legal list put a stat in a C2 Strip, 64px tall,
     * with no room for a delta pill beneath the value.
     */
    public static function defaultCategoryForChart(string $chart): string
    {
        $stated = self::law()['chartDefaultCategory'][$chart] ?? null;
        if (is_string($stated) && self::isCategoryLegal($chart, $stated)) {
            return $stated;
        }

        $cats = self::categoriesForChart($chart);

        return $cats[min(1, count($cats) - 1)] ?? 'C4';
    }

    /**
     * Legality is a floor, not a whitelist.
     *
     * A chart may always be given MORE room than its floor. A stat in a C5
     * board is wasteful but readable; a heatmap in a C1 tile is not readable at
     * all, and only the second is a fail.
     */
    public static function isCategoryLegal(string $chart, string $category): bool
    {
        $floor = array_search(self::minCategoryForChart($chart), self::CATEGORY_KEYS, true);
        $given = array_search($category, self::CATEGORY_KEYS, true);

        return $given !== false && $floor !== false && $given >= $floor;
    }

    /* ------------------------------------------------------------------ *
     * Coercion
     * ------------------------------------------------------------------ */

    /**
     * Force a card into a legal category + fit + span.
     *
     * Mirrors `coerce()` in layoutLaw.js. Never throws: an illegal card becomes
     * a legal one rather than a hole in the grid or a stack trace in front of a
     * user looking at their takings.
     *
     * Legacy rows still carry a `size` like `4x8`, which is not a fit of
     * anything. `fromLegacySize()` maps them to the nearest legal shape.
     */
    public static function coerce(array $card): array
    {
        $chart = is_string($card['chart'] ?? null) ? $card['chart'] : 'stat';

        $category = $card['category'] ?? null;
        $fitKey = $card['fit'] ?? null;

        // No category means either a brand-new card or a row from before the
        // law. If it carries a legacy preset, translate it rather than dropping
        // the user's chosen proportions on the floor.
        if (! is_string($category) || ! in_array($category, self::CATEGORY_KEYS, true)) {
            $legacy = self::fromLegacySize($card['size'] ?? null, $chart);
            $category = $legacy['category'];
            $fitKey = $fitKey ?? $legacy['fit'];
        }

        if (! self::isCategoryLegal($chart, $category)) {
            $category = self::defaultCategoryForChart($chart);
            $fitKey = null;
        }

        $fit = self::findFit($category, $fitKey) ?? self::defaultFit($category);
        $dims = self::dimensionsOf($category, $fit['key'] ?? null);

        $card['chart'] = $chart;
        $card['category'] = $category;
        $card['fit'] = $fit['key'] ?? null;
        $card['w'] = $dims['w'];
        $card['h'] = $dims['h'];
        $card['x'] = max(0, min(self::columns() - $dims['w'], (int) ($card['x'] ?? 0)));
        $card['y'] = max(0, (int) ($card['y'] ?? 0));

        return $card;
    }

    /**
     * Map a legacy `WxH` preset onto the nearest legal category + fit.
     *
     * The twelve presets were arbitrary — `2x4`, `8x8` and the rest express
     * neither a C1 tile nor a 4x1 inline strip — so there is no exact
     * translation. Nearest by area, tie-broken by aspect ratio, keeps a wide
     * card wide and a tall card tall, which is what a user recognises when
     * their board reloads.
     *
     * @return array{category:string,fit:?string}
     */
    public static function fromLegacySize(?string $sizeKey, string $chart = 'stat'): array
    {
        if (! is_string($sizeKey) || ! preg_match('/^(\d+)x(\d+)$/', $sizeKey, $m)) {
            return ['category' => self::defaultCategoryForChart($chart), 'fit' => null];
        }

        $w = (int) $m[1];
        $h = (int) $m[2];
        $area = max($w * $h, 1);
        $aspect = max($w / max($h, 1), 0.1);

        $best = null;

        foreach (self::CATEGORY_KEYS as $category) {
            if (! self::isCategoryLegal($chart, $category)) {
                continue;
            }

            foreach (self::fitsFor($category) as $fit) {
                $dArea = abs($fit['w'] * $fit['h'] - $area) / $area;
                $dAspect = abs($fit['w'] / $fit['h'] - $aspect) / $aspect;
                $score = $dArea + $dAspect * 0.5;

                if ($best === null || $score < $best['score']) {
                    $best = ['category' => $category, 'fit' => $fit['key'], 'score' => $score];
                }
            }
        }

        return $best
            ? ['category' => $best['category'], 'fit' => $best['fit']]
            : ['category' => self::defaultCategoryForChart($chart), 'fit' => null];
    }

    /* ------------------------------------------------------------------ *
     * Validation
     * ------------------------------------------------------------------ */

    /**
     * Reject an illegal layout before it is stored.
     *
     * A validator, not a linter — the contract that lets Reckoner author
     * dashboards. Returns human-readable problems; empty means legal.
     *
     * @param  array<int,array<string,mixed>>  $cards
     * @return array<int,string>
     */
    public static function validate(array $cards): array
    {
        $problems = [];
        $accentCount = 0;

        foreach ($cards as $i => $card) {
            $at = "card {$i}" . (isset($card['reading_key']) ? " ({$card['reading_key']})" : '');
            $category = $card['category'] ?? '';
            $cat = self::categories()[$category] ?? null;

            if ($cat === null) {
                $problems[] = "{$at}: unknown category \"{$category}\".";
                continue;
            }

            $fit = self::findFit($category, $card['fit'] ?? null);

            if ($fit === null) {
                $problems[] = "{$at}: \"" . ($card['fit'] ?? 'null')
                    . "\" is not a declared fit of {$category}.";
            } elseif ((int) $card['w'] !== (int) $fit['w'] || (int) $card['h'] !== (int) $fit['h']) {
                $problems[] = "{$at}: fit \"{$fit['key']}\" is {$fit['w']}x{$fit['h']} but the card "
                    . "is {$card['w']}x{$card['h']}. Rendering a fit at the wrong span is a fail.";
            }

            if ((int) $card['w'] > (int) $cat['max']['w'] || (int) $card['h'] > (int) $cat['max']['h']) {
                $problems[] = "{$at}: {$card['w']}x{$card['h']} exceeds {$category}'s max "
                    . "{$cat['max']['w']}x{$cat['max']['h']}.";
            }

            if ((int) ($card['x'] ?? 0) + (int) $card['w'] > self::columns()) {
                $problems[] = "{$at}: overflows the " . self::columns() . "-column grid.";
            }

            $chart = $card['chart'] ?? null;
            if (is_string($chart) && ! self::isCategoryLegal($chart, $category)) {
                $problems[] = "{$at}: \"{$chart}\" needs at least "
                    . self::minCategoryForChart($chart)
                    . "; {$category} is below its legibility floor.";
            }

            if (! empty($card['style']['accent'])) {
                $accentCount++;
            }
        }

        // Mechanism M1. The accent is spent once per board, on the headline
        // metric. Two accent cards means neither is the headline.
        $max = (int) (self::law()['accent']['maxPerBoard'] ?? 1);
        if ($accentCount > $max) {
            $problems[] = "{$accentCount} accent-filled cards. The accent is spent once per "
                . 'board and only on the headline metric (M1).';
        }

        return $problems;
    }

    /**
     * Enforce M1 across a board: at most one accent card survives.
     *
     * Keeps the first, clears the rest. Called on write so a board can never be
     * stored in a state the validator would reject.
     *
     * @param  array<int,array<string,mixed>>  $cards
     * @return array<int,array<string,mixed>>
     */
    public static function enforceAccentBudget(array $cards): array
    {
        $seen = 0;
        $max = (int) (self::law()['accent']['maxPerBoard'] ?? 1);

        foreach ($cards as $i => $card) {
            if (empty($card['style']['accent'])) {
                continue;
            }

            if (++$seen > $max) {
                $cards[$i]['style']['accent'] = false;
            }
        }

        return $cards;
    }
}
