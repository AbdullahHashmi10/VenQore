<!DOCTYPE html>
{{--
    500 — theme-aware, token-only.

    Same rebuild as 404.blade.php, and for the same reasons: the forced
    near-black ground and cold true-neutral ramp are gone (§4), the 120–180px
    numeral in a weight above 700 is now a `text-5xl` figure at weight 700 (§6,
    and §14's 40px in-app display cap), the two blurred colour clouds and the
    radial spot are gone (§14 — ambient art is a public-page device, never
    inside the product), and the two-stop text gradient with it.

    The failure hue is now the semantic `danger` role rather than a hand-picked
    pigment: §4 reserves danger for "out of balance, failed, overdue", which is
    exactly what a 500 is. It carries a light and a dark stop, so the page reads
    correctly in both themes.

    None of the removed class names are written out above — Tailwind scans raw
    file text, so quoting one in a comment builds it again.
--}}
@php($vqAppearance = \App\Support\Appearance::forRequest())
@php($vqHtmlAttributes = \App\Support\Appearance::htmlAttributes($vqAppearance))
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @foreach($vqHtmlAttributes as $vqAttribute => $vqValue) {{ $vqAttribute }}="{{ $vqValue }}" @endforeach>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>500 - Server Error | VenQore</title>

    {{--
        Mode before paint — see the same block in 404.blade.php. app.blade.php
        writes theme/density/radius server-side; the `.dark` class is normally
        applied by resources/js/theme/appearance.js once React boots, and React
        never boots here.
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
    `overflow-y-auto`: app.css locks html/body/#app to overflow:hidden for the
    fixed-viewport app shell, and this is a normal document.
--}}
<body class="min-h-screen overflow-y-auto bg-app font-sans text-ink antialiased selection:bg-accent-fill selection:text-accent-on">

    <div class="flex min-h-screen w-full flex-col items-center justify-center px-6 py-16">

        <main class="w-full max-w-lg rounded-xl bg-surface p-10 text-center shadow-md md:p-12">
            <p class="font-numeric text-5xl font-bold leading-none tracking-tighter text-danger-600 dark:text-danger-300">500</p>

            <h1 class="mt-6 font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">System Malfunction</h1>

            <p class="mt-4 text-base leading-relaxed text-ink-secondary">
                Our systems encountered an unexpected error.
                We&#39;ve been notified and are working on a fix.
            </p>

            <!-- Action Button -->
            <div class="mt-10">
                <a href="/" class="group inline-flex h-control-lg items-center justify-center gap-3 rounded-lg bg-accent-fill px-6 font-semibold text-accent-on shadow-glow transition-colors duration-fast hover:bg-accent-fill-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                    <!-- Refresh Icon SVG -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="transition-transform duration-slow group-hover:rotate-180">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                        <path d="M16 21h5v-5"/>
                    </svg>
                    Reload System
                </a>
            </div>
        </main>

        <!-- Footer -->
        <p class="mt-10 text-center font-numeric text-2xs uppercase tracking-widest text-ink-faint">System Status: Critical &bull; Error Code: 500_INTERNAL_SERVER_ERROR</p>

    </div>

</body>
</html>
