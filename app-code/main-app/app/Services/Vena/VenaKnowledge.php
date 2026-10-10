<?php

namespace App\Services\Vena;

use App\Models\Tenant;
use App\Services\ModuleService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

/**
 * VenaKnowledge — what Vena knows about VenQore itself, and how it finds it.
 *
 * The assistant used to be told "You are a helpful POS assistant" and nothing
 * else, so it could not say where anything was. This class gives it the
 * product: every guide, module, screen, reading and card (see ManifestBuilder)
 * indexed for retrieval, scoped to what THIS user can actually reach.
 *
 * Two outputs, cheapest first:
 *
 *   direct   a finished, formatted answer (steps + links) built with NO model
 *            call: instant and free. Used when a question clearly matches a
 *            guide / module / screen.
 *   context  the few best-matching entries as compact text, injected into the
 *            model's prompt so its answer is grounded in the real product
 *            rather than guessed. (Retrieved, never prompt-stuffed: ≤ ~2.5k
 *            characters, never the whole manifest.)
 *
 * The index is rebuilt automatically whenever the routes, the module registry,
 * the guides or the Omni-Search registry change (fingerprint below), so Vena
 * cannot fall behind the software by more than one deploy.
 */
class VenaKnowledge
{
    private const CACHE_VERSION = 'v1';

    /** Words that carry no meaning for matching (English + the commonest Roman Urdu). */
    private const STOP = [
        'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'it', 'my', 'me', 'i', 'you', 'we', 'can',
        'do', 'does', 'how', 'what', 'where', 'when', 'which', 'with', 'this', 'that', 'be', 'at', 'as', 'from', 'by', 'so',
        'please', 'want', 'need', 'would', 'like', 'should', 'will', 'there', 'any', 'get', 'have', 'has', 'if', 'its', 'our',
        'kaise', 'kese', 'kaisay', 'kahan', 'kahaan', 'kidhar', 'ka', 'ki', 'ko', 'ke', 'se', 'hai', 'hain', 'mein', 'me', 'mai',
        'karna', 'karo', 'kare', 'karen', 'karun', 'kar', 'ho', 'hota', 'hoga', 'aur', 'ya', 'yeh', 'ye', 'woh', 'mujhe', 'apni', 'apna',
        // verbs of asking, not things asked about
        'take', 'go', 'show', 'see', 'open', 'find', 'link', 'use', 'set', 'up', 'turn', 'switch', 'enable', 'activate', 'setup', 'give', 'make', 'tell', 'let', 'know',
    ];

    /** A question that asks HOW / WHERE rather than for a number. */
    private const HOWTO = '/\b(how|where|which screen|which page|steps?|guide|set\s*up|setup|enable|disable|turn\s+(on|off)|switch\s+(on|off)|activate|connect|configure|create|add|change|find|open|show me|take me|go to|link|not (working|showing)|cannot|can\'?t|missing|kaise|kese|kaisay|kahan|kahaan|kidhar|kaha|karun|karen|banau|banaun|lagau|lagaun|on kar|off kar)\b/iu';

    /** Roman-Urdu / Urdu-script cue: the reply should be in the user's language. */
    private const NON_ENGLISH = '/\p{Arabic}|\b(kaise|kese|kaisay|kahan|kahaan|kidhar|karna|karun|karen|mujhe|apni|apna|banana|banau|nahi|nahin|hai|hain|mein|dukaan|dukan|maal|kharcha|udhaar|khata)\b/iu';

    /** Per-process memo of the built index. */
    private static ?array $memo = null;

    // ── Index ───────────────────────────────────────────────────────────────

    /** @return array{entries: list<array<string,mixed>>, tok: list<array<string,mixed>>, idf: array<string,float>, byId: array<string,int>} */
    public static function index(): array
    {
        if (self::$memo !== null) {
            return self::$memo;
        }

        $key = 'vena_kb:' . self::CACHE_VERSION . ':' . self::fingerprint();

        try {
            self::$memo = Cache::remember($key, 86400, fn () => self::buildIndex());
        } catch (\Throwable $e) {
            Log::warning('VenaKnowledge: cache unavailable, building in memory — ' . $e->getMessage());
            self::$memo = self::buildIndex();
        }

        return self::$memo;
    }

