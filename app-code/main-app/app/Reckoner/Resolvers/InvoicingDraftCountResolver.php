<?php

namespace App\Reckoner\Resolvers;

final class InvoicingDraftCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.draft_count';
    }
}
