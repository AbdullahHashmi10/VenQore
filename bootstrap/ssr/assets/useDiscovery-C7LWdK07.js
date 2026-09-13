import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useLayoutEffect } from "react";
import { useReducedMotion, motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Check, X, Wrench, Wind, Wallet, UtensilsCrossed, UsersRound, Users, User, Truck, TrendingUp, Timer, Target, Tags, Store, Sparkles, Shuffle, ShoppingCart, ShieldCheck, Search, Scale, ScanBarcode, Route, Rocket, Repeat, Refrigerator, Receipt, Plus, Palette, PackageX, PackageOpen, PackageCheck, Package, NotebookTabs, NotebookPen, MessageSquare, MapPin, Layers, Hash, HandCoins, Hammer, Globe, Gift, FileText, FileStack, FileSignature, Factory, ConciergeBell, Coins, Clock, ClipboardList, ChefHat, ChartLine, CalendarClock, CalendarCheck, Calculator, Building2, Boxes, BadgeCheck, ArrowRight, ArrowLeft, Info, ArrowUp, Lock, ScanLine } from "lucide-react";
import { T as ThinkingOrb } from "./ThinkingOrb-DGYTy5s1.js";
import { C as CookieConsent } from "./CookieConsent-DgIWvNoO.js";
import { u as useMarketingShell } from "./SiteChrome-CBP-bGRL.js";
import NumberFlow from "@number-flow/react";
const BLOBS = [
  { tint: "var(--vq-teal-300)", x: "8%", y: "-6%", size: 46, o: 0.55, d: 34, dx: 4, dy: 3 },
  { tint: "var(--vq-sky-300)", x: "72%", y: "-12%", size: 40, o: 0.42, d: 41, dx: -5, dy: 4 },
  { tint: "var(--vq-lime-300)", x: "84%", y: "46%", size: 34, o: 0.34, d: 37, dx: -3, dy: -5 },
  { tint: "var(--vq-coral-300)", x: "-6%", y: "58%", size: 38, o: 0.3, d: 46, dx: 5, dy: -3 },
  { tint: "var(--vq-butter-300)", x: "38%", y: "84%", size: 32, o: 0.28, d: 29, dx: -4, dy: -4 },
  { tint: "var(--vq-teal-400)", x: "46%", y: "18%", size: 28, o: 0.22, d: 43, dx: 3, dy: 5 }
];
function MeshBackdrop({ intensity = 1 }) {
  const still = useReducedMotion();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "aria-hidden": "true",
      className: "pointer-events-none fixed inset-0 overflow-hidden bg-app",
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-100 dark:opacity-45", children: BLOBS.map((b, i) => /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "absolute rounded-full",
            style: {
              left: b.x,
              top: b.y,
              width: `${b.size}vmax`,
              height: `${b.size}vmax`,
              background: `radial-gradient(circle at 50% 50%, ${b.tint} 0%, transparent 68%)`,
              opacity: b.o * intensity,
              filter: "blur(60px)",
              willChange: still ? void 0 : "transform"
            },
            animate: still ? void 0 : {
              x: [`0%`, `${b.dx}%`, `0%`],
              y: [`0%`, `${b.dy}%`, `0%`],
              scale: [1, 1.08, 1]
            },
            transition: still ? void 0 : {
              duration: b.d,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * -6
            }
          },
          i
        )) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0",
            style: {
              background: "radial-gradient(120% 80% at 50% 0%, transparent 0%, var(--vq-bg) 82%)",
              opacity: 0.72
            }
          }
        ),
        /* @__PURE__ */ jsxs("svg", { className: "absolute inset-0 h-full w-full", style: { opacity: 0.035 }, children: [
          /* @__PURE__ */ jsxs("filter", { id: "vq-builder-grain", children: [
            /* @__PURE__ */ jsx(
              "feTurbulence",
              {
                type: "fractalNoise",
                baseFrequency: "0.82",
                numOctaves: "3",
                stitchTiles: "stitch"
              }
            ),
            /* @__PURE__ */ jsx("feColorMatrix", { type: "saturate", values: "0" })
          ] }),
          /* @__PURE__ */ jsx("rect", { width: "100%", height: "100%", filter: "url(#vq-builder-grain)" })
        ] })
      ]
    }
  );
}
const SPRING$1 = { type: "spring", stiffness: 420, damping: 32, mass: 0.85 };
function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
}
function ThemeSegment({ value, onChange, options, className = "" }) {
  const items = options || [
    { key: "light", label: "Light" },
    { key: "dark", label: "Dark" }
  ];
  return /* @__PURE__ */ jsx(
    "fieldset",
    {
      "aria-label": "Colour theme",
      className: `relative inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-xs ${className}`,
      children: items.map((opt) => {
        const active = opt.key === value;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            "aria-pressed": active,
            onClick: () => onChange(opt.key),
            className: `relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-semibold tracking-wide transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "text-accent-on" : "text-ink-muted hover:text-ink"}`,
            children: [
              active && /* @__PURE__ */ jsx(
                motion.span,
                {
                  layoutId: "vq-theme-pill",
                  transition: SPRING$1,
                  className: "absolute inset-0 rounded-full bg-accent-fill shadow-glow"
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "relative flex items-center gap-1.5", children: [
                opt.icon,
                opt.label
              ] })
            ]
          },
          opt.key
        );
      })
    }
  );
}
const STORAGE_KEY = "vq-builder-theme";
const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: /* @__PURE__ */ jsx(Sun, { size: 13, strokeWidth: 2.4 }) },
  { key: "dark", label: "Dark", icon: /* @__PURE__ */ jsx(Moon, { size: 13, strokeWidth: 2.4 }) }
];
function BuilderShell({
  children,
  step = 0,
  total = 0,
  eyebrow = null,
  onBack = null,
  footer = null,
  wide = false,
  orbState = "breathing",
  /* Public /build-workspace: render the shared site header/footer and let
     ThemeContext (the site-wide toggle) own light/dark instead of the
     builder's private theme segment. In-app surfaces leave this false. */
  siteChrome = false
}) {
  if (siteChrome) {
    return /* @__PURE__ */ jsx(
      PublicBuilderFrame,
      {
        step,
        total,
        eyebrow,
        onBack,
        footer,
        wide,
        orbState,
        children
      }
    );
  }
  return /* @__PURE__ */ jsx(
    AppBuilderFrame,
    {
      step,
      total,
      eyebrow,
      onBack,
      footer,
      wide,
      orbState,
      children
    }
  );
}
function progressPct(step, total) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, step / total)) : 0;
  return Math.round((1 - Math.pow(1 - ratio, 1.8)) * 100);
}
function ProgressRail({ step, total, wide }) {
  if (!(total > 0)) return null;
  const pct = progressPct(step, total);
  return /* @__PURE__ */ jsxs("div", { className: `mx-auto ${wide ? "max-w-[90rem]" : "max-w-4xl"}`, children: [
    /* @__PURE__ */ jsx("progress", { className: "sr-only", "aria-label": "Setup progress", value: pct, max: 100 }),
    /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "h-1.5 overflow-hidden rounded-full bg-sunken", children: /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "h-full rounded-full bg-accent-fill",
        initial: false,
        animate: { width: `${pct}%` },
        transition: { type: "spring", stiffness: 220, damping: 30 }
      }
    ) })
  ] });
}
function PublicBuilderFrame({ children, step, total, eyebrow, onBack, footer, wide, orbState }) {
  useMarketingShell();
  const shellWidth = wide ? "max-w-[90rem]" : "max-w-4xl";
  return /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body relative min-h-screen", style: { background: "var(--vq-bg)", color: "var(--vq-text)" }, children: [
    /* @__PURE__ */ jsx(MeshBackdrop, {}),
    /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsxs("header", { className: "shrink-0 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: `mx-auto flex items-center justify-between gap-3 ${shellWidth}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-2 sm:gap-3", children: [
            onBack ? /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onBack,
                className: "vq-btn vq-btn--secondary vq-btn--sm shrink-0",
                children: "Back"
              }
            ) : null,
            /* @__PURE__ */ jsx(ThinkingOrb, { state: orbState, size: 24, "aria-label": "VenQore AI" }),
            /* @__PURE__ */ jsx("span", { className: "font-display text-sm font-semibold tracking-tight text-ink sm:text-base", children: "VenQore" }),
            eyebrow && /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent hidden truncate md:inline", children: eyebrow })
          ] }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/login",
              className: "shrink-0 text-2xs font-semibold text-ink-secondary underline-offset-4 transition-colors duration-fast ease-standard hover:text-ink hover:underline sm:text-xs",
              children: "Sign in"
            }
          )
        ] }),
        total > 0 && /* @__PURE__ */ jsx("div", { className: "mt-3 sm:mt-4", children: /* @__PURE__ */ jsx(ProgressRail, { step, total, wide }) })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-start px-4 py-5 sm:px-6 sm:py-7 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: `mx-auto w-full ${shellWidth}`, children }) }),
      /* @__PURE__ */ jsx("footer", { className: "shrink-0 px-4 pb-5 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t pt-3 ${shellWidth}`,
          style: { borderColor: "var(--vq-line-soft)", fontSize: "var(--vq-fs-caption)", color: "var(--vq-text-3)" },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Every figure comes from one verified ledger." }),
            footer
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(CookieConsent, {})
  ] });
}
function AppBuilderFrame({
  children,
  step = 0,
  total = 0,
  eyebrow = null,
  onBack = null,
  footer = null,
  wide = false,
  orbState = "breathing"
}) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
    }
    return "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    const previous = {
      dark: root.classList.contains("dark"),
      attr: root.getAttribute("data-theme")
    };
    root.setAttribute("data-vq-shell", "builder");
    return () => {
      root.classList.toggle("dark", previous.dark);
      if (previous.attr) root.setAttribute("data-theme", previous.attr);
      else root.removeAttribute("data-theme");
      root.removeAttribute("data-vq-shell");
    };
  }, []);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  const chooseTheme = (next) => {
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
    }
  };
  const ratio = total > 0 ? Math.min(1, Math.max(0, step / total)) : 0;
  const pct = Math.round((1 - Math.pow(1 - ratio, 1.8)) * 100);
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen text-ink", children: [
    /* @__PURE__ */ jsx(MeshBackdrop, {}),
    /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsxs("header", { className: "shrink-0 px-5 pt-5 sm:px-8 sm:pt-7", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `mx-auto flex items-center justify-between gap-4 ${wide ? "max-w-7xl" : "max-w-6xl"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
                onBack ? /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onBack,
                    className: "flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-2xs font-semibold text-ink-secondary shadow-xs transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                    children: "Back"
                  }
                ) : null,
                /* @__PURE__ */ jsx(
                  ThinkingOrb,
                  {
                    state: orbState,
                    size: 26,
                    "aria-label": "VenQore"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-display text-base font-semibold tracking-tight text-ink", children: "VenQore" }),
                eyebrow && /* @__PURE__ */ jsx("span", { className: "hidden truncate rounded-full border border-line bg-surface px-2.5 py-1 text-3xs font-semibold uppercase tracking-widest text-ink-muted sm:inline", children: eyebrow })
              ] }),
              /* @__PURE__ */ jsx(
                ThemeSegment,
                {
                  value: theme,
                  onChange: chooseTheme,
                  options: THEME_OPTIONS
                }
              )
            ]
          }
        ),
        total > 0 && /* @__PURE__ */ jsxs(
          "div",
          {
            className: `mx-auto mt-5 ${wide ? "max-w-7xl" : "max-w-6xl"}`,
            children: [
              /* @__PURE__ */ jsx(
                "progress",
                {
                  className: "sr-only",
                  "aria-label": "Setup progress",
                  value: pct,
                  max: 100
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  "aria-hidden": "true",
                  className: "h-1.5 overflow-hidden rounded-full bg-sunken",
                  children: /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      className: "h-full rounded-full bg-accent-fill",
                      initial: false,
                      animate: { width: `${pct}%` },
                      transition: {
                        type: "spring",
                        stiffness: 220,
                        damping: 30
                      }
                    }
                  )
                }
              )
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center px-5 py-8 sm:px-8 sm:py-10", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"}`,
          children
        }
      ) }),
      /* @__PURE__ */ jsx("footer", { className: "shrink-0 px-5 pb-6 sm:px-8", children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `mx-auto flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-4 text-3xs text-ink-faint ${wide ? "max-w-7xl" : "max-w-6xl"}`,
          children: [
            /* @__PURE__ */ jsx("span", { children: "Every figure comes from one verified ledger." }),
            footer
          ]
        }
      ) })
    ] })
  ] });
}
function OptionCard({
  name,
  value,
  label,
  hint,
  icon: Icon,
  selected = false,
  multi = false,
  onSelect
}) {
  const hostRef = useRef(null);
  const still = useReducedMotion();
  const [spot, setSpot] = useState({ x: 0, y: 0, on: false });
  const handleMove = useCallback(
    (e) => {
      if (still || !hostRef.current) return;
      const r = hostRef.current.getBoundingClientRect();
      setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
    },
    [still]
  );
  return /* @__PURE__ */ jsxs(
    motion.label,
    {
      ref: hostRef,
      onMouseMove: handleMove,
      onMouseLeave: () => setSpot((s) => ({ ...s, on: false })),
      whileTap: still ? void 0 : { scale: 0.975 },
      animate: still ? void 0 : { scale: selected ? 1.015 : 1 },
      transition: SPRING$1,
      className: `group relative flex h-full w-full cursor-pointer items-start gap-4 overflow-hidden rounded-lg border-2 p-5 text-left transition-colors duration-normal ease-standard has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus sm:p-6 ${selected ? "border-accent bg-accent-quiet shadow-glow" : "border-line bg-surface shadow-sm hover:border-line-strong hover:bg-interactive-hover"}`,
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: multi ? "checkbox" : "radio",
            name: multi ? `${name}[]` : name,
            value,
            checked: selected,
            onChange: () => onSelect(value),
            className: "absolute h-px w-px opacity-0"
          }
        ),
        !still && /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute inset-0 transition-opacity duration-slow ease-standard",
            style: {
              opacity: spot.on && !selected ? 0.5 : 0,
              background: `radial-gradient(220px circle at ${spot.x}px ${spot.y}px, var(--vq-accent-quiet), transparent 72%)`
            }
          }
        ),
        Icon && /* @__PURE__ */ jsx(
          "span",
          {
            className: `relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors duration-normal ease-standard ${selected ? "bg-accent-fill text-accent-on" : "bg-sunken text-ink-muted group-hover:text-accent-text"}`,
            children: /* @__PURE__ */ jsx(Icon, { size: 20, strokeWidth: 1.9 })
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "relative min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("span", { className: "block text-base font-semibold leading-snug text-ink", children: label }),
          hint && /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs leading-normal text-ink-muted", children: hint })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "relative flex h-6 w-6 shrink-0 items-center justify-center", children: [
          /* @__PURE__ */ jsx(
            motion.span,
            {
              initial: false,
              animate: still ? { opacity: selected ? 1 : 0 } : { scale: selected ? 1 : 0.4, opacity: selected ? 1 : 0 },
              transition: SPRING$1,
              className: `flex h-6 w-6 items-center justify-center bg-accent-fill text-accent-on ${multi ? "rounded-xs" : "rounded-full"}`,
              children: /* @__PURE__ */ jsx(Check, { size: 14, strokeWidth: 3 })
            }
          ),
          !selected && /* @__PURE__ */ jsx(
            "span",
            {
              className: `absolute h-5 w-5 border-2 border-line-strong ${multi ? "rounded-xs" : "rounded-full"}`
            }
          )
        ] })
      ]
    }
  );
}
const GLYPHS = {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  Calculator,
  CalendarCheck,
  CalendarClock,
  ChartLine,
  Check,
  ChefHat,
  ClipboardList,
  Clock,
  Coins,
  ConciergeBell,
  Factory,
  FileSignature,
  FileStack,
  FileText,
  Gift,
  Globe,
  Hammer,
  HandCoins,
  Hash,
  Layers,
  MapPin,
  MessageSquare,
  Moon,
  NotebookPen,
  NotebookTabs,
  Package,
  PackageCheck,
  PackageOpen,
  PackageX,
  Palette,
  Plus,
  Receipt,
  Refrigerator,
  Repeat,
  Rocket,
  Route,
  ScanBarcode,
  Scale,
  Search,
  ShieldCheck,
  ShoppingCart,
  Shuffle,
  Sparkles,
  Store,
  Sun,
  Tags,
  Target,
  Timer,
  TrendingUp,
  Truck,
  User,
  Users,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Wind,
  Wrench,
  X
};
const MODULE_GLYPHS = {
  pos: ScanBarcode,
  products: Package,
  inventory: Boxes,
  services: Wrench,
  invoicing: FileText,
  quotations: FileSignature,
  customers: Users,
  suppliers: Factory,
  purchases: ShoppingCart,
  expenses: Receipt,
  reports: ChartLine,
  cookbook: ChefHat,
  table_service: UtensilsCrossed,
  khata_credit: NotebookPen,
  barcodes_labels: Tags,
  staff_attendance: CalendarCheck
};
function glyph(name, fallback = null) {
  if (!name) return fallback;
  return GLYPHS[name] || fallback;
}
function moduleGlyph(moduleKey, iconName = null) {
  return glyph(iconName) || MODULE_GLYPHS[moduleKey] || Layers;
}
const prefersStill = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const asList$1 = (v) => Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
function QuestionStep({
  question,
  value,
  onAnswer,
  onContinue,
  autoAdvance
}) {
  const optionKeys = useMemo(
    () => Object.keys(question?.options || {}),
    [question]
  );
  const isMulti = question?.type === "multi";
  const chosen = asList$1(value);
  const choose = (optionKey) => {
    onAnswer(question.key, optionKey, { multi: isMulti });
    if (isMulti || !autoAdvance) return;
    window.setTimeout(autoAdvance, prefersStill() ? 0 : 460);
  };
  const handlers = useRef({ choose, onContinue, isMulti, optionKeys });
  useEffect(() => {
    handlers.current = { choose, onContinue, isMulti, optionKeys };
  });
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !["radio", "checkbox"].includes(t.getAttribute("type")));
      if (typing) return;
      const h = handlers.current;
      if (e.key === "Enter" && h.isMulti && h.onContinue) {
        e.preventDefault();
        h.onContinue();
        return;
      }
      const digit = Number(e.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > h.optionKeys.length) return;
      e.preventDefault();
      h.choose(h.optionKeys[digit - 1]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  if (!question) return null;
  const meta = question.option_meta || {};
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -14 },
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      className: "w-full",
      children: /* @__PURE__ */ jsxs("fieldset", { children: [
        /* @__PURE__ */ jsxs("legend", { className: "mb-7 flex w-full items-start gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center", children: /* @__PURE__ */ jsx(
            ThinkingOrb,
            {
              state: "listening",
              size: 44,
              "aria-label": ""
            }
          ) }),
          /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("span", { className: "block font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl", children: question.question }),
            question.hint && /* @__PURE__ */ jsx("span", { className: "mt-2 block text-sm leading-relaxed text-ink-secondary", children: question.hint }),
            isMulti && /* @__PURE__ */ jsx("span", { className: "mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-3xs font-semibold uppercase tracking-widest text-ink-muted", children: "Choose as many as apply" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid auto-rows-fr gap-3 sm:grid-cols-2", children: optionKeys.map((optKey, i) => {
          const om = meta[optKey] || {};
          return /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
              transition: {
                duration: 0.34,
                delay: 0.06 * i,
                ease: [0.22, 1, 0.36, 1]
              },
              className: "h-full",
              children: /* @__PURE__ */ jsx(
                OptionCard,
                {
                  name: `vq-q-${question.key}`,
                  value: optKey,
                  label: question.options[optKey],
                  hint: om.hint,
                  icon: glyph(om.icon),
                  multi: isMulti,
                  selected: chosen.includes(optKey),
                  onSelect: choose
                }
              )
            },
            optKey
          );
        }) }),
        question.reassurance && /* @__PURE__ */ jsxs("p", { className: "mt-4 flex items-start gap-2.5 rounded-md border border-line-subtle bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary", children: [
          /* @__PURE__ */ jsx(Info, { size: 14, className: "mt-0.5 shrink-0 text-accent-text" }),
          question.reassurance
        ] }),
        isMulti && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: onContinue,
              className: "inline-flex h-12 items-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              children: [
                "Continue",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ]
            }
          ),
          chosen.length > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
            chosen.length,
            " selected"
          ] }),
          question.optional && chosen.length === 0 && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onContinue,
              className: "text-xs font-semibold text-ink-muted underline-offset-4 transition-colors duration-fast ease-standard hover:text-ink hover:underline",
              children: "None of these — skip"
            }
          )
        ] })
      ] })
    }
  );
}
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : () => {
};
const PromptTextarea = forwardRef(function PromptTextarea2({
  value,
  onChange,
  onSubmit,
  placeholder = "",
  disabled = false,
  busy = false,
  maxLength = 600,
  minRows = 1,
  maxRows = 5,
  size = "md",
  submitLabel = "Send",
  submitText = null,
  submitIcon: SubmitIcon = ArrowUp,
  hint = null,
  id,
  ariaLabel,
  ariaDescribedBy,
  autoFocus = false,
  className = ""
}, forwardedRef) {
  const innerRef = useRef(null);
  const setRefs = useCallback(
    (node) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );
  useIsoLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 24;
    const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const min = line * minRows + pad;
    const max = Math.ceil(line * maxRows + pad);
    el.style.height = "auto";
    const needed = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(needed, min), max)}px`;
    el.style.overflowY = needed > max + 2 ? "auto" : "hidden";
  }, [value, minRows, maxRows, size]);
  const text = value || "";
  const trimmed = text.trim();
  const canSend = !disabled && !busy && trimmed.length > 0;
  const showCount = maxLength && text.length >= Math.floor(maxLength * 0.8);
  const submit = () => {
    if (!canSend) return;
    onSubmit?.(trimmed);
  };
  const onKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent?.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    submit();
  };
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: `vq-prompt-box${size === "lg" ? " vq-prompt-box--lg" : ""}`,
        "data-disabled": disabled ? "true" : void 0,
        onSubmit: (e) => {
          e.preventDefault();
          submit();
        },
        children: [
          /* @__PURE__ */ jsx(
            "textarea",
            {
              ref: setRefs,
              id,
              rows: minRows,
              value: text,
              onChange: (e) => onChange?.(e.target.value.slice(0, maxLength)),
              onKeyDown,
              placeholder,
              disabled,
              maxLength,
              autoFocus,
              "aria-label": ariaLabel,
              "aria-describedby": ariaDescribedBy,
              enterKeyHint: "send",
              className: "vq-prompt-box__input"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "vq-prompt-box__actions", children: [
            showCount ? /* @__PURE__ */ jsxs(
              "span",
              {
                className: "vq-prompt-box__count",
                "data-full": text.length >= maxLength ? "true" : void 0,
                "aria-live": "polite",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Characters used: " }),
                  text.length,
                  "/",
                  maxLength
                ]
              }
            ) : null,
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                className: "vq-btn vq-btn--primary vq-prompt-box__send",
                "data-label": submitText ? "true" : void 0,
                "aria-label": submitText ? void 0 : submitLabel,
                title: submitText ? void 0 : submitLabel,
                "aria-disabled": !canSend ? "true" : void 0,
                disabled: disabled || busy,
                children: [
                  submitText ? /* @__PURE__ */ jsx("span", { children: submitText }) : null,
                  /* @__PURE__ */ jsx(SubmitIcon, { size: 18, strokeWidth: 2.4, "aria-hidden": "true" })
                ]
              }
            )
          ] })
        ]
      }
    ),
    hint ? /* @__PURE__ */ jsx("p", { className: "vq-prompt-box__hint", children: hint }) : null
  ] });
});
const memoryFallback = /* @__PURE__ */ new Map();
function readRaw(key) {
  if (typeof window === "undefined") return memoryFallback.get(key);
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? void 0 : raw;
  } catch (e) {
    return memoryFallback.get(key);
  }
}
function writeRaw(key, raw) {
  if (typeof window === "undefined") {
    memoryFallback.set(key, raw);
    return;
  }
  try {
    window.sessionStorage.setItem(key, raw);
  } catch (e) {
    memoryFallback.set(key, raw);
  }
}
function removeRaw(key) {
  memoryFallback.delete(key);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (e) {
  }
}
function useSessionState(storageKey, fallback) {
  const [value, setValue] = useState(() => {
    const raw = readRaw(storageKey);
    if (raw === void 0) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  });
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    try {
      writeRaw(storageKey, JSON.stringify(value));
    } catch (e) {
    }
  }, [value]);
  const clear = useCallback(() => {
    removeRaw(storageKey);
  }, [storageKey]);
  return [value, setValue, clear];
}
const ROW_SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.8 };
function LiveStack({
  modules = [],
  catalogue = {},
  attribution = {},
  /* module key -> why it is here, written from the visitor's own sentence.
     Present only when the description was actually READ rather than matched
     against a preset; a row with no reason simply shows what the module does,
     which is the honest fallback. See BusinessUnderstanding. */
  reasons = {},
  lastAnswer = null,
  className = ""
}) {
  const still = useReducedMotion();
  const [freshKeys, setFreshKeys] = useState([]);
  const seenRef = useRef(/* @__PURE__ */ new Set());
  const [noOpNote, setNoOpNote] = useState(null);
  useEffect(() => {
    const incoming = modules.filter((k) => !seenRef.current.has(k));
    modules.forEach((k) => seenRef.current.add(k));
    if (incoming.length === 0) return;
    setFreshKeys(incoming);
    const t = window.setTimeout(() => setFreshKeys([]), 2200);
    return () => window.clearTimeout(t);
  }, [modules]);
  useEffect(() => {
    if (!lastAnswer) return;
    const added = modules.filter((k) => attribution[k] === lastAnswer.questionKey);
    if (added.length > 0) {
      setNoOpNote(null);
      return;
    }
    setNoOpNote(lastAnswer.optionLabel);
    const t = window.setTimeout(() => setNoOpNote(null), 2600);
    return () => window.clearTimeout(t);
  }, [lastAnswer]);
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      "aria-live": "polite",
      "aria-label": "Your system so far",
      className: `flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg ${className}`,
      children: [
        /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-sm bg-accent-quiet text-accent-text", children: /* @__PURE__ */ jsx(Layers, { size: 16, strokeWidth: 2 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Building" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold leading-tight text-ink", children: "Your system" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "font-numeric text-2xl font-semibold leading-none text-ink", children: /* @__PURE__ */ jsx(NumberFlow, { value: modules.length }) }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs uppercase tracking-widest text-ink-faint", children: "modules" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-3 py-3", children: /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: modules.map((key) => {
          const entry = catalogue[key] || {};
          const Glyph = moduleGlyph(key, entry.icon);
          const fresh = freshKeys.includes(key);
          const earned = Boolean(attribution[key]);
          return /* @__PURE__ */ jsxs(
            motion.li,
            {
              layout: !still,
              initial: still ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 },
              animate: { opacity: 1, x: 0, scale: 1 },
              exit: still ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.96 },
              transition: ROW_SPRING,
              className: `flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors duration-slow ease-standard ${fresh ? "border-accent bg-accent-quiet" : "border-transparent bg-sunken"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-xs ${fresh ? "bg-accent-fill text-accent-on" : "bg-surface text-ink-muted"}`,
                    children: /* @__PURE__ */ jsx(Glyph, { size: 14, strokeWidth: 2 })
                  }
                ),
                /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "block truncate text-xs font-semibold text-ink", children: entry.label || key.replace(/_/g, " ") }),
                  reasons[key] ? /* @__PURE__ */ jsx("span", { className: "block truncate text-3xs text-accent-text", title: reasons[key], children: reasons[key] }) : entry.description ? /* @__PURE__ */ jsx("span", { className: "block truncate text-3xs text-ink-faint", children: entry.description }) : null
                ] }),
                earned && fresh && /* @__PURE__ */ jsx(
                  motion.span,
                  {
                    initial: { opacity: 0, scale: 0.6 },
                    animate: { opacity: 1, scale: 1 },
                    transition: ROW_SPRING,
                    className: "shrink-0 rounded-full bg-accent-fill px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-on",
                    children: "Added"
                  }
                )
              ]
            },
            key
          );
        }) }) }) }),
        /* @__PURE__ */ jsx(AnimatePresence, { children: noOpNote && /* @__PURE__ */ jsxs(
          motion.p,
          {
            initial: { opacity: 0, height: 0 },
            animate: { opacity: 1, height: "auto" },
            exit: { opacity: 0, height: 0 },
            transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            className: "flex items-start gap-2 overflow-hidden border-t border-line-subtle bg-sunken px-5 py-3 text-2xs leading-relaxed text-ink-secondary",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 13, className: "mt-0.5 shrink-0 text-accent-text" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: noOpNote }),
                " ",
                "— nothing extra needed. Kept lean on purpose."
              ] })
            ]
          }
        ) })
      ]
    }
  );
}
function StackPill({ modules = [], catalogue = {}, justAdded = null, className = "" }) {
  const label = justAdded ? catalogue[justAdded]?.label || justAdded : null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "aria-live": "polite",
      className: `flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sm ${className}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-quiet text-accent-text", children: /* @__PURE__ */ jsx(Layers, { size: 15, strokeWidth: 2 }) }),
        /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("span", { className: "block text-3xs font-semibold uppercase tracking-widest text-ink-muted", children: "Your system" }),
          /* @__PURE__ */ jsx("span", { className: "block h-4 overflow-hidden", children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsx(
            motion.span,
            {
              initial: { y: 12, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              exit: { y: -12, opacity: 0 },
              transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
              className: "block truncate text-xs font-semibold text-ink",
              children: label ? `+ ${label}` : "Building as you answer"
            },
            label || "idle"
          ) }) })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-right", children: [
          /* @__PURE__ */ jsx("span", { className: "block font-numeric text-xl font-semibold leading-none text-ink", children: /* @__PURE__ */ jsx(NumberFlow, { value: modules.length }) }),
          /* @__PURE__ */ jsx("span", { className: "block text-3xs uppercase tracking-widest text-ink-faint", children: "modules" })
        ] })
      ]
    }
  );
}
const SPRING = { type: "spring", stiffness: 400, damping: 34, mass: 0.8 };
function ModuleGrid({
  catalogue = [],
  active = [],
  locked = {},
  onToggle,
  searchable = true
}) {
  const still = useReducedMotion();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = catalogue.filter((m) => {
      if (!q) return true;
      return (m.label || "").toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q) || m.key.toLowerCase().includes(q);
    });
    return [
      ...matched.filter((m) => active.includes(m.key)),
      ...matched.filter((m) => !active.includes(m.key))
    ];
  }, [catalogue, active, query]);
  return /* @__PURE__ */ jsxs("div", { children: [
    searchable && /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
      /* @__PURE__ */ jsx(
        Search,
        {
          size: 15,
          className: "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Search everything VenQore can do…",
          className: "h-11 w-full rounded-md border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
        }
      ),
      query && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setQuery(""),
          "aria-label": "Clear search",
          className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: rows.map((m) => {
      const on = active.includes(m.key);
      const lockReason = locked[m.key];
      const Glyph = moduleGlyph(m.key, m.icon);
      return /* @__PURE__ */ jsxs(
        motion.button,
        {
          layout: !still,
          type: "button",
          disabled: Boolean(lockReason),
          "aria-pressed": on,
          onClick: () => !lockReason && onToggle(m.key),
          initial: { opacity: 0, scale: 0.97 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.97 },
          transition: SPRING,
          title: lockReason || void 0,
          className: `group flex items-start gap-3 rounded-md border p-3.5 text-left transition-colors duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${lockReason ? "cursor-not-allowed border-line-subtle bg-sunken opacity-70" : on ? "border-accent bg-accent-quiet" : "border-line bg-surface hover:border-line-strong hover:bg-interactive-hover"}`,
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-xs ${on ? "bg-accent-fill text-accent-on" : "bg-sunken text-ink-muted"}`,
                children: /* @__PURE__ */ jsx(Glyph, { size: 15, strokeWidth: 2 })
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("span", { className: "block text-xs font-semibold leading-snug text-ink", children: m.label }),
              m.description && /* @__PURE__ */ jsx("span", { className: "mt-0.5 block text-3xs leading-normal text-ink-muted", children: m.description })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "mt-0.5 shrink-0", children: lockReason ? /* @__PURE__ */ jsx(Lock, { size: 13, className: "text-ink-faint" }) : on ? /* @__PURE__ */ jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-accent-fill text-accent-on", children: /* @__PURE__ */ jsx(Check, { size: 11, strokeWidth: 3 }) }) : /* @__PURE__ */ jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-ink-faint transition-colors duration-fast ease-standard group-hover:border-accent group-hover:text-accent-text", children: /* @__PURE__ */ jsx(Plus, { size: 11, strokeWidth: 3 }) }) })
          ]
        },
        m.key
      );
    }) }) }),
    rows.length === 0 && /* @__PURE__ */ jsxs("p", { className: "rounded-md border border-dashed border-line bg-surface px-4 py-8 text-center text-xs text-ink-muted", children: [
      "Nothing matches “",
      query,
      "”. It may be something we do not build yet — tell us below and it goes on the list."
    ] })
  ] });
}
function RecommendedBand({ items, active, onToggle }) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-7 rounded-xl border border-accent bg-accent-quiet p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Sparkles, { size: 14, className: "text-accent-text" }),
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-ink", children: "What we’d suggest on top" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs leading-relaxed text-ink-secondary", children: "Included on every plan, at no extra cost. Tap any of them to switch it on or off." }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-3", children: items.map((m) => {
      const on = active.includes(m.key);
      const Glyph = moduleGlyph(m.key, m.icon);
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          "aria-pressed": on,
          onClick: () => onToggle(m.key),
          className: `flex items-start gap-3 rounded-md border p-3.5 text-left transition-colors duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${on ? "border-accent bg-surface" : "border-line bg-surface opacity-60 hover:opacity-100"}`,
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-xs ${on ? "bg-accent-fill text-accent-on" : "bg-sunken text-ink-muted"}`,
                children: /* @__PURE__ */ jsx(Glyph, { size: 15, strokeWidth: 2 })
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("span", { className: "block text-xs font-semibold text-ink", children: m.label }),
              /* @__PURE__ */ jsx("span", { className: "mt-0.5 block text-3xs leading-normal text-ink-muted", children: m.why })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "mt-0.5 shrink-0", children: on ? /* @__PURE__ */ jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-accent-fill text-accent-on", children: /* @__PURE__ */ jsx(Check, { size: 11, strokeWidth: 3 }) }) : /* @__PURE__ */ jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-ink-faint", children: /* @__PURE__ */ jsx(Plus, { size: 11, strokeWidth: 3 }) }) })
          ]
        },
        m.key
      );
    }) })
  ] });
}
const TIPS = [
  {
    icon: ScanLine,
    title: "Stop typing things in",
    body: "Photograph a supplier bill, a handwritten order slip or a WhatsApp screenshot — even send a voice note — and Smart Capture turns it into a real entry, costed and posted. Your plan includes a monthly allowance for it."
  },
  {
    icon: MessageSquare,
    title: "Just ask",
    body: 'Vena sits in the header. Ask in plain words — "what did I sell last Tuesday", "why is my margin down", "add a card for unpaid invoices" — and it answers from your own ledger rather than sending you to hunt for a report.'
  }
];
function HandoffTips({ className = "" }) {
  return /* @__PURE__ */ jsxs("div", { className: `text-left ${className}`, children: [
    /* @__PURE__ */ jsx("p", { className: "mb-3 text-3xs font-semibold uppercase tracking-widest text-ink-muted", children: "While that finishes — two things worth knowing" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: TIPS.map((tip, i) => /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.4,
          delay: 0.5 + i * 0.35,
          ease: [0.22, 1, 0.36, 1]
        },
        className: "flex items-start gap-3 rounded-lg border border-line bg-surface p-4",
        children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-quiet text-accent-text", children: /* @__PURE__ */ jsx(tip.icon, { size: 17, strokeWidth: 1.9 }) }),
          /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: tip.title }),
            /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs leading-relaxed text-ink-secondary", children: tip.body })
          ] })
        ]
      },
      tip.title
    )) })
  ] });
}
function asList(answer) {
  if (Array.isArray(answer)) return answer;
  if (typeof answer === "string" && answer !== "") return [answer];
  return [];
}
function isAnswered(question, answers) {
  const raw = answers[question.key];
  if (question.type === "multi") return Array.isArray(raw);
  return typeof raw === "string" && raw !== "";
}
function isVisible(question, answers) {
  const rules = question.show_if;
  if (!rules) return true;
  const entries = Object.entries(rules);
  if (entries.length === 0) return true;
  const test = ([depKey, allowed]) => {
    const given = asList(answers[depKey]);
    if (given.length === 0) return false;
    return given.some((v) => allowed.includes(v));
  };
  return question.show_if_mode === "any" ? entries.some(test) : entries.every(test);
}
function appliesTo(question, presetKey) {
  const scope = question.applies_to;
  if (!scope || scope.length === 0) return true;
  return presetKey != null && scope.includes(presetKey);
}
function visibleQuestions(discovery = [], answers = {}, presetKey = null) {
  return (discovery || []).filter(
    (q) => q && q.type !== "text" && q.options && isVisible(q, answers) && appliesTo(q, presetKey)
  );
}
function resolveImplied(discovery = [], answers = {}, presetKey = null) {
  const implied = [];
  const attribution = {};
  for (const q of visibleQuestions(discovery, answers, presetKey)) {
    for (const chosen of asList(answers[q.key])) {
      for (const modKey of q.implies && q.implies[chosen] || []) {
        if (!implied.includes(modKey)) {
          implied.push(modKey);
          attribution[modKey] = q.key;
        }
      }
    }
  }
  return { implied, attribution };
}
function resolveHeadline(discovery = [], answers = {}, presetKey = null) {
  for (const q of discovery || []) {
    if (!q?.headline || !isVisible(q, answers) || !appliesTo(q, presetKey)) continue;
    for (const chosen of asList(answers[q.key])) {
      if (q.headline[chosen]) return q.headline[chosen];
    }
  }
  return "";
}
function useDiscovery(discovery = [], baseModules = [], legalKeys = null, storageKey = null, presetKey = null) {
  const [memoryAnswers, setMemoryAnswers] = useState({});
  const [storedAnswers, setStoredAnswers, forgetStored] = useSessionState(
    storageKey ? `${storageKey}:answers` : "vq-discovery:unused",
    {}
  );
  const answers = storageKey ? storedAnswers : memoryAnswers;
  const setAnswers = storageKey ? setStoredAnswers : setMemoryAnswers;
  const answer = useCallback(
    (questionKey, optionKey, { multi = false } = {}) => {
      setAnswers((prev) => {
        if (!multi) return { ...prev, [questionKey]: optionKey };
        const current = asList(prev[questionKey]);
        return {
          ...prev,
          [questionKey]: current.includes(optionKey) ? current.filter((k) => k !== optionKey) : [...current, optionKey]
        };
      });
    },
    [setAnswers]
  );
  const commitMulti = useCallback((questionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: asList(prev[questionKey])
    }));
  }, [setAnswers]);
  const reset = useCallback(() => {
    setAnswers({});
    if (storageKey) forgetStored();
  }, [setAnswers, storageKey, forgetStored]);
  const forget = useCallback(() => {
    if (storageKey) forgetStored();
  }, [storageKey, forgetStored]);
  const questions = useMemo(
    () => visibleQuestions(discovery, answers, presetKey),
    [discovery, answers, presetKey]
  );
  const { implied, attribution } = useMemo(
    () => resolveImplied(discovery, answers, presetKey),
    [discovery, answers, presetKey]
  );
  const modules = useMemo(() => {
    const merged = [];
    for (const key of [...baseModules || [], ...implied]) {
      if (key && !merged.includes(key)) merged.push(key);
    }
    if (!legalKeys) return merged;
    const legal = new Set(legalKeys);
    return merged.filter((key) => legal.has(key));
  }, [baseModules, implied, legalKeys]);
  const headline = useMemo(
    () => resolveHeadline(discovery, answers, presetKey),
    [discovery, answers, presetKey]
  );
  const answeredCount = questions.filter((q) => isAnswered(q, answers)).length;
  return {
    questions,
    answers,
    answer,
    commitMulti,
    reset,
    forget,
    modules,
    implied,
    attribution,
    headline,
    answeredCount,
    isAnswered: (q) => isAnswered(q, answers),
    isComplete: answeredCount >= questions.length
  };
}
export {
  BuilderShell as B,
  HandoffTips as H,
  LiveStack as L,
  ModuleGrid as M,
  PromptTextarea as P,
  QuestionStep as Q,
  RecommendedBand as R,
  StackPill as S,
  useDiscovery as a,
  useSessionState as u
};
