<?php

namespace App\Reckoner\Resolvers;

final class CoreJournalEntriesCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.journal_entries_count';
    }
}
