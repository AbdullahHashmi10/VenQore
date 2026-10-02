<?php

namespace App\Services\InvoiceAssistant\Speech;

/**
 * Normalized transcription outcome. No confidence score is invented: the
 * providers used here do not expose one, so none is reported.
 */
final class TranscriptionResult
{
    public function __construct(
        public readonly string $text,
        public readonly string $provider,
        public readonly string $model,
        public readonly ?string $language = null,
        public readonly ?float $durationSeconds = null,
        public readonly float $costUsd = 0.0,        // 0.0 = provider reported none
        public readonly int $latencyMs = 0,
        public readonly int $promptTokens = 0,
        public readonly int $outputTokens = 0,
        public readonly array $warnings = [],
    ) {}
}
