<?php

namespace App\Reckoner\Resolvers;

final class LoansCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loans.count';
    }
}
