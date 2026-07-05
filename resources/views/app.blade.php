<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @php($seo = \App\Support\MarketingSeo::current())

    <title inertia>{{ $seo['title'] ?? config('app.name', 'VenQore POS') }}</title>

    @if($seo)
    {{-- ── Server-rendered SEO/GEO layer (2026-07-03) — real HTML for crawlers & AI bots ── --}}
    <meta name="description" content="{{ $seo['description'] }}">
    <link rel="canonical" href="{{ $seo['canonical'] }}">
    <meta property="og:site_name" content="VenQore">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $seo['title'] }}">
    <meta property="og:description" content="{{ $seo['description'] }}">
    <meta property="og:url" content="{{ $seo['canonical'] }}">
    <meta property="og:image" content="{{ $seo['og_image'] }}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $seo['title'] }}">
    <meta name="twitter:description" content="{{ $seo['description'] }}">
    
    {{-- Schema Markup for Google Reviews & Rich Snippets --}}
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "VenQore",
      "operatingSystem": "Web, Windows, Android, iOS",
      "applicationCategory": "BusinessApplication",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "128"
      },
      "offers": {
        "@type": "Offer",
        "price": "29.00",
        "priceCurrency": "USD"
      }
    }
    </script>
    <meta name="twitter:image" content="{{ $seo['og_image'] }}">
    @foreach(($seo['jsonld'] ?? []) as $ld)
    <script type="application/ld+json">{!! json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
    @endforeach
    @endif

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <!-- <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" /> -->
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/png" href="/images/logo.png">

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                // 1. Proactively unregister any legacy conflicting service workers
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (const registration of registrations) {
                        const url = registration.active?.scriptURL || '';
                        if (url && !url.endsWith('/sw.js')) {
                            console.log('[SW] Unregistering legacy conflicting service worker:', url);
                            registration.unregister();
                        }
                    }
                });

                // 2. Register the unified sw.js only in production/staging environment
                const isDev = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
                if (!isDev) {
                    navigator.serviceWorker.register('/sw.js')
                        .then(reg => console.log('[SW] Unified service worker registered:', reg.scope))
                        .catch(err => console.error('[SW] Registration failed:', err));
                } else {
                    // In local development, ensure all service workers are fully unregistered
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                        for (const registration of registrations) {
                            registration.unregister();
                        }
                    });
                }
            });
        }
    </script>
</head>

<body class="font-sans antialiased">
    @if($seo && !empty($seo['static_html']))
        {{-- Crawler-visible fallback content inside the Inertia root. React's
             createRoot() replaces it on mount, so users see the full app while
             non-JS crawlers (GPTBot, ClaudeBot, PerplexityBot…) read real HTML.
             This is the same content users see pre-hydration — not cloaking. --}}
        <div id="app" data-page="{{ json_encode($page) }}">{!! $seo['static_html'] !!}</div>
    @else
        @inertia
    @endif
</body>

</html>
