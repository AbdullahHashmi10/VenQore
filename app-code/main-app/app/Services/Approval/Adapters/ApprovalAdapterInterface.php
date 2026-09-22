<?php

namespace App\Services\Approval\Adapters;

use App\Models\ApprovalDocument;
use App\Models\Tenant;
use App\Models\User;

interface ApprovalAdapterInterface
{
    /**
     * Unique document type identifier (e.g. 'customer_receipt', 'sales_invoice').
     */
    public function documentType(): string;

    /**
     * Normalize and validate payload on submission.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validatePayload(array $payload, Tenant $tenant, User $maker): array;

    /**
     * Revalidate the payload against the live database at the moment of approval.
     *
     * @throws \Illuminate\Validation\ValidationException|\RuntimeException
     */
    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void;

    /**
     * Execute final operational and financial posting atomically.
     * Returns array with posted entity details: ['type' => string, 'id' => mixed, 'reference' => string].
     */
    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array;
}
