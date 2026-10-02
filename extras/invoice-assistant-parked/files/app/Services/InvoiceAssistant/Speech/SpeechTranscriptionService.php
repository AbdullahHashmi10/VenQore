<?php

namespace App\Services\InvoiceAssistant\Speech;

use App\Models\Tenant;
use App\Models\User;
use App\Services\Ai\AiGateway;
use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\Ai\AiUsageRecorder;
use App\Services\Ai\Providers\GeminiTranscriber;
use App\Services\Ai\Providers\KeyResolver;
use App\Services\Ai\Providers\OpenAiTranscriber;
use App\Services\InvoiceAssistant\InvoiceAssistantException;
use App\Services\InvoiceAssistant\InvoiceAssistantTelemetry;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Authenticated audio -> editable transcript. Never creates a draft by itself:
 * the operator reviews and edits the text, then explicitly sends it through the
 * same text endpoint as typed input.
 *
 * Order matters and is deliberate:
 *   1. replay protection (same request id + same bytes returns the earlier text)
 *   2. byte inspection and size limits — BEFORE any provider is contacted
 *   3. AiGateway::meter(): entitlement, rate limit, spend reservation
 *   4. provider call; exactly ONE usage record, cost never null/zero-by-accident
 *   5. temp file deleted in `finally`
 */
class SpeechTranscriptionService
{
    public const FEATURE = 'invoice_transcription';

    public function __construct(
        private AiGateway $gateway,
        private KeyResolver $keys,
        private AiUsageRecorder $usage,
        private AudioInspector $inspector,
    ) {}

    public function transcribe(User $user, Tenant $tenant, UploadedFile $upload, string $locale, string $requestId): array
    {
        $locale = in_array($locale, (array) config('invoice_assistant.speech.locales'), true) ? $locale : 'auto';
        $bytesHash = (string) @hash_file('sha256', $upload->getRealPath());
        $hash = $bytesHash . '|' . $locale;
        $replayKey = "inv-assist:tx:{$tenant->id}:{$user->id}:{$requestId}";

        try {
            return Cache::lock($replayKey . ':lock', 60)->block(35, function () use ($user, $tenant, $upload, $locale, $requestId, $hash, $replayKey) {
                $prev = Cache::get($replayKey);
                if (is_array($prev)) {
                    if (($prev['hash'] ?? null) !== $hash) {
                        throw new InvoiceAssistantException(409, 'conflicting_replay', 'That request id was already used for a different recording.');
                    }
                    InvoiceAssistantTelemetry::event('duplicate_recovered', ['request_id' => $requestId, 'stage' => 'transcription']);

                    return $prev['result'];
                }

                $result = $this->run($user, $tenant, $upload, $locale, $requestId);
                Cache::put($replayKey, ['hash' => $hash, 'result' => $result],
                    now()->addMinutes((int) config('invoice_assistant.speech.replay_ttl_minutes', 10)));

                return $result;
            });
        } catch (LockTimeoutException) {
            throw new InvoiceAssistantException(409, 'request_in_progress', 'That recording is already being transcribed.', true);
        }
    }

