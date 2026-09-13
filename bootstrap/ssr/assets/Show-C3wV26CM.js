import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { g as getCurrencySymbol } from "./format-131Nyq79.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ArrowLeft, ShoppingCart, FileText, Wrench, Edit, Printer, Mail, Phone, MapPin } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-C_2BbRa0.js";
import { u as useAlert } from "../ssr.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "axios";
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
function ProposalShow({ proposal }) {
  const {
    store
  } = usePage().props;
  const { showAlert, showConfirm } = useAlert();
  const tt = useTermText();
  const handlePrint = () => {
    window.open(route("store.proposals.print", [store.slug, proposal.id]), "_blank");
  };
  const handleConvertToSale = () => {
    showConfirm({
      title: "Convert to Sale?",
      message: "This will create a sale and deduct inventory immediately.",
      type: "warning",
      confirmLabel: "Yes, Convert",
      onConfirm: () => {
        router.post(route("store.proposals.convert-to-sale", [store.slug, proposal.id]));
      }
    });
  };
  const handleConvertToPreSale = () => {
    showConfirm({
      title: "Convert to Pre-Sale?",
      message: "This will create a pre-sale and reserve inventory (no deduction).",
      type: "info",
      confirmLabel: "Yes, Convert",
      onConfirm: () => {
        router.post(route("store.proposals.convert-to-presale", [store.slug, proposal.id]));
      }
    });
  };
  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-neutral-100 text-ink-secondary",
      sent: "bg-blue-100 text-blue-700",
      accepted: "bg-emerald-100 text-emerald-700",
      declined: "bg-red-100 text-red-700",
      expired: "bg-amber-100 text-amber-700",
      converted: "bg-brand-100 text-brand-700"
    };
    return colors[status] || colors.draft;
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Proposal #${proposal.reference_number}`, activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: `Proposal #${proposal.reference_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "proposals" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsx("style", { children: `
                        @media print {
                            @page { margin: 0; }
                            body { -webkit-print-color-adjust: exact; }
                            nav, aside, header, .no-print { display: none !important; }
                            main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                            .print-container { padding: 40px !important; box-shadow: none !important; border: none !important; }
                        }
` }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 no-print", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.proposals.index", {
                  store_slug: store.slug
                }),
                className: "flex items-center gap-2 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }),
                  " Back to Proposals"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              proposal.status !== "accepted" && proposal.status !== "converted" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleConvertToSale,
                    className: "flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium",
                    children: [
                      /* @__PURE__ */ jsx(ShoppingCart, { size: 18 }),
                      " Convert to Sale"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleConvertToPreSale,
                    className: "flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium",
                    children: [
                      /* @__PURE__ */ jsx(FileText, { size: 18 }),
                      " Convert to Pre-Sale"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: route("store.service-jobs.create", {
                      store_slug: store.slug,
                      party_id: proposal.customer_id || proposal.party_id,
                      title: `Work Order for Proposal #${proposal.reference_number || proposal.id}`,
                      estimated_total: proposal.total || ""
                    }),
                    className: "flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium",
                    children: [
                      /* @__PURE__ */ jsx(Wrench, { size: 18 }),
                      " ",
                      tt("Book as Service Job")
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.proposals.edit", [store.slug, proposal.id]),
                  className: "flex items-center gap-2 bg-surface text-ink-secondary dark:text-ink border border-line px-4 py-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95 font-medium",
                  children: [
                    /* @__PURE__ */ jsx(Edit, { size: 18 }),
                    " Edit"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handlePrint,
                  className: "flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(Printer, { size: 20 }),
                    " Print Proposal"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-lg border border-line p-8 print-container", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-12", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-2xl", children: "A" }),
                  /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-ink", children: "VENQORE" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm text-ink-muted space-y-1", children: [
                  /* @__PURE__ */ jsx("p", { children: "123 Business Street" }),
                  /* @__PURE__ */ jsx("p", { children: "City, Country 12345" }),
                  /* @__PURE__ */ jsx("p", { children: "Phone: +1 234 567 890" }),
                  /* @__PURE__ */ jsx("p", { children: "Email: info@venqorepos.com" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-ink mb-2", children: "PROPOSAL" }),
                /* @__PURE__ */ jsxs("p", { className: "text-ink-muted font-medium", children: [
                  "#",
                  proposal.reference_number
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-1 text-sm", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-ink-muted", children: [
                    "Date: ",
                    /* @__PURE__ */ jsx("span", { className: "text-ink font-medium", children: new Date(proposal.created_at).toLocaleDateString() })
                  ] }),
                  proposal.valid_until && /* @__PURE__ */ jsxs("p", { className: "text-ink-muted", children: [
                    "Valid Until: ",
                    /* @__PURE__ */ jsx("span", { className: "text-ink font-medium", children: new Date(proposal.valid_until).toLocaleDateString() })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-ink-muted", children: [
                    "Status: ",
                    /* @__PURE__ */ jsx("span", { className: `uppercase font-bold px-2 py-0.5 rounded-lg text-xs ${getStatusColor(proposal.status)}`, children: proposal.status })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-b border-line py-8 mb-8 grid grid-cols-2 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Prepared For" }),
                proposal.customer ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-lg", children: proposal.customer.name }),
                  proposal.customer.email && /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Mail, { size: 14 }),
                    " ",
                    proposal.customer.email
                  ] }),
                  proposal.customer.phone && /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Phone, { size: 14 }),
                    " ",
                    proposal.customer.phone
                  ] }),
                  proposal.customer.address && /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(MapPin, { size: 14 }),
                    " ",
                    proposal.customer.address
                  ] })
                ] }) : /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-lg", children: proposal.customer_name || "No Customer" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Proposal Details" }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
                  "Created By: ",
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-ink", children: proposal.user?.name || "Unknown" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx("th", { className: "py-3", children: "Item Description" }),
                /* @__PURE__ */ jsx("th", { className: "py-3 text-center", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "py-3 text-right", children: "Unit Price" }),
                /* @__PURE__ */ jsx("th", { className: "py-3 text-right", children: "Amount" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: (proposal.items || []).map((item, index) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "py-4", children: /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: item.product?.name || item.product_name || "Unknown Item" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-center text-ink-secondary", children: item.quantity }),
                /* @__PURE__ */ jsxs("td", { className: "py-4 text-right text-ink-secondary", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(item.unit_price || 0).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "py-4 text-right font-medium text-ink", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(item.total || 0).toLocaleString()
                ] })
              ] }, index)) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "w-64 space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "h-px bg-sunken my-2" }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xl font-bold text-brand-600 dark:text-brand-400", children: [
                /* @__PURE__ */ jsx("span", { children: "Total" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(proposal.total_amount || 0).toLocaleString()
                ] })
              ] }),
              proposal.expected_margin > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-ink-muted", children: [
                /* @__PURE__ */ jsx("span", { children: "Expected Margin" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium text-emerald-600", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(proposal.expected_margin || 0).toLocaleString()
                ] })
              ] })
            ] }) }),
            proposal.notes && /* @__PURE__ */ jsxs("div", { className: "mt-8 p-4 bg-app rounded-xl", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-2", children: "Notes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary", children: proposal.notes })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-12 pt-8 border-t border-line text-center text-ink-muted text-sm", children: [
              /* @__PURE__ */ jsx("p", { children: "This is a proposal/quotation and not a confirmed order." }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs", children: "For any inquiries, please contact us at support@venqorepos.com" })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ProposalShow as default
};
