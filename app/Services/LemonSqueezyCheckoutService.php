<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LemonSqueezyCheckoutService
 * ---------------------------------------------------------------------------
 * Single place where every VenQore → Lemon Squeezy checkout is built.
 *
 * Lemon Squeezy is our Merchant of Record: they own the payment page for PCI
 * and global tax-liability reasons, so a fully self-hosted card form is not
 * possible. What this service does is squeeze every drop of "native" out of
 * what they *do* expose:
 *
 *   • embed=1        → the checkout renders inside our own page as an overlay
 *                      instead of navigating the browser away from VenQore.
 *   • dark / colours → the checkout is themed to match the VenQore billing UI.
 *   • prefilled data → email, name and tenant metadata are already filled in,
 *                      so the customer only ever types card details.
 *   • receipt links  → the post-purchase screen sends the user back into the
 *                      app rather than to a Lemon Squeezy landing page.
 *
 * Everything degrades safely: if the API call fails or credentials are absent,
 * callers fall back to the static store checkout URL, which this service can
 * still decorate with the same prefill + branding query parameters.
 */
class LemonSqueezyCheckoutService
{
    protected const API_ENDPOINT = 'https://api.lemonsqueezy.com/v1/checkouts';

    /** Display options accepted both as API `checkout_options` and URL params. */
    protected const DISPLAY_KEYS = ['embed', 'media', 'logo', 'desc', 'discount', 'dark'];

    /**
     * Are API credentials present? Without them we can only use static URLs.
     */
    public function isConfigured(): bool
    {
        return !empty(config('services.lemon_squeezy.api_key'))
            && !empty(config('services.lemon_squeezy.store_id'));
    }

    /**
     * Branding applied to every checkout, driven by config so it can be tuned
     * per-environment without a code change.
     */
    public function brandingOptions(): array
    {
        $branding = config('services.lemon_squeezy.checkout', []);

        return [
            // Always true — this is what turns the redirect into an overlay.
            'embed'        => true,
            'dark'         => (bool) ($branding['dark'] ?? true),
            'logo'         => (bool) ($branding['logo'] ?? true),
            'media'        => (bool) ($branding['media'] ?? false),
            'desc'         => (bool) ($branding['desc'] ?? false),
            'discount'     => (bool) ($branding['discount'] ?? true),
            'button_color' => $branding['button_color'] ?? '#7C3AED',
        ];
    }

