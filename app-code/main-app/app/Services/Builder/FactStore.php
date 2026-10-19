<?php

namespace App\Services\Builder;

use InvalidArgumentException;

/**
 * The owner's facts, with precedence, revisions and derived facts
 * (BUILDER_FINAL_PLAN.md §2).
 *
 * Record:
 *   key, value, status, source, evidence, question_id, turn, revision, asked,
 *   pending_confirm
 *
 * status  confirmed | negative | unknown | not_applicable | conflict
 * Precedence: readback_edit / owner_override > answer (latest) > owner_text >
 * template_assumption. Nothing accumulates: composition is recomputed from
 * facts every time.
 *
 * Two readings of a fact:
 *   isTrue()        what the owner actually said (confirmed true)
 *   effectiveTrue() the same, plus the disclosed starting-template assumption
 *                   when the owner has said nothing about that key
 */
class FactStore
{
    /** @var array<string,array> */
    private array $records = [];

    private int $revision = 0;

    private int $turn = 0;

    public function __construct(private BuilderPolicy $policy)
    {
    }

    // ── writing ──────────────────────────────────────────────────────────

    public function nextTurn(): int
    {
        return ++$this->turn;
    }

    public function revision(): int
    {
        return $this->revision;
    }

    /**
     * Write one fact. `true`/`false` for bool facts, a string for enum/string
     * facts. A false bool is stored as status `negative`.
     * Returns false when a higher-ranked source already holds the key.
     */
    public function set(string $key, bool|string $value, string $source, ?string $questionId = null, ?string $evidence = null): bool
    {
        if (! $this->policy->validFact($key)) {
            throw new InvalidArgumentException("Unknown builder fact: {$key}");
        }
        $type = $this->policy->factType($key);
        if ($type === 'enum') {
            $allowed = (array) ($this->policy->facts['facts'][$key]['values'] ?? []);
            if (! is_string($value) || ! in_array($value, $allowed, true)) {
                throw new InvalidArgumentException("Bad value for {$key}");
            }
        } elseif ($type === 'bool' && ! is_bool($value)) {
            throw new InvalidArgumentException("{$key} must be true or false");
        }

        $old = $this->records[$key] ?? null;
        $rank = (array) $this->policy->facts['source_rank'];
        if ($old && ($old['status'] ?? '') !== 'unknown') {
            $oldRank = $rank[$old['source']] ?? 0;
            $newRank = $rank[$source] ?? 0;
            if ($newRank < $oldRank) {
                return false;
            }
            // Same rank, different value, from the owner's own words: a conflict, not a coin-toss.
            if ($newRank === $oldRank && $source === 'owner_text' && $old['value'] !== $value) {
                $this->records[$key] = $this->record($key, $value, 'conflict', $source, $evidence, $questionId);

                return true;
            }
        }

        $status = $type === 'bool' ? ($value ? 'confirmed' : 'negative') : 'confirmed';
        if ($source === 'template_assumption') {
            $status = 'unknown';   // an assumption is never the owner's answer
        }
        $this->records[$key] = $this->record($key, $value, $status, $source, $evidence, $questionId);
        $this->revision++;

        return true;
    }

    /** The owner skipped or said "not sure": remember we asked, claim nothing. */
    public function markAsked(string $key, string $how, ?string $questionId = null): void
    {
        $old = $this->records[$key] ?? null;
        if ($old && $old['status'] !== 'unknown') {
            return;   // an existing answer is never undone by a later skip
        }
        if ($old && $old['source'] === 'template_assumption') {
            $this->records[$key]['asked'] = $how;   // keep the disclosed assumption, note we asked

            return;
        }
        $r = $this->record($key, $this->policy->factType($key) === 'bool' ? false : '', 'unknown', 'answer', $how, $questionId);
        $r['asked'] = $how;   // skipped | unsure
        $this->records[$key] = $r;
    }

    public function forget(string $key): void
    {
        unset($this->records[$key]);
        $this->revision++;
    }

    public function setPendingConfirm(string $key, bool $pending): void
    {
        if (isset($this->records[$key])) {
            $this->records[$key]['pending_confirm'] = $pending;
        }
    }

