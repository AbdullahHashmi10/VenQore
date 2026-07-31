import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { Utensils, Layout, Image, Plus, Trash2, AlertCircle, Download, QrCode } from "lucide-react";
import ToolShell from "./ToolShell-BDFk9CqZ.js";
import Select from "./Select-BFX9Hz_h.js";
import "@inertiajs/react";
import "./MarketingLayout-CMiC1Bik.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ToolsSidebar-BvvbAU_Q.js";
import "./HousePromo-CAVKWeBy.js";
const PRESET_OPTIONS = [
  { value: "tent_4x6", label: 'Table Tent (4" x 6")', hint: "Standard folded/standing tent card" },
  { value: "standee_5x7", label: 'Table Standee (5" x 7")', hint: "Acrylic frame / large display" },
  { value: "sticker_3x3", label: 'Table Sticker (3" x 3")', hint: "Compact table corner decal" }
];
const THEME_OPTIONS = [
  { value: "classic_dark", label: "Classic Dark Slate", hint: "Dark navy background with gold accents" },
  { value: "modern_light", label: "Modern Light Clean", hint: "Crisp white card with blue accents" },
  { value: "warm_amber", label: "Warm Amber / Café", hint: "Cozy cream & warm brown" },
  { value: "emerald_bistro", label: "Emerald Bistro", hint: "Deep green card with fresh mint accents" }
];
const FAQS = [
  { q: "Is the QR Menu Generator free to use?", a: "Yes! You can generate, customize, and download print-ready table tent cards and QR menu graphics completely free with no watermark." },
  { q: "What card layout sizes are available?", a: 'We support Table Tent (4"x6"), Table Standee (5"x7"), and compact Table Sticker (3"x3") formats suitable for acrylic stands, table tents, and table decals.' },
  { q: "Can I add a logo to the QR Code?", a: "Yes. Upload your logo image and it will be embedded right in the center of the QR code using high error correction to ensure perfect scannability." },
  { q: "Can I include sample menu items on the printed card?", a: 'Yes. You can add featured items or popular dishes with prices, which will be styled cleanly below the QR code on 4x6" and 5x7" layouts.' },
  { q: "How do customers view the menu?", a: "Customers simply point their smartphone camera at the printed QR code on their table to automatically open your online menu or PDF link." }
];
const inputBase = "w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400/60 transition-colors";
const labelBase = "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
function QrMenuTool({ presets = {}, themes = {}, supportsRaster = true, supportsLogo = true, toolGroups = [] }) {
  const [restaurantName, setRestaurantName] = useState("The Artisan Bistro");
  const [tagline, setTagline] = useState("Scan for Digital Menu & Daily Specials");
  const [menuUrl, setMenuUrl] = useState("https://venqore.com/menu");
  const [tableNumber, setTableNumber] = useState("12");
  const [instructionText, setInstructionText] = useState("Point your camera at the QR code to view menu");
  const [preset, setPreset] = useState("tent_4x6");
  const [theme, setTheme] = useState("classic_dark");
  const [customFg, setCustomFg] = useState("#000000");
  const [customBg, setCustomBg] = useState("#FFFFFF");
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [logo, setLogo] = useState(null);
  const logoInputRef = useRef(null);
  const [menuItems, setMenuItems] = useState([
    { name: "Truffle Mushroom Burger", price: "$16.50", description: "Angus beef patty, black truffle aioli, aged cheddar" },
    { name: "Artisan Wood-fired Pizza", price: "$18.00", description: "San Marzano tomatoes, fresh mozzarella, basil" }
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || "";
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };
  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: "", price: "", description: "" }]);
  };
  const updateMenuItem = (index, key, val) => {
    const updated = [...menuItems];
    updated[index][key] = val;
    setMenuItems(updated);
  };
  const removeMenuItem = (index) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };
  const handleDownload = () => {
    if (!restaurantName.trim()) {
      setErrors(["Please enter a Restaurant or Café Name."]);
      return;
    }
    if (!menuUrl.trim()) {
      setErrors(["Please enter a Menu URL / Website Link."]);
      return;
    }
    setErrors([]);
    setLoading(true);
    const payload = {
      restaurant_name: restaurantName,
      tagline,
      menu_url: menuUrl,
      table_number: tableNumber,
      instruction_text: instructionText,
      preset,
      theme,
      custom_fg: useCustomColors ? customFg : null,
      custom_bg: useCustomColors ? customBg : null,
      logo: logo || null,
      menu_items: menuItems.filter((item) => item.name.trim() !== "")
    };
    fetch(route("tools.qr-menu.render"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/pdf",
        "X-CSRF-TOKEN": csrf()
      },
      body: JSON.stringify(payload)
    }).then(async (res) => {
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrors(json.errors || ["Failed to generate PDF. Please check your inputs."]);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-menu-${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch(() => setErrors(["Network error occurred while generating PDF."])).finally(() => setLoading(false));
  };
  const activeTheme = themes[theme] || {
    card_bg: "#0f172a",
    text_color: "#ffffff",
    accent_color: "#f59e0b"
  };
  return /* @__PURE__ */ jsx(
    ToolShell,
    {
      title: "Free QR Menu & Table Card Generator — Restaurant & Café | VenQore",
      metaDescription: "Create printable QR code menu cards, table tents (4x6, 5x7) & stickers (3x3). Customize colors, logo & menu items. Free PDF download, no watermark.",
      eyebrow: "Free Tool",
      h1: "QR Menu & Table Tent Generator",
      answer: "Design and print restaurant QR code menus, table tent cards, acrylic standee inserts, and table sticker decals in minutes. Enter your menu link, customize themes and logo, list optional featured dishes, and download a print-ready PDF.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "qr-menu-generator",
      cta: {
        headline: "Turn table scans into live POS orders & inventory sync.",
        subtext: "VenQore POS empowers restaurants with QR table ordering, kitchen display systems, inventory tracking, and double-entry accounting."
      },
      related: [
        { label: "QR Code Generator", href: "/tools/qr-code-generator" },
        { label: "Recipe Costing Calculator", href: "/tools/food-cost-calculator" },
        { label: "Price Tag Generator", href: "/tools/price-tag-generator" }
      ],
      children: /* @__PURE__ */ jsx("div", { className: "rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-12 gap-6 lg:gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 space-y-6 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Utensils, { size: 16, className: "text-amber-500" }),
              " Restaurant & Menu Details"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelBase, children: "Restaurant / Café Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: inputBase,
                  value: restaurantName,
                  onChange: (e) => setRestaurantName(e.target.value),
                  placeholder: "e.g. The Artisan Bistro"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelBase, children: "Menu URL / Digital Link *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: inputBase,
                  value: menuUrl,
                  onChange: (e) => setMenuUrl(e.target.value),
                  placeholder: "e.g. https://myrestaurant.com/menu"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: labelBase, children: "Tagline / Header" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: inputBase,
                    value: tagline,
                    onChange: (e) => setTagline(e.target.value),
                    placeholder: "e.g. Scan for Digital Menu"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: labelBase, children: "Table Number (Optional)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: inputBase,
                    value: tableNumber,
                    onChange: (e) => setTableNumber(e.target.value),
                    placeholder: "e.g. 12 or A-4"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelBase, children: "Instruction Text" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: inputBase,
                  value: instructionText,
                  onChange: (e) => setInstructionText(e.target.value),
                  placeholder: "e.g. Point your camera at the QR code to open menu"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2 border-t border-slate-900/10 dark:border-white/10", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Layout, { size: 16, className: "text-indigo-500" }),
              " Layout & Theme Presets"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: labelBase, children: "Card Layout Preset" }),
                /* @__PURE__ */ jsx(Select, { value: preset, onChange: setPreset, options: PRESET_OPTIONS })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: labelBase, children: "Color Theme" }),
                /* @__PURE__ */ jsx(Select, { value: theme, onChange: setTheme, options: THEME_OPTIONS })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelBase, children: "QR Center Logo (Optional)" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => logo ? setLogo(null) : logoInputRef.current?.click(),
                    className: `inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${logo ? "bg-amber-500/15 border border-amber-400/40 text-amber-600 dark:text-amber-300" : "bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-400"}`,
                    children: [
                      /* @__PURE__ */ jsx(Image, { size: 14 }),
                      " ",
                      logo ? "Remove Logo" : "Upload Center Logo"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/png,image/jpeg", className: "hidden", onChange: handleLogoUpload }),
                logo && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("img", { src: logo, alt: "", className: "w-8 h-8 object-contain rounded bg-white p-0.5" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: "Logo attached" })
                ] })
              ] })
            ] })
          ] }),
          preset !== "sticker_3x3" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2 border-t border-slate-900/10 dark:border-white/10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Utensils, { size: 16, className: "text-emerald-500" }),
                " Featured Items / Specials (Optional)"
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: addMenuItem,
                  className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 14 }),
                    " Add Item"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: menuItems.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: `${inputBase} flex-1`,
                    placeholder: "Dish Name",
                    value: item.name,
                    onChange: (e) => updateMenuItem(idx, "name", e.target.value)
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: `${inputBase} w-24`,
                    placeholder: "Price",
                    value: item.price,
                    onChange: (e) => updateMenuItem(idx, "price", e.target.value)
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeMenuItem(idx),
                    className: "p-2 text-slate-400 hover:text-red-500 transition-colors",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: `${inputBase} text-xs py-1.5`,
                  placeholder: "Short description / ingredients (optional)",
                  value: item.description,
                  onChange: (e) => updateMenuItem(idx, "description", e.target.value)
                }
              )
            ] }, idx)) })
          ] }),
          errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 dark:text-red-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-300", children: errors.map((err, i) => /* @__PURE__ */ jsx("p", { children: err }, i)) })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleDownload,
              disabled: loading,
              className: "w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-2xl text-sm font-black uppercase tracking-wider hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg",
              children: [
                /* @__PURE__ */ jsx(Download, { size: 18 }),
                " ",
                loading ? "Generating PDF..." : "Download Printable PDF"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-5 flex flex-col items-center", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-6 w-full max-w-sm", children: [
          /* @__PURE__ */ jsx("label", { className: labelBase, children: "Live Card Mockup Preview" }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "w-full rounded-2xl p-6 border shadow-2xl transition-all flex flex-col items-center text-center relative overflow-hidden",
              style: {
                backgroundColor: activeTheme.card_bg,
                borderColor: activeTheme.accent_color,
                color: activeTheme.text_color,
                minHeight: preset === "sticker_3x3" ? "280px" : "420px"
              },
              children: [
                tableNumber && /* @__PURE__ */ jsxs(
                  "span",
                  {
                    className: "text-[10px] font-black uppercase px-3 py-1 rounded-full mb-3 tracking-wider text-white",
                    style: { backgroundColor: activeTheme.accent_color },
                    children: [
                      "Table ",
                      tableNumber
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-black leading-snug mb-1", children: restaurantName || "Restaurant Name" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs opacity-80 italic mb-4", children: tagline || "Scan to view menu" }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 bg-white rounded-xl shadow-md mb-4 relative", children: [
                  /* @__PURE__ */ jsxs("div", { className: "w-32 h-32 bg-slate-100 flex flex-col items-center justify-center rounded border border-slate-200", children: [
                    /* @__PURE__ */ jsx(QrCode, { size: 64, className: "text-slate-800" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono text-slate-500 mt-1", children: "QR Code" })
                  ] }),
                  logo && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: logo, alt: "", className: "w-8 h-8 object-contain rounded bg-white p-0.5 shadow" }) })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold mb-1", children: instructionText || "Scan with your camera" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-mono opacity-60 break-all max-w-[220px]", children: menuUrl || "https://example.com/menu" }),
                preset !== "sticker_3x3" && menuItems.filter((i) => i.name).length > 0 && /* @__PURE__ */ jsx("div", { className: "w-full mt-4 pt-3 border-t border-dashed text-left space-y-1.5 text-xs opacity-90", style: { borderColor: activeTheme.accent_color }, children: menuItems.filter((i) => i.name).slice(0, 3).map((item, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start text-[11px]", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold", children: item.name }),
                    item.description && /* @__PURE__ */ jsx("span", { className: "block text-[9px] opacity-75", children: item.description })
                  ] }),
                  item.price && /* @__PURE__ */ jsx("span", { className: "font-bold ml-2", style: { color: activeTheme.accent_color }, children: item.price })
                ] }, i)) })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3", children: [
            "PDF generates high-resolution vectors formatted to exact physical paper dimensions (",
            preset,
            ")."
          ] })
        ] }) })
      ] }) })
    }
  );
}
export {
  QrMenuTool as default
};
