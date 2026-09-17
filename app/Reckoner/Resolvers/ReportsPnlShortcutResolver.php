<?php

namespace App\Reckoner\Resolvers;

final class ReportsPnlShortcutResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'reports.pnl_shortcut';
    }
}
