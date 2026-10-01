<?php

namespace App\Reckoner\Resolvers;

final class CookbookIngredientCostTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cookbook.ingredient_cost_trend';
    }
}
