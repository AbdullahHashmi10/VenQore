<?php

namespace App\Reckoner\Resolvers;

final class AccountingAssetsTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.assets_total';
    }
}