    /** Forget the in-memory copy (tests). */
    public static function flush(): void
    {
        self::$memo = null;
    }

    private static function fingerprint(): string
    {
        $files = [
            base_path('routes/web.php'), base_path('routes/commerce.php'),
            config_path('modules.php'), config_path('vena_guides.php'),
            base_path('resources/js/Data/AppRegistry.js'),
            app_path('Reckoner/ReckonerRegistry.php'),
        ];

        $parts = [];
        foreach ($files as $f) {
            $parts[] = is_file($f) ? filemtime($f) . ':' . filesize($f) : '0';
        }

        return md5(implode('|', $parts));
    }

    private static function buildIndex(): array
    {
        return self::buildIndexFrom(ManifestBuilder::build()['entries']);
    }

    /** Test seam: install an index built from the given entries. */
    public static function useEntries(array $entries): void
    {
        self::$memo = self::buildIndexFrom($entries);
    }

    /** @param list<array<string,mixed>> $entries */
    public static function buildIndexFrom(array $entries): array
    {
        $tok = [];
        $df = [];
        $byId = [];

        foreach ($entries as $i => $e) {
            $title = self::tokens($e['title'] ?? '');
            $aliases = [];
            foreach ((array) ($e['meta']['aliases'] ?? []) as $alias) {
                $t = self::tokens($alias);
                if ($t) {
                    $aliases[] = $t;
                }
            }
            foreach ((array) ($e['meta']['keywords'] ?? []) as $kw) {
                $t = self::tokens($kw);
                if ($t) {
                    $aliases[] = $t;
                }
            }
            $text = array_values(array_unique(self::tokens($e['text'] ?? '')));

            $tok[$i] = ['t' => $title, 'a' => $aliases, 'x' => $text];
            $byId[$e['type'] . ':' . $e['id']] = $i;

            $seen = array_flip(array_merge($title, $text, ...array_map(fn ($a) => $a, $aliases ?: [[]])));
            foreach ($seen as $w => $_) {
                $df[$w] = ($df[$w] ?? 0) + 1;
            }
        }

        $n = max(1, count($entries));
        $idf = [];
        foreach ($df as $w => $c) {
            $idf[$w] = log(1 + $n / $c);
        }

        return ['entries' => $entries, 'tok' => $tok, 'idf' => $idf, 'byId' => $byId];
    }

    // ── Tokens ──────────────────────────────────────────────────────────────

    /** @return list<string> */
    public static function tokens(?string $s): array
    {
        $s = mb_strtolower((string) $s);
        $s = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $s) ?? '';
        $out = [];
        foreach (preg_split('/\s+/u', trim($s)) ?: [] as $w) {
            if ($w === '' || in_array($w, self::STOP, true)) {
                continue;
            }
            $out[] = self::stem($w);
        }