    /**
     * Create a checkout through the API and return its URL.
     *
     * @param  Tenant  $tenant
     * @param  string|int  $variantId  Lemon Squeezy variant to sell.
     * @param  array  $options {
     *     @type array  $custom          Extra metadata echoed back on the webhook.
     *     @type int    $custom_price    Price override, in cents.
     *     @type string $name            Product name shown on the checkout.
     *     @type string $description     Product description shown on the checkout.
     *     @type string $redirect_url    Where to send the buyer after payment.
     *     @type string $receipt_link_url
     *     @type string $receipt_button_text
     *     @type string $thank_you_note
     *     @type string $discount_code
     *     @type string $expires_at      ISO-8601 expiry for the checkout link.
     * }
     * @return string|null  Checkout URL, or null when the API call failed.
     */
    public function createCheckout(Tenant $tenant, string|int $variantId, array $options = []): ?string
    {
        if (!$this->isConfigured() || empty($variantId)) {
            return null;
        }

        $branding = $this->brandingOptions();

        $checkoutOptions = [
            'embed'        => true,
            'dark'         => $branding['dark'],
            'logo'         => $branding['logo'],
            'media'        => $branding['media'],
            'desc'         => $branding['desc'],
            'discount'     => $branding['discount'],
            'button_color' => $branding['button_color'],
        ];

        $checkoutData = array_filter([
            'email'         => $tenant->ownerEmail() ?: null,
            'name'          => $this->ownerName($tenant),
            'discount_code' => $options['discount_code'] ?? null,
            'custom'        => $this->buildCustomData($tenant, $options['custom'] ?? []),
        ], fn ($value) => $value !== null && $value !== '');

        $productOptions = array_filter([
            'name'                => $options['name'] ?? null,
            'description'         => $options['description'] ?? null,
            'redirect_url'        => $options['redirect_url'] ?? null,
            'receipt_link_url'    => $options['receipt_link_url'] ?? $options['redirect_url'] ?? null,
            'receipt_button_text' => $options['receipt_button_text'] ?? 'Return to VenQore',
            'receipt_thank_you_note' => $options['thank_you_note'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $attributes = [
            'checkout_options' => $checkoutOptions,
            'checkout_data'    => $checkoutData,
            'product_options'  => $productOptions,
        ];

        if (!empty($options['custom_price'])) {
            $attributes['custom_price'] = (int) $options['custom_price'];
        }

        if (!empty($options['expires_at'])) {
            $attributes['expires_at'] = $options['expires_at'];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.lemon_squeezy.api_key'),
                'Accept'        => 'application/vnd.api+json',
                'Content-Type'  => 'application/vnd.api+json',
            ])->timeout(15)->post(self::API_ENDPOINT, [
                'data' => [
                    'type'       => 'checkouts',
                    'attributes' => $attributes,
                    'relationships' => [
                        'store' => [
                            'data' => [
                                'type' => 'stores',
                                'id'   => (string) config('services.lemon_squeezy.store_id'),
                            ],
                        ],
                        'variant' => [
                            'data' => [
                                'type' => 'variants',
                                'id'   => (string) $variantId,
                            ],
                        ],
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Lemon Squeezy checkout request threw an exception: ' . $e->getMessage(), [
                'tenant_id' => $tenant->id,
                'variant'   => $variantId,
            ]);
            return null;
        }

        if ($response->failed()) {
            Log::error('Lemon Squeezy checkout creation failed: ' . $response->body(), [
                'tenant_id' => $tenant->id,
                'variant'   => $variantId,
            ]);
            return null;
        }

        $url = $response->json('data.attributes.url');

        // Return the URL EXACTLY as issued. API checkouts come back signed
        // (/checkout/custom/{id}?signature=…) and that signature covers the
        // query string — appending display params like &embed=1&dark=1 makes
        // Lemon Squeezy reject the link with "Invalid signature" (403).
        //
        // No decoration is needed anyway: every branding option was already
        // sent in `checkout_options` above, which is the supported mechanism
        // for API-created checkouts.
        return $url ?: null;
    }

    /**
     * Is this a signed checkout URL? Signed URLs are immutable — any change to
     * the query string invalidates them.
     */
    protected function isSigned(string $url): bool
    {
        $query = parse_url($url, PHP_URL_QUERY);
        if (!$query) {
            return false;
        }

        parse_str($query, $params);

        return !empty($params['signature']);
    }

    /**
     * Decorate a static store checkout URL so it behaves like an API-generated
     * one: overlay-ready, themed, and prefilled with the tenant's details.
     *
     * Used when a currency-specific variant ID is not configured (e.g. the PKR
     * price points, which live as standalone store URLs) — the customer still
     * gets the identical in-app experience.
     */
    public function decorateStaticUrl(string $url, Tenant $tenant, array $custom = []): string
    {
        // Never touch a signed URL — mutating the query breaks its signature.
        if ($this->isSigned($url)) {
            return $url;
        }

        $params = [];

        $email = $tenant->ownerEmail();
        if ($email) {
            $params['checkout[email]'] = $email;
        }

        $name = $this->ownerName($tenant);
        if ($name) {
            $params['checkout[name]'] = $name;
        }

        foreach ($this->buildCustomData($tenant, $custom) as $key => $value) {
            $params["checkout[custom][{$key}]"] = $value;
        }

        return $this->withDisplayOptions($this->mergeQuery($url, $params));
    }

    /**
     * Append the display/branding options as query parameters. Lemon Squeezy
     * honours these on any checkout URL, including API-generated ones.
     */
    public function withDisplayOptions(string $url): string
    {
        // Signed (API-generated) URLs already carry their options in the body
        // and cannot have their query string modified.
        if ($this->isSigned($url)) {
            return $url;
        }

        $branding = $this->brandingOptions();

        $params = [];
        foreach (self::DISPLAY_KEYS as $key) {
            $params[$key] = !empty($branding[$key]) ? '1' : '0';
        }

        if (!empty($branding['button_color'])) {
            $params['button_color'] = $branding['button_color'];
        }

        return $this->mergeQuery($url, $params);
    }

    /**
     * Metadata echoed back to us on the `order_created` / `subscription_*`
     * webhooks. `tenant_id` is what LemonSqueezyWebhookController keys on, so
     * it must always be present.
     */
    protected function buildCustomData(Tenant $tenant, array $extra = []): array
    {
        $custom = ['tenant_id' => (string) $tenant->id];

        foreach ($extra as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            $custom[$key] = is_scalar($value) ? (string) $value : json_encode($value);
        }

        return $custom;
    }

    /**
     * Best-effort owner display name for checkout prefill.
     */
    protected function ownerName(Tenant $tenant): ?string
    {
        try {
            $name = $tenant->ownerMembership()->with('user')->first()?->user?->name;
        } catch (\Throwable) {
            $name = null;
        }

        return $name ?: null;
    }

    /**
     * Merge query parameters into a URL without clobbering existing ones.
     * (The previous implementation blindly appended "?", which corrupted any
     * checkout URL that already carried a query string.)
     */
    protected function mergeQuery(string $url, array $params): string
    {
        if (empty($params)) {
            return $url;
        }

        $parts = parse_url($url);
        if ($parts === false || empty($parts['host'])) {
            return $url;
        }

        $existing = [];
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $existing);
        }

        $query = http_build_query(array_merge($existing, $params));

        // Lemon Squeezy documents prefill params with literal brackets
        // (checkout[email]=…). http_build_query percent-encodes them, so undo
        // that for the bracket characters only — the values stay encoded.
        $query = str_replace(['%5B', '%5D'], ['[', ']'], $query);

        $rebuilt = ($parts['scheme'] ?? 'https') . '://' . $parts['host'];
        if (!empty($parts['port'])) {
            $rebuilt .= ':' . $parts['port'];
        }
        $rebuilt .= $parts['path'] ?? '';
        $rebuilt .= '?' . $query;
        if (!empty($parts['fragment'])) {
            $rebuilt .= '#' . $parts['fragment'];
        }

        return $rebuilt;
    }
}
