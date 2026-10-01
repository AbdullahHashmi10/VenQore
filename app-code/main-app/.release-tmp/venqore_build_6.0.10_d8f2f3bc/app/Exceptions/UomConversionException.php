<?php

namespace App\Exceptions;

class UomConversionException extends \RuntimeException
{
    public function __construct(
        public readonly string $productId,
        public readonly string $saleUom
    ) {
        parent::__construct(
            "No UOM conversion defined for product {$productId} " .
            "from sale UOM '{$saleUom}'. " .
            "Add a row to product_uom_conversions before selling in this unit."
        );
    }
}
