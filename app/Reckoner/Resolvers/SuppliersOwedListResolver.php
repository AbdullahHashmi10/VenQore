<?php

namespace App\Reckoner\Resolvers;

final class SuppliersOwedListResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.owed_list';
    }
}