    private function run(User $user, Tenant $tenant, UploadedFile $upload, string $locale, string $requestId): array
    {
        $tmp = null;
        try {
            // 1. Inspect the bytes in a private temp path BEFORE anything leaves the server.
            $tmp = $this->stash($upload);
            try {
                $audio = $this->inspector->inspect($tmp, $upload->getClientMimeType());
            } catch (SpeechException $e) {
                InvoiceAssistantTelemetry::event('transcription_failed', ['request_id' => $requestId, 'tenant_id' => $tenant->id, 'user_id' => $user->id, 'reason' => $e->errorCode]);
                throw new InvoiceAssistantException($e->httpStatus, $e->errorCode, $e->getMessage(), $e->retryable);
            }

            InvoiceAssistantTelemetry::event('transcription_started', ['request_id' => $requestId, 'tenant_id' => $tenant->id, 'user_id' => $user->id, 'bytes' => $audio->bytes]);

            // 2. Admission + provider call through the metering seam.
            $aiRequest = AiRequest::for(self::FEATURE)->tenant($tenant)->user($user);
            $captured = null;
            try {
                $metered = $this->gateway->meter($aiRequest, function (AiRequest $req) use ($audio, $locale, $tenant, $user, &$captured) {
                    return $this->callProvider($req, $audio, $locale, $tenant, $user, $captured);
                });
            } catch (SpeechException $e) {
                // Upstream may have been billed; meter() left the estimate standing.
                $this->recordFailure($tenant, $user, $e->errorCode);
                InvoiceAssistantTelemetry::event('transcription_failed', ['request_id' => $requestId, 'tenant_id' => $tenant->id, 'user_id' => $user->id, 'reason' => $e->errorCode]);
                throw new InvoiceAssistantException($e->httpStatus, $e->errorCode, $e->getMessage(), $e->retryable);
            }

            if (!$metered->ok) {
                InvoiceAssistantTelemetry::event('transcription_failed', ['request_id' => $requestId, 'tenant_id' => $tenant->id, 'user_id' => $user->id, 'reason' => $metered->failureCode]);
                throw $this->mapGatewayFailure($metered);
            }

            /** @var TranscriptionResult $tr */
            $tr = $metered->value;
            $text = trim($tr->text);
            if ($text === '' || $text === GeminiTranscriber::NO_SPEECH || stripos($text, '[NO_SPEECH]') !== false) {
                InvoiceAssistantTelemetry::event('transcription_failed', ['request_id' => $requestId, 'tenant_id' => $tenant->id, 'user_id' => $user->id, 'reason' => 'no_speech']);
                throw new InvoiceAssistantException(422, 'no_speech', 'I could not hear any speech. Record again closer to the microphone, or type the request.');
            }

            $text = $this->sanitize($text);
            InvoiceAssistantTelemetry::event('transcription_completed', [
                'request_id' => $requestId, 'tenant_id' => $tenant->id, 'user_id' => $user->id,
                'provider' => $tr->provider, 'model' => $tr->model, 'cost_usd' => $metered->costUsd,
                'duration_ms' => $tr->latencyMs, 'bytes' => $audio->bytes, 'duration_s' => $tr->durationSeconds,
            ]);

            return [
                'text'              => $text,
                'detected_language' => $tr->language,
                'warnings'          => $tr->warnings ?: ['Check item codes (SKUs) and names before you use this.'],
                'request_id'        => $requestId,
            ];
        } finally {
            if ($tmp && is_file($tmp)) {
                @unlink($tmp);
            }
        }
    }

    /** Runs inside AiGateway::meter(); records usage EXACTLY once. */
    private function callProvider(AiRequest $req, AudioInput $audio, string $locale, Tenant $tenant, User $user, &$captured): AiResult
    {
        $keyConfig = $this->keys->resolve($tenant, self::FEATURE, $req->entitlementMode);
        if (empty($keyConfig['api_key'])) {
            return AiResult::failure('no_key', 'Voice input is not configured for this store.');
        }

        $provider = match (strtolower((string) ($keyConfig['provider'] ?? 'gemini'))) {
            'gemini' => app(GeminiTranscriber::class),
            'openai' => app(OpenAiTranscriber::class),
            default  => null,
        };
        if (!$provider) {
            return AiResult::failure('speech_provider_unsupported', 'The configured AI provider cannot transcribe audio.');
        }

        $tr = $provider->transcribe($audio, $locale, $keyConfig);

        // Never record a billed call with a null model or a silent zero cost.
        $cost = $tr->costUsd;
        if ($cost <= 0) {
            $seconds = $tr->durationSeconds ?? (float) config('invoice_assistant.speech.max_seconds', 60);
            $cost = round($seconds / 60 * (float) config('invoice_assistant.speech.fallback_cost_per_minute', 0.01), 8);
        }

        $this->usage->record([
            'tenant_id'           => $tenant->id,
            'user_id'             => $user->id,
            'feature'             => self::FEATURE,
            'provider'            => $tr->provider,
            'model'               => $tr->model ?: 'unknown-transcription-model',
            'key_mode'            => $keyConfig['key_mode'] ?? 'platform_paid',
            'input_type'          => 'audio',
            'pages'               => 1,
            'prompt_tokens'       => $tr->promptTokens,
            'output_tokens'       => $tr->outputTokens,
            'cost_usd_override'   => $cost,
            'latency_ms'          => $tr->latencyMs,
            'success'             => true,
        ]);

        $captured = $tr;

        return AiResult::success($tr, 'model', $tr->model, $tr->provider, 1.0, $cost, $tr->latencyMs);
    }

