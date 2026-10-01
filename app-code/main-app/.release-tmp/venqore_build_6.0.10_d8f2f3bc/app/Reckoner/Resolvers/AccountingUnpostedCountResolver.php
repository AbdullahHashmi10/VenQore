<?php

namespace App\Reckoner\Resolvers;

final class AccountingUnpostedCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.unposted_count';
    }
}
