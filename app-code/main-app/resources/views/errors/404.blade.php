<!DOCTYPE html>
{{--
    404 — theme-aware, token-only.

    What this page used to be, and why none of it survived:

      · A forced near-black ground with a cold true-neutral ramp. The product
        has a light theme and a dark one; its error pages get both. DESIGN-RULES
        §4 also rules that true-neutral ramp out — it reads cold beside V6 teal.
      · A 120–180px numeral in a weight above 700. §6 caps the type scale at
        42px (`text-5xl`) and weight at 700, and §14 caps in-app display at
        40px. An error page is product chrome, not a marketing hero.
      · Two large blurred colour clouds and a radial spot. §14: ambient
        background art is a public-page device and "never inside the product".
      · A three-stop text gradient in a hue bound to the old de-facto brand.

    None of those class names are written out above on purpose: Tailwind scans
    raw file text, so a class quoted in a comment is a class that gets built.
--}}
@php($vqAppearance = \App\Support\Appearance::forRequest())
@php($vqHtmlAttributes = \App\Support\Appearance::htmlAttributes($vqAppearance))
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @foreach($vqHtmlAttributes as $vqAttribute => $vqValue) {{ $vqAttribute }}="{{ $vqValue }}" @endforeach>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 - Page Not Found | VenQore</title>

    {{--
        Mode before paint.

        app.blade.php resolves theme/density/radius server-side and writes them
        onto <html> for exactly this reason — the correct look is in force
        before the browser paints. Light-versus-dark is the one part it does not
        write, because it is a `.dark` class that resources/js/theme/appearance.js
        applies as React boots. React never boots on an error page, so the class
        has to be set here or the page paints light and then flips. Same shape as
        the pre-paint block in resources/views/landing-v6.blade.php.
    --}}
    <script>
        (function () {
            try {
                var mode = @json($vqAppearance['mode'] ?? 'system');
                var dark = mode === 'dark'
                    || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', dark);
            } catch (e) { /* no matchMedia, no localStorage — light stands */ }
        })();
    </script>

    @vite(['resources/css/app.css'])
</head>

{{--
    `overflow-y-auto` is deliberate: app.css locks html/body/#app to
    overflow:hidden for the fixed-viewport app shell, and this page is a normal
    document. Without it the card is clipped on a short viewport.
--}}
<body class="min-h-screen overflow-y-auto bg-app font-sans text-ink antialiased selection:bg-accent-fill selection:text-accent-on">

    <div class="flex min-h-screen w-full flex-col items-center justify-center px-6 py-16">

        <main class="w-full max-w-lg rounded-xl bg-surface p-10 text-center shadow-md md:p-12">
            <p class="font-numeric text-5xl font-bold leading-none tracking-tighter text-accent-text">404</p>

            <h1 class="mt-6 font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">Lost in Space?</h1>

            <p class="mt-4 text-base leading-relaxed text-ink-secondary">The page you are looking for has drifted away into the void of the digital universe.</p>

            <!-- Action Button -->
            <div class="mt-10">
                <a href="/" class="group inline-flex h-control-lg items-center justify-center gap-3 rounded-lg bg-accent-fill px-6 font-semibold text-accent-on shadow-glow transition-colors duration-fast hover:bg-accent-fill-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                    <!-- Home Icon SVG -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="transition-transform duration-fast group-hover:-translate-x-1">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Return to Mission Control
                </a>
            </div>

            <!-- Helper Links -->
            <div class="mt-8 flex items-center justify-center gap-6 text-sm">
                <a href="/sales" class="text-ink-muted transition-colors duration-fast hover:text-accent-text">Sales</a>
                <span class="text-ink-faint" aria-hidden="true">&bull;</span>
                <a href="/inventory" class="text-ink-muted transition-colors duration-fast hover:text-accent-text">Inventory</a>
                <span class="text-ink-faint" aria-hidden="true">&bull;</span>
                <a href="/reports" class="text-ink-muted transition-colors duration-fast hover:text-accent-text">Reports</a>
            </div>
        </main>

        <!-- Footer -->
        <p class="mt-10 text-center font-numeric text-2xs uppercase tracking-widest text-ink-faint">System Status: Orbital &bull; Error Code: 404_NOT_FOUND</p>

    </div>

</body>
</html>
