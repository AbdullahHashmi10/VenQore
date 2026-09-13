<?php

namespace App\Exceptions\SmartCapture;

/**
 * Thrown when the AI provider rejects a request because the key's rate limit or
 * daily quota is exhausted (HTTP 429).
 *
 * This exception must NEVER be answered by immediately re-sending the request to
 * another model — that behaviour is what burned through the free-tier quota.
 * The caller surfaces it to the user with a retry countdown instead.
 */
class AiRateLimitException extends \Exception
{
    public function __construct(
        string $message,
        public readonly int $retryAfterSeconds = 30,
        public readonly bool $dailyQuotaExhausted = false,
    ) {
        parent::__construct($message);
    }
}
