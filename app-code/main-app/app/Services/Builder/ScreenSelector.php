<?php

namespace App\Services\Builder;

/**
 * Chooses the next question screen and decides when to stop (§5).
 *
 * Deterministic: priority bands, then the screen that settles the most open
 * facts, then the shorter screen, then id. No probabilities, no model call.
 */
class ScreenSelector
{
    /** Bands 1-4 must be settled before we stop; 5-6 are optional. */
    public const ESSENTIAL_MAX_BAND = 4;

    public function __construct(private BuilderPolicy $policy)
    {
    }

    /** §5.2: a type hint lifts a screen ONE band, but never lowers a band 1-3 screen. */
    public function effectiveBand(string $panelId, BuilderSession $s): int
    {
        $band = (int) $this->panel($panelId, $s)['band'];
        $typeKey = $s->typeKey;
        if ($typeKey && in_array($panelId, (array) ($this->policy->typeHints[$typeKey]['raise'] ?? []), true)) {
            $band = max(1, $band - 1);
        }

        return $band;
    }

    /** A config question, or a clarifying question the AI wrote for this owner (already validated). */
    public function panel(string $id, BuilderSession $s): ?array
    {
        return $s->aiPanels[$id] ?? $this->policy->panel($id);
    }

    /** Facts the AI's own clarifications will settle; a hand-written clarification on the same facts would ask twice. */
    private function aiCovered(BuilderSession $s): array
    {
        $f = [];
        foreach ($s->aiPanels as $p) {
            foreach ((array) $p['options'] as $o) {
                $f += array_fill_keys(array_keys((array) ($o['writes'] ?? [])), true);
            }
        }

        return $f;
    }

    private function cond(BuilderSession $s): Condition
    {
        return new Condition($s->facts, $this->policy, $s->typeKey, 'confirmed');
    }

    /** Is this option on screen right now? */
    public function optionVisible(string $panelId, string $optId, BuilderSession $s): bool
    {
        $panel = $this->panel($panelId, $s);
        $opt = $panel['options'][$optId];
        $c = $this->cond($s);

        if (isset($opt['when']) && ! $c->test($opt['when'])) {
            return false;
        }
        if (! empty($panel['show_all']) || empty($opt['writes'])) {
            return true;
        }
        foreach (array_keys($opt['writes']) as $fact) {
            if (! $s->facts->known($fact)) {
                return true;
            }
        }

        return false;
    }

