<?php

namespace App\Services\AiBuilder;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  DiscoverySession — Structured Multi-Turn State Machine                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Tracks structured business facts, capability resolutions, and revision histories
 * in Redis / Cache (never polluting the main database).
 */
class DiscoverySession
{
    public const TTL_SECONDS = 1800; // 30 minutes
    public const MAX_TURNS   = 5;

    public function __construct(
        public string $sessionId,
        public string $language = 'en',
        public int $turnCount = 0,
        public array $structuredFacts = [], // [key => ['value' => ..., 'confidence' => ..., 'source' => ..., 'evidence' => ...]]
        public array $confirmed = [],       // ['repair_job_tracking', ...]
        public array $rejected = [],        // ['table_and_kot_management', ...]
        public array $history = [],
        public ?array $currentQuestion = null,
        public bool $isComplete = false,
        public ?array $proposal = null,
        public ?string $preset = null,
        public float $systemReadinessConfidence = 0.5,
        public float $aiSignalConfidence = 0.5,
    ) {}

    public static function cacheKey(string $sessionId): string
    {
        return "ai_discovery_session:{$sessionId}";
    }

    public static function load(string $sessionId): ?self
    {
        $data = Cache::get(self::cacheKey($sessionId));
        if (!$data || !is_array($data)) {
            return null;
        }

        return new self(
            sessionId: $data['session_id'] ?? $sessionId,
            language: $data['language'] ?? 'en',
            turnCount: (int) ($data['turn_count'] ?? 0),
            structuredFacts: $data['structured_facts'] ?? [],
            confirmed: $data['confirmed'] ?? [],
            rejected: $data['rejected'] ?? [],
            history: $data['history'] ?? [],
            currentQuestion: $data['current_question'] ?? null,
            isComplete: (bool) ($data['is_complete'] ?? false),
            proposal: $data['proposal'] ?? null,
            preset: $data['preset'] ?? null,
            systemReadinessConfidence: (float) ($data['system_readiness_confidence'] ?? 0.5),
            aiSignalConfidence: (float) ($data['ai_signal_confidence'] ?? 0.5),
        );
    }

    public static function start(string $initialPrompt, array $initialFacts = [], ?string $preset = null): self
    {
        $sessionId = (string) Str::uuid();
        $session = new self(
            sessionId: $sessionId,
            structuredFacts: $initialFacts,
            history: [
                ['role' => 'user', 'content' => $initialPrompt, 'turn' => 0],
            ],
            preset: $preset,
        );
        $session->save();

        return $session;
    }

    public function save(): void
    {
        Cache::put(self::cacheKey($this->sessionId), [
            'session_id'                 => $this->sessionId,
            'language'                   => $this->language,
            'turn_count'                 => $this->turnCount,
            'structured_facts'           => $this->structuredFacts,
            'confirmed'                  => array_values(array_unique($this->confirmed)),
            'rejected'                   => array_values(array_unique($this->rejected)),
            'history'                    => $this->history,
            'current_question'           => $this->currentQuestion,
            'is_complete'                => $this->isComplete,
            'proposal'                   => $this->proposal,
            'preset'                     => $this->preset,
            'system_readiness_confidence' => $this->systemReadinessConfidence,
            'ai_signal_confidence'       => $this->aiSignalConfidence,
        ], self::TTL_SECONDS);
    }

    public function forget(): void
    {
        Cache::forget(self::cacheKey($this->sessionId));
    }

    /**
     * Records a new user answer with state updates, handling revisions/corrections.
     */
    public function recordAnswer(
        string $answer,
        array $newFacts = [],
        array $newConfirmed = [],
        array $newRejected = []
    ): void {
        $this->turnCount++;
        $this->history[] = [
            'role'    => 'user',
            'content' => $answer,
            'turn'    => $this->turnCount,
        ];

        // Merge structured facts
        foreach ($newFacts as $key => $fact) {
            $this->structuredFacts[$key] = $fact;
        }

        // Handle capability confirmations with revision support
        foreach ($newConfirmed as $cap) {
            // Remove from rejected if previously rejected
            $this->rejected = array_values(array_diff($this->rejected, [$cap]));
            if (!in_array($cap, $this->confirmed, true)) {
                $this->confirmed[] = $cap;
            }
        }

        // Handle capability rejections with revision support
        foreach ($newRejected as $cap) {
            // Remove from confirmed if previously confirmed
            $this->confirmed = array_values(array_diff($this->confirmed, [$cap]));
            if (!in_array($cap, $this->rejected, true)) {
                $this->rejected[] = $cap;
            }
        }
    }

    /**
     * Compact payload format passed to Gemini.
     * Includes explicit detected_trade and known_context so Gemini stays domain-coherent.
     */
    public function toCompactPromptContext(?array $candidateQuestion = null): array
    {
        // Extract detected trade from structured facts (e.g. trade:pharmacy -> 'pharmacy')
        $detectedTrade = null;
        $knownContext = [];

        foreach ($this->structuredFacts as $factKey => $fact) {
            if (str_starts_with($factKey, 'trade:')) {
                $detectedTrade = substr($factKey, 6);
            }
            if ($factKey === 'branches' && !empty($fact['value'])) {
                $knownContext[] = "Has {$fact['value']} branch(es)";
            }
            if ($factKey === 'multi_branch' && !empty($fact['value'])) {
                $knownContext[] = 'Multi-branch operation confirmed';
            }
        }

        $initialPrompt = $this->history[0]['content'] ?? '';

        return [
            'turn'                   => $this->turnCount + 1,
            'max_turns'              => self::MAX_TURNS,
            'language'               => $this->language,
            // EXPLICIT TRADE CONTEXT: Gemini must stay within this trade domain
            'detected_trade'         => $detectedTrade,
            'initial_user_prompt'    => $initialPrompt,
            'known_context'          => $knownContext,
            'structured_facts'       => $this->structuredFacts,
            'confirmed_capabilities' => $this->confirmed,
            'rejected_capabilities'  => $this->rejected,
            'candidate_question'     => $candidateQuestion ? [
                'target_capability' => $candidateQuestion['key'],
                'name'              => $candidateQuestion['name'],
                'seed_question'     => $candidateQuestion['question_template'],
                'consequences'      => $candidateQuestion['consequences'],
                'seed_options'      => $candidateQuestion['options'],
            ] : null,
            'recent_history'         => array_slice($this->history, -3),
        ];
    }
}
