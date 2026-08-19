<?php

namespace App\Services\AiBuilder;

use App\Models\Tenant;
use App\Services\Ai\AiRateLimiter;
use App\Services\Ai\AiSpendGuard;
use App\Services\Ai\AiUsageRecorder;
use App\Services\PlanRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/*
|==============================================================================
| STEP 12 — ConfigurationAIService
|==============================================================================
|
| The only class in the system that talks to a model.
|
| ITS ENTIRE JOB: text -> a JSON list of module keys that already exist.
| It is a translator, not an authority. Everything it returns goes straight
| into ConfigurationValidator, which assumes it is hostile.
|
|------------------------------------------------------------------------------
| THE GUARDS ARE WIRED FROM THE FIRST CALL, NOT "LATER"
|------------------------------------------------------------------------------
| AiRateLimiter, AiSpendGuard and AiUsageRecorder already exist in
| app/Services/Ai/. They are called here in that order, before and after every
| request. "We'll add metering once it works" is how a lifetime-deal product
| discovers a curious buyer re-ran the builder four hundred times.
|
| THE RULE THAT MATTERS MOST: hitting a limit NEVER blocks configuration. It
| removes the AI convenience and nothing else. Manual toggling and preset
| switching stay unlimited and free forever — a buyer who exhausts their
| allowance still has a fully working ERP, they just pick from a list.
|
|------------------------------------------------------------------------------
| THE PROMPT IS BUILT FROM config/modules.php, NEVER HAND-WRITTEN
|------------------------------------------------------------------------------
| The moment the prompt is a separate maintained string it drifts from the
| registry — and a drifted prompt is exactly how an AI starts promising
| features that do not exist. Only `live` modules go in, which is what makes
| the "never propose unfinished work" rule nearly self-enforcing.
|==============================================================================
*/
class ConfigurationAIService
{
    public function __construct(
        private ConfigurationValidator $validator,
        private AiRateLimiter $limiter,
        private AiSpendGuard $spend,
        private AiUsageRecorder $usage,
    ) {
    }

    /**
     * Discovery answers -> a validated, ready-to-show proposal.
     *
     * NEVER THROWS. Every failure path returns a proposal with ok=false, which
     * the controller renders as the preset picker. An exception here would be a
     * white screen during the first ninety seconds of somebody's relationship
     * with the product.
     */
    public function propose(Tenant $tenant, array $answers): array
    {
        $scope = "ai_builder:{$tenant->id}";

        // ── GUARD 1: rate limit ──────────────────────────────────────────────
        $allowance = $this->allowanceFor($tenant, 'onboarding_builds');
        $bucket = $this->limiter->tryAcquire($scope, 1);

        if (($bucket['allowed'] ?? true) === false) {
            return $this->fallback($tenant, 'rate_limited', $answers);
        }

        // ── GUARD 2: spend cap ───────────────────────────────────────────────
        // Estimated before the call, reconciled after. Estimating high is
        // deliberate: the failure mode of over-estimating is one fewer AI build
        // this month; the failure mode of under-estimating is an unbounded bill.
        $estimate = 0.02;

        if (!$this->spend->checkAndRecord($scope, $estimate, $this->spendCapFor($tenant))) {
            return $this->fallback($tenant, 'spend_capped', $answers);
        }

        // ── GUARD 3: lifetime build count ────────────────────────────────────
        if ($this->buildsUsed($tenant) >= $allowance) {
            return $this->fallback($tenant, 'allowance_exhausted', $answers);
        }

        try {
            $started = microtime(true);

            $response = $this->call(
                system: $this->systemPrompt(),
                user: $this->userPrompt($answers),
            );

            $proposal = $this->validator->validate($response['content'] ?? null, $tenant);

            // ── RECORD what it actually cost, and reconcile the estimate ─────
            $actual = $this->usage->calculateCost(
                $response['model'] ?? config('ai_models.default', 'unknown'),
                $response['prompt_tokens'] ?? 0,
                $response['output_tokens'] ?? 0,
            );

            $this->usage->record([
                'tenant_id'     => $tenant->id,
                'scope'         => $scope,
                'model'         => $response['model'] ?? null,
                'prompt_tokens' => $response['prompt_tokens'] ?? 0,
                'output_tokens' => $response['output_tokens'] ?? 0,
                'cost_usd'      => $actual,
                'duration_ms'   => (int) ((microtime(true) - $started) * 1000),
                'success'       => $proposal['ok'],
            ]);

            $this->spend->reconcile($scope, $estimate, $actual);

            if (!$proposal['ok']) {
                return $this->fallback($tenant, 'invalid_response', $answers, $proposal['fallback_reason']);
            }

            // Low confidence is not a failure — it is the model being honest.
            // Show the picker with its best guess highlighted rather than
            // presenting a shrug as a recommendation.
            if ($proposal['confidence'] < config('ai_builder.confidence_floor', 0.55)) {
                return $this->fallback($tenant, 'low_confidence', $answers, null, $proposal['preset']);
            }

            $this->countBuild($tenant);
            $this->logUnsupported($tenant, $proposal['unsupported']);

            $proposal['source'] = 'ai';

            return $proposal;

        } catch (\Throwable $e) {
            // Timeouts, API outages, malformed transport — all the same to a
            // customer standing in front of an onboarding screen.
            Log::warning('AI builder call failed, falling back to preset picker', [
                'tenant_id' => $tenant->id,
                'error'     => $e->getMessage(),
            ]);

            $this->spend->reconcile($scope, $estimate, 0.0);

            return $this->fallback($tenant, 'exception', $answers);
        }
    }

