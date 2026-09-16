<?php

namespace App\Reckoner\Resolvers;

final class CookbookRecipeCostPctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cookbook.recipe_cost_pct';
    }
}
