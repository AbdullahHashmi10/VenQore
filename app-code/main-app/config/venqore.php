<?php

/**
 * VenQore platform flags.
 *
 * Currently these all belong to the legacy → V3 purchase consolidation.
 * See V3_CONSOLIDATION_PLAN.md for the phase each one belongs to.
 */
return [

    // Public AppSumo redemption is deliberately opt-in. Keep the environment
    // lookup in config so it survives `php artisan config:cache`.
    'appsumo_public' => env('APPSUMO_PUBLIC', false),

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

    /*
    |--------------------------------------------------------------------------
    | Launch security switches (added 2026-09-10, pre-launch audit)
    |--------------------------------------------------------------------------
    | terminal_telemetry_enabled — SEC-04. The public terminal activity and
    |   screenshot endpoints stay OFF until you deliberately enable them. When on,
    |   they still require a paired terminal and its device secret.
    | platform_pin_login_enabled — SEC-05. Short-PIN login for platform staff.
    |   OFF in every environment unless explicitly enabled (never in production).
    | web_installer_enabled — SEC-07. The browser installer/diagnostics. OFF by
    |   default; production additionally refuses it regardless of this flag.
    | email_otp_required — AUTH-01. Every email/password login and signup must
    |   complete a 6-digit emailed code before a session is granted.
    */
    'terminal_telemetry_enabled' => (bool) env('VQ_TERMINAL_TELEMETRY', false),
    'platform_pin_login_enabled' => (bool) env('VQ_PLATFORM_PIN_LOGIN', false),
    'web_installer_enabled'      => (bool) env('VQ_WEB_INSTALLER', false),
    // SEC-08: the in-browser ZIP updater. OFF unless explicitly enabled.
    'web_updater_enabled'        => (bool) env('VQ_WEB_UPDATER', false),
    // SEC-09: max frontend error reports stored per day (all visitors combined).
    'error_report_daily_budget'  => (int) env('VQ_ERROR_REPORT_DAILY_BUDGET', 5000),
    'email_otp_required'         => (bool) env('VQ_EMAIL_OTP_REQUIRED', true),
    // SEC-05: authenticator-app MFA. Platform accounts are ALWAYS enforced.
    'require_owner_2fa'          => (bool) env('VQ_REQUIRE_OWNER_2FA', false),
    'enforce_2fa_in_tests'       => false,

    // AUTH-01: emailed one-time codes. Defaults follow the audit spec and the
    // Resend free tier (100/day): the global budget stays below that cap so a
    // flood cannot exhaust it. Raise only when the provider plan allows.
    'otp' => [
        'ttl_minutes'                 => (int) env('VQ_OTP_TTL_MINUTES', 5),
        'max_attempts'                => (int) env('VQ_OTP_MAX_ATTEMPTS', 5),
        'resend_cooldown_seconds'     => (int) env('VQ_OTP_RESEND_COOLDOWN', 60),
        'max_sends_per_challenge'     => (int) env('VQ_OTP_MAX_SENDS_PER_CHALLENGE', 5),
        'max_sends_per_email_per_hour'=> (int) env('VQ_OTP_MAX_SENDS_PER_EMAIL_HOUR', 5),
        'max_sends_per_ip_per_hour'   => (int) env('VQ_OTP_MAX_SENDS_PER_IP_HOUR', 20),
        'max_sends_global_per_day'    => (int) env('VQ_OTP_GLOBAL_DAILY_BUDGET', 90),
        'global_warning_at'           => (int) env('VQ_OTP_GLOBAL_WARNING_AT', 70),
        // 'queue' | 'sync' | null (null = queue in production, sync elsewhere)
        'delivery'                    => env('VQ_OTP_DELIVERY'),
        // Local dev master code: accepted only when APP_ENV=local
        'dev_master_code'             => env('VQ_OTP_DEV_MASTER_CODE', '000000'),
    ],

];
