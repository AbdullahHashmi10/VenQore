<!DOCTYPE html>
@php($vqAppearance = class_exists(\App\Support\Appearance::class) ? \App\Support\Appearance::forRequest() : ['mode' => 'system'])
@php($vqHtmlAttributes = class_exists(\App\Support\Appearance::class) ? \App\Support\Appearance::htmlAttributes($vqAppearance) : [])
@php($user = auth()->user())
@php($tenant = app()->bound('current.tenant') ? app('current.tenant') : null)
@php($rawMessage = isset($exception) && $exception->getMessage() ? $exception->getMessage() : 'You do not have permission to view or interact with this resource.')
@php(preg_match('/\(([a-zA-Z0-9_\.\s\-]+)\)/', $rawMessage, $permMatches))
@php($requiredPerm = $permMatches[1] ?? null)
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @foreach($vqHtmlAttributes as $vqAttribute => $vqValue) {{ $vqAttribute }}="{{ $vqValue }}" @endforeach>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>403 — Access Denied · VenQore</title>
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
            --vq-warning: #D97706;
            --vq-warning-quiet: #FFFBEB;
            --vq-warning-line: #FDE68A;
            --vq-warning-text: #B45309;
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
                --vq-warning: #F59E0B;
                --vq-warning-quiet: rgb(245 158 11 / .12);
                --vq-warning-line: rgb(245 158 11 / .25);
                --vq-warning-text: #FCD34D;
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
            --vq-warning: #F59E0B;
            --vq-warning-quiet: rgb(245 158 11 / .12);
            --vq-warning-line: rgb(245 158 11 / .25);
            --vq-warning-text: #FCD34D;
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
            background: var(--vq-warning-quiet);
            border: 1px solid var(--vq-warning-line);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .icon-box svg {
            width: 36px;
            height: 36px;
            color: var(--vq-warning-text);
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
            background: var(--vq-warning-quiet);
            color: var(--vq-warning-text);
            border: 1px solid var(--vq-warning-line);
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
            margin-bottom: 24px;
        }

        .permission-card {
            background: var(--vq-bg);
            border: 1px solid var(--vq-line);
            border-radius: var(--vq-r-md);
            padding: 14px 16px;
            margin-bottom: 28px;
            text-align: left;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .permission-card-icon {
            color: var(--vq-text-3);
            margin-top: 2px;
            flex-shrink: 0;
        }

        .permission-card-body {
            flex: 1;
            min-width: 0;
        }

        .permission-card-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--vq-text-3);
            margin-bottom: 4px;
            font-family: var(--vq-font-numeric);
        }

        .permission-card-desc {
            font-size: 13.5px;
            color: var(--vq-text);
            font-weight: 500;
            word-break: break-word;
        }

        .permission-key-tag {
            display: inline-block;
            margin-top: 6px;
            padding: 2px 8px;
            background: var(--vq-surface);
            border: 1px solid var(--vq-line);
            border-radius: 6px;
            font-family: var(--vq-font-numeric);
            font-size: 12px;
            color: var(--vq-accent-text);
            font-weight: 600;
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

        .user-footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--vq-line-soft);
            font-size: 12px;
            color: var(--vq-text-3);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
        }

        .user-tag {
            font-weight: 600;
            color: var(--vq-text-2);
        }

        .footer-note {
            margin-top: 20px;
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
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
        </div>

        <div class="badge-status">
            <span>403</span> &bull; <span>Restricted Area</span>
        </div>

        <h1>Access Denied</h1>

        <p class="lead-text">
            You do not have the required permissions to view or perform actions on this section. Please contact your store administrator or store owner to request access.
        </p>

        @if($rawMessage && $rawMessage !== 'Unauthorized' && $rawMessage !== 'You do not have permission to view or interact with this resource.')
            <div class="permission-card">
                <div class="permission-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="permission-card-body">
                    <div class="permission-card-title">Security Policy Notice</div>
                    <div class="permission-card-desc">{{ $rawMessage }}</div>
                    @if($requiredPerm)
                        <div class="permission-key-tag">Required: {{ $requiredPerm }}</div>
                    @endif
                </div>
            </div>
        @endif

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

        @if($user)
            <div class="user-footer">
                <div>Signed in as: <span class="user-tag">{{ $user->name }}</span></div>
                @if($user->role)
                    <div>Role: <span class="user-tag">{{ ucfirst($user->role) }}</span></div>
                @endif
            </div>
        @endif
    </main>

    <div class="footer-note">Error Code: 403_FORBIDDEN &bull; VenQore V6 Security Guard</div>
</body>
</html>
