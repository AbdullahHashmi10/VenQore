<?php

namespace App\Reckoner\Resolvers;

final class LoansOutstandingTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loans.outstanding_total';
    }
}
