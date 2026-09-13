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
    {{--
      WEB-01 (2026-09-10): analytics obeys the cookie choice.
      - Nothing is loaded from Google until the visitor allows Analytics in the
        cookie banner (CookieConsent stores [essential, analytics, marketing]).
      - A saved "allow" is honoured on first paint; a later "reject" disables
        collection immediately (withdrawal) — no reload needed.
      - Only for signed-out visitors: signed-in POS/ERP screens (store slugs,
        customer and financial pages) are never sent to Google Analytics.
    --}}
    @php($vqAnalyticsGuest = rescue(fn () => auth()->guest(), true, false))
    @if($vqAnalyticsGuest)
    <script>
      (function () {
        var GA_ID = 'G-404QXQB4XF';
        var loaded = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        gtag('consent', 'default', {
          analytics_storage: 'denied', ad_storage: 'denied',
          ad_user_data: 'denied', ad_personalization: 'denied'
        });

        function analyticsAllowed(prefs) {
          try {
            if (!prefs) {
              if (localStorage.getItem('venqore_cookie_consent_v1') !== 'true') return false;
              prefs = JSON.parse(localStorage.getItem('venqore_cookie_preferences_v1') || 'null');
            }
            return Array.isArray(prefs) && prefs[1] === true;
          } catch (e) { return false; }
        }

        function load() {
          window['ga-disable-' + GA_ID] = false;
          gtag('consent', 'update', { analytics_storage: 'granted' });
          if (loaded) return;
          loaded = true;
          var s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
          document.head.appendChild(s);
          gtag('js', new Date());

          // AI Referral Traffic Grouping (T8)
          var referrer = document.referrer || '';
          var ai = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com', 'copilot.bing.com'];
          var cfg = {};
          for (var i = 0; i < ai.length; i++) {
            if (referrer.indexOf(ai[i]) !== -1) {
              var m = referrer.match(/(chatgpt|openai|perplexity|claude|gemini|copilot)/i);
              cfg.traffic_type = 'ai_referral';
              cfg.ai_referral = 'true';
              gtag('event', 'ai_referral_visit', {
                event_category: 'engagement',
                event_label: referrer.split('?')[0],
                ai_platform: m ? m[0].toLowerCase() : 'unknown'
              });
              break;
            }
          }
          gtag('config', GA_ID, cfg);
        }

        function withdraw() {
          window['ga-disable-' + GA_ID] = true;
          gtag('consent', 'update', { analytics_storage: 'denied' });
        }

        if (analyticsAllowed()) load();

        window.addEventListener('cookie-consent-changed', function (e) {
          if (analyticsAllowed(e && e.detail)) load(); else withdraw();
        });
      })();
    </script>
    @endif

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    {{-- Visitor pricing currency (GeoPricingMiddleware). Read by public page scripts. --}}
    @php($vqGeoCurrency = data_get($page ?? [], 'props.geo.currency'))
    @if($vqGeoCurrency)
    <meta name="vq-currency" content="{{ $vqGeoCurrency }}">
    @endif

    {{-- Favicons for Browser & Google Search Results --}}
    {{-- WEB-03 (2026-09-10): right-sized icons. favicon.ico = 16/32/48 (≈8 KB,
         was 422 KB); favicon.png = 512px (≈65 KB, was 6250px / 652 KB). --}}
    <link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

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
    {{-- N14/N15 (2026-09-10): the server-written page text from MarketingSeo /
         ToolSeo (static_html) was defined for every public page but never
         printed, so crawlers and AI bots that do not run JavaScript saw an
         empty <div id="app">. It is shown only when JavaScript is off. --}}
    @if(!empty($seo['static_html']))
    <noscript>{!! $seo['static_html'] !!}</noscript>
    @endif
    @if (!isset($page))
        <div id="app"></div>
    @else
        <div id="app" data-page="{{ json_encode($page) }}"></div>
    @endif
</body>

</html>
