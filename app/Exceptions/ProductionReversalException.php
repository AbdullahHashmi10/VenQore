<?php

namespace App\Exceptions;

class ProductionReversalException extends \RuntimeException
{
    public function __construct(
        public readonly string $runId,
        public readonly float  $requested,
        public readonly float  $reversible
    ) {
        parent::__construct(
            "Cannot reverse {$requested} units from production run {$runId}. " .
            "Only {$reversible} unsold units are reversible. " .
            "Sold units are permanently locked per S-015."
        );
    }
}
