<?php

namespace App\Services\Builder;

/**
 * Facts → workflows → modules (BUILDER_FINAL_PLAN.md §4, §5.6, §7).
 *
 * Pure function of the session's facts: nothing accumulates, so a revision just
 * recomposes. Order of work:
 *   1. active workflows (effective facts = owner's words + disclosed template)
 *   2. owner overrides (added always wins; removed loses to a hard dependency)
 *   3. hard-dependency closure, then the capability gate, repeated until stable
 *   4. review: areas, reasons, assumptions, not-included, gaps, gifts, label
 *
 * Every reason a module is on is kept — not just the first.
 */
class WorkflowComposer
{
    private CapabilityGate $gate;

    public function __construct(private BuilderPolicy $policy, ?CapabilityGate $gate = null)
    {
        $this->gate = $gate ?? new CapabilityGate($policy);
    }

    public function compose(BuilderSession $s, ?string $plan = null): array
    {
        $eff = new Condition($s->facts, $this->policy, $s->typeKey, 'effective');
        $conf = new Condition($s->facts, $this->policy, $s->typeKey, 'confirmed');
        $registry = $this->policy->modules;

        $direct = [];      // module => list of reasons
        $activeFlows = [];
        $gaps = [];
        $notIncluded = [];

        foreach ((array) $this->policy->workflows['baseline'] as $m => $meta) {
            $direct[$m][] = ['text' => 'Always included.', 'workflow' => 'baseline', 'assumed' => false, 'area' => $meta['area'], 'tab' => $meta['tab']];
        }

        foreach ((array) $this->policy->workflows['workflows'] as $wid => $w) {
            if (! $eff->test($w['when'] ?? [])) {
                continue;
            }
            $assumed = ! $conf->test($w['when'] ?? []);
            if (isset($w['gap'])) {
                $gaps[$w['gap']] = ['need' => $w['gap'], 'label' => $w['label'], 'status' => 'coming_soon', 'assumed' => $assumed];

                continue;
            }
            $activeFlows[] = $wid;
            foreach ($w['modules'] as $m) {
                $direct[$m][] = ['text' => $w['label'], 'workflow' => $wid, 'assumed' => $assumed, 'area' => $w['area'], 'tab' => $w['tab'] ?? ''];
            }
        }

        // Owner overrides — "added" is stored as owner.added.{module} facts.
        foreach (array_keys($registry) as $m) {
            if ($s->facts->isTrue("owner.added.{$m}")) {
                $direct[$m][] = ['text' => 'Added by you.', 'workflow' => 'owner', 'assumed' => false, 'area' => $this->areaFor($m), 'tab' => ''];
            }
        }
        $removed = [];
        foreach (array_keys($registry) as $m) {
            if ($s->facts->isTrue("owner.removed.{$m}")) {
                $removed[] = $m;
                unset($direct[$m]);
            }
        }

        // Gate the directly requested modules; then close over dependencies,
        // dropping any parent whose dependency cannot be offered. Repeat until stable.
        $dropped = [];
        foreach (array_keys($direct) as $m) {
            $g = $this->gate->check($m, $plan);
            if (! $g['ok']) {
                $dropped[$m] = $g;
                unset($direct[$m]);
            }
        }
        do {
            [$final, $why, $failed] = $this->close(array_keys($direct), $plan, $registry);
            $progress = false;
            foreach ($failed as $parent => $info) {
                if (isset($direct[$parent])) {
                    $dropped[$parent] = $info;
                    unset($direct[$parent]);
                    $progress = true;
                }
            }
            if ($failed && ! $progress) {   // defensive: never loop forever
                $direct = [];
                $failed = [];
                [$final, $why] = [[], []];
            }
        } while ($failed);

        // A removed module that is a hard dependency of something that stays: keep it, explain.
        $conflicts = [];
        foreach ($removed as $m) {
            if (isset($why[$m])) {
                $parents = array_values(array_unique(array_map(fn ($r) => $r['by'], $why[$m])));
                $labels = array_map(fn ($p) => $this->policy->moduleLabel($p), $parents);
                $conflicts[] = [
                    'module' => $m, 'needed_by' => $parents,
                    'message' => implode(' and ', $labels) . ' needs ' . $this->policy->moduleLabel($m) . '. Remove ' . implode(' and ', $labels) . ' too?',
                ];
                $final[$m] = true;
            } else {
                $notIncluded[] = ['module' => $m, 'reason' => 'Removed by you.', 'reason_key' => 'owner_removed'];
            }
        }

        // Unavailable modules become gaps, and are listed as not included.
        foreach ($dropped as $m => $g) {
            if (! empty($g['gap'])) {
                $gaps[$g['gap']] ??= ['need' => $g['gap'], 'label' => (string) ($this->policy->capabilities['gaps'][$g['gap']] ?? $g['gap']), 'status' => 'coming_soon', 'assumed' => false];
            }
            $notIncluded[] = ['module' => $m, 'reason' => $g['reason'] ?? 'Not available yet.', 'reason_key' => ! empty($g['coming_soon']) ? 'coming_soon' : 'unavailable'];
        }
        foreach ((array) $s->facts->all() as $k => $r) {
            if (str_starts_with($k, 'gap.') && $r['status'] === 'confirmed') {
                $need = substr($k, 4);
                $gaps[$need] ??= ['need' => $need, 'label' => (string) $r['value'], 'status' => 'requested', 'assumed' => false];
            }
        }

        // Negative facts the owner gave explicitly -> "Not included" lines.
        foreach ((array) ($this->policy->summary['negative_reasons'] ?? []) as $fact => $text) {
            if ($s->facts->isNegative($fact)) {
                $notIncluded[] = ['module' => null, 'fact' => $fact, 'reason' => $text, 'reason_key' => 'owner_said_no'];
            }
        }

        // Assemble modules with ALL reasons.
        $modules = [];
        foreach (array_keys($final) as $m) {
            $reasons = $direct[$m] ?? [];
            foreach ($why[$m] ?? [] as $r) {
                $reasons[] = ['text' => 'Needed by ' . $this->policy->moduleLabel($r['by']) . '.', 'workflow' => 'dependency', 'assumed' => false, 'area' => null, 'tab' => ''];
            }
            if (! $reasons && isset($removed) && in_array($m, $removed, true)) {
                $reasons[] = ['text' => 'Kept because another tool needs it.', 'workflow' => 'dependency', 'assumed' => false, 'area' => null, 'tab' => ''];
            }
            $area = null;
            $tab = '';
            foreach ($reasons as $r) {
                if ($r['area']) {
                    $area = $r['area'];
                    $tab = $r['tab'];
                    break;
                }
            }
            $area ??= $this->areaFor($m, $why[$m][0]['by'] ?? null, $direct);
            $modules[$m] = [
                'key' => $m, 'label' => $this->policy->moduleLabel($m), 'area' => $area, 'tab' => $tab,
                'reasons' => array_map(fn ($r) => ['text' => $r['text'], 'workflow' => $r['workflow'], 'assumed' => $r['assumed']], $reasons),
                'assumed' => $reasons && ! array_filter($reasons, fn ($r) => ! $r['assumed']),
            ];
        }

        $assumptions = $this->assumptions($s, $eff, $conf, $activeFlows, $modules);
        $essentialOpen = (new ScreenSelector($this->policy))->essentialScreensRemaining($s) > 0;

        $summary = (array) $this->policy->summary['labels'];
        $label = $gaps ? $summary['gaps'] : (($assumptions || $essentialOpen) ? $summary['assumptions'] : $summary['ready']);

        return [
            'label' => $label,
            'modules' => $modules,
            'module_keys' => array_keys($modules),
            'workflows' => $activeFlows,
            'areas' => $this->areas($modules),
            'assumptions' => $assumptions,
            'not_included' => $notIncluded,
            'gaps' => array_values($gaps),
            'conflicts' => $conflicts,
            'gifts' => [
                ['key' => 'ai_insights', 'included' => isset($modules['ai_insights'])],
                ['key' => 'online_store', 'included' => isset($modules['online_store'])],
                ['key' => 'onsite_catalogue', 'included' => isset($modules['onsite_catalogue'])],
            ],
            // Gifts are created switched on but never published. Provisioning must honour this.
            'unpublished' => array_values(array_intersect(['online_store', 'onsite_catalogue'], array_keys($modules))),
            'not_connected' => array_values(array_intersect(['marketplace_sync'], array_keys($modules))),
            'no_schedule' => array_values(array_intersect(['recurring_invoices'], array_keys($modules))),
            'policy_version' => BuilderPolicy::VERSION,
        ];
    }

