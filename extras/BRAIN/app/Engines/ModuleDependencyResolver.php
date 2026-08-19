<?php

namespace App\Engines;

/*
|==============================================================================
| STEP 6 — ModuleDependencyResolver  (the Rulebook's brain)
|==============================================================================
|
| WHY THIS IS A NEW CLASS AND NOT AN EDIT TO CapabilityDependencyResolver
| -----------------------------------------------------------------------
| The build plan says "extend app/Engines/CapabilityDependencyResolver.php".
| I did not, and here is the reasoning so you can overrule it if you disagree:
|
|   - The existing resolver reads the `capabilities` DATABASE TABLE, not
|     config/modules.php. Different source, different vocabulary.
|   - It carries keys the 46 modules do not contain — optical_prescription,
|     tailor_measurements, jewelry_metal_rates — and PlanRepository::featuresFor()
|     reads those keys to build the tenant feature map.
|   - It has passing tests (CapabilityDependencyResolverTest). Rewriting its
|     data source breaks all of them, on the same day you are trying to reach
|     exit code 0.
|
| So: this is a sibling in the same authorised folder. The old resolver keeps
| serving the capabilities table; this one serves the module registry. When the
| capabilities table is eventually retired, delete the old one — do not merge.
|
|------------------------------------------------------------------------------
| WHAT IT DOES THAT NOTHING ELSE DOES
|------------------------------------------------------------------------------
| `requires_one`. Invoicing needs Products OR Services. Khata needs Customers
| OR Suppliers. This resolver never guesses which — it returns a QUESTION and
| lets the caller ask. Guessing is how a freelancer ends up with a Products
| module they will never open, which is the complaint that started this whole
| redesign.
|
|------------------------------------------------------------------------------
| IT NEVER WRITES
|------------------------------------------------------------------------------
| resolve() is pure: config in, decision out. ApplyConfigurationService does the
| writing, in one transaction. That separation is what lets you show a customer
| exactly what is about to happen before anything happens.
|==============================================================================
*/
class ModuleDependencyResolver
{
    /**
     * Turn a requested set of module keys into a valid, complete one.
     *
     * @param  array  $requested  keys the user or AI asked for
     * @return array{
     *     modules: string[],        final set, sorted by module id
     *     added: array,             key => ['because' => key, 'why' => sentence]
     *     questions: array,         unresolved requires_one sets — ASK THESE
     *     dropped: string[],        unknown or non-live keys, removed silently
     *     suggestions: string[],    enhances — offer, never force
     *     blocked: array             key => why it cannot be enabled at all
     * }
     */
    public function resolve(array $requested, bool $includeNonLive = false): array
    {
        $registry = config('modules', []);

        $dropped = [];
        $queue = [];

        // 1. Drop what is not real. Unknown keys and unfinished modules leave
        //    silently — a dropped hallucination should be invisible, and a
        //    'building' module must never reach a customer's system.
        foreach (array_unique($requested) as $key) {
            if (!isset($registry[$key])) {
                $dropped[] = $key;
                continue;
            }

            if (!$includeNonLive && ($registry[$key]['status'] ?? 'live') !== 'live') {
                $dropped[] = $key;
                continue;
            }

            $queue[] = $key;
        }

        $resolved = [];
        $added = [];
        $seen = [];

        // 2. Cascade hard requirements, breadth-first, recording WHY each
        //    extra module appeared. The "why" is not decoration: a cascade the
        //    user cannot see reads as the software overruling them.
        while ($queue) {
            $key = array_shift($queue);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $resolved[$key] = true;

            foreach ($registry[$key]['requires'] ?? [] as $dependency) {
                if (!isset($registry[$dependency])) {
                    continue;   // integrity test catches this; do not crash here
                }

                if (!isset($seen[$dependency]) && !in_array($dependency, $requested, true)) {
                    $added[$dependency] = [
                        'because' => $key,
                        'why'     => sprintf(
                            '%s needs %s to work.',
                            $registry[$key]['label'],
                            $registry[$dependency]['label']
                        ),
                    ];
                }

                $queue[] = $dependency;
            }
        }

        // 3. requires_one — the relationship nobody else builds.
        //    If a set is already satisfied, say nothing. If not, ASK.
        //
        //    EXCEPT when only one option is actually shippable today. Services
        //    (#2) is still 'building', so "Products or Services?" currently has
        //    exactly one real answer — and a question with one answer is a dead
        //    end wearing a choice's clothing. In that case add it and SAY SO,
        //    which is honest and takes the user zero clicks. When Services goes
        //    live this reverts to a real question with no code change.
        $questions = [];
        $blocked = [];

        foreach (array_keys($resolved) as $key) {
            foreach ($registry[$key]['requires_one'] ?? [] as $set) {
                if (array_intersect($set, array_keys($resolved))) {
                    continue;                       // already satisfied
                }

                $options = array_values(array_filter(
                    $set,
                    fn ($o) => isset($registry[$o])
                        && ($includeNonLive || ($registry[$o]['status'] ?? 'live') === 'live')
                ));

                if (count($options) === 0) {
                    // Nothing in the set is shippable. The caller must not
                    // enable this module at all — surfacing it as a question
                    // would ask something unanswerable.
                    $blocked[$key] = sprintf(
                        '%s needs one of %s, and none of them is available yet.',
                        $registry[$key]['label'],
                        implode(' or ', $set)
                    );
                    continue;
                }

                if (count($options) === 1) {
                    $only = $options[0];
                    $resolved[$only] = true;
                    $added[$only] = [
                        'because' => $key,
                        'why'     => sprintf(
                            '%s needs %s. (%s is the only option available today.)',
                            $registry[$key]['label'],
                            $registry[$only]['label'],
                            $registry[$only]['label']
                        ),
                    ];

                    // The auto-added module may itself have requirements.
                    foreach ($registry[$only]['requires'] ?? [] as $dependency) {
                        if (isset($registry[$dependency]) && !isset($resolved[$dependency])) {
                            $resolved[$dependency] = true;
                            $added[$dependency] = [
                                'because' => $only,
                                'why'     => sprintf('%s needs %s to work.', $registry[$only]['label'], $registry[$dependency]['label']),
                            ];
                        }
                    }

                    continue;
                }

                $questions[] = [
                    'for'     => $key,
                    'label'   => $registry[$key]['label'],
                    'options' => $options,
                    'prompt'  => $this->questionFor($key, $set, $registry),
                ];
            }
        }

        // 4. enhances — offered, never added. The difference between a product
        //    that suggests and one that argues.
        $suggestions = [];

        foreach (array_keys($resolved) as $key) {
            foreach ($registry[$key]['enhances'] ?? [] as $suggestion) {
                if (isset($resolved[$suggestion])) {
                    continue;
                }

                if (!isset($registry[$suggestion])) {
                    continue;
                }

                if (($registry[$suggestion]['status'] ?? 'live') !== 'live') {
                    continue;
                }

                $suggestions[$suggestion] = true;
            }
        }

        // 5. Sort by module id so the proposal screen always reads in the same
        //    order — Products before POS before Inventory. Alphabetical order
        //    would put Accounting first, which is exactly the impression this
        //    product exists to avoid.
        $modules = array_keys($resolved);
        usort($modules, fn ($a, $b) => $registry[$a]['id'] <=> $registry[$b]['id']);

        return [
            'modules'     => $modules,
            'added'       => $added,
            'questions'   => $questions,
            'dropped'     => array_values($dropped),
            'suggestions' => array_keys($suggestions),
            'blocked'     => $blocked,
        ];
    }

