<!DOCTYPE html>
@php($vqAppearance = class_exists(\App\Support\Appearance::class) ? \App\Support\Appearance::forRequest() : ['mode' => 'system'])
@php($vqHtmlAttributes = class_exists(\App\Support\Appearance::class) ? \App\Support\Appearance::htmlAttributes($vqAppearance) : [])
@php($tenant = app()->bound('current.tenant') ? app('current.tenant') : null)
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @foreach($vqHtmlAttributes as $vqAttribute => $vqValue) {{ $vqAttribute }}="{{ $vqValue }}" @endforeach>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 — Page Not Found · VenQore</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link href="/css/offline-fonts.css" rel="stylesheet">
    <style>
        :root {
            color-scheme: light;
            --vq-bg: #F1F5F2;
            --vq-surface: #FFFFFF;
            --vq-card: #FFFFFF;
            --vq-text: #17201B;
            --vq-text-2: #536159;
            --vq-text-3: #6B7A73;
            --vq-accent: #0BAA8F;
            --vq-accent-quiet: #E6FBF5;
            --vq-accent-quiet-line: #93EBD6;
            --vq-accent-text: #076B5E;
            --vq-line: #D3DCD7;
            --vq-line-soft: rgba(0, 0, 0, 0.06);
            --vq-elev-2: 0 1px 2px rgb(13 20 18 / .05), 0 10px 24px -10px rgb(13 20 18 / .12);
            --vq-glow-accent: 0 8px 26px -8px rgb(11 170 143 / .35);
            --vq-r-sm: 8px;
            --vq-r-md: 14px;
            --vq-r-lg: 20px;
            --vq-r-xl: 28px;
            --vq-font-display: "Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif;
            --vq-font-sans: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
            --vq-font-numeric: "Space Grotesk", ui-monospace, "SF Mono", monospace;
            --vq-dur-1: 120ms;
            --vq-dur-2: 200ms;
            --vq-dur-3: 320ms;
            --vq-ease-out: cubic-bezier(.22, 1, .36, 1);
        }

        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                color-scheme: dark;
                --vq-bg: #0C1211;
                --vq-surface: #141B19;
                --vq-card: #141B19;
                --vq-text: #EDF2EF;
                --vq-text-2: #A8B4AE;
                --vq-text-3: #8B9A93;
                --vq-accent: #23C4A6;
                --vq-accent-quiet: rgb(35 196 166 / .14);
                --vq-accent-quiet-line: rgb(35 196 166 / .28);
                --vq-accent-text: #59DBC0;
                --vq-line: rgb(255 255 255 / .10);
                --vq-line-soft: rgb(255 255 255 / .05);
                --vq-elev-2: 0 1px 0 rgb(255 255 255 / .05), 0 12px 28px -14px rgb(0 0 0 / .7);
                --vq-glow-accent: 0 8px 26px -8px rgb(35 196 166 / .45);
            }
        }

        :root[data-theme="dark"], html.dark {
            color-scheme: dark;
            --vq-bg: #0C1211;
            --vq-surface: #141B19;
            --vq-card: #141B19;
            --vq-text: #EDF2EF;
            --vq-text-2: #A8B4AE;
            --vq-text-3: #8B9A93;
            --vq-accent: #23C4A6;
            --vq-accent-quiet: rgb(35 196 166 / .14);
            --vq-accent-quiet-line: rgb(35 196 166 / .28);
            --vq-accent-text: #59DBC0;
            --vq-line: rgb(255 255 255 / .10);
            --vq-line-soft: rgb(255 255 255 / .05);
            --vq-elev-2: 0 1px 0 rgb(255 255 255 / .05), 0 12px 28px -14px rgb(0 0 0 / .7);
            --vq-glow-accent: 0 8px 26px -8px rgb(35 196 166 / .45);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background-color: var(--vq-bg);
            color: var(--vq-text);
            font-family: var(--vq-font-sans);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            position: relative;
            z-index: 1;
            max-width: 520px;
            width: 100%;
            background: var(--vq-surface);
            border: 1px solid var(--vq-line);
            border-radius: var(--vq-r-xl);
            padding: 40px 32px;
            text-align: center;
            box-shadow: var(--vq-elev-2);
            animation: fadeIn var(--vq-dur-3) var(--vq-ease-out);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo-wrap {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            color: var(--vq-text);
            font-weight: 700;
            font-size: 17px;
            letter-spacing: -0.02em;
            margin-bottom: 24px;
        }

        .logo-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--vq-accent);
            box-shadow: 0 0 8px var(--vq-accent);
        }

        .icon-box {
            width: 72px;
            height: 72px;
            border-radius: var(--vq-r-lg);
            background: var(--vq-accent-quiet);
            border: 1px solid var(--vq-accent-quiet-line);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .icon-box svg {
            width: 36px;
            height: 36px;
            color: var(--vq-accent-text);
        }

        .badge-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            font-family: var(--vq-font-numeric);
            font-size: 11.5px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            background: var(--vq-accent-quiet);
            color: var(--vq-accent-text);
            border: 1px solid var(--vq-accent-quiet-line);
            margin-bottom: 16px;
        }

        h1 {
            font-family: var(--vq-font-display);
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.025em;
            color: var(--vq-text);
            margin-bottom: 10px;
            line-height: 1.25;
        }

        .lead-text {
            font-size: 14.5px;
            line-height: 1.55;
            color: var(--vq-text-2);
            margin-bottom: 28px;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        @media (min-width: 480px) {
            .actions {
                flex-direction: row;
            }
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 20px;
            border-radius: var(--vq-r-md);
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all var(--vq-dur-1) ease;
            flex: 1;
            border: none;
        }

        .btn-primary {
            background: var(--vq-accent);
            color: #FFFFFF !important;
            box-shadow: var(--vq-glow-accent);
        }

        .btn-primary:hover {
            opacity: 0.92;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: transparent;
            color: var(--vq-text) !important;
            border: 1px solid var(--vq-line);
        }

        .btn-secondary:hover {
            background: var(--vq-bg);
            border-color: var(--vq-text-3);
        }

        .footer-note {
            margin-top: 24px;
            font-family: var(--vq-font-numeric);
            font-size: 11px;
            color: var(--vq-text-3);
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
    </style>
    <script>
        (function() {
            try {
                var theme = localStorage.getItem('amd_theme') || localStorage.getItem('vq-theme') || localStorage.getItem('vq_theme');
                if (theme === 'light' || theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', theme);
                    if (theme === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                }
            } catch(e) {}
        })();
    </script>
</head>
<body>
    <main class="container">
        <a href="/" class="logo-wrap" aria-label="VenQore Home">
            <span class="logo-dot"></span>
            <span>VenQore</span>
        </a>

        <div class="icon-box" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
        </div>

        <div class="badge-status">
            <span>404</span> &bull; <span>Page Not Found</span>
        </div>

        <h1>Resource Missing</h1>

        <p class="lead-text">
            The page or record you are looking for has been moved, renamed, or is no longer available.
        </p>

        <div class="actions">
            <button type="button" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/'" class="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m12 19-7-7 7-7"/>
                    <path d="M19 12H5"/>
                </svg>
                <span>Go Back</span>
            </button>

            @php($dashboardUrl = $tenant ? '/s/' . $tenant->slug . '/dashboard' : '/')
            <a href="{{ $dashboardUrl }}" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Dashboard</span>
            </a>
        </div>
    </main>

    <div class="footer-note">Error Code: 404_NOT_FOUND &bull; VenQore V6 Engine</div>
</body>
</html>