    /**
     * THE FALLBACK. Not an error — a different, equally good path.
     *
     * The deterministic signals from questions 2-6 pick a sensible preset
     * WITHOUT a model call, which is why those questions exist at all.
     */
    public function fallback(
        Tenant $tenant,
        string $reason,
        array $answers = [],
        ?string $detail = null,
        ?string $suggested = null
    ): array {
        Log::info('AI builder fallback', ['tenant_id' => $tenant->id, 'reason' => $reason, 'detail' => $detail]);

        return [
            'ok'              => false,
            'source'          => 'preset_picker',
            'modules'         => [],
            'terminology'     => [],
            'dashboard'       => [],
            'added'           => [],
            'questions'       => [],
            'suggestions'     => [],
            'coming_soon'     => [],
            'reasoning'       => '',
            'unsupported'     => [],
            'confidence'      => 0.0,
            'preset'          => $suggested ?: $this->guessPreset($answers),
            'fallback_reason' => $reason,
            'message'         => config(
                'ai_builder.messages.ai_down',
                "Let's pick from a template instead — it takes about the same time and you can change anything afterwards."
            ),
        ];
    }

    /**
     * Deterministic preset guess from the five fixed questions. No model, no
     * cost, no network. Good enough that a customer who never sees the AI still
     * gets a system that fits.
     */
    public function guessPreset(array $answers): ?string
    {
        $text = strtolower(($answers['what'] ?? '').' '.implode(' ', array_map('strval', $answers)));

        // Alias matching, best score wins. The aliases in config/modules.php are
        // doing the work here — which is why they are the highest-return field
        // in that file.
        $scores = [];

        foreach (config('ai_builder.presets', []) as $key => $preset) {
            if (!empty($preset['blocked_by'])) {
                continue;
            }

            $score = 0;

            foreach ($preset['modules'] as $moduleKey) {
                foreach (config("modules.{$moduleKey}.aliases", []) as $alias) {
                    if (str_contains($text, strtolower($alias))) {
                        $score++;
                    }
                }
            }

            if (str_contains($text, strtolower($preset['label']))) {
                $score += 5;
            }

            $scores[$key] = $score;
        }

        arsort($scores);
        $best = array_key_first($scores);

        return ($scores[$best] ?? 0) > 0 ? $best : 'retail_shop';
    }

    /**
     * Built from the registry and cached. Only `live` modules are included, so
     * the model is never even told that unfinished work exists.
     */
    public function systemPrompt(): string
    {
        return Cache::remember(
            config('ai_builder.prompt.cache_key', 'ai_builder:system_prompt:v1'),
            config('ai_builder.prompt.cache_ttl_seconds', 3600),
            function () {
                $lines = [config('ai_builder.prompt.preamble'), '', 'MODULES:'];

                foreach (config('modules', []) as $key => $module) {
                    if (!in_array($module['status'], config('ai_builder.prompt.include_statuses', ['live']), true)) {
                        continue;
                    }

                    $line = "- {$key}: {$module['label']} — {$module['description']}";
                    $line .= ' Also called: '.implode(', ', $module['aliases']).'.';

                    if ($module['requires']) {
                        $line .= ' Needs: '.implode(', ', $module['requires']).'.';
                    }

                    foreach ($module['requires_one'] as $set) {
                        $line .= ' Needs one of: '.implode(' or ', $set).'.';
                    }

                    $lines[] = $line;
                }

                $lines[] = '';
                $lines[] = 'PRESETS: '.implode(', ', array_keys(array_filter(
                    config('ai_builder.presets', []),
                    fn ($p) => empty($p['blocked_by'])
                )));
                $lines[] = '';
                $lines[] = config('ai_builder.prompt.reminder');

                return implode("\n", $lines);
            }
        );
    }

