import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { v as vq } from "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "lucide-react";
import "dexie";
import "react-dom";
import "@headlessui/react";
const PILLS = ["All", "Money", "Stock", "People", "Growth"];
const PILL_FOR_CATEGORY = {
  Business: "Money",
  Customers: "Money",
  Operations: "Stock",
  People: "People",
  Insights: "Growth"
};
function AddCardSheet({ catalog = [], active = [], onAdd, onClose }) {
  const [pill, setPill] = useState("All");
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const visible = useMemo(
    () => catalog.filter((card) => {
      if (active.includes(card.id)) return false;
      if (pill === "All") return true;
      return PILL_FOR_CATEGORY[card.category] === pill;
    }),
    [catalog, active, pill]
  );
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: onClose,
      className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8",
      style: { background: "rgba(22,21,15,.34)", backdropFilter: "blur(2px)" },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: (event) => event.stopPropagation(),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Add a card",
          style: {
            width: 520,
            maxWidth: "100%",
            background: vq.slate[50],
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,.22)"
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { padding: "22px 24px 20px", background: "#fff" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        font: "500 17px 'Instrument Sans',sans-serif",
                        color: "#16150f",
                        letterSpacing: "-.01em"
                      },
                      children: "Add a card"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        font: "400 12.5px 'Instrument Sans',sans-serif",
                        color: "#8b877a",
                        marginTop: 3
                      },
                      children: "Pick what matters to you. Drag to reorder later."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    "aria-label": "Close",
                    className: "flex items-center justify-center",
                    style: {
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#f1efe9",
                      color: "#6f6c61",
                      font: "400 14px 'Instrument Sans',sans-serif",
                      flex: "none"
                    },
                    children: "×"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: PILLS.map((label) => {
                const on = label === pill;
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setPill(label),
                    style: {
                      padding: "6px 12px",
                      borderRadius: 99,
                      background: on ? "#16150f" : "#f1efe9",
                      color: on ? "#fff" : "#6f6c61",
                      font: "500 12px 'Instrument Sans',sans-serif"
                    },
                    children: label
                  },
                  label
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "grid gap-2.5",
                style: { padding: "16px 24px 24px", gridTemplateColumns: "repeat(2,minmax(0,1fr))" },
                children: [
                  visible.map((card) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => onAdd?.(card.id),
                      className: "text-left",
                      style: {
                        background: "#fff",
                        border: "1px solid #e6e3da",
                        borderRadius: 12,
                        padding: "14px 15px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6
                      },
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                          /* @__PURE__ */ jsx("span", { style: { font: "500 13px 'Instrument Sans',sans-serif", color: "#16150f" }, children: card.title }),
                          /* @__PURE__ */ jsx(
                            "span",
                            {
                              className: "flex items-center justify-center",
                              style: {
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                background: "#f1efe9",
                                color: "#6f6c61",
                                font: "400 13px 'Instrument Sans',sans-serif",
                                flex: "none"
                              },
                              children: "+"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              font: "400 11.5px/1.4 'Instrument Sans',sans-serif",
                              color: "#8b877a"
                            },
                            children: card.description
                          }
                        )
                      ]
                    },
                    card.id
                  )),
                  visible.length === 0 && /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "col-span-2 text-center",
                      style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#8b877a", padding: "18px 0" },
                      children: "Everything here is already on your dashboard."
                    }
                  )
                ]
              }
            )
          ]
        }
      )
    }
  );
}
function useMoney(currency) {
  return useMemo(() => {
    const symbol = currency?.symbol || "Rs";
    return (value, { compact = false } = {}) => {
      const number = Number(value ?? 0);
      if (!Number.isFinite(number)) return `${symbol} 0`;
      const body = compact && Math.abs(number) >= 1e3 ? `${Math.round(number / 100) / 10}k` : Math.round(number).toLocaleString("en-IN");
      return `${symbol} ${body}`;
    };
  }, [currency?.symbol]);
}
const dayLabel = (date = /* @__PURE__ */ new Date()) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
function greeting(date = /* @__PURE__ */ new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
function RevenueChart({ points }) {
  const W = 820;
  const H = 196;
  const { line, area, profitLine, peak } = useMemo(() => {
    const series = Array.isArray(points) ? points : [];
    if (series.length < 2) return {};
    const revenues = series.map((p) => Number(p.revenue) || 0);
    const profits = series.map((p) => Number(p.profit) || 0);
    const ceiling = Math.max(...revenues, ...profits, 1);
    const x = (i) => i / (series.length - 1) * W;
    const y = (v) => H - 20 - v / ceiling * (H - 50);
    const path = (values) => values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const peakIndex = revenues.indexOf(Math.max(...revenues));
    return {
      line: path(revenues),
      area: `${path(revenues)} L${W} ${H} L0 ${H} Z`,
      profitLine: path(profits),
      peak: { x: x(peakIndex), y: y(revenues[peakIndex]) }
    };
  }, [points]);
  if (!line) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-[212px] items-center justify-center text-[13px]", style: { color: "#a9a596" }, children: "Not enough history yet — this fills in as you record sales." });
  }
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: "none",
      style: { width: "100%", height: 212, marginTop: 14, display: "block" },
      children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vq-rev", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0", stopColor: "#16150f", stopOpacity: ".14" }),
          /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "#16150f", stopOpacity: "0" })
        ] }) }),
        [40, 95, 150].map((y) => /* @__PURE__ */ jsx("line", { x1: "0", y1: y, x2: W, y2: y, stroke: "#efece4" }, y)),
        /* @__PURE__ */ jsx("line", { x1: "0", y1: H - 4, x2: W, y2: H - 4, stroke: "#e6e3da" }),
        /* @__PURE__ */ jsx("path", { d: area, fill: "url(#vq-rev)" }),
        /* @__PURE__ */ jsx("path", { d: line, fill: "none", stroke: "#16150f", strokeWidth: "2", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("path", { d: profitLine, fill: "none", stroke: "#8fbfa9", strokeWidth: "2", strokeLinecap: "round" }),
        peak && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("circle", { cx: peak.x, cy: peak.y, r: "4.5", fill: "#16150f" }),
          /* @__PURE__ */ jsx("circle", { cx: peak.x, cy: peak.y, r: "9", fill: "none", stroke: "#16150f", strokeOpacity: ".2" })
        ] })
      ]
    }
  );
}
function StatCard({ label, value, footnote, tone = "muted" }) {
  const colours = { muted: "#8b877a", good: "#0e6b4f", warn: "#b4600a" };
  return /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 14, padding: "16px 18px" }, children: [
    /* @__PURE__ */ jsx("div", { style: { font: "400 12px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: label }),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          font: "500 22px 'Instrument Sans',sans-serif",
          color: "#16150f",
          marginTop: 5,
          letterSpacing: "-.02em"
        },
        children: value
      }
    ),
    footnote && /* @__PURE__ */ jsx("div", { style: { font: "400 11.5px 'Instrument Sans',sans-serif", color: colours[tone], marginTop: 4 }, children: footnote })
  ] });
}
function Panel({ title, action, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 14, padding: "18px 20px" }, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { style: { font: "500 13.5px 'Instrument Sans',sans-serif", color: "#16150f" }, children: title }),
      action && /* @__PURE__ */ jsx("span", { style: { font: "500 12px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: action })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3.5 flex flex-col gap-3", children })
  ] });
}
const RAIL_ICONS = [
  { d: "M2.2 2.2h4.6v4.6H2.2zM9.2 2.2h4.6v4.6H9.2zM2.2 9.2h4.6v4.6H2.2zM9.2 9.2h4.6v4.6H9.2z", name: "Overview", route: null },
  { d: "M2.5 6.5L8 2.5l5.5 4v6.2a.8.8 0 01-.8.8H3.3a.8.8 0 01-.8-.8z", name: "Home", route: "store.dashboard" },
  { d: "M2.5 3h2l1.6 7.2h6.2l1.2-5H5", name: "Sales", route: "store.pos" },
  { d: "M2.6 5.4L8 2.6l5.4 2.8v5.2L8 13.4 2.6 10.6z", name: "Stock", route: "store.inventory.dashboard" },
  { d: "M2.2 13c.5-2.2 2-3.4 3.8-3.4S9.3 10.8 9.8 13", name: "People", route: null },
  { d: "M2.4 11.4l3.4-4 2.6 2.4 5.2-6", name: "Reports", route: null }
];
function Overview({ hero, extras, catalog, greetingName, storeName, currency }) {
  const { props } = usePage();
  const storeSlug = props.store?.slug;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [period, setPeriod] = useState("Month");
  const money = useMoney(currency);
  const value = (id) => hero?.[id]?.ok ? hero[id].data : null;
  const trend = value("revenue_trend");
  const cash = value("cash_position");
  const needs = value("needs_attention");
  const receivables = value("receivables");
  const payables = value("payables");
  const stock = value("inventory_value");
  const profit = value("net_profit");
  const products = value("top_products");
  const initials = (greetingName || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const to = (name) => storeSlug && name ? route(name, { store_slug: storeSlug }) : null;
  const addCard = (id) => {
    if (!storeSlug) return;
    router.post(
      route("store.workspace.layout.save", { store_slug: storeSlug }),
      { layout: [...extras || [], id].map((widget, i) => ({ widget, x: 0, y: i, size: "medium" })) },
      { preserveScroll: true, onSuccess: () => setSheetOpen(false) }
    );
  };
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: vq.slate[50] }, children: [
    /* @__PURE__ */ jsx(Head, { title: "Overview" }),
    /* @__PURE__ */ jsx("style", { children: `
                @media (max-width: 900px) {
                    #vq-hero-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-stat-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
                    #vq-more-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-canvas    { padding: 18px 16px 32px !important; }
                }
` }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center gap-5 px-4 sm:px-7",
        style: {
          padding: "14px 28px",
          background: "rgba(255,255,255,.86)",
          borderBottom: "1px solid #e6e3da",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 20
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex items-center justify-center",
                style: {
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: "#16150f",
                  color: "#fff",
                  font: "600 12px 'Instrument Sans',sans-serif"
                },
                children: (storeName || "M")[0].toUpperCase()
              }
            ),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "hidden truncate sm:block",
                style: { font: "600 14px 'Instrument Sans',sans-serif", color: "#16150f", maxWidth: 220 },
                children: storeName
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "hidden flex-1 items-center gap-2.5 md:flex",
              style: {
                maxWidth: 420,
                height: 34,
                padding: "0 12px",
                borderRadius: 9,
                background: "#efedE7",
                border: "1px solid #e6e3da"
              },
              children: [
                /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "#9a9689", strokeWidth: "1.5", children: [
                  /* @__PURE__ */ jsx("circle", { cx: "6.2", cy: "6.2", r: "4.2" }),
                  /* @__PURE__ */ jsx("path", { d: "M9.4 9.4L12.5 12.5" })
                ] }),
                /* @__PURE__ */ jsx("span", { style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#9a9689" }, children: "Search invoices, products, people" }),
                /* @__PURE__ */ jsx("span", { style: { marginLeft: "auto", font: "400 10.5px ui-monospace,monospace", color: "#b3af9f" }, children: "⌘K" })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "ml-auto flex items-center gap-3.5", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex items-center justify-center",
              style: {
                width: 28,
                height: 28,
                borderRadius: 99,
                background: "#dfe7e2",
                border: "1px solid #cdd8d2",
                font: "600 11px 'Instrument Sans',sans-serif",
                color: "#0e6b4f"
              },
              children: initials
            }
          ) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-stretch", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "hidden flex-none flex-col items-center gap-1.5 sm:flex",
          style: {
            width: 60,
            background: "#f0eee8",
            borderRight: "1px solid #e6e3da",
            padding: "16px 0",
            minHeight: "calc(100vh - 63px)"
          },
          children: RAIL_ICONS.map((icon, i) => {
            const href = to(icon.route);
            const active = i === 0;
            const inner = /* @__PURE__ */ jsx(
              "div",
              {
                title: icon.name,
                className: "flex items-center justify-center",
                style: {
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: active ? "#16150f" : "transparent"
                },
                children: /* @__PURE__ */ jsx(
                  "svg",
                  {
                    width: "15",
                    height: "15",
                    viewBox: "0 0 16 16",
                    fill: "none",
                    stroke: active ? "#fff" : "#7d7a6e",
                    strokeWidth: "1.5",
                    children: /* @__PURE__ */ jsx("path", { d: icon.d })
                  }
                )
              }
            );
            return href ? /* @__PURE__ */ jsx(Link, { href, children: inner }, icon.name) : /* @__PURE__ */ jsx("div", { children: inner }, icon.name);
          })
        }
      ),
      /* @__PURE__ */ jsxs("div", { id: "vq-canvas", className: "min-w-0 flex-1", style: { padding: "26px 30px 40px" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  font: "400 12px ui-monospace,monospace",
                  color: "#9a9689",
                  letterSpacing: ".06em",
                  textTransform: "uppercase"
                },
                children: dayLabel()
              }
            ),
            /* @__PURE__ */ jsxs(
              "h1",
              {
                style: {
                  margin: "5px 0 0",
                  font: "500 27px/1.15 'Instrument Sans',sans-serif",
                  color: "#16150f",
                  letterSpacing: "-.02em"
                },
                children: [
                  greeting(),
                  ", ",
                  (greetingName || "").split(" ")[0]
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                href: to("store.purchases.create") || "#",
                style: {
                  height: 36,
                  padding: "0 15px",
                  borderRadius: 9,
                  border: "1px solid #e0ddd2",
                  background: "#fff",
                  color: "#16150f",
                  font: "500 13px 'Instrument Sans',sans-serif",
                  display: "flex",
                  alignItems: "center"
                },
                children: "New purchase"
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: to("store.pos") || "#",
                style: {
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 9,
                  background: "#16150f",
                  color: "#fff",
                  font: "500 13px 'Instrument Sans',sans-serif",
                  display: "flex",
                  alignItems: "center"
                },
                children: "New sale"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { id: "vq-hero-grid", className: "grid gap-4", style: { gridTemplateColumns: "minmax(0,1fr) 320px" }, children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "min-w-0",
              style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 16, padding: "22px 24px 12px" },
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { style: { font: "400 12.5px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: "Revenue this month" }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-3", children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          style: {
                            font: "500 38px/1 'Instrument Sans',sans-serif",
                            color: "#16150f",
                            letterSpacing: "-.03em"
                          },
                          children: money(trend?.total_revenue ?? profit?.revenue ?? 0)
                        }
                      ),
                      typeof trend?.change_pct === "number" && /* @__PURE__ */ jsxs(
                        "span",
                        {
                          style: {
                            font: "500 12.5px 'Instrument Sans',sans-serif",
                            color: trend.change_pct >= 0 ? "#0e6b4f" : "#a8321e",
                            background: trend.change_pct >= 0 ? vq.emerald[100] : vq.red[100],
                            borderRadius: 99,
                            padding: "4px 9px"
                          },
                          children: [
                            trend.change_pct >= 0 ? "+" : "",
                            trend.change_pct,
                            "%"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "mt-2 flex gap-4",
                        style: { font: "400 12.5px 'Instrument Sans',sans-serif", color: "#6f6c61" },
                        children: [
                          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsx("span", { style: { width: 7, height: 7, borderRadius: 99, background: "#16150f" } }),
                            "Sales"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsx("span", { style: { width: 7, height: 7, borderRadius: 99, background: "#8fbfa9" } }),
                            "Gross profit ",
                            money(profit?.value ?? 0)
                          ] })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-0.5", style: { padding: 3, borderRadius: 9, background: "#f1efe9" }, children: ["Today", "Month", "Year"].map((label) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setPeriod(label),
                      style: {
                        padding: "6px 12px",
                        borderRadius: 7,
                        background: period === label ? "#fff" : "transparent",
                        boxShadow: period === label ? "0 1px 2px rgba(0,0,0,.07)" : "none",
                        font: "500 12px 'Instrument Sans',sans-serif",
                        color: period === label ? "#16150f" : "#8b877a"
                      },
                      children: label
                    },
                    label
                  )) })
                ] }),
                /* @__PURE__ */ jsx(RevenueChart, { points: trend?.points })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs("div", { style: { background: "#16150f", borderRadius: 16, padding: "20px 22px", color: "#fff" }, children: [
              /* @__PURE__ */ jsx("div", { style: { font: "400 12.5px 'Instrument Sans',sans-serif", color: "rgba(255,255,255,.55)" }, children: "Cash in hand" }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    font: "500 30px/1 'Instrument Sans',sans-serif",
                    marginTop: 7,
                    letterSpacing: "-.03em"
                  },
                  children: money(cash?.cash ?? 0)
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-2", children: ["Money in", "Money out"].map((label) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  style: {
                    flex: 1,
                    height: 36,
                    borderRadius: 9,
                    border: "none",
                    background: "rgba(255,255,255,.12)",
                    color: "#fff",
                    font: "500 12.5px 'Instrument Sans',sans-serif"
                  },
                  children: label
                },
                label
              )) })
            ] }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex-1",
                style: { background: "#fff", border: "1px solid #e6e3da", borderRadius: 16, padding: "18px 20px" },
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx("span", { style: { font: "500 13.5px 'Instrument Sans',sans-serif", color: "#16150f" }, children: "Needs you today" }),
                    needs?.items?.length > 0 && /* @__PURE__ */ jsx(
                      "span",
                      {
                        style: {
                          font: "500 11px ui-monospace,monospace",
                          color: "#a8321e",
                          background: vq.red[100],
                          borderRadius: 99,
                          padding: "3px 8px"
                        },
                        children: needs.items.length
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3.5 flex flex-col gap-3", children: [
                    (needs?.items || []).slice(0, 3).map((item, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          style: {
                            width: 6,
                            height: 6,
                            borderRadius: 99,
                            background: item.severity === "high" ? "#a8321e" : "#b4600a",
                            flex: "none"
                          }
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: "flex-1 truncate",
                          style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" },
                          children: item.label || item.message
                        }
                      )
                    ] }, i)),
                    !needs?.items?.length && /* @__PURE__ */ jsx("span", { style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: "Nothing needs you right now." })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { id: "vq-stat-grid", className: "mt-3 grid gap-3", style: { gridTemplateColumns: "repeat(4,minmax(0,1fr))" }, children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "To receive",
              value: money(receivables?.total ?? 0),
              footnote: receivables?.overdue_count ? `${receivables.overdue_count} overdue` : "All settled",
              tone: receivables?.overdue_count ? "warn" : "muted"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "To pay",
              value: money(payables?.total ?? 0),
              footnote: payables?.total ? "Due to suppliers" : "All settled"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Stock value",
              value: money(stock?.value ?? 0),
              footnote: stock?.item_count ? `${stock.item_count} items` : null
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Net profit",
              value: money(profit?.value ?? 0),
              footnote: profit?.value > 0 ? "Healthy margin" : null,
              tone: "good"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", style: { margin: "26px 0 14px" }, children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              style: {
                font: "400 11.5px ui-monospace,monospace",
                color: "#a9a596",
                letterSpacing: ".08em",
                textTransform: "uppercase"
              },
              children: "More on your day"
            }
          ),
          /* @__PURE__ */ jsx("span", { style: { flex: 1, height: 1, background: "#e3e0d7" } })
        ] }),
        /* @__PURE__ */ jsxs("div", { id: "vq-more-grid", className: "grid gap-3", style: { gridTemplateColumns: "repeat(2,minmax(0,1fr))" }, children: [
          /* @__PURE__ */ jsxs(Panel, { title: "Top products", action: "This month", children: [
            (products?.items || []).slice(0, 3).map((p, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { style: { width: 28, height: 28, borderRadius: 8, background: "#f1efe9", flex: "none" } }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "flex-1 truncate",
                  style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#3c3a33" },
                  children: p.name
                }
              ),
              /* @__PURE__ */ jsx("span", { style: { font: "500 13px 'Instrument Sans',sans-serif", color: "#16150f" }, children: money(p.revenue ?? p.total ?? 0) })
            ] }, i)),
            !products?.items?.length && /* @__PURE__ */ jsx("span", { style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: "No sales recorded yet." })
          ] }),
          /* @__PURE__ */ jsx(Panel, { title: "Recent activity", action: "View all", children: /* @__PURE__ */ jsx("span", { style: { font: "400 13px 'Instrument Sans',sans-serif", color: "#8b877a" }, children: "Recent sales and payments appear here." }) })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setSheetOpen(true),
            className: "w-full",
            style: {
              marginTop: 12,
              height: 88,
              border: "1px dashed #d3cfc1",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: "rgba(255,255,255,.4)"
            },
            children: [
              /* @__PURE__ */ jsx("span", { style: { font: "400 20px 'Instrument Sans',sans-serif", color: "#8b877a", lineHeight: 1 }, children: "+" }),
              /* @__PURE__ */ jsx("span", { style: { font: "500 13px 'Instrument Sans',sans-serif", color: "#6f6c61" }, children: "Add a card — cash flow, GST, staff, AI opportunities and more" })
            ]
          }
        )
      ] })
    ] }),
    sheetOpen && /* @__PURE__ */ jsx(
      AddCardSheet,
      {
        catalog,
        active: extras || [],
        onAdd: addCard,
        onClose: () => setSheetOpen(false)
      }
    )
  ] });
}
export {
  Overview as default
};
