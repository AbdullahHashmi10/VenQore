<?php

namespace App\Exceptions;

/**
 * Thrown by the legacy POS checkout (SaleController@store) when a sale needs a
 * manager approval it does not carry — a line below its FIFO cost (S-011) or a
 * discount above the cashier's role limit (S-044) — or when the approval it
 * carries is not valid. The controller turns it into a 422 whose body is
 * {@see self::payload()}; the POS screens key off `code === 'approval_required'`.
 */
class ApprovalRequiredException extends \RuntimeException
{
    public const CODE = 'approval_required';

    /** @param array<string, mixed> $details */
    public function __construct(string $message, private readonly array $details)
    {
        parent::__construct($message);
    }

    /** @return array<string, mixed> */
    public function payload(): array
    {
        return ['success' => false, 'code' => self::CODE, 'message' => $this->getMessage()] + $this->details;
    }
}