    /**
     * Can this module be switched off, and what happens if it is?
     *
     * Never returns a bare "no". Always returns the choice the user actually
     * has, because "you can't do that" with no alternative is the dead end the
     * Rulebook forbids.
     *
     * @return array{allowed: bool, dependents: string[], message: string}
     */
    public function canDisable(array $currentlyEnabled, string $moduleKey): array
    {
        $registry = config('modules', []);

        $dependents = array_values(array_filter(
            $currentlyEnabled,
            fn ($key) => isset($registry[$key])
                && in_array($moduleKey, $registry[$key]['requires'] ?? [], true)
        ));

        if ($dependents === []) {
            return ['allowed' => true, 'dependents' => [], 'message' => ''];
        }

        $labels = array_map(fn ($key) => $registry[$key]['label'], $dependents);
        $target = $registry[$moduleKey]['label'] ?? $moduleKey;

        return [
            'allowed'    => false,
            'dependents' => $dependents,
            'message'    => count($labels) === 1
                ? sprintf(
                    '%s needs %s. I can remove both, or keep %s just for %s. Which would you like?',
                    $labels[0], $target, $target, $labels[0]
                )
                : sprintf(
                    '%s all need %s. I can remove them together, or keep %s and leave them as they are. Which would you like?',
                    $this->humanList($labels), $target, $target
                ),
        ];
    }

