<?php

namespace App\Services\InvoiceAssistant\Speech;

/**
 * A validated recording sitting in a private temporary path. The CONTAINER
 * KIND comes from inspecting the bytes, never from the client's declared type.
 */
final class AudioInput
{
    public function __construct(
        public readonly string $path,
        public readonly string $kind,    // webm | ogg | mp4 | wav | mp3
        public readonly string $mime,    // provider-facing mime for that kind
        public readonly int $bytes,
        public readonly ?float $durationSeconds = null,
    ) {}

    public function extension(): string
    {
        return match ($this->kind) {
            'webm' => 'webm', 'ogg' => 'ogg', 'mp4' => 'm4a', 'wav' => 'wav', default => 'mp3',
        };
    }

    public function contents(): string
    {
        $data = @file_get_contents($this->path);
        if ($data === false) {
            throw new SpeechException(500, 'audio_unreadable', 'The recording could not be read. Please record again.');
        }

        return $data;
    }
}
