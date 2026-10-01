<?php

namespace App\Reckoner\Resolvers;

final class ServicesJobsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.jobs_count';
    }
}
