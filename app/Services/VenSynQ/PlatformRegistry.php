<?php

namespace App\Services\VenSynQ;

use App\Services\VenSynQ\Platforms\AmazonClient;
use App\Services\VenSynQ\Platforms\EbayClient;
use App\Services\VenSynQ\Platforms\PlatformClient;
use App\Services\VenSynQ\Platforms\TikTokClient;
use App\Services\VenSynQ\Platforms\WooCommerceClient;
use InvalidArgumentException;

/**
 * PlatformRegistry — single source of truth for "which adapter handles platform X".
 *
 * ── The bug this replaces ─────────────────────────────────────────────────────
 * VenSynQController, VenSynQSyncJob and TokenRefreshJob each carried their own
 * hand-written match()/switch on $channel->platform. Two of the three had no
 * default arm, so an unrecognised platform value threw \UnhandledMatchError —
 * an Error, not an Exception. The surrounding `catch (\Exception $e)` could not
 * catch it, so a single unexpected row killed the entire sync run for every
 * tenant and left channels stuck in sync_status = 'syncing' forever.
 *
 * Centralising resolution means adding a platform is a one-line change here, and
 * an unknown platform now raises a catchable InvalidArgumentException.
 */
class PlatformRegistry
{
    /** Machine key => adapter class. Order drives the UI listing order. */
    private const MAP = [
        'amazon'      => AmazonClient::class,
        'woocommerce' => WooCommerceClient::class,
        'ebay'        => EbayClient::class,
        'tiktok'      => TikTokClient::class,
    ];

    /** Human labels for flash messages and the settings screen. */
    private const LABELS = [
        'amazon'      => 'Amazon',
        'woocommerce' => 'WooCommerce',
        'ebay'        => 'eBay',
        'tiktok'      => 'TikTok Shop',
    ];

    /**
     * Resolve a platform key to its adapter.
     *
     * @throws InvalidArgumentException when the platform is unknown — catchable,
     *         unlike the \UnhandledMatchError this replaces.
     */
    public function resolve(string $platform): PlatformClient
    {
        $key = $this->normalize($platform);

        if (!isset(self::MAP[$key])) {
            throw new InvalidArgumentException(
                "Unsupported VenSynQ platform \"{$platform}\". Supported: " . implode(', ', $this->supported()) . '.'
            );
        }

        return app(self::MAP[$key]);
    }

    /**
     * Resolve without throwing — for loops that must survive one bad row.
     */
    public function tryResolve(string $platform): ?PlatformClient
    {
        try {
            return $this->resolve($platform);
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    public function supports(string $platform): bool
    {
        return isset(self::MAP[$this->normalize($platform)]);
    }

    /** @return array<int, string> */
    public function supported(): array
    {
        return array_keys(self::MAP);
    }

    public function label(string $platform): string
    {
        return self::LABELS[$this->normalize($platform)] ?? ucfirst($platform);
    }

    /**
     * Laravel validation rule fragment, e.g. "in:amazon,woocommerce,ebay,tiktok".
     * Keeps request validation and the registry from drifting apart.
     */
    public function validationRule(): string
    {
        return 'in:' . implode(',', $this->supported());
    }

    /**
     * WooCommerce authenticates with a non-expiring consumer key/secret pair,
     * so TokenRefreshJob must skip it instead of flagging it as expired and
     * force-disconnecting a perfectly healthy connection.
     */
    public function rotatesTokens(string $platform): bool
    {
        return $this->normalize($platform) !== 'woocommerce';
    }

    /**
     * Default marketplace commission used when a platform does not return exact
     * fees on the order payload. Woo takes no commission, hence 0.
     */
    public function defaultFeePercentage(string $platform): float
    {
        return match ($this->normalize($platform)) {
            'amazon'      => 15.00,
            'ebay'        => 12.00,
            'tiktok'      => 8.00,
            'woocommerce' => 0.00,
            default       => 0.00,
        };
    }

    private function normalize(string $platform): string
    {
        return strtolower(trim($platform));
    }
}
