<?php

namespace App\Exceptions;

/**
 * An amount that cannot be represented or is not allowed by the sale
 * calculation contract (malformed, too precise, negative, excessive discount,
 * overflow). `errorCode` is stable and shared with the JS twin (MoneyError).
 */
class MoneyException extends \InvalidArgumentException
{
    public function __construct(string $message, public readonly string $errorCode = 'invalid_amount')
    {
        parent::__construct($message);
    }
}
