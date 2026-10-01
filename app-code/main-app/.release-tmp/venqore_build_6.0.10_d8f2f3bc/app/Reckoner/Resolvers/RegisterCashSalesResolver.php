<?php

namespace App\Reckoner\Resolvers;

final class RegisterCashSalesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.cash_sales';
    }
}