    /**
     * Hard-dependency closure of $roots. A root whose dependency cannot be offered
     * is returned in $failed (and left out of $final) so the caller can drop it and retry.
     *
     * @return array{0:array<string,true>,1:array<string,array<int,array{by:string}>>,2:array<string,array>}
     */
    private function close(array $roots, ?string $plan, array $registry): array
    {
        $final = [];
        $why = [];
        $failed = [];
        $queue = array_map(fn ($m) => [$m, null], $roots);

        while ($queue) {
            [$m, $by] = array_shift($queue);
            if ($by !== null) {
                $why[$m][] = ['by' => $by];
            }
            if (isset($final[$m])) {
                continue;
            }
            $final[$m] = true;
            $def = $registry[$m] ?? [];

            foreach ((array) ($def['requires'] ?? []) as $dep) {
                $g = $this->gate->check($dep, $plan);
                if (! $g['ok']) {
                    $failed[$this->rootOf($m, $why, $roots)] = $g + ['reason' => $g['reason']];

                    continue;
                }
                $queue[] = [$dep, $m];
            }
            $groups = (array) ($def['requires_one'] ?? []);
            if ($groups && ! is_array(reset($groups))) {
                $groups = [$groups];
            }
            foreach ($groups as $group) {
                $group = (array) $group;
                $present = array_intersect($group, array_merge(array_keys($final), array_map(fn ($q) => $q[0], $queue)));
                if ($present) {
                    foreach ($present as $p) {
                        if ($p !== $m) {
                            $why[$p][] = ['by' => $m];
                        }
                    }

                    continue;
                }
                $pick = null;
                foreach ($group as $cand) {
                    if ($this->gate->check($cand, $plan)['ok']) {
                        $pick = $cand;
                        break;
                    }
                }
                if ($pick === null) {
                    $failed[$this->rootOf($m, $why, $roots)] = ['ok' => false, 'reason' => 'A tool it needs isn\'t available yet.', 'gap' => null, 'coming_soon' => true];
                } else {
                    $queue[] = [$pick, $m];
                }
            }
        }

        if ($failed) {
            return [[], [], $failed];
        }

        return [$final, $this->dedupeWhy($why), []];
    }

