<?php

namespace App\Reckoner\Resolvers;

final class QuotationsOpenValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'quotations.open_value';
    }
}
