<?php

namespace App\Rules;

use App\Support\OutboundUrlGuard;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** SSRF sweep (2026-09-10): the URL must be a public http(s) address. */
class PublicHttpUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }
        if (!OutboundUrlGuard::isPublicHttpUrl((string) $value)) {
            $fail('The :attribute must be a public web address (not a private, local or internal address).');
        }
    }
}
