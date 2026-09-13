import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { P as PremiumButton } from "./PremiumButton-BUDyjGi2.js";
import { S as StockModuleTabs } from "./StockModuleTabs-0gR4Jbnu.js";
import { Tag, Printer, Trash2, Settings } from "lucide-react";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-BMa0miLw.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "./format-131Nyq79.js";
function LabelsIndex({ products }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState({
    width: 50,
    height: 30,
    show_price: true,
    show_name: true,
    show_barcode: true,
    show_qrcode: false
  });
  products.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const addToSelection = (product) => {
    if (!product) return;
    const existing = selectedItems.find((item) => item.id === product.id);
    if (existing) {
      setSelectedItems(selectedItems.map(
        (item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    }
  };
  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setSelectedItems(selectedItems.map(
      (item) => item.id === id ? { ...item, quantity: newQty } : item
    ));
  };
  const removeFromSelection = (id) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };
  const handlePrint = () => {
    if (selectedItems.length === 0) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = route("store.labels.print", { store_slug: store.slug });
    form.target = "_blank";
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "_token";
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);
    selectedItems.forEach((item, index) => {
      const idInput = document.createElement("input");
      idInput.type = "hidden";
      idInput.name = `items[${index}][id]`;
      idInput.value = item.id;
      form.appendChild(idInput);
      const qtyInput = document.createElement("input");
      qtyInput.type = "hidden";
      qtyInput.name = `items[${index}][quantity]`;
      qtyInput.value = item.quantity;
      form.appendChild(qtyInput);
    });
    Object.keys(settings).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = `settings[${key}]`;
      input.value = settings[key];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Label Printing", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Label Printing" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "labels" }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 overflow-y-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-brand-100 dark:bg-brand-900/30 rounded-full text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Tag, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-ink", children: "Barcode Labels" }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: tt("Generate and print product labels.") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(PremiumButton, { onClick: handlePrint, disabled: selectedItems.length === 0, children: [
            /* @__PURE__ */ jsx(Printer, { size: 18 }),
            "Generate PDF"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-surface p-4 rounded-xl border border-line", children: /* @__PURE__ */ jsx(
              AsyncProductCombobox,
              {
                onSelect: addToSelection,
                defaultOptions: products,
                placeholder: tt("Search products to add...")
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl border border-line overflow-hidden", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line font-bold text-ink-secondary", children: [
                tt("Selected Products"),
                " (",
                selectedItems.length,
                ")"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-app", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "p-3 text-left text-xs font-bold text-ink-muted uppercase", children: tt("Product") }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 text-center text-xs font-bold text-ink-muted uppercase w-32", children: "Quantity" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 text-right text-xs font-bold text-ink-muted uppercase w-16" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: selectedItems.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "3", className: "p-8 text-center text-ink-muted", children: tt("No items selected. Search and add products above.") }) }) : selectedItems.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-ink", children: item.name }),
                    /* @__PURE__ */ jsx("div", { className: "text-xs text-ink-muted", children: item.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => updateQuantity(item.id, item.quantity - 1),
                        className: "w-6 h-6 rounded bg-sunken flex items-center justify-center hover:bg-interactive-hover dark:hover:bg-interactive-hover",
                        children: "-"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "w-8 text-center font-bold text-ink-secondary", children: item.quantity }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => updateQuantity(item.id, item.quantity + 1),
                        className: "w-6 h-6 rounded bg-sunken flex items-center justify-center hover:bg-interactive-hover dark:hover:bg-interactive-hover",
                        children: "+"
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => removeFromSelection(item.id),
                      className: "text-red-400 hover:text-red-600 p-1",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                    }
                  ) })
                ] }, item.id)) })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4 text-ink font-bold", children: [
                /* @__PURE__ */ jsx(Settings, { size: 18 }),
                "Label Settings"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-ink-muted uppercase mb-1", children: "Label Size (mm)" }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted mb-1 block", children: "Width" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: settings.width,
                          onChange: (e) => setSettings({ ...settings, width: parseFloat(e.target.value) }),
                          className: "w-full px-3 py-2 rounded-lg bg-app border border-line text-sm"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted mb-1 block", children: "Height" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: settings.height,
                          onChange: (e) => setSettings({ ...settings, height: parseFloat(e.target.value) }),
                          className: "w-full px-3 py-2 rounded-lg bg-app border border-line text-sm"
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2", children: [
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.show_name,
                        onChange: (e) => setSettings({ ...settings, show_name: e.target.checked }),
                        className: "rounded text-brand-600 focus:ring-brand-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-secondary", children: tt("Show Product Name") })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.show_price,
                        onChange: (e) => setSettings({ ...settings, show_price: e.target.checked }),
                        className: "rounded text-brand-600 focus:ring-brand-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-secondary", children: "Show Price" })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.show_barcode,
                        onChange: (e) => setSettings({ ...settings, show_barcode: e.target.checked }),
                        className: "rounded text-brand-600 focus:ring-brand-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-secondary", children: "Show Barcode" })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.show_qrcode,
                        onChange: (e) => setSettings({ ...settings, show_qrcode: e.target.checked }),
                        className: "rounded text-brand-600 focus:ring-brand-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-secondary", children: "Show QR Code (Store Link)" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("div", { className: "mb-4 text-ink font-bold text-sm", children: "Preview" }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-center bg-sunken p-8 rounded-lg", children: /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "bg-white border border-line shadow-sm flex flex-col items-center justify-center p-2 text-center overflow-hidden",
                  style: {
                    width: `${settings.width * 2}px`,
                    height: `${settings.height * 2}px`
                  },
                  children: [
                    settings.show_name && /* @__PURE__ */ jsx("div", { className: "font-bold text-2xs leading-tight mb-1", children: tt("Sample Product") }),
                    settings.show_barcode && /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center", children: [
                      /* @__PURE__ */ jsx("div", { className: "h-4 w-3/4 bg-neutral-800 mb-0.5" }),
                      /* @__PURE__ */ jsx("div", { className: "text-4xs text-ink-muted", children: "12345678" })
                    ] }),
                    settings.show_qrcode && /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border border-line-strong bg-sunken flex items-center justify-center text-4xs font-bold my-1 p-0.5", children: "QR" }),
                    settings.show_price && /* @__PURE__ */ jsx("div", { className: "font-bold text-xs mt-1", children: "$19.99" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-2 text-center", children: "Not to scale. Visual approximation." })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  LabelsIndex as default
};
