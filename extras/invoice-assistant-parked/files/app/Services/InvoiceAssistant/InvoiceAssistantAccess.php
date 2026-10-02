<?php

namespace App\Services\InvoiceAssistant;

use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;

/**
 * Feature admission for every assistant endpoint.
 *
 * Layers (all must pass; none replaces the route's `permission:sales.create`):
 *   1. config switches  invoice_assistant.enabled / .voice_enabled (+ pilot tenants)
 *   2. the store's own AI controls — the SAME `ai_enabled` switch and
 *      `ai_restricted_roles` list the existing AI assistant honors
 *   3. AiGateway entitlement / scope / rate / spend, enforced at call time
 *
 * Re-checked on every request, so a revoked role or a disabled flag stops
 * handoff and claim as well as new drafts.
 */
class InvoiceAssistantAccess
{
    public static function enabled(?Tenant $tenant = null, bool $voice = false): bool
    {
        if (!config('invoice_assistant.enabled')) {
            return false;
        }
        if ($voice && !config('invoice_assistant.voice_enabled')) {
            return false;
        }
        $pilot = (array) config('invoice_assistant.enabled_tenants', []);
        if ($pilot && $tenant && !in_array((string) $tenant->id, array_map('strval', $pilot), true)) {
            return false;
        }

        return true;
    }

    public static function assert(?User $user, ?Tenant $tenant, bool $voice = false): void
    {
        if (!$user || !$tenant) {
            throw new InvoiceAssistantException(401, 'unauthenticated', 'Sign in to a store to use the assistant.');
        }
        if (!self::enabled($tenant, $voice)) {
            throw InvoiceAssistantException::disabled();
        }

        $off = Setting::where('key', 'ai_enabled')->value('value');
        if ($off === '0' && ($user->role ?? null) !== 'platform_admin') {
            throw new InvoiceAssistantException(403, 'ai_disabled', 'AI features are turned off for this store.');
        }

        $restricted = json_decode((string) Setting::where('key', 'ai_restricted_roles')->value('value'), true) ?? [];
        if (!empty($user->role) && in_array($user->role, $restricted, true)) {
            throw new InvoiceAssistantException(403, 'role_restricted', "Your role ({$user->role}) is not authorized to use AI features.");
        }
    }
}
