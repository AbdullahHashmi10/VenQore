<?php

namespace App\Exceptions;

class InsufficientStockException extends \RuntimeException
{
    public function __construct(
        public readonly int|string $productId,
        public readonly int|string $warehouseId,
        public readonly float $requested,
        public readonly float $available
    ) {
        parent::__construct(
            "Insufficient stock for product {$productId} in warehouse {$warehouseId}. " .
            "Requested: {$requested}, Available: {$available}"
        );
    }
}