    /** The directly requested module that (transitively) pulled $m in. */
    private function rootOf(string $m, array $why, array $roots): string
    {
        if (in_array($m, $roots, true)) {
            return $m;
        }
        foreach ($why[$m] ?? [] as $r) {
            $root = $this->rootOf($r['by'], $why, $roots);
            if (in_array($root, $roots, true)) {
                return $root;
            }
        }

        return $roots[0] ?? $m;
    }

    private function dedupeWhy(array $why): array
    {
        $out = [];
        foreach ($why as $m => $list) {
            $seen = [];
            foreach ($list as $r) {
                if (! isset($seen[$r['by']])) {
                    $seen[$r['by']] = true;
                    $out[$m][] = $r;
                }
            }
        }

        return $out;
    }

    /** Which parent area a module with no workflow of its own belongs under. */
    private function areaFor(string $module, ?string $parent = null, array $direct = []): string
    {
        foreach ((array) $this->policy->workflows['workflows'] as $w) {
            if (isset($w['modules']) && in_array($module, $w['modules'], true)) {
                return $w['area'];
            }
        }
        if ($parent) {
            foreach ((array) $this->policy->workflows['workflows'] as $w) {
                if (isset($w['modules']) && in_array($parent, $w['modules'], true)) {
                    return $w['area'];
                }
            }
        }

        return 'settings';
    }

    private function areas(array $modules): array
    {
        $names = (array) $this->policy->workflows['areas'];
        $out = [];
        foreach ($names as $key => $name) {
            $list = array_values(array_filter($modules, fn ($m) => $m['area'] === $key));
            if ($list) {
                $out[] = ['key' => $key, 'name' => $name, 'modules' => $list];
            }
        }

        return $out;
    }

    /** §5.6 — every default is disclosed. */
    private function assumptions(BuilderSession $s, Condition $eff, Condition $conf, array $activeFlows, array $modules): array
    {
        $texts = (array) $this->policy->summary['assumptions'];
        $out = [];
        $tracks = $s->facts->derived('d.tracks_qty', true);

        if ($s->typeKey && array_filter($modules, fn ($m) => $m['assumed'])) {
            $label = strtolower((string) ($this->policy->typeHints[$s->typeKey]['label'] ?? $s->typeKey));
            $out[] = ['fact' => 'template', 'text' => str_replace('{type}', $label, $texts['template'])];
        }
        if ($tracks && ! $s->facts->known('place.stock_counts')) {
            $out[] = ['fact' => 'place.stock_counts', 'text' => $texts['place.stock_counts']];
        }
        if (! $s->facts->known('people.users')) {
            $out[] = ['fact' => 'people.users', 'text' => $texts['people.users']];
        }
        $sells = $eff->test(['any' => ['activity.goods', 'activity.services', 'activity.making', 'activity.hire']]);
        if ($sells && ! $s->facts->known('tax.mode')) {
            $out[] = ['fact' => 'tax.mode', 'text' => $texts['tax.mode']];
        }
        if ($tracks) {
            $anyId = false;
            foreach (array_keys((array) $this->policy->facts['facts']) as $k) {
                if (str_starts_with($k, 'id.') && $s->facts->isTrue($k)) {
                    $anyId = true;
                }
            }
            if (! $anyId && ! $s->facts->isTrue('id.quantity_only')) {
                $out[] = ['fact' => 'id', 'text' => $texts['id']];
            }
        }

        return $out;
    }
}
