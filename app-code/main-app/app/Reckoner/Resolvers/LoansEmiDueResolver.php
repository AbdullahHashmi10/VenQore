<?php

namespace App\Reckoner\Resolvers;

final class LoansEmiDueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loans.emi_due';
    }
}
