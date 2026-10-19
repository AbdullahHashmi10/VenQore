<?php

namespace App\Support;

final class StationRelease
{
    public static function metadata(): array
    {
        $fallback = [
            'name' => 'VenQore Station for Windows', 'version' => 'Not published',
            'release_date' => null, 'installer_url' => null, 'file_size' => 'Not available',
            'min_os' => 'Windows 10 build 19045+ / Windows 11, x64',
            'status' => 'unavailable', 'is_live' => false,
        ];
        $path = public_path('downloads/station/release.json');
        if (!is_file($path)) return $fallback;
        $release = json_decode(file_get_contents($path), true);
        if (!is_array($release) || !preg_match('/^\d+\.\d+\.\d+$/', $release['version'] ?? '')) return $fallback;
        $url = '/downloads/station/VenQore-Station-Setup-'.$release['version'].'.exe';
        $file = public_path(ltrim($url, '/'));
        if (($release['installer_url'] ?? '') !== $url || !is_file($file)
            || filesize($file) !== ($release['bytes'] ?? null)
            || !preg_match('/^[a-f0-9]{64}$/i', $release['sha256'] ?? '')
            || !in_array($release['status'] ?? '', ['pilot', 'stable'], true)) return $fallback;
        return array_merge($fallback, array_intersect_key($release, array_flip([
            'version', 'release_date', 'installer_url', 'file_size', 'status', 'sha256',
        ])), ['is_live' => true]);
    }
}
