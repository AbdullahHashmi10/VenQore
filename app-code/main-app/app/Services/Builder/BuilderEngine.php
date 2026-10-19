<?php

namespace App\Services\Builder;

/**
 * The server-side decision engine behind the §10 API. The browser only
 * displays what this returns and never computes facts → modules.
 */
class BuilderEngine
{
    public readonly ScreenSelector $selector;

    public readonly WorkflowComposer $composer;

    public readonly FactExtractor $extractor;

    public readonly SummaryWriter $writer;

    public function __construct(private BuilderPolicy $policy, ?CapabilityGate $gate = null, ?callable $ai = null)
    {
        $this->selector = new ScreenSelector($policy);
        $this->composer = new WorkflowComposer($policy, $gate);
        $this->extractor = new FactExtractor($policy, $ai);
        $this->writer = new SummaryWriter($policy);
    }

    // ── start ───────────────────────────────────────────────────────────

    /** @param ?string $type business-type key; @param ?string $preset preset key (?preset=) */
    public function start(?string $sentence = null, ?string $type = null, ?string $preset = null, ?string $id = null): BuilderSession
    {
        if ($type === null && $preset !== null) {
            foreach ($this->policy->typeHints as $k => $h) {
                if (($h['preset'] ?? null) === $preset) {
                    $type = $k;
                    break;
                }
            }
        }
        if ($type !== null && ! isset($this->policy->typeHints[$type])) {
            $type = null;
        }
        $route = $type ? ($preset ? 'preset' : 'type') : 'sentence';
        $s = new BuilderSession($id ?? bin2hex(random_bytes(16)), $type, $this->policy, $route);

        if ($type) {
            $hint = $this->policy->typeHints[$type];
            // Picking a type makes the sector's activity explicit (so Q1 is not asked)…
            $sector = ['retail' => ['activity.goods'], 'wholesale' => ['activity.goods'], 'services' => ['activity.services'],
                'manufacturing' => ['activity.making'], 'food' => ['activity.goods', 'activity.making']][$hint['sector']] ?? [];
            foreach ($sector as $f) {
                $s->facts->set($f, true, 'answer', null, "type:{$type}");
            }
            // …but every other thing the type "usually" does is a disclosed assumption, never a fact.
            foreach ((array) $hint['template'] as $f) {
                $s->facts->set($f, true, 'template_assumption', null, "type:{$type}");
            }
        }
        // Whatever the owner wrote is read in full, on every route: a picked type never makes their own
        // words disappear. (The browser leaves out a picker's canned label, so only real text gets here.)
        if ($sentence !== null && trim($sentence) !== '') {
            $this->extractor->apply($s, $sentence);
        }
        // A picked type or preset costs no AI call: we already know what that kind of business usually
        // needs, so say so and only check the parts that differ between businesses of that kind.
        if ($type && $s->heard === null) {
            $label = (string) ($this->policy->typeHints[$type]['label'] ?? 'your kind of business');
            $s->heard = "You picked {$label}. We've started from what these businesses usually need. A few quick questions will make it fit yours.";
        }

        return $s;
    }

    public function confirmCard(BuilderSession $s): ?array
    {
        $items = [];
        foreach ($s->facts->all() as $k => $r) {
            if (! empty($r['pending_confirm'])) {
                $items[] = ['fact' => $k, 'text' => $this->phrase($k, $r)];
            }
        }

        return $items ? ['title' => 'What we understood so far. Is this right?', 'items' => $items] : null;
    }

    /** Correct → the owner's words become confirmed. Change → the fact is dropped and its question reopens. */
    public function resolveConfirmCard(BuilderSession $s, bool $correct, ?array $only = null): void
    {
        foreach ($s->facts->all() as $k => $r) {
            if (empty($r['pending_confirm']) || ($only !== null && ! in_array($k, $only, true))) {
                continue;
            }
            if ($correct) {
                $s->facts->setPendingConfirm($k, false);
            } else {
                $s->facts->forget($k);
            }
        }
        $s->version++;
    }

    private function phrase(string $key, array $r): string
    {
        return $this->extractor->label($key, (string) ($r['evidence'] ?? ''), $r['value']);
    }

    // ── the step shape every endpoint returns ───────────────────────────

