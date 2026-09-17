<?php

namespace App\Reckoner\Resolvers;

final class ReportsSavedCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'reports.saved_count';
    }
}
