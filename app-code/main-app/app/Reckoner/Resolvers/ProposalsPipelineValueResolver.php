<?php

namespace App\Reckoner\Resolvers;

final class ProposalsPipelineValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'proposals.pipeline_value';
    }
}
