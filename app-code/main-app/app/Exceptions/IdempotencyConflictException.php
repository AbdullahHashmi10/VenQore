<?php

namespace App\Exceptions;

/**
 * The idempotency key was already used for a sale with DIFFERENT business
 * content. Nothing was written. Rendered as 409 so no caller mistakes it for a
 * success or for a transient error worth retrying under the same key.
 */
class IdempotencyConflictException extends \RuntimeException
{
    public function __construct(public readonly string $saleId, public readonly ?string $reference = null)
    {
        parent::__construct('This receipt key was already used for a different sale' . ($reference ? " ({$reference})" : '') . '. Nothing was changed.');
    }

    public function render($request)
    {
        return response()->json([
            'success'   => false,
            'code'      => 'idempotency_conflict',
            'outcome'   => 'conflict',
            'message'   => $this->getMessage(),
            'sale_id'   => $this->saleId,
            'reference' => $this->reference,
        ], 409);
    }
}
