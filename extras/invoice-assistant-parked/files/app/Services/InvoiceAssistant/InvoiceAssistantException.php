<?php

namespace App\Services\InvoiceAssistant;

use RuntimeException;

/**
 * A failure the controller turns into the documented
 * {code,message,field_errors?,retryable,request_id} body.
 */
class InvoiceAssistantException extends RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly string $errorCode,
        string $message,
        public readonly bool $retryable = false,
        public readonly array $fieldErrors = [],
        /** Fresh draft state to hand back with a 409, so the UI can re-render. */
        public readonly ?array $draft = null,
    ) {
        parent::__construct($message);
    }

    public static function notFound(): self
    {
        return new self(404, 'draft_not_found', 'That draft was not found.');
    }

    public static function expired(): self
    {
        return new self(410, 'draft_expired', 'This draft expired. Start again or enter the invoice manually.');
    }

    public static function stale(?array $draft = null): self
    {
        return new self(409, 'stale_revision', 'The draft changed while you were working. Review the latest version.', false, [], $draft);
    }

    public static function invalidState(string $status): self
    {
        return new self(409, 'invalid_state', "This draft is {$status} and cannot be changed that way.");
    }

    public static function disabled(): self
    {
        return new self(403, 'feature_disabled', 'The invoice assistant is not enabled for this store.');
    }

    public function toArray(string $requestId): array
    {
        return array_filter([
            'code'         => $this->errorCode,
            'message'      => $this->getMessage(),
            'field_errors' => $this->fieldErrors ?: null,
            'retryable'    => $this->retryable,
            'request_id'   => $requestId,
            'draft'        => $this->draft,
        ], fn ($v) => $v !== null);
    }
}
