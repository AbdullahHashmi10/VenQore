<?php

namespace App\Reckoner;

use App\Models\Tenant;
use App\Models\User;

/**
 * The tenant/user pair a resolve pass runs under. Passed to every Source so
 * queries stay tenant-scoped without each Source re-deriving it.
 */
final class ReckonerContext
{
    public function __construct(
        public readonly ?Tenant $tenant,
        public readonly User $user,
    ) {
    }
}
