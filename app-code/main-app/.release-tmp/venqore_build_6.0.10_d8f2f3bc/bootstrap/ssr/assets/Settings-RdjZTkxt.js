import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useMemo, useState, useRef, useEffect } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { usePage, Link, router, useForm, Head } from "@inertiajs/react";
import { P as PasscodeModal } from "../ssr.js";
import { ChevronDown, Search, Building2, Hash, Layers, Phone, Mail, MapPin, Globe, DollarSign, Clock, Calendar, Layout, Moon, Calculator, Eye, AlertTriangle, Receipt, ShoppingCart, FileCheck, RotateCcw, Plus, Trash2, Percent, ArrowUpRight, Package, Barcode, Bell, Printer, Play, Save, Monitor, Settings, ChevronLeft, Minimize2, Maximize2, FileText, Palette, AlignLeft, X, Image, Upload, Check, Info, Lock, ShoppingBag, ExternalLink, Sparkles, ShieldCheck, Shield, Wifi, Key, Users, Loader2, MessageSquare, BookOpen, Smartphone, Database, AlertOctagon, RefreshCw, ChevronRight } from "lucide-react";
import { createPortal, flushSync } from "react-dom";
import { P as PremiumSelect } from "./PremiumSelect-CyM9VGV1.js";
import { T as Toggle$1 } from "./Toggle-BmatDxRI.js";
import { u as useTermText } from "./terms-BnWz3Igl.js";
import { createRoot } from "react-dom/client";
import { P as PrintPreview } from "./PrintPreview-Dao1WISB.js";
import Swal from "sweetalert2";
import { v as vq } from "./runtime-zM7XrUga.js";
import { u as useAMDStation, i as isAMDStationAvailable } from "./AMDStation-CG85dq0d.js";
import { T as TerminalPairingSection } from "./TerminalPairingSection-B8gnAF6b.js";
import axios from "axios";
import "./plans-Dp89V3MJ.js";
import "./Input-B_UmKR56.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "qrcode.react";
import "./format-Dor_DYzH.js";
import "./SectionHeader-CPHLUsd1.js";
const COUNTRY_DIAL_CODES = [
  { code: "+92", country: "Pakistan", flag: "🇵🇰", iso: "PK" },
  { code: "+1", country: "United States / Canada", flag: "🇺🇸", iso: "US" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", iso: "GB" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪", iso: "AE" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", iso: "SA" },
  { code: "+91", country: "India", flag: "🇮🇳", iso: "IN" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩", iso: "BD" },
  { code: "+61", country: "Australia", flag: "🇦🇺", iso: "AU" },
  { code: "+90", country: "Turkey", flag: "🇹🇷", iso: "TR" },
  { code: "+974", country: "Qatar", flag: "🇶🇦", iso: "QA" },
  { code: "+968", country: "Oman", flag: "🇴🇲", iso: "OM" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼", iso: "KW" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭", iso: "BH" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", iso: "MY" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", iso: "SG" },
  { code: "+86", country: "China", flag: "🇨🇳", iso: "CN" },
  { code: "+49", country: "Germany", flag: "🇩🇪", iso: "DE" },
  { code: "+33", country: "France", flag: "🇫🇷", iso: "FR" },
  { code: "+39", country: "Italy", flag: "🇮🇹", iso: "IT" },
  { code: "+34", country: "Spain", flag: "🇪🇸", iso: "ES" }
];
function PhoneSplitInput({ value = "", onChange }) {
  const parse = (val) => {
    if (!val) return { dialCode: "+92", localNumber: "" };
    const clean = String(val).trim();
    const matched = COUNTRY_DIAL_CODES.find((c) => clean.startsWith(c.code));
    if (matched) {
      const local = clean.slice(matched.code.length).trim();
      return { dialCode: matched.code, localNumber: local };
    }
    if (clean.startsWith("0")) {
      return { dialCode: "+92", localNumber: clean.replace(/^0+/, "") };
    }
    return { dialCode: "+92", localNumber: clean };
  };
  const parsed = useMemo(() => parse(value), [value]);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [localNumber, setLocalNumber] = useState(parsed.localNumber);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const portalRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    const p = parse(value);
    setDialCode(p.dialCode);
    setLocalNumber(p.localNumber);
  }, [value]);
  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  };
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && portalRef.current && !portalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleDialChange = (newCode) => {
    setDialCode(newCode);
    setIsOpen(false);
    const combined = localNumber ? `${newCode} ${localNumber}` : newCode;
    onChange(combined);
  };
  const handleLocalChange = (e) => {
    const raw = e.target.value.replace(/[^\d\s-]/g, "");
    setLocalNumber(raw);
    const combined = raw ? `${dialCode} ${raw}` : "";
    onChange(combined);
  };
  const selectedCountry = COUNTRY_DIAL_CODES.find((c) => c.code === dialCode) || COUNTRY_DIAL_CODES[0];
  const filtered = COUNTRY_DIAL_CODES.filter(
    (c) => c.country.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search) || c.iso.toLowerCase().includes(search.toLowerCase())
  );
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: dropdownRef,
        onClick: () => setIsOpen(!isOpen),
        className: "h-11 w-32 sm:w-36 shrink-0 flex items-center justify-between px-3 bg-app hover:bg-surface border border-line rounded-xl cursor-pointer transition-all shadow-xs select-none hover:border-brand-500/40 active:scale-[0.98]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5 min-w-0", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink uppercase tracking-tight", children: selectedCountry.iso }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-brand-600 dark:text-brand-400 font-mono", children: selectedCountry.code })
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `text-ink-muted shrink-0 transition-transform duration-slow ${isOpen ? "rotate-180" : ""}` })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "relative flex-1", children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "tel",
        value: localNumber,
        onChange: handleLocalChange,
        placeholder: "300 1234567",
        className: "h-11 w-full px-3.5 bg-app border border-line rounded-xl text-sm font-bold text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-brand-500 shadow-xs transition-all"
      }
    ) }),
    isOpen && createPortal(
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: portalRef,
          className: "fixed mt-1.5 bg-surface rounded-xl shadow-2xl border border-line z-modal overflow-hidden animate-in fade-in zoom-in-95 duration-fast",
          style: {
            top: coords.top,
            left: coords.left,
            width: Math.max(coords.width + 130, 270)
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-line bg-surface", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  placeholder: "Search country or code...",
                  autoFocus: true,
                  className: "w-full pl-8 pr-3 py-1.5 bg-app border border-line rounded-lg text-xs font-bold text-ink outline-none focus:ring-1 focus:ring-brand-500"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "max-h-56 overflow-y-auto divide-y divide-line/40", children: filtered.map((item) => {
              const isSelected = item.code === dialCode;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handleDialChange(item.code),
                  className: `flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${isSelected ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold" : "hover:bg-app text-ink"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-base", children: item.flag }),
                      /* @__PURE__ */ jsx("span", { className: "truncate max-w-[150px]", children: item.country })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-ink-muted text-3xs", children: item.code })
                  ]
                },
                item.iso + item.code
              );
            }) })
          ]
        }
      ),
      document.body
    )
  ] });
}
const COST_POLICY_OPTIONS = [
  { value: "always", label: "Always Update (Replace Cost with Latest Purchase)" },
  { value: "never", label: "Never Update (Keep Historical Cost Price Fixed)" },
  { value: "increase_only", label: "Increase Only (Update Only If New Cost is Higher)" },
  { value: "decrease_only", label: "Decrease Only (Update Only If New Cost is Lower)" }
];
function BusinessProfileSection({ data, setData }) {
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Business details" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Building2, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Business name" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.business_name || "",
              onChange: (e) => {
                setData("business_name", e.target.value);
                setData("store_name", e.target.value);
              },
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none",
              placeholder: "e.g. VenQore Retail Corp"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Printed at the top of receipts, tax invoices, and B2B orders." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Hash, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Tax registration number" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.tax_number || "",
              onChange: (e) => setData("tax_number", e.target.value),
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none",
              placeholder: "e.g. 1234567-8 or PK-STRN-9988"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Enter the number required on your tax invoices, if your business has one." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Layers, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "When a purchase changes an item's cost" })
          ] }),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              options: COST_POLICY_OPTIONS,
              value: data.product_cost_update_policy || "always",
              onChange: (val) => setData("product_cost_update_policy", val),
              searchable: false,
              placeholder: "Select cost update policy"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Choose whether a new purchase updates the cost price saved for an item." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Contact & Location" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Phone, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Official Store Phone" })
          ] }),
          /* @__PURE__ */ jsx(
            PhoneSplitInput,
            {
              value: data.business_phone || data.store_phone || "",
              onChange: (val) => {
                setData("business_phone", val);
                setData("store_phone", val);
              }
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Select dial code and enter local phone number for receipts and support." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Mail, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Business Email Address" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: data.business_email || "",
              onChange: (e) => setData("business_email", e.target.value),
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none",
              placeholder: "billing@yourbrand.com"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Store Address & Outlet Location" })
          ] }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              value: data.business_address || data.store_address || "",
              onChange: (e) => {
                setData("business_address", e.target.value);
                setData("store_address", e.target.value);
              },
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none resize-none",
              placeholder: "Plot #42, Main Commercial Avenue, Phase 5"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Globe, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Use your own website address" }),
            /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-3xs font-bold uppercase tracking-wider rounded-full border border-amber-300/40 dark:border-amber-500/30", children: "Coming Soon" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Route your own branded web address (e.g. pos.amdoutlets.com) to this store" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 pt-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-1.5 opacity-75", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Website address" }),
            /* @__PURE__ */ jsx("span", { className: "text-3xs text-amber-600 dark:text-amber-400 font-medium", children: "In Development" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.custom_domain || "",
                disabled: true,
                readOnly: true,
                placeholder: "pos.amdoutlets.com",
                className: "w-full pl-9 pr-4 py-2.5 bg-app/80 border border-line rounded-xl text-sm font-bold text-ink-muted cursor-not-allowed select-none outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Globe, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "This feature is still being built. You cannot connect a website address yet." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted flex flex-col justify-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-ink font-bold mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-amber-500 animate-pulse" }),
            /* @__PURE__ */ jsx("span", { children: "When this feature is available:" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "leading-relaxed", children: "Your website provider will need to connect your address to VenQore. We will provide the instructions here." })
        ] })
      ] })
    ] })
  ] });
}
const CURRENCY_OPTIONS = [
  { value: "PKR", label: "PKR — Pakistani Rupee (Rs.)", symbol: "Rs.", code: "PKR" },
  { value: "USD", label: "USD — US Dollar ($)", symbol: "$", code: "USD" },
  { value: "GBP", label: "GBP — British Pound (£)", symbol: "£", code: "GBP" },
  { value: "EUR", label: "EUR — Euro (€)", symbol: "€", code: "EUR" },
  { value: "AED", label: "AED — UAE Dirham (AED)", symbol: "AED", code: "AED" },
  { value: "SAR", label: "SAR — Saudi Riyal (SAR)", symbol: "SAR", code: "SAR" },
  { value: "CAD", label: "CAD — Canadian Dollar (C$)", symbol: "C$", code: "CAD" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)", symbol: "A$", code: "AUD" },
  { value: "INR", label: "INR — Indian Rupee (₹)", symbol: "₹", code: "INR" },
  { value: "BDT", label: "BDT — Bangladeshi Taka (৳)", symbol: "৳", code: "BDT" },
  { value: "TRY", label: "TRY — Turkish Lira (₺)", symbol: "₺", code: "TRY" },
  { value: "QAR", label: "QAR — Qatari Riyal (QAR)", symbol: "QAR", code: "QAR" },
  { value: "OMR", label: "OMR — Omani Rial (OMR)", symbol: "OMR", code: "OMR" },
  { value: "KWD", label: "KWD — Kuwaiti Dinar (KWD)", symbol: "KWD", code: "KWD" },
  { value: "BHD", label: "BHD — Bahraini Dinar (BHD)", symbol: "BHD", code: "BHD" },
  { value: "MYR", label: "MYR — Malaysian Ringgit (RM)", symbol: "RM", code: "MYR" },
  { value: "SGD", label: "SGD — Singapore Dollar (S$)", symbol: "S$", code: "SGD" }
];
const CURRENCY_SYMBOL_OPTIONS = [
  { value: "Rs.", label: "Rs. (Standard Rupee)" },
  { value: "PKR", label: "PKR (ISO Currency Code)" },
  { value: "$", label: "$ (Dollar)" },
  { value: "£", label: "£ (Pound)" },
  { value: "€", label: "€ (Euro)" },
  { value: "AED", label: "AED (Dirham)" },
  { value: "SAR", label: "SAR (Riyal)" },
  { value: "₹", label: "₹ (INR Symbol)" },
  { value: "৳", label: "৳ (Taka)" }
];
const TIMEZONE_OPTIONS = [
  { value: "Asia/Karachi", label: "Asia/Karachi (PKT +05:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +04:00)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST +03:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka (BST +06:00)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +05:30)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +08:00)" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur (MYT +08:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST +10:00)" }
];
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "ur", label: "Urdu (اردو)" }
];
const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-12-31)" },
  { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY (31-Dec-2026)" }
];
function RegionNumbersSection({ data, setData }) {
  const decimalPlaces = parseInt(data.decimal_places ?? 2, 10);
  const currSym = data.currency_symbol || (CURRENCY_OPTIONS.find((c) => c.value === data.currency)?.symbol || "Rs.");
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Financial Currency & Timezone" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(DollarSign, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { children: "Operating Currency (ISO Code)" })
        ] }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: CURRENCY_OPTIONS,
            value: data.currency || "PKR",
            onChange: (val) => {
              setData("currency", val);
              const found = CURRENCY_OPTIONS.find((c) => c.value === val);
              if (found) {
                setData("currency_symbol", found.symbol);
              }
            },
            searchable: true,
            placeholder: "Select Currency"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Hash, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { children: "Displayed Currency Symbol" })
        ] }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: CURRENCY_SYMBOL_OPTIONS,
            value: data.currency_symbol || "Rs.",
            onChange: (val) => setData("currency_symbol", val),
            searchable: false,
            placeholder: "Select Symbol"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Symbol placed next to prices across sales screens and printouts." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Clock, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { children: "Store Timezone" })
        ] }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: TIMEZONE_OPTIONS,
            value: data.timezone || "Asia/Karachi",
            onChange: (val) => setData("timezone", val),
            searchable: true,
            placeholder: "Select Timezone"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Timestamps for shift registers, invoices, and sales history." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Language & Global Decimal Precision" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Globe, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { children: "System Language" })
        ] }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: LANGUAGE_OPTIONS,
            value: data.language || "en",
            onChange: (val) => setData("language", val),
            searchable: false,
            placeholder: "Select Language"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Calendar, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { children: "Date Display Format" })
        ] }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: DATE_FORMAT_OPTIONS,
            value: data.date_format || "DD/MM/YYYY",
            onChange: (val) => setData("date_format", val),
            searchable: false,
            placeholder: "Select Date Format"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2.5 pt-3 border-t border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-ink block", children: "Global Decimal Places" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: "Applies to item prices, totals, ledger calculations" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono font-bold bg-sunken border border-line px-2.5 py-1 rounded-lg text-ink-secondary", children: [
            currSym,
            " 1,234.",
            "0".repeat(Math.max(0, Math.min(4, decimalPlaces)))
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-1.5 bg-app p-1.5 rounded-xl border border-line", children: [0, 1, 2, 3, 4].map((num) => {
          const isActive = decimalPlaces === num;
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setData("decimal_places", num),
              className: `py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${isActive ? "bg-brand-600 text-white shadow-xs" : "text-ink-muted hover:text-ink hover:bg-surface"}`,
              children: num
            },
            num
          );
        }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted", children: [
          "Note: Printed receipts have a separate amount format control under ",
          /* @__PURE__ */ jsx("strong", { children: "Printing > Document Layouts" }),
          "."
        ] })
      ] })
    ] })
  ] }) });
}
function DisplayPreferencesSection({ data, setData }) {
  const uiScale = parseInt(data.ui_scale ?? 100, 10);
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-5 flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 mb-5 pb-4 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Layout, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink leading-tight", children: "Interface Scale" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Scope: Applies to all staff terminals and browser sessions" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-ink block", children: "Screen Zoom Factor" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: "Optimizes touch targets on 1080p, 2K & tablet screens" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-lg border border-brand-500/20", children: [
            uiScale,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative h-6 flex items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute w-full h-2 bg-app border border-line rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full bg-brand-500 transition-all duration-200",
                style: { width: `${(Math.max(75, Math.min(125, uiScale)) - 75) / (125 - 75) * 100}%` }
              }
            ) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: "75",
                max: "125",
                step: "5",
                value: uiScale,
                onChange: (e) => setData("ui_scale", parseInt(e.target.value, 10)),
                className: "absolute w-full h-6 opacity-0 cursor-pointer z-10"
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute w-5 h-5 bg-white border-2 border-brand-600 rounded-full shadow-md transition-all duration-200 pointer-events-none",
                style: { left: `calc(${(Math.max(75, Math.min(125, uiScale)) - 75) / (125 - 75) * 100}% - 10px)` }
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 pt-1", children: [
            { scale: 75, label: "Compact (75%)" },
            { scale: 100, label: "Default (100%)" },
            { scale: 125, label: "Large (125%)" }
          ].map((preset) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setData("ui_scale", preset.scale),
              className: `py-1.5 px-2 rounded-lg text-2xs font-bold transition-all border ${uiScale === preset.scale ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border-brand-500/30 shadow-xs" : "bg-app text-ink-muted hover:text-ink border-transparent hover:border-line"}`,
              children: preset.label
            },
            preset.scale
          )) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 mb-2 pb-4 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Moon, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink leading-tight", children: "Theme & Accessibility" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Scope: Store-wide default configuration" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            label: "Force Dark Mode by Default",
            description: "Enforce dark theme palette across all staff logins and POS stations.",
            enabled: data.dark_mode_default === true || data.dark_mode_default === "1",
            onChange: (v) => setData("dark_mode_default", v),
            icon: Moon
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            label: "Header Dynamic Calculator",
            description: "Pin a quick calculator button inside the top Dynamic Island header.",
            enabled: data.header_calculator_enabled === "1" || data.header_calculator_enabled === true,
            onChange: (v) => setData("header_calculator_enabled", v ? "1" : "0"),
            icon: Calculator
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            label: "Senior Mode (Accessibility)",
            description: "Boost font sizes, contrast ratios, and button outlines for touch screens.",
            enabled: data.senior_mode === true || data.senior_mode === "1",
            onChange: (v) => setData("senior_mode", v),
            icon: Eye
          }
        )
      ] })
    ] })
  ] }) });
}
function CheckoutReturnsSection({ data, setData }) {
  const tt = useTermText();
  const [acknowledgeOpenReturn, setAcknowledgeOpenReturn] = useState(false);
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Register Checkout Rules" }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.pos_auto_fill_cash === true || data.pos_auto_fill_cash === "1",
            onChange: (v) => setData("pos_auto_fill_cash", v),
            label: "Fill in the amount received",
            description: "When paying by cash, start with the exact bill amount. You can still change it."
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.cash_sale_default === "1" || data.cash_sale_default === true,
            onChange: (v) => setData("cash_sale_default", v),
            label: "Default to 'Cash Sale'",
            description: "Pre-select Cash payment mode instead of asking for tender method during checkout."
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: Boolean(data.charity_enabled),
            onChange: (v) => setData("charity_enabled", v),
            label: "Show charity button at checkout",
            description: "Add a charity button to the sales screen for recording donations."
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.stop_sale_negative_stock === "0" || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0,
            onChange: (v) => setData("stop_sale_negative_stock", !v),
            label: "Allow Negative Stock (Overselling)",
            description: "Permits finalizing checkout even when inventory level is 0 or negative.",
            variant: "danger"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Round the final bill" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-ink", children: "How to round the amount due" }),
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded", children: "Cash Checkout Rule" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Choose how to round the final amount a customer pays. This does not change item prices or the decimal display setting." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-1.5 max-w-md w-full bg-app p-1.5 rounded-xl border border-line pt-2", children: [
          { value: "none", label: "None" },
          { value: "0", label: "Whole" },
          { value: "2", label: ".00" },
          { value: "3", label: ".000" },
          { value: "4", label: ".0000" }
        ].map((opt) => {
          const currentVal = data.round_off_total === true || data.round_off_total === "1" ? "0" : data.round_off_total || "none";
          const isActive = currentVal === opt.value;
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setData("round_off_total", opt.value),
              className: `py-1.5 px-1 text-center font-bold text-2xs rounded-lg transition-all ${isActive ? "bg-brand-600 text-white shadow-xs" : "text-ink-muted hover:text-ink hover:bg-surface"}`,
              children: opt.label
            },
            opt.value
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-3 border-t border-line", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-ink-muted", children: "Rules for returns" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold text-ink", children: "What must staff provide for a return?" }),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              options: [
                { value: "reference", label: "Reference Number Required (Strict)" },
                { value: "customer_or_reference", label: tt("Customer or Reference") },
                { value: "open", label: "Open Return — No Reference Needed" }
              ],
              value: data.pos_return_mode || "reference",
              onChange: (val) => {
                setData("pos_return_mode", val);
                if (val !== "open") setAcknowledgeOpenReturn(false);
              },
              searchable: false,
              placeholder: "Select Return Mode"
            }
          )
        ] }),
        data.pos_return_mode === "open" && /* @__PURE__ */ jsxs("div", { className: "p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-300", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-bold flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
            " Open Returns Warning"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-amber-700 dark:text-amber-400", children: "Open returns cannot be verified against original invoice sales. Staff are responsible for authenticating items." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 pt-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Return Window" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "1",
                  value: data.pos_return_window || "",
                  onChange: (e) => setData("pos_return_window", e.target.value),
                  placeholder: "e.g. 14",
                  className: "w-full px-3 py-1.5 bg-app border border-line rounded-xl text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-brand-500"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted", children: "days" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Expired Action" }),
            /* @__PURE__ */ jsxs("div", { className: "flex bg-app p-1 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setData("pos_return_window_behavior", "warn"),
                  className: `flex-1 py-1 text-3xs font-bold rounded-lg transition-all ${(data.pos_return_window_behavior || "warn") === "warn" ? "bg-surface text-brand-600 dark:text-brand-400 shadow-xs" : "text-ink-muted"}`,
                  children: "Warn"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setData("pos_return_window_behavior", "block"),
                  className: `flex-1 py-1 text-3xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "block" ? "bg-surface text-brand-600 dark:text-brand-400 shadow-xs" : "text-ink-muted"}`,
                  children: "Block"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
const BILLING_TYPE_OPTIONS = [
  { value: "full", label: "Standard Full Invoice (A4 / B2B Default)" },
  { value: "quick", label: "Quick Retail Cash Slip" },
  { value: "tax_invoice", label: "Formal Tax Invoice (FBR/VAT Compliant)" }
];
function DocumentsNumberingSection({ data, setData }) {
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Document Numbering & Compliance" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.invoice_number_enabled === "1" || data.invoice_number_enabled === true || data.invoice_number_enabled !== "0",
            onChange: (v) => setData("invoice_number_enabled", v),
            label: "Sequential Invoice Numbering",
            description: "Display sequential numeric IDs on customer receipts and PDF invoices."
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Default Invoice Billing Mode" }),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              options: BILLING_TYPE_OPTIONS,
              value: data.billing_type || "full",
              onChange: (val) => setData("billing_type", val),
              searchable: false,
              placeholder: "Select Billing Mode"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Controls the default invoice styling and tax breakdown on sales creation." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-line pb-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Document Numbering Prefixes" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Prefix strings prepended to sequential numbers for cross-department accounting" })
        ] }),
        /* @__PURE__ */ jsx(Hash, { size: 18, className: "text-ink-muted" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Receipt, { size: 13, className: "text-brand-600 dark:text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Sales Invoice Prefix" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.sale_prefix ?? "INV-",
              onChange: (e) => setData("sale_prefix", e.target.value),
              placeholder: "INV-",
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted font-mono", children: [
            "e.g. ",
            data.sale_prefix || "INV-",
            "001024"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 13, className: "text-emerald-600 dark:text-emerald-400" }),
            /* @__PURE__ */ jsx("span", { children: "Purchase Prefix" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.purchase_prefix ?? "PUR-",
              onChange: (e) => setData("purchase_prefix", e.target.value),
              placeholder: "PUR-",
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted font-mono", children: [
            "e.g. ",
            data.purchase_prefix || "PUR-",
            "000451"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(FileCheck, { size: 13, className: "text-sky-600 dark:text-sky-400" }),
            /* @__PURE__ */ jsx("span", { children: "Quotation Prefix" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.quotation_prefix ?? "QTN-",
              onChange: (e) => setData("quotation_prefix", e.target.value),
              placeholder: "QTN-",
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted font-mono", children: [
            "e.g. ",
            data.quotation_prefix || "QTN-",
            "000089"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(RotateCcw, { size: 13, className: "text-amber-600 dark:text-amber-400" }),
            /* @__PURE__ */ jsx("span", { children: "Return Prefix" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.return_prefix ?? "RET-",
              onChange: (e) => setData("return_prefix", e.target.value),
              placeholder: "RET-",
              className: "w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted font-mono", children: [
            "e.g. ",
            data.return_prefix || "RET-",
            "000012"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function TaxSettingsSection({ data, setData }) {
  const addTax = () => {
    const newTax = {
      id: Date.now(),
      name: "New Tax",
      rate: 0,
      type: "percentage"
    };
    setData("tax_rates", [...data.tax_rates || [], newTax]);
  };
  const removeTax = (id) => {
    const newRates = (data.tax_rates || []).filter((t) => t.id !== id);
    setData("tax_rates", newRates);
  };
  const updateTax = (index, field, value) => {
    const newRates = [...data.tax_rates || []];
    newRates[index][field] = value;
    setData("tax_rates", newRates);
  };
  const taxOptions = [
    { value: "0", label: "No Default Tax (0%)" },
    ...(data.tax_rates || []).map((t) => ({
      value: String(t.id),
      label: `${t.name} (${t.type === "fixed" ? `${t.rate} Fixed` : `${t.rate}%`})`
    }))
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Default Tax Rate" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Choose which tax rate is automatically applied to new sales and invoices" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full md:w-72", children: /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: taxOptions,
            value: data.default_tax_id ? String(data.default_tax_id) : data.default_tax_rate || "0",
            onChange: (selectedId) => {
              if (selectedId === "0") {
                setData((d) => ({ ...d, default_tax_rate: "0", default_tax_id: "" }));
              } else {
                const found = (data.tax_rates || []).find((t) => String(t.id) === selectedId || String(t.rate) === selectedId);
                setData((d) => ({
                  ...d,
                  default_tax_rate: found ? String(found.rate) : selectedId,
                  default_tax_id: found ? String(found.id) : selectedId
                }));
              }
            },
            searchable: false,
            placeholder: "Select Default Tax"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-line flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Default Pricing Tax Basis" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Specify whether catalog item prices are treated as tax-exclusive or tax-inclusive by default" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setData("default_tax_basis", "exclusive"),
              className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${(data.default_tax_basis || "exclusive") === "exclusive" ? "bg-brand-600 text-white shadow-sm" : "bg-app text-ink-muted hover:text-ink border border-line"}`,
              children: "Exclusive (Added on top)"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setData("default_tax_basis", "inclusive"),
              className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${data.default_tax_basis === "inclusive" ? "bg-brand-600 text-white shadow-sm" : "bg-app text-ink-muted hover:text-ink border border-line"}`,
              children: "Inclusive (Included in price)"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Configured Tax Rates" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Active tax rates applied to items and transactions" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: addTax,
          className: "px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 15 }),
            /* @__PURE__ */ jsx("span", { children: "Add Tax Rate" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", children: [
      (data.tax_rates || []).map((tax, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "group relative p-5 bg-surface border border-line rounded-2xl shadow-xs hover:border-brand-500/50 hover:shadow-md transition-all duration-normal",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pr-8", children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold tracking-widest text-ink-muted", children: "Tax Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: tax.name,
                    onChange: (e) => updateTax(i, "name", e.target.value),
                    className: "w-full bg-transparent border-none p-0 text-base font-bold text-ink focus:ring-0 placeholder:text-ink-faint",
                    placeholder: "e.g. GST 18%"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold tracking-widest text-ink-muted", children: "Rate" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: tax.rate,
                      onChange: (e) => updateTax(i, "rate", e.target.value),
                      className: "w-full px-3 py-2 bg-app border border-line rounded-xl font-bold text-sm text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold tracking-widest text-ink-muted", children: "Type" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: tax.type,
                      onChange: (e) => updateTax(i, "type", e.target.value),
                      className: "w-full px-3 py-2 bg-app border border-line rounded-xl font-bold text-sm text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "percentage", children: "% Percent" }),
                        /* @__PURE__ */ jsx("option", { value: "fixed", children: "$ Fixed" })
                      ]
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeTax(tax.id),
                className: "w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl shadow-xs transition-all opacity-0 group-hover:opacity-100",
                title: "Delete Tax Rate",
                children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
              }
            ) })
          ]
        },
        tax.id
      )),
      (!data.tax_rates || data.tax_rates.length === 0) && /* @__PURE__ */ jsxs("div", { className: "col-span-full py-12 flex flex-col items-center justify-center text-ink-muted border-2 border-dashed border-line rounded-2xl", children: [
        /* @__PURE__ */ jsx(Percent, { size: 36, className: "mb-3 opacity-30 text-ink-muted" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-ink", children: "No Tax Rates Configured" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Click the button above to add your first tax rate." })
      ] })
    ] })
  ] });
}
function CustomersSuppliersSection({ data, setData }) {
  const tt = useTermText();
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Customers and rewards" }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.party_grouping === true || data.party_grouping === "1",
            onChange: (v) => setData("party_grouping", v),
            label: "Group customers and suppliers",
            description: tt("Categorize customers and suppliers by territory, industry, or corporate tier")
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.loyalty_enabled === true || data.loyalty_enabled === "1",
            onChange: (v) => setData("loyalty_enabled", v),
            label: "Loyalty Points Program",
            description: tt("Reward customers with redeemable balance points on checkout transactions")
          }
        ),
        data.loyalty_enabled && /* @__PURE__ */ jsx("div", { className: "py-3 animate-in fade-in slide-in-from-top-1", children: /* @__PURE__ */ jsxs("div", { className: "p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-500/20 flex items-center justify-between text-xs text-brand-700 dark:text-brand-300", children: [
          /* @__PURE__ */ jsx("span", { children: "Fine-tune point conversion ratios & tier perks" }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: `/s/${store?.slug}/growth-engine/settings`,
              className: "font-bold underline hover:text-brand-800 ml-2 shrink-0 flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx("span", { children: "Growth Rules" }),
                /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 })
              ]
            }
          )
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Customer credit" }),
      /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: /* @__PURE__ */ jsx(
        Toggle$1,
        {
          enabled: data.enable_credit_limit !== "0" && data.enable_credit_limit !== false,
          onChange: (v) => setData("enable_credit_limit", v),
          label: "Enable Customer Credit Limits",
          description: tt("Warn or stop staff when a customer owes more than their allowed credit amount")
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted leading-relaxed", children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-ink mb-1", children: "Overdue Reminder Schedule:" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Automated notification windows for overdue receivables are configured under",
          " ",
          /* @__PURE__ */ jsx("strong", { children: "Operations > Reminders & Alerts" }),
          "."
        ] })
      ] })
    ] })
  ] }) });
}
function StockItemsSection({ data, setData }) {
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Track your stock" }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.stock_maintenance !== "0" && data.stock_maintenance !== false,
            onChange: (v) => setData("stock_maintenance", v),
            label: "Track stock quantities",
            description: "Update available quantities when you buy or sell items.",
            icon: Package
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.barcode_scan_enabled === true || data.barcode_scan_enabled === "1",
            onChange: (v) => setData("barcode_scan_enabled", v),
            label: "Use a barcode scanner",
            description: "Scan items on sales and purchase screens.",
            icon: Barcode
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.batch_tracking_enabled === true || data.batch_tracking_enabled === "1",
            onChange: (v) => setData("batch_tracking_enabled", v),
            label: "Track batches and expiry dates",
            description: "Track distinct inventory lots with manufacturing dates, expiry dates, and lot numbers.",
            icon: Layers
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Prices and low-stock warnings" }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.wholesale_price_enabled === true || data.wholesale_price_enabled === "1",
            onChange: (v) => setData("wholesale_price_enabled", v),
            label: "Wholesale prices",
            description: "Set separate prices for customers who buy in bulk.",
            icon: DollarSign
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.low_stock_alerts === true || data.low_stock_alerts === "1",
            onChange: (v) => setData("low_stock_alerts", v),
            label: "Show low-stock warnings",
            description: "Display in-app warning highlights when stock drops below minimum threshold.",
            icon: Bell
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "py-3.5 space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Warn when stock falls to" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: data.low_stock_threshold || 10,
                onChange: (e) => setData("low_stock_threshold", parseInt(e.target.value, 10) || 0),
                className: "w-32 px-3.5 py-2 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted", children: "units" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Items with on-hand quantity at or below this value trigger alerts." })
        ] })
      ] })
    ] })
  ] }) });
}
function PrintSettingsSection({ data, setData, saveSettings }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [previewMode, setPreviewMode] = useState("light");
  const [activePrintTab, setActivePrintTab] = useState(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("active_printer_subtab") : null;
    return ["thermal", "regular", "b2b", "hardware"].includes(saved) ? saved : "regular";
  });
  const handleSubtabChange = (tabName) => {
    setActivePrintTab(tabName);
    localStorage.setItem("active_printer_subtab", tabName);
  };
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsFullScreen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isFullScreen]);
  const handleTestPrint = (currentData) => {
    const type = activePrintTab === "thermal" ? "thermal" : "regular";
    const isThermal = type === "thermal";
    const MM_TO_PX = 3;
    let width;
    if (isThermal) {
      if (currentData.thermal_page_size === "2inch") width = 58 * MM_TO_PX;
      else if (currentData.thermal_page_size === "4inch") width = 100 * MM_TO_PX;
      else width = 80 * MM_TO_PX;
    } else {
      const paperSizes = { "A4": 210, "A5": 148, "Letter": 216, "Legal": 216 };
      const pW = currentData.paper_size === "Custom" ? parseFloat(currentData.custom_paper_width) || 210 : paperSizes[currentData.paper_size] || 210;
      width = currentData.paper_orientation === "Landscape" ? (currentData.paper_size === "A4" ? 297 : pW) * MM_TO_PX : pW * MM_TO_PX;
    }
    const rootNode = document.createElement("div");
    const root = createRoot(rootNode);
    flushSync(() => {
      root.render(
        /* @__PURE__ */ jsx(PrintPreview, { data: currentData, type, mode: "light", forPrint: true })
      );
    });
    const previewHtml = rootNode.innerHTML;
    root.unmount();
    const allStyles = Array.from(document.styleSheets).map((sheet) => {
      try {
        return Array.from(sheet.cssRules || []).map((r) => r.cssText).join("\n");
      } catch {
        return "";
      }
    }).join("\n");
    const copies = parseInt(isThermal ? currentData.thermal_copies : currentData.print_copies) || 1;
    let repeatedHtml = "";
    for (let c = 0; c < copies; c++) {
      repeatedHtml += `<div class="print-copy-wrapper" style="${c > 0 ? isThermal ? "border-t-2 border-dashed border-black pt-4 mt-4;" : "page-break-before: always;" : ""}">${previewHtml}</div>`;
    }
    const printDoc = `<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8" />
 <title>Test Print — ${type === "thermal" ? "Thermal Receipt" : "A4 Invoice"}</title>
 <style>
 ${allStyles}
 * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
 body { margin: 0; padding: 0; background: white; }
 @page {
 margin: 0;
 ${isThermal ? `size: ${width / MM_TO_PX}mm 297mm;` : currentData.paper_size === "Custom" ? `size: ${parseFloat(currentData.custom_paper_width) || 210}mm ${parseFloat(currentData.custom_paper_height) || 297}mm;` : `size: ${currentData.paper_size || "A4"} ${currentData.paper_orientation === "Landscape" ? "landscape" : "portrait"};`}
 }
 @media print {
 html, body {
 height: auto !important;
 overflow: visible !important;
 padding: 0 !important;
 }
 .print-container {
 page-break-inside: auto !important;
 break-inside: auto !important;
 height: auto !important;
 overflow: visible !important;
 }
 .print-container tr,
 .print-container .space-y-3 > div {
 page-break-inside: avoid !important;
 break-inside: avoid !important;
 }
 }
 </style>
</head>
<body>
 ${repeatedHtml}
</body>
</html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const printDocument = iframe.contentWindow.document;
    printDocument.open();
    printDocument.write(printDoc);
    printDocument.close();
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1e3);
      }
    }, isThermal ? 500 : 300);
  };
  const content = /* @__PURE__ */ jsxs("div", { id: "fullscreen-portal-root", role: isFullScreen ? "dialog" : void 0, "aria-modal": isFullScreen ? "true" : void 0, "aria-label": isFullScreen ? "Fullscreen Print Designer" : void 0, className: `flex flex-col bg-app border border-line rounded-2xl overflow-hidden shadow-sm transition-all duration-slow ${isFullScreen ? "fixed inset-0 z-command rounded-none" : "min-h-[560px] h-[calc(100vh-14rem)]"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 p-4 border-b border-line bg-surface z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink", children: [
          /* @__PURE__ */ jsx(Printer, { size: 18, className: "text-brand-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-sm tracking-tight", children: "Print preview" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex bg-sunken rounded-lg p-1", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSubtabChange("regular"),
              className: `px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === "regular" ? "bg-sunken text-brand-600 shadow-sm" : "text-ink-muted hover:text-ink-secondary"}`,
              children: "Standard A4/A5"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSubtabChange("thermal"),
              className: `px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === "thermal" ? "bg-sunken text-emerald-600 shadow-sm" : "text-ink-muted hover:text-ink-secondary"}`,
              children: "Thermal / POS"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSubtabChange("b2b"),
              className: `px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === "b2b" ? "bg-sunken text-indigo-600 shadow-sm" : "text-ink-muted hover:text-ink-secondary"}`,
              children: "Invoice & PDF (B2B)"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSubtabChange("hardware"),
              className: `px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === "hardware" ? "bg-sunken text-amber-600 shadow-sm" : "text-ink-muted hover:text-ink-secondary"}`,
              children: "Hardware & Station"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleTestPrint(data),
            className: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 mr-2",
            title: "Send a test print with current settings (no need to save first)",
            children: [
              /* @__PURE__ */ jsx(Play, { size: 14, className: "fill-current" }),
              "Test Print"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              if (saveSettings) {
                Swal.fire({
                  title: "Save Printer Settings?",
                  text: "Are you sure you want to save and apply the new printer configurations across the system?",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonText: "Yes, Save Settings",
                  cancelButtonText: "Cancel",
                  background: vq.slate[800],
                  color: "#fff",
                  confirmButtonColor: vq.indigo[600],
                  target: isFullScreen ? document.getElementById("fullscreen-portal-root") || "body" : "body"
                }).then((result) => {
                  if (result.isConfirmed) {
                    saveSettings();
                  }
                });
              }
            },
            className: "flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 mr-2",
            title: "Save and apply current printer settings",
            children: [
              /* @__PURE__ */ jsx(Save, { size: 14 }),
              "Save Printer Settings"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-sunken rounded-lg p-1 mr-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setPreviewMode("light"),
              className: `p-1.5 rounded transition-colors ${previewMode === "light" ? "bg-sunken text-amber-500 shadow-sm" : "text-ink-muted"}`,
              title: "Light Mode Preview",
              children: /* @__PURE__ */ jsx(Monitor, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setPreviewMode("dark"),
              className: `p-1.5 rounded transition-colors ${previewMode === "dark" ? "bg-neutral-800 text-brand-400 shadow-sm" : "text-ink-muted"}`,
              title: "Dark Mode Preview",
              children: /* @__PURE__ */ jsx(Monitor, { size: 14, className: "fill-current" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setSidebarCollapsed(!sidebarCollapsed),
            className: "p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors",
            title: sidebarCollapsed ? "Show Settings" : "Hide Settings",
            children: sidebarCollapsed ? /* @__PURE__ */ jsx(Settings, { size: 18 }) : /* @__PURE__ */ jsx(ChevronLeft, { size: 18 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setIsFullScreen(!isFullScreen),
            className: `p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors ${isFullScreen ? "text-brand-600 bg-brand-50 dark:bg-raised" : ""}`,
            title: "Full Screen Mode",
            children: isFullScreen ? /* @__PURE__ */ jsx(Minimize2, { size: 18 }) : /* @__PURE__ */ jsx(Maximize2, { size: 18 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex overflow-hidden bg-sunken", children: [
      /* @__PURE__ */ jsx("div", { className: `bg-surface border-r border-line transition-all duration-slow flex flex-col ${sidebarCollapsed ? "w-0 opacity-0" : "w-96 opacity-100"}`, children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar", children: activePrintTab === "thermal" ? /* @__PURE__ */ jsx(ThermalSettings, { data, setData }) : activePrintTab === "b2b" ? /* @__PURE__ */ jsx(B2BSettings, { data, setData }) : activePrintTab === "hardware" ? /* @__PURE__ */ jsx(HardwareSettings, { data, setData }) : /* @__PURE__ */ jsx(RegularSettings, { data, setData }) }) }),
      /* @__PURE__ */ jsx("div", { className: `flex-1 overflow-auto flex items-start justify-center p-8 transition-colors duration-slow ${previewMode === "dark" ? "bg-neutral-900" : "bg-sunken"}`, children: /* @__PURE__ */ jsx("div", { className: `transform transition-all duration-slow ${sidebarCollapsed ? "scale-100" : "scale-95 origin-top"}`, children: /* @__PURE__ */ jsx(
        PrintPreview,
        {
          data,
          type: activePrintTab === "thermal" ? "thermal" : "regular",
          mode: previewMode
        }
      ) }) })
    ] })
  ] });
  if (isFullScreen) {
    return createPortal(content, document.body);
  }
  return content;
}
const RegularSettings = ({ data, setData }) => {
  const tt = useTermText();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl border border-brand-100 dark:border-brand-800/30 mb-6", children: /* @__PURE__ */ jsx(
      Toggle,
      {
        label: "Set as Default Printer",
        checked: data.default_print_type === "regular" || !data.default_print_type,
        onChange: (v) => setData("default_print_type", v ? "regular" : "thermal"),
        color: "indigo"
      }
    ) }),
    /* @__PURE__ */ jsxs(Section, { title: "Page Layout", icon: Layout, children: [
      /* @__PURE__ */ jsx(
        ButtonGroup,
        {
          label: "Paper Size",
          value: data.paper_size,
          onChange: (v) => setData("paper_size", v),
          options: [
            { value: "A4", label: "A4" },
            { value: "A5", label: "A5" },
            { value: "Letter", label: "Letter" },
            { value: "Legal", label: "Legal" },
            { value: "Custom", label: "Custom" }
          ]
        }
      ),
      data.paper_size === "Custom" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-1", children: [
        /* @__PURE__ */ jsx(NumberInput, { label: "Width (mm)", value: data.custom_paper_width, onChange: (v) => setData("custom_paper_width", v) }),
        /* @__PURE__ */ jsx(NumberInput, { label: "Height (mm)", value: data.custom_paper_height, onChange: (v) => setData("custom_paper_height", v) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
        ButtonGroup,
        {
          label: "Orientation",
          value: data.paper_orientation,
          onChange: (v) => setData("paper_orientation", v),
          options: [
            { value: "Portrait", label: "Portrait" },
            { value: "Landscape", label: "Landscape" }
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(Label, { children: "Margins (mm)" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mt-1", children: [
          /* @__PURE__ */ jsx(NumberInput, { label: "Top", value: data.margin_top, onChange: (v) => setData("margin_top", v) }),
          /* @__PURE__ */ jsx(NumberInput, { label: "Bottom", value: data.margin_bottom, onChange: (v) => setData("margin_bottom", v) }),
          /* @__PURE__ */ jsx(NumberInput, { label: "Left", value: data.margin_left, onChange: (v) => setData("margin_left", v) }),
          /* @__PURE__ */ jsx(NumberInput, { label: "Right", value: data.margin_right, onChange: (v) => setData("margin_right", v) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-4", children: [
        /* @__PURE__ */ jsx(NumberInput, { label: "Min Item Rows", value: data.print_min_item_rows, onChange: (v) => setData("print_min_item_rows", v) }),
        /* @__PURE__ */ jsx(NumberInput, { label: "Extra Top Space (mm)", value: data.print_extra_space_top, onChange: (v) => setData("print_extra_space_top", v) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Section, { title: "Visual Style", icon: Palette, children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Theme Template" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: data.print_theme,
            onChange: (e) => setData("print_theme", e.target.value),
            className: "w-full mt-1 p-2 bg-sunken border border-line dark:border-line rounded-lg text-sm",
            children: [
              /* @__PURE__ */ jsx("option", { value: "modern", children: "Modern (Default)" }),
              /* @__PURE__ */ jsx("option", { value: "classic", children: "Classic Formal" }),
              /* @__PURE__ */ jsx("option", { value: "bold", children: "Bold Header" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        ColorPicker,
        {
          label: "Accent Color",
          value: data.print_theme_color,
          onChange: (v) => setData("print_theme_color", v)
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(
          SelectInput,
          {
            label: "Header Size",
            value: data.print_company_text_size,
            onChange: (v) => setData("print_company_text_size", v),
            options: [{ v: "2", l: "Small" }, { v: "3", l: "Medium" }, { v: "4", l: "Large" }, { v: "5", l: "Huge" }]
          }
        ),
        /* @__PURE__ */ jsx(
          SelectInput,
          {
            label: "Body Text",
            value: data.print_invoice_text_size,
            onChange: (v) => setData("print_invoice_text_size", v),
            options: [{ v: "1", l: "Tiny" }, { v: "2", l: "Compact" }, { v: "3", l: "Normal" }, { v: "4", l: "Large" }]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(Section, { title: "Header Content", icon: FileText, children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
        "Business name: ",
        /* @__PURE__ */ jsx("strong", { className: "text-ink", children: data.business_name }),
        ". Change it in Business Profile."
      ] }),
      /* @__PURE__ */ jsx(Toggle, { label: "Show Logo", checked: data.print_logo, onChange: (v) => setData("print_logo", v) }),
      /* @__PURE__ */ jsx(Toggle, { label: "Show Verification QR Code", checked: data.print_qr_code, onChange: (v) => setData("print_qr_code", v) }),
      data.print_logo && /* @__PURE__ */ jsx(LogoUploader, { data, setData }),
      /* @__PURE__ */ jsx(Toggle, { label: "Repeat Header on All Pages", checked: data.print_header_all_pages, onChange: (v) => setData("print_header_all_pages", v) }),
      /* @__PURE__ */ jsx(Toggle, { label: "Show Original/Duplicate Copy", checked: data.print_original_copy, onChange: (v) => setData("print_original_copy", v) })
    ] }),
    /* @__PURE__ */ jsx(Section, { title: tt("Table Columns"), icon: Layout, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Serial No.", checked: data.print_show_sno, onChange: (v) => setData("print_show_sno", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "HSN/SAC Code", checked: data.print_show_hsn, onChange: (v) => setData("print_show_hsn", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: tt("Product Description"), checked: data.print_show_description, onChange: (v) => setData("print_show_description", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Units/Qty", checked: data.print_show_units, onChange: (v) => setData("print_show_units", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "MRP Column", checked: data.print_show_mrp, onChange: (v) => setData("print_show_mrp", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Discount Column", checked: data.print_show_discount, onChange: (v) => setData("print_show_discount", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Free Qty (1+1)", checked: data.print_show_free_qty, onChange: (v) => setData("print_show_free_qty", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Batch Codes", checked: data.thermal_show_batch, onChange: (v) => setData("thermal_show_batch", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Expiry Dates", checked: data.thermal_show_expiry, onChange: (v) => setData("thermal_show_expiry", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Tax Breakdown", checked: data.print_tax_details, onChange: (v) => setData("print_tax_details", v) }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Barcode", checked: data.thermal_show_barcode !== false, onChange: (v) => setData("thermal_show_barcode", v) })
    ] }) }),
    /* @__PURE__ */ jsxs(Section, { title: "Totals & Footer", icon: AlignLeft, children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mb-4", children: [
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Total Qty", checked: data.print_total_quantity, onChange: (v) => setData("print_total_quantity", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Decimal Amounts", checked: data.print_amount_decimal, onChange: (v) => setData("print_amount_decimal", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Received Amt", checked: data.print_received_amount, onChange: (v) => setData("print_received_amount", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Balance Due", checked: data.print_balance_amount, onChange: (v) => setData("print_balance_amount", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Savings", checked: data.print_you_saved, onChange: (v) => setData("print_you_saved", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Prev Balance", checked: data.print_show_previous_balance, onChange: (v) => setData("print_show_previous_balance", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Delivery Charges", checked: data.print_show_delivery_charge !== false, onChange: (v) => setData("print_show_delivery_charge", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Extra Charges", checked: data.print_show_extra_charge !== false, onChange: (v) => setData("print_show_extra_charge", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Party Balance", checked: data.print_party_balance, onChange: (v) => setData("print_party_balance", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Amount Grouping", checked: data.print_amount_grouping, onChange: (v) => setData("print_amount_grouping", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Received By", checked: data.print_received_by, onChange: (v) => setData("print_received_by", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Delivered By", checked: data.print_delivered_by, onChange: (v) => setData("print_delivered_by", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Acknowledgement", checked: data.print_acknowledgement, onChange: (v) => setData("print_acknowledgement", v) }),
        /* @__PURE__ */ jsx(ToggleBtn, { label: "Print Description", checked: data.print_description, onChange: (v) => setData("print_description", v) })
      ] }),
      /* @__PURE__ */ jsx(
        SelectInput,
        {
          label: "Amount in Words",
          value: data.print_amount_words,
          onChange: (v) => setData("print_amount_words", v),
          options: [{ v: "0", l: "None" }, { v: "1", l: "English" }, { v: "2", l: "Indian Format" }]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsx(TextInput, { label: "Terms & Conditions (Bottom)", value: data.print_terms, onChange: (v) => setData("print_terms", v), placeholder: "E.g. No returns..." }),
        /* @__PURE__ */ jsx(TextInput, { label: "Custom Footer Message", value: data.thermal_custom_footer, onChange: (v) => setData("thermal_custom_footer", v), placeholder: "E.g. Follow us on Instagram!" }),
        /* @__PURE__ */ jsx(TextInput, { label: "Signature Text", value: data.print_signature_text, onChange: (v) => setData("print_signature_text", v) })
      ] })
    ] })
  ] });
};
const ThermalSettings = ({ data, setData }) => /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsx("div", { className: "p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 mb-6", children: /* @__PURE__ */ jsx(
    Toggle,
    {
      label: "Set as Default Printer",
      checked: data.default_print_type === "thermal",
      onChange: (v) => setData("default_print_type", v ? "thermal" : "regular"),
      color: "emerald"
    }
  ) }),
  /* @__PURE__ */ jsxs(Section, { title: "Paper Format", icon: FileText, children: [
    /* @__PURE__ */ jsx(
      ButtonGroup,
      {
        label: "Roll Width",
        value: data.thermal_page_size,
        onChange: (v) => setData("thermal_page_size", v),
        options: [
          { value: "2inch", label: '58mm (2")' },
          { value: "3inch", label: '80mm (3")' },
          { value: "4inch", label: '100mm (4")' }
        ],
        color: "emerald"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-4", children: [
      /* @__PURE__ */ jsx(NumberInput, { label: "Margins Top/Bottom", value: data.margin_top, onChange: (v) => setData("margin_top", v) }),
      /* @__PURE__ */ jsx(NumberInput, { label: "Custom Chars (line length)", value: data.thermal_custom_chars, onChange: (v) => setData("thermal_custom_chars", v) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx(Label, { children: "Margins (mm)" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mt-1", children: [
        /* @__PURE__ */ jsx(NumberInput, { label: "Left", value: data.margin_left, onChange: (v) => setData("margin_left", v) }),
        /* @__PURE__ */ jsx(NumberInput, { label: "Right", value: data.margin_right, onChange: (v) => setData("margin_right", v) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx(Label, { children: "Font Size Scale" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "range",
          min: "10",
          max: "22",
          step: "1",
          value: data.thermal_font_size || 12,
          onChange: (e) => setData("thermal_font_size", parseInt(e.target.value)),
          className: "w-full h-2 bg-sunken rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-ink-muted mt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Compact" }),
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-emerald-600", children: [
          data.thermal_font_size,
          "pt"
        ] }),
        /* @__PURE__ */ jsx("span", { children: "Large" })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxs(Section, { title: "Receipt Style", icon: Palette, children: [
    /* @__PURE__ */ jsx(Label, { children: "Theme Template" }),
    /* @__PURE__ */ jsxs(
      "select",
      {
        value: data.print_theme,
        onChange: (e) => setData("print_theme", e.target.value),
        className: "w-full mt-1 p-2 bg-sunken border border-line dark:border-line rounded-lg text-sm",
        children: [
          /* @__PURE__ */ jsx("option", { value: "modern", children: "Modern Receipt" }),
          /* @__PURE__ */ jsx("option", { value: "classic", children: "Classic Typewriter" }),
          /* @__PURE__ */ jsx("option", { value: "bold", children: "Bold Boxed" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx(Toggle, { label: "Show Logo", checked: data.print_logo, onChange: (v) => setData("print_logo", v), color: "emerald" }),
      /* @__PURE__ */ jsx(Toggle, { label: "Show Verification QR Code", checked: data.print_qr_code, onChange: (v) => setData("print_qr_code", v), color: "emerald" }),
      data.print_logo && /* @__PURE__ */ jsx(LogoUploader, { data, setData })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2", children: [
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Bold Text Mode", checked: data.thermal_use_bold, onChange: (v) => setData("thermal_use_bold", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Batch Codes", checked: data.thermal_show_batch, onChange: (v) => setData("thermal_show_batch", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Expiry Dates", checked: data.thermal_show_expiry, onChange: (v) => setData("thermal_show_expiry", v), color: "emerald" })
    ] })
  ] }),
  /* @__PURE__ */ jsx(Section, { title: "Columns & Content", icon: Layout, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Label Headers", checked: data.thermal_show_headers, onChange: (v) => setData("thermal_show_headers", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Serial No.", checked: data.thermal_show_sno, onChange: (v) => setData("thermal_show_sno", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Units", checked: data.thermal_show_units, onChange: (v) => setData("thermal_show_units", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Item Description", checked: data.thermal_show_description, onChange: (v) => setData("thermal_show_description", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "MRP Prices", checked: data.thermal_show_mrp, onChange: (v) => setData("thermal_show_mrp", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Discounts (%)", checked: data.print_show_discount, onChange: (v) => setData("print_show_discount", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Free Qty (1+1)", checked: data.print_show_free_qty, onChange: (v) => setData("print_show_free_qty", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Tax Details", checked: data.print_tax_details, onChange: (v) => setData("print_tax_details", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Barcode", checked: data.thermal_show_barcode !== false, onChange: (v) => setData("thermal_show_barcode", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show MFG Date", checked: data.thermal_show_mfg_date, onChange: (v) => setData("thermal_show_mfg_date", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Size", checked: data.thermal_show_size, onChange: (v) => setData("thermal_show_size", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Model", checked: data.thermal_show_model, onChange: (v) => setData("thermal_show_model", v), color: "emerald" }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Show Serial (product)", checked: data.thermal_show_serial, onChange: (v) => setData("thermal_show_serial", v), color: "emerald" })
  ] }) }),
  /* @__PURE__ */ jsxs(Section, { title: "Totals & Footer", icon: AlignLeft, children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Total Qty", checked: data.print_total_quantity, onChange: (v) => setData("print_total_quantity", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Decimal Amounts", checked: data.print_amount_decimal, onChange: (v) => setData("print_amount_decimal", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Received Amt", checked: data.print_received_amount, onChange: (v) => setData("print_received_amount", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Balance Due", checked: data.print_balance_amount, onChange: (v) => setData("print_balance_amount", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Savings", checked: data.print_you_saved, onChange: (v) => setData("print_you_saved", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Prev Balance", checked: data.print_show_previous_balance, onChange: (v) => setData("print_show_previous_balance", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Delivery Charges", checked: data.print_show_delivery_charge !== false, onChange: (v) => setData("print_show_delivery_charge", v), color: "emerald" }),
      /* @__PURE__ */ jsx(ToggleBtn, { label: "Extra Charges", checked: data.print_show_extra_charge !== false, onChange: (v) => setData("print_show_extra_charge", v), color: "emerald" })
    ] }),
    /* @__PURE__ */ jsx(
      SelectInput,
      {
        label: "Amount in Words",
        value: data.print_amount_words,
        onChange: (v) => setData("print_amount_words", v),
        options: [{ v: "0", l: "None" }, { v: "1", l: "English" }, { v: "2", l: "Indian Format" }]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
      /* @__PURE__ */ jsx(TextInput, { label: "Terms & Conditions (Bottom)", value: data.print_terms, onChange: (v) => setData("print_terms", v), placeholder: "E.g. No returns..." }),
      /* @__PURE__ */ jsx(TextInput, { label: "Custom Footer Message", value: data.thermal_custom_footer, onChange: (v) => setData("thermal_custom_footer", v), placeholder: "E.g. Follow us on Instagram!" }),
      /* @__PURE__ */ jsx(TextInput, { label: "Signature Text", value: data.print_signature_text, onChange: (v) => setData("print_signature_text", v) })
    ] })
  ] }),
  /* @__PURE__ */ jsxs(Section, { title: "Hardware Actions", icon: Settings, children: [
    /* @__PURE__ */ jsx(Toggle, { label: "Auto Cut Paper", checked: data.thermal_auto_cut, onChange: (v) => setData("thermal_auto_cut", v), color: "emerald" }),
    /* @__PURE__ */ jsx(Toggle, { label: "Open Cash Drawer", checked: data.thermal_open_drawer, onChange: (v) => setData("thermal_open_drawer", v), color: "emerald" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-4", children: [
      /* @__PURE__ */ jsx(NumberInput, { label: "Extra Feed (Lines)", value: data.thermal_extra_lines, onChange: (v) => setData("thermal_extra_lines", v) }),
      /* @__PURE__ */ jsx(NumberInput, { label: "Copies to Print", value: data.thermal_copies, onChange: (v) => setData("thermal_copies", v) })
    ] })
  ] })
] });
const Section = ({ title, icon: Icon, children }) => /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
  /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted border-b border-line pb-2", children: [
    /* @__PURE__ */ jsx(Icon, { size: 14 }),
    " ",
    title
  ] }),
  /* @__PURE__ */ jsx("div", { className: "px-1", children })
] });
const Label = ({ children }) => /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wide mb-1.5", children });
const ButtonGroup = ({ label, value, onChange, options, color = "indigo" }) => /* @__PURE__ */ jsxs("div", { children: [
  /* @__PURE__ */ jsx(Label, { children: label }),
  /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: options.map((opt) => /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(opt.value),
      className: `flex-1 min-w-[60px] py-2 px-1 text-xs font-bold rounded-lg border transition-all ${value === opt.value ? color === "emerald" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-brand-600 text-white border-brand-600 shadow-sm" : "bg-sunken border-line dark:border-line text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
      children: opt.label
    },
    opt.value
  )) })
] });
const ToggleBtn = ({ label, checked, onChange, color = "indigo" }) => /* @__PURE__ */ jsxs(
  "button",
  {
    type: "button",
    onClick: () => onChange(!checked),
    className: `w-full flex items-center justify-between p-3 rounded-xl border transition-all ${checked ? color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800" : "bg-surface border-line hover:border-line"}`,
    children: [
      /* @__PURE__ */ jsx("span", { className: `text-sm font-bold ${checked ? color === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-brand-700 dark:text-brand-400" : "text-ink-secondary"}`, children: label }),
      /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center transition-colors ${checked ? color === "emerald" ? "bg-emerald-500 text-white" : "bg-brand-500 text-white" : "bg-sunken text-transparent"}`, children: /* @__PURE__ */ jsx(Check, { size: 12, strokeWidth: 4 }) })
    ]
  }
);
const Toggle = ({ label, checked, onChange, color = "indigo" }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-1", children: [
  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink-secondary", children: label }),
  /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(!checked),
      className: `relative w-11 h-6 rounded-full transition-colors ${checked ? color === "emerald" ? "bg-emerald-500" : "bg-brand-500" : "bg-sunken"}`,
      children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? "left-6" : "left-1"}` })
    }
  )
] });
const TextInput = ({ label, value, onChange, placeholder }) => /* @__PURE__ */ jsxs("div", { children: [
  /* @__PURE__ */ jsx(Label, { children: label }),
  /* @__PURE__ */ jsx(
    "input",
    {
      type: "text",
      value: value || "",
      onChange: (e) => onChange(e.target.value),
      placeholder,
      className: "w-full px-3 py-2 text-sm bg-sunken border border-line rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-ink placeholder:text-ink-faint"
    }
  )
] });
const NumberInput = ({ label, value, onChange }) => /* @__PURE__ */ jsxs("div", { children: [
  /* @__PURE__ */ jsx(Label, { children: label }),
  /* @__PURE__ */ jsx(
    "input",
    {
      type: "number",
      value: value || 0,
      onChange: (e) => onChange(parseFloat(e.target.value) || 0),
      className: "w-full px-3 py-2 text-sm bg-sunken border border-line rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-mono font-bold text-ink text-center"
    }
  )
] });
const SelectInput = ({ label, value, onChange, options }) => /* @__PURE__ */ jsxs("div", { children: [
  /* @__PURE__ */ jsx(Label, { children: label }),
  /* @__PURE__ */ jsx(
    "select",
    {
      value,
      onChange: (e) => onChange(e.target.value),
      className: "w-full px-3 py-2 text-sm bg-sunken border border-line rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-ink",
      children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.v, children: o.l }, o.v))
    }
  )
] });
const ColorPicker = ({ label, value, onChange }) => {
  const colors = [
    { c: vq.slate[900], n: "Black" },
    { c: vq.indigo[600], n: "Indigo" },
    { c: vq.blue[600], n: "Blue" },
    { c: vq.cyan[600], n: "Cyan" },
    { c: vq.emerald[600], n: "Emerald" },
    { c: vq.red[600], n: "Red" },
    { c: vq.amber[600], n: "Amber" },
    { c: vq.violet[600], n: "Violet" },
    { c: vq.pink[600], n: "Pink" },
    { c: vq.stone[600], n: "Stone" }
  ];
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Label, { children: label }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: colors.map((col) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onChange(col.c),
        type: "button",
        className: `w-6 h-6 rounded-full border-2 transition-transform ${value === col.c ? "border-brand-500 ring-1 ring-offset-1 ring-brand-500" : "border-transparent"}`,
        style: { backgroundColor: col.c },
        title: col.n
      },
      col.c
    )) })
  ] });
};
const LogoUploader = ({ data, setData }) => /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-surface rounded-xl border border-line", children: [
  /* @__PURE__ */ jsx(Label, { children: "Logo Image" }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mt-2", children: [
    data.print_logo_path ? /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: data.print_logo_path,
          alt: "Logo Preview",
          className: "w-20 h-20 object-contain bg-sunken rounded-lg p-1 border border-line"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setData((d) => ({ ...d, print_logo_path: null, print_logo_file: null }));
          },
          className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md",
          title: "Remove Logo",
          children: /* @__PURE__ */ jsx(X, { size: 12 })
        }
      )
    ] }) : /* @__PURE__ */ jsxs("div", { className: "w-20 h-20 bg-sunken rounded-lg border-2 border-dashed border-line dark:border-line flex flex-col items-center justify-center text-ink-muted gap-1", children: [
      /* @__PURE__ */ jsx(Image, { size: 20 }),
      /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold", children: "No Logo" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          id: "logo-upload",
          accept: "image/*",
          className: "hidden",
          onChange: (e) => {
            const file = e.target.files[0];
            if (file) {
              setData((d) => ({
                ...d,
                print_logo_file: file,
                print_logo_path: URL.createObjectURL(file)
              }));
            }
          }
        }
      ),
      /* @__PURE__ */ jsxs(
        "label",
        {
          htmlFor: "logo-upload",
          className: "inline-flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-bold cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Upload, { size: 14 }),
            data.print_logo_path ? "Change Logo" : "Upload Logo"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-2 leading-tight", children: "Recommended: PNG with transparent background. Max 2MB." })
    ] })
  ] })
] });
const B2BSettings = ({ data, setData }) => {
  return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in duration-fast", children: /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-ink-muted mb-4", children: "Invoice & PDF Styling (B2B)" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-secondary", children: "Invoice Template Theme" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: data.invoice_theme || "classic",
            onChange: (e) => setData("invoice_theme", e.target.value),
            className: "w-full px-3 py-2 bg-app border border-line rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer",
            children: [
              /* @__PURE__ */ jsx("option", { value: "classic", children: "Classic Minimalist" }),
              /* @__PURE__ */ jsx("option", { value: "modern", children: "Modern Professional" }),
              /* @__PURE__ */ jsx("option", { value: "elegant", children: "Elegant Serif" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Choose the layout aesthetic for downloadable B2B invoices and statements." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-secondary", children: "Primary Brand Color" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "color",
              value: data.invoice_primary_color || "#4f46e5",
              onChange: (e) => setData("invoice_primary_color", e.target.value),
              className: "h-9 w-12 bg-app border border-line rounded-lg cursor-pointer p-0.5"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.invoice_primary_color || "#4f46e5",
              onChange: (e) => setData("invoice_primary_color", e.target.value),
              className: "flex-1 px-3 py-2 bg-app border border-line rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-brand-500 outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Applied to header accents, table headers, and primary totals." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-line", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between cursor-pointer", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink block", children: "Show Margin on Invoices" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Display item cost profit margin on generated B2B invoices" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: data.show_margin_on_invoice === "1" || data.show_margin_on_invoice === true,
            onChange: (e) => setData("show_margin_on_invoice", e.target.checked),
            className: "w-4 h-4 accent-brand-500 rounded border-line focus:ring-brand-500"
          }
        )
      ] }) })
    ] })
  ] }) });
};
const HardwareSettings = ({ data, setData }) => {
  const { isConnected, printers, defaultPrinter, setDefaultPrinter, openDrawer } = useAMDStation();
  const [pulsing, setPulsing] = useState(false);
  const handlePulseDrawer = async () => {
    setPulsing(true);
    try {
      if (isAMDStationAvailable()) {
        const res = await openDrawer();
        if (res?.success !== false) {
          Swal.fire({
            title: "Drawer Signal Sent",
            text: "Trigger pulse sent to cash drawer kickout port.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            title: "Drawer Trigger Failed",
            text: "VenQore Station could not reach the printer kickout port.",
            icon: "error"
          });
        }
      } else {
        Swal.fire({
          title: "Direct Hardware Required",
          text: "Hardware drawer kickout requires VenQore Station companion app to be active.",
          icon: "info"
        });
      }
    } finally {
      setPulsing(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in duration-fast", children: /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-ink-muted mb-4", children: "Hardware Devices & Routing" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-app border border-line space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink", children: "VenQore Station Status" }),
          /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${isConnected ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-sunken text-ink-muted"}`, children: isConnected ? "Connected & Active" : "Standalone Browser Mode" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: isConnected ? "Desktop companion connected. Silent high-speed ESC/POS thermal printing and hardware cash drawer triggers are active." : "Running directly in browser. Printing opens the system print dialog. Connect VenQore Station desktop companion for silent receipts and automated drawer kicks." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-secondary", children: "Device Receipt Printer" }),
        printers && printers.length > 0 ? /* @__PURE__ */ jsx(
          "select",
          {
            value: defaultPrinter || "",
            onChange: (e) => setDefaultPrinter(e.target.value),
            className: "w-full px-3 py-2 bg-app border border-line rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer",
            children: printers.map((p) => /* @__PURE__ */ jsxs("option", { value: p.name, children: [
              p.name,
              " ",
              p.isDefault ? "(System Default)" : ""
            ] }, p.name))
          }
        ) : /* @__PURE__ */ jsx("div", { className: "p-3 bg-sunken rounded-xl text-2xs text-ink-muted", children: "System default printer selected. Launch VenQore Station to detect named thermal hardware." }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Physical printer assigned specifically to this cash register station." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-3 border-t border-line space-y-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between cursor-pointer", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink block", children: "Pulse Drawer on Cash Sale" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Send 24V kickout pulse via RJ11/RJ12 printer port" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.thermal_open_drawer === "1" || data.thermal_open_drawer === true,
              onChange: (e) => setData("thermal_open_drawer", e.target.checked),
              className: "w-4 h-4 accent-brand-500 rounded border-line focus:ring-brand-500 cursor-pointer"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled: pulsing,
            onClick: handlePulseDrawer,
            className: "w-full py-2 px-3 bg-sunken hover:bg-interactive-hover border border-line rounded-xl text-xs font-bold text-ink transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95",
            children: /* @__PURE__ */ jsx("span", { children: pulsing ? "Pulsing..." : "Test Cash Drawer Kickout" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-3 border-t border-line space-y-2", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between cursor-pointer", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink block", children: "Automatic Paper Cut" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Trigger guillotine paper knife at end of thermal receipt" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: data.thermal_auto_cut !== "0" && data.thermal_auto_cut !== false,
            onChange: (e) => setData("thermal_auto_cut", e.target.checked),
            className: "w-4 h-4 accent-brand-500 rounded border-line focus:ring-brand-500 cursor-pointer"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-xl space-y-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-brand-700 dark:text-brand-300 block", children: "Print Fault Protection (M17)" }),
        /* @__PURE__ */ jsx("p", { className: "text-3xs text-brand-600 dark:text-brand-400 leading-relaxed", children: "If the hardware station drops offline, AMD POS automatically routes receipt jobs through the browser print dialog. No receipt or transaction proof is ever silently dropped." })
      ] })
    ] })
  ] }) });
};
function DocumentLayoutsSection({ data, setData, saveSettings }) {
  const isPrintDecimalsEnabled = data.print_amount_decimal !== "0" && data.print_amount_decimal !== false;
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-line", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Amounts on Printed Documents" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Single shared precision rule for all printed templates (A4 invoices, B2B PDFs, and thermal receipts)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-app px-3.5 py-2 rounded-xl border border-line", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Preview:" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-brand-600 dark:text-brand-400", children: isPrintDecimalsEnabled ? "Rs. 1,234.50" : "Rs. 1,235" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 items-center", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            label: "Print Fractional Decimals on Documents",
            description: "When disabled, all printed lines and totals are rounded to whole numbers without decimal places.",
            enabled: isPrintDecimalsEnabled,
            onChange: (v) => setData("print_amount_decimal", v ? "1" : "0")
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "p-3 bg-app rounded-xl border border-line text-2xs text-ink-muted flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(Info, { size: 14, className: "text-brand-600 shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "To configure screen/system-wide number formatting instead of printouts, visit",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "Business > Region & Numbers" }),
            "."
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(PrintSettingsSection, { data, setData, saveSettings })
  ] });
}
const PRINT_TYPE_OPTIONS = [
  { value: "regular", label: "Regular A4 / Letter Document Printer" },
  { value: "thermal", label: "Thermal Roll Receipt Printer (POS)" }
];
const THERMAL_SIZE_OPTIONS = [
  { value: "2inch", label: "58mm (2-inch roll - 32 chars)" },
  { value: "3inch", label: "80mm (3-inch roll - 48 chars - Standard)" },
  { value: "4inch", label: "100mm (4-inch roll - 64 chars)" }
];
function PrinterDeviceSection({ data, setData }) {
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Printer and paper" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Default POS Print Destination" }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: PRINT_TYPE_OPTIONS,
            value: data.default_print_type || "regular",
            onChange: (val) => setData("default_print_type", val),
            searchable: false,
            placeholder: "Select Printer Type"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Choose whether checkout automatically opens thermal slip or full A4 preview." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-2 border-t border-line", children: [
        /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Thermal Paper Roll Width" }),
        /* @__PURE__ */ jsx(
          PremiumSelect,
          {
            options: THERMAL_SIZE_OPTIONS,
            value: data.thermal_page_size || "3inch",
            onChange: (val) => setData("thermal_page_size", val),
            searchable: false,
            placeholder: "Select Paper Size"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "What the printer does after a sale" }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.thermal_auto_cut !== "0" && data.thermal_auto_cut !== false,
            onChange: (v) => setData("thermal_auto_cut", v),
            label: "Cut the receipt automatically",
            description: "Cut the paper after each receipt, if your printer supports it."
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.thermal_open_drawer === true || data.thermal_open_drawer === "1",
            onChange: (v) => setData("thermal_open_drawer", v),
            label: "Open the cash drawer after a cash sale",
            description: "Open a connected cash drawer when a cash sale is completed."
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.thermal_use_bold !== "0" && data.thermal_use_bold !== false,
            onChange: (v) => setData("thermal_use_bold", v),
            label: "Make receipt headings bolder",
            description: "Print darker headings that are easier to read."
          }
        )
      ] })
    ] })
  ] }) });
}
function ManualSharingSection({ data, setData, saveSettings }) {
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-2xl border border-line flex items-start gap-3 text-xs text-ink-muted leading-relaxed", children: [
      /* @__PURE__ */ jsx(Info, { size: 16, className: "text-brand-600 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: "Explicit Delivery Policy: " }),
        "VENQORE uses standard WhatsApp Web / mobile Click-to-Chat protocol. Clicking share generates a prefilled conversation window on your device. We do not dispatch background SMS or automated Meta Cloud API calls, guaranteeing no third-party messaging fees."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Document Prefill Templates" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted block", children: "Sales Invoice Receipt Template" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              value: data.message_template_sales || "",
              onChange: (e) => setData("message_template_sales", e.target.value),
              className: "w-full p-3 bg-app text-ink border border-line rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none",
              placeholder: "Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready. Receipt: [Link]"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase", children: "Tags:" }),
            ["[Firm_Name]", "[Invoice_Number]", "[Invoice_Amount]", "[Link]"].map((tag) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setData("message_template_sales", (data.message_template_sales || "") + " " + tag),
                className: "px-1.5 py-0.5 bg-app hover:bg-surface border border-line rounded text-3xs font-mono font-bold text-brand-600 dark:text-brand-400",
                children: [
                  "+ ",
                  tag
                ]
              },
              tag
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-3 border-t border-line", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted block", children: "Credit Note / Return Template" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              value: data.message_template_returns || "",
              onChange: (e) => setData("message_template_returns", e.target.value),
              className: "w-full p-3 bg-app text-ink border border-line rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none",
              placeholder: "Greetings from [Firm_Name]. Credit Note / Return [Return_Number] for [Return_Amount] has been processed. Summary: [Link]"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase", children: "Tags:" }),
            ["[Firm_Name]", "[Return_Number]", "[Return_Amount]", "[Link]"].map((tag) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setData("message_template_returns", (data.message_template_returns || "") + " " + tag),
                className: "px-1.5 py-0.5 bg-app hover:bg-surface border border-line rounded text-3xs font-mono font-bold text-brand-600 dark:text-brand-400",
                children: [
                  "+ ",
                  tag
                ]
              },
              tag
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-3 border-t border-line", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted block", children: "Manual Receivable Reminder Template" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              value: data.message_template_reminders || "",
              onChange: (e) => setData("message_template_reminders", e.target.value),
              className: "w-full p-3 bg-app text-ink border border-line rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none",
              placeholder: "Dear [Customer_Name], this is a friendly reminder that invoice #[Invoice_Number] from [Firm_Name] is outstanding. Current amount due: [Due_Amount]. View receipt: [Link]"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase", children: "Tags:" }),
            ["[Customer_Name]", "[Invoice_Number]", "[Due_Amount]", "[Firm_Name]", "[Link]"].map((tag) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setData("message_template_reminders", (data.message_template_reminders || "") + " " + tag),
                className: "px-1.5 py-0.5 bg-app hover:bg-surface border border-line rounded text-3xs font-mono font-bold text-brand-600 dark:text-brand-400",
                children: [
                  "+ ",
                  tag
                ]
              },
              tag
            ))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Sharing Preferences" }),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.whatsapp_offer_pdf !== "0" && data.whatsapp_offer_pdf !== false,
            onChange: (v) => setData("whatsapp_offer_pdf", v),
            label: "Offer PDF Attachment Alongside Draft",
            description: "Opens native mobile share sheet or provides direct PDF receipt download link."
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: "Sender Name Source:" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "The ",
            /* @__PURE__ */ jsx("code", { children: "[Firm_Name]" }),
            " tag automatically uses your official Business Name configured under",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "Business > Business Profile" }),
            " (currently: ",
            /* @__PURE__ */ jsx("em", { children: data.business_name || "VENQORE" }),
            ")."
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
function RemindersAlertsSection({ data, setData }) {
  const tt = useTermText();
  const [reminderSearch, setReminderSearch] = useState("");
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Email summaries" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.email_notifications !== "0" && data.email_notifications !== false,
            onChange: (v) => setData("email_notifications", v),
            label: "Weekly business summary",
            description: "Email a summary of sales and stock activity to the store owner.",
            icon: Mail
          }
        ),
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            enabled: data.daily_sales_summary === true || data.daily_sales_summary === "1",
            onChange: (v) => setData("daily_sales_summary", v),
            label: "Daily sales summary",
            description: "Email the day's sales totals to the store owner.",
            icon: Mail
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-line pb-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Overdue payment reminders" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Choose when an unpaid customer bill should appear for follow-up." })
        ] }),
        /* @__PURE__ */ jsx(Clock, { size: 18, className: "text-ink-muted" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Days after the due date" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                max: "90",
                value: data.payment_reminder_days || 7,
                onChange: (e) => setData("payment_reminder_days", parseInt(e.target.value, 10) || 7),
                className: "w-32 px-3.5 py-2 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted", children: "days past due date" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-3 bg-app rounded-xl border border-line text-2xs text-ink-muted flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(Info, { size: 14, className: "text-brand-600 shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsx("span", { children: "Staff can review overdue bills and prepare a WhatsApp message. The message is not sent automatically." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-xs overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Service schedules" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Save repeat intervals for services such as oil changes. Customer messages are not sent automatically." })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              const newReminder = {
                id: Date.now(),
                name: tt("New Service"),
                interval: 30,
                unit: "days"
              };
              setData("service_reminders", [...data.service_reminders || [], newReminder]);
            },
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              " Add Service Cycle"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: (data.service_reminders || []).length > 0 ? (data.service_reminders || []).map((reminder, idx) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex items-center justify-between hover:bg-app/40 transition-colors group", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-app text-ink-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Clock, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-sm", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: reminder.name,
                onChange: (e) => {
                  const newItems = [...data.service_reminders];
                  newItems[idx].name = e.target.value;
                  setData("service_reminders", newItems);
                },
                placeholder: "Service Name (e.g. Engine Oil Service)",
                className: "w-full bg-transparent border-0 p-0 text-sm font-bold text-ink focus:ring-0 outline-none"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted uppercase font-bold tracking-widest mt-0.5", children: "Recurring Service" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-app px-3 py-1.5 rounded-xl border border-line", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase", children: "Every" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: reminder.interval,
                onChange: (e) => {
                  const newItems = [...data.service_reminders];
                  newItems[idx].interval = e.target.value;
                  setData("service_reminders", newItems);
                },
                className: "w-12 bg-transparent border-0 p-0 text-xs font-bold text-brand-600 dark:text-brand-400 focus:ring-0 text-center outline-none"
              }
            ),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: reminder.unit,
                onChange: (e) => {
                  const newItems = [...data.service_reminders];
                  newItems[idx].unit = e.target.value;
                  setData("service_reminders", newItems);
                },
                className: "bg-transparent border-0 p-0 text-xs font-bold text-ink focus:ring-0 outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "days", children: "Days" }),
                  /* @__PURE__ */ jsx("option", { value: "months", children: "Months" }),
                  /* @__PURE__ */ jsx("option", { value: "years", children: "Years" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              const newItems = data.service_reminders.filter((r) => r.id !== reminder.id);
              setData("service_reminders", newItems);
            },
            className: "p-2 text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all",
            title: "Delete Service Cycle",
            children: /* @__PURE__ */ jsx(Trash2, { size: 15 })
          }
        )
      ] }, reminder.id)) : /* @__PURE__ */ jsxs("div", { className: "py-10 flex flex-col items-center justify-center text-ink-muted", children: [
        /* @__PURE__ */ jsx(Clock, { size: 32, className: "mb-2 opacity-30" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-xs text-ink", children: "No Service Cycles Configured" }),
        /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-0.5", children: "Add a service schedule to keep its repeat interval on record." })
      ] }) })
    ] })
  ] });
}
function AccountingSection({ data, setData }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Financial Cycles & Branches" }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-dashed border-line bg-app/50 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Building2, { size: 14, className: "text-amber-500" }),
            "Multi-Firm Branch Accounting"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-3xs font-bold bg-amber-500/10 text-amber-600 rounded", children: "In Development" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Dedicated legal entity separation and branch-isolated journal posting are currently in development. Transactions are tracked within the primary store ledger." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-2 border-t border-line", children: [
        /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Fiscal Year Start Date" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: data.fiscal_year_start || "2025-01-01",
            onChange: (e) => setData("fiscal_year_start", e.target.value),
            className: "w-full px-4 py-2.5 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold shadow-xs"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-1", children: "Used by financial statements, balance sheets, and annual P&L period closings." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-line space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Financial Period Locks" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Freeze historical dates to prevent retroactive ledger tampering" })
        ] }) }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.v3.fiscal-year.index", { store_slug: store?.slug || route().params?.store_slug }),
            className: "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 w-full sm:w-auto",
            children: [
              /* @__PURE__ */ jsx(Lock, { size: 14 }),
              /* @__PURE__ */ jsx("span", { children: "Manage Fiscal Years & Hard Locks" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink border-b border-line pb-3", children: "Reckoner Intelligence Tuning" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Heavy Discount Review Flag" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400", children: [
              data["reckoner.heavy_discount_pct"] ?? 20,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "1",
              max: "100",
              value: data["reckoner.heavy_discount_pct"] ?? 20,
              onChange: (e) => setData("reckoner.heavy_discount_pct", parseInt(e.target.value, 10) || 20),
              className: "w-full px-4 py-2 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Discounts above this percentage trigger manager review flags in audit logs." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1 pt-2 border-t border-line", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Expiry Warning Horizon" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400", children: [
              data["reckoner.expiry_warning_days"] ?? 30,
              " days"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "1",
              max: "365",
              value: data["reckoner.expiry_warning_days"] ?? 30,
              onChange: (e) => setData("reckoner.expiry_warning_days", parseInt(e.target.value, 10) || 30),
              className: "w-full px-4 py-2 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Products expiring within this timeframe are surfaced on executive dashboards." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1 pt-2 border-t border-line", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Inventory Carrying Cost Rate" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400", children: [
              data["reckoner.carrying_cost_pct"] ?? 15,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "1",
              max: "100",
              value: data["reckoner.carrying_cost_pct"] ?? 15,
              onChange: (e) => setData("reckoner.carrying_cost_pct", parseInt(e.target.value, 10) || 15),
              className: "w-full px-4 py-2 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Annual holding rate used to estimate carrying cost on excess inventory." })
        ] })
      ] })
    ] })
  ] }) });
}
const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (High Quality, Fast)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Budget)" }
];
function FeaturesConnectionsSection({
  data,
  setData,
  handleVerifyKey,
  verifyingKey,
  verificationResult
}) {
  const tt = useTermText();
  const { store, woocommerce_enabled } = usePage().props;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-r from-brand-600/10 via-brand-500/5 to-transparent bg-surface rounded-2xl border border-brand-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 22 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink leading-tight", children: "Modular System Builder" }),
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-3xs font-bold uppercase tracking-wider rounded-full", children: "App Store" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Activate optional vertical capabilities like Pharmacy, Restaurant, Manufacturing, Multi-Store, and Repairs." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: `/${store?.slug || "store"}/system-builder`,
          className: "inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0",
          children: [
            /* @__PURE__ */ jsx("span", { children: "Launch System Builder" }),
            /* @__PURE__ */ jsx(ExternalLink, { size: 14 })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pb-4 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-ink leading-tight", children: "AI & Natural Language Search" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
            "Power conversational insights such as ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600 dark:text-brand-400 font-medium", children: '"How much sugar did we sell last week?"' })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => {
              if (data.ai_provider !== "gemini") {
                setData((d) => ({
                  ...d,
                  ai_provider: "gemini",
                  ai_model: "gemini-2.5-flash",
                  openai_api_key: ""
                }));
              }
            },
            className: `cursor-pointer group relative p-5 rounded-2xl border transition-all duration-normal overflow-hidden ${data.ai_provider === "gemini" ? "border-brand-500 bg-brand-50/20 dark:bg-brand-900/10 shadow-sm ring-1 ring-brand-500/30" : "border-line bg-app/50 hover:border-brand-500/30"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h5", { className: "text-sm font-bold text-ink leading-tight", children: "Google Gemini" }),
                    /* @__PURE__ */ jsx("span", { className: "inline-block mt-0.5 text-3xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Free Tier Available" })
                  ] })
                ] }),
                data.ai_provider === "gemini" && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-brand-600 text-white text-3xs font-bold rounded-full uppercase tracking-wider", children: "Selected" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed mb-4", children: "Fast and multimodal model from Google. Generous free tier for store queries and catalog intelligence." }),
              /* @__PURE__ */ jsx("div", { className: `space-y-3 transition-all duration-normal ${data.ai_provider === "gemini" ? "opacity-100" : "opacity-50 pointer-events-none"}`, children: /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Gemini API Key" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "password",
                      value: data.ai_provider === "gemini" ? data.openai_api_key : "",
                      onChange: (e) => setData("openai_api_key", e.target.value),
                      className: "w-full pl-3.5 pr-24 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none",
                      placeholder: "AIzaSy...",
                      autoComplete: "off"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute right-1.5 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        handleVerifyKey?.();
                      },
                      disabled: verifyingKey || data.ai_provider !== "gemini" || !data.openai_api_key,
                      className: "px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-3xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95",
                      children: verifyingKey ? "Checking..." : "Check Key"
                    }
                  ) })
                ] }),
                verificationResult && data.ai_provider === "gemini" && /* @__PURE__ */ jsxs("div", { className: `mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${verificationResult.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`, children: [
                  verificationResult.type === "success" ? /* @__PURE__ */ jsx(Check, { size: 14 }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
                  /* @__PURE__ */ jsx("span", { children: verificationResult.message })
                ] })
              ] }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => {
              if (data.ai_provider !== "openai") {
                setData((d) => ({
                  ...d,
                  ai_provider: "openai",
                  ai_model: "gpt-4o",
                  openai_api_key: ""
                }));
              }
            },
            className: `cursor-pointer group relative p-5 rounded-2xl border transition-all duration-normal overflow-hidden ${data.ai_provider === "openai" ? "border-brand-500 bg-brand-50/20 dark:bg-brand-900/10 shadow-sm ring-1 ring-brand-500/30" : "border-line bg-app/50 hover:border-brand-500/30"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Globe, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h5", { className: "text-sm font-bold text-ink leading-tight", children: "OpenAI GPT-4" }),
                    /* @__PURE__ */ jsx("span", { className: "inline-block mt-0.5 text-3xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Paid Account" })
                  ] })
                ] }),
                data.ai_provider === "openai" && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-brand-600 text-white text-3xs font-bold rounded-full uppercase tracking-wider", children: "Selected" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed mb-4", children: "High accuracy reasoning model from OpenAI. Requires a paid OpenAI billing key." }),
              /* @__PURE__ */ jsxs("div", { className: `space-y-3 transition-all duration-normal ${data.ai_provider === "openai" ? "opacity-100" : "opacity-50 pointer-events-none"}`, children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "OpenAI API Key" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "password",
                        value: data.ai_provider === "openai" ? data.openai_api_key : "",
                        onChange: (e) => setData("openai_api_key", e.target.value),
                        className: "w-full pl-3.5 pr-24 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none",
                        placeholder: "sk-proj-...",
                        autoComplete: "off"
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: "absolute right-1.5 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: (e) => {
                          e.stopPropagation();
                          handleVerifyKey?.();
                        },
                        disabled: verifyingKey || data.ai_provider !== "openai" || !data.openai_api_key,
                        className: "px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-3xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95",
                        children: verifyingKey ? "Checking..." : "Check Key"
                      }
                    ) })
                  ] }),
                  verificationResult && data.ai_provider === "openai" && /* @__PURE__ */ jsxs("div", { className: `mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${verificationResult.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`, children: [
                    verificationResult.type === "success" ? /* @__PURE__ */ jsx(Check, { size: 14 }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
                    /* @__PURE__ */ jsx("span", { children: verificationResult.message })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Model Selection" }),
                  /* @__PURE__ */ jsx(
                    PremiumSelect,
                    {
                      options: OPENAI_MODELS,
                      value: data.ai_model || "gpt-4o",
                      onChange: (val) => setData("ai_model", val),
                      searchable: false,
                      placeholder: "Select OpenAI Model"
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl border border-line space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-ink", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: "text-brand-600" }),
          /* @__PURE__ */ jsx("span", { children: "Data Privacy & Intelligence Sharing" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
          /* @__PURE__ */ jsx(
            Toggle$1,
            {
              label: tt("Opt out of Shared Product Catalog"),
              description: "Do not contribute anonymized SKU names/barcodes to global catalog matching",
              enabled: Boolean(data.shared_catalog_opt_out),
              onChange: (checked) => {
                setData("shared_catalog_opt_out", checked);
                router.post(route("store.settings.data-privacy.update", { store_slug: store?.slug }), {
                  shared_catalog_opt_out: checked,
                  ai_accuracy_opt_in: Boolean(data.ai_accuracy_opt_in)
                }, { preserveScroll: true });
              }
            }
          ),
          /* @__PURE__ */ jsx(
            Toggle$1,
            {
              label: "Opt in to AI Accuracy Learning",
              description: "Allow anonymized receipt extraction corrections to train model prompts",
              enabled: Boolean(data.ai_accuracy_opt_in),
              onChange: (checked) => {
                setData("ai_accuracy_opt_in", checked);
                router.post(route("store.settings.data-privacy.update", { store_slug: store?.slug }), {
                  shared_catalog_opt_out: Boolean(data.shared_catalog_opt_out),
                  ai_accuracy_opt_in: checked
                }, { preserveScroll: true });
              }
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pb-4 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Shield, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-ink leading-tight", children: "FBR POS Fiscalization" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Direct real-time fiscal invoice integration with Pakistan Federal Board of Revenue" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Toggle$1,
        {
          label: "Enable FBR Fiscalization",
          description: "Automatically sign and broadcast sales invoices to the FBR API",
          enabled: Boolean(data.fbr_integration),
          onChange: (v) => setData("fbr_integration", v)
        }
      ),
      data.fbr_integration && /* @__PURE__ */ jsx("div", { className: "pt-3 border-t border-line space-y-4 animate-in fade-in slide-in-from-top-2 duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "FBR POS ID" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.fbr_pos_id || "",
              onChange: (e) => setData("fbr_pos_id", e.target.value),
              className: "w-full px-4 py-2.5 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-ink",
              placeholder: "e.g. 100234"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "FBR USIN" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.fbr_usin || "",
              onChange: (e) => setData("fbr_usin", e.target.value),
              className: "w-full px-4 py-2.5 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-ink",
              placeholder: "e.g. USIN-994821"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs opacity-80 flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Wifi, { size: 20 }) }),
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-3xs font-bold uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30", children: "Upcoming" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Stripe Terminal & Payments" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 leading-relaxed", children: "Process in-person contactless NFC cards and online checkout payments through Stripe." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-4 mt-4 border-t border-line", children: /* @__PURE__ */ jsx(Toggle$1, { enabled: false, disabled: true, upcoming: true, onChange: () => {
        }, label: "Stripe Card Reader" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Globe, { size: 20 }) }),
            /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 text-3xs font-bold uppercase tracking-wider rounded border ${woocommerce_enabled ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-app text-ink-muted border-line"}`, children: woocommerce_enabled ? "Connected" : "Available" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "WooCommerce Online Store" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 leading-relaxed", children: "Bi-directional product stock, order sync, and customer matching with your WordPress eCommerce store." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-4 mt-4 border-t border-line", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: `/${store?.slug || "store"}/system-builder`,
            className: "text-xs font-bold text-brand-600 hover:text-brand-500 inline-flex items-center gap-1",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Configure in System Builder" }),
              /* @__PURE__ */ jsx(ExternalLink, { size: 12 })
            ]
          }
        ) })
      ] })
    ] })
  ] });
}
function SecuritySection({ data, setData }) {
  const isPasscodeActive = data.enable_passcode === "1" || data.enable_passcode === true;
  const isSsoActive = data.sso_enabled === "1" || data.sso_enabled === true;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pb-4 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Shield, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink leading-tight", children: "Protect important actions" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Protect sensitive POS cashier operations and terminal sessions" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
        /* @__PURE__ */ jsx(
          Toggle$1,
          {
            label: "Require a manager's passcode",
            description: "Ask for a six-digit code before refunds, cancelled invoices, price changes, and store resets.",
            enabled: isPasscodeActive,
            onChange: (v) => setData("enable_passcode", v),
            icon: Lock
          }
        ),
        isPasscodeActive && /* @__PURE__ */ jsx("div", { className: "py-4 pl-12 animate-in fade-in slide-in-from-top-2 duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl border border-line space-y-2.5 max-w-md", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Admin 6-Digit PIN" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                maxLength: "6",
                value: data.admin_passcode || "",
                onChange: (e) => setData("admin_passcode", e.target.value.replace(/\D/g, "")),
                className: "w-full pl-4 pr-10 py-2.5 bg-surface border border-line rounded-xl text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-brand-500 text-ink shadow-xs outline-none transition-all",
                placeholder: "••••••"
              }
            ),
            /* @__PURE__ */ jsx(Lock, { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted", size: 16 })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted", children: "Leave blank to retain current active passcode." })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "py-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pr-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-app text-ink-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Lock, { size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Sign out after inactivity" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Automatically lock the workstation session after idle time (set 0 to disable)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                max: "480",
                value: data.auto_logout !== void 0 && data.auto_logout !== null ? data.auto_logout : 30,
                onChange: (e) => setData("auto_logout", Math.max(0, parseInt(e.target.value, 10) || 0)),
                className: "w-20 px-3 py-1.5 bg-app border border-line rounded-xl text-sm font-bold text-ink text-center focus:ring-2 focus:ring-brand-500 outline-none"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted", children: Number(data.auto_logout) === 0 ? "off" : "min" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Key, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Extra sign-in protection" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 leading-relaxed", children: "Pair an Authenticator App (Google Authenticator, Microsoft Authenticator) with your personal login." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-4 mt-4 border-t border-line", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/profile#security",
            className: "inline-flex items-center gap-2 px-3.5 py-2 bg-app hover:bg-sunken text-ink text-xs font-bold rounded-xl border border-line transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Manage in Profile" }),
              /* @__PURE__ */ jsx(ExternalLink, { size: 13 })
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Users, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Staff Roles & Max Discounts" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 leading-relaxed", children: "Grant cashier, manager, and auditor role permissions and set maximum allowable manual invoice discounts." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-4 mt-4 border-t border-line", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/users",
            className: "inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Manage Staff & Roles" }),
              /* @__PURE__ */ jsx(ExternalLink, { size: 13 })
            ]
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pb-4 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Lock, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-ink leading-tight", children: "Sign in with your company's account" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Connect corporate Okta, Azure AD, or Google Workspace Single Sign-On" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-xs text-amber-800 dark:text-amber-300", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "shrink-0 mt-0.5 text-amber-600" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Enterprise SSO (In Development)" }),
          /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-amber-700 dark:text-amber-400 leading-relaxed", children: "Single Sign-On (SAML 2.0 / Azure AD / Okta) connection is in progress and will be available in an upcoming update. Currently, staff authenticate using their credentials." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Toggle$1,
        {
          label: "Allow company account sign-in",
          description: "Connect your company's sign-in service (Upcoming feature).",
          enabled: false,
          disabled: true,
          upcoming: true,
          onChange: () => {
          }
        }
      ),
      isSsoActive && /* @__PURE__ */ jsxs("div", { className: "pt-3 border-t border-line space-y-4 animate-in fade-in slide-in-from-top-2 duration-normal", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "IdP Entity ID" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.sso_idp_entity_id || "",
              onChange: (e) => setData("sso_idp_entity_id", e.target.value),
              className: "w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none",
              placeholder: "https://identity-provider.com/metadata"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Single Sign-On Service URL" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.sso_url || "",
              onChange: (e) => setData("sso_url", e.target.value),
              className: "w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none",
              placeholder: "https://identity-provider.com/sso"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "X.509 Public Certificate" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: data.sso_certificate || "",
              onChange: (e) => setData("sso_certificate", e.target.value),
              className: "w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none resize-none",
              rows: 4,
              placeholder: "-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function ApprovalsSection({ data, setData, store }) {
  useTermText();
  const currencySymbol = store?.currency_symbol || "$";
  const documentTypes = [
    { key: "customer_receipt", label: "Customer Receipts" },
    { key: "supplier_payment", label: "Supplier Payments" },
    { key: "operating_expense", label: "Operating Expenses" },
    { key: "sales_invoice", label: "Sales Invoices" },
    { key: "supplier_refund", label: "Supplier Refunds" },
    { key: "purchase_posting", label: "Purchase Postings" },
    { key: "sales_return", label: "Sales Returns" },
    { key: "purchase_return", label: "Purchase Returns" },
    { key: "capital_injection", label: "Capital Injections" },
    { key: "owner_drawings", label: "Owner Drawings" },
    { key: "fund_transfer", label: "Fund Transfers" }
  ];
  return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 26 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink", children: "Approvals" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Configure store-wide transaction maker-checker approval controls and dual authorization policies." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2 border-t border-line", children: [
      /* @__PURE__ */ jsx(
        Toggle$1,
        {
          enabled: Boolean(data.approval_admin_enabled),
          onChange: (v) => setData("approval_admin_enabled", v),
          label: "Require approval for selected transactions",
          description: "Send transactions that match your rules to a manager before they are completed."
        }
      ),
      /* @__PURE__ */ jsx(
        Toggle$1,
        {
          enabled: Boolean(data.approval_strict_owner_separation),
          onChange: (v) => setData("approval_strict_owner_separation", v),
          label: "Do not allow people to approve their own requests",
          description: "Someone else must approve a transaction submitted by the owner or staff."
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-1", children: "Default Employee Approval Mode" }),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: data.approval_default_employee_mode || "inherit",
              onChange: (val) => setData("approval_default_employee_mode", val),
              options: [
                { value: "inherit", label: "Inherit Store Policy (Default)" },
                { value: "required", label: "Always Require Approval" },
                { value: "direct", label: "Direct Posting (Bypass Approval)" }
              ],
              searchable: false
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Default policy applied to invited staff members unless customized per-user." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-ink-secondary mb-1", children: [
            "Approval Amount Threshold (",
            currencySymbol,
            ")"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "0",
              step: "0.01",
              value: data.approval_amount_threshold ?? "0",
              onChange: (e) => setData("approval_amount_threshold", e.target.value),
              className: "w-full px-4 py-3 bg-sunken border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
              placeholder: "0.00"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Transactions equal to or above this amount automatically trigger approval review." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-line space-y-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink uppercase tracking-wider", children: "Choose which transactions need approval" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: documentTypes.map(({ key, label }) => {
          const policyKey = `approval_policy_${key}`;
          const thresholdKey = `approval_threshold_${key}`;
          return /* @__PURE__ */ jsxs("div", { className: "p-4 bg-sunken/50 rounded-xl border border-line space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm text-ink shrink-0", children: label }),
              /* @__PURE__ */ jsx("div", { className: "w-44", children: /* @__PURE__ */ jsx(
                PremiumSelect,
                {
                  value: data[policyKey] || "inherit",
                  onChange: (val) => setData(policyKey, val),
                  options: [
                    { value: "inherit", label: "Inherit Policy" },
                    { value: "required", label: "Always Required" },
                    { value: "disabled", label: "Disabled (Direct)" }
                  ],
                  searchable: false
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted whitespace-nowrap", children: [
                "Threshold (",
                currencySymbol,
                "):"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: data[thresholdKey] ?? "",
                  onChange: (e) => setData(thresholdKey, e.target.value),
                  placeholder: "Inherit store threshold",
                  className: "w-full px-3 py-1.5 bg-surface text-ink placeholder:text-ink-faint border border-line rounded-lg text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                }
              )
            ] })
          ] }, key);
        }) })
      ] })
    ] })
  ] }) });
}
function DangerSettingsSection({ data, setData }) {
  const tt = useTermText();
  const [resetting, setResetting] = useState(false);
  const { store, auth } = usePage().props;
  const storeSlug = store?.slug || "demo";
  const user = auth?.user;
  const isGoogleNoPassword = !!(user?.google_id && !user?.has_password);
  const handleFactoryReset = async (type = "all") => {
    let title = "Are you sure?";
    let text = "This action cannot be undone.";
    let confirmText = "Yes, delete it!";
    let url = `/s/${storeSlug}/api/system/reset`;
    if (type === "all") {
      title = "FACTORY RESET";
      text = tt("WARNING: This will delete ALL sales, products, customers, and transactions. Only your admin account will remain. This process is IRREVERSIBLE.");
      confirmText = "I UNDERSTAND, WIPE EVERYTHING";
    } else {
      url = `/s/${storeSlug}/api/system/reset/${type}`;
      text = `This will permanently delete all ${type} data.`;
      confirmText = `Yes, delete ${type}`;
    }
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: confirmText,
      background: vq.slate[800],
      color: "#fff"
    });
    if (!result.isConfirmed) return;
    if (isGoogleNoPassword) {
      await Swal.fire({
        title: "Password Required",
        text: "You signed in with Google and have not set a password. For security, please set a password in your Profile first, then return to confirm this action.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Go to Profile Settings",
        cancelButtonText: "Cancel",
        background: vq.slate[800],
        color: "#fff"
      }).then((res) => {
        if (res.isConfirmed) {
          window.location.href = route("store.profile.edit", { store_slug: storeSlug });
        }
      });
      return;
    }
    const { value: password } = await Swal.fire({
      title: "Authentication Required",
      text: "Please enter your password or admin passcode to confirm.",
      input: "password",
      inputPlaceholder: "Enter your password",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Confirm Deletion",
      cancelButtonColor: "#3085d6",
      background: vq.slate[800],
      color: "#fff",
      inputValidator: (value) => {
        if (!value) {
          return "You need to enter your password!";
        }
      }
    });
    if (password) {
      setResetting(true);
      if (Swal.isVisible()) {
        Swal.close();
      }
      setTimeout(async () => {
        let timerInterval;
        Swal.fire({
          title: "Factory Reset In Progress",
          html: `
                        <div class="mb-2 flex justify-between text-sm font-medium text-neutral-300">
                            <span id="swal-reset-text">Initializing wipe sequence...</span>
                            <span id="swal-reset-percent">0%</span>
                        </div>
                        <div class="w-full bg-neutral-700 rounded-full h-3 mb-4 overflow-hidden border border-neutral-600">
                            <div id="swal-reset-bar" class="bg-red-600 h-3 rounded-full transition-all duration-slow relative" style="width: 0%">
                                <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p class="text-xs text-red-400 mt-2 animate-pulse">DO NOT CLOSE THIS WINDOW. POWER OFF MAY CAUSE CORRUPTION.</p>
                    `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          background: vq.slate[800],
          color: "#fff",
          didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector("#swal-reset-bar");
            const t = Swal.getHtmlContainer().querySelector("#swal-reset-text");
            const p = Swal.getHtmlContainer().querySelector("#swal-reset-percent");
            let progress = 0;
            timerInterval = setInterval(() => {
              if (progress < 30) {
                progress += 2;
                if (t) t.textContent = "Deleting database records...";
              } else if (progress < 60) {
                progress += 0.5;
                if (t) t.textContent = "Clearing transaction history...";
              } else if (progress < 80) {
                progress += 0.2;
                if (t) t.textContent = "Removing cache files...";
              } else if (progress < 95) {
                progress += 0.05;
                if (t) t.textContent = "Finalizing system reset...";
              }
              if (progress > 95) progress = 95;
              if (b) b.style.width = progress + "%";
              if (p) p.textContent = Math.round(progress) + "%";
            }, 100);
          }
        });
        try {
          const response = await axios.post(url, { password }, { timeout: 12e4 });
          clearInterval(timerInterval);
          Swal.fire({
            title: "Deleted!",
            text: response.data.message || "System has been reset.",
            icon: "success",
            background: vq.slate[800],
            color: "#fff"
          }).then(() => {
            window.location.reload();
          });
        } catch (error) {
          clearInterval(timerInterval);
          console.error("Reset Error:", error);
          let errorMsg = error.response?.data?.message || "Something went wrong.";
          if (error.code === "ECONNABORTED") {
            errorMsg = "The operation timed out. Data might be partially deleted. Please refresh the page.";
          } else if (error.response?.status === 403) {
            errorMsg = "Invalid Password or Passcode.";
          } else if (error.response?.status === 500) {
            errorMsg = "Server Error (500). Please check if the server is running or if a transaction is stuck. Try restarting the application.";
          }
          Swal.fire({
            title: "Error!",
            text: errorMsg,
            icon: "error",
            background: vq.slate[800],
            color: "#fff"
          }).then(() => {
            setResetting(false);
          });
        }
      }, 600);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Complete Store Factory Reset" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Wipes all catalog items, sales, invoices, customers, and financial journals. Only your administrator credentials will be retained." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleFactoryReset("all"),
          disabled: resetting,
          className: `w-full py-3.5 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 ${resetting ? "bg-red-900/80 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`,
          children: resetting ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-red-200", size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Processing Wipe Sequence..." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Trash2, { size: 16 }),
            /* @__PURE__ */ jsx("span", { children: "FACTORY RESET (WIPE ALL DATA)" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-line space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "Selective Data Deletion" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Delete specific data partitions while preserving the rest of your store configuration." }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleFactoryReset("products"),
            disabled: resetting,
            className: "p-4 bg-app hover:bg-sunken border border-line hover:border-red-500/40 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 15, className: "text-red-500" }),
              /* @__PURE__ */ jsx("span", { children: tt("Delete All Products") })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleFactoryReset("sales"),
            disabled: resetting,
            className: "p-4 bg-app hover:bg-sunken border border-line hover:border-red-500/40 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 15, className: "text-red-500" }),
              /* @__PURE__ */ jsx("span", { children: "Delete All Sales" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleFactoryReset("stock"),
            disabled: resetting,
            className: "p-4 bg-app hover:bg-sunken border border-line hover:border-red-500/40 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 15, className: "text-red-500" }),
              /* @__PURE__ */ jsx("span", { children: "Reset Stock to 0" })
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
const SETTINGS_CATEGORIES = [
  {
    id: "business",
    name: "Business",
    icon: Building2,
    sections: ["profile", "region_numbers", "display"]
  },
  {
    id: "selling",
    name: "Selling",
    icon: ShoppingCart,
    sections: ["checkout_returns", "documents_numbering", "taxes", "customers_suppliers"]
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    sections: ["stock_items"]
  },
  {
    id: "printing_sharing",
    name: "Printing & Sharing",
    icon: Printer,
    sections: ["document_layouts", "printer_device", "manual_sharing"]
  },
  {
    id: "operations",
    name: "Operations",
    icon: ClockIconWrapper,
    sections: ["reminders_alerts", "accounting", "features_connections"]
  },
  {
    id: "access_data",
    name: "Access & Data",
    icon: Shield,
    sections: ["security", "approvals", "terminals", "backup", "reset"]
  }
];
function ClockIconWrapper(props) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: props.size || 16,
      height: props.size || 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: props.className,
      children: [
        /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ jsx("polyline", { points: "12 6 12 12 16 14" })
      ]
    }
  );
}
const SETTINGS_SECTIONS = [
  // Business
  {
    id: "profile",
    name: "Business Profile",
    icon: Building2,
    description: "Store name, address, phone, tax ID & custom domain",
    keywords: ["name", "logo", "address", "phone", "email", "ntn", "tax", "domain", "store"]
  },
  {
    id: "region_numbers",
    name: "Region & Numbers",
    icon: Globe,
    description: "Currency, timezone, language, date format & decimal precision",
    keywords: ["currency", "symbol", "timezone", "language", "date", "decimals", "precision", "money"]
  },
  {
    id: "display",
    name: "Display Preferences",
    icon: Palette,
    description: "Text size, color theme, calculator and easier-to-read controls",
    keywords: ["zoom", "scale", "dark mode", "calculator", "senior", "theme", "appearance", "density"]
  },
  // Selling
  {
    id: "checkout_returns",
    name: "Checkout & Returns",
    icon: ShoppingCart,
    description: "Cash payments, rounding, stock checks and returns",
    keywords: ["register", "cash", "round off", "negative stock", "overselling", "returns", "refunds", "window"]
  },
  {
    id: "documents_numbering",
    name: "Documents & Numbering",
    icon: FileText,
    description: "Invoice types and the numbers shown on documents",
    keywords: ["invoice", "prefix", "billing", "numbering", "quotation", "purchase", "series"]
  },
  {
    id: "taxes",
    name: "Taxes",
    icon: PercentIconWrapper,
    description: "Tax rates and whether prices include tax",
    keywords: ["tax", "gst", "vat", "inclusive", "exclusive", "rates", "fbr"]
  },
  {
    id: "customers_suppliers",
    name: "Customers & Suppliers",
    icon: Users,
    description: "Customer and supplier groups, credit limits and rewards",
    keywords: ["customer", "party", "supplier", "credit limit", "loyalty", "points", "reward"]
  },
  // Inventory
  {
    id: "stock_items",
    name: "Stock & Items",
    icon: Package,
    description: "Stock tracking, barcodes, batches and wholesale prices",
    keywords: ["stock", "inventory", "barcode", "scanner", "batch", "expiry", "wholesale", "cost", "charity"]
  },
  // Printing & Sharing
  {
    id: "document_layouts",
    name: "Document Layouts",
    icon: Layout,
    description: "How receipts and invoices look when printed",
    keywords: ["layout", "a4", "a5", "pdf", "printed decimals", "theme", "columns", "header", "footer", "logo"]
  },
  {
    id: "printer_device",
    name: "Printer & Device",
    icon: Printer,
    description: "Receipt paper, printer actions and cash drawer",
    keywords: ["thermal", "printer", "esc/pos", "auto-cut", "cash drawer", "slip", "receipt", "cut"]
  },
  {
    id: "manual_sharing",
    name: "Manual Sharing",
    icon: MessageSquare,
    description: "Prepare messages and share invoices yourself",
    keywords: ["whatsapp", "messages", "templates", "share", "drafts", "click to chat", "sms"]
  },
  // Operations
  {
    id: "reminders_alerts",
    name: "Reminders & Alerts",
    icon: Bell,
    description: "Payment due reminders, recurring service schedules & low stock alerts",
    keywords: ["reminders", "due date", "service", "low stock", "email digest", "alerts", "notifications"]
  },
  {
    id: "accounting",
    name: "Accounting",
    icon: BookOpen,
    description: "Financial year, multiple businesses and cost warnings",
    keywords: ["fiscal year", "multi firm", "books", "locks", "depreciation", "carrying cost", "reckoner"]
  },
  {
    id: "features_connections",
    name: "Features & Connections",
    icon: Sparkles,
    description: "Turn on features and connect external services",
    keywords: ["system builder", "apps", "modules", "ai", "gemini", "openai", "fbr", "stripe", "woocommerce"]
  },
  // Access & Data
  {
    id: "security",
    name: "Security & Sign-in",
    icon: Shield,
    description: "Passcodes, sign-in protection and staff access",
    keywords: ["passcode", "pin", "auto-logout", "2fa", "sso", "saml", "staff", "roles", "permissions"]
  },
  {
    id: "approvals",
    name: "Approvals",
    icon: ShieldCheck,
    description: "Choose which transactions need a manager to approve them",
    keywords: ["approval", "maker checker", "governance", "threshold", "dual control", "owner separation"]
  },
  {
    id: "terminals",
    name: "Terminals",
    icon: Smartphone,
    description: "Pair secondary VenQore Station counter devices",
    keywords: ["terminal", "station", "pairing", "device", "counter", "sync"]
  },
  {
    id: "backup",
    name: "Data & Backup",
    icon: Database,
    description: "Cloud backups, local snapshots, restore & Google Drive sync",
    keywords: ["backup", "restore", "google drive", "export", "import", "sql", "database"]
  },
  {
    id: "reset",
    name: "Factory Reset",
    icon: AlertOctagon,
    description: "Erase transactional records or reset store database",
    keywords: ["reset", "erase", "danger", "delete data", "factory", "wipe"]
  }
];
function PercentIconWrapper(props) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: props.size || 16,
      height: props.size || 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: props.className,
      children: [
        /* @__PURE__ */ jsx("line", { x1: "19", y1: "5", x2: "5", y2: "19" }),
        /* @__PURE__ */ jsx("circle", { cx: "6.5", cy: "6.5", r: "2.5" }),
        /* @__PURE__ */ jsx("circle", { cx: "17.5", cy: "17.5", r: "2.5" })
      ]
    }
  );
}
const HASH_ALIASES = {
  business: "profile",
  preferences: "region_numbers",
  sales: "checkout_returns",
  print: "document_layouts",
  messages: "manual_sharing",
  party: "customers_suppliers",
  item: "stock_items",
  reminders: "reminders_alerts",
  modules: "features_connections",
  ai_integrations: "features_connections",
  region: "region_numbers",
  display_settings: "display",
  device: "printer_device",
  sharing: "manual_sharing",
  whatsapp: "manual_sharing",
  alerts: "reminders_alerts",
  notifications: "reminders_alerts"
};
const resolveSectionId = (rawHash) => {
  if (!rawHash) return "profile";
  const cleaned = rawHash.replace(/^#/, "");
  if (HASH_ALIASES[cleaned]) return HASH_ALIASES[cleaned];
  const match = SETTINGS_SECTIONS.find((s) => s.id === cleaned);
  return match ? match.id : "profile";
};
const SECTION_FIELD_MAP = {
  profile: [
    "business_name",
    "business_address",
    "business_phone",
    "business_email",
    "tax_number",
    "custom_domain",
    "store_name",
    "store_address",
    "store_phone",
    "product_cost_update_policy"
  ],
  region_numbers: [
    "currency",
    "currency_symbol",
    "timezone",
    "language",
    "date_format",
    "decimal_places"
  ],
  display: [
    "ui_scale",
    "dark_mode_default",
    "header_calculator_enabled",
    "senior_mode"
  ],
  checkout_returns: [
    "stop_sale_negative_stock",
    "cash_sale_default",
    "round_off_total",
    "pos_auto_fill_cash",
    "show_margin_percentage",
    "pos_return_mode",
    "pos_return_window",
    "pos_return_window_behavior",
    "charity_enabled"
  ],
  documents_numbering: [
    "invoice_number_enabled",
    "billing_type",
    "sale_prefix",
    "purchase_prefix",
    "quotation_prefix",
    "return_prefix"
  ],
  taxes: [
    "default_tax_rate",
    "default_tax_basis",
    "tax_rates",
    "default_tax_id"
  ],
  customers_suppliers: [
    "loyalty_enabled",
    "enable_credit_limit",
    "party_grouping"
  ],
  stock_items: [
    "stock_maintenance",
    "barcode_scan_enabled",
    "batch_tracking_enabled",
    "wholesale_price_enabled",
    "low_stock_alerts",
    "low_stock_threshold"
  ],
  document_layouts: [
    "paper_size",
    "paper_orientation",
    "print_theme",
    "print_theme_color",
    "print_logo",
    "print_logo_path",
    "print_logo_file",
    "print_signature_text",
    "print_original_copy",
    "print_company_text_size",
    "print_invoice_text_size",
    "margin_top",
    "margin_bottom",
    "margin_left",
    "margin_right",
    "custom_paper_width",
    "custom_paper_height",
    "print_show_sno",
    "print_show_units",
    "print_show_mrp",
    "print_show_description",
    "print_show_hsn",
    "print_show_discount",
    "print_show_free_qty",
    "print_qr_code",
    "print_show_delivery_charge",
    "print_show_extra_charge",
    "print_total_quantity",
    "print_amount_decimal",
    "print_received_amount",
    "print_balance_amount",
    "print_party_balance",
    "print_tax_details",
    "print_you_saved",
    "print_show_previous_balance",
    "print_amount_grouping",
    "print_amount_words",
    "print_description",
    "print_terms",
    "print_received_by",
    "print_delivered_by",
    "print_payment_mode",
    "print_acknowledgement",
    "print_header_all_pages",
    "print_extra_space_top",
    "print_min_item_rows",
    "invoice_theme",
    "invoice_primary_color",
    "show_margin_on_invoice"
  ],
  printer_device: [
    "default_print_type",
    "thermal_page_size",
    "thermal_custom_chars",
    "thermal_use_bold",
    "thermal_auto_cut",
    "thermal_open_drawer",
    "thermal_extra_lines",
    "thermal_copies",
    "thermal_font_size",
    "thermal_show_headers",
    "thermal_show_sno",
    "thermal_show_units",
    "thermal_show_mrp",
    "thermal_show_description",
    "thermal_show_batch",
    "thermal_show_expiry",
    "thermal_show_mfg_date",
    "thermal_show_size",
    "thermal_show_model",
    "thermal_show_serial",
    "thermal_show_barcode",
    "thermal_custom_footer"
  ],
  manual_sharing: [
    "message_template_sales",
    "message_template_returns",
    "message_template_reminders",
    "whatsapp_offer_pdf"
  ],
  reminders_alerts: [
    "payment_reminders",
    "payment_reminder_days",
    "service_reminders",
    "email_notifications",
    "daily_sales_summary"
  ],
  accounting: [
    "multi_firm_enabled",
    "fiscal_year_start",
    "reckoner.heavy_discount_pct",
    "reckoner.expiry_warning_days",
    "reckoner.carrying_cost_pct"
  ],
  features_connections: [
    "ai_provider",
    "openai_api_key",
    "anthropic_api_key",
    "gemini_api_key",
    "ai_model",
    "shared_catalog_opt_out",
    "ai_accuracy_opt_in",
    "fbr_integration",
    "fbr_pos_id",
    "fbr_usin",
    "stripe_enabled",
    "woocommerce_enabled"
  ],
  security: [
    "enable_passcode",
    "admin_passcode",
    "auto_logout",
    "sso_enabled",
    "sso_idp_entity_id",
    "sso_url",
    "sso_certificate"
  ],
  approvals: [
    "approval_admin_enabled",
    "approval_strict_owner_separation",
    "approval_amount_threshold",
    "approval_default_employee_mode",
    "approval_policy_customer_receipt",
    "approval_threshold_customer_receipt",
    "approval_policy_supplier_payment",
    "approval_threshold_supplier_payment",
    "approval_policy_operating_expense",
    "approval_threshold_operating_expense",
    "approval_policy_sales_invoice",
    "approval_threshold_sales_invoice",
    "approval_policy_supplier_refund",
    "approval_threshold_supplier_refund",
    "approval_policy_purchase_posting",
    "approval_threshold_purchase_posting",
    "approval_policy_sales_return",
    "approval_threshold_sales_return",
    "approval_policy_purchase_return",
    "approval_threshold_purchase_return",
    "approval_policy_capital_injection",
    "approval_threshold_capital_injection",
    "approval_policy_owner_drawings",
    "approval_threshold_owner_drawings",
    "approval_policy_fund_transfer",
    "approval_threshold_fund_transfer"
  ]
};
function AdminSettings({ settings = {} }) {
  const tt = useTermText();
  const { store } = usePage().props;
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) return resolveSectionId(hash);
    const stored = localStorage.getItem("active_settings_section");
    return resolveSectionId(stored);
  });
  useEffect(() => {
    localStorage.setItem("active_settings_section", activeSection);
    if (window.location.hash !== `#${activeSection}`) {
      window.location.hash = activeSection;
    }
  }, [activeSection]);
  useEffect(() => {
    const onHashChange = () => {
      const raw = window.location.hash.replace("#", "");
      const target = resolveSectionId(raw);
      if (target && target !== activeSection) {
        setActiveSection(target);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [activeSection]);
  const [saved, setSaved] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(["business", "selling", "inventory", "printing_sharing", "operations", "access_data"]);
  const [pendingSectionId, setPendingSectionId] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [sectionSearch, setSectionSearch] = useState("");
  const safeInt = (val, fallback) => {
    const parsed = parseInt(val, 10);
    return !isNaN(parsed) ? parsed : fallback;
  };
  const safeParseJson = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value !== "string") return Array.isArray(value) ? value : fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  };
  const toggleCategory = (catId) => {
    setExpandedCategories(
      (prev) => prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };
  const handleVerifyKey = async () => {
    if (!data.openai_api_key) return;
    setVerifyingKey(true);
    setVerificationResult(null);
    try {
      const res = await window.axios.post(route("store.ai.test", { store_slug: store?.slug }), {
        api_key: data.openai_api_key,
        provider: data.ai_provider,
        model: data.ai_model
      });
      if (res.data.suggested_model && res.data.suggested_model !== data.ai_model) {
        setData((d) => ({ ...d, ai_model: res.data.suggested_model }));
      }
      setVerificationResult({ type: "success", message: res.data.message });
    } catch (e) {
      setVerificationResult({ type: "error", message: e.response?.data?.message || e.message });
    } finally {
      setVerifyingKey(false);
    }
  };
  const { data, setData, post, processing, errors, isDirty, reset, transform } = useForm({
    // Profile
    business_name: settings.business_name || "VENQORE",
    business_email: settings.business_email || "",
    business_phone: settings.business_phone || "",
    business_address: settings.business_address || "",
    tax_number: settings.tax_number || "",
    custom_domain: settings.custom_domain || store?.custom_domain || "",
    // Region & Numbers
    currency: settings.currency || "PKR",
    currency_symbol: settings.currency_symbol || "",
    timezone: settings.timezone || "Asia/Karachi",
    language: settings.language || "en",
    date_format: settings.date_format || "DD/MM/YYYY",
    decimal_places: safeInt(settings.decimal_places, 2),
    // Display
    ui_scale: safeInt(settings.ui_scale, 100),
    dark_mode_default: settings.dark_mode_default === "1" || settings.dark_mode_default === true,
    header_calculator_enabled: settings.header_calculator_enabled === "1" ? "1" : "0",
    senior_mode: settings.senior_mode === "1" || settings.senior_mode === true,
    // Selling - Checkout & Returns
    stop_sale_negative_stock: settings.stop_sale_negative_stock === "1" || settings.stop_sale_negative_stock === true,
    cash_sale_default: settings.cash_sale_default === "1" || settings.cash_sale_default === true,
    round_off_total: settings.round_off_total || "none",
    pos_auto_fill_cash: settings.pos_auto_fill_cash === "1" || settings.pos_auto_fill_cash === true,
    show_margin_percentage: settings.show_margin_percentage === "1" || settings.show_margin_percentage === true,
    pos_return_mode: settings.pos_return_mode || "reference",
    pos_return_window: settings.pos_return_window || "",
    pos_return_window_behavior: settings.pos_return_window_behavior || "warn",
    // Selling - Documents & Numbering
    invoice_number_enabled: settings.invoice_number_enabled !== "0",
    billing_type: settings.billing_type || "full",
    sale_prefix: settings.sale_prefix || "INV-",
    purchase_prefix: settings.purchase_prefix || "PUR-",
    quotation_prefix: settings.quotation_prefix || "QTN-",
    return_prefix: settings.return_prefix || "RET-",
    // Selling - Taxes
    default_tax_rate: settings.default_tax_rate || "0",
    default_tax_basis: settings.default_tax_basis || settings.tax_type || "exclusive",
    default_tax_id: settings.default_tax_id || "",
    tax_rates: safeParseJson(settings.tax_rates, [
      { id: 1, name: "GST 18%", rate: 18, type: "percentage" },
      { id: 2, name: "VAT 5%", rate: 5, type: "percentage" }
    ]),
    // Selling - Customers & Suppliers
    loyalty_enabled: settings.loyalty_enabled === "1" || settings.loyalty_enabled === true,
    enable_credit_limit: settings.enable_credit_limit !== "0",
    party_grouping: settings.party_grouping === "1" || settings.party_grouping === true,
    // Inventory - Stock & Items
    stock_maintenance: settings.stock_maintenance !== "0",
    barcode_scan_enabled: settings.barcode_scan_enabled === "1" || settings.barcode_scan_enabled === true,
    batch_tracking_enabled: settings.batch_tracking_enabled === "1" || settings.batch_tracking_enabled === true,
    wholesale_price_enabled: settings.wholesale_price_enabled === "1" || settings.wholesale_price_enabled === true,
    charity_enabled: settings.charity_enabled === "1" || settings.charity_enabled === true,
    product_cost_update_policy: settings.product_cost_update_policy || "never",
    // Printing - Document Layouts (Regular Layouts)
    paper_size: settings.paper_size || "A4",
    paper_orientation: settings.paper_orientation || "Portrait",
    print_theme: settings.print_theme || "modern",
    print_theme_color: settings.print_theme_color || vq.indigo[600],
    print_logo: settings.print_logo !== "0",
    print_logo_path: settings.print_logo_path || null,
    print_logo_file: null,
    print_signature_text: settings.print_signature_text || "Authorized Signatory",
    print_original_copy: settings.print_original_copy === "1",
    print_company_text_size: settings.print_company_text_size || "4",
    print_invoice_text_size: settings.print_invoice_text_size || "3",
    margin_top: safeInt(settings.margin_top, 20),
    margin_bottom: safeInt(settings.margin_bottom, 20),
    margin_left: safeInt(settings.margin_left, 20),
    margin_right: safeInt(settings.margin_right, 20),
    custom_paper_width: safeInt(settings.custom_paper_width, 210),
    custom_paper_height: safeInt(settings.custom_paper_height, 297),
    print_show_sno: settings.print_show_sno !== "0",
    print_show_units: settings.print_show_units !== "0",
    print_show_mrp: settings.print_show_mrp === "1",
    print_show_description: settings.print_show_description !== "0",
    print_show_hsn: settings.print_show_hsn === "1",
    print_show_discount: settings.print_show_discount === "1" || settings.print_show_discount === true,
    print_show_free_qty: settings.print_show_free_qty === "1" || settings.print_show_free_qty === true,
    print_show_delivery_charge: settings.print_show_delivery_charge !== "0" && settings.print_show_delivery_charge !== false,
    print_show_extra_charge: settings.print_show_extra_charge !== "0" && settings.print_show_extra_charge !== false,
    print_qr_code: settings.print_qr_code !== "0" && settings.print_qr_code !== false,
    print_total_quantity: settings.print_total_quantity !== "0",
    print_amount_decimal: settings.print_amount_decimal !== "0",
    print_received_amount: settings.print_received_amount !== "0",
    print_balance_amount: settings.print_balance_amount !== "0",
    print_party_balance: settings.print_party_balance === "1" || settings.print_party_balance === true,
    print_tax_details: settings.print_tax_details !== "0",
    print_you_saved: settings.print_you_saved === "1" || settings.print_you_saved === true,
    print_show_previous_balance: settings.print_show_previous_balance === "1" || settings.print_show_previous_balance === true,
    print_amount_grouping: settings.print_amount_grouping !== "0",
    print_amount_words: settings.print_amount_words || "0",
    print_description: settings.print_description !== "0",
    print_terms: settings.print_terms || "",
    print_received_by: settings.print_received_by === "1" || settings.print_received_by === true,
    print_delivered_by: settings.print_delivered_by === "1" || settings.print_delivered_by === true,
    print_payment_mode: settings.print_payment_mode !== "0",
    print_acknowledgement: settings.print_acknowledgement === "1" || settings.print_acknowledgement === true,
    print_header_all_pages: settings.print_header_all_pages !== "0",
    print_extra_space_top: safeInt(settings.print_extra_space_top, 0),
    print_min_item_rows: safeInt(settings.print_min_item_rows, 5),
    invoice_theme: settings.invoice_theme || "classic",
    invoice_primary_color: settings.invoice_primary_color && !settings.invoice_primary_color.includes("var(") ? settings.invoice_primary_color : "#4f46e5",
    show_margin_on_invoice: settings.show_margin_on_invoice === "1" || settings.show_margin_on_invoice === true,
    // Printing - Printer Device (Thermal Hardware)
    default_print_type: settings.default_print_type || "regular",
    thermal_page_size: settings.thermal_page_size || "3inch",
    thermal_custom_chars: safeInt(settings.thermal_custom_chars, 48),
    thermal_use_bold: settings.thermal_use_bold !== "0",
    thermal_auto_cut: settings.thermal_auto_cut !== "0",
    thermal_open_drawer: settings.thermal_open_drawer === "1" || settings.thermal_open_drawer === true,
    thermal_extra_lines: safeInt(settings.thermal_extra_lines, 3),
    thermal_copies: safeInt(settings.thermal_copies, 1),
    thermal_font_size: safeInt(settings.thermal_font_size, 12),
    thermal_show_headers: settings.thermal_show_headers === "1" || settings.thermal_show_headers === true,
    thermal_show_sno: settings.thermal_show_sno === "1" || settings.thermal_show_sno === true,
    thermal_show_units: settings.thermal_show_units === "1" || settings.thermal_show_units === true,
    thermal_show_mrp: settings.thermal_show_mrp === "1" || settings.thermal_show_mrp === true,
    thermal_show_description: settings.thermal_show_description === "1" || settings.thermal_show_description === true,
    thermal_show_batch: settings.thermal_show_batch === "1" || settings.thermal_show_batch === true,
    thermal_show_expiry: settings.thermal_show_expiry === "1" || settings.thermal_show_expiry === true,
    thermal_show_mfg_date: settings.thermal_show_mfg_date === "1" || settings.thermal_show_mfg_date === true,
    thermal_show_size: settings.thermal_show_size === "1" || settings.thermal_show_size === true,
    thermal_show_model: settings.thermal_show_model === "1" || settings.thermal_show_model === true,
    thermal_show_serial: settings.thermal_show_serial === "1" || settings.thermal_show_serial === true,
    thermal_show_barcode: settings.thermal_show_barcode !== "0",
    thermal_custom_footer: settings.thermal_custom_footer || "",
    // Printing - Manual Sharing (WhatsApp Drafts)
    message_template_sales: settings.message_template_sales || "Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready. Receipt: [Link]",
    message_template_returns: settings.message_template_returns || "Greetings from [Firm_Name]. Credit Note / Sale Return [Return_Number] for [Return_Amount] has been processed. Summary: [Link]",
    message_template_reminders: settings.message_template_reminders || "Dear [Customer_Name], this is a friendly reminder that invoice #[Invoice_Number] from [Firm_Name] is outstanding. Current amount due: [Due_Amount]. View receipt: [Link]",
    whatsapp_offer_pdf: settings.whatsapp_offer_pdf !== "0" && settings.whatsapp_offer_pdf !== false,
    // Operations - Reminders & Alerts
    payment_reminders: settings.payment_reminders === "1" || settings.payment_reminders === true,
    payment_reminder_days: safeInt(settings.payment_reminder_days, 7),
    service_reminders: safeParseJson(settings.service_reminders, []),
    low_stock_alerts: settings.low_stock_alerts === "1" || settings.low_stock_alerts === true,
    low_stock_threshold: safeInt(settings.low_stock_threshold, 10),
    email_notifications: settings.email_notifications !== "0",
    daily_sales_summary: settings.daily_sales_summary === "1" || settings.daily_sales_summary === true,
    // Operations - Accounting
    multi_firm_enabled: settings.multi_firm_enabled === "1" || settings.multi_firm_enabled === true,
    fiscal_year_start: settings.fiscal_year_start || "2025-01-01",
    "reckoner.heavy_discount_pct": safeInt(settings["reckoner.heavy_discount_pct"] ?? settings.reckoner_heavy_discount_pct, 20),
    "reckoner.expiry_warning_days": safeInt(settings["reckoner.expiry_warning_days"] ?? settings.reckoner_expiry_warning_days, 30),
    "reckoner.carrying_cost_pct": safeInt(settings["reckoner.carrying_cost_pct"] ?? settings.reckoner_carrying_cost_pct, 15),
    // Operations - Features & Connections
    ai_provider: settings.ai_provider || "gemini",
    openai_api_key: settings.openai_api_key || "",
    ai_model: settings.ai_model || "gemini-2.5-flash",
    shared_catalog_opt_out: Boolean(store?.shared_catalog_opt_out ?? (settings.shared_catalog_opt_out === "1" || settings.shared_catalog_opt_out === true)),
    ai_accuracy_opt_in: Boolean(store?.ai_accuracy_opt_in ?? (settings.ai_accuracy_opt_in === "1" || settings.ai_accuracy_opt_in === true)),
    fbr_integration: settings.fbr_integration === "1" || settings.fbr_integration === true,
    fbr_pos_id: settings.fbr_pos_id || "",
    fbr_usin: settings.fbr_usin || "",
    stripe_enabled: settings.stripe_enabled === "1" || settings.stripe_enabled === true,
    woocommerce_enabled: settings.woocommerce_enabled === "1" || settings.woocommerce_enabled === true,
    // Access & Data - Security
    enable_passcode: settings.enable_passcode === "1" || settings.enable_passcode === true,
    admin_passcode: settings.admin_passcode || "",
    auto_logout: safeInt(settings.auto_logout, 30),
    sso_enabled: settings.sso_enabled === "1" || settings.sso_enabled === true,
    sso_idp_entity_id: settings.sso_idp_entity_id || "",
    sso_url: settings.sso_url || "",
    sso_certificate: settings.sso_certificate || "",
    // Access & Data - Approvals
    approval_admin_enabled: settings.approval_admin_enabled === "1" || settings.approval_admin_enabled === true,
    approval_strict_owner_separation: settings.approval_strict_owner_separation === "1" || settings.approval_strict_owner_separation === true,
    approval_default_employee_mode: settings.approval_default_employee_mode || "inherit",
    approval_amount_threshold: settings.approval_amount_threshold || "0",
    approval_policy_customer_receipt: settings.approval_policy_customer_receipt || "inherit",
    approval_threshold_customer_receipt: settings.approval_threshold_customer_receipt || "",
    approval_policy_supplier_payment: settings.approval_policy_supplier_payment || "inherit",
    approval_threshold_supplier_payment: settings.approval_threshold_supplier_payment || "",
    approval_policy_operating_expense: settings.approval_policy_operating_expense || "inherit",
    approval_threshold_operating_expense: settings.approval_threshold_operating_expense || "",
    approval_policy_sales_invoice: settings.approval_policy_sales_invoice || "inherit",
    approval_threshold_sales_invoice: settings.approval_threshold_sales_invoice || "",
    approval_policy_supplier_refund: settings.approval_policy_supplier_refund || "inherit",
    approval_threshold_supplier_refund: settings.approval_threshold_supplier_refund || "",
    approval_policy_purchase_posting: settings.approval_policy_purchase_posting || "inherit",
    approval_threshold_purchase_posting: settings.approval_threshold_purchase_posting || "",
    approval_policy_sales_return: settings.approval_policy_sales_return || "inherit",
    approval_threshold_sales_return: settings.approval_threshold_sales_return || "",
    approval_policy_purchase_return: settings.approval_policy_purchase_return || "inherit",
    approval_threshold_purchase_return: settings.approval_threshold_purchase_return || "",
    approval_policy_capital_injection: settings.approval_policy_capital_injection || "inherit",
    approval_threshold_capital_injection: settings.approval_threshold_capital_injection || "",
    approval_policy_owner_drawings: settings.approval_policy_owner_drawings || "inherit",
    approval_threshold_owner_drawings: settings.approval_threshold_owner_drawings || "",
    approval_policy_fund_transfer: settings.approval_policy_fund_transfer || "inherit",
    approval_threshold_fund_transfer: settings.approval_threshold_fund_transfer || ""
  });
  const saveSettings = (code, sectionToSave = activeSection) => {
    transform((currentData) => {
      const allowedKeys = SECTION_FIELD_MAP[sectionToSave];
      const payload = {
        _save_section: sectionToSave
      };
      if (code) {
        payload.passcode_challenge = code;
      }
      if (allowedKeys) {
        allowedKeys.forEach((k) => {
          if (currentData[k] !== void 0) {
            payload[k] = currentData[k];
          }
        });
      } else {
        Object.assign(payload, currentData);
      }
      return payload;
    });
    post(route("store.settings.update", { store_slug: store?.slug }), {
      preserveScroll: true,
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3e3);
      }
    });
  };
  const handleSectionChange = (sectionId) => {
    if (sectionId === "backup") {
      router.visit(route("store.admin.data", { store_slug: store?.slug, tab: "backups" }));
      return;
    }
    if (isDirty) {
      setPendingSectionId(sectionId);
      setShowUnsavedModal(true);
    } else {
      setActiveSection(sectionId);
    }
  };
  const handleSaveAndSwitch = () => {
    const isPasscodeEnabled = settings.enable_passcode === "1" || settings.enable_passcode === true;
    if (isPasscodeEnabled) {
      setShowUnsavedModal(false);
      setIsPasscodeModalOpen(true);
      return;
    }
    const currentActive = activeSection;
    const targetSection = pendingSectionId;
    setShowUnsavedModal(false);
    transform((currentData) => {
      const allowedKeys = SECTION_FIELD_MAP[currentActive];
      const payload = {
        _save_section: currentActive
      };
      if (allowedKeys) {
        allowedKeys.forEach((k) => {
          if (currentData[k] !== void 0) {
            payload[k] = currentData[k];
          }
        });
      } else {
        Object.assign(payload, currentData);
      }
      return payload;
    });
    post(route("store.settings.update", { store_slug: store?.slug }), {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3e3);
        if (targetSection) {
          setActiveSection(targetSection);
          setPendingSectionId(null);
        }
      }
    });
  };
  const handleDiscardAndSwitch = () => {
    const targetSection = pendingSectionId;
    setShowUnsavedModal(false);
    reset();
    if (targetSection) {
      setActiveSection(targetSection);
      setPendingSectionId(null);
    }
  };
  const handleCancelSwitch = () => {
    setShowUnsavedModal(false);
    setPendingSectionId(null);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const isPasscodeEnabled = settings.enable_passcode === "1" || settings.enable_passcode === true;
    if (isPasscodeEnabled) {
      setIsPasscodeModalOpen(true);
    } else {
      saveSettings();
    }
  };
  const renderSection = () => {
    switch (activeSection) {
      // Business Group
      case "profile":
        return /* @__PURE__ */ jsx(BusinessProfileSection, { data, setData });
      case "region_numbers":
        return /* @__PURE__ */ jsx(RegionNumbersSection, { data, setData });
      case "display":
        return /* @__PURE__ */ jsx(DisplayPreferencesSection, { data, setData });
      // Selling Group
      case "checkout_returns":
        return /* @__PURE__ */ jsx(CheckoutReturnsSection, { data, setData });
      case "documents_numbering":
        return /* @__PURE__ */ jsx(DocumentsNumberingSection, { data, setData });
      case "taxes":
        return /* @__PURE__ */ jsx(TaxSettingsSection, { data, setData });
      case "customers_suppliers":
        return /* @__PURE__ */ jsx(CustomersSuppliersSection, { data, setData });
      // Inventory Group
      case "stock_items":
        return /* @__PURE__ */ jsx(StockItemsSection, { data, setData });
      // Printing & Sharing Group
      case "document_layouts":
        return /* @__PURE__ */ jsx(DocumentLayoutsSection, { data, setData, saveSettings });
      case "printer_device":
        return /* @__PURE__ */ jsx(PrinterDeviceSection, { data, setData });
      case "manual_sharing":
        return /* @__PURE__ */ jsx(ManualSharingSection, { data, setData, saveSettings });
      // Operations Group
      case "reminders_alerts":
        return /* @__PURE__ */ jsx(RemindersAlertsSection, { data, setData });
      case "accounting":
        return /* @__PURE__ */ jsx(AccountingSection, { data, setData });
      case "features_connections":
        return /* @__PURE__ */ jsx(
          FeaturesConnectionsSection,
          {
            data,
            setData,
            handleVerifyKey,
            verifyingKey,
            verificationResult
          }
        );
      // Access & Data Group
      case "security":
        return /* @__PURE__ */ jsx(SecuritySection, { data, setData });
      case "approvals":
        return /* @__PURE__ */ jsx(ApprovalsSection, { data, setData, store });
      case "terminals":
        return /* @__PURE__ */ jsx(TerminalPairingSection, { storeSlug: store?.slug });
      case "backup":
        return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4 bg-surface rounded-2xl border border-line p-12 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(Database, { size: 32 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink mb-2", children: "Backups now live in Data & Backup Hub" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted max-w-md", children: "Automatic backups, manual database dumps, cloud sync, and CSV imports are organized in the centralized hub." })
          ] }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: route("store.admin.data", { store_slug: store?.slug, tab: "backups" }),
              className: "inline-flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95",
              children: [
                /* @__PURE__ */ jsx("span", { children: "Go to Data & Backup Hub" }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 18 })
              ]
            }
          )
        ] });
      case "reset":
        return /* @__PURE__ */ jsx(DangerSettingsSection, { data, setData });
      default:
        return /* @__PURE__ */ jsxs("div", { className: "h-64 flex flex-col items-center justify-center text-ink-muted opacity-50", children: [
          /* @__PURE__ */ jsx(Building2, { size: 48, className: "mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "font-bold uppercase tracking-widest", children: "Section Under Development" })
        ] });
    }
  };
  const currentSection = SETTINGS_SECTIONS.find((s) => s.id === activeSection) || SETTINGS_SECTIONS[0];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Settings", activeMenu: "Settings", noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex gap-6 overflow-hidden px-6 pb-6 pt-3.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 bg-surface rounded-2xl border border-line shadow-xs flex flex-col overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col h-full relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "px-6 py-3.5 border-b border-line shrink-0 bg-surface/90 backdrop-blur-md", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-wider rounded-md shrink-0", children: activeSection === "security" ? "Account Scope" : activeSection === "terminals" ? "Device Scope" : activeSection === "display" || activeSection === "checkout_returns" ? "Register Scope" : "Store Scope" }),
              /* @__PURE__ */ jsx("span", { className: "h-3.5 w-px bg-line shrink-0" }),
              /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-ink tracking-tight shrink-0", children: currentSection?.name }),
              /* @__PURE__ */ jsxs("span", { className: "hidden md:inline-block text-xs text-ink-muted truncate font-medium", children: [
                "— ",
                tt(currentSection?.description || "")
              ] }),
              store?.name && /* @__PURE__ */ jsxs("span", { className: "hidden lg:inline-block text-3xs font-semibold text-ink-muted shrink-0", children: [
                "· ",
                store.name
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-brand-600 dark:hover:bg-brand-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 disabled:opacity-60 cursor-pointer",
                children: saved ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Check, { size: 15, strokeWidth: 2.5, className: "text-emerald-400" }),
                  /* @__PURE__ */ jsx("span", { children: "Saved" })
                ] }) : processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 15, className: "animate-spin text-brand-300" }),
                  /* @__PURE__ */ jsx("span", { children: "Saving..." })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Save, { size: 15 }),
                  /* @__PURE__ */ jsx("span", { children: "Save Changes" })
                ] })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 custom-scrollbar p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl pb-10 transition-all duration-slow", children: [
            errors && Object.keys(errors).length > 0 && /* @__PURE__ */ jsxs("div", { role: "alert", className: "mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-bold text-sm mb-1.5", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-rose-600 dark:text-rose-400 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: "Settings could not be saved. Please correct the following errors:" })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "list-disc list-inside text-xs space-y-1 mt-1 text-rose-800 dark:text-rose-200 font-medium", children: Object.entries(errors).map(([key, msg]) => /* @__PURE__ */ jsxs("li", { children: [
                /* @__PURE__ */ jsxs("span", { className: "font-bold capitalize", children: [
                  key.replace(/_/g, " "),
                  ":"
                ] }),
                " ",
                msg
              ] }, key)) })
            ] }),
            renderSection()
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `${sidebarCollapsed ? "w-16" : "w-72 sm:w-80"} rounded-2xl border border-white/10 dark:border-white/10 shadow-lg p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-slow`,
          style: {
            background: "radial-gradient(52% 62% at 16% 10%, rgba(35,196,166,0.30), transparent 68%), radial-gradient(46% 54% at 84% 80%, rgba(7,107,94,0.34), transparent 66%), radial-gradient(38% 42% at 62% 26%, rgba(93,165,176,0.14), transparent 70%), #0A0F0E"
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-36 h-36 bg-teal-500/15 rounded-full blur-[50px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" }),
            /* @__PURE__ */ jsxs("div", { className: `${sidebarCollapsed ? "px-1 py-3 justify-center" : "px-3 py-3 justify-between"} flex items-center border-b border-white/10 mb-3 relative z-50`, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarCollapsed(!sidebarCollapsed);
                  },
                  className: "w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors shrink-0 z-50 cursor-pointer",
                  title: sidebarCollapsed ? "Expand settings panel" : "Collapse settings panel",
                  children: /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `transition-transform duration-slow ${sidebarCollapsed ? "rotate-180" : ""}` })
                }
              ),
              !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-white tracking-tight", children: "Settings" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-[0.2em] text-emerald-400", children: "Store Config" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0", children: /* @__PURE__ */ jsx(Building2, { size: 16 }) })
              ] })
            ] }),
            !sidebarCollapsed && /* @__PURE__ */ jsx("div", { className: "px-1 pb-2 relative z-20", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: sectionSearch,
                  onChange: (e) => setSectionSearch(e.target.value),
                  placeholder: "Search settings & keywords...",
                  className: "w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto px-1 custom-scrollbar space-y-1 relative z-10 pb-16", children: SETTINGS_CATEGORIES.map((category) => {
              const CatIcon = category.icon;
              const isExpanded = Boolean(sectionSearch) || expandedCategories.includes(category.id);
              const categorySections = SETTINGS_SECTIONS.filter(
                (s) => category.sections.includes(s.id) && (!sectionSearch || s.name.toLowerCase().includes(sectionSearch.toLowerCase()) || s.description.toLowerCase().includes(sectionSearch.toLowerCase()) || s.keywords?.some((k) => k.toLowerCase().includes(sectionSearch.toLowerCase())))
              );
              if (categorySections.length === 0) return null;
              return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                !sidebarCollapsed && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.stopPropagation();
                      toggleCategory(category.id);
                    },
                    className: "w-full flex items-center justify-between px-2.5 py-1.5 text-2xs font-bold uppercase tracking-[0.18em] text-neutral-400 hover:text-emerald-300 transition-colors group",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx(CatIcon, { size: 12, className: "text-neutral-400 group-hover:text-emerald-300" }),
                        category.name
                      ] }),
                      /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: `transition-transform duration-normal ${isExpanded ? "rotate-90" : ""}` })
                    ]
                  }
                ),
                (isExpanded || sidebarCollapsed) && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: categorySections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSectionChange(section.id),
                      title: sidebarCollapsed ? section.name : void 0,
                      className: `w-full flex items-center gap-2.5 ${sidebarCollapsed ? "p-2 justify-center" : "p-2.5"} rounded-xl text-left transition-all duration-normal group relative overflow-hidden border ${isActive ? "bg-white/15 backdrop-blur-xl border-white/25 text-white shadow-xs" : "text-neutral-300 hover:bg-white/5 hover:text-white border-transparent"}`,
                      children: [
                        isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-emerald-500/20 opacity-100" }),
                        /* @__PURE__ */ jsx("div", { className: `relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-normal ${isActive ? "bg-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "bg-white/5 text-neutral-400 group-hover:text-emerald-300 group-hover:bg-white/10"}`, children: /* @__PURE__ */ jsx(Icon, { size: 15 }) }),
                        !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 min-w-0", children: [
                          /* @__PURE__ */ jsx("p", { className: `text-xs font-bold tracking-tight ${isActive ? "text-white" : "text-neutral-200"}`, children: section.name }),
                          /* @__PURE__ */ jsx("p", { className: `text-3xs leading-tight ${isActive ? "text-emerald-200" : "text-neutral-400"} line-clamp-1`, children: tt(section.description) })
                        ] }),
                        !sidebarCollapsed && /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `relative z-10 transition-all duration-normal shrink-0 ${isActive ? "text-emerald-300" : "text-neutral-500 opacity-0 group-hover:opacity-100"}` })
                      ]
                    },
                    section.id
                  );
                }) })
              ] }, category.id);
            }) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(var(--vq-slate-700));
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(var(--vq-slate-600));
                }
            ` }),
    /* @__PURE__ */ jsx(
      PasscodeModal,
      {
        isOpen: isPasscodeModalOpen,
        onClose: () => setIsPasscodeModalOpen(false),
        onSuccess: (code) => saveSettings(code),
        settings
      }
    ),
    showUnsavedModal && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center p-4", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in",
          onClick: handleCancelSwitch,
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxs(
        "div",
        {
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "unsaved-changes-title",
          className: "relative z-10 w-full max-w-md bg-surface border border-line dark:border-line-strong rounded-2xl shadow-2xl p-6 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-3 duration-fast",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 28, className: "animate-pulse" }) }),
              /* @__PURE__ */ jsx("h3", { id: "unsaved-changes-title", className: "text-lg font-bold text-ink tracking-tight", children: "Unsaved Changes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary dark:text-ink-muted mt-2 leading-relaxed max-w-sm", children: "You have unsaved changes. Do you want to save them before switching sections?" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: handleSaveAndSwitch,
                  className: "order-1 sm:order-1 py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Check, { size: 14 }),
                    /* @__PURE__ */ jsx("span", { children: "Save & Switch" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleDiscardAndSwitch,
                  className: "order-2 sm:order-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1 shadow-xs",
                  children: /* @__PURE__ */ jsx("span", { children: "Discard" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleCancelSwitch,
                  className: "order-3 sm:order-3 py-2.5 px-3 bg-sunken hover:bg-interactive-hover dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-line-strong dark:border-neutral-700 text-ink dark:text-neutral-200 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1 shadow-xs",
                  children: /* @__PURE__ */ jsx("span", { children: "Cancel" })
                }
              )
            ] })
          ]
        }
      )
    ] })
  ] });
}
export {
  AdminSettings as default
};
