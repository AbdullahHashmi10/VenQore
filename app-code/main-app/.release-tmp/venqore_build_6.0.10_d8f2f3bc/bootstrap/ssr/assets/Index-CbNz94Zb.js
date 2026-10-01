import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { Monitor, CheckCircle2, Download, Smartphone, Sparkles, Bell, Check, Printer } from "lucide-react";
import "react-dom";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-B_UmKR56.js";
import "./terms-BnWz3Igl.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function AppsIndex({ tenant, apps }) {
  const { store } = usePage().props;
  const storeSlug = tenant?.slug || store?.slug || "my-store";
  const windowsApp = apps?.windows || {
    version: "1.4.2",
    installer_url: "/downloads/VenQore_Station_Setup.exe",
    file_size: "84.6 MB",
    min_os: "Windows 10 / 11 (64-bit)"
  };
  const mobileApp = apps?.mobile || {
    target_date: "Q4 2026"
  };
  const [notifyEmail, setNotifyEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const handleNotifySubmit = (e) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes("@")) return;
    setSubscribed(true);
    window.dispatchEvent(new CustomEvent("amd:toast", {
      detail: {
        message: "You're on the early access list! We'll notify you as soon as VenQore Mobile launches.",
        type: "success"
      }
    }));
  };
  const [copiedSlug, setCopiedSlug] = useState(false);
  const copySlug = () => {
    navigator.clipboard.writeText(storeSlug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2e3);
    window.dispatchEvent(new CustomEvent("amd:toast", {
      detail: { message: `Store slug "${storeSlug}" copied to clipboard`, type: "info" }
    }));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Native Applications & Hardware Bridge — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 py-8 space-y-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-line", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-widest bg-[#0BAA8F]/15 text-[#0BAA8F] border border-[#0BAA8F]/30", children: "Native Ecosystem" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-medium", children: "Desktop & Mobile Clients" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-ink flex items-center gap-3", children: /* @__PURE__ */ jsx("span", { children: "VenQore Everywhere" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed", children: "Run high-speed hardware till registers on Windows, or manage your stock anywhere with the upcoming mobile companion." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.billing", { store_slug: storeSlug }),
              className: "px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-all shadow-sm",
              children: "Billing & Plans"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.dashboard", { store_slug: storeSlug }),
              className: "px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-all shadow-sm",
              children: "Dashboard"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm hover:border-line-strong hover:shadow-md relative overflow-hidden flex flex-col justify-between transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-[#0BAA8F]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between gap-4 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 flex items-center justify-center text-[#0BAA8F] shrink-0 shadow-inner", children: /* @__PURE__ */ jsx(Monitor, { size: 30 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink tracking-tight", children: "VenQore Station" }),
                  /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30", children: "Official Build" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted mt-0.5", children: [
                  "For Windows 10 / 11 (64-bit) · v",
                  windowsApp.version
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-secondary leading-relaxed mb-6", children: "The official native desktop application for checkout terminals. It serves as an ultra-fast local hardware bridge that bypasses browser sandboxing to control thermal receipt printers, automatic cash drawer kicks, barcode scanners, and weighing scales." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3 mb-8", children: [
              { title: "Direct Raw ESC/POS Printing", desc: "Instant thermal receipt output on Epson, Star, & Xprinter without browser print prompts." },
              { title: "Cash Drawer Kick Pulse", desc: "Sends raw RJ11 impulse to drawer solenoid on cash invoice finalization." },
              { title: "Serial COM Port Bridge", desc: "Live continuous polling for digital scales and RS-232 barcode scanners." },
              { title: "Cashier Kiosk & Focus Tracking", desc: "Prevents untracked cashier multitasking and records register lock events." },
              { title: "Silent Background Auto-Updates", desc: "Keeps till terminals secure and aligned with the latest VenQore POS releases." }
            ].map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 text-xs", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: item.title }),
                /* @__PURE__ */ jsx("span", { className: "text-ink-muted block text-2xs mt-0.5", children: item.desc })
              ] })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 pt-6 border-t border-line", children: [
            /* @__PURE__ */ jsxs(
              "a",
              {
                href: windowsApp.installer_url,
                download: true,
                className: "w-full py-4 px-6 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-md active:scale-98",
                children: [
                  /* @__PURE__ */ jsx(Download, { size: 16 }),
                  /* @__PURE__ */ jsx("span", { children: "Download Station Setup (.exe)" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-3xs text-ink-muted mt-3 px-1", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Installer size: ~",
                windowsApp.file_size
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Requirements: ",
                windowsApp.min_os
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm hover:border-line-strong hover:shadow-md relative overflow-hidden flex flex-col justify-between transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between gap-4 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-inner", children: /* @__PURE__ */ jsx(Smartphone, { size: 30 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink tracking-tight", children: "VenQore Mobile" }),
                  /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse", children: "Coming Soon" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-ink-muted mt-0.5", children: "Android (Google Play) & iOS (App Store)" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-secondary leading-relaxed mb-6", children: "Take VenQore with you onto the sales floor or warehouse aisles. VenQore Mobile is our dedicated companion app built for rapid barcode auditing, queue-busting mobile checkout, and real-time manager alerts." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3 mb-8", children: [
              { title: "Camera Barcode Stock Auditing", desc: "Scan product barcodes with your smartphone camera to verify shelf quantities and price tags." },
              { title: "Queue-Busting Mobile POS", desc: "Ring up customers directly in line and print via Bluetooth ESC/POS or send WhatsApp receipts." },
              { title: "Floor Stock Take & Transfers", desc: "Conduct fast cycle counts without carrying laptops or clipboards around warehouse racks." },
              { title: "Owner Daily Pulse & Live Alerts", desc: "Receive instant push notifications for sales milestones, cash register drops, and low stock." },
              { title: "Offline Order Queuing", desc: "Continue logging sales even when walking through poor connectivity warehouse zones." }
            ].map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 text-xs", children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-amber-500 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: item.title }),
                /* @__PURE__ */ jsx("span", { className: "text-ink-muted block text-2xs mt-0.5", children: item.desc })
              ] })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 pt-6 border-t border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-surface-raised border border-line", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-ink mb-1 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Bell, { size: 14, className: "text-amber-500" }),
                /* @__PURE__ */ jsx("span", { children: "Get Notified on Launch" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mb-3", children: "Join the early access beta testing pool to get mobile app builds first." }),
              subscribed ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold", children: [
                /* @__PURE__ */ jsx(Check, { size: 16 }),
                /* @__PURE__ */ jsx("span", { children: "You're on the early access list! We'll notify you on release." })
              ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleNotifySubmit, className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    value: notifyEmail,
                    onChange: (e) => setNotifyEmail(e.target.value),
                    placeholder: "Enter your email address",
                    required: true,
                    className: "flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-muted outline-none focus:border-amber-500 transition-colors"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    className: "px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shrink-0",
                    children: "Notify Me"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-3xs text-ink-muted mt-3 px-1", children: [
              /* @__PURE__ */ jsx("span", { children: "Platform availability: Android 10+ & iOS 16+" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Target Beta: ",
                mobileApp.target_date
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-[#0BAA8F] uppercase tracking-widest mb-1", children: "Setup Instructions" }),
            /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink", children: "How to Pair VenQore Station with Your Store" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-line", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Your Store Slug:" }),
            /* @__PURE__ */ jsx("code", { className: "text-xs font-mono font-bold text-[#0BAA8F]", children: storeSlug }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: copySlug,
                className: "text-3xs font-bold text-ink hover:text-[#0BAA8F] underline ml-1",
                children: copiedSlug ? "Copied!" : "Copy"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
          {
            step: "1",
            title: "Install & Launch",
            desc: "Download the Windows setup installer above, run it on your register PC, and start VenQore Station."
          },
          {
            step: "2",
            title: "Enter Store Slug",
            desc: `On the initial welcome screen, type your store slug "${storeSlug}" and click Connect Store.`
          },
          {
            step: "3",
            title: "Staff PIN Authorization",
            desc: "Authorize the terminal by entering your manager or cashier PIN to bind this hardware device."
          },
          {
            step: "4",
            title: "Configure Peripherals",
            desc: "Click Hardware Settings (Gear icon) to set your receipt printer (58mm/80mm), COM scale, and cash drawer."
          }
        ].map((guide) => /* @__PURE__ */ jsx("div", { className: "p-5 rounded-xl bg-surface-raised border border-line flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 flex items-center justify-center text-[#0BAA8F] font-bold text-xs mb-3", children: guide.step }),
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-ink mb-1.5", children: guide.title }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: guide.desc })
        ] }) }, guide.step)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface border border-line shadow-sm", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-ink uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Printer, { size: 16, className: "text-[#0BAA8F]" }),
          /* @__PURE__ */ jsx("span", { children: "Certified Hardware Compatibility" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-ink-muted", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-surface-raised border border-line", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-ink mb-1", children: "Thermal Receipt Printers" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs leading-relaxed", children: "Epson TM-T88/T20, Star Micronics TSP100/650, Xprinter, Rongta, Sunmi desktop USB/LAN." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-surface-raised border border-line", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-ink mb-1", children: "Barcode Scanners" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs leading-relaxed", children: "Zebra, Honeywell Voyager, Datalogic, Generic USB HID & RS-232 serial scanners (1D & 2D QR)." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-surface-raised border border-line", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-ink mb-1", children: "Electronic Weigh Scales" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs leading-relaxed", children: "CAS PD-II, Mettler Toledo Ariva, Torrey, Avery Berkel via RS-232 COM port protocol." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-surface-raised border border-line", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-ink mb-1", children: "Cash Drawers" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs leading-relaxed", children: "Standard 12V/24V heavy-duty cash drawers connected via RJ11 cable to receipt printer." })
          ] })
        ] })
      ] })
    ] })
  ] });
}
AppsIndex.layout = (page) => /* @__PURE__ */ jsx(OneGlanceLayout, { title: "Native Applications", activeMenu: "Apps", children: page });
export {
  AppsIndex as default
};
