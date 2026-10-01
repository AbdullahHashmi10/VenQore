<?php

namespace App\Reckoner\Resolvers;

final class QuotationsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'quotations.count';
    }
}
