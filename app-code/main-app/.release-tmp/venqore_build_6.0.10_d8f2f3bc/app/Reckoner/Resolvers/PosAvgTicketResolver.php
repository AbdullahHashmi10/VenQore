<?php

namespace App\Reckoner\Resolvers;

final class PosAvgTicketResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.avg_ticket';
    }
}
