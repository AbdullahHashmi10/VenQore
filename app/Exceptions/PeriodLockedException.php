<?php

namespace App\Exceptions;

use RuntimeException;

class PeriodLockedException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $entryDate,
        public readonly string $lockedThroughDate,
        public readonly ?string $fiscalYearName = null,
        public readonly ?string $lockType = 'soft'
    ) {
        parent::__construct($message);
    }
}
