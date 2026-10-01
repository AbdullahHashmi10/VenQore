<?php

namespace App\Reckoner\Resolvers;

final class CookbookRecipeCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cookbook.recipe_count';
    }
}
