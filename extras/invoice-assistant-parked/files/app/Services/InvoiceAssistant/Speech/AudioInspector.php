<?php

namespace App\Services\InvoiceAssistant\Speech;

/**
 * Looks at the FILE BYTES, not the filename or the declared type, to decide
 * which container a recording really is. Anything that is not a supported
 * audio container (an executable renamed .webm, an HTML page, text) is refused
 * before any byte is forwarded to a provider.
 *
 * Duration: without ffprobe the only container whose length is checked
 * exactly is WAV. For the others the hard BYTE cap is authoritative (the
 * client-reported duration is never trusted) and the provider enforces its own
 * limits.
 */
class AudioInspector
{
    private const MIME = [
        'webm' => 'audio/webm',
        'ogg'  => 'audio/ogg',
        'mp4'  => 'audio/mp4',
        'wav'  => 'audio/wav',
        'mp3'  => 'audio/mpeg',
    ];

    /** Declared types browsers legitimately send for MediaRecorder audio. */
    private const DECLARED_OK = '#^(audio/[\w.+-]+|video/webm|video/mp4|application/octet-stream)(;.*)?$#i';

    public static function kindOf(string $head): ?string
    {
        if (strlen($head) < 12) {
            return null;
        }
        if (str_starts_with($head, "\x1A\x45\xDF\xA3")) {
            return 'webm';
        }
        if (str_starts_with($head, 'OggS')) {
            return 'ogg';
        }
        if (substr($head, 4, 4) === 'ftyp') {
            return 'mp4';
        }
        if (str_starts_with($head, 'RIFF') && substr($head, 8, 4) === 'WAVE') {
            return 'wav';
        }
        if (str_starts_with($head, 'ID3') || (ord($head[0]) === 0xFF && (ord($head[1]) & 0xE0) === 0xE0)) {
            return 'mp3';
        }

        return null;
    }

    /**
     * @throws SpeechException
     */
    public function inspect(string $path, ?string $declaredMime): AudioInput
    {
        $max = (int) config('invoice_assistant.speech.max_bytes', 10 * 1024 * 1024);
        $size = @filesize($path);
        if ($size === false || $size < 200) {
            throw new SpeechException(422, 'empty_audio', 'The recording was empty. Record again and speak after the microphone starts.');
        }
        if ($size > $max) {
            throw new SpeechException(413, 'audio_too_large', 'That recording is too large. Keep it under 60 seconds.');
        }
        if ($declaredMime !== null && $declaredMime !== '' && !preg_match(self::DECLARED_OK, $declaredMime)) {
            throw new SpeechException(415, 'unsupported_audio_type', 'That file is not an audio recording.');
        }

        $fh = @fopen($path, 'rb');
        $head = $fh ? (string) fread($fh, 16) : '';
        if ($fh) {
            fclose($fh);
        }

        $kind = self::kindOf($head);
        $allowed = (array) config('invoice_assistant.speech.allowed_kinds', array_keys(self::MIME));
        if ($kind === null || !in_array($kind, $allowed, true)) {
            throw new SpeechException(415, 'unsupported_audio_type', 'That recording is not a supported audio format. Type the request instead.');
        }

        $seconds = $kind === 'wav' ? $this->wavSeconds($path) : null;
        $limit = (int) config('invoice_assistant.speech.max_seconds', 60);
        if ($seconds !== null && $seconds > $limit + 2) {
            throw new SpeechException(413, 'audio_too_long', "Recordings are limited to {$limit} seconds.");
        }

        return new AudioInput($path, $kind, self::MIME[$kind], (int) $size, $seconds);
    }

    private function wavSeconds(string $path): ?float
    {
        $fh = @fopen($path, 'rb');
        if (!$fh) {
            return null;
        }
        $hdr = (string) fread($fh, 44);
        fclose($fh);
        if (strlen($hdr) < 44) {
            return null;
        }
        $byteRate = unpack('V', substr($hdr, 28, 4))[1] ?? 0;
        if ($byteRate <= 0) {
            return null;
        }
        $size = (int) @filesize($path);

        return round(max(0, $size - 44) / $byteRate, 2);
    }
}