    private function record(string $key, bool|string $value, string $status, string $source, ?string $evidence, ?string $questionId): array
    {
        return [
            'key' => $key, 'value' => $value, 'status' => $status, 'source' => $source,
            'evidence' => $evidence, 'question_id' => $questionId,
            'turn' => $this->turn, 'revision' => $this->revision + 1,
            'asked' => null, 'pending_confirm' => false,
        ];
    }

    // ── reading ──────────────────────────────────────────────────────────

    public function get(string $key): ?array
    {
        return $this->records[$key] ?? null;
    }

    public function all(): array
    {
        return $this->records;
    }

    /** The owner gave an answer (yes OR no) for this key. */
    public function known(string $key): bool
    {
        $s = $this->records[$key]['status'] ?? 'unknown';

        return in_array($s, ['confirmed', 'negative', 'not_applicable', 'conflict'], true);
    }

    /** Asked and left unresolved (skip / not sure). Still unknown, but not worth asking again. */
    public function asked(string $key): bool
    {
        return ($this->records[$key]['asked'] ?? null) !== null;
    }

    public function isNegative(string $key): bool
    {
        return ($this->records[$key]['status'] ?? '') === 'negative';
    }

    public function isTrue(string $key): bool
    {
        $r = $this->records[$key] ?? null;

        return $r !== null && $r['status'] === 'confirmed' && $r['value'] === true;
    }

    public function value(string $key): bool|string|null
    {
        $r = $this->records[$key] ?? null;

        return ($r && $r['status'] === 'confirmed') ? $r['value'] : null;
    }

    /** Owner's answer, or the disclosed template assumption when the owner said nothing. */
    public function effectiveTrue(string $key): bool
    {
        if ($this->known($key)) {
            return $this->isTrue($key);
        }
        $r = $this->records[$key] ?? null;

        return $r !== null && $r['source'] === 'template_assumption' && $r['value'] === true;
    }

    public function effectiveValue(string $key): bool|string|null
    {
        if ($this->known($key)) {
            return $this->value($key);
        }
        $r = $this->records[$key] ?? null;

        return ($r && $r['source'] === 'template_assumption') ? $r['value'] : null;
    }

    /** True when the key's truth comes only from a template assumption. */
    public function assumedOnly(string $key): bool
    {
        return ! $this->known($key) && $this->effectiveTrue($key);
    }

    // ── derived facts (never stored) ────────────────────────────────────

    public function derived(string $name, bool $effective = false): bool
    {
        $t = fn (string $k) => $effective ? $this->effectiveTrue($k) : $this->isTrue($k);

        return match ($name) {
            'd.procures' => $t('items.resale_stock') || $t('items.work_materials') || $t('items.buy_to_order'),
            'd.tracks_qty' => $t('items.resale_stock') || $t('items.work_materials')
                || $t('items.counted_supplies') || $t('items.supplied_by_other'),
            'd.sells_goods_at_counter' => $t('sale.counter') || $t('food.counter_takeaway'),
            default => throw new InvalidArgumentException("Unknown derived fact: {$name}"),
        };
    }

    /** Facts that contradict each other and must be clarified before composing (band 1). */
    public function conflicts(): array
    {
        $out = [];
        foreach ($this->records as $k => $r) {
            if ($r['status'] === 'conflict') {
                $out[] = $k;
            }
        }
        // "sent to us by someone else" AND "we pay suppliers later", without also buying stock.
        if ($this->isTrue('items.supplied_by_other') && $this->isTrue('money.supplier_later') && ! $this->isTrue('items.resale_stock')) {
            $out[] = 'stock_source';
        }

        return $out;
    }

    // ── persistence ─────────────────────────────────────────────────────

    public function toArray(): array
    {
        return ['records' => $this->records, 'revision' => $this->revision, 'turn' => $this->turn];
    }

    public static function fromArray(BuilderPolicy $policy, array $data): self
    {
        $s = new self($policy);
        $s->records = (array) ($data['records'] ?? []);
        $s->revision = (int) ($data['revision'] ?? 0);
        $s->turn = (int) ($data['turn'] ?? 0);

        return $s;
    }
}