    /**
     * Cascade-disable: switching X off also switches off everything that
     * requires it, transitively. Returned so the caller can list it BEFORE
     * doing it.
     */
    public function disableCascade(array $currentlyEnabled, string $moduleKey): array
    {
        $registry = config('modules', []);
        $remove = [$moduleKey => true];

        do {
            $changed = false;

            foreach ($currentlyEnabled as $key) {
                if (isset($remove[$key]) || !isset($registry[$key])) {
                    continue;
                }

                foreach ($registry[$key]['requires'] ?? [] as $dependency) {
                    if (isset($remove[$dependency])) {
                        $remove[$key] = true;
                        $changed = true;
                        break;
                    }
                }
            }
        } while ($changed);

        return array_keys($remove);
    }

    /**
     * Is this set internally valid? The last line before a write.
     *
     * @return string[] human-readable problems; empty means valid
     */
    public function validate(array $modules): array
    {
        $registry = config('modules', []);
        $problems = [];

        foreach ($modules as $key) {
            if (!isset($registry[$key])) {
                $problems[] = "Unknown module '{$key}'.";
                continue;
            }

            foreach ($registry[$key]['requires'] ?? [] as $dependency) {
                if (!in_array($dependency, $modules, true)) {
                    $problems[] = "{$registry[$key]['label']} needs {$dependency}, which is not enabled.";
                }
            }

            foreach ($registry[$key]['requires_one'] ?? [] as $set) {
                if (!array_intersect($set, $modules)) {
                    $problems[] = "{$registry[$key]['label']} needs one of: ".implode(' or ', $set).'.';
                }
            }
        }

        return $problems;
    }

    // ---------------------------------------------------------------- wording

    /**
     * The requires_one question, in the user's words rather than ours.
     * Special-cased where a generic sentence would sound like a form.
     */
    private function questionFor(string $key, array $set, array $registry): string
    {
        sort($set);

        if ($set === ['products', 'services']) {
            return sprintf(
                'To use %s, VenQore needs to know what you sell: physical Products, Services you provide, or both?',
                $registry[$key]['label']
            );
        }

        if ($set === ['customers', 'suppliers']) {
            return sprintf(
                'To use %s, VenQore needs to know who you keep accounts with: Customers, Suppliers, or both?',
                $registry[$key]['label']
            );
        }

        $labels = array_map(fn ($o) => $registry[$o]['label'] ?? $o, $set);

        return sprintf(
            '%s needs at least one of these: %s. Which applies to you?',
            $registry[$key]['label'],
            $this->humanList($labels)
        );
    }

    private function humanList(array $items): string
    {
        if (count($items) <= 1) {
            return (string) ($items[0] ?? '');
        }

        $last = array_pop($items);

        return implode(', ', $items).' and '.$last;
    }
}
