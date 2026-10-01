<?php

namespace App\Reckoner\Resolvers;

final class AiAnomaliesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'ai.anomalies';
    }
}
