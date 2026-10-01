<?php

namespace App\Support;

/**
 * SSRF sweep (2026-09-10): tenant-supplied URLs (e.g. a WooCommerce store's
 * site URL) must point at the public internet — never at localhost, the cloud
 * metadata service (169.254.169.254), or private/reserved networks.
 *
 * Checked when the URL is saved AND again right before each outbound call
 * (DNS can change between the two).
 */
class OutboundUrlGuard
{
    public static function isPublicHttpUrl(?string $url): bool
    {
        if (!is_string($url) || $url === '') {
            return false;
        }
        $parts = parse_url($url);
        if (!$parts || !in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true) || empty($parts['host'])) {
            return false;
        }
        if (isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }
        $host = strtolower(trim($parts['host'], '[]'));
        if ($host === 'localhost' || str_ends_with($host, '.localhost') || str_ends_with($host, '.internal') || str_ends_with($host, '.local')) {
            return false;
        }

        if (!filter_var($host, FILTER_VALIDATE_IP) && function_exists('app') && app()->runningUnitTests()) {
            return true; // no DNS in the test suite; literal IPs are still checked
        }

        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : self::resolve($host);
        if (empty($ips)) {
            return false;
        }
        foreach ($ips as $ip) {
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return false;
            }
            // FILTER_FLAG_NO_RES_RANGE does not cover every special block.
            foreach (['100.64.', '169.254.', '0.', '127.'] as $prefix) {
                if (str_starts_with($ip, $prefix)) {
                    return false;
                }
            }
            if ($ip === '::1' || str_starts_with($ip, 'fe80:') || str_starts_with($ip, 'fc') || str_starts_with($ip, 'fd')) {
                return false;
            }
        }

        return true;
    }

    /** @return string[] */
    private static function resolve(string $host): array
    {
        $ips = [];
        $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];
        foreach ($records as $r) {
            if (!empty($r['ip'])) {
                $ips[] = $r['ip'];
            }
            if (!empty($r['ipv6'])) {
                $ips[] = $r['ipv6'];
            }
        }
        if (empty($ips)) {
            $v4 = @gethostbynamel($host);
            $ips = $v4 ?: [];
        }

        return $ips;
    }
}
