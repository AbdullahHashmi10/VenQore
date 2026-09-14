<?php

namespace App\Services\AiBuilder;

use Illuminate\Support\Facades\Cache;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ModuleManifest — the one description of this product a model ever sees.  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Every prompt that asks a model "which modules does this business need" is
 * built from here, and this is built from config/modules.php. There is no
 * second list to keep in step: add a module to the registry and the model can
 * choose it on the next request; mark one `building` and it disappears from
 * the model's world entirely.
 *
 * ── Why it is deliberately small ───────────────────────────────────────────
 *
 * The older builder prompt spent about 3,000 tokens on this, and roughly two
 * thirds of that was alias lists:
 *
 *   "- customers: Customers — A directory of who you sell to… Also called:
 *    customers, clients, buyers, patients, guests, members, parties, grahak,
 *    customer list, contacts, custmers."
 *
 * Those aliases exist for str_contains(). A language model does not need to be
 * told that "patients" means customers — it needs to be told what `customers`
 * DOES, once, in a sentence. The alias lists were the token cost of not
 * trusting the model to understand language, paid on every single call.
 *
 * What is left is the key, one plain line about what it does for the business,
 * and its hard dependencies. That is the whole product in about a thousand
 * tokens, and every line of it earns its place.
 *
 * ── What it is NOT ────────────────────────────────────────────────────────
 *
 * Not a place for rules, tone or examples. Those belong to the call site that
 * knows what it is asking for. This class answers exactly one question: what
 * can be switched on, and what does each thing do.
 */
class ModuleManifest
{
    /** Pipeline step 11's ceiling — see config/ai_builder.php. */
    public const MAX_MODULES = 46;

    private const CACHE_KEY = 'ai_builder:module_manifest:v2';
    private const CACHE_TTL = 3600;

    /**
     * The catalogue as the model sees it. One line per live module.
     *
     * Cached because it is pure config and rebuilt on every request otherwise;
     * the key carries a version so a format change cannot serve a stale block.
     */
    public function catalogue(): string
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $lines = [];

            foreach ($this->live() as $key => $module) {
                $line = $key . ': ' . trim((string) ($module['description'] ?? $module['label'] ?? ''));

                // Dependencies are stated because they change the ANSWER — a
                // model that knows `pos` needs `products` stops proposing half
                // a system. Everything else config/modules.php holds (routes,
                // permissions, aliases, icons) is invisible here on purpose.
                $requires = array_values(array_filter(
                    (array) ($module['requires'] ?? []),
                    fn ($dep) => $this->isLive((string) $dep)
                ));

                if ($requires !== []) {
                    $line .= ' [needs ' . implode(' + ', $requires) . ']';
                }

                $lines[] = $line;
            }

            return implode("\n", $lines);
        });
    }

    /** @return array<string, array> live modules, keyed. */
    public function live(): array
    {
        return array_filter(
            (array) config('modules', []),
            fn ($m) => is_array($m) && ($m['status'] ?? null) === 'live'
        );
    }

    /** @return string[] */
    public function liveKeys(): array
    {
        return array_keys($this->live());
    }

    public function isLive(string $key): bool
    {
        return ($this->registry()[$key]['status'] ?? null) === 'live';
    }

    public function labelFor(string $key): ?string
    {
        return $this->registry()[$key]['label'] ?? null;
    }

    /**
     * Everything a model returns passes through here first.
     *
     * Unknown keys, keys for modules that are not live, duplicates and anything
     * past the cap are dropped silently — the model proposes, this decides. A
     * hallucinated module key is not an error to report, it is a line to
     * ignore.
     *
     * @param  mixed  $keys
     * @return string[]
     */
    public function validate(mixed $keys): array
    {
        if (!is_array($keys)) {
            return [];
        }

        $clean = [];
        foreach ($keys as $key) {
            if (!is_string($key)) {
                continue;
            }
            $key = trim($key);
            if ($key !== '' && $this->isLive($key) && !in_array($key, $clean, true)) {
                $clean[] = $key;
            }
        }

        return array_slice($clean, 0, self::MAX_MODULES);
    }

    /**
     * Cascade hard dependencies, transitively, keeping the caller's order first.
     *
     * `requires_one` is a list of groups where at least one member must be
     * present; when none is, the first is taken. Canonical implementation —
     * BusinessTypes delegates here rather than keeping its own copy, because
     * two implementations of "what does this module need" is how a workspace
     * ends up shipping half a feature.
     *
     * @param  string[]  $modules
     * @return string[]
     */
    public function withDependencies(array $modules): array
    {
        $registry = $this->registry();
        $set = [];
        $queue = array_values(array_unique($modules));

        while ($queue) {
            $m = array_shift($queue);
            if (!is_string($m) || isset($set[$m]) || ($registry[$m]['status'] ?? null) !== 'live') {
                continue;
            }

            $set[$m] = true;

            foreach ((array) ($registry[$m]['requires'] ?? []) as $dep) {
                $queue[] = $dep;
            }

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

        $ordered = array_values(array_filter($modules, fn ($m) => is_string($m) && isset($set[$m])));

        return array_values(array_unique(array_merge($ordered, array_keys($set))));
    }

    /**
     * Companion modules — what would ship as half a feature on its own.
     *
     * Distinct from `requires`, which is the hard graph: without a required
     * module the thing is broken, and withDependencies() cascades those. This
     * is the softer list from config §3c — a counter selling physical goods
     * needs to know what is on the shelf, so pos brings inventory.
     *
     * Applied ONCE, not transitively. A companion pulling in its own
     * companions is how a two-module answer quietly becomes nine, and the
     * whole point of this pass is that nothing arrives unasked for unless the
     * thing the visitor DID ask for does not work without it.
     *
     * Purchasing and suppliers are deliberately not companions of anything:
     * plenty of businesses sell what they never restock. That is a question,
     * and a question is not a guess.
     *
     * @param  string[]  $modules
     * @return string[]
     */
    public function withPackages(array $modules): array
    {
        $packages = (array) config('ai_builder.packages', []);
        $out = $modules;

        foreach ($modules as $key) {
            foreach ((array) ($packages[$key] ?? []) as $companion) {
                if (is_string($companion) && $this->isLive($companion) && !in_array($companion, $out, true)) {
                    $out[] = $companion;
                }
            }
        }

        return $out;
    }

    /**
     * The one place a set of wanted modules becomes a workable set.
     *
     * Order matters: companions first, then the hard graph, so a companion's
     * own requirements are cascaded too (pos -> inventory -> products).
     *
     * @param  string[]  $modules
     * @return string[]
     */
    public function resolve(array $modules): array
    {
        return $this->withDependencies($this->withPackages($this->validate($modules)));
    }

    private function registry(): array
    {
        return (array) config('modules', []);
    }
}
