<?php

namespace App\Exceptions;

class OverAllocationException extends \RuntimeException
{
    public function __construct(
        public readonly string|int $saleId,
        public readonly float      $invoiceTotal,
        public readonly float      $alreadyAllocated,
        public readonly float      $attemptedAmount
    ) {
        $wouldBe = $alreadyAllocated + $attemptedAmount;
        parent::__construct(
            "Over-allocation blocked for sale {$saleId}. " .
            "Invoice total: {$invoiceTotal}, Already allocated: {$alreadyAllocated}, " .
            "Attempted: {$attemptedAmount}, Would be: {$wouldBe}"
        );
    }
}
