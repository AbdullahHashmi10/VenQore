<?php

namespace App\Reckoner\Resolvers;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;

interface CardResolverInterface
{
    public static function key(): string;

    public function resolve(ReckonerContext $ctx, ReckonerPeriod $period, array $args = []): ReckonerResult;
}