    private function recordFailure(Tenant $tenant, User $user, string $code): void
    {
        $this->usage->record([
            'tenant_id' => $tenant->id, 'user_id' => $user->id, 'feature' => self::FEATURE,
            'provider' => 'gemini', 'model' => (string) config('ai_models.invoice_transcription.model', 'gemini-2.5-flash'),
            'input_type' => 'audio', 'success' => false, 'error_code' => substr($code, 0, 64),
            'cost_usd_override' => 0.0,
        ]);
    }

    private function mapGatewayFailure(AiResult $r): InvoiceAssistantException
    {
        $code = (string) $r->failureCode;

        return match (true) {
            $code === 'rate_limited' => new InvoiceAssistantException(429, 'rate_limited', 'Too many recordings right now. Wait a moment and try again.', true),
            $code === 'spend_capped' => new InvoiceAssistantException(429, 'spend_capped', $r->errorMessage ?: 'The AI budget for today has been reached. Type the request instead.', false),
            in_array($code, ['no_addon', 'limit_reached', 'free_limit_reached', 'no_tenant', 'not_allowed', 'plan_locked'], true)
                => new InvoiceAssistantException(402, 'ai_not_available', $r->errorMessage ?: 'AI is not available on this plan or the allowance is used up.', false),
            $code === 'speech_provider_unsupported' => new InvoiceAssistantException(503, 'speech_unavailable', $r->errorMessage ?: 'Voice input is not available.', false),
            default => new InvoiceAssistantException(503, 'assistant_unavailable', $r->errorMessage ?: 'Voice input is temporarily unavailable. Type the request instead.', true),
        };
    }

    /** Move the upload to a generated private path (never the client's name). */
    private function stash(UploadedFile $upload): string
    {
        $dir = storage_path(trim((string) config('invoice_assistant.speech.tmp_dir', 'app/private/invoice-assistant-tmp'), '/'));
        if (!is_dir($dir)) {
            File::makeDirectory($dir, 0700, true);
        }
        $path = $dir . DIRECTORY_SEPARATOR . Str::uuid()->toString() . '.bin';
        if (!@copy($upload->getRealPath(), $path)) {
            throw new InvoiceAssistantException(500, 'upload_failed', 'The recording could not be processed. Please record again.', true);
        }
        @chmod($path, 0600);

        return $path;
    }

    /** Transcript text is untrusted: strip control characters and bound it. */
    private function sanitize(string $t): string
    {
        $t = preg_replace('/[^\P{C}\n]+/u', ' ', $t) ?? $t;

        return mb_substr(trim($t), 0, (int) config('invoice_assistant.max_input_chars', 4000));
    }

    /** Crash leftovers: delete temp recordings older than the configured TTL. */
    public static function sweepTemp(): int
    {
        $dir = storage_path(trim((string) config('invoice_assistant.speech.tmp_dir', 'app/private/invoice-assistant-tmp'), '/'));
        if (!is_dir($dir)) {
            return 0;
        }
        $cut = time() - 60 * (int) config('invoice_assistant.speech.tmp_ttl_minutes', 15);
        $n = 0;
        foreach (File::files($dir) as $f) {
            if ($f->getMTime() < $cut) {
                @unlink($f->getPathname());
                $n++;
            }
        }

        return $n;
    }
}