    public function step(BuilderSession $s, ?array $before = null): array
    {
        $screen = $this->selector->next($s);
        $out = [
            'session_id' => $s->id,
            'policy_version' => BuilderPolicy::VERSION,
            'preview_available' => $this->selector->previewAvailable($s),
            'estimate_remaining' => $screen ? $screen['estimate_remaining'] : 0,
            'confirm_card' => $this->confirmCard($s),
            'heard' => $s->heard,
        ];
        if ($screen) {
            $out['screen'] = $screen;
        } else {
            $out['done'] = true;
        }
        if ($before !== null) {
            $now = array_column($this->composer->compose($s)['areas'], 'name');
            $out['live_adds'] = array_values(array_diff($now, $before));
        }

        return $out;
    }

    public function areaNames(BuilderSession $s): array
    {
        return array_column($this->composer->compose($s)['areas'], 'name');
    }

    // ── answering ───────────────────────────────────────────────────────

    /**
     * @param array<int,string> $selected option ids as "Panel.option"
     * @return array step shape, or ['error' => 'stale_screen', …] when the screen moved on
     */
    public function answer(BuilderSession $s, string $screenId, int $version, array $selected, bool $unsure = false, bool $skip = false, ?string $explain = null): array
    {
        $p = $s->pending;
        if (! $p || $p['screen_id'] !== $screenId || $p['version'] !== $version) {
            return ['error' => 'stale_screen'] + $this->step($s);
        }
        $before = $this->areaNames($s);
        $s->facts->nextTurn();

        foreach ($p['panels'] as $pid) {
            $panel = $this->selector->panel($pid, $s);
            $shown = (array) ($p['shown'][$pid] ?? []);
            $writesAll = [];
            foreach ($shown as $oid) {
                foreach (array_keys((array) ($panel['options'][$oid]['writes'] ?? [])) as $f) {
                    $writesAll[$f] = true;
                }
            }

            if ($skip || $unsure) {
                $how = $skip ? 'skipped' : 'unsure';
                foreach (array_keys($writesAll) as $f) {
                    $s->facts->markAsked($f, $how, $pid);
                }
                $s->panelState[$pid] = $how;

                continue;
            }

            $chosen = array_values(array_filter($selected, fn ($id) => str_starts_with($id, $pid . '.')));
            $chosenKeys = array_map(fn ($id) => substr($id, strlen($pid) + 1), $chosen);
            $chosenKeys = array_values(array_intersect($chosenKeys, $shown));

            // An exclusive option ("Nothing we need to count", "Everyone pays in full") wins on its own.
            foreach ($chosenKeys as $ck) {
                if (! empty($panel['options'][$ck]['exclusive'])) {
                    $chosenKeys = [$ck];
                    break;
                }
            }

            // Shown-but-not-chosen bool facts become explicit "no" — only for the options on screen.
            $positive = [];
            foreach ($chosenKeys as $ck) {
                foreach ((array) $panel['options'][$ck]['writes'] as $f => $v) {
                    $s->facts->set($f, $v, 'answer', $pid);
                    $positive[$f] = true;
                }
                if (isset($panel['options'][$ck]['explain']) && $explain !== null && trim($explain) !== '') {
                    $s->facts->set($panel['options'][$ck]['explain'], trim($explain), 'answer', $pid);
                }
            }
            if ($panel['kind'] === 'multi') {
                foreach (array_keys($writesAll) as $f) {
                    if (! isset($positive[$f]) && $this->policy->factType($f) === 'bool') {
                        $s->facts->set($f, false, 'answer', $pid);
                    }
                }
            }
            $s->panelState[$pid] = 'answered';
        }

        // "Let me explain" is the owner talking: read it like the opening (one cached AI call), so what
        // they explain settles later questions instead of sitting unread in activity.other_text.
        if (! $skip && ! $unsure && $explain !== null && mb_strlen(trim($explain)) >= 3) {
            $this->extractor->apply($s, trim($explain), (string) ($this->selector->panel($p['panels'][0], $s)['title'] ?? 'Tell us more'));
        }

        // §5.6: activity unknown and no type -> ask the first question once more, never silently guess.
        if (($skip || $unsure) && in_array('Q1', $p['panels'], true) && $s->typeKey === null && ! $this->activityKnown($s)
            && ! in_array('q1_reask', array_column($s->log, 'type'), true)) {
            $s->log[] = ['type' => 'q1_reask'];
            unset($s->panelState['Q1']);
            foreach (['activity.goods', 'activity.services', 'activity.making', 'activity.hire'] as $f) {
                $s->facts->forget($f);
            }
        }

        $s->screensCompleted++;
        $s->pending = null;
        $s->version++;

        return $this->step($s, $before);
    }

