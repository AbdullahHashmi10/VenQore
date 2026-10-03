<?php

namespace App\Exceptions;

/** Stock physically exists but is reserved for accepted online orders. Still an InsufficientStockException for every existing catch. */
class ReservedStockException extends InsufficientStockException
{
    public function __construct(int|string $productId, int|string $warehouseId, float $requested, float $available, public readonly array $orderNumbers = [])
    {
        parent::__construct($productId, $warehouseId, $requested, $available);
        $this->message = 'Only ' . rtrim(rtrim(number_format($available, 4, '.', ''), '0'), '.') . ' can be sold: the rest is reserved for online order(s) '
            . ($orderNumbers ? implode(', ', $orderNumbers) : '') . '. Complete or cancel that order to free it.';
    }
}
