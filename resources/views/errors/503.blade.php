<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VenQore &mdash; System Optimization in Progress</title>
    {{-- Local faces. This page renders mid-deploy, when the built asset
         manifest may not exist and the network may not either. --}}
    <link href="/css/offline-fonts.css" rel="stylesheet">
    <style>
        /* ══════════════════════════════════════════════════════════════════
           THE ONE FILE IN THE PRODUCT ALLOWED TO TYPE A COLOUR VALUE.

           DESIGN-RULES §17 is "one place, always": a value is typed into
           resources/css/venqore-v6/tokens/*.css and reaches everything else
           through Tailwind. This page cannot participate in that. It is served
           when the app is down or mid-deploy — `artisan down`, a half-finished
           release, a missing Vite manifest — so it may not @vite anything, may
           not read theme.generated.css, and may not touch the network. The
           header above already committed it to that: /css/offline-fonts.css is
           a fixed path precisely because the hashed bundle may not exist.

           So the values below are COPIES, and each one names the token it was
           copied from. If a token moves, this block is the file to update by
           hand — it is the only one. What it replaced was worse: six literals
           from the pre-teal palette that named no token at all, so the
           maintenance page was the last place in the product still rendering
           the old brand.

           Sources — resources/css/venqore-v6/tokens/
             theme.css       semantic light + dark
             colors.css      the ink and teal ramps those resolve to
             radius.css      the shape ladder
             elevation.css   light shadows
             typography.css  the type scale and the three faces
             motion.css      durations and easing
           ══════════════════════════════════════════════════════════════════ */
        :root {
            color-scheme: light;

            /* theme.css :root */
            --vq-bg: #F1F5F2;                 /* --vq-bg — page, never pure white */
            --vq-surface: #FFFFFF;            /* --vq-surface — the panel that floats */
            --vq-text: #17201B;               /* --vq-text  → colors.css --vq-ink-900 */
            --vq-text-2: #536159;             /* --vq-text-2 → --vq-ink-600 */
            --vq-text-3: #6B7A73;             /* --vq-text-3 → --vq-ink-500, lightest legal text */
            --vq-accent: #0BAA8F;             /* --vq-accent → --vq-teal-500, the identity colour */
            --vq-accent-quiet: #E6FBF5;       /* --vq-accent-quiet → --vq-teal-50 */
            --vq-accent-quiet-line: #93EBD6;  /* --vq-accent-quiet-line → --vq-teal-200 */
            --vq-accent-text: #076B5E;        /* --vq-accent-text → --vq-teal-700, legible on light */
            --vq-line: #D3DCD7;               /* --vq-line → --vq-ink-200 */

            /* elevation.css — level 2, "raised". §8: a border OR a shadow, never both. */
            --vq-elev-2: 0 1px 2px rgb(13 20 18 / .05), 0 10px 24px -10px rgb(13 20 18 / .12);
            /* The one deliberate coloured light in the system (§8), teal-500 tinted. */
            --vq-glow-accent: 0 8px 26px -8px rgb(11 170 143 / .35);

            /* radius.css */
            --vq-r-lg: 20px;   /* card, panel */
            --vq-r-xl: 28px;   /* modal, drawer, big feature tile */

            /* typography.css */
            --vq-font-display: "Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif;
            --vq-font-sans: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
            --vq-font-numeric: "Space Grotesk", ui-monospace, "SF Mono", monospace;

            /* motion.css */
            --vq-dur-3: 320ms;
            --vq-dur-4: 520ms;
            --vq-ease-out: cubic-bezier(.22, 1, .36, 1);
        }

        /*
           Dark is a media query rather than the app's `.dark` class, and that is
           the honest answer here: the class is written by
           resources/js/theme/appearance.js, and on this page there is no React,
           no Inertia payload and possibly no database to read a saved mode from.
           The OS preference is the only signal that survives a deploy. The
           selectors from venqore-v6/tokens/theme.css are honoured too, so if
           anything upstream ever does mark the document the page follows it.
        */
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                color-scheme: dark;
                /* theme.css :root[data-theme="dark"] */
                --vq-bg: #0C1211;
                --vq-surface: #141B19;
                --vq-text: #EDF2EF;
                --vq-text-2: #A8B4AE;
                --vq-text-3: #8B9A93;
                --vq-accent: #23C4A6;                       /* → --vq-teal-400 */
                --vq-accent-quiet: rgb(35 196 166 / .14);
                --vq-accent-quiet-line: rgb(35 196 166 / .28);
                --vq-accent-text: #59DBC0;                  /* → --vq-teal-300 */
                --vq-line: rgb(255 255 255 / .10);
                /* §8: in dark, elevation is surface lightness first, a 1px top
                   highlight second — a black shadow on near-black is invisible. */
                --vq-elev-2: 0 1px 0 rgb(255 255 255 / .05), 0 12px 28px -14px rgb(0 0 0 / .7);
                --vq-glow-accent: 0 8px 26px -8px rgb(35 196 166 / .45);
            }
        }

        :root[data-theme="dark"], html.dark {
            color-scheme: dark;
            --vq-bg: #0C1211;
            --vq-surface: #141B19;
            --vq-text: #EDF2EF;
            --vq-text-2: #A8B4AE;
            --vq-text-3: #8B9A93;
            --vq-accent: #23C4A6;
            --vq-accent-quiet: rgb(35 196 166 / .14);
            --vq-accent-quiet-line: rgb(35 196 166 / .28);
            --vq-accent-text: #59DBC0;
            --vq-line: rgb(255 255 255 / .10);
            --vq-elev-2: 0 1px 0 rgb(255 255 255 / .05), 0 12px 28px -14px rgb(0 0 0 / .7);
            --vq-glow-accent: 0 8px 26px -8px rgb(35 196 166 / .45);
        }

        html {
            /* base.css */
            font-feature-settings: "ss01", "cv11";
            -webkit-text-size-adjust: 100%;
        }

        body {
            margin: 0;
            padding: 2rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
            background: var(--vq-bg);
            font-family: var(--vq-font-sans);
            font-size: 17px;          /* typography.css --vq-fs-body */
            line-height: 1.6;
            letter-spacing: -0.002em;
            color: var(--vq-text);
            -webkit-font-smoothing: antialiased;
        }

        /*
           The two blurred colour clouds that used to sit behind this panel are
           gone. DESIGN-RULES §14 puts ambient background art on the public
           marketing pages and nowhere else; a maintenance screen is the product
           talking to a signed-in operator, not a landing page.
        */
        .container {
            position: relative;
            text-align: center;
            padding: 3rem 2rem;
            max-width: 520px;
            background: var(--vq-surface);
            border-radius: var(--vq-r-xl);
            box-shadow: var(--vq-elev-2);
            animation: fadeIn var(--vq-dur-4) var(--vq-ease-out);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .icon-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: var(--vq-accent-quiet);
            border: 1px solid var(--vq-accent-quiet-line);
            border-radius: var(--vq-r-lg);
            margin-bottom: 2rem;
        }

        .icon-container svg {
            width: 40px;
            height: 40px;
            stroke: var(--vq-accent);
        }

        h1 {
            font-family: var(--vq-font-display);
            font-size: 32px;          /* typography.css --vq-fs-h2 */
            line-height: 1.16;
            letter-spacing: -0.024em;
            font-weight: 600;         /* --vq-fw-semi. §6 caps weight at 700 */
            margin: 0 0 1rem 0;
            color: var(--vq-text);
        }

        p.status {
            font-family: var(--vq-font-numeric);
            font-size: 12px;          /* --vq-fs-eyebrow */
            line-height: 1.2;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 500;
            color: var(--vq-accent-text);
            margin: 0 0 1.25rem 0;
        }

        p.description {
            font-size: 15px;          /* --vq-fs-small */
            line-height: 1.5;
            color: var(--vq-text-2);
            margin: 0 0 2rem 0;
        }

        .spinner {
            display: inline-block;
            width: 2.5rem;
            height: 2.5rem;
            border: 3px solid var(--vq-line);
            border-radius: 50%;
            border-top-color: var(--vq-accent);
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .wait-text {
            font-family: var(--vq-font-numeric);
            font-size: 12px;
            line-height: 1.2;
            font-weight: 500;
            color: var(--vq-text-3);
            margin-top: 0.75rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        /* §9 — motion is opt-out, always. The spinner keeps its meaning as a
           static ring; the entrance simply does not run. */
        @media (prefers-reduced-motion: reduce) {
            .container { animation: none; }
            .spinner { animation: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        </div>

        <h1>Making Things Even Better</h1>
        <p class="status">System Optimization in Progress</p>
        <p class="description">
            {{ $message ?? "We are currently updating our systems to bring you new features and make your experience faster and more robust. Don't worry—your transaction was not posted, so your data remains perfectly safe. Please wait a moment while the update completes." }}
        </p>

        <div class="spinner"></div>
        <div class="wait-text">Please wait...</div>
    </div>
</body>
</html>
