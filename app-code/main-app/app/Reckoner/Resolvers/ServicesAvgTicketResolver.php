<?php

namespace App\Reckoner\Resolvers;

final class ServicesAvgTicketResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.avg_ticket';
    }
}
