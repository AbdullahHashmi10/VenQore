<?php

namespace App\Services\AiBuilder;

use App\Models\Tenant;
use App\Services\Ai\AiGateway;
use App\Services\Ai\AiRateLimiter;
use App\Services\Ai\AiRequest;
use App\Services\Ai\AiSchema;
use App\Services\Ai\AiSpendGuard;
use App\Services\Ai\AiUsageRecorder;
use Illuminate\Support\Facades\Log;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ConversationalBuilderService — Production Grade Intelligence Layer       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Core Architecture Principle:
 *   - The VenQore System decides WHAT to ask (Candidate Question selection).
 *   - Gemini decides HOW to phrase it naturally in the merchant's language.
 *   - The System calculates Readiness Confidence deterministically.
 */
class ConversationalBuilderService
{
    public function __construct(
        private CapabilityRegistry $capabilityRegistry,
        private ConfigurationValidator $validator,
        private ConfigurationAIService $aiService,
        private AiGateway $gateway,
        private AiRateLimiter $limiter,
        private AiSpendGuard $spendGuard,
        private AiUsageRecorder $usageRecorder,
    ) {}

    /**
     * Start a new discovery session from the user's initial prompt or preset.
     *
     * @return array{session_id: string, ok: bool, assistant_message: string, quick_options: array, progress: int, is_complete: bool, proposal?: array}
     */
    public function startSession(string $initialPrompt, ?string $preset = null): array
    {
        // 1. Fast deterministic extraction (0-token cost)
        $fastExtraction = $this->capabilityRegistry->detectStructuredFacts($initialPrompt);
        $initialFacts = $fastExtraction['facts'];
        $detectedPreset = $preset ?: $fastExtraction['detected_preset'] ?: $this->aiService->guessPreset(['what' => $initialPrompt]);

        $session = DiscoverySession::start($initialPrompt, $initialFacts, $detectedPreset);

        // If multi-branch was explicitly declared in initial prompt, auto-confirm capability
        if (!empty($initialFacts['multi_branch']['value'])) {
            $session->confirmed[] = 'multi_branch_warehouses';
            $session->confirmed = array_unique($session->confirmed);
        }

        // Process first turn
        return $this->processTurn($session, $initialPrompt, isFirstTurn: true);
    }

    /**
     * Advance discovery conversation by one turn.
     */
    public function step(string $sessionId, string $userResponse, ?string $selectedOptionKey = null): array
    {
        $session = DiscoverySession::load($sessionId);
        if (!$session) {
            return [
                'ok'          => false,
                'is_complete' => false,
                'message'     => 'Session expired. Please start over or pick a template.',
                'fallback'    => true,
            ];
        }

        // Fast deterministic fact extraction from the user's response
        $newFast = $this->capabilityRegistry->detectStructuredFacts($userResponse);

        $confirmed = [];
        $rejected = [];

        // Check if user answered the target capability of the active question
        if ($session->currentQuestion && isset($session->currentQuestion['target_capability'])) {
            $cap = $session->currentQuestion['target_capability'];
            $normalizedAnswer = strtolower($userResponse);

            if ($selectedOptionKey === 'yes' || preg_match('/\b(yes|yeah|sure|definitely|ہاں|جی|نعم|si|oui)\b/i', $normalizedAnswer)) {
                $confirmed[] = $cap;
            } elseif ($selectedOptionKey === 'no' || preg_match('/\b(no|nope|not needed|نہیں|لا|non)\b/i', $normalizedAnswer)) {
                $rejected[] = $cap;
            }
        }

        // Record the turn into session state with revision support
        $session->recordAnswer($userResponse, $newFast['facts'], $confirmed, $rejected);

        return $this->processTurn($session, $userResponse, isFirstTurn: false);
    }

