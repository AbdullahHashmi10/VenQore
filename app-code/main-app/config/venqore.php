<?php

/**
 * VenQore platform flags.
 *
 * Currently these all belong to the legacy → V3 purchase consolidation.
 * See V3_CONSOLIDATION_PLAN.md for the phase each one belongs to.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Purchase shadow write  (Phase 4)
    |--------------------------------------------------------------------------
    | While legacy still serves purchase writes, mirror every new legacy
    | purchase into `purchases` with the same UUID so the two tables stay in
    | step during the dual-read verification window.
    |
    | Turn this OFF at Phase 6 step 1, once legacy no longer serves writes.
    */
    'purchase_shadow_write' => env('VENQORE_PURCHASE_SHADOW_WRITE', true),

    /*
    |--------------------------------------------------------------------------
    | Purchase cutover  (Phase 5)
    |--------------------------------------------------------------------------
    | Routes the live /purchases UI at App\Http\Controllers\V3\PurchaseController
    | instead of the legacy one. Route NAMES are unchanged either way, so no
    | frontend route() call has to change.
    |
    | Rollout order:
    |   1. leave false, list your pilot tenant slug in `purchase_cutover_tenants`
    |   2. watch for 72h with no support tickets
    |   3. flip this to true for everyone
    |
    | ROLLBACK: set it back to false. The data lives in both tables during
    | Phase 4/5, so this is a zero-risk revert. That is the entire point of the
    | dual-read window — do not cut over without it.
    |
    | ⚠️ DO NOT ENABLE until `purchases:drift-check` has reported zero drift for
    | 7+ consecutive days.
    */
    'purchase_cutover' => env('VENQORE_PURCHASE_CUTOVER', false),

    /*
    | Comma-separated tenant slugs that get V3 purchases even while
    | `purchase_cutover` is false. Your pilot list.
    */
    'purchase_cutover_tenants' => array_values(array_filter(
        array_map('trim', explode(',', (string) env('VENQORE_PURCHASE_CUTOVER_TENANTS', '')))
    )),

];
