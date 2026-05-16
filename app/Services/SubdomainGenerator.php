<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Str;

/**
 * SubdomainGenerator — Phase 1.6
 *
 * Generates a safe, unique, non-reserved subdomain from a business name.
 *
 * Usage:
 *   $subdomain = SubdomainGenerator::generate("John's Shop & More!");
 *   // → "johns-shop-more"
 *   // → "johns-shop-more-1" (if taken)
 *
 * The reserved list prevents attackers from claiming subdomains
 * like admin.venqore.com, billing.venqore.com etc.
 */
class SubdomainGenerator
{
    /**
     * Reserved subdomains that cannot be claimed by tenants.
     * These overlap with internal service names, Nginx configs,
     * and paths used by the main domain.
     */
    private const RESERVED = [
        'admin', 'app', 'api', 'www', 'mail', 'smtp', 'pop', 'imap',
        'demo', 'test', 'dev', 'staging', 'beta', 'alpha', 'preview',
        'billing', 'support', 'help', 'docs', 'status', 'blog',
        'static', 'assets', 'cdn', 'media', 'img', 'images',
        'dashboard', 'login', 'signup', 'register', 'logout',
        'venqore', 'system', 'root', 'null', 'undefined',
        'ftp', 'ssh', 'vpn', 'ns', 'ns1', 'ns2', 'mx',
        'monitor', 'health', 'metrics', 'queue', 'horizon',
    ];

    /**
     * Generate a unique, safe subdomain from a business name.
     *
     * @param  string  $businessName  Raw business name from onboarding form
     * @return string                  URL-safe slug, guaranteed unique and non-reserved
     */
    public static function generate(string $businessName): string
    {
        // Slugify business name: "John's Shop & More!" → "johns-shop-more"
        $slug = Str::slug($businessName);

        // Fallback if slugification returns an empty string (e.g., pure Arabic input)
        if (empty($slug)) {
            $slug = 'store-' . Str::random(6);
        }

        // Enforce min length
        if (strlen($slug) < 3) {
            $slug = $slug . '-store';
        }

        // Block reserved words — append a random number
        if (in_array($slug, self::RESERVED, true)) {
            $slug = $slug . '-' . rand(100, 999);
        }

        // Ensure uniqueness in the database
        $original = $slug;
        $counter  = 1;

        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $original . '-' . $counter++;
        }

        return $slug;
    }

    /**
     * Validate that a user-requested subdomain is valid.
     * Used in the registration form where users pick their own subdomain.
     *
     * @return string|null  Error message if invalid, null if OK
     */
    public static function validate(string $subdomain): ?string
    {
        // Only lowercase alphanumeric and hyphens
        if (!preg_match('/^[a-z0-9][a-z0-9\-]{1,}[a-z0-9]$/', $subdomain)) {
            return 'Subdomain may only contain lowercase letters, numbers, and hyphens. Must be at least 3 characters.';
        }

        if (strlen($subdomain) > 63) {
            return 'Subdomain must be 63 characters or fewer.';
        }

        if (in_array($subdomain, self::RESERVED, true)) {
            return 'That subdomain is reserved. Please choose a different store name.';
        }

        if (Tenant::where('slug', $subdomain)->exists()) {
            return 'That subdomain is already taken. Please choose another.';
        }

        return null;
    }
}