    /** An option can still change a decision when a fact it writes is unknown and not already skipped. */
    private function optionOpen(string $panelId, string $optId, BuilderSession $s): bool
    {
        $opt = $this->panel($panelId, $s)['options'][$optId];
        foreach (array_keys((array) ($opt['writes'] ?? [])) as $fact) {
            if (! $s->facts->known($fact) && ! $s->facts->asked($fact)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The owner's description already answered this screen (e.g. "counter sales… credit accounts"
     * settles "How do you usually get paid?"). Re-asking it with the leftover options reads as if we
     * never listened. Silence on the other options stays unknown, not "no"; the owner can still add
     * them through Change. Clarifications (show_all) and screens marked keep_open are always asked.
     */
    private function answeredInOwnWords(array $panel, BuilderSession $s): bool
    {
        if (! empty($panel['show_all']) || ! empty($panel['keep_open'])) {
            return false;
        }
        foreach ((array) $panel['options'] as $opt) {
            foreach ((array) ($opt['writes'] ?? []) as $fact => $value) {
                $r = $s->facts->get($fact);
                if ($r && $r['source'] === 'owner_text' && $value !== false && $r['value'] === $value) {
                    return true;
                }
            }
        }

        return false;
    }

    public function eligible(string $panelId, BuilderSession $s): bool
    {
        $panel = $this->panel($panelId, $s);
        if (! $panel || isset($s->panelState[$panelId])) {
            return false;
        }
        if (! $this->cond($s)->test($panel['ask_when'] ?? [])) {
            return false;
        }
        if ($this->answeredInOwnWords($panel, $s)) {
            return false;
        }
        foreach (array_keys($panel['options']) as $optId) {
            if ($this->optionVisible($panelId, $optId, $s) && $this->optionOpen($panelId, $optId, $s)) {
                return true;
            }
        }

        return false;
    }

    /** @return array<int,array{id:string,band:int,open:int,len:int}> sorted best-first */
    public function candidates(BuilderSession $s, int $maxBand): array
    {
        $out = [];
        $covered = $this->aiCovered($s);
        foreach (array_merge(array_keys($s->aiPanels), array_keys($this->policy->panels())) as $id) {
            if (! $this->eligible($id, $s)) {
                continue;
            }
            if ($covered && ! isset($s->aiPanels[$id]) && ! empty($this->policy->panel($id)['clarifies'])) {
                $writes = [];
                foreach ((array) $this->policy->panel($id)['options'] as $o) {
                    $writes += (array) ($o['writes'] ?? []);
                }
                if (array_intersect_key($writes, $covered)) {
                    continue;
                }
            }
            $band = $this->effectiveBand($id, $s);
            if ($band > $maxBand) {
                continue;
            }
            $open = 0;
            foreach (array_keys($this->panel($id, $s)['options']) as $o) {
                if ($this->optionVisible($id, $o, $s) && $this->optionOpen($id, $o, $s)) {
                    $open++;
                }
            }
            $out[] = ['id' => $id, 'band' => $band, 'open' => $open, 'len' => count($this->panel($id, $s)['options'])];
        }
        usort($out, fn ($a, $b) => [$a['band'], -$a['open'], $a['len'], $a['id']] <=> [$b['band'], -$b['open'], $b['len'], $b['id']]);

        return $out;
    }

    /** Essential (band 1-4) panels still waiting, grouped into screens. */
    public function essentialScreensRemaining(BuilderSession $s): int
    {
        $screens = [];
        foreach ($this->candidates($s, self::ESSENTIAL_MAX_BAND) as $c) {
            $screens[$this->panel($c["id"], $s)['screen'] ?? $c['id']] = true;
        }

        return count($screens);
    }

    public function conflictPending(BuilderSession $s): bool
    {
        return $s->facts->conflicts() !== [];
    }

    public function done(BuilderSession $s): bool
    {
        return $s->screensShown >= BuilderSession::MAX_SCREENS
            || $this->candidates($s, self::ESSENTIAL_MAX_BAND) === [];
    }

    /** §5.4 — preview after 3 completed screens, or when bands 1-3 are already settled. */
    public function previewAvailable(BuilderSession $s): bool
    {
        return $s->screensCompleted >= 3 || $this->candidates($s, 3) === [];
    }

    /**
     * Build (or re-serve) the next screen. Re-serving a pending screen does not count (§5.3).
     *
     * @return ?array  null when the essential questions are settled
     */
    public function next(BuilderSession $s, bool $includeOptional = false): ?array
    {
        if ($s->pending) {
            return $this->render($s, $s->pending['panels'], $s->pending['screen_id'], $s->pending['band']);
        }
        if ($s->screensShown >= BuilderSession::MAX_SCREENS) {
            return null;
        }

        $cands = $this->candidates($s, $includeOptional ? 6 : self::ESSENTIAL_MAX_BAND);
        if (! $cands) {
            return null;
        }

        $best = $cands[0];
        $screenId = $this->panel($best["id"], $s)['screen'] ?? $best['id'];
        // Every eligible panel of the same screen at the same band travels together (Q4 + till, Q6 a+b).
        $panels = [];
        foreach ($cands as $c) {
            if (($this->panel($c["id"], $s)['screen'] ?? $c['id']) === $screenId && $c['band'] === $best['band']) {
                $panels[] = $c['id'];
            }
        }
        sort($panels);

        $s->screensShown++;
        $s->version++;
        $shown = [];
        foreach ($panels as $pid) {
            $shown[$pid] = array_values(array_filter(
                array_keys($this->panel($pid, $s)['options']),
                fn ($o) => $this->optionVisible($pid, $o, $s)
            ));
        }
        $s->pending = ['screen_id' => $screenId, 'version' => $s->version, 'panels' => $panels, 'shown' => $shown, 'band' => $best['band']];

        if ($s->screensShown > BuilderSession::TARGET_SCREENS) {
            $s->log[] = ['type' => 'screen_beyond_target', 'screen' => $screenId, 'panels' => $panels, 'reason' => 'decides an essential workflow'];
        }

        return $this->render($s, $panels, $screenId, $best['band']);
    }

    private function render(BuilderSession $s, array $panelIds, string $screenId, int $band): array
    {
        $sub = (string) ($this->policy->questions['subtitle_multi'] ?? '');
        $panels = [];
        foreach ($panelIds as $pid) {
            $p = $this->panel($pid, $s);
            $opts = [];
            foreach ($s->pending['shown'][$pid] ?? [] as $oid) {
                $o = $p['options'][$oid];
                $opts[] = array_filter([
                    'id' => "{$pid}.{$oid}", 'label' => $o['label'], 'example' => $o['example'] ?? '',
                    'exclusive' => ! empty($o['exclusive']), 'gift' => ! empty($o['gift']),
                    'explain' => isset($o['explain']), 'provider_picker' => ! empty($o['provider_picker']),
                ], fn ($v) => $v !== false);
            }
            $panels[] = [
                'id' => $pid, 'kind' => $p['kind'], 'title' => $p['title'],
                'subtitle' => $p['kind'] === 'multi' ? $sub : null,
                'none' => $p['none'] ?? null, 'options' => $opts,
            ];
        }

        return [
            'screen_id' => $screenId, 'version' => $s->pending['version'] ?? $s->version, 'band' => $band,
            'panels' => $panels, 'number' => $s->screensShown,
            'reask' => in_array('q1_reask', array_column($s->log, 'type'), true) && in_array('Q1', $panelIds, true),
            'estimate_remaining' => max(0, $this->essentialScreensRemaining($s) - 1),
        ];
    }
}
