<?php

namespace App\Reckoner\Resolvers;

final class CoreDocumentSequenceOkResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.document_sequence_ok';
    }
}
