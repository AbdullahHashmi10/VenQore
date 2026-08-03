import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { v as vq, O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { P as PasscodeModal } from "../ssr.js";
import { Printer, Play, Save, Monitor, Settings, ChevronLeft, Minimize2, Maximize2, Layout, Palette, FileText, AlignLeft, X, Image, Upload, Check, Building2, Hash, Mail, Phone, Globe, CreditCard, ChevronRight, Clock, MapPin, Layers, Lock, Box, AlertTriangle, Sparkles, Percent, Plus, ArrowUpRight, Trash2, Wifi, Database, Download, HardDrive, Shield, Bell, AlertOctagon, Loader2, ShoppingCart, MessageSquare, Users, Package, BookOpen, RefreshCw, Search } from "lucide-react";
import Swal from "sweetalert2";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { P as PrintPreview } from "./PrintPreview-u3rEkqC1.js";
import { T as Toggle$1 } from "./Toggle-DVyg61h2.js";
import axios from "axios";
import { S as SectionHeader } from "./SectionHeader-CQ5Hn4MY.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "laravel-echo";
import "pusher-js";
import "./format-B_ph0Qec.js";
function PrintSettingsSection({ data, setData, saveSettings }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [previewMode, setPreviewMode] = useState("light");
  useEffect(() => {
    const storedTab = localStorage.getItem("active_printer_subtab");
    if (storedTab && (storedTab === "thermal" || storedTab === "regular")) {
      setData("_print_tab", storedTab);
    }
  }, []);
  const handleSubtabChange = (tabName) => {
    setData("_print_tab", tabName);
    localStorage.setItem("active_printer_subtab", tabName);
  };
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);
  const handleTestPrint = (currentData) => {
    const type = currentData._print_tab === "thermal" ? "thermal" : "regular";
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
      ${isThermal ? `size: ${width / MM_TO_PX}mm 297mm;` : `size: ${currentData.paper_size || "A4"} ${currentData.paper_orientation === "Landscape" ? "landscape" : "portrait"};`}
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
  const content = /* @__PURE__ */ jsxs("div", { id: "fullscreen-portal-root", className: `flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${isFullScreen ? "fixed inset-0 z-[9999] rounded-none" : "h-[calc(100vh-12rem)]"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-800 dark:text-slate-200", children: [
          /* @__PURE__ */ jsx(Printer, { size: 18, className: "text-indigo-500" }),
          /* @__PURE__ */ jsx("span", { className: "font-extrabold text-sm tracking-tight", children: "ADVANCED DESIGN PANEL" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSubtabChange("regular"),
              className: `px-3 py-1.5 text-xs font-bold rounded-md transition-all ${data._print_tab !== "thermal" ? "bg-white dark:bg-slate-600 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`,
              children: "Standard A4/A5"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSubtabChange("thermal"),
              className: `px-3 py-1.5 text-xs font-bold rounded-md transition-all ${data._print_tab === "thermal" ? "bg-white dark:bg-slate-600 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`,
              children: "Thermal / POS"
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
            className: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95 mr-2",
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
            className: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95 mr-2",
            title: "Save and apply current printer settings",
            children: [
              /* @__PURE__ */ jsx(Save, { size: 14 }),
              "Save Printer Settings"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mr-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setPreviewMode("light"),
              className: `p-1.5 rounded transition-colors ${previewMode === "light" ? "bg-white dark:bg-slate-600 text-amber-500 shadow-sm" : "text-slate-400"}`,
              title: "Light Mode Preview",
              children: /* @__PURE__ */ jsx(Monitor, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setPreviewMode("dark"),
              className: `p-1.5 rounded transition-colors ${previewMode === "dark" ? "bg-slate-800 text-indigo-400 shadow-sm" : "text-slate-400"}`,
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
            className: "p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
            title: sidebarCollapsed ? "Show Settings" : "Hide Settings",
            children: sidebarCollapsed ? /* @__PURE__ */ jsx(Settings, { size: 18 }) : /* @__PURE__ */ jsx(ChevronLeft, { size: 18 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setIsFullScreen(!isFullScreen),
            className: `p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${isFullScreen ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : ""}`,
            title: "Full Screen Mode",
            children: isFullScreen ? /* @__PURE__ */ jsx(Minimize2, { size: 18 }) : /* @__PURE__ */ jsx(Maximize2, { size: 18 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-900/50", children: [
      /* @__PURE__ */ jsx("div", { className: `bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col ${sidebarCollapsed ? "w-0 opacity-0" : "w-96 opacity-100"}`, children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar", children: data._print_tab !== "thermal" ? /* @__PURE__ */ jsx(RegularSettings, { data, setData }) : /* @__PURE__ */ jsx(ThermalSettings, { data, setData }) }) }),
      /* @__PURE__ */ jsx("div", { className: `flex-1 overflow-auto flex items-start justify-center p-8 transition-colors duration-300 ${previewMode === "dark" ? "bg-slate-900" : "bg-slate-200"}`, children: /* @__PURE__ */ jsx("div", { className: `transform transition-all duration-300 ${sidebarCollapsed ? "scale-100" : "scale-95 origin-top"}`, children: /* @__PURE__ */ jsx(
        PrintPreview,
        {
          data,
          type: data._print_tab === "thermal" ? "thermal" : "regular",
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
const RegularSettings = ({ data, setData }) => /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsx("div", { className: "p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 mb-6", children: /* @__PURE__ */ jsx(
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
          className: "w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm",
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
    /* @__PURE__ */ jsx(TextInput, { label: "Company Name", value: data.business_name, onChange: (v) => setData("business_name", v) }),
    /* @__PURE__ */ jsx(Toggle, { label: "Show Logo", checked: data.print_logo, onChange: (v) => setData("print_logo", v) }),
    data.print_logo && /* @__PURE__ */ jsx(LogoUploader, { data, setData }),
    /* @__PURE__ */ jsx(Toggle, { label: "Repeat Header on All Pages", checked: data.print_header_all_pages, onChange: (v) => setData("print_header_all_pages", v) }),
    /* @__PURE__ */ jsx(Toggle, { label: "Show Original/Duplicate Copy", checked: data.print_original_copy, onChange: (v) => setData("print_original_copy", v) })
  ] }),
  /* @__PURE__ */ jsx(Section, { title: "Table Columns", icon: Layout, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Serial No.", checked: data.print_show_sno, onChange: (v) => setData("print_show_sno", v) }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "HSN/SAC Code", checked: data.print_show_hsn, onChange: (v) => setData("print_show_hsn", v) }),
    /* @__PURE__ */ jsx(ToggleBtn, { label: "Product Description", checked: data.print_show_description, onChange: (v) => setData("print_show_description", v) }),
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
          className: "w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400 mt-1", children: [
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
        className: "w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm",
        children: [
          /* @__PURE__ */ jsx("option", { value: "modern", children: "Modern Receipt" }),
          /* @__PURE__ */ jsx("option", { value: "classic", children: "Classic Typewriter" }),
          /* @__PURE__ */ jsx("option", { value: "bold", children: "Bold Boxed" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx(Toggle, { label: "Show Logo", checked: data.print_logo, onChange: (v) => setData("print_logo", v), color: "emerald" }),
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
  /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2", children: [
    /* @__PURE__ */ jsx(Icon, { size: 14 }),
    " ",
    title
  ] }),
  /* @__PURE__ */ jsx("div", { className: "px-1", children })
] });
const Label = ({ children }) => /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5", children });
const ButtonGroup = ({ label, value, onChange, options, color = "indigo" }) => /* @__PURE__ */ jsxs("div", { children: [
  /* @__PURE__ */ jsx(Label, { children: label }),
  /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: options.map((opt) => /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(opt.value),
      className: `flex-1 min-w-[60px] py-2 px-1 text-xs font-bold rounded-lg border transition-all ${value === opt.value ? color === "emerald" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"}`,
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
    className: `w-full flex items-center justify-between p-3 rounded-xl border transition-all ${checked ? color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`,
    children: [
      /* @__PURE__ */ jsx("span", { className: `text-sm font-bold ${checked ? color === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`, children: label }),
      /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center transition-colors ${checked ? color === "emerald" ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-transparent"}`, children: /* @__PURE__ */ jsx(Check, { size: 12, strokeWidth: 4 }) })
    ]
  }
);
const Toggle = ({ label, checked, onChange, color = "indigo" }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-1", children: [
  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: label }),
  /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(!checked),
      className: `relative w-11 h-6 rounded-full transition-colors ${checked ? color === "emerald" ? "bg-emerald-500" : "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`,
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
      className: "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-white"
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
      className: "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold text-center"
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
      className: "w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold",
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
        className: `w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${value === col.c ? "border-indigo-500 ring-1 ring-offset-1 ring-indigo-500" : "border-transparent"}`,
        style: { backgroundColor: col.c },
        title: col.n
      },
      col.c
    )) })
  ] });
};
const LogoUploader = ({ data, setData }) => /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700", children: [
  /* @__PURE__ */ jsx(Label, { children: "Logo Image" }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mt-2", children: [
    data.print_logo_path ? /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: data.print_logo_path,
          alt: "Logo Preview",
          className: "w-20 h-20 object-contain bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700"
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
    ] }) : /* @__PURE__ */ jsxs("div", { className: "w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 gap-1", children: [
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
          className: "inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Upload, { size: 14 }),
            data.print_logo_path ? "Change Logo" : "Upload Logo"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-2 leading-tight", children: "Recommended: PNG with transparent background. Max 2MB." })
    ] })
  ] })
] });
function BusinessSettingsSection({ data, setData }) {
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "col-span-12 xl:col-span-8 p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600", children: /* @__PURE__ */ jsx(Building2, { size: 18 }) }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white", children: "Business Identity" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 group/input", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Business Name" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.business_name,
                onChange: (e) => setData("business_name", e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                placeholder: "e.g. Acme Corp"
              }
            ),
            /* @__PURE__ */ jsx(Building2, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400", size: 16 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 group/input", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Tax / NTN" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.tax_number,
                onChange: (e) => setData("tax_number", e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                placeholder: "Tax ID"
              }
            ),
            /* @__PURE__ */ jsx(Hash, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400", size: 16 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 group/input", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Official Email" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: data.business_email,
                onChange: (e) => setData("business_email", e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                placeholder: "email@company.com"
              }
            ),
            /* @__PURE__ */ jsx(Mail, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400", size: 16 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 group/input", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Phone Line" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                value: data.business_phone,
                onChange: (e) => setData("business_phone", e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                placeholder: "+92..."
              }
            ),
            /* @__PURE__ */ jsx(Phone, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400", size: 16 })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "col-span-12 xl:col-span-4 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] translate-x-1/2 -translate-y-1/2" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsx(Globe, { size: 18, className: "text-purple-400" }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold", children: "Regional Settings" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400", children: "Currency" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.currency,
                  onChange: (e) => {
                    const newCurr = e.target.value;
                    const symbolMap = {
                      "PKR": "Rs.",
                      "USD": "$",
                      "EUR": "€",
                      "GBP": "£",
                      "INR": "₹",
                      "AED": "DH",
                      "SAR": "SR"
                    };
                    setData({
                      ...data,
                      currency: newCurr,
                      currency_symbol: symbolMap[newCurr] || data.currency_symbol
                    });
                  },
                  className: "w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white appearance-none cursor-pointer hover:bg-white/20",
                  children: [
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "PKR", children: "PKR - Pakistani Rupee" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "USD", children: "USD - US Dollar" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "EUR", children: "EUR - Euro" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "GBP", children: "GBP - British Pound" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "AED", children: "AED - UAE Dirham" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "SAR", children: "SAR - Saudi Riyal" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "INR", children: "INR - Indian Rupee" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(CreditCard, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none", size: 16 }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none", size: 14 })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400", children: "Currency Symbol" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.currency_symbol,
                  onChange: (e) => setData("currency_symbol", e.target.value),
                  className: "w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white placeholder:text-slate-600",
                  placeholder: "e.g. Rs. or $"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs", children: "SYM" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400", children: "Timezone" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.timezone,
                  onChange: (e) => setData("timezone", e.target.value),
                  className: "w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white appearance-none cursor-pointer hover:bg-white/20",
                  children: [
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "Asia/Karachi", children: "Asia/Karachi (PKT)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "Asia/Dubai", children: "Asia/Dubai (GST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "Asia/Riyadh", children: "Asia/Riyadh (AST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "Asia/Kolkata", children: "Asia/Kolkata (IST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "Europe/London", children: "Europe/London (GMT)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "America/New_York", children: "America/New_York (EST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "America/Chicago", children: "America/Chicago (CST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "America/Los_Angeles", children: "America/Los_Angeles (PST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "Australia/Sydney", children: "Australia/Sydney (AEST)" }),
                    /* @__PURE__ */ jsx("option", { className: "bg-slate-800 text-white", value: "UTC", children: "Universal Time (UTC)" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(Clock, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none", size: 16 }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none", size: 14 })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-2", children: "Determines date rollovers for reports." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "col-span-12 p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative group hover:border-indigo-500/30 transition-all", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 shrink-0", children: /* @__PURE__ */ jsx(MapPin, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-slate-400", children: "Head Office Address" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: data.business_address,
            onChange: (e) => setData("business_address", e.target.value),
            className: "w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px] resize-none",
            placeholder: "Complete address for invoices and footer..."
          }
        )
      ] })
    ] }) })
  ] }) });
}
function GeneralSettingsSection({ data, setData }) {
  const SettingToggle = ({ label, description, checked, onChange, icon: Icon, color = "indigo" }) => /* @__PURE__ */ jsxs("div", { className: "p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-indigo-500/30 transition-all duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: `p-3 rounded-2xl ${checked ? `bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600` : "bg-slate-50 dark:bg-slate-800 text-slate-400"}`, children: /* @__PURE__ */ jsx(Icon, { size: 24 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-800 dark:text-white text-lg", children: label }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: description })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => onChange(!checked),
        className: `relative w-14 h-8 rounded-full transition-all duration-300 ${checked ? `bg-${color}-600` : "bg-slate-200 dark:bg-slate-700"}`,
        children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 bg-white rounded-full transition-all duration-300 shadow-md w-6 h-6 ${checked ? "left-[calc(100%-28px)]" : "left-1"}` })
      }
    )
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-white/10", children: /* @__PURE__ */ jsx(Layers, { className: "text-indigo-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white tracking-tight", children: "System Preferences" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-medium ml-14 text-lg max-w-2xl", children: "Fine-tune your POS experience. Control security, inventory rules, and visual density." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx(
          SettingToggle,
          {
            label: "Admin Passcode",
            description: "Protect sensitive actions with a secure PIN.",
            checked: data.enable_passcode === "1" || data.enable_passcode === true,
            onChange: (v) => setData("enable_passcode", v),
            icon: Lock,
            color: "red"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: `overflow-hidden transition-all duration-300 ${data.enable_passcode === "1" || data.enable_passcode === true ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`, children: /* @__PURE__ */ jsxs("div", { className: "p-6 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/30 ml-4 border-l-[6px] border-l-red-500", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-red-800 dark:text-red-300 mb-2 uppercase tracking-wider", children: "Set Secure PIN" }),
          /* @__PURE__ */ jsxs("div", { className: "relative max-w-xs", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                maxLength: "6",
                value: data.admin_passcode || "",
                onChange: (e) => setData("admin_passcode", e.target.value.replace(/\D/g, "")),
                className: "w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border-none rounded-xl text-xl font-black tracking-[0.5em] focus:ring-2 focus:ring-red-500/50 text-slate-800 dark:text-white shadow-sm",
                placeholder: "•••• — leave blank to keep current"
              }
            ),
            /* @__PURE__ */ jsx(Lock, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-red-400", size: 18 })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-red-600 dark:text-red-400 mt-2 font-medium", children: "Used for refunds, voids, and settings." })
        ] }) }),
        /* @__PURE__ */ jsx(
          SettingToggle,
          {
            label: "Multi-Firm Mode",
            description: "manage multiple business entities.",
            checked: data.multi_firm_enabled === "1" || data.multi_firm_enabled === true,
            onChange: (v) => setData("multi_firm_enabled", v),
            icon: Box,
            color: "indigo"
          }
        ),
        /* @__PURE__ */ jsx(
          SettingToggle,
          {
            label: "Negative Stock Sales",
            description: "Allow selling items even if stock is 0.",
            checked: data.stop_sale_negative_stock === "0" || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0 || data.stop_sale_negative_stock === null,
            onChange: (v) => setData("stop_sale_negative_stock", !v),
            icon: AlertTriangle,
            color: "amber"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "px-4", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 italic", children: [
          "* Note: Turning 'Negative Stock Sales' ",
          /* @__PURE__ */ jsx("b", { children: "ON" }),
          " means you ",
          /* @__PURE__ */ jsx("b", { children: "CAN" }),
          " sell items with 0 stock. ",
          /* @__PURE__ */ jsx("b", { children: "OFF" }),
          " means strict control."
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 h-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600", children: /* @__PURE__ */ jsx(Layout, { size: 20 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-800 dark:text-white", children: "Visual & Format" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "Decimal Precision" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500", children: [
                "100.",
                "0".repeat(data.decimal_places)
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-2", children: [0, 1, 2, 3, 4].map((num) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setData("decimal_places", num),
                className: `py-3 rounded-xl font-bold text-sm transition-all border-2 ${parseInt(data.decimal_places) === num ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "border-transparent bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
                children: num
              },
              num
            )) })
          ] }),
          /* @__PURE__ */ jsx("hr", { className: "border-slate-100 dark:border-slate-700" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "Interface Scale" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full", children: [
                data.ui_scale,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative h-12 flex items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-indigo-500 transition-all duration-300",
                  style: { width: `${(data.ui_scale - 75) / (125 - 75) * 100}%` }
                }
              ) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "75",
                  max: "125",
                  step: "5",
                  value: data.ui_scale,
                  onChange: (e) => setData("ui_scale", e.target.value),
                  className: "absolute w-full h-12 opacity-0 cursor-pointer z-10"
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute w-6 h-6 bg-white border-4 border-indigo-600 rounded-full shadow-lg transition-all duration-300 pointer-events-none",
                  style: { left: `calc(${(data.ui_scale - 75) / (125 - 75) * 100}% - 12px)` }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-2xs font-bold text-slate-400 uppercase tracking-widest px-1", children: [
              /* @__PURE__ */ jsx("span", { children: "Compact (75%)" }),
              /* @__PURE__ */ jsx("span", { children: "Normal (100%)" }),
              /* @__PURE__ */ jsx("span", { children: "Large (125%)" })
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
function AiSettingsSection({ data, setData, handleVerifyKey, verifyingKey, verificationResult }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-[2rem] shadow-xl relative overflow-hidden group", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col md:flex-row items-center gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 32 }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center md:text-left", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black text-white mb-2 tracking-tight", children: "Artificial Intelligence" }),
          /* @__PURE__ */ jsxs("p", { className: "text-indigo-100/90 leading-snug", children: [
            "Enable natural language search. Ask things like ",
            /* @__PURE__ */ jsx("span", { className: "text-white font-bold italic", children: '"How much sugar did we sell last week?"' })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
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
                // clear or keep depending on preference, logic suggests one field for key
              }));
            }
          },
          className: `cursor-pointer group relative p-6 rounded-[2rem] border-[3px] transition-all duration-300 overflow-hidden ${data.ai_provider === "gemini" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-xl shadow-indigo-500/10 scale-[1.01]" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-slate-600 opacity-80 hover:opacity-100"}`,
          children: [
            data.ai_provider === "gemini" && /* @__PURE__ */ jsx("div", { className: "absolute top-5 right-5 bg-indigo-600 text-white text-2xs font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/30", children: "Active" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30", children: /* @__PURE__ */ jsx(Sparkles, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-lg font-black text-slate-800 dark:text-white leading-tight", children: "Google Gemini" }),
                /* @__PURE__ */ jsx("span", { className: "inline-block mt-1 text-2xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider", children: "Free Tier Available" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6", children: "A fast and powerful option from Google. Includes a generous free tier for daily analytics." }),
            /* @__PURE__ */ jsxs("div", { className: `space-y-4 transition-all duration-300 ${data.ai_provider === "gemini" ? "opacity-100" : "opacity-50 pointer-events-none blur-[1px]"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Gemini API Key" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "password",
                      value: data.ai_provider === "gemini" ? data.openai_api_key : "",
                      onChange: (e) => setData("openai_api_key", e.target.value),
                      className: "w-full pl-4 pr-24 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm",
                      placeholder: "Paste your AIza... key here",
                      autoComplete: "off"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        handleVerifyKey();
                      },
                      disabled: verifyingKey || data.ai_provider !== "gemini" || !data.openai_api_key,
                      className: "px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50",
                      children: verifyingKey ? "Checking..." : "Check Key"
                    }
                  ) })
                ] }),
                verificationResult && data.ai_provider === "gemini" && /* @__PURE__ */ jsxs("div", { className: `mt-2 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${verificationResult.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`, children: [
                  verificationResult.type === "success" ? /* @__PURE__ */ jsx(Check, { size: 14 }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
                  verificationResult.message
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/80 dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10", children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-2xs", children: "?" }),
                  "How to get Free Key:"
                ] }),
                /* @__PURE__ */ jsxs("ol", { className: "text-2xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal ml-3 marker:font-bold marker:text-indigo-500", children: [
                  /* @__PURE__ */ jsxs("li", { children: [
                    "Go to ",
                    /* @__PURE__ */ jsx("a", { href: "https://aistudio.google.com/app/apikey", target: "_blank", className: "text-indigo-600 font-bold underline hover:text-indigo-700", children: "Google AI Studio" }),
                    "."
                  ] }),
                  /* @__PURE__ */ jsxs("li", { children: [
                    "Sign in & Click ",
                    /* @__PURE__ */ jsx("strong", { children: '"Create API Key"' }),
                    "."
                  ] }),
                  /* @__PURE__ */ jsxs("li", { children: [
                    "Select ",
                    /* @__PURE__ */ jsx("strong", { children: '"Gemini API"' }),
                    " project."
                  ] }),
                  /* @__PURE__ */ jsxs("li", { children: [
                    "Copy ",
                    /* @__PURE__ */ jsx("code", { children: "AIza..." }),
                    " key and paste above."
                  ] })
                ] })
              ] })
            ] })
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
          className: `cursor-pointer group relative p-6 rounded-[2rem] border-[3px] transition-all duration-300 ${data.ai_provider === "openai" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-xl shadow-emerald-500/10 scale-[1.01]" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-slate-600 opacity-80 hover:opacity-100"}`,
          children: [
            data.ai_provider === "openai" && /* @__PURE__ */ jsx("div", { className: "absolute top-5 right-5 bg-emerald-600 text-white text-2xs font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30", children: "Active" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Globe, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-lg font-black text-slate-800 dark:text-white leading-tight", children: "OpenAI GPT-4" }),
                /* @__PURE__ */ jsx("span", { className: "inline-block mt-1 text-2xs font-black text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider", children: "Paid Subscription" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6", children: "Industry leader in reasoning. Requires a paid API account." }),
            /* @__PURE__ */ jsxs("div", { className: `space-y-4 transition-all duration-300 ${data.ai_provider === "openai" ? "opacity-100" : "opacity-50 pointer-events-none blur-[1px]"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "OpenAI API Key" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "password",
                      value: data.ai_provider === "openai" ? data.openai_api_key : "",
                      onChange: (e) => setData("openai_api_key", e.target.value),
                      className: "w-full pl-4 pr-24 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm",
                      placeholder: "sk-proj-...",
                      autoComplete: "off"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        handleVerifyKey();
                      },
                      disabled: verifyingKey || data.ai_provider !== "openai" || !data.openai_api_key,
                      className: "px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50",
                      children: verifyingKey ? "Checking..." : "Check Key"
                    }
                  ) })
                ] }),
                verificationResult && data.ai_provider === "openai" && /* @__PURE__ */ jsxs("div", { className: `mt-2 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${verificationResult.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`, children: [
                  verificationResult.type === "success" ? /* @__PURE__ */ jsx(Check, { size: 14 }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
                  verificationResult.message
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Model Selection" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.ai_model,
                    onChange: (e) => setData("ai_model", e.target.value),
                    onClick: (e) => e.stopPropagation(),
                    className: "w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "gpt-4o", children: "GPT-4o (Best Quality)" }),
                      /* @__PURE__ */ jsx("option", { value: "gpt-4-turbo", children: "GPT-4 Turbo" }),
                      /* @__PURE__ */ jsx("option", { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo (Budget)" })
                    ]
                  }
                )
              ] })
            ] })
          ]
        }
      )
    ] })
  ] });
}
function TransactionSettingsSection({ data, setData }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20", children: /* @__PURE__ */ jsx(FileText, { size: 32 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2", children: "On the Invoice" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-medium", children: "Control how your bills look and behave." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsx(
        Toggle$1,
        {
          enabled: data.invoice_number_enabled === "1" || data.invoice_number_enabled === true,
          onChange: (v) => setData("invoice_number_enabled", v),
          label: "Show Invoice Number",
          description: "Display sequential invoice ID on print"
        }
      ),
      /* @__PURE__ */ jsx(
        Toggle$1,
        {
          enabled: data.cash_sale_default === "1" || data.cash_sale_default === true,
          onChange: (v) => setData("cash_sale_default", v),
          label: "Default to 'Cash Sale'",
          description: "Pre-select Cash as payment mode"
        }
      )
    ] }) })
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
    setData("tax_rates", [...data.tax_rates, newTax]);
  };
  const removeTax = (id) => {
    const newRates = data.tax_rates.filter((t) => t.id !== id);
    setData("tax_rates", newRates);
  };
  const updateTax = (index, field, value) => {
    const newRates = [...data.tax_rates];
    newRates[index][field] = value;
    setData("tax_rates", newRates);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center", children: /* @__PURE__ */ jsx(Percent, { size: 32 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-slate-800 dark:text-white tracking-tight", children: "Tax Configuration" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-medium", children: "Manage GST, VAT, and other levies." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: addTax,
          className: "px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/20 group hover:scale-[1.02]",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 20, className: "group-hover:rotate-90 transition-transform" }),
            /* @__PURE__ */ jsx("span", { children: "Add Tax Rate" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", children: [
      (data.tax_rates || []).map((tax, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "group relative p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem] hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 24, className: "text-emerald-200 dark:text-emerald-900" }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-black tracking-widest text-slate-400", children: "Tax Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: tax.name,
                    onChange: (e) => updateTax(i, "name", e.target.value),
                    className: "w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 dark:text-white focus:ring-0 placeholder:text-slate-300",
                    placeholder: "e.g. GST 18%"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-black tracking-widest text-slate-400", children: "Rate" }),
                  /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: tax.rate,
                      onChange: (e) => updateTax(i, "rate", e.target.value),
                      className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-black tracking-widest text-slate-400", children: "Type" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: tax.type,
                      onChange: (e) => updateTax(i, "type", e.target.value),
                      className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "percentage", children: "% Percent" }),
                        /* @__PURE__ */ jsx("option", { value: "fixed", children: "$ Fixed" })
                      ]
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute -top-3 -right-3", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeTax(tax.id),
                className: "w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100",
                children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
              }
            ) })
          ]
        },
        tax.id
      )),
      (!data.tax_rates || data.tax_rates.length === 0) && /* @__PURE__ */ jsxs("div", { className: "col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem]", children: [
        /* @__PURE__ */ jsx(Percent, { size: 48, className: "mb-4 opacity-20" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "No Tax Rates Configured" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Click the button above to add your first tax." })
      ] })
    ] })
  ] });
}
function SystemSettingsSection({ data, setData, activeSubSection = "system" }) {
  const { woocommerce_enabled, store } = usePage().props;
  const fileInputRef = useRef(null);
  const [restoring, setRestoring] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const handleDownloadBackup = async () => {
    setDownloading(true);
    let timerInterval;
    Swal.fire({
      title: "Creating Backup...",
      html: `
                <div class="mb-2 flex justify-between text-sm font-medium text-slate-300">
                    <span id="swal-backup-text">Initializing backup process...</span>
                    <span id="swal-backup-percent">0%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-slate-600">
                    <div id="swal-backup-bar" class="bg-sky-500 h-3 rounded-full transition-all duration-300 relative" style="width: 0%">
                        <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                <p class="text-xs text-slate-500 mt-2">Dumping database, compressing files...</p>
            `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: vq.slate[800],
      color: "#fff",
      didOpen: () => {
        const b = Swal.getHtmlContainer().querySelector("#swal-backup-bar");
        const t = Swal.getHtmlContainer().querySelector("#swal-backup-text");
        const p = Swal.getHtmlContainer().querySelector("#swal-backup-percent");
        let progress = 0;
        timerInterval = setInterval(() => {
          if (progress < 40) {
            progress += 2;
            t.textContent = "Dumping database tables...";
          } else if (progress < 70) {
            progress += 1;
            t.textContent = "Compressing SQL file...";
          } else if (progress < 90) {
            progress += 0.5;
            t.textContent = "Finalizing validation...";
          }
          if (progress > 95) progress = 95;
          if (b) b.style.width = progress + "%";
          if (p) p.textContent = Math.round(progress) + "%";
        }, 100);
      }
    });
    try {
      const response = await axios.post("/admin-panel/backups", {}, {
        headers: { "Accept": "application/json" },
        timeout: 3e5
      });
      clearInterval(timerInterval);
      if (response.data.success) {
        Swal.fire({
          title: "Backup Ready!",
          text: "Download starting now...",
          icon: "success",
          timer: 2e3,
          showConfirmButton: false,
          background: vq.slate[800],
          color: "#fff"
        });
        window.location.href = `/admin-panel/backups/${response.data.filename}`;
      }
    } catch (error) {
      clearInterval(timerInterval);
      console.error(error);
      Swal.fire({
        title: "Backup Failed",
        text: error.response?.data?.message || "Could not create backup.",
        icon: "error",
        background: vq.slate[800],
        color: "#fff"
      });
    } finally {
      setDownloading(false);
    }
  };
  const handleRestoreClick = () => {
    fileInputRef.current.click();
  };
  const handleRestoreFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    const isSql = extension === "sql";
    const isVyapar = ["vyb", "vyp"].includes(extension);
    const isExcel = ["xlsx", "xls", "csv"].includes(extension);
    if (!isSql && !isVyapar && !isExcel) {
      Swal.fire({ title: "Unsupported File", text: "Accepted formats: .sql, .vyb, .vyp, .xlsx, .xls, .csv", icon: "error", background: vq.slate[800], color: "#fff" });
      e.target.value = null;
      return;
    }
    let title, text, confirmText;
    if (isSql) {
      title = "Restore Full Database?";
      text = "This will OVERWRITE all current data with the backup file. This cannot be undone. Proceed?";
      confirmText = "Yes, Restore Everything";
    } else if (isVyapar) {
      title = "Import Vyapar Backup?";
      text = "This will import all items, parties, transactions, and bank accounts from your Vyapar backup into VENQORE.";
      confirmText = "Yes, Import Vyapar Data";
    } else {
      title = "Import Data from File?";
      text = "This will import products and parties from the spreadsheet. Existing records with the same name will be updated.";
      confirmText = "Yes, Import Data";
    }
    const result = await Swal.fire({
      title,
      text,
      icon: isSql ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: isSql ? vq.red[600] : "#3085d6",
      cancelButtonColor: vq.slate[500],
      confirmButtonText: confirmText,
      background: vq.slate[800],
      color: "#fff"
    });
    if (!result.isConfirmed) {
      e.target.value = null;
      return;
    }
    const formData = new FormData();
    let url;
    if (isSql) {
      formData.append("backup_file", file);
      url = "/admin-panel/backups/restore";
    } else {
      formData.append("import_file", file);
      url = "/admin-panel/backups/import-data";
    }
    setRestoring(true);
    let progressInterval;
    if (Swal.isVisible()) {
      Swal.close();
    }
    await new Promise((r) => setTimeout(r, 100));
    Swal.fire({
      title: isVyapar ? "Importing Vyapar Data..." : "Processing File...",
      html: `
                 <div class="mb-2 flex justify-between text-sm font-medium text-slate-300">
                     <span id="swal-progress-text">Starting upload...</span>
                     <span id="swal-progress-percent">0%</span>
                 </div>
                 <div class="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-slate-600">
                     <div id="swal-progress-bar" class="bg-indigo-500 h-3 rounded-full transition-all duration-300 relative" style="width: 0%">
                         <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                     </div>
                 </div>
                 <p class="text-xs text-slate-500 mt-2">Large backups may take several minutes. Please do not close this window.</p>
             `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: vq.slate[800],
      color: "#fff",
      didOpen: () => {
        const b = Swal.getHtmlContainer()?.querySelector("#swal-progress-bar");
        const t = Swal.getHtmlContainer()?.querySelector("#swal-progress-text");
        const p = Swal.getHtmlContainer()?.querySelector("#swal-progress-percent");
        progressInterval = setInterval(async () => {
          try {
            const res = await axios.get("/admin-panel/backups/progress");
            const { percent, message } = res.data;
            if (percent > 0) {
              if (b) b.style.width = percent + "%";
              if (p) p.textContent = Math.round(percent) + "%";
              if (t) t.textContent = message;
            }
          } catch (e2) {
          }
        }, 1e3);
      },
      willClose: () => {
        if (progressInterval) clearInterval(progressInterval);
      }
    });
    try {
      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0,
        // No timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
          const visualPercent = Math.round(percentCompleted * 0.3);
          const b = Swal.getHtmlContainer()?.querySelector("#swal-progress-bar");
          const t = Swal.getHtmlContainer()?.querySelector("#swal-progress-text");
          const p = Swal.getHtmlContainer()?.querySelector("#swal-progress-percent");
          if (t && !t.textContent.includes("Initializing") && !t.textContent.includes("Importing")) {
            if (b) b.style.width = visualPercent + "%";
            if (p) p.textContent = visualPercent + "%";
            t.textContent = `Uploading... ${percentCompleted}%`;
          }
        }
      });
      Swal.fire({
        title: "Success!",
        text: response.data.message || "Operation completed successfully.",
        icon: "success",
        background: vq.slate[800],
        color: "#fff"
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Operation Failed",
        text: error.response?.data?.message || "Something went wrong. Please check your file and try again.",
        icon: "error",
        background: vq.slate[800],
        color: "#fff"
      });
    } finally {
      setRestoring(false);
      if (e.target) e.target.value = null;
    }
  };
  const renderContent = () => {
    switch (activeSubSection) {
      case "notifications":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-indigo-500 rounded-xl text-white", children: /* @__PURE__ */ jsx(Bell, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-indigo-900 dark:text-white", children: "Notification Center" }),
              /* @__PURE__ */ jsx("p", { className: "text-indigo-600 dark:text-indigo-300", children: "Control what alerts you receive." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.low_stock_alerts, onChange: (v) => setData("low_stock_alerts", v), label: "Low Stock Alerts", description: "Notify when items fall below threshold" }),
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.email_notifications, onChange: (v) => setData("email_notifications", v), label: "Email Summaries", description: "Daily sales digest via email" }),
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.daily_sales_summary, onChange: (v) => setData("daily_sales_summary", v), label: "Daily Sales Report", description: "End of day push notification" })
          ] })
        ] }) });
      case "security":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-500 rounded-xl text-white", children: /* @__PURE__ */ jsx(Shield, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Security & Access" }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Protect your account and data." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(Toggle$1, { enabled: false, onChange: () => {
            }, label: "Two-Factor Authentication", description: "Require code verification on login", comingSoon: true }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Auto-Logout Timer (Minutes)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: data.auto_logout,
                  onChange: (e) => setData("auto_logout", e.target.value),
                  className: "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                }
              )
            ] })
          ] })
        ] }) });
      case "backup":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-sky-50 dark:bg-sky-900/10 rounded-[2rem] border border-sky-100 dark:border-sky-500/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-sky-500 rounded-xl text-white", children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-sky-900 dark:text-white", children: "Data & Backup" }),
              /* @__PURE__ */ jsx("p", { className: "text-sky-600 dark:text-sky-300", children: "Prevent data loss." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx(Toggle$1, { enabled: false, onChange: () => {
            }, label: "Automatic Daily Backups", description: "Backup database to local storage every night", comingSoon: true }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "💡 Automatic local database backups are coming soon. Use Google Drive Automated Backups to secure your data in the cloud." }),
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: route("store.admin.data", { store_slug: store?.slug }),
                  className: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-1xs transition-all shadow-md shadow-sky-600/10 cursor-pointer",
                  children: "Configure Google Drive Backup"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 flex flex-col sm:flex-row gap-4", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: handleDownloadBackup,
                  disabled: downloading,
                  className: `flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${downloading ? "bg-slate-500 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700 shadow-sky-500/20"}`,
                  children: [
                    /* @__PURE__ */ jsx(Download, { size: 18 }),
                    " ",
                    downloading ? "Creating Backup..." : "Download Backup"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  ref: fileInputRef,
                  onChange: handleRestoreFile,
                  accept: ".sql,.vyb,.vyp,.xlsx,.xls,.csv",
                  className: "hidden"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: handleRestoreClick,
                  disabled: restoring,
                  className: `flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${restoring ? "bg-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"}`,
                  children: [
                    /* @__PURE__ */ jsx(HardDrive, { size: 18 }),
                    " ",
                    restoring ? "Processing..." : "Restore / Import File"
                  ]
                }
              )
            ] })
          ] })
        ] }) });
      case "integrations":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl", children: [
            /* @__PURE__ */ jsx(
              Toggle$1,
              {
                enabled: data.fbr_integration,
                onChange: (v) => setData("fbr_integration", v),
                label: "FBR POS Integration",
                description: "Real-time sales reporting to FBR"
              }
            ),
            data.fbr_integration && /* @__PURE__ */ jsx("div", { className: "mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-4 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs font-black uppercase tracking-[0.15em] text-slate-400", children: "FBR POS ID" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.fbr_pos_id,
                    onChange: (e) => setData("fbr_pos_id", e.target.value),
                    className: "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs font-black uppercase tracking-[0.15em] text-slate-400", children: "FBR USIN" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.fbr_usin,
                    onChange: (e) => setData("fbr_usin", e.target.value),
                    className: "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  }
                )
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx("div", { className: "p-8 bg-white dark:bg-slate-800 border-2 rounded-[2.5rem] opacity-60", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center text-white shadow-xl flex-shrink-0", children: /* @__PURE__ */ jsx(Wifi, { size: 28 }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-lg font-black text-slate-900 dark:text-white leading-tight", children: "Stripe" }),
                /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-4xs font-black uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30", children: "Upcoming" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Process card payments" })
            ] }),
            /* @__PURE__ */ jsx("button", { disabled: true, type: "button", className: "relative w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-700 cursor-not-allowed", children: /* @__PURE__ */ jsx("div", { className: "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" }) })
          ] }) }) })
        ] });
      case "system":
      default:
        return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-800 dark:text-white mb-4", children: "Localization" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Language" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.language,
                    onChange: (e) => setData("language", e.target.value),
                    className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "en", children: "English (US)" }),
                      /* @__PURE__ */ jsx("option", { value: "es", disabled: true, children: "Spanish (Coming Soon)" }),
                      /* @__PURE__ */ jsx("option", { value: "fr", disabled: true, children: "French (Coming Soon)" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 ml-1", children: "Date Format" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.date_format,
                    onChange: (e) => setData("date_format", e.target.value),
                    className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "DD/MM/YYYY", children: "DD/MM/YYYY (31/12/2023)" }),
                      /* @__PURE__ */ jsx("option", { value: "MM/DD/YYYY", children: "MM/DD/YYYY (12/31/2023)" }),
                      /* @__PURE__ */ jsx("option", { value: "YYYY-MM-DD", children: "YYYY-MM-DD (2023-12-31)" })
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-800 dark:text-white mb-4", children: "Appearance" }),
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.dark_mode_default, onChange: (v) => setData("dark_mode_default", v), label: "Force Dark Mode", description: "Use dark theme by default" })
          ] })
        ] }) });
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300", children: renderContent() });
}
function DangerSettingsSection({ data, setData }) {
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
      text = "WARNING: This will delete ALL sales, products, customers, and transactions. Only your admin account will remain. This process is IRREVERSIBLE.";
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
                        <div class="mb-2 flex justify-between text-sm font-medium text-slate-300">
                            <span id="swal-reset-text">Initializing wipe sequence...</span>
                            <span id="swal-reset-percent">0%</span>
                        </div>
                        <div class="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-slate-600">
                            <div id="swal-reset-bar" class="bg-red-600 h-3 rounded-full transition-all duration-300 relative" style="width: 0%">
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
  return /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-red-950 via-red-900 to-slate-900 relative overflow-hidden shadow-2xl border border-red-900/50", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-red-500/20 rounded-lg backdrop-blur-md border border-white/10", children: /* @__PURE__ */ jsx(AlertOctagon, { className: "text-red-400", size: 24 }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white tracking-tight", children: "Danger Zone" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-red-200/60 font-medium ml-14 text-lg max-w-2xl", children: "Irreversible destructive actions. Proceed with extreme caution." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-8 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-500/20", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleFactoryReset("all"),
          disabled: resetting,
          className: `w-full py-6 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/20 text-xl tracking-wide group ${resetting ? "bg-red-900/80 cursor-not-allowed" : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-[1.01] active:scale-95"}`,
          children: resetting ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-red-200", size: 24 }),
            /* @__PURE__ */ jsx("span", { className: "animate-pulse", children: "Processing..." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform", children: /* @__PURE__ */ jsx(Trash2, { size: 24 }) }),
            "FACTORY RESET (DELETE ALL DATA)"
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative py-4", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-red-200 dark:border-red-800/50" }) }),
        /* @__PURE__ */ jsx("div", { className: "relative flex justify-center", children: /* @__PURE__ */ jsx("span", { className: "px-4 bg-red-50 dark:bg-[#2A1818] text-xs font-bold uppercase tracking-widest text-red-400", children: "Selective Deletion" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleFactoryReset("products"),
            disabled: resetting,
            className: "py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx("span", { className: "p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 20 }) }),
              "Delete All Products"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleFactoryReset("sales"),
            disabled: resetting,
            className: "py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx("span", { className: "p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 20 }) }),
              "Delete All Sales"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleFactoryReset("stock"),
            disabled: resetting,
            className: "py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx("span", { className: "p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 20 }) }),
              "Reset Stock to 0"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
