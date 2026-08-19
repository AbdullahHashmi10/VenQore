<?php

namespace App\Support;

use App\Models\Tenant;
use App\Services\ModuleService;

/*
|==============================================================================
| STEP 9 — ModuleNavBuilder
|==============================================================================
|
| The navigation is DERIVED from enabled modules. It is never stored.
|
| WHY NOT A tenant_navigation TABLE
| ---------------------------------
| Because a stored nav is a second source of truth that drifts from the first.
| Enable a module and forget to insert the nav row: an invisible module the
| customer paid attention to switching on. Disable one and forget to delete the
| row: a menu item that 403s. It is a sync-bug generator with no V1 payoff.
|
| Derived nav cannot drift, because there is nothing to drift from.
|
|------------------------------------------------------------------------------
| THE THREE FILTERS, IN ORDER
|------------------------------------------------------------------------------
|   1. module enabled?    -> ModuleService
|   2. module live?       -> a 'building' module never shows a menu item
|   3. user permitted?    -> a cashier does not see the accounting workspace
|
| A nav item that survives all three then gets its LABEL from Terms::, so a
| clinic sees "Patients" where a shop sees "Customers" — same module, same
| route, different word.
|==============================================================================
*/
class ModuleNavBuilder
{
    /**
     * @return array<int, array{key:string,route:string,label:string,icon:string,order:int,group:string}>
     */
    public static function build(?Tenant $tenant, $user = null): array
    {
        $items = [];

        foreach (config('modules', []) as $moduleKey => $module) {
            if (($module['nav'] ?? []) === []) {
                continue;   // sub-surfaces like Variants live inside a parent
            }

            if (!ModuleService::visible($tenant, $moduleKey, $user)) {
                continue;
            }

            foreach ($module['nav'] as $nav) {
                // A nav item pointing at a route that does not exist is a 404 in
                // the main menu. The integrity test catches this at build time;
                // this guard catches it at runtime after a bad deploy.
                if (!\Illuminate\Support\Facades\Route::has($nav['route'])) {
                    continue;
                }

                $items[] = [
                    'key'    => $moduleKey,
                    'route'  => $nav['route'],
                    'label'  => self::label($nav, $module),
                    'icon'   => $nav['icon'] ?? 'Circle',
                    'order'  => $nav['order'] ?? 999,
                    'group'  => $module['group'] ?? 'G',
                ];
            }
        }

        usort($items, fn ($a, $b) => $a['order'] <=> $b['order']);

        return $items;
    }

    /**
     * The word this business uses, not the word we chose.
     *
     * Falls back to the module label when the nav entry names no term key —
     * which is correct for things nobody renames, like Bank Reconciliation.
     */
    private static function label(array $nav, array $module): string
    {
        if (empty($nav['term'])) {
            return $module['label'];
        }

        try {
            return \App\Support\Terms::get($nav['term'], 'plural');
        } catch (\Throwable) {
            return $module['label'];
        }
    }

    /**
     * Dashboard cards, filtered the same way.
     *
     * A card with no 'module' key is ALWAYS VISIBLE. That keeps the change to
     * DashboardRegistry additive: existing dashboards are untouched until a
     * card is explicitly assigned to a module, so this can ship without
     * auditing all 20 cards first.
     */
    public static function cards(?Tenant $tenant, array $registryCards, $user = null): array
    {
        return array_filter($registryCards, function ($card) use ($tenant, $user) {
            $moduleKey = $card['module'] ?? null;

            if (!$moduleKey) {
                return true;    // Qore-backed card
            }

            return ModuleService::visible($tenant, $moduleKey, $user);
        });
    }
}
