import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { Check, Sun, Moon, Monitor, Loader2 } from "lucide-react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { h as useAppearance } from "../ssr.js";
import { T as THEME_CATALOG } from "./runtime-DwSFgQZq.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "axios";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "dexie";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "@headlessui/react";
const MODES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor }
];
function Section({ title, description, children }) {
  return /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-line bg-surface p-5 sm:p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-ink", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: description })
    ] }),
    children
  ] });
}
function Segmented({ options, value, onChange, columns = 3 }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "grid gap-2",
      style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` },
      children: options.map((option) => {
        const selected = option.value === value;
        const Icon = option.Icon;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onChange(option.value),
            "aria-pressed": selected,
            className: [
              "flex min-h-control-md flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm transition-colors",
              selected ? "border-brand-500 bg-brand-500/10 text-ink" : "border-line bg-app text-ink-secondary hover:bg-interactive-hover"
            ].join(" "),
            children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 font-medium", children: [
                Icon && /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4", "aria-hidden": "true" }),
                option.label
              ] }),
              option.hint && /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: option.hint })
            ]
          },
          option.value
        );
      })
    }
  );
}
function ColourField({ label, value, fallbackLabel, onChange }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-medium text-ink-secondary", children: label }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line-strong", children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "absolute inset-0",
            style: value ? { backgroundColor: value } : void 0,
            "aria-hidden": "true"
          }
        ),
        !value && /* @__PURE__ */ jsx("span", { className: "absolute inset-0 bg-gradient-brand", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            value: value || "#000000",
            onChange: (event) => onChange(event.target.value),
            className: "absolute inset-0 cursor-pointer opacity-0",
            "aria-label": label
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-ink", children: value || fallbackLabel }),
        value && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onChange(null),
            className: "mt-0.5 text-xs font-medium text-brand-500 hover:underline",
            children: "Reset to theme colour"
          }
        )
      ] })
    ] })
  ] });
}
function Appearance({ canManageStoreDefault, storeSlug }) {
  const { appearance, update, saving } = useAppearance();
  const { props } = usePage();
  const [switching, setSwitching] = useState(false);
  const experience = appearance.experience || "classic";
  const switchExperience = (next) => {
    if (next === experience) return;
    setSwitching(true);
    router.post(
      route("store.appearance.experience", { store_slug: storeSlug }),
      { experience: next },
      { onFinish: () => setSwitching(false) }
    );
  };
  const saveAsStoreDefault = () => {
    router.post(
      route("store.appearance.store-default", { store_slug: storeSlug }),
      {
        // Only what this screen still lets someone change. Font, density
        // and radius are omitted on purpose: the backend pins them to
        // their defaults, and sending them back would persist a value
        // the user has no control over.
        theme: appearance.theme,
        mode: appearance.mode,
        primary: appearance.primary,
        accent: appearance.accent
      },
      { preserveScroll: true }
    );
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Settings", title: "Appearance", children: [
    /* @__PURE__ */ jsx(Head, { title: "Appearance" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6", children: [
      /* @__PURE__ */ jsxs("header", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-ink", children: "Appearance" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "These settings are yours. They follow you to any device you sign in from, and they change nothing about your data or how your business is configured." })
      ] }),
      /* @__PURE__ */ jsx(
        Section,
        {
          title: "Experience",
          description: "Classic is the VenQore you already know. New is a configurable workspace you build from cards. You can move between them whenever you like.",
          children: /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            {
              value: "classic",
              title: "Classic",
              body: "The existing dashboard and layout, unchanged."
            },
            {
              value: "new",
              title: "New",
              body: "A dashboard you arrange yourself, card by card."
            }
          ].map((option) => {
            const selected = option.value === experience;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                disabled: switching,
                onClick: () => switchExperience(option.value),
                className: [
                  "rounded-xl border p-4 text-left transition-colors disabled:opacity-60",
                  selected ? "border-brand-500 bg-brand-500/10" : "border-line bg-app hover:bg-interactive-hover"
                ].join(" "),
                children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-between gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: option.title }),
                    selected && /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-brand-500", "aria-hidden": "true" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "mt-1 block text-sm text-ink-muted", children: option.body })
                ]
              },
              option.value
            );
          }) })
        }
      ),
      /* @__PURE__ */ jsx(
        Section,
        {
          title: "Theme",
          description: "Applies everywhere — the dashboard, POS, reports, every screen.",
          children: /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: THEME_CATALOG.map((theme) => {
            const selected = theme.id === appearance.theme;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => update({ theme: theme.id }),
                className: [
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  selected ? "border-brand-500 bg-brand-500/10" : "border-line bg-app hover:bg-interactive-hover"
                ].join(" "),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "flex shrink-0 overflow-hidden rounded-lg border border-line-strong", children: theme.swatch.map((colour) => /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "h-9 w-4",
                      style: { backgroundColor: colour }
                    },
                    colour
                  )) }),
                  /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "truncate font-medium text-ink", children: theme.name }),
                      selected && /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 shrink-0 text-brand-500", "aria-hidden": "true" })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "mt-0.5 block truncate text-xs text-ink-muted", children: theme.tagline })
                  ] })
                ]
              },
              theme.id
            );
          }) })
        }
      ),
      /* @__PURE__ */ jsx(Section, { title: "Light or dark", description: "System follows your device setting.", children: /* @__PURE__ */ jsx(
        Segmented,
        {
          options: MODES,
          value: appearance.mode,
          onChange: (mode) => update({ mode })
        }
      ) }),
      /* @__PURE__ */ jsx(
        Section,
        {
          title: "Your colours",
          description: "Optional. Leave these alone to use the colours the theme was designed with.",
          children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsx(
              ColourField,
              {
                label: "Primary",
                value: appearance.primary,
                fallbackLabel: "Theme colour",
                onChange: (primary) => update({ primary })
              }
            ),
            /* @__PURE__ */ jsx(
              ColourField,
              {
                label: "Accent",
                value: appearance.accent,
                fallbackLabel: "Theme colour",
                onChange: (accent) => update({ accent })
              }
            )
          ] })
        }
      ),
      canManageStoreDefault && /* @__PURE__ */ jsx(
        Section,
        {
          title: "Store default",
          description: "New team members start with these settings. It never overrides a choice someone has already made for themselves.",
          children: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: saveAsStoreDefault,
              className: "min-h-control-md rounded-xl border border-line bg-app px-4 text-sm font-medium text-ink transition-colors hover:bg-interactive-hover",
              children: "Save my current settings as the store default"
            }
          )
        }
      ),
      props.flash?.success && /* @__PURE__ */ jsx("p", { className: "text-sm text-success-600", children: props.flash.success }),
      /* @__PURE__ */ jsx("p", { className: "flex h-5 items-center gap-2 text-xs text-ink-muted", "aria-live": "polite", children: saving && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin", "aria-hidden": "true" }),
        "Saving…"
      ] }) })
    ] })
  ] });
}
export {
  Appearance as default
};
