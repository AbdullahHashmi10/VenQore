<?php

namespace App\Services\InvoiceAssistant\Speech;

/**
 * One transcription provider. Implementations live in
 * App\Services\Ai\Providers (the only directory allowed to hold a provider
 * URL) and throw SpeechException for every failure.
 */
interface SpeechProviderContract
{
    /**
     * @param array $keyConfig output of KeyResolver::resolve()
     * @param string $locale   'auto' | 'en' | 'ur' (a hint, not a guarantee)
     * @throws SpeechException
     */
    public function transcribe(AudioInput $audio, string $locale, array $keyConfig): TranscriptionResult;
}
