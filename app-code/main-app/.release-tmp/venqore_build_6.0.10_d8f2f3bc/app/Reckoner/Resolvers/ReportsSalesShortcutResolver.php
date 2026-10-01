<?php

namespace App\Reckoner\Resolvers;

final class ReportsSalesShortcutResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'reports.sales_shortcut';
    }
}