    /**
     * Internal turn processor.
     */
    private function processTurn(DiscoverySession $session, string $latestInput, bool $isFirstTurn): array
    {
        $clientIp = request()?->ip() ?? '127.0.0.1';
        $ipHash = substr(hash('sha256', $clientIp . (config('app.key') ?: 'venqore-salt')), 0, 16);
        $scope = "ai_discovery:anon_{$ipHash}";

        // 1. Calculate deterministic system readiness confidence
        $readiness = $this->capabilityRegistry->calculateReadinessConfidence(
            $session->structuredFacts,
            $session->confirmed,
            $session->rejected
        );
        $session->systemReadinessConfidence = $readiness;

        // 2. Deterministic Question Selector: System picks the next candidate question
        $candidateQuestion = $this->capabilityRegistry->selectNextCandidateQuestion(
            $session->structuredFacts,
            $session->confirmed,
            $session->rejected
        );

        // Check completion criteria:
        //  - High system readiness >= 0.88 AND at least 2 turns completed
        //  - OR No more candidate questions exist
        //  - OR Hard turn cap reached
        if (($readiness >= 0.88 && $session->turnCount >= 2 && !$isFirstTurn)
            || $candidateQuestion === null
            || $session->turnCount >= DiscoverySession::MAX_TURNS) {
            return $this->finalizeProposal($session);
        }

        // 3. Rate limiter & spend checks
        $rateCheck = $this->limiter->tryAcquire($scope, 1);
        if (!($rateCheck['ok'] ?? true)) {
            return $this->fallbackToPreset($session, 'rate_limited');
        }

        $estimate = 0.001; // Gemini 3.1 Flash-Lite estimate
        // Global ceiling for AI discovery to prevent exhaustion
        if (!$this->spendGuard->checkAndRecord('ai_discovery:global', $estimate, 25.00)) {
            return $this->fallbackToPreset($session, 'spend_capped');
        }

        if (!$this->spendGuard->checkAndRecord($scope, $estimate, 1.00)) {
            return $this->fallbackToPreset($session, 'spend_capped');
        }

        try {
            $promptContext = $session->toCompactPromptContext($candidateQuestion);
            $aiResponse = $this->callGemini($promptContext, $latestInput);

            if (!$aiResponse['ok'] || empty($aiResponse['data'])) {
                Log::warning('AI turn failed or empty, using seed candidate question', [
                    'session_id' => $session->sessionId,
                    'error'      => $aiResponse['error'] ?? 'Unknown',
                ]);
                // Graceful in-flight fallback: use candidate question's seed template directly
                return $this->renderCandidateFallback($session, $candidateQuestion);
            }

            $data = $aiResponse['data'];

            // Update language if detected
            if (!empty($data['language'])) {
                $session->language = $data['language'];
            }

            // Update structured facts from AI extraction (with confidence scores)
            if (!empty($data['extracted_facts']) && is_array($data['extracted_facts'])) {
                foreach ($data['extracted_facts'] as $k => $factObj) {
                    if (is_array($factObj)) {
                        $session->structuredFacts[$k] = [
                            'value'      => $factObj['value'] ?? true,
                            'confidence' => (float) ($factObj['confidence'] ?? 0.85),
                            'source'     => 'ai_extraction',
                            'evidence'   => $factObj['evidence'] ?? '',
                        ];
                    }
                }
            }

            // Update confirmed & rejected capabilities
            if (!empty($data['confirmed_capabilities']) && is_array($data['confirmed_capabilities'])) {
                foreach ($data['confirmed_capabilities'] as $cap) {
                    if (is_string($cap) && !in_array($cap, $session->confirmed, true)) {
                        $session->confirmed[] = $cap;
                    }
                }
            }

            if (!empty($data['rejected_capabilities']) && is_array($data['rejected_capabilities'])) {
                foreach ($data['rejected_capabilities'] as $cap) {
                    if (is_string($cap) && !in_array($cap, $session->rejected, true)) {
                        $session->rejected[] = $cap;
                    }
                }
            }

            $session->aiSignalConfidence = (float) ($data['ai_confidence'] ?? 0.85);

            // If user explicitly stated they are ready or AI confirms completion with high readiness
            if (!empty($data['is_complete']) && $session->systemReadinessConfidence >= 0.75) {
                return $this->finalizeProposal($session);
            }

            // Construct and store current question
            $currentQuestion = [
                'message'           => $data['assistant_question'] ?? $candidateQuestion['question_template'],
                'options'           => $data['quick_options'] ?? $candidateQuestion['options'],
                'target_capability' => $candidateQuestion['key'],
                'consequences'      => $candidateQuestion['consequences'],
            ];

            $session->currentQuestion = $currentQuestion;
            $session->save();

            $progressPercent = (int) ($session->systemReadinessConfidence * 100);

            return [
                'ok'                => true,
                'session_id'        => $session->sessionId,
                'assistant_message' => $currentQuestion['message'],
                'quick_options'     => $currentQuestion['options'],
                'target_capability' => $currentQuestion['target_capability'],
                'turn'              => $session->turnCount,
                'progress'          => max(25, min(95, $progressPercent)),
                'is_complete'       => false,
                'confirmed_caps'    => $session->confirmed,
                'readiness_score'   => $session->systemReadinessConfidence,
            ];

        } catch (\Throwable $e) {
            Log::error('Discovery AI exception: ' . $e->getMessage());
            return $this->fallbackToPreset($session, 'exception');
        }
    }

