<?php

namespace App\Services\Commerce;

class CommerceException extends \RuntimeException
{
    public function __construct(string $message, public readonly string $reason = 'invalid', public readonly array $payload = [], public readonly int $httpStatus = 422)
    {
        parent::__construct($message);
    }
}
