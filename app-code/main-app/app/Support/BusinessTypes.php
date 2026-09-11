<?php

namespace App\Support;

/**
 * Reads config/business_types.php — the one catalogue of the 85 business
 * types — and understands what a visitor types.
 *
 *   BusinessTypes::match('I have a plumbing service and I run it alone')
 *     → ['key' => 'plumber', 'confident' => true, 'candidates' => [...], ...]
 *
 * Matching is deterministic and free (no model call): every alias is matched
 * on whole words, plurals are folded ("tyres" = "tyre"), a multi-word alias
 * scores higher than a single word, a multi-word alias still counts when its
 * words appear apart ("repair air conditioners"), and a one-letter typo in a
 * word of five letters or more is tolerated ("resturant", "pharmcy").
 * A miss is fixed by adding an alias in the config, not by changing code.
 */
final class BusinessTypes
{
    /** A whole-word alias of one word scores this much; longer phrases score per word. */
    private const WORD = 3;

    private static ?array $index = null;

    /** @return array<string, array> key => type (with 'key' filled in) */
    public static function all(): array
    {
        $out = [];
        foreach ((array) config('business_types.types', []) as $key => $type) {
            $out[$key] = ['key' => $key] + $type;
        }

        return $out;
    }

    public static function get(?string $key): ?array
    {
        $key = (string) $key;

        return $key !== '' && ($t = config("business_types.types.{$key}")) ? ['key' => $key] + $t : null;
    }

    public static function exists(?string $key): bool
    {
        return self::get($key) !== null;
    }

    public static function sectors(): array
    {
        return (array) config('business_types.sectors', []);
    }

    /**
     * The preset a business type (or a preset key, or a legacy value) builds on.
     * Returns null when the value is neither.
     */
    public static function presetFor(?string $keyOrPreset): ?string
    {
        $value = (string) $keyOrPreset;
        if ($value === '') {
            return null;
        }
        if ($type = self::get($value)) {
            return $type['preset'];
        }

        return config("ai_builder.presets.{$value}") ? $value : null;
    }

    /**
     * Live modules for a type: preset + type extras + every hard dependency,
     * with anything not 'live' in config/modules.php dropped.
     */
    public static function modulesFor(?string $key): array
    {
        $type = self::get($key);
        $preset = $type ? $type['preset'] : (string) $key;
        $modules = array_merge(
            (array) config("ai_builder.presets.{$preset}.modules", []),
            (array) ($type['modules'] ?? [])
        );

        return self::withDependencies($modules);
    }

    /**
     * Terminology for a type: the preset's terms, then the type's own on top.
     * Shape matches ApplyConfigurationService: key => ['singular', 'plural'].
     */
    public static function termsFor(?string $key): array
    {
        $type = self::get($key);
        $preset = $type ? $type['preset'] : (string) $key;

        $terms = (array) config("ai_builder.presets.{$preset}.terms", []);
        foreach ((array) ($type['terms'] ?? []) as $term => $words) {
            $terms[$term] = [
                'singular' => (string) ($words[0] ?? $words['singular'] ?? ''),
                'plural'   => (string) ($words[1] ?? $words['plural'] ?? ''),
            ];
        }

        return array_filter($terms, fn ($w) => !empty($w['singular']) && !empty($w['plural']));
    }

    /**
     * Compact list for the builder's search box and the public site.
     */
    public static function forClient(): array
    {
        $out = [];
        foreach (self::all() as $key => $t) {
            $out[] = [
                'key'     => $key,
                'sector'  => $t['sector'],
                'label'   => $t['label'],
                'note'    => $t['note'] ?? null,
                'preset'  => $t['preset'],
                'aliases' => array_values($t['aliases'] ?? []),
                'terms'   => self::termsFor($key),
            ];
        }

        return $out;
    }

