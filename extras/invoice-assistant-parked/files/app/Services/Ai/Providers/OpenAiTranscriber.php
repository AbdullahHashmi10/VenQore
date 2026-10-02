<?php

namespace App\Services\Ai\Providers;

use App\Services\InvoiceAssistant\Speech\AudioInput;
use App\Services\InvoiceAssistant\Speech\SpeechException;
use App\Services\InvoiceAssistant\Speech\SpeechProviderContract;
use App\Services\InvoiceAssistant\Speech\TranscriptionResult;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Speech-to-text through OpenAI's transcription endpoint. Accepts the browsers'
 * native containers (webm/ogg/mp4/wav/mp3), so no server-side transcoding is
 * needed. The provider reports no cost, so the service applies its documented
 * conservative duration-based estimate.
 */
class OpenAiTranscriber implements SpeechProviderContract
{
    public function transcribe(AudioInput $audio, string $locale, array $keyConfig): TranscriptionResult
    {
        $apiKey = $keyConfig['api_key'] ?? '';
        $model = (string) config('invoice_assistant.speech.openai_model', 'gpt-4o-mini-transcribe');
        $timeout = (int) config('invoice_assistant.speech.timeout', 30);

        if ($apiKey === '') {
            throw new SpeechException(503, 'assistant_unavailable', 'Voice input is not configured for this store.');
        }

        $fields = [
            ['name' => 'model', 'contents' => $model],
            ['name' => 'response_format', 'contents' => 'json'],
            ['name' => 'temperature', 'contents' => '0'],
            ['name' => 'prompt', 'contents' => 'A shop operator dictating a sales invoice: customer names, item codes (SKUs), quantities. English, Urdu or Roman Urdu.'],
        ];
        if (in_array($locale, ['en', 'ur'], true)) {
            $fields[] = ['name' => 'language', 'contents' => $locale];
        }

        $t0 = microtime(true);
        try {
            $request = Http::connectTimeout(10)->timeout($timeout)->withToken($apiKey)
                ->attach('file', $audio->contents(), 'recording.' . $audio->extension(), ['Content-Type' => $audio->mime]);
            foreach ($fields as $f) {
                $request = $request->attach($f['name'], $f['contents']);
            }
            $response = $request->post('https://api.openai.com/v1/audio/transcriptions');
        } catch (ConnectionException) {
            throw new SpeechException(504, 'provider_timeout', 'Transcription took too long. Try a shorter recording.', true);
        }

        if ($response->failed()) {
            $status = $response->status();
            if (in_array($status, [400, 415], true)) {
                throw new SpeechException(415, 'unsupported_audio', 'That recording format could not be transcribed. Type the request instead.');
            }
            if ($status === 429) {
                throw new SpeechException(429, 'rate_limited', 'The transcription service is busy. Try again shortly.', true);
            }

            throw new SpeechException(502, 'provider_error', 'Transcription failed. Try again or type the request.', true);
        }

        return new TranscriptionResult(
            text: trim((string) $response->json('text', '')),
            provider: 'openai',
            model: $model,
            language: null,
            durationSeconds: $audio->durationSeconds,
            costUsd: 0.0,
            latencyMs: (int) round((microtime(true) - $t0) * 1000),
        );
    }
}
