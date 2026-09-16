<?php

namespace App\Reckoner\Resolvers;

final class AccountingLiabilitiesTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.liabilities_total';
    }
}
