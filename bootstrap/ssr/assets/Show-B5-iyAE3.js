import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { a as formatDate } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { ArrowRightLeft, AlertTriangle, RotateCcw, ShoppingCart, CheckCircle2, ArrowLeft, Warehouse, History } from "lucide-react";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const statusConfig = {
  available: { label: "In Stock", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  sold: { label: "Sold", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: ShoppingCart },
  returned: { label: "Returned", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: RotateCcw },
  defective: { label: "Defective", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
  transfer: { label: "In Transfer", color: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400", icon: ArrowRightLeft }
};
function SerialShow({ serial }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const status = statusConfig[serial?.status] || statusConfig.available;
  const StatusIcon = status.icon;
  const timeline = [
    { label: "Received into stock", date: serial?.created_at, detail: serial?.warehouse?.name ? `Warehouse: ${serial.warehouse.name}` : null }
  ];
  if (serial?.status === "sold" && serial?.sale) {
    timeline.push({ label: "Sold", date: serial?.updated_at, detail: `Invoice #${serial.sale.reference_number || serial.sale.id}` });
  } else if (serial?.status === "returned") {
    timeline.push({ label: "Returned", date: serial?.updated_at, detail: null });
  } else if (serial?.status === "defective") {
    timeline.push({ label: "Marked defective", date: serial?.updated_at, detail: serial?.notes });
  } else if (serial?.status === "transfer") {
    timeline.push({ label: "In transfer", date: serial?.updated_at, detail: null });
  }
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Serial #${serial?.serial_number || serial?.id || ""}`, activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: `Serial #${serial?.serial_number || serial?.id || ""}` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Link, { href: "#", onClick: (e) => {
          e.preventDefault();
          window.history.back();
        }, className: "p-2 text-ink-muted hover:text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
          "Serial: ",
          serial?.serial_number || serial?.id
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: tt("Product") }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: serial?.product?.name || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-full ${status.color}`, children: [
            /* @__PURE__ */ jsx(StatusIcon, { size: 14 }),
            " ",
            status.label
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Warehouse, { size: 12 }),
              " Current Location"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: serial?.warehouse?.name || "Unassigned" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Origin Purchase" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: serial?.purchase_id ? `PO #${serial.purchase_id}` : "Not recorded" })
          ] })
        ] }),
        serial?.sale && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-line", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Sold On Invoice" }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.sales.show", { store_slug: store?.slug, sale: serial.sale_id }),
              className: "text-sm font-medium text-brand-600 hover:text-brand-500",
              children: [
                serial.sale.reference_number || `Sale #${serial.sale_id}`,
                serial.sale.customer?.name ? ` — ${serial.sale.customer.name}` : "",
                " →"
              ]
            }
          )
        ] }),
        serial?.notes && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-line", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Notes" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary", children: serial.notes })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(History, { size: 16 }),
          " Movement History"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: timeline.map((event, idx) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5" }),
            idx < timeline.length - 1 && /* @__PURE__ */ jsx("div", { className: "w-px flex-1 bg-sunken mt-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: event.label }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: formatDate(event.date, store) }),
            event.detail && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: event.detail })
          ] })
        ] }, idx)) })
      ] })
    ] })
  ] });
}
export {
  SerialShow as default
};