    /**
     * Read free text and name the business type.
     *
     * @return array{key: ?string, confident: bool, score: int, candidates: string[]}
     *   key         best type, or null when nothing scored
     *   confident   true when the best clearly beats the runner-up (or both
     *               lead to the same preset, so the choice changes nothing)
     *   candidates  up to three best keys — the builder offers them as
     *               "Did you mean…" when not confident
     */
    public static function match(?string $text): array
    {
        $tokens = self::tokens((string) $text);
        if ($tokens === []) {
            return ['key' => null, 'confident' => false, 'score' => 0, 'candidates' => []];
        }

        $tokenSet = array_flip($tokens);
        $haystack = ' ' . implode(' ', $tokens) . ' ';
        $scores = [];

        foreach (self::index() as $key => $phrases) {
            $score = 0;
            foreach ($phrases as $phraseTokens) {
                $n = count($phraseTokens);
                $phrase = ' ' . implode(' ', $phraseTokens) . ' ';

                if (str_contains($haystack, $phrase)) {
                    $score += self::WORD * $n;               // exact phrase
                } elseif ($n > 1 && !array_diff($phraseTokens, $tokens)) {
                    $score += (self::WORD - 1) * $n;         // all words, apart
                } elseif ($n === 1 && strlen($phraseTokens[0]) >= 5 && self::nearMiss($phraseTokens[0], $tokenSet)) {
                    $score += 1;                             // one-letter typo
                }
            }
            if ($score > 0) {
                $scores[$key] = $score;
            }
        }

        if ($scores === []) {
            return ['key' => null, 'confident' => false, 'score' => 0, 'candidates' => []];
        }

        // Stable order: score desc, then catalogue order.
        $order = array_flip(array_keys(self::index()));
        uksort($scores, fn ($a, $b) => [$scores[$b], $order[$a]] <=> [$scores[$a], $order[$b]]);

        $keys = array_keys($scores);
        $best = $keys[0];
        $bestScore = $scores[$best];
        $second = $keys[1] ?? null;

        $confident = $bestScore >= 1 && (
            $second === null
            || $bestScore > $scores[$second]
            || self::presetFor($best) === self::presetFor($second)
        );

        return [
            'key'        => $best,
            'confident'  => $confident,
            'score'      => $bestScore,
            'candidates' => array_slice($keys, 0, 3),
        ];
    }

    // ── internals ────────────────────────────────────────────────────────

    /** key => list of alias token lists (label included as an alias). */
    private static function index(): array
    {
        if (self::$index !== null) {
            return self::$index;
        }

        $index = [];
        foreach (self::all() as $key => $t) {
            $phrases = [];
            foreach (array_merge($t['aliases'] ?? [], [self::labelPhrase($t['label'])]) as $alias) {
                $tokens = self::tokens($alias);
                if ($tokens !== []) {
                    $phrases[implode(' ', $tokens)] = $tokens;
                }
            }
            $index[$key] = array_values($phrases);
        }

        return self::$index = $index;
    }

    /** "Hair salons & barber shops" → "hair salon" (first phrase before & or ,). */
    private static function labelPhrase(string $label): string
    {
        $first = preg_split('/\s*(?:&|,|\(|\/)\s*/u', $label)[0] ?? $label;

        return $first;
    }

    /** Lower-case words with plurals folded; punctuation and accents dropped. */
    public static function tokens(string $text): array
    {
        $text = mb_strtolower($text);
        $text = strtr($text, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'á' => 'a', 'à' => 'a', 'ç' => 'c', 'ö' => 'o', 'ü' => 'u', '&' => ' and ', '-' => ' ']);
        $text = preg_replace('/[^a-z0-9\s]+/u', ' ', $text) ?? '';
        $words = preg_split('/\s+/', trim($text)) ?: [];

        $out = [];
        foreach ($words as $w) {
            if ($w === '') {
                continue;
            }
            $out[] = self::singular($w);
        }

        return $out;
    }

    private static function singular(string $w): string
    {
        $len = strlen($w);
        if ($len > 4 && str_ends_with($w, 'ies')) {
            return substr($w, 0, -3) . 'y';
        }
        if ($len > 3 && str_ends_with($w, 's') && !str_ends_with($w, 'ss') && !str_ends_with($w, 'us')) {
            return substr($w, 0, -1);
        }

        return $w;
    }

    private static function nearMiss(string $word, array $tokenSet): bool
    {
        foreach ($tokenSet as $token => $_) {
            $token = (string) $token;
            if (abs(strlen($token) - strlen($word)) <= 1 && strlen($token) >= 5 && levenshtein($token, $word) === 1) {
                return true;
            }
        }

        return false;
    }

    private static function withDependencies(array $modules): array
    {
        $registry = (array) config('modules', []);
        $set = [];
        $queue = array_values(array_unique($modules));

        while ($queue) {
            $m = array_shift($queue);
            if (isset($set[$m]) || !isset($registry[$m]) || ($registry[$m]['status'] ?? null) !== 'live') {
                continue;
            }
            $set[$m] = true;
            foreach ((array) ($registry[$m]['requires'] ?? []) as $dep) {
                $queue[] = $dep;
            }
            // requires_one is a list of groups: at least one of each group.
            $groups = (array) ($registry[$m]['requires_one'] ?? []);
            if ($groups && !is_array(reset($groups))) {
                $groups = [$groups];
            }
            foreach ($groups as $group) {
                $group = (array) $group;
                if ($group && !array_intersect($group, array_merge(array_keys($set), $queue))) {
                    $queue[] = $group[0];
                }
            }
        }

        // Keep the caller's order, dependencies after.
        $ordered = array_values(array_filter($modules, fn ($m) => isset($set[$m])));

        return array_values(array_unique(array_merge($ordered, array_keys($set))));
    }
}
