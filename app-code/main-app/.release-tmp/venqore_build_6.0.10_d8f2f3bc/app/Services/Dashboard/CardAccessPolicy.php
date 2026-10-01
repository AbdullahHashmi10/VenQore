<?php

namespace App\Services\Dashboard;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\ReckonerRegistry;
use App\Services\ModuleService;
use App\Services\PlanGate;

/**
 * Card-level access policy for the V6 dashboard and Reckoner cards.
 *
 * Enforces server-side gating before data leaves the server:
 * 1. Existence / Definition: Unknown cards fail closed (denied).
 * 2. Module gating: Tenant must have the required module enabled.
 * 3. Plan feature gating: Tenant plan must include required features.
 * 4. Permission contract: User must hold required permission(s).
 *    Supports OR between alternatives and AND within companion requirements.
 * 5. Drill gate: Specific override or matches view gate.
 * 6. Export gate: Specific override or (view gate + data.export).
 */
class CardAccessPolicy
{
    // ---------- public API --------------------------------------------------

    /**
     * May the user see this card's value?
     *
     * @param  string $key     reckoner or dashboard card key, e.g. "core.revenue"
     * @param  User   $user
     * @param  Tenant $tenant
     * @return bool
     */
    public function view(string $key, User $user, Tenant $tenant): bool
    {
        $def = $this->resolveCardDefinition($key);
        if ($def === null) {
            // Unknown card key — deny by default (fail closed)
            return false;
        }

        // 1. Module Gate
        $modules = $def['modules'] ?? ($def['module'] ?? null);
        if ($modules !== null) {
            $hasActiveModule = false;
            foreach ((array) $modules as $mod) {
                if ($mod && ModuleService::enabled($tenant, $mod)) {
                    $hasActiveModule = true;
                    break;
                }
            }
            if (!$hasActiveModule) {
                return false;
            }
        }

        // 2. Plan Feature Gate
        $feature = $def['feature'] ?? null;
        if ($feature !== null) {
            if (!PlanGate::check($feature, null, $tenant)) {
                return false;
            }
        }

        // 3. Permission Gate
        $permissions = $def['permissions'] ?? [];
        if (empty($permissions)) {
            // A permission-free card is allowed only if explicitly classified as safe/public
            return (bool) ($def['is_public'] ?? false);
        }

        return $this->evaluatePermissions($permissions, $user, $tenant);
    }

    /**
     * May the user drill into detail for this card?
     */
    public function drill(string $key, User $user, Tenant $tenant): bool
    {
        // Must first pass view gate
        if (!$this->view($key, $user, $tenant)) {
            return false;
        }

        $override = config("dashboard_access.drill_overrides.{$key}");
        if ($override !== null) {
            return $this->evaluatePermissions((array) $override, $user, $tenant);
        }

        // Default: view permission is sufficient
        return true;
    }

    /**
     * May the user export data for this card?
     */
    public function export(string $key, User $user, Tenant $tenant): bool
    {
        // Must first pass view gate
        if (!$this->view($key, $user, $tenant)) {
            return false;
        }

        $override = config("dashboard_access.export_overrides.{$key}");
        if ($override !== null) {
            $overrideList = (array) $override;
            // Empty override list = never exportable
            if (empty($overrideList)) {
                return false;
            }
            return $user->hasPermission('data.export', $tenant)
                && $this->evaluatePermissions($overrideList, $user, $tenant);
        }

        // Default: must have data.export on top of view permission
        return $user->hasPermission('data.export', $tenant);
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

    /**
     * Evaluates permission rule clauses.
     * Supports:
     * - String: 'sales.view'
     * - Array of strings (OR): ['sales.view', 'reports.summary']
     * - Nested array (AND companion requirement): [['sales.create', 'sales.edit']]
     *
     * @param  mixed  $permissions
     * @param  User   $user
     * @param  Tenant $tenant
     * @return bool
     */
    public function evaluatePermissions(mixed $permissions, User $user, Tenant $tenant): bool
    {
        if (empty($permissions)) {
            return false;
        }

        if (is_string($permissions)) {
            return $user->hasPermission($permissions, $tenant);
        }

        if (!is_array($permissions)) {
            return false;
        }

        foreach ($permissions as $clause) {
            if (is_array($clause)) {
                // AND requirement: user must satisfy all permissions in this clause
                $allMatch = true;
                foreach ($clause as $perm) {
                    if (!$user->hasPermission($perm, $tenant)) {
                        $allMatch = false;
                        break;
                    }
                }
                if ($allMatch && !empty($clause)) {
                    return true;
                }
            } elseif (is_string($clause)) {
                // OR requirement: user has this permission
                if ($user->hasPermission($clause, $tenant)) {
                    return true;
                }
            }
        }

        return false;
    }

    // ---------- internals ---------------------------------------------------

    /**
     * Resolve card definition from ReckonerRegistry, CardRegistry, or DashboardRegistry.
     *
     * @param  string $key
     * @return array<string, mixed>|null
     */
    private function resolveCardDefinition(string $key): ?array
    {
        // 1. ReckonerRegistry (primary runtime registry)
        $def = ReckonerRegistry::find($key);
        if ($def !== null) {
            return $def;
        }

        // 2. CardRegistry (349 card catalogue)
        $cards = CardRegistry::all();
        if (isset($cards[$key])) {
            return $cards[$key];
        }

        // 3. DashboardRegistry (standard dashboard cards)
        $dash = DashboardRegistry::all();
        if (isset($dash[$key])) {
            return $dash[$key];
        }

        return null;
    }
}
