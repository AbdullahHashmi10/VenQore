<?php

namespace App\Reckoner\Resolvers;

final class AiReorderSuggestionsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'ai.reorder_suggestions';
    }
}
