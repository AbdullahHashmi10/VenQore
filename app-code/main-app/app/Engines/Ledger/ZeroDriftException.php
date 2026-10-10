<?php

namespace App\Engines\Ledger;

/**
 * Raised by the ZeroDrift Ledger when an entry may not enter the books.
 * Extends InvalidArgumentException so every existing caller that already
 * handled the ledger's refusals keeps working; `rule` names the rule broken.
 */
class ZeroDriftException extends \InvalidArgumentException
{
    public function __construct(string $message, public readonly string $rule)
    {
        parent::__construct("ZeroDrift Ledger [{$rule}]: {$message}");
    }
}
