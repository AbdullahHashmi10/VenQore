import { l as literalRamp, r as ramp$1, C as CONTROLLED_PALETTES, R as REQUIRED_ROLES, i as SHADES, t as toHex } from "../ssr.js";
const venqoreV6 = {
  id: "venqore-v6",
  name: "VenQore V6",
  description: "The V6 design system. Mint-to-pine teal on green-cast neutrals, soft-and-chunky shape, Bricolage Grotesque over Plus Jakarta Sans with Space Grotesk numerals. Generated from the token files — see from-v6-tokens.js.",
  defaultMode: "light",
  ramps: {
    teal: {
      50: "230 251 245",
      100: "198 245 233",
      200: "147 235 214",
      300: "89 219 192",
      400: "35 196 166",
      500: "11 170 143",
      600: "8 137 117",
      700: "7 107 94",
      800: "10 80 73",
      900: "11 58 53",
      950: "6 36 33"
    },
    ink: {
      50: "241 245 242",
      100: "230 236 232",
      200: "211 220 215",
      300: "180 192 186",
      400: "127 142 135",
      500: "98 113 105",
      600: "83 97 89",
      700: "60 72 65",
      800: "41 51 45",
      900: "23 32 27",
      950: "13 20 18"
    },
    lime: {
      50: "248 250 245",
      100: "238 249 215",
      200: "223 236 203",
      300: "200 238 126",
      400: "169 227 75",
      500: "140 203 46",
      600: "138 200 45",
      700: "94 140 21",
      800: "91 128 35",
      900: "70 98 30",
      950: "42 57 19"
    },
    coral: {
      50: "251 245 244",
      100: "255 232 225",
      200: "242 206 197",
      300: "255 174 150",
      400: "255 138 107",
      500: "242 106 71",
      600: "229 60 16",
      700: "185 69 38",
      800: "145 44 18",
      900: "110 36 17",
      950: "64 23 12"
    },
    butter: {
      50: "251 249 244",
      100: "255 243 214",
      200: "243 227 196",
      300: "255 221 142",
      400: "255 205 91",
      500: "245 179 46",
      600: "234 160 11",
      700: "166 116 10",
      800: "148 104 15",
      900: "112 80 15",
      950: "65 47 11"
    },
    sky: {
      50: "245 249 250",
      100: "221 242 251",
      200: "202 227 236",
      300: "143 217 245",
      400: "85 196 236",
      500: "43 165 209",
      600: "42 160 203",
      700: "27 112 150",
      800: "33 104 130",
      900: "28 80 99",
      950: "19 47 58"
    },
    plum: {
      50: "249 246 248",
      100: "243 237 242",
      200: "228 211 226",
      300: "224 180 224",
      400: "201 139 201",
      500: "178 102 168",
      600: "163 82 152",
      700: "126 62 118",
      800: "106 57 99",
      900: "81 46 77",
      950: "48 28 46"
    },
    success: {
      50: "244 251 248",
      100: "228 246 236",
      200: "169 224 196",
      300: "160 233 207",
      400: "107 230 186",
      500: "57 228 167",
      600: "18 133 92",
      700: "27 177 123",
      800: "26 138 98",
      900: "23 105 75",
      950: "16 61 45"
    },
    warning: {
      50: "251 248 244",
      100: "255 243 214",
      200: "242 208 138",
      300: "239 206 154",
      400: "240 184 97",
      500: "242 164 43",
      600: "166 105 10",
      700: "189 121 15",
      800: "147 96 17",
      900: "111 74 16",
      950: "65 44 12"
    },
    danger: {
      50: "250 245 245",
      100: "253 234 231",
      200: "243 183 175",
      300: "222 174 170",
      400: "212 131 124",
      500: "204 91 82",
      600: "196 68 58",
      700: "155 57 49",
      800: "122 47 42",
      900: "93 39 35",
      950: "54 24 22"
    },
    info: {
      50: "244 248 250",
      100: "221 242 251",
      200: "168 220 240",
      300: "163 209 230",
      400: "112 190 224",
      500: "65 173 221",
      600: "27 112 150",
      700: "34 128 170",
      800: "31 101 133",
      900: "27 78 101",
      950: "18 46 59"
    },
    void: {
      50: "246 248 248",
      100: "237 242 241",
      200: "213 226 222",
      300: "184 208 202",
      400: "148 189 177",
      500: "114 171 155",
      600: "91 153 136",
      700: "77 127 113",
      800: "63 100 90",
      900: "13 20 18",
      950: "6 10 9"
    },
    // Role aliases. These drive the semantic Tailwind classes
    // (`bg-brand-500`, `text-danger-600`) that new code should use in place
    // of raw pigment names.
    get neutral() {
      return this["ink"];
    },
    get brand() {
      return this["teal"];
    },
    get accent() {
      return this["teal"];
    },
    get highlight() {
      return this["coral"];
    }
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
    void: "void"
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
      "focus-ring": "#23C4A6"
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
      "focus-ring": "#59DBC0"
    }
  },
  typography: {
    families: {
      sans: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
      display: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif',
      mono: '"Space Grotesk", ui-monospace, "SF Mono", monospace',
      numeric: '"Space Grotesk", ui-monospace, "SF Mono", monospace'
    },
    sizes: {
      "4xs": "0.5rem",
      "3xs": "0.5625rem",
      "2xs": "0.625rem",
      "1xs": "0.6875rem",
      xs: ["0.75rem", "1rem"],
      sm: ["0.875rem", "1.5rem"],
      base: ["17px", "1.6"],
      lg: ["1.125rem", "1.75rem"],
      xl: ["23px", "1.30"],
      "2xl": ["1.5rem", "1.25"],
      "3xl": ["32px", "1.16"],
      "4xl": ["40px", "1.0"],
      "5xl": ["42px", "1.08"]
    },
    weights: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "700",
      black: "700"
    },
    leading: {
      none: "1",
      tight: "1.08",
      snug: "1.30",
      normal: "1.6",
      relaxed: "1.55",
      loose: "2"
    },
    tracking: {
      tighter: "-0.032em",
      tight: "-0.024em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.12em"
    }
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
      full: "999px"
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
      glow: "0 6px 20px -6px rgb(11 170 143 / .55)"
    },
    border: {
      hairline: "1px",
      thin: "1px",
      thick: "2px"
    }
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
      "1.5": "0.375rem"
    },
    control: {
      "height-sm": "34px",
      "height-md": "42px",
      "height-lg": "48px",
      "padding-x": "20px",
      gap: "8px"
    },
    layout: {
      gutter: "24px",
      "section-gap": "32px",
      "card-padding": "20px",
      "page-max-width": "1240px",
      "sidebar-width": "264px"
    }
  },
  motion: {
    duration: {
      instant: "0ms",
      fast: "120ms",
      normal: "200ms",
      slow: "320ms",
      slower: "520ms"
    },
    easing: {
      standard: "cubic-bezier(.22, 1, .36, 1)",
      entrance: "cubic-bezier(.32, 1.28, .5, 1)",
      exit: "cubic-bezier(.65, 0, .35, 1)",
      spring: "cubic-bezier(.34, 1.56, .64, 1)"
    }
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
    "hairline-accent": "linear-gradient(to right, transparent, #0BAA8F, transparent)"
  }
};
const RAMPS$4 = {
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617"
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712"
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b"
  },
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09"
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a"
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b"
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065"
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764"
  },
  fuchsia: {
    50: "#fdf4ff",
    100: "#fae8ff",
    200: "#f5d0fe",
    300: "#f0abfc",
    400: "#e879f9",
    500: "#d946ef",
    600: "#c026d3",
    700: "#a21caf",
    800: "#86198f",
    900: "#701a75",
    950: "#4a044e"
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554"
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49"
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344"
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e"
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22"
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16"
  },
  lime: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#3f6212",
    900: "#365314",
    950: "#1a2e05"
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006"
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03"
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407"
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a"
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519"
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
    950: "#500724"
  },
  /* ── The Void ──────────────────────────────────────────────────────────
         Midnight Nebula's signature backgrounds, darker than slate-950 (#020617).
         These were previously scattered through the JSX as arbitrary values like
         `bg-[#05030f]` — 287 of them across auth screens, marketing pages and the
         platform shell. Collected here as a proper ramp.
  
         Several near-identical variants were in circulation (#020010, #02000c and
         #02000f differ by at most 3/255 on one channel — invisible) and have been
         collapsed onto the nearest stop. That is a deliberate consolidation, not
         an accident: 20 hand-typed near-blacks were never a design decision.
         ────────────────────────────────────────────────────────────────────── */
  void: {
    50: "#e8e8ef",
    100: "#c9c9d8",
    200: "#9a9ab5",
    300: "#6b6b90",
    400: "#43436a",
    500: "#2a2a48",
    600: "#1e293b",
    700: "#1a1d2e",
    800: "#0f121d",
    900: "#05030f",
    950: "#020010"
  }
};
const PALETTES$1 = {
  slate: "slate",
  gray: "gray",
  zinc: "zinc",
  stone: "stone",
  // `neutral` is the one name that is both a Tailwind family and a role in
  // this system, and the role wins — so `bg-neutral-500` gives the theme's
  // chrome colour rather than Tailwind's stock grey (#737373).
  //
  // Written out explicitly here because the alternative is an accident: the
  // role aliases are spread over the ramps below, so `neutral` would be
  // silently overwritten whether or not anyone intended it. Stating it makes
  // the behaviour deliberate. Nothing in the codebase uses `neutral-*` today,
  // and if something does later, following the theme is the useful answer.
  neutral: "slate",
  indigo: "indigo",
  violet: "violet",
  purple: "purple",
  fuchsia: "fuchsia",
  blue: "blue",
  sky: "sky",
  cyan: "cyan",
  teal: "teal",
  emerald: "emerald",
  green: "green",
  lime: "lime",
  yellow: "yellow",
  amber: "amber",
  orange: "orange",
  red: "red",
  rose: "rose",
  pink: "pink",
  void: "void"
};
const SEMANTIC$4 = {
  light: {
    "bg-app": "#f1f5f9",
    // slate-100 — matches the old --bg-main
    "bg-sunken": "#e2e8f0",
    "bg-surface": "#ffffff",
    "bg-raised": "#f8fafc",
    "bg-overlay": "#ffffff",
    "bg-scrim": "#0f172a",
    ink: "#0f172a",
    "ink-secondary": "#334155",
    "ink-muted": "#475569",
    "ink-faint": "#94a3b8",
    "ink-inverted": "#ffffff",
    border: "#e2e8f0",
    "border-strong": "#cbd5e1",
    "border-subtle": "#f1f5f9",
    "interactive-hover": "#f1f5f9",
    "interactive-active": "#e2e8f0",
    "interactive-selected": "#eef2ff",
    "focus-ring": "#6366f1"
  },
  dark: {
    "bg-app": "#020617",
    // slate-950 — matches the old --bg-main
    "bg-sunken": "#020010",
    "bg-surface": "#0f172a",
    "bg-raised": "#1e293b",
    "bg-overlay": "#1e293b",
    "bg-scrim": "#020010",
    ink: "#f8fafc",
    "ink-secondary": "#e2e8f0",
    "ink-muted": "#94a3b8",
    "ink-faint": "#64748b",
    "ink-inverted": "#0f172a",
    border: "#1e293b",
    "border-strong": "#334155",
    "border-subtle": "#0f172a",
    "interactive-hover": "#1e293b",
    "interactive-active": "#334155",
    "interactive-selected": "#312e81",
    "focus-ring": "#818cf8"
  }
};
const TYPOGRAPHY$1 = {
  families: {
    sans: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    display: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    numeric: "'Figtree', ui-sans-serif, system-ui, -apple-system, sans-serif"
  },
  /**
   * A size is either a bare string (font-size only) or a `[size, lineHeight]`
   * pair.
   *
   * The four micro steps are intentionally bare. They replace arbitrary values
   * like `text-[10px]`, which set font-size and nothing else — so attaching a
   * line-height here would silently reflow ~2,700 elements. Preserving the
   * old behaviour exactly is what makes this migration a safe no-op.
   *
   * The steps from `xs` upward carry Tailwind v3's stock line-heights, which
   * is what those classes already resolved to.
   */
  sizes: {
    "4xs": "0.5rem",
    //  8px — was text-[8px]  ×132
    "3xs": "0.5625rem",
    //  9px — was text-[9px]  ×431
    "2xs": "0.625rem",
    // 10px — was text-[10px] ×1851, the single most common size
    "1xs": "0.6875rem",
    // 11px — was text-[11px] ×237
    xs: ["0.75rem", "1rem"],
    // 12px
    sm: ["0.875rem", "1.25rem"],
    // 14px
    base: ["1rem", "1.5rem"],
    // 16px
    lg: ["1.125rem", "1.75rem"],
    // 18px
    xl: ["1.25rem", "1.75rem"],
    // 20px
    "2xl": ["1.5rem", "2rem"],
    // 24px
    "3xl": ["1.875rem", "2.25rem"],
    // 30px
    "4xl": ["2.25rem", "2.5rem"],
    // 36px
    "5xl": ["3rem", "1"]
    // 48px
  },
  /**
   * `black` (900) is used 2,023 times and `bold` 5,334 times. Weight is
   * currently doing most of the hierarchy work in this UI, which is part of
   * why it reads as loud — but these are the real values, captured as-is.
   */
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900"
  },
  leading: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2"
  },
  tracking: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em"
  }
};
const SHAPE$1 = {
  /**
   * These match Tailwind v3's stock scale exactly, key for key, so
   * `rounded-lg` (1,831 usages) and `rounded-xl` (2,307) render identically to
   * before. `xs` is new and currently unused — it exists so a softer theme has
   * somewhere to put a sub-2px radius.
   *
   * Note there is no DEFAULT here on purpose: bare `rounded` keeps Tailwind's
   * own 0.25rem rather than being silently redefined.
   */
  radius: {
    none: "0px",
    xs: "0.0625rem",
    //  1px  (new)
    sm: "0.125rem",
    //  2px  — Tailwind rounded-sm
    md: "0.375rem",
    //  6px  — Tailwind rounded-md
    lg: "0.5rem",
    //  8px  — Tailwind rounded-lg
    xl: "0.75rem",
    // 12px  — Tailwind rounded-xl
    "2xl": "1rem",
    // 16px
    "3xl": "1.5rem",
    // 24px
    full: "9999px"
  },
  /**
   * Also key-for-key with Tailwind v3. Bare `shadow` is deliberately left
   * alone for the same reason as bare `rounded`.
   */
  shadow: {
    none: "none",
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    // The nebula signature: coloured ambient light rather than plain shadow.
    glow: "0 0 0 1px rgb(99 102 241 / 0.2), 0 10px 40px -10px rgb(99 102 241 / 0.35)"
  },
  border: { hairline: "1px", thin: "1px", thick: "2px" }
};
const DENSITY$1 = {
  space: {
    "0.5": "0.125rem",
    "1": "0.25rem",
    "1.5": "0.375rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem"
  },
  control: {
    "height-sm": "1.75rem",
    // 28px
    "height-md": "2.25rem",
    // 36px
    "height-lg": "2.75rem",
    // 44px
    "padding-x": "0.75rem",
    gap: "0.5rem"
  },
  layout: {
    gutter: "1rem",
    "section-gap": "1.5rem",
    "card-padding": "1rem",
    "page-max-width": "100%",
    "sidebar-width": "16rem"
  }
};
const MOTION$1 = {
  duration: {
    instant: "0ms",
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    slower: "600ms"
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    entrance: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    spring: "cubic-bezier(0.16, 1, 0.3, 1)"
  }
};
const GRADIENTS$1 = {
  brand: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #d946ef 100%)",
  "brand-soft": "linear-gradient(135deg, rgb(99 102 241 / 0.16), rgb(139 92 246 / 0.06))",
  success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  info: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
  danger: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
  // The ambient orbs described in MIDNIGHT_NEBULA_DESIGN.md.
  aurora: "radial-gradient(ellipse at 12% -8%, rgb(99 102 241 / 0.18), transparent 45%), radial-gradient(ellipse at 100% 0%, rgb(139 92 246 / 0.12), transparent 42%)",
  "hairline-accent": "linear-gradient(to right, transparent, #6366f1, transparent)"
};
const midnightNebula = {
  id: "midnight-nebula",
  name: "Midnight Nebula",
  description: "The original VenQore aesthetic. Deep indigo voids, saturated accents, compact density. Captured verbatim as the baseline — switching to it is a no-op.",
  defaultMode: "dark",
  ramps: {
    ...RAMPS$4,
    // Role aliases. These drive the semantic Tailwind classes (`bg-brand-500`,
    // `text-danger-600`) that new code should use in place of raw pigment names.
    neutral: RAMPS$4.slate,
    brand: RAMPS$4.indigo,
    accent: RAMPS$4.violet,
    info: RAMPS$4.blue,
    success: RAMPS$4.emerald,
    warning: RAMPS$4.amber,
    danger: RAMPS$4.red,
    highlight: RAMPS$4.rose
  },
  palettes: PALETTES$1,
  semantic: SEMANTIC$4,
  typography: TYPOGRAPHY$1,
  shape: SHAPE$1,
  density: DENSITY$1,
  motion: MOTION$1,
  gradients: GRADIENTS$1
};
const BASE = {
  /** Chrome: warm grey. Slightly yellow-red rather than blue. */
  neutral: "#7d7770",
  /** Primary: muted slate-blue. Trustworthy without shouting. */
  brand: "#4a6fa5",
  /** Secondary: soft clay. Used for decorative gradients and secondary CTAs. */
  accent: "#9c7b6a",
  /** How much saturation the whole theme carries. 1 = as specified, lower = calmer. */
  chroma: 0.9
};
const NEUTRAL = ramp$1(BASE.neutral, {
  chroma: BASE.chroma,
  // A touch of warmth in the shadows keeps dark mode from going grey-blue.
  hueShift: 6,
  overrides: {
    // Pinned so cards and page backgrounds land on exact, calm values
    // rather than whatever the curve happens to produce.
    50: "#faf9f7",
    100: "#f4f2ef",
    900: "#292623",
    950: "#1a1816"
  }
});
const BRAND = ramp$1(BASE.brand, { chroma: BASE.chroma, hueShift: -8 });
const ACCENT = ramp$1(BASE.accent, { chroma: BASE.chroma });
const SUCCESS = ramp$1("#4f8a5b", { chroma: BASE.chroma });
const WARNING = ramp$1("#c08a3e", { chroma: BASE.chroma });
const DANGER = ramp$1("#b4544a", { chroma: BASE.chroma });
const INFO = ramp$1("#4a7b9d", { chroma: BASE.chroma });
const HIGHLIGHT = ramp$1("#a9647a", { chroma: BASE.chroma });
const VOID = literalRamp(
  {
    50: "#eceae7",
    100: "#d6d2cd",
    200: "#ada79f",
    300: "#847d73",
    400: "#5c564e",
    500: "#403b35",
    600: "#2f2b26",
    700: "#242019",
    800: "#1a1713",
    900: "#12100d",
    950: "#0a0908"
  },
  "daylight-calm void"
);
const RAMPS$3 = {
  neutral: NEUTRAL,
  brand: BRAND,
  accent: ACCENT,
  info: INFO,
  success: SUCCESS,
  warning: WARNING,
  danger: DANGER,
  highlight: HIGHLIGHT,
  void: VOID
};
const PALETTES = {
  // Chrome — all grey families converge on one warm neutral.
  slate: "neutral",
  gray: "neutral",
  zinc: "neutral",
  stone: "neutral",
  neutral: "neutral",
  // Brand.
  indigo: "brand",
  // Decorative / secondary.
  violet: "accent",
  purple: "accent",
  fuchsia: "accent",
  // Informational.
  blue: "info",
  sky: "info",
  cyan: "info",
  teal: "info",
  // Positive.
  emerald: "success",
  green: "success",
  lime: "success",
  // Attention.
  yellow: "warning",
  amber: "warning",
  orange: "warning",
  // Negative.
  red: "danger",
  // Promotional.
  rose: "highlight",
  pink: "highlight",
  void: "void"
};
const SEMANTIC$3 = {
  light: {
    // Off-white rather than pure white: less glare over a long shift.
    "bg-app": "#f4f2ef",
    "bg-sunken": "#ebe8e4",
    "bg-surface": "#ffffff",
    "bg-raised": "#faf9f7",
    "bg-overlay": "#ffffff",
    "bg-scrim": "#292623",
    // Near-black rather than pure black — softer, and still 15:1 on white.
    ink: "#292623",
    "ink-secondary": "#4a453f",
    "ink-muted": "#6b655d",
    "ink-faint": "#9a938a",
    "ink-inverted": "#ffffff",
    border: "#e3dfda",
    "border-strong": "#cbc5bd",
    "border-subtle": "#f0edea",
    "interactive-hover": "#f4f2ef",
    "interactive-active": "#ebe8e4",
    "interactive-selected": "#eaf0f7",
    "focus-ring": "#4a6fa5"
  },
  dark: {
    "bg-app": "#1a1816",
    "bg-sunken": "#12100d",
    "bg-surface": "#242019",
    "bg-raised": "#2f2b26",
    "bg-overlay": "#2f2b26",
    "bg-scrim": "#0a0908",
    ink: "#f4f2ef",
    "ink-secondary": "#ddd8d2",
    "ink-muted": "#a8a19a",
    "ink-faint": "#7d766e",
    "ink-inverted": "#1a1816",
    border: "#332e28",
    "border-strong": "#4a443c",
    "border-subtle": "#242019",
    "interactive-hover": "#2f2b26",
    "interactive-active": "#3b3630",
    "interactive-selected": "#2b3745",
    "focus-ring": "#7d9cc4"
  }
};
const TYPOGRAPHY = {
  families: {
    sans: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    display: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    numeric: "'Figtree', ui-sans-serif, system-ui, sans-serif"
  },
  /**
   * The micro steps get the biggest lift, because they were the worst
   * offenders: 8px and 9px text is below the threshold most people can read
   * comfortably at arm's length, and there were ~560 instances of it.
   *
   * Nothing here drops below 11px, and each micro step now carries an explicit
   * line-height — the old arbitrary values had none, so 10px labels were
   * inheriting whatever leading their parent happened to set.
   */
  sizes: {
    "4xs": ["0.6875rem", "1rem"],
    // 11px  (was 8px)
    "3xs": ["0.6875rem", "1rem"],
    // 11px  (was 9px)
    "2xs": ["0.75rem", "1.125rem"],
    // 12px  (was 10px) — the workhorse label size
    "1xs": ["0.8125rem", "1.25rem"],
    // 13px  (was 11px)
    xs: ["0.8125rem", "1.25rem"],
    // 13px  (was 12px)
    sm: ["0.9375rem", "1.5rem"],
    // 15px  (was 14px)
    base: ["1rem", "1.625rem"],
    // 16px
    lg: ["1.1875rem", "1.875rem"],
    // 19px
    xl: ["1.375rem", "2rem"],
    // 22px
    "2xl": ["1.625rem", "2.25rem"],
    // 26px
    "3xl": ["2rem", "2.5rem"],
    // 32px
    "4xl": ["2.5rem", "3rem"],
    // 40px
    "5xl": ["3.25rem", "1.1"]
    // 52px
  },
  /**
   * Deliberately flattened at the top. `font-bold` appears 2,023 times in
   * this codebase and `font-bold` 5,334 — when almost everything is heavy,
   * nothing reads as emphasised, and the overall impression is shouting.
   *
   * Rather than edit 7,000 class names, this theme redefines what those
   * weights mean: `black` resolves to 700 and `bold` to 600. Hierarchy then
   * comes from size and spacing, which is where it belongs. Push these back up
   * if the result feels too soft.
   */
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "600",
    extrabold: "700",
    black: "700"
  },
  leading: {
    none: "1.1",
    tight: "1.3",
    snug: "1.45",
    normal: "1.6",
    relaxed: "1.75",
    loose: "2.1"
  },
  /**
   * Tightened at the wide end. `tracking-wider` and `tracking-widest` appear
   * 1,150 times, almost always on small uppercase labels — a strong "technical
   * dashboard" signal, and one that actively hurts reading speed at 10px.
   */
  tracking: {
    tighter: "-0.03em",
    tight: "-0.015em",
    normal: "0em",
    wide: "0.015em",
    wider: "0.025em",
    widest: "0.05em"
  }
};
const SHAPE = {
  radius: {
    none: "0px",
    xs: "0.125rem",
    //  2px
    sm: "0.25rem",
    //  4px
    md: "0.5rem",
    //  8px
    lg: "0.6875rem",
    // 11px
    xl: "0.9375rem",
    // 15px
    "2xl": "1.25rem",
    // 20px
    "3xl": "1.75rem",
    // 28px
    full: "9999px"
  },
  shadow: {
    none: "none",
    xs: "0 1px 2px 0 rgb(41 38 35 / 0.04)",
    sm: "0 1px 3px 0 rgb(41 38 35 / 0.06), 0 1px 2px -1px rgb(41 38 35 / 0.04)",
    md: "0 4px 10px -2px rgb(41 38 35 / 0.07), 0 2px 4px -2px rgb(41 38 35 / 0.05)",
    lg: "0 12px 24px -6px rgb(41 38 35 / 0.09), 0 4px 8px -4px rgb(41 38 35 / 0.05)",
    xl: "0 24px 40px -10px rgb(41 38 35 / 0.11), 0 8px 16px -8px rgb(41 38 35 / 0.06)",
    "2xl": "0 32px 64px -16px rgb(41 38 35 / 0.16)",
    inner: "inset 0 1px 3px 0 rgb(41 38 35 / 0.05)",
    glow: "0 0 0 1px rgb(74 111 165 / 0.16), 0 8px 28px -8px rgb(74 111 165 / 0.18)"
  },
  border: { hairline: "1px", thin: "1px", thick: "2px" }
};
const DENSITY = {
  space: {
    "0.5": "0.1875rem",
    "1": "0.3125rem",
    "1.5": "0.4375rem",
    "2": "0.625rem",
    "3": "0.9375rem",
    "4": "1.25rem",
    "5": "1.5rem",
    "6": "1.875rem",
    "8": "2.5rem",
    "10": "3.125rem",
    "12": "3.75rem",
    "16": "5rem",
    "20": "6.25rem",
    "24": "7.5rem"
  },
  control: {
    "height-sm": "2rem",
    // 32px  (was 28px)
    "height-md": "2.625rem",
    // 42px  (was 36px)
    "height-lg": "3.125rem",
    // 50px  (was 44px) — comfortable for touch POS
    "padding-x": "1rem",
    gap: "0.75rem"
  },
  layout: {
    gutter: "1.5rem",
    "section-gap": "2.5rem",
    "card-padding": "1.5rem",
    "page-max-width": "1600px",
    "sidebar-width": "17.5rem"
  }
};
const MOTION = {
  duration: {
    instant: "0ms",
    fast: "180ms",
    normal: "280ms",
    slow: "450ms",
    slower: "700ms"
  },
  easing: {
    standard: "cubic-bezier(0.32, 0.08, 0.24, 1)",
    entrance: "cubic-bezier(0.16, 0.84, 0.28, 1)",
    exit: "cubic-bezier(0.5, 0, 0.84, 0.16)",
    spring: "cubic-bezier(0.22, 1.1, 0.36, 1)"
  }
};
const GRADIENTS = {
  brand: "linear-gradient(135deg, #4a6fa5 0%, #5a7fb0 100%)",
  "brand-soft": "linear-gradient(135deg, rgb(74 111 165 / 0.10), rgb(74 111 165 / 0.02))",
  success: "linear-gradient(135deg, #4f8a5b 0%, #427049 100%)",
  info: "linear-gradient(135deg, #4a7b9d 0%, #4a6fa5 100%)",
  danger: "linear-gradient(135deg, #b4544a 0%, #a04a52 100%)",
  aurora: "radial-gradient(ellipse at 15% -10%, rgb(74 111 165 / 0.07), transparent 50%), radial-gradient(ellipse at 95% 0%, rgb(156 123 106 / 0.05), transparent 45%)",
  "hairline-accent": "linear-gradient(to right, transparent, rgb(74 111 165 / 0.5), transparent)"
};
const daylightCalm = {
  id: "daylight-calm",
  name: "Daylight Calm",
  description: "Warm neutrals, muted slate-blue brand, larger type and noticeably more breathing room. Built for a light-first, non-technical audience.",
  defaultMode: "light",
  ramps: RAMPS$3,
  palettes: PALETTES,
  semantic: SEMANTIC$3,
  typography: TYPOGRAPHY,
  shape: SHAPE,
  density: DENSITY,
  motion: MOTION,
  gradients: GRADIENTS
};
const ROLE_PALETTES = {
  slate: "neutral",
  gray: "neutral",
  zinc: "neutral",
  stone: "neutral",
  neutral: "neutral",
  indigo: "brand",
  violet: "accent",
  purple: "accent",
  fuchsia: "accent",
  blue: "info",
  sky: "info",
  cyan: "info",
  teal: "info",
  emerald: "success",
  green: "success",
  lime: "success",
  yellow: "warning",
  amber: "warning",
  orange: "warning",
  red: "danger",
  rose: "highlight",
  pink: "highlight",
  void: "void"
};
const SYSTEM_SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const FONT_STACKS = {
  inter: `'Inter', ${SYSTEM_SANS}`,
  figtree: `'Figtree', ${SYSTEM_SANS}`,
  system: SYSTEM_SANS,
  grotesk: `'Space Grotesk', ${SYSTEM_SANS}`,
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
};
const BASE_TYPOGRAPHY = {
  families: {
    sans: FONT_STACKS.inter,
    display: FONT_STACKS.inter,
    mono: FONT_STACKS.mono,
    numeric: FONT_STACKS.inter
  },
  sizes: {
    "4xs": ["0.6875rem", "1rem"],
    "3xs": ["0.6875rem", "1rem"],
    "2xs": ["0.75rem", "1.125rem"],
    "1xs": ["0.8125rem", "1.25rem"],
    xs: ["0.8125rem", "1.25rem"],
    sm: ["0.9375rem", "1.5rem"],
    base: ["1rem", "1.625rem"],
    lg: ["1.1875rem", "1.875rem"],
    xl: ["1.375rem", "2rem"],
    "2xl": ["1.625rem", "2.25rem"],
    "3xl": ["2rem", "2.5rem"],
    "4xl": ["2.5rem", "3rem"],
    "5xl": ["3.25rem", "1.1"]
  },
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "600",
    extrabold: "700",
    black: "700"
  },
  leading: {
    none: "1.1",
    tight: "1.3",
    snug: "1.45",
    normal: "1.6",
    relaxed: "1.75",
    loose: "2.1"
  },
  tracking: {
    tighter: "-0.03em",
    tight: "-0.015em",
    normal: "0em",
    wide: "0.015em",
    wider: "0.025em",
    widest: "0.05em"
  }
};
const BASE_SHAPE = {
  radius: {
    none: "0px",
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.625rem",
    xl: "0.875rem",
    "2xl": "1.125rem",
    "3xl": "1.5rem",
    full: "9999px"
  },
  shadow: {
    none: "none",
    xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
    sm: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)",
    md: "0 4px 10px -2px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
    lg: "0 12px 24px -6px rgb(15 23 42 / 0.09), 0 4px 8px -4px rgb(15 23 42 / 0.05)",
    xl: "0 24px 40px -10px rgb(15 23 42 / 0.11), 0 8px 16px -8px rgb(15 23 42 / 0.06)",
    "2xl": "0 32px 64px -16px rgb(15 23 42 / 0.16)",
    inner: "inset 0 1px 3px 0 rgb(15 23 42 / 0.05)",
    glow: "0 0 0 1px rgb(15 23 42 / 0.08), 0 8px 28px -8px rgb(15 23 42 / 0.14)"
  },
  border: { hairline: "1px", thin: "1px", thick: "2px" }
};
const BASE_DENSITY = {
  space: {
    "0.5": "0.15625rem",
    "1": "0.28125rem",
    "1.5": "0.40625rem",
    "2": "0.5625rem",
    "3": "0.875rem",
    "4": "1.125rem",
    "5": "1.40625rem",
    "6": "1.6875rem",
    "8": "2.25rem",
    "10": "2.8125rem",
    "12": "3.375rem",
    "16": "4.5rem",
    "20": "5.625rem",
    "24": "6.75rem"
  },
  control: {
    "height-sm": "1.9375rem",
    "height-md": "2.5rem",
    "height-lg": "3rem",
    "padding-x": "0.9375rem",
    gap: "0.6875rem"
  },
  layout: {
    gutter: "1.375rem",
    "section-gap": "2.25rem",
    "card-padding": "1.375rem",
    "page-max-width": "1600px",
    "sidebar-width": "17rem"
  }
};
const BASE_MOTION = {
  duration: {
    instant: "0ms",
    fast: "160ms",
    normal: "240ms",
    slow: "380ms",
    slower: "600ms"
  },
  easing: {
    standard: "cubic-bezier(0.32, 0.08, 0.24, 1)",
    entrance: "cubic-bezier(0.16, 0.84, 0.28, 1)",
    exit: "cubic-bezier(0.5, 0, 0.84, 0.16)",
    spring: "cubic-bezier(0.22, 1.1, 0.36, 1)"
  }
};
function buildRamps({ bases, chroma = 1, neutralHueShift = 0, neutralOverrides = {}, voidStops }) {
  return {
    neutral: ramp$1(bases.neutral, { chroma, hueShift: neutralHueShift, overrides: neutralOverrides }),
    brand: ramp$1(bases.brand, { chroma }),
    accent: ramp$1(bases.accent, { chroma }),
    info: ramp$1(bases.info, { chroma }),
    success: ramp$1(bases.success, { chroma }),
    warning: ramp$1(bases.warning, { chroma }),
    danger: ramp$1(bases.danger, { chroma }),
    highlight: ramp$1(bases.highlight, { chroma }),
    void: literalRamp(voidStops, "void")
  };
}
const mergeGroup = (base, override) => ({ ...base, ...override || {} });
function composeTheme(spec) {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    defaultMode: spec.defaultMode || "light",
    ramps: spec.ramps,
    palettes: { ...ROLE_PALETTES, ...spec.palettes || {} },
    semantic: spec.semantic,
    typography: {
      families: mergeGroup(BASE_TYPOGRAPHY.families, spec.typography?.families),
      sizes: mergeGroup(BASE_TYPOGRAPHY.sizes, spec.typography?.sizes),
      weights: mergeGroup(BASE_TYPOGRAPHY.weights, spec.typography?.weights),
      leading: mergeGroup(BASE_TYPOGRAPHY.leading, spec.typography?.leading),
      tracking: mergeGroup(BASE_TYPOGRAPHY.tracking, spec.typography?.tracking)
    },
    shape: {
      radius: mergeGroup(BASE_SHAPE.radius, spec.shape?.radius),
      shadow: mergeGroup(BASE_SHAPE.shadow, spec.shape?.shadow),
      border: mergeGroup(BASE_SHAPE.border, spec.shape?.border)
    },
    density: {
      space: mergeGroup(BASE_DENSITY.space, spec.density?.space),
      control: mergeGroup(BASE_DENSITY.control, spec.density?.control),
      layout: mergeGroup(BASE_DENSITY.layout, spec.density?.layout)
    },
    motion: {
      duration: mergeGroup(BASE_MOTION.duration, spec.motion?.duration),
      easing: mergeGroup(BASE_MOTION.easing, spec.motion?.easing)
    },
    gradients: spec.gradients || {}
  };
}
const BASES$2 = {
  neutral: "#71767f",
  brand: "#1d232c",
  accent: "#5b6472",
  info: "#3f6fa8",
  success: "#2f7d54",
  warning: "#b07714",
  danger: "#b23b34",
  highlight: "#7a5aa8"
};
const RAMPS$2 = buildRamps({
  bases: BASES$2,
  chroma: 0.82,
  neutralOverrides: {
    50: "#fafafa",
    100: "#f4f5f6",
    200: "#e6e8ea",
    800: "#252a31",
    900: "#171b21",
    950: "#0e1116"
  },
  voidStops: {
    50: "#eef0f2",
    100: "#d9dde1",
    200: "#b0b7bf",
    300: "#87919c",
    400: "#5e6a78",
    500: "#3d4854",
    600: "#2c343d",
    700: "#1f252c",
    800: "#151a20",
    900: "#0e1116",
    950: "#07090c"
  }
});
const SEMANTIC$2 = {
  light: {
    "bg-app": "#f7f8f8",
    "bg-sunken": "#eef0f1",
    "bg-surface": "#ffffff",
    "bg-raised": "#fafafa",
    "bg-overlay": "#ffffff",
    "bg-scrim": "#171b21",
    ink: "#171b21",
    "ink-secondary": "#3a424c",
    "ink-muted": "#616b77",
    "ink-faint": "#949ca6",
    "ink-inverted": "#ffffff",
    border: "#e4e7e9",
    "border-strong": "#c8cdd2",
    "border-subtle": "#f0f2f3",
    "interactive-hover": "#f4f5f6",
    "interactive-active": "#e9ebed",
    "interactive-selected": "#eceef0",
    "focus-ring": "#1d232c"
  },
  dark: {
    "bg-app": "#0e1116",
    "bg-sunken": "#07090c",
    "bg-surface": "#171b21",
    "bg-raised": "#1f242b",
    "bg-overlay": "#1f242b",
    "bg-scrim": "#07090c",
    ink: "#f4f5f6",
    "ink-secondary": "#d3d7db",
    "ink-muted": "#98a0aa",
    "ink-faint": "#6b747e",
    "ink-inverted": "#0e1116",
    border: "#252b33",
    "border-strong": "#39414b",
    "border-subtle": "#1b2027",
    "interactive-hover": "#1f242b",
    "interactive-active": "#282e37",
    "interactive-selected": "#252b33",
    "focus-ring": "#c8cdd2"
  }
};
const minimal = composeTheme({
  id: "minimal",
  name: "Minimal",
  description: "Near-monochrome chrome, ink-black brand, colour reserved for meaning. The most readable theme and the default for the New Experience.",
  defaultMode: "light",
  ramps: RAMPS$2,
  semantic: SEMANTIC$2,
  typography: {
    families: {
      sans: FONT_STACKS.inter,
      display: FONT_STACKS.inter,
      numeric: FONT_STACKS.inter
    }
  },
  shape: {
    radius: {
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
      "2xl": "1rem",
      "3xl": "1.25rem"
    },
    // Elevation carried by hairlines rather than shadow. Stacked shadows are
    // the fastest way to make a flat, information-dense product look busy.
    shadow: {
      xs: "0 1px 1px 0 rgb(23 27 33 / 0.03)",
      sm: "0 1px 2px 0 rgb(23 27 33 / 0.05)",
      md: "0 2px 6px -2px rgb(23 27 33 / 0.06)",
      lg: "0 8px 18px -6px rgb(23 27 33 / 0.08)",
      xl: "0 16px 30px -10px rgb(23 27 33 / 0.10)",
      "2xl": "0 24px 48px -16px rgb(23 27 33 / 0.14)",
      glow: "0 0 0 1px rgb(23 27 33 / 0.08)"
    }
  },
  gradients: {
    brand: "linear-gradient(135deg, #1d232c 0%, #2c343d 100%)",
    "brand-soft": "linear-gradient(135deg, rgb(29 35 44 / 0.06), rgb(29 35 44 / 0.01))",
    success: "linear-gradient(135deg, #2f7d54 0%, #276645 100%)",
    info: "linear-gradient(135deg, #3f6fa8 0%, #355c8c 100%)",
    danger: "linear-gradient(135deg, #b23b34 0%, #96322c 100%)",
    aurora: "radial-gradient(ellipse at 12% -10%, rgb(29 35 44 / 0.04), transparent 55%)",
    "hairline-accent": "linear-gradient(to right, transparent, rgb(29 35 44 / 0.28), transparent)"
  }
});
const BASES$1 = {
  neutral: "#6b7280",
  brand: "#1447b0",
  accent: "#5b4bb8",
  info: "#0f6fbd",
  success: "#15803d",
  warning: "#b45309",
  danger: "#b91c1c",
  highlight: "#a21caf"
};
const RAMPS$1 = buildRamps({
  bases: BASES$1,
  chroma: 1.06,
  neutralOverrides: {
    50: "#f8f9fa",
    100: "#f1f3f5",
    200: "#e2e5e9",
    700: "#333a44",
    800: "#1f242c",
    900: "#131820",
    950: "#0a0d12"
  },
  voidStops: {
    50: "#eceff3",
    100: "#d5dae1",
    200: "#aab3bf",
    300: "#7f8b9c",
    400: "#57647a",
    500: "#3a4557",
    600: "#2a3242",
    700: "#1d2431",
    800: "#141a24",
    900: "#0d1219",
    950: "#06080c"
  }
});
const SEMANTIC$1 = {
  light: {
    "bg-app": "#eef1f4",
    "bg-sunken": "#e2e6eb",
    "bg-surface": "#ffffff",
    "bg-raised": "#f8f9fa",
    "bg-overlay": "#ffffff",
    "bg-scrim": "#0a0d12",
    // Pure-ish black. This theme's whole promise is contrast.
    ink: "#0d1219",
    "ink-secondary": "#293241",
    "ink-muted": "#4d5665",
    "ink-faint": "#7b8595",
    "ink-inverted": "#ffffff",
    border: "#c9d0d8",
    "border-strong": "#9aa4b1",
    "border-subtle": "#e2e6eb",
    "interactive-hover": "#eef1f4",
    "interactive-active": "#dfe4ea",
    "interactive-selected": "#dbe7fa",
    "focus-ring": "#1447b0"
  },
  dark: {
    "bg-app": "#0d1219",
    "bg-sunken": "#06080c",
    "bg-surface": "#141a24",
    "bg-raised": "#1d2431",
    "bg-overlay": "#1d2431",
    "bg-scrim": "#06080c",
    ink: "#ffffff",
    "ink-secondary": "#dee3ea",
    "ink-muted": "#a3adbb",
    "ink-faint": "#75808f",
    "ink-inverted": "#0d1219",
    border: "#2a3242",
    "border-strong": "#44506380",
    "border-subtle": "#1a212c",
    "interactive-hover": "#1d2431",
    "interactive-active": "#26303f",
    "interactive-selected": "#16305c",
    "focus-ring": "#5b93e8"
  }
};
const classic = composeTheme({
  id: "classic",
  name: "Classic",
  description: "High-contrast, dense, square-cornered business software. Built for long shifts, wide tables and users who prefer conventional ERP chrome.",
  defaultMode: "light",
  ramps: RAMPS$1,
  semantic: SEMANTIC$1,
  typography: {
    families: {
      sans: FONT_STACKS.system,
      display: FONT_STACKS.system,
      numeric: FONT_STACKS.mono
    },
    // One step down from the baseline across the board, floored at 11px.
    sizes: {
      "2xs": ["0.6875rem", "1rem"],
      "1xs": ["0.75rem", "1.125rem"],
      xs: ["0.75rem", "1.125rem"],
      sm: ["0.875rem", "1.375rem"],
      base: ["0.9375rem", "1.5rem"],
      lg: ["1.0625rem", "1.625rem"],
      xl: ["1.25rem", "1.75rem"],
      "2xl": ["1.5rem", "2rem"],
      "3xl": ["1.875rem", "2.25rem"]
    },
    // Restored bold. Where Daylight Calm softens weight to reduce shouting,
    // this theme uses weight as its primary hierarchy signal — it is what
    // traditional ERP chrome does, and the audience reads it as structure.
    weights: {
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "800"
    },
    leading: {
      none: "1.05",
      tight: "1.2",
      snug: "1.35",
      normal: "1.5",
      relaxed: "1.65",
      loose: "1.9"
    }
  },
  shape: {
    radius: {
      xs: "0px",
      sm: "2px",
      md: "3px",
      lg: "4px",
      xl: "5px",
      "2xl": "6px",
      "3xl": "8px"
    },
    shadow: {
      xs: "0 1px 0 0 rgb(13 18 25 / 0.06)",
      sm: "0 1px 2px 0 rgb(13 18 25 / 0.10)",
      md: "0 2px 4px 0 rgb(13 18 25 / 0.12)",
      lg: "0 4px 10px -2px rgb(13 18 25 / 0.16)",
      xl: "0 10px 20px -6px rgb(13 18 25 / 0.20)",
      "2xl": "0 18px 36px -12px rgb(13 18 25 / 0.28)",
      glow: "0 0 0 2px rgb(20 71 176 / 0.35)"
    },
    border: { hairline: "1px", thin: "1px", thick: "2px" }
  },
  density: {
    space: {
      "0.5": "0.125rem",
      "1": "0.25rem",
      "1.5": "0.34375rem",
      "2": "0.46875rem",
      "3": "0.6875rem",
      "4": "0.9375rem",
      "5": "1.1875rem",
      "6": "1.375rem",
      "8": "1.875rem",
      "10": "2.3125rem",
      "12": "2.75rem",
      "16": "3.75rem",
      "20": "4.6875rem",
      "24": "5.625rem"
    },
    control: {
      "height-sm": "1.75rem",
      "height-md": "2.125rem",
      "height-lg": "2.625rem",
      "padding-x": "0.75rem",
      gap: "0.5rem"
    },
    layout: {
      gutter: "1rem",
      "section-gap": "1.5rem",
      "card-padding": "1rem",
      // Uncapped on purpose: this audience wants the whole monitor used.
      "page-max-width": "100%",
      "sidebar-width": "15.5rem"
    }
  },
  motion: {
    // Traditional software does not animate. Fast enough to feel responsive,
    // short enough to feel like nothing moved.
    duration: { instant: "0ms", fast: "90ms", normal: "130ms", slow: "200ms", slower: "300ms" },
    easing: {
      standard: "ease-out",
      entrance: "ease-out",
      exit: "ease-in",
      spring: "ease-out"
    }
  },
  gradients: {
    brand: "linear-gradient(180deg, #2159c9 0%, #1447b0 100%)",
    "brand-soft": "linear-gradient(180deg, rgb(20 71 176 / 0.10), rgb(20 71 176 / 0.03))",
    success: "linear-gradient(180deg, #1a9349 0%, #15803d 100%)",
    info: "linear-gradient(180deg, #1580d4 0%, #0f6fbd 100%)",
    danger: "linear-gradient(180deg, #d02323 0%, #b91c1c 100%)",
    aurora: "none",
    "hairline-accent": "linear-gradient(to right, rgb(20 71 176 / 0.4), rgb(20 71 176 / 0.4))"
  }
});
const BASES = {
  /** Warm taupe-grey. Reads as paper and card stock, not as screen. */
  neutral: "#8a7f78",
  /** Primary: coral. Friendly, energetic, and still legible when filled. */
  brand: "#e05a47",
  /** Secondary: violet. The counterweight that keeps coral from reading as an error state. */
  accent: "#7c5cd6",
  info: "#3f8fbf",
  success: "#3f9d6a",
  warning: "#dd9a2b",
  /** Danger is pulled deliberately away from the coral brand — a destructive
      action must never be mistakable for a primary one. Deep crimson does it. */
  danger: "#c2255c",
  highlight: "#d9528f"
};
const RAMPS = buildRamps({
  bases: BASES,
  chroma: 1.05,
  // Warmth in the shadows so dark mode stays cocoa rather than going blue.
  neutralHueShift: 8,
  neutralOverrides: {
    50: "#fdfaf7",
    100: "#f8f2ec",
    200: "#eee3d9",
    800: "#332b26",
    900: "#241e1a",
    950: "#171310"
  },
  voidStops: {
    50: "#f2ece7",
    100: "#ddd2c9",
    200: "#b8a89c",
    300: "#93806f",
    400: "#6e5b4c",
    500: "#4e3f34",
    600: "#3a2f27",
    700: "#2b231d",
    800: "#1e1815",
    900: "#141010",
    950: "#0a0807"
  }
});
const SEMANTIC = {
  light: {
    "bg-app": "#fdf8f3",
    "bg-sunken": "#f6ece3",
    "bg-surface": "#ffffff",
    "bg-raised": "#fffaf6",
    "bg-overlay": "#ffffff",
    "bg-scrim": "#241e1a",
    ink: "#241e1a",
    "ink-secondary": "#463b34",
    "ink-muted": "#6d5f56",
    "ink-faint": "#9d8d82",
    "ink-inverted": "#ffffff",
    border: "#eee0d4",
    "border-strong": "#d8c4b4",
    "border-subtle": "#f7ede5",
    "interactive-hover": "#fdf3ec",
    "interactive-active": "#f8e9df",
    "interactive-selected": "#fde8e4",
    "focus-ring": "#e05a47"
  },
  dark: {
    "bg-app": "#171310",
    "bg-sunken": "#0a0807",
    "bg-surface": "#241e1a",
    "bg-raised": "#2f2721",
    "bg-overlay": "#2f2721",
    "bg-scrim": "#0a0807",
    ink: "#f8f2ec",
    "ink-secondary": "#e0d5cb",
    "ink-muted": "#ab9a8d",
    "ink-faint": "#7d6e63",
    "ink-inverted": "#171310",
    border: "#342b25",
    "border-strong": "#4c3f36",
    "border-subtle": "#241e1a",
    "interactive-hover": "#2f2721",
    "interactive-active": "#3b322b",
    "interactive-selected": "#43241f",
    "focus-ring": "#f08a79"
  }
};
const colour = composeTheme({
  id: "colour",
  name: "Colour",
  description: "Warm cream surfaces, coral and violet brand pair, rounder corners. Built for cafés, salons, boutiques and lifestyle retail.",
  defaultMode: "light",
  ramps: RAMPS,
  semantic: SEMANTIC,
  typography: {
    families: {
      sans: FONT_STACKS.figtree,
      display: FONT_STACKS.grotesk,
      numeric: FONT_STACKS.figtree
    },
    sizes: {
      sm: ["0.9375rem", "1.5rem"],
      base: ["1rem", "1.6875rem"],
      lg: ["1.25rem", "1.9375rem"],
      xl: ["1.4375rem", "2.0625rem"],
      "2xl": ["1.75rem", "2.375rem"],
      "3xl": ["2.125rem", "2.625rem"]
    },
    tracking: {
      tighter: "-0.035em",
      tight: "-0.02em"
    }
  },
  shape: {
    radius: {
      xs: "0.25rem",
      sm: "0.375rem",
      md: "0.625rem",
      lg: "0.875rem",
      xl: "1.125rem",
      "2xl": "1.5rem",
      "3xl": "2rem"
    },
    // Warm-tinted shadows. A neutral grey shadow over a cream surface reads
    // as dirt; tinting it toward the background keeps the surface clean.
    shadow: {
      xs: "0 1px 2px 0 rgb(36 30 26 / 0.04)",
      sm: "0 2px 4px -1px rgb(36 30 26 / 0.06)",
      md: "0 6px 14px -4px rgb(36 30 26 / 0.09)",
      lg: "0 14px 28px -8px rgb(36 30 26 / 0.12)",
      xl: "0 24px 44px -12px rgb(36 30 26 / 0.15)",
      "2xl": "0 36px 68px -18px rgb(36 30 26 / 0.20)",
      glow: "0 0 0 1px rgb(224 90 71 / 0.22), 0 10px 30px -10px rgb(224 90 71 / 0.28)"
    }
  },
  density: {
    control: {
      "height-sm": "2rem",
      "height-md": "2.625rem",
      // Roomier than the baseline: this theme's audience is very often on a
      // counter-top tablet taking orders with a thumb.
      "height-lg": "3.25rem",
      "padding-x": "1.0625rem",
      gap: "0.75rem"
    },
    layout: {
      gutter: "1.5rem",
      "section-gap": "2.5rem",
      "card-padding": "1.5rem",
      "page-max-width": "1560px",
      "sidebar-width": "17.5rem"
    }
  },
  motion: {
    duration: { instant: "0ms", fast: "180ms", normal: "260ms", slow: "420ms", slower: "650ms" },
    easing: {
      standard: "cubic-bezier(0.34, 0.1, 0.22, 1)",
      entrance: "cubic-bezier(0.18, 0.9, 0.26, 1)",
      exit: "cubic-bezier(0.5, 0, 0.84, 0.16)",
      spring: "cubic-bezier(0.26, 1.3, 0.4, 1)"
    }
  },
  gradients: {
    brand: "linear-gradient(135deg, #e05a47 0%, #d9528f 55%, #7c5cd6 100%)",
    "brand-soft": "linear-gradient(135deg, rgb(224 90 71 / 0.12), rgb(124 92 214 / 0.04))",
    success: "linear-gradient(135deg, #3f9d6a 0%, #2f8256 100%)",
    info: "linear-gradient(135deg, #3f8fbf 0%, #3a6fa8 100%)",
    danger: "linear-gradient(135deg, #c2255c 0%, #a01c4c 100%)",
    aurora: "radial-gradient(ellipse at 10% -12%, rgb(224 90 71 / 0.10), transparent 52%), radial-gradient(ellipse at 92% 4%, rgb(124 92 214 / 0.08), transparent 48%)",
    "hairline-accent": "linear-gradient(to right, transparent, rgb(224 90 71 / 0.55), rgb(124 92 214 / 0.45), transparent)"
  }
});
const ACTIVE_THEME = "venqore-v6";
const AVAILABLE_THEMES = {
  // GENERATED from the V6 token files — see themes/venqore-v6.js.
  "venqore-v6": venqoreV6,
  "midnight-nebula": midnightNebula,
  "daylight-calm": daylightCalm,
  minimal,
  classic,
  colour
};
const THEME_CATALOG = [
  {
    id: "venqore-v6",
    name: "VenQore",
    tagline: "Mint on pine. The V6 design system, light and dark",
    supportsDark: true,
    swatch: ["#F1F5F2", "#0BAA8F", "#0B3A35"]
  }
];
function getActiveTheme() {
  const theme2 = AVAILABLE_THEMES[ACTIVE_THEME];
  if (!theme2) {
    throw new Error(
      `[theme] ACTIVE_THEME is set to "${ACTIVE_THEME}", which is not registered in AVAILABLE_THEMES. Known themes: ${Object.keys(AVAILABLE_THEMES).join(", ")}.`
    );
  }
  return theme2;
}
const theme = getActiveTheme();
function buildScale(rampName) {
  const stops = theme.ramps[rampName];
  const out = {};
  for (const shade of SHADES) out[shade] = toHex(stops[shade]);
  return out;
}
const vq = Object.fromEntries(
  CONTROLLED_PALETTES.map((palette) => [palette, buildScale(theme.palettes[palette])])
);
const role = Object.fromEntries(
  REQUIRED_ROLES.map((name) => [name, buildScale(name)])
);
const gradients = { ...theme.gradients || {} };
const ramp = (name) => buildScale(name);
const SERIES_RAMPS = ["teal", "coral", "sky", "butter", "lime", "plum", "teal", "ink"];
const series = {
  light: SERIES_RAMPS.map((r, i) => ramp(r)[i === 6 ? 900 : i === 7 ? 500 : 600]),
  dark: SERIES_RAMPS.map((r, i) => ramp(r)[i === 6 ? 100 : i === 7 ? 400 : 400])
};
const sequential = {
  light: [100, 300, 500, 700, 900].map((s) => ramp("teal")[s]),
  dark: [900, 700, 500, 300, 100].map((s) => ramp("teal")[s])
};
({
  light: [ramp("danger")[600], ramp("danger")[300], ramp("ink")[100], ramp("teal")[300], ramp("teal")[600]],
  dark: [ramp("danger")[400], ramp("danger")[200], ramp("ink")[800], ramp("teal")[300], ramp("teal")[500]]
});
const semanticHex = {
  light: Object.fromEntries(
    Object.entries(theme.semantic.light).map(([k, v]) => [k, toHex(v)])
  ),
  dark: Object.fromEntries(
    Object.entries(theme.semantic.dark).map(([k, v]) => [k, toHex(v)])
  )
};
function getSemanticTokens(isDarkMode) {
  return isDarkMode ? semanticHex.dark : semanticHex.light;
}
export {
  THEME_CATALOG as T,
  getSemanticTokens as a,
  sequential as b,
  gradients as g,
  role as r,
  series as s,
  vq as v
};
