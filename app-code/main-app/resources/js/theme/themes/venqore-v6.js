/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  VenQore V6 — GENERATED FILE, DO NOT EDIT                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Written by `resources/js/theme/build/from-v6-tokens.js` from
 * `resources/css/venqore-v6/tokens/*.css`, which is the V6 design system copied
 * into the app verbatim.
 *
 * To change a colour, radius, duration or spacing value, edit the token CSS and
 * run `npm run theme:from-v6`. Editing this file directly is a mistake: the
 * next build overwrites it, and the token CSS and Tailwind would drift apart
 * again — which is the exact bug this pipeline exists to close.
 *
 * Governed by, in order: VENQORE_LAYOUT_LAW.md v2.0 (geometry) →
 * the V6 token files (values) → DESIGN-RULES.md v3.0 (structure).
 */

export default {
    id: 'venqore-v6',
    name: 'VenQore V6',
    description:
        'The V6 design system. Mint-to-pine teal on green-cast neutrals, soft-and-chunky ' +
        'shape, Bricolage Grotesque over Plus Jakarta Sans with Space Grotesk numerals. ' +
        'Generated from the token files — see from-v6-tokens.js.',
    defaultMode: 'light',

    ramps: {
        teal: {
            50: '230 251 245', 100: '198 245 233', 200: '147 235 214',
            300: '89 219 192', 400: '35 196 166', 500: '11 170 143',
            600: '8 137 117', 700: '7 107 94', 800: '10 80 73',
            900: '11 58 53', 950: '6 36 33',
        },
        ink: {
            50: '241 245 242', 100: '230 236 232', 200: '211 220 215',
            300: '180 192 186', 400: '127 142 135', 500: '98 113 105',
            600: '83 97 89', 700: '60 72 65', 800: '41 51 45',
            900: '23 32 27', 950: '13 20 18',
        },
        lime: {
            50: '248 250 245', 100: '238 249 215', 200: '223 236 203',
            300: '200 238 126', 400: '169 227 75', 500: '140 203 46',
            600: '138 200 45', 700: '94 140 21', 800: '91 128 35',
            900: '70 98 30', 950: '42 57 19',
        },
        coral: {
            50: '251 245 244', 100: '255 232 225', 200: '242 206 197',
            300: '255 174 150', 400: '255 138 107', 500: '242 106 71',
            600: '229 60 16', 700: '185 69 38', 800: '145 44 18',
            900: '110 36 17', 950: '64 23 12',
        },
        butter: {
            50: '251 249 244', 100: '255 243 214', 200: '243 227 196',
            300: '255 221 142', 400: '255 205 91', 500: '245 179 46',
            600: '234 160 11', 700: '166 116 10', 800: '148 104 15',
            900: '112 80 15', 950: '65 47 11',
        },
        sky: {
            50: '245 249 250', 100: '221 242 251', 200: '202 227 236',
            300: '143 217 245', 400: '85 196 236', 500: '43 165 209',
            600: '42 160 203', 700: '27 112 150', 800: '33 104 130',
            900: '28 80 99', 950: '19 47 58',
        },
        plum: {
            50: '249 246 248', 100: '243 237 242', 200: '228 211 226',
            300: '224 180 224', 400: '201 139 201', 500: '178 102 168',
            600: '163 82 152', 700: '126 62 118', 800: '106 57 99',
            900: '81 46 77', 950: '48 28 46',
        },
        success: {
            50: '244 251 248', 100: '228 246 236', 200: '169 224 196',
            300: '160 233 207', 400: '107 230 186', 500: '57 228 167',
            600: '18 133 92', 700: '27 177 123', 800: '26 138 98',
            900: '23 105 75', 950: '16 61 45',
        },
        warning: {
            50: '251 248 244', 100: '255 243 214', 200: '242 208 138',
            300: '239 206 154', 400: '240 184 97', 500: '242 164 43',
            600: '166 105 10', 700: '189 121 15', 800: '147 96 17',
            900: '111 74 16', 950: '65 44 12',
        },
        danger: {
            50: '250 245 245', 100: '253 234 231', 200: '243 183 175',
            300: '222 174 170', 400: '212 131 124', 500: '204 91 82',
            600: '196 68 58', 700: '155 57 49', 800: '122 47 42',
            900: '93 39 35', 950: '54 24 22',
        },
        info: {
            50: '244 248 250', 100: '221 242 251', 200: '168 220 240',
            300: '163 209 230', 400: '112 190 224', 500: '65 173 221',
            600: '27 112 150', 700: '34 128 170', 800: '31 101 133',
            900: '27 78 101', 950: '18 46 59',
        },
        void: {
            50: '246 248 248', 100: '237 242 241', 200: '213 226 222',
            300: '184 208 202', 400: '148 189 177', 500: '114 171 155',
            600: '91 153 136', 700: '77 127 113', 800: '63 100 90',
            900: '13 20 18', 950: '6 10 9',
        },

        // Role aliases. These drive the semantic Tailwind classes
        // (`bg-brand-500`, `text-danger-600`) that new code should use in place
        // of raw pigment names.
        get neutral() { return this["ink"]; },
        get brand() { return this["teal"]; },
        get accent() { return this["teal"]; },
        get highlight() { return this["coral"]; },
    },

    palettes: {
        slate: "ink",
        gray: "ink",
        zinc: "ink",
        neutral: "ink",
        stone: "ink",
        indigo: "teal",
        teal: "teal",
        violet: "plum",
        purple: "plum",
        fuchsia: "plum",
        pink: "plum",
        blue: "sky",
        sky: "sky",
        cyan: "sky",
        emerald: "success",
        green: "success",
        lime: "lime",
        amber: "warning",
        yellow: "warning",
        orange: "coral",
        red: "danger",
        rose: "danger",
        void: "void",
    },

    semantic: {
        light: {
            "bg-app": "#F1F5F2",
            "bg-sunken": "#E6ECE8",
            "bg-surface": "#FFFFFF",
            "bg-raised": "#F8FAF8",
            "bg-overlay": "#FFFFFF",
            "bg-scrim": "#9ea1a0",
            ink: "#17201B",
            "ink-secondary": "#536159",
            "ink-muted": "#627169",
            "ink-faint": "#7F8E87",
            "ink-inverted": "#FFFFFF",
            border: "#D3DCD7",
            "border-strong": "#B4C0BA",
            "border-subtle": "#E6ECE8",
            "interactive-hover": "#F1F5F2",
            "interactive-active": "#E6ECE8",
            "interactive-selected": "#E6FBF5",
            "focus-ring": "#23C4A6",
        },
        dark: {
            "bg-app": "#0C1211",
            "bg-sunken": "#080D0C",
            "bg-surface": "#141B19",
            "bg-raised": "#1A2220",
            "bg-overlay": "#1D2624",
            "bg-scrim": "#060a09",
            ink: "#EDF2EF",
            "ink-secondary": "#A8B4AE",
            "ink-muted": "#8B9A93",
            "ink-faint": "#627169",
            "ink-inverted": "#0C1211",
            border: "#2c3230",
            "border-strong": "#434947",
            "border-subtle": "#222927",
            "interactive-hover": "#1A2220",
            "interactive-active": "#1D2624",
            "interactive-selected": "#16332d",
            "focus-ring": "#59DBC0",
        },
    },

    typography: {
        families: {
            sans: "\"Plus Jakarta Sans\", system-ui, -apple-system, \"Segoe UI\", sans-serif",
            display: "\"Bricolage Grotesque\", \"Plus Jakarta Sans\", system-ui, sans-serif",
            mono: "\"Space Grotesk\", ui-monospace, \"SF Mono\", monospace",
            numeric: "\"Space Grotesk\", ui-monospace, \"SF Mono\", monospace",
        },
        sizes: {
            "4xs": "0.5rem",
            "3xs": "0.5625rem",
            "2xs": "0.625rem",
            "1xs": "0.6875rem",
            xs: ["0.75rem", "1rem"],
            sm: ["0.875rem", "1.5rem"],
            base: ["16px", "1.6"],
            lg: ["1.125rem", "1.75rem"],
            xl: ["21px", "1.30"],
            "2xl": ["1.5rem", "1.25"],
            "3xl": ["30px", "1.16"],
            "4xl": ["38px", "1.0"],
            "5xl": ["40px", "1.08"],
        },
        weights: {
            light: "300",
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
            extrabold: "700",
            black: "700",
        },
        leading: {
            none: "1",
            tight: "1.08",
            snug: "1.30",
            normal: "1.6",
            relaxed: "1.55",
            loose: "2",
        },
        tracking: {
            tighter: "-0.032em",
            tight: "-0.024em",
            normal: "0em",
            wide: "0.025em",
            wider: "0.05em",
            widest: "0.12em",
        },
    },

    shape: {
        radius: {
            none: "0px",
            xs: "8px",
            sm: "12px",
            md: "14px",
            lg: "20px",
            xl: "28px",
            "2xl": "36px",
            "3xl": "36px",
            full: "999px",
        },
        shadow: {
            none: "none",
            xs: "0 1px 2px rgb(13 20 18 / .05), 0 2px 8px -4px rgb(13 20 18 / .06)",
            sm: "0 1px 2px rgb(13 20 18 / .05), 0 2px 8px -4px rgb(13 20 18 / .06)",
            md: "0 1px 2px rgb(13 20 18 / .05), 0 10px 24px -10px rgb(13 20 18 / .12)",
            lg: "0 1px 2px rgb(13 20 18 / .05), 0 10px 24px -10px rgb(13 20 18 / .12)",
            xl: "0 2px 4px rgb(13 20 18 / .06), 0 24px 56px -16px rgb(13 20 18 / .20)",
            "2xl": "0 2px 4px rgb(13 20 18 / .06), 0 24px 56px -16px rgb(13 20 18 / .20)",
            inner: "inset 0 1px 0 rgb(255 255 255 / .55)",
            glow: "0 6px 20px -6px rgb(11 170 143 / .55)",
        },
        border: {
            hairline: "1px",
            thin: "1px",
            thick: "2px",
        },
    },

    density: {
        space: {
            "1": "4px",
            "2": "8px",
            "3": "12px",
            "4": "16px",
            "5": "20px",
            "6": "24px",
            "8": "32px",
            "10": "40px",
            "12": "48px",
            "16": "64px",
            "20": "80px",
            "24": "96px",
            "0.5": "0.125rem",
            "1.5": "0.375rem",
        },
        control: {
            "height-sm": "34px",
            "height-md": "42px",
            "height-lg": "48px",
            "padding-x": "20px",
            gap: "8px",
        },
        layout: {
            gutter: "24px",
            "section-gap": "32px",
            "card-padding": "20px",
            "page-max-width": "1240px",
            "sidebar-width": "264px",
        },
    },

    motion: {
        duration: {
            instant: "0ms",
            fast: "120ms",
            normal: "200ms",
            slow: "320ms",
            slower: "520ms",
        },
        easing: {
            standard: "cubic-bezier(.22, 1, .36, 1)",
            entrance: "cubic-bezier(.32, 1.28, .5, 1)",
            exit: "cubic-bezier(.65, 0, .35, 1)",
            spring: "cubic-bezier(.34, 1.56, .64, 1)",
        },
    },

    gradients: {
        brand: "linear-gradient(135deg, #23C4A6 0%, #0BAA8F 55%, #076B5E 100%)",
        "brand-soft": "linear-gradient(135deg, #C6F5E9, #E6FBF5)",
        hero: "linear-gradient(175deg, #062421 0%, #0A5049 34%, #23C4A6 72%, #E6FBF5 100%)",
        spot: "radial-gradient(60% 70% at 20% 10%, rgb(35 196 166 / .40), transparent 70%), radial-gradient(50% 60% at 85% 80%, rgb(11 58 53 / .35), transparent 70%)",
        aurora: "radial-gradient(60% 70% at 20% 10%, rgb(35 196 166 / .40), transparent 70%), radial-gradient(50% 60% at 85% 80%, rgb(11 58 53 / .35), transparent 70%)",
        warm: "linear-gradient(135deg, #FFCD5B 0%, #FF8A6B 100%)",
        success: "linear-gradient(135deg, #0BAA8F 0%, #076B5E 100%)",
        info: "linear-gradient(135deg, #55C4EC 0%, #1B7096 100%)",
        danger: "linear-gradient(135deg, #FF8A6B 0%, #B94526 100%)",
        "hairline-accent": "linear-gradient(to right, transparent, #0BAA8F, transparent)",
    },
};