        return $out;
    }

    private static function stem(string $w): string
    {
        $len = mb_strlen($w);
        if ($len > 5 && str_ends_with($w, 'ing')) {
            return mb_substr($w, 0, -3);
        }
        if ($len > 4 && str_ends_with($w, 'ies')) {
            return mb_substr($w, 0, -3) . 'y';
        }
        if ($len > 4 && str_ends_with($w, 'es') && !str_ends_with($w, 'ses')) {
            return mb_substr($w, 0, -2);
        }
        if ($len > 3 && str_ends_with($w, 's') && !str_ends_with($w, 'ss')) {
            return mb_substr($w, 0, -1);
        }
        if ($len > 4 && str_ends_with($w, 'ed')) {
            return mb_substr($w, 0, -2);
        }

        return $w;
    }

    // ── Search ──────────────────────────────────────────────────────────────

    private const TYPE_WEIGHT = [
        'guide' => 1.5, 'module' => 1.25, 'screen' => 1.0, 'card' => 0.7, 'reading' => 0.7, 'ai_feature' => 0.25,
    ];

    /**
     * Rank entries against a question.
     *
     * @return list<array{i:int, entry:array<string,mixed>, score:float, coverage:float, alias:bool}>
     */
    public function search(string $question, int $limit = 6): array
    {
        $q = array_values(array_unique(self::tokens($question)));
        if ($q === []) {
            return [];
        }

        $ix = self::index();
        $idf = $ix['idf'];
        $qSet = array_flip($q);

        $qWeight = 0.0;
        foreach ($q as $w) {
            $qWeight += $idf[$w] ?? 1.0;
        }
        if ($qWeight <= 0) {
            return [];
        }

        $hits = [];
        foreach ($ix['entries'] as $i => $entry) {
            $t = $ix['tok'][$i];

            $matched = 0.0;
            $score = 0.0;
            $aliasFull = false;
            $matchedWords = [];

            foreach ($t['t'] as $w) {
                if (isset($qSet[$w]) && !isset($matchedWords[$w])) {
                    $w8 = $idf[$w] ?? 1.0;
                    $score += 3.0 * $w8;
                    $matched += $w8;
                    $matchedWords[$w] = true;
                }
            }

            $bestAlias = 0.0;
            foreach ($t['a'] as $alias) {
                $aliasSet = array_flip($alias);
                $hit = array_intersect_key($aliasSet, $qSet);
                if (!$hit) {
                    continue;
                }
                $hitW = 0.0;
                foreach ($hit as $w => $_) {
                    $hitW += $idf[$w] ?? 1.0;
                }
                $allW = 0.0;
                foreach ($aliasSet as $w => $_) {
                    $allW += $idf[$w] ?? 1.0;
                }
                $frac = $allW > 0 ? $hitW / $allW : 0.0;
                $val = $hitW * (1.0 + $frac);
                if ($frac >= 0.999 && count($alias) >= 2) {
                    $aliasFull = true;
                    $val += 4.0;
                } elseif ($frac >= 0.999 && count($alias) === 1) {
                    $val += 2.0;
                }
                if ($val > $bestAlias) {
                    $bestAlias = $val;
                }
                foreach ($hit as $w => $_) {
                    if (!isset($matchedWords[$w])) {
                        $matched += $idf[$w] ?? 1.0;
                        $matchedWords[$w] = true;
                    }
                }
            }
            $score += 2.0 * $bestAlias;

            foreach ($t['x'] as $w) {
                if (isset($qSet[$w])) {
                    $w8 = $idf[$w] ?? 1.0;
                    $score += 0.6 * $w8;
                    if (!isset($matchedWords[$w])) {
                        $matched += $w8;
                        $matchedWords[$w] = true;
                    }
                }
            }

            if ($score <= 0) {
                continue;
            }

            // The whole title is in the question ("purchases" → Purchases, not
            // Purchase Orders): the most specific match wins.
            if ($t['t'] && !array_diff($t['t'], array_keys($qSet))) {
                $score *= 1.3;
            }

            $score *= self::TYPE_WEIGHT[$entry['type']] ?? 1.0;
            if (str_contains($entry['id'], 'v3.') || str_contains($entry['id'], 'dashboard')) {
                $score *= 0.85; // duplicates / generic dashboards should not outrank the real page
            }
            if (($entry['meta']['curated'] ?? false) === true) {
                $score *= 1.15;
            }

            $hits[] = [
                'i'        => $i,
                'entry'    => $entry,
                'score'    => $score,
                'coverage' => min(1.0, $matched / $qWeight),
                'alias'    => $aliasFull,
            ];
        }

        usort($hits, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($hits, 0, $limit);
    }

    // ── Consulting (what AiController calls) ────────────────────────────────

    /**
     * @return array{
     *   direct: ?array{text:string, links:list<array{label:string,url:string}>, source:string, id:string},
     *   context: string,
     *   non_english: bool,
     *   confident: bool
     * }
     */
    public function consult(string $question, ?Tenant $tenant, $user = null): array
    {
        $none = ['direct' => null, 'context' => '', 'non_english' => false, 'confident' => false];

        $hits = $this->search($question, 8);
        if ($hits === []) {
            return $none;
        }

        $slug = $tenant?->slug;
        $nonEnglish = (bool) preg_match(self::NON_ENGLISH, $question);
        $howTo = (bool) preg_match(self::HOWTO, $question);

        // Only offer what this user can actually reach.
        $hits = array_values(array_filter($hits, fn ($h) => $this->reachable($h['entry'], $tenant, $user)));
        if ($hits === []) {
            return $none;
        }

        $top = $this->choose($hits, $question);
        $type = $top['entry']['type'];
        $direct = null;

        // Direct answers need a real match, not just overlapping words.
        if ($type === 'guide' && ($top['alias'] || $top['coverage'] >= 0.75) && ($howTo || $top['alias'])) {
            $direct = $this->renderGuide($top['entry'], $tenant, $user, $slug);
        } elseif ($type === 'module' && $top['alias'] && $howTo) {
            $direct = $this->renderModule($top['entry'], $tenant, $user, $slug);
        } elseif ($type === 'screen' && $top['coverage'] >= 0.6 && $howTo) {
            $direct = $this->renderScreen($top['entry'], $tenant, $user, $slug);
        }

        // A question about a number ("how much did we sell") is never answered by a guide.
        if ($direct && !$howTo && !$top['alias']) {
            $direct = null;
        }

        return [
            'direct'      => $direct,
            'context'     => $this->renderContext($hits, $tenant, $user, $slug),
            'non_english' => $nonEnglish,
            'confident'   => $direct !== null,
        ];
    }

    /**
     * Pick the best candidate for what the person is asking.
     *
     *  "where is / find / open / take me to X"  → the screen itself, when it matches fully
     *  "turn on / enable / set up X"            → the guide or module that explains it
     *  anything else                            → the top-scoring entry
     *
     * @param  list<array<string,mixed>>  $hits  ranked best-first
     * @return array<string,mixed>
     */
    private function choose(array $hits, string $question): array
    {
        $top = $hits[0];
        $head = array_slice($hits, 0, 5);
        $floor = fn (float $ratio) => $top['score'] * $ratio;

        $where = (bool) preg_match('/\b(where|find|open|show me|take me|go to|link|kahan|kahaan|kidhar|kaha)\b/iu', $question);
        $enable = (bool) preg_match('/\b(turn\s+on|switch\s+on|enable|activate|set\s*up|setup|start|on\s+kar|add\s+feature)\b/iu', $question);

        if ($where) {
            foreach ($head as $h) {
                if ($h['entry']['type'] === 'screen' && $h['coverage'] >= 0.9 && $h['score'] >= $floor(0.6)) {
                    return $h;
                }
            }
        }

        if ($enable) {
            foreach ($head as $h) {
                if (in_array($h['entry']['type'], ['guide', 'module'], true)
                    && ($h['alias'] || $h['coverage'] >= 0.75) && $h['score'] >= $floor(0.5)) {
                    return $h;
                }
            }
        }

        return $top;
    }

    /** Can this user (and this store) actually use the thing? */
    private function reachable(array $entry, ?Tenant $tenant, $user): bool
    {
        $meta = $entry['meta'] ?? [];

        // Platform-only readings are never offered to tenants.
        if (($meta['scope'] ?? 'tenant') === 'platform') {
            return false;
        }

        $perms = (array) ($meta['permissions'] ?? []);
        if ($perms && $user && !$this->hasAnyPermission($user, $perms)) {
            // Guides are still useful ("ask your owner") — only hide places.
            return in_array($entry['type'], ['guide', 'module'], true);
        }

        return true;
    }

    private function hasAnyPermission($user, array $perms): bool
    {
        if (!$user) {
            return true;
        }
        if (method_exists($user, 'isPlatformAdmin') && $user->isPlatformAdmin()) {
            return true;
        }
        foreach ($perms as $p) {
            if (method_exists($user, 'hasPermission') && $user->hasPermission($p)) {
                return true;
            }
        }

        return false;
    }

    // ── Rendering ───────────────────────────────────────────────────────────

    private function renderGuide(array $entry, ?Tenant $tenant, $user, ?string $slug): array
    {
        $meta = $entry['meta'];
        $lines = [$entry['title']];
        if (!empty($meta['summary'])) {
            $lines[] = $meta['summary'];
        }

        $notes = $this->statusNotes($meta['module'] ?? null, $meta['needs'] ?? null, $tenant, $user);
        if ($notes) {
            $lines[] = '';
            foreach ($notes as $n) {
                $lines[] = '⚠ ' . $n;
            }
        }

        $lines[] = '';
        $links = [];
        $n = 0;
        foreach ((array) ($meta['steps'] ?? []) as $step) {
            $n++;
            $lines[] = "{$n}. " . $step['text'];
            if (!empty($step['route'])) {
                $link = $this->link($step['route'], $slug, $user);
                if ($link) {
                    $links[$link['url']] = $link;
                }
            }
        }

        if (!empty($meta['tips'])) {
            $lines[] = '';
            foreach ($meta['tips'] as $tip) {
                $lines[] = '• ' . $tip;
            }
        }

        if (!$links && !empty($meta['route'])) {
            $main = $this->link($meta['route'], $slug, $user);
            if ($main) {
                $links[$main['url']] = $main;
            }
        }

        return [
            'text'   => trim(implode("\n", $lines)),
            'links'  => array_slice(array_values($links), 0, 4),
            'source' => 'vena_guide',
            'id'     => $entry['id'],
        ];
    }

    private function renderModule(array $entry, ?Tenant $tenant, $user, ?string $slug): array
    {
        $meta = $entry['meta'];
        $key = $entry['id'];
        $lines = [$entry['title']];
        if (!empty($meta['description'])) {
            $lines[] = $meta['description'];
        }

        $links = [];
        $status = $meta['status'] ?? 'live';

        if ($status !== 'live') {
            $lines[] = '';
            $lines[] = 'This is not available yet — it is still being built.';
        } else {
            $enabled = $tenant ? ModuleService::enabled($tenant, $key) : true;
            $lines[] = '';
            if ($enabled) {
                $lines[] = 'It is ON for your store.';
                foreach ((array) ($meta['nav'] ?? []) as $route) {
                    $l = $this->link($route, $slug, $user);
                    if ($l) {
                        $links[$l['url']] = $l;
                        $lines[] = 'You will find it in the sidebar as "' . $entry['title'] . '".';
                        break;
                    }
                }
            } else {
                $lines[] = 'It is currently OFF for your store. To switch it on: open the System Builder, find "' . $entry['title'] . '" and turn it on (nothing is deleted when you switch modules on or off).';
                if (!empty($meta['requires'])) {
                    $modules = (array) config('modules', []);
                    $names = array_map(fn ($k) => $modules[$k]['label'] ?? $k, $meta['requires']);
                    $lines[] = 'It also needs: ' . implode(', ', $names) . ' (switched on with it automatically).';
                }
                $l = $this->link('store.builder', $slug, $user);
                if ($l) {
                    $links[$l['url']] = $l;
                }
            }
        }

        return ['text' => trim(implode("\n", $lines)), 'links' => array_values($links), 'source' => 'vena_module', 'id' => $key];
    }

    private function renderScreen(array $entry, ?Tenant $tenant, $user, ?string $slug): array
    {
        $moduleKey = $entry['meta']['module'] ?? null;
        if ($moduleKey && $tenant && config("modules.{$moduleKey}") && !ModuleService::enabled($tenant, $moduleKey)) {
            $label = (string) config("modules.{$moduleKey}.label", $moduleKey);
            $b = $this->link('store.builder', $slug, $user);

            return [
                'text'   => "{$entry['title']} is part of {$label}, which is currently OFF for your store. Open the System Builder, find \"{$label}\" and turn it on — nothing is deleted when you switch modules.",
                'links'  => $b ? [$b] : [],
                'source' => 'vena_screen',
                'id'     => $entry['id'],
            ];
        }

        $links = [];
        $l = $this->link($entry['id'], $slug, $user, $entry['title']);
        if ($l) {
            $links[] = $l;
        }
        $lines = ["You will find {$entry['title']} here."];
        if (!empty($entry['meta']['subtitle'])) {
            $lines[] = $entry['meta']['subtitle'];
        }
        if (!empty($entry['meta']['module'])) {
            $label = config("modules.{$entry['meta']['module']}.label");
            if ($label) {
                $lines[] = "It is part of {$label}.";
            }
        }

        return ['text' => implode("\n", $lines), 'links' => $links, 'source' => 'vena_screen', 'id' => $entry['id']];
    }

    /** @return list<string> */
    private function statusNotes(?string $module, $needs, ?Tenant $tenant, $user): array
    {
        $notes = [];

        if ($module && $tenant) {
            $label = (string) config("modules.{$module}.label", $module);
            $status = (string) config("modules.{$module}.status", 'live');
            if ($status !== 'live') {
                $notes[] = "{$label} is not available yet.";
            } elseif (!ModuleService::enabled($tenant, $module)) {
                $notes[] = "{$label} is currently OFF for your store — do step 1 first.";
            }
        }

        if ($needs && $user) {
            $perms = array_map('trim', explode(',', (string) $needs));
            if (!$this->hasAnyPermission($user, $perms)) {
                $notes[] = 'Your role may not have access to this. Ask your store owner or manager if you cannot see it.';
            }
        }

        return $notes;
    }

    /** @return array{label:string,url:string}|null */
    private function link(string $routeName, ?string $slug, $user, ?string $label = null): ?array
    {
        if (!Route::has($routeName)) {
            return null; // a guide naming a vanished screen is dropped, never shown broken
        }

        $ix = self::index();
        $screen = isset($ix['byId']["screen:{$routeName}"]) ? $ix['entries'][$ix['byId']["screen:{$routeName}"]] : null;

        if ($screen && $user && !empty($screen['meta']['permissions']) && !$this->hasAnyPermission($user, $screen['meta']['permissions'])) {
            return null;
        }

        try {
            $params = $slug ? ['store_slug' => $slug] : [];
            $url = route($routeName, $params, false);
        } catch (\Throwable) {
            return null;
        }

        return ['label' => $label ?? ($screen['title'] ?? ucfirst(str_replace(['.', '-', '_'], ' ', $routeName))), 'url' => $url];
    }

    /**
     * Compact grounding text for the model: only the best few entries, only
     * facts, never the whole manifest.
     */
    private function renderContext(array $hits, ?Tenant $tenant, $user, ?string $slug): string
    {
        $lines = [];
        $used = 0;

        foreach ($hits as $h) {
            if ($h['coverage'] < 0.2 || $used >= 5) {
                continue;
            }
            $e = $h['entry'];
            $meta = $e['meta'];

            switch ($e['type']) {
                case 'guide':
                    $steps = [];
                    foreach ((array) ($meta['steps'] ?? []) as $i => $s) {
                        $steps[] = ($i + 1) . ') ' . $s['text'];
                    }
                    $line = "[HOW-TO] {$e['title']} — " . ($meta['summary'] ?? '') . ' Steps: ' . implode(' ', $steps);
                    foreach ($this->statusNotes($meta['module'] ?? null, null, $tenant, $user) as $n) {
                        $line .= ' NOTE: ' . $n;
                    }
                    break;
                case 'module':
                    $enabled = $tenant ? ModuleService::enabled($tenant, $e['id']) : true;
                    $line = "[MODULE] {$e['title']} — " . ($meta['description'] ?? '')
                        . ' Status for this store: ' . (($meta['status'] ?? 'live') !== 'live' ? 'NOT AVAILABLE YET' : ($enabled ? 'ON' : 'OFF (turn on in System Builder)')) . '.';
                    break;
                case 'screen':
                    $path = $slug ? '/' . str_replace('{store_slug}', $slug, (string) ($meta['uri'] ?? '')) : '';
                    $line = "[SCREEN] {$e['title']}" . (!empty($meta['subtitle']) ? ' — ' . $meta['subtitle'] : '') . ($path ? " (at {$path})" : '');
                    break;
                case 'reading':
                case 'card':
                    $line = "[" . strtoupper($e['type']) . "] {$e['title']} — " . mb_substr((string) $e['text'], 0, 160);
                    break;
                default:
                    continue 2;
            }

            $lines[] = '- ' . $line;
            $used++;
        }

        $text = implode("\n", $lines);

        return mb_strlen($text) > 2600 ? mb_substr($text, 0, 2600) . '…' : $text;
    }
}