const SETTINGS_CATEGORIES = [
  {
    id: "org",
    name: "Organization",
    icon: Building2,
    sections: ["business", "preferences"]
  },
  {
    id: "ops",
    name: "Operations",
    icon: ShoppingCart,
    sections: ["sales", "taxes", "print", "messages", "item", "party", "reminders", "accounting"]
  },
  {
    id: "adv",
    name: "Advanced",
    icon: Sparkles,
    sections: ["security", "ai_integrations", "backup"]
  },
  {
    id: "zone",
    name: "Danger Zone",
    icon: AlertOctagon,
    sections: ["reset"]
  }
];
const SETTINGS_SECTIONS = [
  { id: "business", name: "Business Info", icon: Building2, description: "Company details and branding" },
  { id: "preferences", name: "Preferences", icon: Settings, description: "Passcode, multi-firm, language & alerts" },
  { id: "sales", name: "Sales & Invoicing", icon: ShoppingCart, description: "Checkout behavior and invoice fields" },
  { id: "taxes", name: "Taxes", icon: Percent, description: "Tax rates and groups" },
  { id: "print", name: "Print", icon: Printer, description: "Regular & Thermal printer layouts" },
  { id: "messages", name: "Messages", icon: MessageSquare, description: "WhatsApp & SMS notifications" },
  { id: "party", name: "Party", icon: Users, description: "Customer & Supplier preferences" },
  { id: "item", name: "Item", icon: Package, description: "Inventory, MRP & batch tracking" },
  { id: "reminders", name: "Reminders", icon: Clock, description: "Service and payment alerts" },
  { id: "accounting", name: "Accounting", icon: BookOpen, description: "Ledgers, depreciation & fiscal year" },
  { id: "security", name: "Security", icon: Shield, description: "Access control & 2FA" },
  { id: "ai_integrations", name: "AI & Integrations", icon: Sparkles, description: "Gemini, OpenAI, FBR & Stripe" },
  { id: "backup", name: "Backup & Data", icon: Database, description: "Now lives in the Data & Backup hub" },
  { id: "reset", name: "Factory Reset", icon: Trash2, description: "Erase data & start fresh" }
];
function AdminSettings({ settings = {} }) {
  const { store } = usePage().props;
  const [activeSection, setActiveSection] = useState(() => {
    const validIds = SETTINGS_SECTIONS.map((s) => s.id);
    const hash = window.location.hash.replace("#", "");
    if (validIds.includes(hash)) return hash;
    const stored = localStorage.getItem("active_settings_section");
    return validIds.includes(stored) ? stored : "business";
  });
  useEffect(() => {
    localStorage.setItem("active_settings_section", activeSection);
    window.location.hash = activeSection;
  }, [activeSection]);
  const [saved, setSaved] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [configuringApp, setConfiguringApp] = useState(null);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(["org", "ops", "adv", "zone"]);
  const [acknowledgeOpenReturn, setAcknowledgeOpenReturn] = useState(settings.pos_return_mode === "open");
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
  const { data, setData, post, processing, isDirty, reset } = useForm({
    // Business
    business_name: settings.business_name || "VENQORE",
    business_email: settings.business_email || "",
    business_phone: settings.business_phone || "",
    business_address: settings.business_address || "",
    tax_number: settings.tax_number || "",
    currency: settings.currency || "PKR",
    currency_symbol: settings.currency_symbol || "",
    timezone: settings.timezone || "Asia/Karachi",
    // General
    enable_passcode: settings.enable_passcode === "1" || settings.enable_passcode === true,
    admin_passcode: settings.admin_passcode || "",
    decimal_places: settings.decimal_places || 2,
    stop_sale_negative_stock: settings.stop_sale_negative_stock === "1" || settings.stop_sale_negative_stock === true,
    multi_firm_enabled: settings.multi_firm_enabled === "1" || settings.multi_firm_enabled === true,
    ui_scale: settings.ui_scale || 100,
    // AI
    ai_provider: settings.ai_provider || "gemini",
    openai_api_key: settings.openai_api_key || "",
    ai_model: settings.ai_model || "gemini-2.5-flash",
    // Transaction
    invoice_number_enabled: settings.invoice_number_enabled !== "0",
    cash_sale_default: settings.cash_sale_default === "1" || settings.cash_sale_default === true,
    round_off_total: settings.round_off_total || "none",
    billing_type: settings.billing_type || "full",
    sale_prefix: settings.sale_prefix || "INV-",
    purchase_prefix: settings.purchase_prefix || "PUR-",
    // Print - Regular Printer Settings
    print_header_all_pages: settings.print_header_all_pages !== "0",
    paper_size: settings.paper_size || "A4",
    paper_orientation: settings.paper_orientation || "Portrait",
    print_logo: settings.print_logo !== "0",
    print_logo_path: settings.print_logo_path || null,
    print_logo_file: null,
    print_signature_text: settings.print_signature_text || "Authorized Signatory",
    print_theme: settings.print_theme || "modern",
    print_company_text_size: settings.print_company_text_size || "4",
    print_invoice_text_size: settings.print_invoice_text_size || "3",
    print_original_copy: settings.print_original_copy === "1",
    margin_top: parseInt(settings.margin_top) || 20,
    margin_bottom: parseInt(settings.margin_bottom) || 20,
    margin_left: parseInt(settings.margin_left) || 20,
    margin_right: parseInt(settings.margin_right) || 20,
    custom_paper_width: parseInt(settings.custom_paper_width) || 210,
    custom_paper_height: parseInt(settings.custom_paper_height) || 297,
    print_theme_color: settings.print_theme_color || vq.indigo[600],
    print_extra_space_top: parseInt(settings.print_extra_space_top) || 0,
    print_min_item_rows: parseInt(settings.print_min_item_rows) || 5,
    // Print - Column Toggles (Regular)
    print_show_sno: settings.print_show_sno !== "0",
    print_show_units: settings.print_show_units !== "0",
    print_show_mrp: settings.print_show_mrp === "1",
    print_show_description: settings.print_show_description !== "0",
    print_show_hsn: settings.print_show_hsn === "1",
    print_show_discount: settings.print_show_discount === "1" || settings.print_show_discount === true,
    print_show_free_qty: settings.print_show_free_qty === "1" || settings.print_show_free_qty === true,
    // Print - Totals & Footer (Regular)
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
    // Print - Thermal Printer Settings
    default_print_type: settings.default_print_type || "regular",
    // 'regular' or 'thermal'
    thermal_page_size: settings.thermal_page_size || "3inch",
    thermal_custom_chars: parseInt(settings.thermal_custom_chars) || 48,
    thermal_use_bold: settings.thermal_use_bold !== "0",
    thermal_auto_cut: settings.thermal_auto_cut !== "0",
    thermal_open_drawer: settings.thermal_open_drawer === "1" || settings.thermal_open_drawer === true,
    thermal_extra_lines: parseInt(settings.thermal_extra_lines) || 3,
    thermal_copies: parseInt(settings.thermal_copies) || 1,
    thermal_font_size: parseInt(settings.thermal_font_size) || 12,
    // Font size in pt
    // Print - Column Toggles (Thermal)
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
    // Default On
    thermal_custom_footer: settings.thermal_custom_footer || "",
    // Messages
    whatsapp_enabled: settings.whatsapp_enabled === "1" || settings.whatsapp_enabled === true,
    sms_to_party: settings.sms_to_party === "1" || settings.sms_to_party === true,
    auto_send_sales: settings.auto_send_sales !== "0",
    // Party
    party_grouping: settings.party_grouping === "1" || settings.party_grouping === true,
    loyalty_enabled: settings.loyalty_enabled === "1" || settings.loyalty_enabled === true,
    enable_credit_limit: settings.enable_credit_limit !== "0",
    // Default On
    payment_reminder_days: settings.payment_reminder_days || 7,
    payment_reminders: settings.payment_reminders === "1" || settings.payment_reminders === true,
    // Item
    stock_maintenance: settings.stock_maintenance !== "0",
    barcode_scan_enabled: settings.barcode_scan_enabled === "1" || settings.barcode_scan_enabled === true,
    batch_tracking_enabled: settings.batch_tracking_enabled === "1" || settings.batch_tracking_enabled === true,
    wholesale_price_enabled: settings.wholesale_price_enabled === "1" || settings.wholesale_price_enabled === true,
    // System/Security
    language: settings.language || "en",
    date_format: settings.date_format || "DD/MM/YYYY",
    low_stock_threshold: settings.low_stock_threshold || 10,
    auto_logout: settings.auto_logout || 30,
    email_notifications: settings.email_notifications !== "0",
    two_factor_auth: settings.two_factor_auth === "1" || settings.two_factor_auth === true,
    auto_backup: settings.auto_backup !== "0",
    dark_mode_default: settings.dark_mode_default === "1" || settings.dark_mode_default === true,
    low_stock_alerts: settings.low_stock_alerts !== "0",
    daily_sales_summary: settings.daily_sales_summary === "1",
    fiscal_year_start: settings.fiscal_year_start || "2025-01-01",
    // POS Specific (from general settings)
    pos_auto_fill_cash: settings.pos_auto_fill_cash === "1" || settings.pos_auto_fill_cash === true,
    senior_mode: settings.senior_mode === "1" || settings.senior_mode === true,
    fbr_integration: settings.fbr_integration === "1" || settings.fbr_integration === true,
    fbr_pos_id: settings.fbr_pos_id || "",
    fbr_usin: settings.fbr_usin || "",
    show_margin_percentage: settings.show_margin_percentage === "1" || settings.show_margin_percentage === true,
    charity_enabled: settings.charity_enabled === "1" || settings.charity_enabled === true,
    pos_return_mode: settings.pos_return_mode || "reference",
    pos_return_window: settings.pos_return_window || "",
    pos_return_window_behavior: settings.pos_return_window_behavior || "warn",
    default_tax_rate: settings.default_tax_rate || "0",
    // Third Party Integrations
    whatsapp_api_url: settings.whatsapp_api_url || "",
    whatsapp_access_token: settings.whatsapp_access_token || "",
    whatsapp_phone_number_id: settings.whatsapp_phone_number_id || "",
    stripe_publishable_key: settings.stripe_publishable_key || "",
    stripe_secret_key: settings.stripe_secret_key || "",
    stripe_webhook_secret: settings.stripe_webhook_secret || "",
    stripe_enabled: settings.stripe_enabled === "1" || settings.stripe_enabled === true,
    woocommerce_url: settings.woocommerce_url || "",
    woocommerce_consumer_key: settings.woocommerce_consumer_key || "",
    woocommerce_consumer_secret: settings.woocommerce_consumer_secret || "",
    woocommerce_enabled: settings.woocommerce_enabled === "1" || settings.woocommerce_enabled === true,
    // Managed Lists
    tax_rates: settings.tax_rates ? JSON.parse(settings.tax_rates) : [
      { id: 1, name: "GST 18%", rate: 18, type: "percentage" },
      { id: 2, name: "VAT 5%", rate: 5, type: "percentage" }
    ],
    service_reminders: settings.service_reminders ? JSON.parse(settings.service_reminders) : []
  });
  const saveSettings = (code) => {
    post(route("store.admin.settings.update", { store_slug: store?.slug }), {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3e3);
      }
    });
  };
  const handleSectionChange = (sectionId) => {
    if (isDirty) {
      Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Do you want to save them before switching sections?",
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Save and Switch",
        denyButtonText: "Discard and Switch",
        cancelButtonText: "Cancel",
        background: vq.slate[800],
        color: "#fff",
        confirmButtonColor: vq.indigo[500],
        denyButtonColor: vq.red[500]
      }).then((result) => {
        if (result.isConfirmed) {
          post(route("store.admin.settings.update", { store_slug: store?.slug }), {
            onSuccess: () => {
              setSaved(true);
              setTimeout(() => setSaved(false), 3e3);
              setActiveSection(sectionId);
            }
          });
        } else if (result.isDenied) {
          reset();
          setActiveSection(sectionId);
        }
      });
    } else {
      setActiveSection(sectionId);
    }
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
      case "business":
        return /* @__PURE__ */ jsx(BusinessSettingsSection, { data, setData });
      case "preferences":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(GeneralSettingsSection, { data, setData }) }),
          /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Localization & Appearance", description: "Language, date format and display" }),
            /* @__PURE__ */ jsx(SystemSettingsSection, { data, setData, activeSubSection: "system" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-6 border-t border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx(SystemSettingsSection, { data, setData, activeSubSection: "notifications" }) })
        ] });
      case "ai_integrations":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "AI Intelligence", description: "Gemini, OpenAI & Smart Search" }),
            /* @__PURE__ */ jsx(
              AiSettingsSection,
              {
                data,
                setData,
                handleVerifyKey,
                verifyingKey,
                verificationResult
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Integrations", description: "External API connections" }),
            /* @__PURE__ */ jsx(SystemSettingsSection, { data, setData, activeSubSection: "integrations" })
          ] })
        ] });
      case "sales":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "At the Register", description: "Customize your point of sale experience" }),
            /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6", children: /* @__PURE__ */ jsxs("div", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: [
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.pos_auto_fill_cash, onChange: (v) => setData("pos_auto_fill_cash", v), label: "Auto-Fill Cash Received", description: "Automatically populate the 'Cash Received' field with the total amount" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.senior_mode, onChange: (v) => setData("senior_mode", v), label: "Senior Mode (Accessibility)", description: "Enable larger fonts and high-contrast UI for easier reading" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.fbr_integration, onChange: (v) => setData("fbr_integration", v), label: "FBR Integration", description: "Automatically report sales to FBR and print QR codes" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.show_margin_percentage, onChange: (v) => setData("show_margin_percentage", v), label: "Show Margin Percentage", description: "Display profit margin in sales overview" }),
              /* @__PURE__ */ jsxs("div", { className: "py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-slate-800 dark:text-white", children: "Round Off Invoice Totals" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Choose rounding precision for sales and purchases" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-6 gap-1 max-w-sm w-full", children: [
                  { value: "none", label: "None" },
                  { value: "0", label: "Whole" },
                  { value: "1", label: ".0" },
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
                      className: `py-2 px-1 text-center font-bold text-1xs rounded-lg border transition-all ${isActive ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" : "border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:bg-slate-200/50"}`,
                      children: opt.label
                    },
                    opt.value
                  );
                }) })
              ] }),
              /* @__PURE__ */ jsx(
                Toggle$1,
                {
                  enabled: data.stop_sale_negative_stock === "0" || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0,
                  onChange: (v) => setData("stop_sale_negative_stock", !v),
                  label: "Allow Negative Stock (Overselling)",
                  description: "Warning: Allows selling items even if inventory is 0",
                  variant: "danger"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mt-6", children: [
              /* @__PURE__ */ jsx(SectionHeader, { title: "Return Mode", description: "Configure return authorization requirements" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "POS Return Mode" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Configure return authorization requirements" })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: data.pos_return_mode,
                      onChange: (e) => {
                        const val = e.target.value;
                        setData("pos_return_mode", val);
                        if (val !== "open") setAcknowledgeOpenReturn(false);
                      },
                      className: "w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "reference", children: "Reference Number Required" }),
                        /* @__PURE__ */ jsx("option", { value: "customer_or_reference", children: "Customer or Reference" }),
                        /* @__PURE__ */ jsx("option", { value: "open", children: "Open Return — No Reference Needed" })
                      ]
                    }
                  )
                ] }),
                data.pos_return_mode === "open" && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-amber-500 text-lg", children: "⚠️" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed", children: "Warning: Open returns cannot be linked to original sales. You are responsible for verifying returned items were genuinely purchased." })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer select-none", children: [
                    /* @__PURE__ */ jsx("input", { type: "checkbox", checked: acknowledgeOpenReturn, onChange: (e) => setAcknowledgeOpenReturn(e.target.checked), className: "w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-300", children: "I understand and acknowledge this risk" })
                  ] })
                ] }),
                data.pos_return_mode === "open" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "Return Window (days)" }),
                      /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Max days since purchase for returns (leave empty to disable)" })
                    ] }),
                    /* @__PURE__ */ jsx("input", { type: "number", min: "1", value: data.pos_return_window, onChange: (e) => setData("pos_return_window", e.target.value), placeholder: "e.g. 7, 14, 30", className: "w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" })
                  ] }),
                  data.pos_return_window && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "Window Behavior" }),
                      /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Action when return window has expired" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl", children: [
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setData("pos_return_window_behavior", "warn"), className: `px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "warn" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500"}`, children: "Soft Warning" }),
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setData("pos_return_window_behavior", "block"), className: `px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "block" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500"}`, children: "Hard Block" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-4 border-t border-slate-100 dark:border-slate-700", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "Enable Charity Donations" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Show the Charity button on the POS for quick donation recording" })
                  ] }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setData("charity_enabled", !data.charity_enabled), className: `relative w-12 h-6 rounded-full transition-colors ${data.charity_enabled ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.charity_enabled ? "right-1" : "left-1"}` }) })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-6 border-t border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx(TransactionSettingsSection, { data, setData }) })
        ] });
      case "print":
        return /* @__PURE__ */ jsx(PrintSettingsSection, { data, setData, saveSettings });
      case "taxes":
        return /* @__PURE__ */ jsx(TaxSettingsSection, { data, setData });
      case "messages":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30", children: /* @__PURE__ */ jsx(MessageSquare, { size: 28 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-emerald-900 dark:text-emerald-400 text-lg", children: "WhatsApp Integration" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-emerald-700 dark:text-emerald-500/80", children: "Send invoices directly to customer's WhatsApp" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all", children: "Connect Account" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx(SectionHeader, { title: "SMS Settings", description: "Automated text notifications" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.sms_to_party, onChange: (v) => setData("sms_to_party", v), label: "Send SMS to Party", description: "Notify customers on every transaction" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.auto_send_sales, onChange: (v) => setData("auto_send_sales", v), label: "Auto-send for Sales" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 dark:bg-slate-700/30 rounded-3xl border border-slate-100 dark:border-slate-700", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 block", children: "Message Template" }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600", children: [
                "Greetings from ",
                /* @__PURE__ */ jsx("span", { className: "text-indigo-500 font-bold", children: "[Firm_Name]" }),
                ". Your invoice for ",
                /* @__PURE__ */ jsx("span", { className: "text-indigo-500 font-bold", children: "[Invoice_Amount]" }),
                " is ready. View here: [Link]"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("button", { className: "text-indigo-600 text-sm font-bold flex items-center gap-2 hover:underline", children: [
                  /* @__PURE__ */ jsx(Palette, { size: 16 }),
                  " Customize Template"
                ] }),
                /* @__PURE__ */ jsx(Toggle$1, { enabled: data.whatsapp_enabled, onChange: (v) => setData("whatsapp_enabled", v), label: "Enable WhatsApp" })
              ] })
            ] })
          ] }),
          data.whatsapp_enabled && /* @__PURE__ */ jsxs("div", { className: "p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl animate-in zoom-in-95 duration-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20", children: /* @__PURE__ */ jsx(MessageSquare, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-lg font-black text-slate-900 dark:text-white", children: "WhatsApp API Credentials" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Configure your Meta Business for WhatsApp" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400", children: "API URL" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.whatsapp_api_url,
                    onChange: (e) => setData("whatsapp_api_url", e.target.value),
                    className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500",
                    placeholder: "https://graph.facebook.com/v17.0"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400", children: "Phone Number ID" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.whatsapp_phone_number_id,
                    onChange: (e) => setData("whatsapp_phone_number_id", e.target.value),
                    className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500",
                    placeholder: "your_phone_number_id"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-400", children: "Access Token" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "password",
                    value: data.whatsapp_access_token,
                    onChange: (e) => setData("whatsapp_access_token", e.target.value),
                    className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono",
                    placeholder: "EAAB..."
                  }
                )
              ] })
            ] })
          ] })
        ] });
      case "party":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Customer Preferences", description: "Manage how you interact with parties" }),
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.party_grouping, onChange: (v) => setData("party_grouping", v), label: "Enable Party Grouping", description: "Categorize customers by region or type" }),
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.loyalty_enabled, onChange: (v) => setData("loyalty_enabled", v), label: "Loyalty Points Program", description: "Reward frequent customers with points" }),
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.enable_credit_limit, onChange: (v) => setData("enable_credit_limit", v), label: "Enable Credit Limit", description: "Set maximum credit limits for customers" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl border border-indigo-100 dark:border-indigo-500/20", children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsx(Clock, { size: 18 }),
              " Payment Reminders"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.payment_reminders, onChange: (v) => setData("payment_reminders", v), label: "Enable Payment Reminders", description: "Automatically email customers with outstanding invoices" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm text-indigo-700 dark:text-indigo-300/80", children: "Send reminder after (days) past invoice date" }),
                /* @__PURE__ */ jsx("input", { type: "number", value: data.payment_reminder_days, onChange: (e) => setData("payment_reminder_days", e.target.value), className: "w-full px-4 py-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" })
              ] })
            ] })
          ] })
        ] }) });
      case "item":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx(SectionHeader, { title: "Inventory Control", description: "Manage products and stock levels" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.stock_maintenance, onChange: (v) => setData("stock_maintenance", v), label: "Stock Maintenance", description: "Track real-time inventory levels" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.barcode_scan_enabled, onChange: (v) => setData("barcode_scan_enabled", v), label: "Barcode Scanning", description: "Use scanners for quick billing" }),
              /* @__PURE__ */ jsx(Toggle$1, { enabled: data.batch_tracking_enabled, onChange: (v) => setData("batch_tracking_enabled", v), label: "Batch & Expiry Tracking", description: "Track products by batch numbers" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 dark:bg-slate-700/30 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-3 right-3", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-2xs font-black uppercase tracking-widest rounded border border-amber-200 dark:border-amber-500/30 shadow-sm", children: "Upcoming" }) }),
              /* @__PURE__ */ jsxs("h4", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 opacity-50", children: [
                /* @__PURE__ */ jsx(Plus, { size: 18, className: "text-indigo-500" }),
                " Custom Item Fields"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-6 opacity-50", children: "Add up to 6 custom fields like Color, Material, or Brand to your products." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6 items-center", children: [
            /* @__PURE__ */ jsx(Toggle$1, { enabled: data.wholesale_price_enabled, onChange: (v) => setData("wholesale_price_enabled", v), label: "Wholesale Pricing", description: "Enable separate pricing for bulk buyers" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "Low Stock Threshold" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: data.low_stock_threshold,
                  onChange: (e) => setData("low_stock_threshold", e.target.value),
                  className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                }
              )
            ] })
          ] })
        ] });
      case "accounting":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(SectionHeader, { title: "Financial Cycles", description: "Manage your fiscal year and reporting" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "Fiscal Year Start" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: data.fiscal_year_start || "2025-01-01", onChange: (e) => setData("fiscal_year_start", e.target.value), className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" })
          ] })
        ] }) }) });
      case "security":
        return /* @__PURE__ */ jsx(SystemSettingsSection, { data, setData, activeSubSection: "security" });
      case "backup":
        return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-12 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20", children: /* @__PURE__ */ jsx(Database, { size: 32 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-900 dark:text-white mb-2", children: "Backups now live in Data & Backup" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 max-w-md", children: "Automatic daily backups, manual snapshots, cloud sync and restore are all in one place now, instead of split between Settings and Data Management." })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => router.visit(route("store.admin.data", { store_slug: store?.slug, tab: "backups" })),
              className: "px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95",
              children: [
                "Go to Data & Backup ",
                /* @__PURE__ */ jsx(ChevronRight, { size: 18 })
              ]
            }
          )
        ] });
      case "reset":
        return /* @__PURE__ */ jsx(DangerSettingsSection, { data, setData });
      case "reminders":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden flex flex-col min-h-[400px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
              /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Search services for reminder...", className: "w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none" })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  const newReminder = {
                    id: Date.now(),
                    name: "New Service",
                    interval: 30,
                    unit: "days"
                  };
                  setData("service_reminders", [...data.service_reminders, newReminder]);
                },
                className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " Add New Reminder"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 divide-y divide-slate-100 dark:divide-slate-700", children: data.service_reminders.length > 0 ? data.service_reminders.map((reminder, idx) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500", children: /* @__PURE__ */ jsx(Clock, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-xs", children: [
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
                    className: "w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 dark:text-white focus:ring-0"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500 uppercase font-black tracking-widest mt-0.5", children: "Recurring Service" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl", children: [
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-slate-400 uppercase tracking-tighter", children: "Every" }),
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
                    className: "w-12 bg-transparent border-none p-0 text-sm font-black text-indigo-600 focus:ring-0 text-center"
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
                    className: "bg-transparent border-none p-0 text-xs font-bold text-slate-500 focus:ring-0",
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
                onClick: () => {
                  const newItems = data.service_reminders.filter((r) => r.id !== reminder.id);
                  setData("service_reminders", newItems);
                },
                className: "p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all",
                children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
              }
            )
          ] }, reminder.id)) : /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-slate-400 py-12", children: [
            /* @__PURE__ */ jsx(Clock, { size: 48, className: "mb-4 opacity-20" }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-sm tracking-tight mb-1", children: "No Service Reminders Yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-center max-w-xs", children: 'Click "Add New Reminder" above to schedule automatic recurring service notifications.' })
          ] }) })
        ] }) });
      default:
        return /* @__PURE__ */ jsxs("div", { className: "h-64 flex flex-col items-center justify-center text-slate-400 opacity-50", children: [
          /* @__PURE__ */ jsx(Settings, { size: 48, className: "mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "font-bold uppercase tracking-widest", children: "Section Under Development" })
        ] });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "System Settings", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "System Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex gap-6 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: `${sidebarCollapsed ? "w-20" : "w-80"} bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300`, children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: `${sidebarCollapsed ? "px-2 py-4 justify-center" : "px-4 py-5 justify-between"} flex items-center border-b border-slate-800/50 mb-3 relative z-50`, children: [
          !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0", children: /* @__PURE__ */ jsx(Settings, { size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-base font-black text-white tracking-tight", children: "System" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-[0.2em] text-indigo-400", children: "Control" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                setSidebarCollapsed(!sidebarCollapsed);
              },
              className: "w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0 z-50 cursor-pointer",
              children: /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}` })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1 relative z-10 pb-20", children: SETTINGS_CATEGORIES.map((category) => {
          const CatIcon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const categorySections = SETTINGS_SECTIONS.filter((s) => category.sections.includes(s.id));
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
                className: "w-full flex items-center justify-between px-3 py-2 text-2xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CatIcon, { size: 12 }),
                    category.name
                  ] }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: `transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}` })
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
                  className: `w-full flex items-center gap-3 ${sidebarCollapsed ? "p-2 justify-center" : "p-3"} rounded-xl text-left transition-all duration-200 group relative overflow-hidden border ${isActive ? "bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"}`,
                  children: [
                    isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-100" }),
                    /* @__PURE__ */ jsx("div", { className: `relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-800 group-hover:bg-slate-700"}`, children: /* @__PURE__ */ jsx(Icon, { size: 16, className: isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400" }) }),
                    !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx("p", { className: `text-xs font-bold tracking-tight ${isActive ? "text-white" : "text-slate-200"}`, children: section.name }),
                      /* @__PURE__ */ jsx("p", { className: `text-3xs leading-tight ${isActive ? "text-indigo-200" : "text-slate-500"} line-clamp-1`, children: section.description })
                    ] }),
                    !sidebarCollapsed && /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `relative z-10 transition-all duration-200 shrink-0 ${isActive ? "text-white" : "text-slate-600 opacity-0 group-hover:opacity-100"}` })
                  ]
                },
                section.id
              );
            }) })
          ] }, category.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col h-full relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "p-10 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-2xs font-black uppercase tracking-[0.2em] rounded-full", children: "Section" }),
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-slate-900 dark:text-white tracking-tight", children: SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.name })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-base text-slate-500 font-medium", children: SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.description })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: `relative group px-10 py-4 rounded-2xl font-black text-sm transition-all duration-500 transform active:scale-95 overflow-hidden shadow-2xl hover:shadow-indigo-500/40`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-900 z-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-500" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center gap-3 text-white", children: saved ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Check, { size: 20, strokeWidth: 3, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { children: "Changes Saved" })
                  ] }) : processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(RefreshCw, { size: 20, className: "animate-spin text-indigo-300" }),
                    /* @__PURE__ */ jsx("span", { children: "Syncing..." })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Save, { size: 20, className: "group-hover:scale-110 transition-transform" }),
                    /* @__PURE__ */ jsx("span", { children: "Save Changes" })
                  ] }) })
                ]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: `flex-1 custom-scrollbar ${activeSection === "print" ? "p-0 overflow-hidden" : "p-10 overflow-y-auto"}`, children: /* @__PURE__ */ jsx("div", { className: `mx-auto transition-all duration-300 ${activeSection === "print" ? "max-w-full h-full" : activeSection === "business" ? "max-w-full px-6 pb-40" : "max-w-5xl pb-40"}`, children: renderSection() }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
    .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
                .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
                .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 10px;
}
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
` }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-0 right-0 p-6 z-50 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "pointer-events-auto" }) }),
    /* @__PURE__ */ jsx(
      PasscodeModal,
      {
        isOpen: isPasscodeModalOpen,
        onClose: () => setIsPasscodeModalOpen(false),
        onSuccess: (code) => saveSettings(),
        settings
      }
    )
  ] });
}
export {
  AdminSettings as default
};
