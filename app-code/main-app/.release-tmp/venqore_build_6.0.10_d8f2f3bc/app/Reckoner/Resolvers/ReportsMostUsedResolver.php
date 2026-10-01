<?php

namespace App\Reckoner\Resolvers;

final class ReportsMostUsedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'reports.most_used';
    }
}
