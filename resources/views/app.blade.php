<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

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
    @inertia
</body>

</html>