    private function userPrompt(array $answers): string
    {
        $lines = [];

        foreach (config('ai_builder.discovery', []) as $question) {
            $key = $question['key'];

            if (!isset($answers[$key])) {
                continue;
            }

            $lines[] = $question['question'].' '.(is_array($answers[$key]) ? implode(', ', $answers[$key]) : $answers[$key]);
        }

        return implode("\n", $lines);
    }

    /**
     * The transport. Deliberately the smallest surface in the file, and mocked
     * wholesale in CI — config('ai_builder.limits.mock_in_ci') must never be
     * false in a test run, or a green build costs money.
     *
     * Wired to Gemini via the same generateContent endpoint SmartCapture's
     * AiExtractionService already uses, deliberately kept independent of that
     * class (different key: the builder always uses the platform's own key —
     * this pipeline runs during onboarding, before a tenant exists to own a
     * BYOK setting or an entitlement mode).
     *
     * @return array{content: ?string, model: string, prompt_tokens: int, output_tokens: int}
     */
    protected function call(string $system, string $user): array
    {
        if (app()->environment('testing') || config('ai_builder.limits.mock_in_ci', true) && app()->runningUnitTests()) {
            throw new \RuntimeException('AI transport must be mocked in tests. Bind a fake ConfigurationAIService.');
        }

        $apiKey = config('smartcapture.gemini_key') ?: config('smartcapture.api_key');

        if (empty($apiKey)) {
            throw new \RuntimeException('No platform Gemini key configured (GEMINI_API_KEY / SMART_CAPTURE_API_KEY).');
        }

        $model = config('ai_builder.prompt.model', 'gemini-2.0-flash');

        $response = Http::timeout((int) config('ai_builder.limits.request_timeout_seconds', 20))
            ->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'contents'         => [['role' => 'user', 'parts' => [['text' => $user]]]],
                    'systemInstruction' => ['parts' => [['text' => $system]]],
                    'generationConfig' => [
                        'temperature'      => 0.2,
                        'responseMimeType' => 'application/json',
                    ],
                ]
            );

        if ($response->failed()) {
            throw new \RuntimeException(
                "Gemini request failed ({$response->status()}): ".$response->body()
            );
        }

        $json = $response->json();

        if (empty($json['candidates'])) {
            $blockReason = $json['promptFeedback']['blockReason'] ?? 'unknown';
            throw new \RuntimeException("Gemini returned no candidates (reason: {$blockReason}).");
        }

        $text = collect($json['candidates'][0]['content']['parts'] ?? [])
            ->pluck('text')
            ->filter()
            ->implode('');

        return [
            'content'       => $text !== '' ? $text : null,
            'model'         => $model,
            'prompt_tokens' => (int) ($json['usageMetadata']['promptTokenCount'] ?? 0),
            'output_tokens' => (int) ($json['usageMetadata']['candidatesTokenCount'] ?? 0),
        ];
    }

    // ---------------------------------------------------------------- limits

    private function allowanceFor(Tenant $tenant, string $key): int
    {
        $tier = PlanRepository::normalizePlanSlug($tenant->plan ?? 'solo');
        $limits = config("ai_builder.limits.{$key}", []);

        return (int) ($limits[$tier] ?? $limits['solo'] ?? 3);
    }

    private function spendCapFor(Tenant $tenant): float
    {
        return (float) config('ai_builder.limits.spend_cap_usd', 3.00);
    }

    private function buildsUsed(Tenant $tenant): int
    {
        return (int) Cache::get("ai_builds_used:{$tenant->id}", 0);
    }

    private function countBuild(Tenant $tenant): void
    {
        Cache::increment("ai_builds_used:{$tenant->id}");
        Cache::put("ai_builds_used:{$tenant->id}", $this->buildsUsed($tenant), now()->addYears(5));
    }

    /**
     * THE DEMAND LOG. Every entry is a named, paying customer who asked for a
     * feature in their own words. It is your roadmap ranked by real demand and
     * your warm launch list for whatever you build next — worth more than it
     * looks, and only if you actually read it.
     */
    private function logUnsupported(Tenant $tenant, array $unsupported): void
    {
        foreach ($unsupported as $request) {
            try {
                \Illuminate\Support\Facades\DB::table(config('ai_builder.demand_log.table', 'feature_requests'))->insert([
                    'tenant_id'  => $tenant->id,
                    'source'     => 'ai_unsupported',
                    'raw_text'   => $request,
                    'normalised' => strtolower(trim($request)),
                    'created_at' => now(),
                ]);
            } catch (\Throwable) {
                // Never let the roadmap break the onboarding.
            }
        }
    }
}
