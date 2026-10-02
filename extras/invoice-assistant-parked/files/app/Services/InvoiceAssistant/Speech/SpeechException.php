<?php

namespace App\Services\InvoiceAssistant\Speech;

use RuntimeException;

/** A transcription failure with the HTTP status and stable code the API documents. */
class SpeechException extends RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly string $errorCode,
        string $message,
        public readonly bool $retryable = false,
    ) {
        parent::__construct($message);
    }
}