    /**
     * Finalizes the proposal and validates through ConfigurationValidator.
     */
    public function finalizeProposal(DiscoverySession $session): array
    {
        $session->isComplete = true;

        // Deterministically resolve live modules
        $modules = $this->capabilityRegistry->resolveModules($session->confirmed, $session->preset);

        $dummyTenant = new Tenant();
        $dummyTenant->id = 0;
        $dummyTenant->plan = 'solo';

        $rawProposalJson = json_encode([
            'modules'     => $modules,
            'preset'      => $session->preset ?: 'retail_shop',
            'confidence'  => max(0.90, $session->systemReadinessConfidence),
            'reasoning'   => 'Configured dynamically through VenQore AI Discovery based on merchant capability requirements.',
            'terminology' => $this->resolveTerminology($session->structuredFacts),
        ]);

        $validated = $this->validator->validate($rawProposalJson, $dummyTenant);

        $session->proposal = $validated;
        $session->save();

        return [
            'ok'                => true,
            'session_id'        => $session->sessionId,
            'is_complete'       => true,
            'assistant_message' => 'Great! I have all the details needed to build your tailored VenQore workspace.',
            'proposal'          => $validated,
            'modules'           => $validated['modules'] ?? $modules,
            'preset'            => $validated['preset'] ?? ($session->preset ?: 'retail_shop'),
            'confidence'        => $validated['confidence'] ?? 0.92,
            'turn'              => $session->turnCount,
            'progress'          => 100,
        ];
    }

    /**
     * In-flight fallback using deterministic candidate question directly without Gemini.
     */
    private function renderCandidateFallback(DiscoverySession $session, array $candidateQuestion): array
    {
        $currentQuestion = [
            'message'           => $candidateQuestion['question_template'],
            'options'           => $candidateQuestion['options'],
            'target_capability' => $candidateQuestion['key'],
            'consequences'      => $candidateQuestion['consequences'],
        ];

        $session->currentQuestion = $currentQuestion;
        $session->save();

        return [
            'ok'                => true,
            'session_id'        => $session->sessionId,
            'assistant_message' => $currentQuestion['message'],
            'quick_options'     => $currentQuestion['options'],
            'target_capability' => $currentQuestion['target_capability'],
            'turn'              => $session->turnCount,
            'progress'          => (int) ($session->systemReadinessConfidence * 100),
            'is_complete'       => false,
            'confirmed_caps'    => $session->confirmed,
            'readiness_score'   => $session->systemReadinessConfidence,
        ];
    }

    /**
     * Full fallback to template preset.
     */
    private function fallbackToPreset(DiscoverySession $session, string $reason): array
    {
        $preset = $session->preset ?: 'retail_shop';
        $dummyTenant = new Tenant();
        $dummyTenant->id = 0;

        $proposal = $this->aiService->fallback($dummyTenant, $reason, ['what' => $preset], null, $preset);

        $session->isComplete = true;
        $session->proposal = $proposal;
        $session->save();

        return [
            'ok'                => false,
            'session_id'        => $session->sessionId,
            'is_complete'       => true,
            'fallback'          => true,
            'fallback_reason'   => $reason,
            'assistant_message' => "Let's proceed with a recommended template based on your business type.",
            'proposal'          => $proposal,
            'preset'            => $preset,
            'modules'           => config("ai_builder.presets.{$preset}.modules", []),
            'progress'          => 100,
        ];
    }

    /**
     * Calls Gemini with structured JSON schema.
     */
    private function callGemini(array $promptContext, string $latestInput): array
    {
        $systemPrompt = $this->systemPrompt();
        $userPrompt = "LATEST_USER_INPUT: \"{$latestInput}\"\n\nCONTEXT_AND_CANDIDATE_QUESTION:\n" . json_encode($promptContext, JSON_PRETTY_PRINT);

        $request = AiRequest::for('config_ai')
            ->systemPrompt($systemPrompt)
            ->prompt($userPrompt)
            ->expects(AiSchema::jsonObject());

        $result = $this->gateway->resolve($request);

        if (!$result->ok) {
            return ['ok' => false, 'error' => $result->errorMessage];
        }

        $decoded = is_array($result->value) ? $result->value : json_decode((string) $result->value, true);

        return [
            'ok'   => is_array($decoded),
            'data' => $decoded,
        ];
    }