    private function activityKnown(BuilderSession $s): bool
    {
        foreach (['activity.goods', 'activity.services', 'activity.making', 'activity.hire'] as $f) {
            if ($s->facts->isTrue($f)) {
                return true;
            }
        }

        return false;
    }

    // ── revising ────────────────────────────────────────────────────────

    /** Read-back "Change something": one fact, recomposed live. $value null = clear to unknown. */
    public function revise(BuilderSession $s, string $factKey, bool|string|null $value): array
    {
        $s->facts->nextTurn();
        if ($value === null) {
            $s->facts->forget($factKey);
        } else {
            $s->facts->set($factKey, $value, 'readback_edit');
        }
        $s->log[] = ['type' => 'fact_revised', 'fact' => $factKey];
        $s->version++;

        return $this->review($s);
    }

    /** "Something's missing" → add/remove a module by hand. */
    public function override(BuilderSession $s, string $module, string $action): array
    {
        if (! isset($this->policy->modules[$module])) {
            return ['error' => 'unknown_module'];
        }
        $add = $action === 'add';
        $s->facts->nextTurn();
        $s->facts->set("owner.added.{$module}", $add, 'owner_override');
        $s->facts->set("owner.removed.{$module}", ! $add, 'owner_override');
        $s->version++;

        return $this->review($s);
    }

    /** "Can't find it? Tell us." Returns the row the controller writes to the demand log. */
    public function missing(BuilderSession $s, string $text, ?string $email = null): array
    {
        $key = 'gap.requested_' . (count(array_filter(array_keys($s->facts->all()), fn ($k) => str_starts_with($k, 'gap.requested_'))) + 1);
        $s->facts->set($key, mb_substr(trim($text), 0, 500), 'owner_override');

        return [
            'ok' => true,
            'demand_row' => [
                'source' => 'builder_missing', 'raw_text' => $text, 'email' => $email,
                'session_id' => $s->id, 'type' => $s->typeKey,
                'facts' => $s->facts->toArray()['records'], 'policy_version' => BuilderPolicy::VERSION,
            ],
            'message' => 'Thank you — we read every one of these. If we build it, we\'ll email you.',
        ];
    }

    // ── review (the read-back) ─────────────────────────────────────────

    public function review(BuilderSession $s, ?string $plan = null): array
    {
        $c = $this->composer->compose($s, $plan);
        $sum = $this->writer->write($s);
        $requests = [];
        foreach ($s->facts->all() as $k => $r) {
            if (str_starts_with($k, 'gap.requested_')) {
                $requests[] = (string) $r['value'];
            }
        }

        return [
            'label' => $c['label'],
            'preview_text' => $this->previewText($c['areas']),
            'summary' => $sum['text'], 'summary_html' => $sum['html'], 'chips' => $sum['chips'],
            'areas' => $c['areas'], 'assumptions' => $c['assumptions'], 'not_included' => $c['not_included'],
            'gaps' => $c['gaps'], 'gifts' => $c['gifts'], 'conflicts' => $c['conflicts'],
            'requests' => $requests,
            'modules' => $c['module_keys'],
            'unpublished' => $c['unpublished'], 'not_connected' => $c['not_connected'], 'no_schedule' => $c['no_schedule'],
            'policy_version' => BuilderPolicy::VERSION,
        ];
    }

    /** "You'll be able to keep a record of your items, …" — from the areas the setup produced. */
    private function previewText(array $areas): string
    {
        $phrases = (array) ($this->policy->summary['area_phrases'] ?? []);
        $parts = [];
        foreach ($areas as $a) {
            if (isset($phrases[$a['key']])) {
                $parts[] = $phrases[$a['key']];
            }
        }
        if (! $parts) {
            return '';
        }
        $last = array_pop($parts);
        $list = $parts ? implode(', ', $parts) . ' and ' . $last : $last;

        return "You'll be able to {$list}.";
    }

    /** The only list provisioning may use (§6.7). */
    public function modulesFor(BuilderSession $s, ?string $plan = null): array
    {
        return $this->composer->compose($s, $plan)['module_keys'];
    }
}
