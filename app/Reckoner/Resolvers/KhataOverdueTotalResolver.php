<?php

namespace App\Reckoner\Resolvers;

final class KhataOverdueTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.overdue_total';
    }
}
