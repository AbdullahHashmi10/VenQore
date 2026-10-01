<?php

namespace App\Services\Dashboard;

use App\Models\Tenant;
use App\Models\User;

/**
 * DashboardPresenter
 *
 * Filters and annotates a resolved Reckoner card payload before it is served
 * to the frontend via the Inertia 'readings' prop.
 *
 * Responsibilities:
 *  1. Strip cards the authenticated user may not view (CardAccessPolicy::view).
 *  2. Replace denied cards with a greyed stub when denial_behavior = 'greyed'.
 *  3. Annotate each remaining card with _can_drill and _can_export booleans.
 *  4. Never add values, never call the Reckoner — purely a filter/annotator.
 *
 * Usage (in DashboardController):
 *
 *   $readings = $this->reckoner->resolve($cardKeys, $tenant, $period);
 *   $readings = app(DashboardPresenter::class)->present($readings, $user, $tenant);
 *   return Inertia::render('Dashboard', compact('readings'));
 */
class DashboardPresenter
{
    public function __construct(
        private CardAccessPolicy $policy
    ) {}

    /**
     * Filter and annotate a map of resolved card data.
     *
     * @param  array<string, mixed> $readings  keyed by card key, values are
     *                                          whatever the Reckoner returned
     * @param  User                 $user
     * @param  Tenant               $tenant
     * @return array<string, mixed>
     */
    public function present(array $readings, User $user, Tenant $tenant): array
    {
        $out = [];

        foreach ($readings as $key => $card) {
            // Ensure the card array carries the key (some call sites may not)
            if (is_array($card) && !isset($card['key'])) {
                $card['key'] = $key;
            }

            if (!$this->policy->view($key, $user, $tenant)) {
                $behavior = $this->policy->denialBehavior($key);

                if ($behavior === 'greyed') {
                    // Send the card with null values so the frontend can render
                    // a locked placeholder in the correct slot.
                    $out[$key] = $this->greyedStub($key, $card);
                }
                // 'hidden' — simply omit the key from the output.
                continue;
            }

            // Card is accessible — annotate and pass through.
            $out[$key] = is_array($card)
                ? $this->policy->annotate($card, $user, $tenant)
                : $card;
        }

        return $out;
    }

    /**
     * Reduce an array of card keys to those the user may view.
     * Use this before asking the Reckoner to resolve values, so we don't pay
     * the query cost for cards the user can never see.
     *
     * @param  string[] $keys
     * @return string[]
     */
    public function filterKeys(array $keys, User $user, Tenant $tenant): array
    {
        return $this->policy->visibleKeys($keys, $user, $tenant);
    }

    // -----------------------------------------------------------------------

    /**
     * Build a greyed stub for a card the user cannot access.
     *
     * @param  array<string,mixed>|mixed $original  the original card shape;
     *                                               may be null if unresolved
     */
    private function greyedStub(string $key, mixed $original): array
    {
        $stub = [
            'key'          => $key,
            'value'        => null,
            'series'       => null,
            '_denied'      => true,
            '_can_drill'   => false,
            '_can_export'  => false,
        ];

        // Carry over display metadata if available so the frontend can still
        // render the card title and shape in the greyed state.
        if (is_array($original)) {
            foreach (['title', 'shape', 'viz', 'unit', 'precision', 'period'] as $f) {
                if (isset($original[$f])) {
                    $stub[$f] = $original[$f];
                }
            }
        }

        return $stub;
    }

    /**
     * Filter a v6Catalog (flat array of card definition objects) to those
     * the user may view.  This is what should be passed as the 'readings'
     * Inertia prop in DashboardController::fullDashboardExperimental().
     *
     * @param  array<int, array<string,mixed>> $catalog  return value of
     *                                          ReckonerRegistry::v6Catalog()
     * @return array<int, array<string,mixed>>
     */
    public function filterCatalog(array $catalog, User $user, Tenant $tenant): array
    {
        return array_values(array_filter(
            $catalog,
            fn (array $card) => $this->policy->view($card['key'] ?? '', $user, $tenant)
        ));
    }
}
