<?php

namespace App\Reckoner\Resolvers;

final class AiAlertsOpenResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'ai.alerts_open';
    }
}
