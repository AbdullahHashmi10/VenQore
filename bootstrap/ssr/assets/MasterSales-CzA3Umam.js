import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { usePage, Head } from "@inertiajs/react";
import { User, X, Plus, Settings, Package, Layers, Banknote, CreditCard, Check, Printer, Search, ScanBarcode, Calculator, Truck, History, AlertTriangle, RefreshCcw, Tag, ArrowUp, ArrowDown, AlertCircle, MoreHorizontal, Copy, FileText, Trash2 } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { e as useWorkspace } from "./marketing-pages-CTBAvetE.js";
import "../ssr.js";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-ulkv479L.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-DMTeGwCg.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
import "use-debounce";
import "./SmartCombobox-D_cdCy9L.js";
const CustomerProfileCard = ({ customer, onClose }) => {
  if (!customer) return null;
  const { store } = usePage().props;
  const isOverLimit = (customer.balance || 0) > (customer.credit_limit || 999999);
  return /* @__PURE__ */ jsxs("div", { className: "absolute top-14 left-0 w-full bg-slate-900 border-b border-indigo-500/30 p-4 shadow-2xl z-20 grid grid-cols-4 gap-4 animate-in slide-in-from-top-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-r border-slate-700 pr-4", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-indigo-400 font-bold text-lg mb-1", children: customer.name }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400 font-mono space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "ID: #",
          customer.id
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Ph: ",
          customer.phone || "N/A"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center text-emerald-500", children: [
          /* @__PURE__ */ jsx(Tag, { className: "w-3 h-3 mr-1" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Price Level: ",
            customer.price_level || "Retail"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-r border-slate-700 px-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-slate-500 font-bold mb-2", children: "Financial Status" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-sm", children: "Balance:" }),
        /* @__PURE__ */ jsx("span", { className: `font-mono font-bold ${customer.balance > 0 ? "text-red-400" : "text-emerald-400"}`, children: formatCurrency(customer.balance || 0, store) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-sm", children: "Credit Limit:" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-slate-300", children: customer.credit_limit ? formatCurrency(customer.credit_limit, store) : "∞" })
      ] }),
      isOverLimit && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }),
        " Over Limit"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-r border-slate-700 px-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-slate-500 font-bold mb-2", children: "Growth Engine" }),
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-amber-500/10 to-transparent p-2 rounded", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-amber-500 font-bold text-lg", children: [
          customer.points || 0,
          " PTS"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xs text-amber-400/60", children: [
          "Redeemable Value: ",
          formatCurrency((customer.points || 0) * 0.1, store)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-4 relative", children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "absolute top-0 right-0 p-1 hover:text-white text-slate-500", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-slate-500 font-bold mb-2", children: "Last Interaction" }),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-300", children: "2 Days Ago" }),
      /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-500 mb-2", children: "Invoice #INV-2024-001" }),
      /* @__PURE__ */ jsx("button", { className: "text-xs text-indigo-400 underline hover:text-indigo-300", children: "View Full Ledger" })
    ] })
  ] });
};
const AtomicRow = ({ item, index, onUpdate, onRemove, onMove, onDuplicate }) => {
  const { store } = usePage().props;
  const gross = item.quantity * item.price;
  const discountAmount = item.discountType === "percent" ? gross * (item.discount / 100) : item.discount;
  const net = gross - discountAmount;
  (item.price - (item.cost || 0)) * item.quantity;
  const margin = item.price > 0 ? (item.price - (item.cost || 0)) / item.price * 100 : 0;
  return /* @__PURE__ */ jsxs("tr", { className: "group border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors relative", children: [
    /* @__PURE__ */ jsx("td", { className: "w-10", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => onMove(index, -1), className: "p-1 hover:text-indigo-400", children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-3 h-3" }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => onMove(index, 1), className: "p-1 hover:text-indigo-400", children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-3 h-3" }) })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-100", children: item.name }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-2xs text-slate-500 font-mono mt-1", children: [
        /* @__PURE__ */ jsxs("span", { className: "bg-slate-800 px-1 rounded border border-slate-700", children: [
          "SKU: ",
          item.product?.sku || "N/A"
        ] }),
        item.product?.stock_quantity <= 0 && /* @__PURE__ */ jsxs("span", { className: "text-red-500 flex items-center", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 mr-1" }),
          " Stock: 0"
        ] }),
        item.product?.location && /* @__PURE__ */ jsxs("span", { children: [
          "Loc: ",
          item.product.location
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "w-24 p-2", children: item.product?.has_batch ? /* @__PURE__ */ jsxs("select", { className: "bg-slate-900 border border-slate-600 text-2xs rounded p-1 w-full text-amber-400 cursor-pointer", children: [
      /* @__PURE__ */ jsx("option", { children: "Batch A (Exp 2025)" }),
      /* @__PURE__ */ jsx("option", { children: "Batch B (Exp 2026)" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "text-center text-slate-700 text-xs", children: "-" }) }),
    /* @__PURE__ */ jsx("td", { className: "w-32 p-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          value: item.quantity,
          onChange: (e) => onUpdate(item.id, "quantity", parseFloat(e.target.value)),
          className: "w-16 bg-slate-800 border-slate-600 rounded text-center font-bold text-white focus:ring-indigo-500"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-3xs text-slate-500 leading-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "cursor-pointer hover:text-indigo-400", children: "PCS" }),
        /* @__PURE__ */ jsx("span", { className: "cursor-pointer hover:text-indigo-400", children: "BOX" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "w-32 p-2", children: /* @__PURE__ */ jsxs("div", { className: "relative group/price", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          value: item.price,
          onChange: (e) => onUpdate(item.id, "price", parseFloat(e.target.value)),
          className: "w-full bg-slate-800 border-slate-600 rounded text-right pr-2 text-emerald-400 font-mono"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl z-50 hidden group-focus-within/price:block min-w-[150px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-400 flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Cost:" }),
          " ",
          /* @__PURE__ */ jsx("span", { children: formatCurrency(item.product?.cost || 0, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-400 flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Margin:" }),
          /* @__PURE__ */ jsxs("span", { className: margin < 15 ? "text-red-400" : "text-green-400", children: [
            margin.toFixed(1),
            "%"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "w-32 p-3 text-right font-mono font-bold text-slate-200", children: formatCurrency(net, store) }),
    /* @__PURE__ */ jsx("td", { className: "w-10 text-center", children: /* @__PURE__ */ jsxs("div", { className: "relative group/menu", children: [
      /* @__PURE__ */ jsx("button", { className: "text-slate-500 hover:text-indigo-400", children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-6 w-40 bg-slate-800 border border-slate-700 rounded shadow-2xl overflow-hidden hidden group-hover/menu:block z-50", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => onDuplicate(item.id), className: "w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center", children: [
          /* @__PURE__ */ jsx(Copy, { className: "w-3 h-3 mr-2" }),
          " Duplicate Row"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3 mr-2" }),
          " Add Note"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center", children: [
          /* @__PURE__ */ jsx(History, { className: "w-3 h-3 mr-2" }),
          " History"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-slate-700 my-1" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => onRemove(item.id), className: "w-full text-left px-3 py-2 text-xs hover:bg-red-900/50 text-red-400 flex items-center", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3 mr-2" }),
          " Remove"
        ] })
      ] })
    ] }) })
  ] });
};
function MasterSales() {
  const { store } = usePage().props;
  const { activeInvoices, currentInvoiceId, setCurrentInvoiceId, addInvoice, removeInvoice, updateInvoice } = useWorkspace();
  const currentInvoice = activeInvoices.find((i) => i.id === currentInvoiceId) || activeInvoices[0];
  const [scanMode, setScanMode] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const tableRef = useRef(null);
  const logAction = (action, details = "") => {
    const entry = {
      id: Date.now(),
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      action,
      details
    };
    setAuditLog((prev) => [entry, ...prev].slice(0, 100));
  };
  const handleMoveItem = (index, direction) => {
    if (!currentInvoice?.items) return;
    const newItems = [...currentInvoice.items];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newItems.length) {
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      updateInvoice(currentInvoice.id, { items: newItems });
      logAction("REORDER", `Moved item ${index + 1} to ${newIndex + 1}`);
    }
  };
  const handleUpdateItem = (itemId, field, value) => {
    const newItems = currentInvoice.items.map((item) => {
      if (item.id === itemId) return { ...item, [field]: value };
      return item;
    });
    updateInvoice(currentInvoice.id, { items: newItems });
  };
  const handleDuplicateItem = (itemId) => {
    const item = currentInvoice.items.find((i) => i.id === itemId);
    if (item) {
      const newItem = { ...item, id: Date.now(), quantity: 1 };
      updateInvoice(currentInvoice.id, { items: [...currentInvoice.items, newItem] });
      logAction("DUPLICATE", `Cloned ${item.name}`);
    }
  };
  const handleSelectProduct = (product) => {
    const newItem = {
      id: Date.now(),
      product,
      name: product.name,
      price: parseFloat(product.price || 0),
      quantity: 1,
      discount: 0,
      discountType: "fixed",
      cost: product.cost || 0
    };
    const items = currentInvoice.items || [];
    updateInvoice(currentInvoice.id, { items: [...items, newItem] });
    logAction("ADD_ITEM", product.name);
    setSearchQuery("");
    searchRef.current?.focus();
  };
  return /* @__PURE__ */ jsxs("div", { className: "h-screen w-full bg-void-800 text-slate-300 flex flex-col font-sans overflow-hidden", children: [
    /* @__PURE__ */ jsx(Head, { title: "Master Sales Console" }),
    /* @__PURE__ */ jsxs("div", { className: "h-12 bg-slate-950 border-b border-slate-800 flex items-center px-2 space-x-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[80vw]", children: [
        activeInvoices.map((inv, idx) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setCurrentInvoiceId(inv.id),
            className: `
                                relative group flex items-center px-4 py-2 rounded-t-lg cursor-pointer transition-all border-t-2 select-none min-w-[160px] max-w-[220px]
                                ${inv.id === currentInvoiceId ? "bg-slate-800 border-indigo-500 text-white shadow-lg" : "bg-slate-900 border-transparent text-slate-500 hover:bg-slate-800"}
                            `,
            children: [
              /* @__PURE__ */ jsx(User, { className: `w-3 h-3 mr-2 ${inv.id === currentInvoiceId ? "text-indigo-400" : "opacity-0"}` }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col truncate", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold truncate", children: inv.customer?.name || `Invoice #${idx + 1}` }),
                /* @__PURE__ */ jsxs("span", { className: "text-3xs font-mono opacity-60 flex justify-between w-full", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    inv.items?.length || 0,
                    " Items"
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: formatCurrency(inv.total || 0, store) })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    removeInvoice(inv.id);
                  },
                  className: "absolute right-1 top-1 p-1 hover:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100",
                  children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
                }
              )
            ]
          },
          inv.id
        )),
        /* @__PURE__ */ jsx("button", { onClick: addInvoice, className: "p-2 hover:bg-slate-800 rounded text-slate-400", children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsx("button", { className: "p-2 text-slate-500 hover:text-white", children: /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex overflow-hidden relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col bg-slate-900 relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "h-16 border-b border-slate-800 bg-slate-900 flex items-center px-4 justify-between z-10 relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center w-1/3 relative", children: [
            /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg mr-3 ${currentInvoice?.customer ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-600"}`, children: /* @__PURE__ */ jsx(User, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-slate-500 tracking-wider", children: "Customer / Client" }),
              /* @__PURE__ */ jsx(
                AsyncPartyCombobox,
                {
                  partyType: "all",
                  onSelect: (party) => {
                    if (!party || !currentInvoice) return;
                    updateInvoice(currentInvoice.id, { customer: party });
                    logAction("CUSTOMER", `Selected ${party.name}`);
                  },
                  placeholder: "Search Client (Alt+C)...",
                  className: "bg-transparent border-none p-0 text-sm font-bold text-white"
                }
              )
            ] }),
            currentInvoice?.customer && showCustomerDetails && /* @__PURE__ */ jsx(CustomerProfileCard, { customer: currentInvoice.customer, onClose: () => setShowCustomerDetails(false) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-6 text-right", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-slate-500", children: "Date" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-mono text-slate-300", children: (/* @__PURE__ */ new Date()).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-slate-500", children: "Salesman" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-300", children: "Admin User" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto bg-slate-900", ref: tableRef, children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-800 sticky top-0 z-10 border-b border-slate-700 shadow-md", children: /* @__PURE__ */ jsxs("tr", { className: "text-2xs uppercase text-slate-400 font-bold tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "p-2 w-10 text-center", children: "#" }),
            /* @__PURE__ */ jsx("th", { className: "p-2", children: "Item Description" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 w-24", children: "Batch/Serial" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 w-32", children: "Qty / Unit" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 w-32", children: "Price" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 w-32 text-right", children: "Total" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 w-10" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            currentInvoice?.items?.map((item, idx) => /* @__PURE__ */ jsx(
              AtomicRow,
              {
                item,
                index: idx,
                onUpdate: handleUpdateItem,
                onRemove: (id) => updateInvoice(currentInvoice.id, { items: currentInvoice.items.filter((x) => x.id !== id) }),
                onDuplicate: handleDuplicateItem,
                onMove: handleMoveItem
              },
              item.id
            )),
            !currentInvoice?.items?.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "h-64 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center opacity-20", children: [
              /* @__PURE__ */ jsx(Package, { className: "w-16 h-16 mb-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-lg font-light", children: "The cart is empty" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Scan items or use search on the right" })
            ] }) }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border-t border-slate-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsxs("div", { className: "w-1/2 pr-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xs uppercase font-bold text-slate-500 mb-2 flex items-center", children: [
                /* @__PURE__ */ jsx(Layers, { className: "w-3 h-3 mr-1" }),
                " Payment Stack"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-slate-800 rounded p-2 border border-slate-700 flex flex-col cursor-pointer hover:border-emerald-500 transition-colors", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Cash" }),
                    /* @__PURE__ */ jsx(Banknote, { className: "w-4 h-4 text-emerald-500" })
                  ] }),
                  /* @__PURE__ */ jsx("input", { type: "number", className: "bg-transparent border-none p-0 text-emerald-400 font-bold text-right", placeholder: "0.00" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-slate-800 rounded p-2 border border-slate-700 flex flex-col cursor-pointer hover:border-blue-500 transition-colors", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Card" }),
                    /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4 text-blue-500" })
                  ] }),
                  /* @__PURE__ */ jsx("input", { type: "number", className: "bg-transparent border-none p-0 text-blue-400 font-bold text-right", placeholder: "0.00" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-1/2 pl-10 border-l border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { children: formatCurrency(currentInvoice?.subtotal || 0, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax (VAT 5%)" }),
                /* @__PURE__ */ jsx("span", { children: formatCurrency(currentInvoice?.tax || 0, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount" }),
                /* @__PURE__ */ jsxs("span", { className: "text-red-400", children: [
                  "-",
                  formatCurrency(currentInvoice?.discount || 0, store)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-700 my-2 pt-2 flex justify-between items-end", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-300", children: "TOTAL DUE" }),
                /* @__PURE__ */ jsx("span", { className: "text-4xl font-black text-white", children: formatCurrency(currentInvoice?.total || 0, store) })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex space-x-3", children: [
            /* @__PURE__ */ jsxs("button", { className: "flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded shadow-lg shadow-emerald-900/40 flex items-center justify-center", children: [
              /* @__PURE__ */ jsx(Check, { className: "w-5 h-5 mr-2" }),
              " COMPLETE SALE (F10)"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 rounded font-bold flex items-center", children: [
              /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5 mr-2" }),
              " Print"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-[350px] bg-slate-950 border-l border-slate-800 flex flex-col z-30 shadow-2xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-2 grid grid-cols-2 gap-2 bg-slate-900 border-b border-slate-800", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setScanMode(false),
              className: `p-2 text-xs font-bold uppercase rounded flex flex-col items-center justify-center ${!scanMode ? "bg-indigo-600 text-white shadow-lg" : "bg-transparent text-slate-500 hover:bg-slate-800"}`,
              children: [
                /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 mb-1" }),
                " Search"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setScanMode(true),
              className: `p-2 text-xs font-bold uppercase rounded flex flex-col items-center justify-center ${scanMode ? "bg-emerald-600 text-white shadow-lg" : "bg-transparent text-slate-500 hover:bg-slate-800"}`,
              children: [
                /* @__PURE__ */ jsx(ScanBarcode, { className: "w-4 h-4 mb-1" }),
                " Scan"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950", children: scanMode ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("input", { type: "text", autoFocus: true, className: "w-full bg-black border-2 border-emerald-500/50 text-emerald-400 font-mono text-center text-xl p-3 rounded", placeholder: "SCAN BARCODE..." }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-center text-emerald-600 mt-2 animate-pulse", children: "Running Barcode Listener..." })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "pt-1", children: [
          /* @__PURE__ */ jsx(
            AsyncProductCombobox,
            {
              onSelect: (product) => {
                if (!product) return;
                handleSelectProduct(product);
              },
              placeholder: "Search products... (Alt+P)"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-2 text-2xs text-slate-500", children: [
            /* @__PURE__ */ jsx("span", { children: "Select to add to invoice" }),
            /* @__PURE__ */ jsx("span", { children: "Type to search" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-2", children: [
          searchQuery && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleSelectProduct({ id: i, name: `Sample Product ${i}`, price: 10 + i, cost: 5 }),
              className: "p-3 bg-slate-800/30 border border-slate-700/50 rounded hover:bg-indigo-600/10 hover:border-indigo-500 cursor-pointer group transition-all",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-200 group-hover:text-white", children: [
                    "Sample Product ",
                    i
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-emerald-400 font-bold", children: formatCurrency(12.5, store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1 text-2xs text-slate-500", children: [
                  /* @__PURE__ */ jsx("span", { children: "Ware A: 50pcs" }),
                  /* @__PURE__ */ jsx("span", { children: "Shelf: A-12" })
                ] })
              ]
            },
            i
          )) }),
          !searchQuery && !scanMode && /* @__PURE__ */ jsxs("div", { className: "mt-8 px-4 grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("button", { className: "aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-indigo-400 transition-all", children: [
              /* @__PURE__ */ jsx(Calculator, { className: "w-6 h-6 mb-2" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs uppercase font-bold", children: "Calculator" })
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-emerald-400 transition-all", children: [
              /* @__PURE__ */ jsx(Truck, { className: "w-6 h-6 mb-2" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs uppercase font-bold", children: "Shipping" })
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-amber-400 transition-all", children: [
              /* @__PURE__ */ jsx(History, { className: "w-6 h-6 mb-2" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs uppercase font-bold", children: "Recent" })
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-red-400 transition-all", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6 mb-2" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs uppercase font-bold", children: "Hold Bill" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "h-48 border-t border-slate-800 bg-slate-950 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 border-b border-slate-800 text-2xs uppercase font-bold text-slate-500 flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("span", { children: "System Activity Log" }),
            /* @__PURE__ */ jsx(RefreshCcw, { className: "w-3 h-3" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-2 space-y-2 font-mono text-2xs", children: auditLog.map((log) => /* @__PURE__ */ jsxs("div", { className: "flex space-x-2 text-slate-500", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: log.time }),
            /* @__PURE__ */ jsx("span", { className: "text-indigo-400 font-bold", children: log.action }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: log.details })
          ] }, log.id)) })
        ] })
      ] })
    ] })
  ] });
}
export {
  MasterSales as default
};
