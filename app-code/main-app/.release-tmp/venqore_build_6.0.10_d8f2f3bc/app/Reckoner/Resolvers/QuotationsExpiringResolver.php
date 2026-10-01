<?php

namespace App\Reckoner\Resolvers;

final class QuotationsExpiringResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'quotations.expiring';
    }
}
