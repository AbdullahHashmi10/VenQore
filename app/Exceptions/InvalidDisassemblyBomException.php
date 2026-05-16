<?php

namespace App\Exceptions;

class InvalidDisassemblyBomException extends \RuntimeException
{
    public function __construct(string $productId, float $total)
    {
        parent::__construct(
            "Disassembly BOM for product {$productId} has allocation percentages " .
            "summing to {$total}% — must be exactly 100%. " .
            "Fix the disassembly BOM before running disassembly."
        );
    }
}
