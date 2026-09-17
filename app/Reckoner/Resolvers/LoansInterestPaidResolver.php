<?php

namespace App\Reckoner\Resolvers;

final class LoansInterestPaidResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loans.interest_paid';
    }
}
