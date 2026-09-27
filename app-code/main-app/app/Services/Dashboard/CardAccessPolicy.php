<?php

namespace App\Services\Dashboard;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\ReckonerRegistry;

/**
 * Card-level access policy for the V6 dashboard.
 *
 * View rule:   user has at least ONE of the card's declared permissions.
 * Drill rule:  same as view.
 * Export rule: user has data.export AND at least one view permission.
 *
 * Overrides for specific cards are declared in config/dashboard_access.php.
 * Every override key must be justified in role-card-contracts-349.json.
 */
class CardAccessPolicy
{
    // ---------- public API --------------------------------------------------

    /**
     * May the user see this card's value?
     *
     * @param  string $key     reckoner card key, e.g. "core.revenue"
     * @param  User   $user
     * @param  Tenant $tenant
     * @return bool
     */
    public function view(string $key, User $user, Tenant $tenant): bool
    {
        $permissions = $this->cardPermissions($key);

        // A card with no permission gate is visible to everyone in the tenant.
        if (empty($permissions)) {
            return true;
        }

        return $this->userHasAny($permissions, $user, $tenant);
    }

    /**
     * May the user drill into detail for this card?
     */
    public function drill(string $key, User $user, Tenant $tenant): bool
    {
        $override = config("dashboard_access.drill_overrides.{$key}");
        if ($override !== null) {
            return $this->userHasAny((array) $override, $user, $tenant);
        }

        // Default: same permission gate as view
        return $this->view($key, $user, $tenant);
    }

    /**
     * May the user export data for this card?
     */
    public function export(string $key, User $user, Tenant $tenant): bool
    {
        $override = config("dashboard_access.export_overrides.{$key}");
        if ($override !== null) {
            return $this->userHasAny((array) $override, $user, $tenant);
        }

        // Default: must also have data.export on top of view permission
        return $this->view($key, $user, $tenant)
            && $user->hasPermission('data.export', $tenant);
    }

    /**
     * What happens when the user cannot view the card?
     * Returns 'hidden' (strip from payload) or 'greyed' (send with null value).
     */
    public function denialBehavior(string $key): string
    {
        return config("dashboard_access.denial_overrides.{$key}", 'hidden');
    }

    /**
     * Filter an array of card keys to those the user may view.
     *
     * @param  string[] $keys
     * @return string[]
     */
    public function visibleKeys(array $keys, User $user, Tenant $tenant): array
    {
        return array_values(array_filter(
            $keys,
            fn (string $k) => $this->view($k, $user, $tenant)
        ));
    }

    /**
     * Annotate a resolved card payload with drill/export flags.
     *
     * Input:  ['key' => 'core.revenue', 'value' => 123.45, ...]
     * Output: adds '_can_drill' and '_can_export' booleans.
     *
     * @param  array<string,mixed> $card
     * @return array<string,mixed>
     */
    public function annotate(array $card, User $user, Tenant $tenant): array
    {
        $key = $card['key'] ?? '';
        $card['_can_drill']  = $this->drill($key, $user, $tenant);
        $card['_can_export'] = $this->export($key, $user, $tenant);
        return $card;
    }

    // ---------- internals ---------------------------------------------------

    /**
     * Return the permission keys required to view a card.
     * Source of truth: ReckonerRegistry (PHP) — permissions field.
     *
     * @return string[]
     */
    private function cardPermissions(string $key): array
    {
        $registry = ReckonerRegistry::all();

        if (!isset($registry[$key])) {
            // Unknown card key — deny by default
            return ['__unknown__'];
        }

        return $registry[$key]['permissions'] ?? [];
    }

    /**
     * True if the user holds at least one of the supplied permission keys
     * in the context of the given tenant.
     *
     * @param  string[] $permissions
     */
    private function userHasAny(array $permissions, User $user, Tenant $tenant): bool
    {
        foreach ($permissions as $perm) {
            if ($user->hasPermission($perm, $tenant)) {
                return true;
            }
        }
        return false;
    }
}