    private function systemPrompt(): string
    {
        return <<<PROMPT
You are VenQore's Conversational Discovery Intelligence Layer — a workspace configuration assistant.

Your ONLY task: Take the system's pre-selected CANDIDATE QUESTION ("seed_question" in the JSON context) and rephrase it naturally, warmly, and concisely in the user's NATIVE language (Urdu, Arabic, English, etc.).

The JSON context you receive includes:
- "detected_trade": the user's business type (e.g. "pharmacy", "grocery", "electronics", "restaurant")
- "initial_user_prompt": exactly what the user first typed
- "known_context": facts already confirmed (e.g. number of branches)
- "candidate_question.seed_question": THE question you MUST rephrase (do not invent a different question)
- "candidate_question.seed_options": the options you MUST translate (you can reword but not remove/add new ones)

STRICT RULES:
1. LANGUAGE: Always reply in the exact same language as "initial_user_prompt". If Urdu, write fluent natural Urdu script. Never mix scripts.
2. ASK EXACTLY THE SEED QUESTION: Rephrase candidate_question.seed_question naturally. Do NOT invent a different question about a different topic.
3. DOMAIN COHERENCE: Your rephrasing MUST be relevant to the detected_trade. Examples:
   - detected_trade = "pharmacy" → frame around medicines, drugs, patients, prescriptions
   - detected_trade = "grocery" → frame around stock, products, credit customers
   - detected_trade = "electronics" → frame around devices, serial numbers, warranties
   - NEVER mention repairs to a pharmacy; NEVER mention restaurant tables to a clothing shop
4. REFERENCE CONTEXT: Briefly acknowledge what is already known (e.g. "آپ کی 2 فارمیسی برانچز ہیں"). Do NOT re-ask about already-known facts.
5. BREVITY: 1-2 sentences maximum. Be warm and professional, not robotic.
6. OPTIONS: Translate/rephrase candidate_question.seed_options into the user's language. Do not add or remove options.
7. NEVER invent modules or execute database commands.

JSON OUTPUT SCHEMA (respond ONLY with valid JSON, no markdown):
{
  "language": "ur" | "en" | "ar" | "es" ...,
  "extracted_facts": {
    "key_name": {"value": true | "string" | number, "confidence": 0.95, "evidence": "quote from user"}
  },
  "confirmed_capabilities": ["capability_key"],
  "rejected_capabilities": ["capability_key"],
  "assistant_question": "Natural 1-2 sentence rephrase of seed_question in user's language, trade-accurate",
  "quick_options": [
    {"key": "yes", "label": "Translated label in user's language"},
    {"key": "no", "label": "Translated label in user's language"},
    {"key": "custom", "label": "Translated custom option"}
  ],
  "needs_clarification": false,
  "ai_confidence": 0.90,
  "is_complete": false
}
PROMPT;
    }

    private function resolveTerminology(array $facts): array
    {
        // facts use "trade:pharmacy", "trade:restaurant" etc. as keys
        $tradeKeys = array_keys(array_filter($facts, fn($v, $k) => str_starts_with($k, 'trade:'), ARRAY_FILTER_USE_BOTH));
        $trade = '';
        if (!empty($tradeKeys)) {
            $trade = substr($tradeKeys[0], 6); // strip "trade:" prefix
        }

        return match ($trade) {
            'pharmacy'    => ['item' => 'Medicine', 'customer' => 'Patient', 'sale' => 'Prescription'],
            'repairs'     => ['item' => 'Spare Part', 'customer' => 'Client', 'order' => 'Repair Job'],
            'clothing'    => ['item' => 'Garment / Article', 'customer' => 'Customer', 'sale' => 'Sale'],
            'restaurant', 'bakery' => ['item' => 'Menu Item', 'customer' => 'Guest', 'order' => 'KOT / Table Order'],
            'salon'       => ['item' => 'Service', 'customer' => 'Client', 'sale' => 'Appointment'],
            'wholesale'   => ['item' => 'Product', 'customer' => 'Buyer / Reseller', 'sale' => 'Sales Order'],
            'electronics' => ['item' => 'Device / Unit', 'customer' => 'Customer', 'sale' => 'Invoice'],
            'grocery'     => ['item' => 'Product', 'customer' => 'Customer', 'sale' => 'Sale'],
            default       => ['item' => 'Product', 'customer' => 'Customer', 'sale' => 'Invoice'],
        };
    }
}
