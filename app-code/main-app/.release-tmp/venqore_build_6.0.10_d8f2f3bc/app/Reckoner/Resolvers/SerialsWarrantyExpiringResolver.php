<?php

namespace App\Reckoner\Resolvers;

final class SerialsWarrantyExpiringResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'serials.warranty_expiring';
    }
}
