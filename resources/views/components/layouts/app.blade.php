<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- PWA Meta Tags -->
    <meta name="application-name" content="VENQORE">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="VENQORE">
    <meta name="theme-color" content="#00d4ff">
    <meta name="mobile-web-app-capable" content="yes">

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/icon-192x192.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/images/icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/images/icons/icon-144x144.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/images/icons/icon-128x128.png">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/icon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/icon-72x72.png">

    <title>{{ config('app.name', 'VENQORE') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <!-- <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" /> -->

    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    <!-- Filament Styles -->
    @filamentStyles
    @vite('resources/css/app.css')

    <!-- PWA Installation Script -->
    <script>
        // Register Service Worker
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

        // PWA Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;

            // Show custom install button/banner (optional)
            console.log('PWA install prompt available');

            // You can show a custom UI element here to prompt installation
            // Example: showInstallPromotion();
        });

        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            console.log('VENQORE installed successfully!');
            deferredPrompt = null;
        });

        // Optional: Function to trigger install prompt manually
        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    deferredPrompt = null;
                });
            }
        }
    </script>
</head>

<body class="font-sans antialiased">
    {{ $slot }}

    @filamentScripts
    @vite('resources/js/app.jsx')
</body>

</html>