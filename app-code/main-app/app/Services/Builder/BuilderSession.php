<?php

namespace App\Services\Builder;

/**
 * One owner's builder run (replaces DiscoverySession).
 *
 * Holds the facts, the screen counter, which panels are done and the screen
 * currently waiting for an answer. Plain data: toArray()/fromArray() round-trips
 * through the cache, so the server — not the browser — owns the decision.
 */
class BuilderSession
{
    public const MAX_SCREENS = 10;

    public const TARGET_SCREENS = 8;

    public FactStore $facts;

    /** @var array<string,string> panel id => answered | skipped | unsure */
    public array $panelState = [];

    /** @var ?array{screen_id:string,version:int,panels:array<int,string>,shown:array<string,array<int,string>>,band:int} */
    public ?array $pending = null;

    public int $screensShown = 0;

    public int $screensCompleted = 0;

    public int $version = 0;

    /** @var array<int,array> reasons for screens 9-10, readback edits, etc. */
    public array $log = [];

    public bool $previewSeen = false;

    /** @var array<string,array> clarifying screens the AI wrote for THIS owner (validated; see AiFactReader) */
    public array $aiPanels = [];

    /** One plain sentence saying back what we understood, so the owner knows someone listened. */
    public ?string $heard = null;

    public function __construct(
        public string $id,
        public ?string $typeKey,
        BuilderPolicy $policy,
        public string $route = 'sentence',
    ) {
        $this->facts = new FactStore($policy);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id, 'type' => $this->typeKey, 'route' => $this->route,
            'facts' => $this->facts->toArray(),
            'panel_state' => $this->panelState, 'pending' => $this->pending,
            'screens_shown' => $this->screensShown, 'screens_completed' => $this->screensCompleted,
            'version' => $this->version, 'log' => $this->log, 'preview_seen' => $this->previewSeen,
            'ai_panels' => $this->aiPanels, 'heard' => $this->heard,
            'policy_version' => BuilderPolicy::VERSION,
        ];
    }

    public static function fromArray(BuilderPolicy $policy, array $d): self
    {
        $s = new self((string) $d['id'], $d['type'] ?? null, $policy, (string) ($d['route'] ?? 'sentence'));
        $s->facts = FactStore::fromArray($policy, (array) ($d['facts'] ?? []));
        $s->panelState = (array) ($d['panel_state'] ?? []);
        $s->pending = $d['pending'] ?? null;
        $s->screensShown = (int) ($d['screens_shown'] ?? 0);
        $s->screensCompleted = (int) ($d['screens_completed'] ?? 0);
        $s->version = (int) ($d['version'] ?? 0);
        $s->log = (array) ($d['log'] ?? []);
        $s->previewSeen = (bool) ($d['preview_seen'] ?? false);
        $s->aiPanels = (array) ($d['ai_panels'] ?? []);
        $s->heard = $d['heard'] ?? null;

        return $s;
    }
}
