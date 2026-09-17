<?php

namespace App\Reckoner\Resolvers;

final class CorePlanUsageResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.plan_usage';
    }
}
