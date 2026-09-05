<!DOCTYPE html>
{{--
    Appearance is resolved and written onto <html> here, server-side, rather than
    applied by React after boot.

    The theme engine emits every selectable theme into one stylesheet, scoped by
    these attributes. Setting them in the document the browser is already parsing
    means the correct theme is in force before the first pixel is painted. Doing
    it from JavaScript instead would show the build-time default theme on every
    full page load and then repaint — the flash is most of a second on a slow
    Android device, and it happens on every login, every hard refresh and every
    non-Inertia navigation.

    Appearance::forRequest() fails closed to defaults: it runs on the marketing
    site, in the installer and before the database exists.
--}}
@php($vqAppearance = \App\Support\Appearance::forRequest())
@php($vqHtmlAttributes = \App\Support\Appearance::htmlAttributes($vqAppearance))
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @foreach($vqHtmlAttributes as $vqAttribute => $vqValue) {{ $vqAttribute }}="{{ $vqValue }}" @endforeach>

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-404QXQB4XF"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      // AI Referral Traffic Grouping (T8)
      var referrer = document.referrer || '';
      var aiReferrals = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com', 'copilot.bing.com'];
      var isAiReferral = false;
      for (var i = 0; i < aiReferrals.length; i++) {
        if (referrer.indexOf(aiReferrals[i]) !== -1) {
          isAiReferral = true;
          break;
        }
      }

      var gtagConfig = {};
      if (isAiReferral) {
        gtagConfig['traffic_type'] = 'ai_referral';
        gtagConfig['ai_referral'] = 'true';
        
        // Extract platform name
        var platform = 'unknown';
        var match = referrer.match(/(chatgpt|openai|perplexity|claude|gemini|copilot)/i);
        if (match) {
          platform = match[0].toLowerCase();
        }
        
        gtag('event', 'ai_referral_visit', {
          'event_category': 'engagement',
          'event_label': referrer,
          'ai_platform': platform
        });
      }

      gtag('config', 'G-404QXQB4XF', gtagConfig);
    </script>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Favicons for Browser & Google Search Results --}}
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png">
    <link rel="apple-touch-icon" href="/favicon.png">

    @php($seo = \App\Support\MarketingSeo::current())

    <title inertia>{{ $seo['title'] ?? config('app.name', 'VenQore POS') }}</title>

    @if($seo)
    {{-- ── Server-rendered SEO/GEO layer (2026-07-03) — real HTML for crawlers & AI bots ── --}}
    <meta name="description" content="{{ $seo['description'] }}" inertia>
    @if(!empty($seo['keywords']))
    <meta name="keywords" content="{{ $seo['keywords'] }}" inertia>
    @endif
    <link rel="canonical" href="{{ $seo['canonical'] }}" inertia>
    <meta property="og:site_name" content="VenQore" inertia>
    <meta property="og:type" content="website" inertia>
    <meta property="og:title" content="{{ $seo['title'] }}" inertia>
    <meta property="og:description" content="{{ $seo['description'] }}" inertia>
    <meta property="og:url" content="{{ $seo['canonical'] }}" inertia>
    <meta property="og:image" content="{{ $seo['og_image'] }}" inertia>
    <meta name="twitter:card" content="summary_large_image" inertia>
    <meta name="twitter:title" content="{{ $seo['title'] }}" inertia>
    <meta name="twitter:description" content="{{ $seo['description'] }}" inertia>
    <meta name="twitter:image" content="{{ $seo['og_image'] }}" inertia>
    {{-- Structured data: page-specific JSON-LD only (2026-07-05 — removed a hardcoded,
         site-wide SoftwareApplication+AggregateRating block that duplicated/conflicted
         with the per-page schema below on the homepage and carried a fabricated 4.9/128
         rating with no backing review data. SEMrush flagged this as a structured-data
         markup error; Google also treats unsubstantiated review/rating markup as a
         policy violation, so removing it is a compliance fix, not just an SEO one. --}}
    @foreach(($seo['jsonld'] ?? []) as $ld)
    <script type="application/ld+json">{!! json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
    @endforeach
    @endif

    {{-- No font <link> here, and no preconnect: every face this app can render
         is vendored under resources/fonts/ and declared in resources/css, which
         app.jsx imports — so they arrive inside the Vite bundle, hashed and
         offline. The four families that used to be fetched here (Inter, Space
         Grotesk, Figtree, Source Serif 4) are all still available; Appearance
         settings offers three of them as typeface choices and a face a user can
         pick but the browser cannot fetch reads as "the setting does nothing".
         See scripts/fonts-vendor.mjs. --}}
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
    @if (!isset($page))
        <div id="app"></div>
    @else
        <div id="app" data-page="{{ json_encode($page) }}"></div>
    @endif
</body>

</html>
