<?php

namespace App\Reckoner\Resolvers;

final class LoansByLenderResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loans.by_lender';
    }
}
