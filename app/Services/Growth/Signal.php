<?php

namespace App\Services\Growth;

use Carbon\Carbon;

/**
 * Signal — one insight, as produced by a brain.
 *
 * A plain value object. Brains build these; SignalRepository decides whether
 * each one is new, a repeat, suppressed or superseded, and only then does it
 * touch the database. Keeping brains free of persistence logic is what makes
 * them readable and testable — V1 mixed `AiRecommendation::create()` calls
 * directly into its analysis loops, so every rule had to reimplement its own
 * ad-hoc duplicate check, and each one did it slightly differently.
 *
 * `subjectKey` is the crucial field: it identifies WHAT the signal is about
 * (a party, a product, a day-of-week…). Together with the type it produces a
 * stable `signal_key`, so the same real-world condition maps to the same row
 * on every run rather than piling up duplicates.
 */
class Signal
{
    public function __construct(
        public string $type,
        public string $subjectKey,
        public string $title,
        public string $message,
        /** Money at stake. Drives ranking and the headline "opportunity" figure. */
        public float $potentialRevenue = 0.0,
        /** 0–100. How sure the brain is, before tenant-specific tuning. */
        public float $confidence = 60.0,
        public ?string $partyId = null,
        public ?string $productId = null,
        /** The numbers behind the claim, shown to the owner so they can audit it. */
        public array $evidence = [],
        /** Structured payload for the UI (charts, phone number, suggested text…). */
        public array $data = [],
        public ?string $actionUrl = null,
        public ?string $actionType = null,
        public ?string $priority = null,
        public ?Carbon $validUntil = null,
        /** Days until the prediction can be graded. Null = use catalog default. */
        public ?int $horizonDays = null,
    ) {
    }

    /**
     * Deterministic identity for this signal.
     *
     * Same tenant + same type + same subject ⇒ same key ⇒ the repository
     * updates the existing row instead of creating a duplicate. This single
     * idea is what allows the engine to run hourly without spamming.
     */
    public function key(int|string $tenantId): string
    {
        return substr(sha1($tenantId . '|' . $this->type . '|' . $this->subjectKey), 0, 40);
    }

    public function brain(): string
    {
        return InsightCatalog::brainOf($this->type);
    }

    public function resolvedPriority(): string
    {
        return $this->priority
            ?? InsightCatalog::meta($this->type, 'base_priority', 'medium');
    }

    public function resolvedActionType(): ?string
    {
        return $this->actionType
            ?? InsightCatalog::meta($this->type, 'action_type');
    }

    public function resolvedHorizon(): int
    {
        return $this->horizonDays
            ?? (int) InsightCatalog::meta($this->type, 'default_horizon', 0);
    }
}
