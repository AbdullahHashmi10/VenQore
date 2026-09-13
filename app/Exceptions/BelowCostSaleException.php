<?php

namespace App\Exceptions;

class BelowCostSaleException extends \RuntimeException
{
    public function __construct(
        public readonly string $productId,
        public readonly float  $unitPrice,
        public readonly float  $batchCost
    ) {
        parent::__construct(
            "Sale price Rs. {$unitPrice} is below FIFO cost Rs. {$batchCost} " .
            "for product {$productId}. Manager approval (approved_by) is required (S-011)."
        );
    }
}
