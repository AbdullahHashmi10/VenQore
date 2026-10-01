<?php

namespace App\Reckoner\Resolvers;

final class ReportsStockShortcutResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'reports.stock_shortcut';
    }
}
