<?php

namespace App\Reckoner\Resolvers;

final class AiTopInsightResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'ai.top_insight';
    }
}
