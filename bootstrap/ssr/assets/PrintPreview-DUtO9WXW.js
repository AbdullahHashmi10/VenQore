import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "react";
import { f as formatCurrency, n as numberToWords } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-DYgr6x02.js";
const getExtraChargesList = (calculations) => {
  try {
    if (calculations.extra_charge_label && typeof calculations.extra_charge_label === "string" && calculations.extra_charge_label.startsWith("[")) {
      const list = JSON.parse(calculations.extra_charge_label);
      if (Array.isArray(list)) {
        return list.filter((f) => parseFloat(f.value) > 0);
      }
    }
  } catch (_) {
  }
  if (calculations.extra_charge_value > 0) {
    return [{
      id: 1,
      label: calculations.extra_charge_label || "Extra",
      value: calculations.extra_charge_value
    }];
  }
  return [];
};
function PrintPreview({ data, sale = null, type = "regular", mode = "light", forPrint = false }) {
  const MM_TO_PX = 3;
  const paperSizes = {
    "A4": { w: 210, h: 297 },
    "A5": { w: 148, h: 210 },
    "Letter": { w: 216, h: 279 },
    "Legal": { w: 216, h: 356 }
  };
  let width, minHeight;
  if (type === "thermal") {
    if (data.thermal_page_size === "2inch") width = 58 * MM_TO_PX;
    else if (data.thermal_page_size === "4inch") width = 100 * MM_TO_PX;
    else width = 80 * MM_TO_PX;
    const customChars = parseInt(data.thermal_custom_chars) || 0;
    if (customChars > 0 && customChars !== 48) {
      const pxPerChar = 80 * MM_TO_PX / 48;
      width = Math.round(customChars * pxPerChar);
    }
    minHeight = 100 * MM_TO_PX;
  } else {
    let pW, pH;
    if (data.paper_size === "Custom") {
      pW = parseFloat(data.custom_paper_width) || 210;
      pH = parseFloat(data.custom_paper_height) || 297;
    } else {
      const size = paperSizes[data.paper_size] || paperSizes["A4"];
      pW = size.w;
      pH = size.h;
    }
    if (data.paper_orientation === "Landscape") {
      width = pH * MM_TO_PX;
      minHeight = pW * MM_TO_PX;
    } else {
      width = pW * MM_TO_PX;
      minHeight = pH * MM_TO_PX;
    }
  }
  const extraSpaceTop = parseFloat(data.print_extra_space_top) || 0;
  const marginTop = ((parseFloat(data.margin_top) || 0) + extraSpaceTop) * MM_TO_PX;
  const marginBottom = (parseFloat(data.margin_bottom) || 0) * MM_TO_PX;
  const marginLeft = (parseFloat(data.margin_left) || 0) * MM_TO_PX;
  const marginRight = (parseFloat(data.margin_right) || 0) * MM_TO_PX;
  const themeColor = data.print_theme_color || vq.indigo[600];
  let items = [];
  let calculations = {};
  if (sale) {
    const saleItems = sale.items || sale.cart || [];
    items = saleItems.map((item, idx) => {
      const qty = parseFloat(item.quantity || item.qty || 1);
      const rate = parseFloat(item.unit_price || item.price || 0);
      const grossAmt = qty * rate;
      const mrpVal = parseFloat(item.mrp || item.product?.mrp || rate || 0);
      let discountAmt = parseFloat(item.discount_amount || (item.discount_type === "fixed" ? item.discount : 0) || 0);
      let discountPercent = parseFloat(item.discount_percent || 0);
      if (discountPercent === 0) {
        if (item.discount_type === "percent") {
          discountPercent = parseFloat(item.discount || 0);
        } else if (discountAmt > 0) {
          const gross = grossAmt + discountAmt;
          discountPercent = gross > 0 ? Math.round(discountAmt / gross * 100) : 0;
        }
      }
      if (discountAmt === 0 && mrpVal > rate) {
        discountAmt = (mrpVal - rate) * qty;
        discountPercent = Math.round((mrpVal - rate) / mrpVal * 100);
      }
      const freeQty = parseFloat(item.free_quantity || item.freeQuantity || item.free_qty || 0);
      return {
        sno: idx + 1,
        name: item.product?.name || item.name || "Item",
        hsn: item.product?.hsn || item.hsn || "",
        qty,
        free_qty: freeQty,
        rate,
        mrp: mrpVal,
        gst: parseFloat(item.tax_percent || item.tax_rate || 0),
        amount: grossAmt - discountAmt,
        // item total should show amount after item-level discount
        discount_percent: discountPercent,
        discount_amount: discountAmt,
        desc: item.desc || item.description || "",
        batch: item.batch || "",
        exp: item.exp || item.expiry || "",
        mfg_date: item.mfg_date || item.batch_mfg_date || item.batch_details?.mfg_date || "",
        size: item.size || item.product?.size || "",
        model: item.model || item.product?.model || "",
        serial: item.serial || item.serial_number || (item.serial_numbers ? item.serial_numbers.map((s) => s.serial_number).join(", ") : "") || ""
      };
    });
    const itemsSubtotal = items.reduce((sum, i) => sum + i.amount, 0);
    const taxAmount = parseFloat(sale.tax || sale.tax_amount || 0);
    const discountAmount = parseFloat(sale.discount || sale.global_discount || 0);
    const deliveryCharge = parseFloat(sale.delivery_charge || sale.shipping_charges || 0);
    const extraCharge = parseFloat(sale.extra_charge_value || 0);
    const extraChargeLabel = sale.extra_charge_label || "Extra";
    const grandTotal = parseFloat(sale.total || sale.invoice_total || sale.total_amount || 0);
    let amountPaid = 0;
    if (sale.amount_paid !== void 0 && sale.amount_paid !== null) {
      amountPaid = parseFloat(sale.amount_paid);
    } else if (sale.paid_amount !== void 0 && sale.paid_amount !== null) {
      amountPaid = parseFloat(sale.paid_amount);
    } else if (sale.paid !== void 0 && sale.paid !== null) {
      amountPaid = parseFloat(sale.paid);
    } else if (sale.cash !== void 0 && sale.cash !== null) {
      amountPaid = parseFloat(sale.cash);
    }
    const totalItemDiscounts = items.reduce((sum, i) => sum + (parseFloat(i.discount_amount) || 0), 0);
    const freeItemsValue = items.reduce((sum, i) => sum + (parseFloat(i.free_qty) || 0) * (parseFloat(i.rate) || 0), 0);
    const totalSavings = discountAmount + totalItemDiscounts + freeItemsValue;
    const balanceDue = Math.max(0, grandTotal - amountPaid);
    let prevLedgerBalance = 0;
    let netLedgerBalance = 0;
    if (sale.customer_prev_balance !== void 0 && sale.customer_prev_balance !== null) {
      prevLedgerBalance = parseFloat(sale.customer_prev_balance);
      netLedgerBalance = parseFloat(sale.customer_net_balance || 0);
    } else {
      prevLedgerBalance = 0;
      netLedgerBalance = 0;
    }
    calculations = {
      subtotal: parseFloat(sale.subtotal || itemsSubtotal + totalItemDiscounts),
      // subtotal before item discounts
      qty: items.reduce((sum, i) => sum + i.qty, 0),
      gst: taxAmount,
      discount: totalSavings,
      // "You Saved" will show total savings
      invoiceDiscount: discountAmount,
      // for top-level discount line in bill
      delivery_charge: deliveryCharge,
      extra_charge_value: extraCharge,
      extra_charge_label: extraChargeLabel,
      total: grandTotal,
      paid: amountPaid,
      balance: balanceDue,
      prev_balance: prevLedgerBalance,
      net_balance: netLedgerBalance
    };
  } else {
    items = [
      { sno: 1, name: "Samsung Galaxy A54", hsn: "8517", qty: 1, free_qty: 1, freeQuantity: 1, rate: 85e3, mrp: 9e4, gst: 18, amount: 76500, discount_percent: 10, discount_amount: 8500, desc: "128GB Black", batch: "BX-902", exp: "12/26", mfg_date: "01/24", size: '6.4"', model: "SM-A546B", serial: "S/N: 9876543210" },
      { sno: 2, name: "Wireless Charger 15W", hsn: "8504", qty: 2, free_qty: 0, freeQuantity: 0, rate: 2500, mrp: 2999, gst: 12, amount: 5e3, discount_percent: 0, discount_amount: 0, desc: "Fast Charge", batch: "BX-902", exp: "12/26", mfg_date: "01/24", size: "Standard", model: "WC-15W", serial: "" },
      { sno: 3, name: "Tempered Glass Screen", hsn: "7007", qty: 1, free_qty: 0, freeQuantity: 0, rate: 350, mrp: 499, gst: 5, amount: 315, discount_percent: 10, discount_amount: 35, desc: "9H Hardness", batch: "BX-902", exp: "12/26", mfg_date: "01/24", size: '6.4"', model: "TG-A54", serial: "" }
    ];
    calculations = {
      subtotal: 90350,
      qty: 4,
      gst: 4518,
      discount: 17035,
      // 8535 + 8500 (free item value)
      invoiceDiscount: 8535,
      delivery_charge: 100,
      extra_charge_value: 50,
      extra_charge_label: "Extra Charge",
      total: 81815 + 100 + 50,
      paid: 0,
      balance: 81815 + 100 + 50,
      prev_balance: 15e3,
      net_balance: 96815 + 100 + 50
    };
  }
  let entityLabel = "Customer";
  let entityName = "John Doe";
  let showEntity = false;
  if (sale) {
    const isExpense = sale.type === "expense" || sale.category || sale.category_name;
    const isPurchase = sale.type === "purchase" || sale.supplier || sale.supplier_name || window.location.pathname.includes("purchase");
    if (isExpense) {
      entityLabel = "Category";
      entityName = sale.category?.name || sale.category_name || "Expense";
      showEntity = true;
    } else if (isPurchase) {
      entityLabel = "Supplier";
      entityName = sale.supplier?.name || sale.contact?.name || sale.supplier_name || sale.party?.name || "Supplier";
      showEntity = !!(sale.supplier || sale.contact || sale.supplier_name || sale.party);
    } else {
      entityLabel = "Customer";
      entityName = sale.customer?.name || sale.contact?.name || sale.customer_name || sale.party?.name || "Walk-in Customer";
      showEntity = !!(sale.customer || sale.contact || sale.customer_name || sale.party);
    }
  } else {
    showEntity = true;
  }
  const commonProps = { data, items, calculations, themeColor, MM_TO_PX, entityLabel, entityName, showEntity };
  if (forPrint) {
    let printWidth = width ? `${width}px` : "100%";
    if (type === "thermal") {
      if (data.thermal_page_size === "2inch") printWidth = "58mm";
      else if (data.thermal_page_size === "4inch") printWidth = "100mm";
      else printWidth = "80mm";
    } else {
      if (data.paper_size === "Custom") printWidth = "100%";
      else if (data.paper_orientation === "Landscape") printWidth = `${paperSizes[data.paper_size]?.h || 297}mm`;
      else printWidth = `${paperSizes[data.paper_size]?.w || 210}mm`;
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "bg-white text-black print-container box-border mx-auto",
        style: {
          width: printWidth,
          paddingTop: `${data.margin_top || 0}mm`,
          paddingBottom: `${data.margin_bottom || 0}mm`,
          paddingLeft: `${data.margin_left || 0}mm`,
          paddingRight: `${data.margin_right || 0}mm`
        },
        children: type === "thermal" ? /* @__PURE__ */ jsx(ThermalRenderer, { ...commonProps, sale }) : /* @__PURE__ */ jsx(RegularRenderer, { ...commonProps, sale })
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: `relative transition-all duration-300 ${mode === "dark" ? "brightness-90 contrast-125" : ""}`, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "bg-white text-slate-900 shadow-2xl mx-auto overflow-hidden flex flex-col relative transition-all duration-500",
        style: {
          width: `${width}px`,
          minHeight: `${minHeight}px`,
          paddingTop: `${marginTop}px`,
          paddingBottom: `${marginBottom}px`,
          paddingLeft: `${marginLeft}px`,
          paddingRight: `${marginRight}px`
        },
        children: type === "thermal" ? /* @__PURE__ */ jsx(ThermalRenderer, { ...commonProps, sale }) : /* @__PURE__ */ jsx(RegularRenderer, { ...commonProps, sale })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `absolute -bottom-8 left-0 w-full text-center text-2xs font-mono opacity-50 ${mode === "dark" ? "text-slate-500" : "text-slate-400"}`, children: [
      Math.round(width / MM_TO_PX),
      "mm x ",
      Math.round(minHeight / MM_TO_PX),
      "mm"
    ] })
  ] });
}
const RegularRenderer = (props) => {
  const { data } = props;
  const theme = data.print_theme || "modern";
  switch (theme) {
    case "classic":
      return /* @__PURE__ */ jsx(ThemeRegularClassic, { ...props });
    case "bold":
      return /* @__PURE__ */ jsx(ThemeRegularBold, { ...props });
    default:
      return /* @__PURE__ */ jsx(ThemeRegularModern, { ...props });
  }
};
const ThemeRegularModern = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
  const showDiscount = data.print_show_discount && items.some((i) => i.discount_percent > 0 || i.discount_amount > 0);
  const formatAmount = (amount) => formatCurrency(amount, data);
  const headerContent = /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start border-b-2 pb-6 mb-6", style: { borderColor: themeColor }, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      data.print_logo && (data.print_logo_path ? /* @__PURE__ */ jsx(
        "img",
        {
          src: data.print_logo_path,
          alt: "Logo",
          className: "w-24 h-24 object-contain mr-4"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-bold", children: "LOGO" })),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "font-extrabold text-left", style: { color: themeColor, fontSize: `${itemsHeadingSize(data.print_company_text_size)}rem` }, children: data.business_name || "Business Name" }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-600 space-y-0.5 mt-2 text-left font-sans", children: [
          /* @__PURE__ */ jsx("p", { children: data.business_address || "123 Business St, City, Country" }),
          /* @__PURE__ */ jsx("p", { children: data.business_phone || "+1 234 567 890" }),
          data.business_email && /* @__PURE__ */ jsxs("p", { children: [
            "Email: ",
            data.business_email
          ] }),
          data.tax_number && /* @__PURE__ */ jsxs("p", { children: [
            "Tax/NTN: ",
            data.tax_number
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
      /* @__PURE__ */ jsx("div", { className: "font-black text-slate-100 uppercase tracking-tighter", style: { fontSize: "2.5rem" }, children: "Invoice" }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold text-slate-600 mt-1", children: [
        "# ",
        sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`
      ] }),
      data.print_original_copy && /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold uppercase tracking-widest text-slate-400 mt-1", children: "Original Copy" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mt-1", children: [
        "Date: ",
        sale ? new Date(sale.created_at || sale.date).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString()
      ] })
    ] })
  ] });
  const billToContent = showEntity ? /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: entityLabel }),
      /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800", children: entityName }),
      sale?.contact?.address && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: sale.contact.address })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Payment Status" }),
      /* @__PURE__ */ jsx("div", { className: "inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700", children: "PAID" })
    ] })
  ] }) : null;
  const mainContent = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("table", { className: "w-full mb-auto text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-800 text-white rounded-t-lg", children: /* @__PURE__ */ jsxs("tr", { children: [
        data.print_show_sno && /* @__PURE__ */ jsx("th", { className: "p-3 text-left first:rounded-tl-lg w-12", children: "#" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 text-left", children: "Item" }),
        data.print_show_hsn && /* @__PURE__ */ jsx("th", { className: "p-3 text-left", children: "HSN" }),
        data.print_show_description && /* @__PURE__ */ jsx("th", { className: "p-3 text-left", children: "Desc" }),
        data.print_show_mrp && /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "MRP" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 text-center", children: data.print_show_free_qty && items.some((i) => i.free_qty > 0) ? "Qty + Free" : "Qty" }),
        data.print_show_units && /* @__PURE__ */ jsx("th", { className: "p-3 text-center", children: "Unit" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Rate" }),
        showDiscount && /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Disc %" }),
        data.print_tax_details && /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Tax" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 text-right last:rounded-tr-lg", children: "Total" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { style: { fontSize: `${itemsBodySize(data.print_invoice_text_size)}rem` }, children: [
        items.map((item, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 last:border-0", children: [
          data.print_show_sno && /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-500", children: item.sno }),
          /* @__PURE__ */ jsxs("td", { className: "p-3 font-medium text-left", children: [
            /* @__PURE__ */ jsx("div", { children: item.name }),
            (data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5", children: [
              data.thermal_show_batch && item.batch && /* @__PURE__ */ jsxs("span", { children: [
                "Batch: ",
                item.batch
              ] }),
              data.thermal_show_expiry && item.exp && /* @__PURE__ */ jsxs("span", { children: [
                "Exp: ",
                item.exp
              ] }),
              data.thermal_show_mfg_date && item.mfg_date && /* @__PURE__ */ jsxs("span", { children: [
                "Mfg: ",
                item.mfg_date
              ] }),
              data.thermal_show_size && item.size && /* @__PURE__ */ jsxs("span", { children: [
                "Size: ",
                item.size
              ] }),
              data.thermal_show_model && item.model && /* @__PURE__ */ jsxs("span", { children: [
                "Model: ",
                item.model
              ] }),
              data.thermal_show_serial && item.serial && /* @__PURE__ */ jsxs("span", { children: [
                "S/N: ",
                item.serial
              ] })
            ] })
          ] }),
          data.print_show_hsn && /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-500 text-left", children: item.hsn }),
          data.print_show_description && /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-500 text-xs text-left", children: item.desc }),
          data.print_show_mrp && /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-400 line-through", children: formatAmount(item.mrp || item.rate * 1.2) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-slate-600 font-bold", children: data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty }),
          data.print_show_units && /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-slate-500", children: item.unit || "pc" }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600", children: formatAmount(item.rate) }),
          showDiscount && /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-emerald-600 font-bold", children: item.discount_percent > 0 ? `${item.discount_percent}% (-${formatAmount(item.discount_amount)})` : item.discount_amount > 0 ? `-${formatAmount(item.discount_amount)}` : "-" }),
          data.print_tax_details && /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600", children: formatAmount(item.tax || 0) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold", children: formatAmount(item.amount) })
        ] }, i)),
        Array.from({ length: Math.max(0, (parseInt(data.print_min_item_rows) || 0) - items.length) }).map((_, idx) => /* @__PURE__ */ jsxs("tr", { className: "h-8 border-b border-slate-100 last:border-0 opacity-10", children: [
          data.print_show_sno && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          /* @__PURE__ */ jsx("td", { className: "p-3" }),
          data.print_show_hsn && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          data.print_show_description && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          data.print_show_mrp && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          /* @__PURE__ */ jsx("td", { className: "p-3" }),
          data.print_show_units && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          /* @__PURE__ */ jsx("td", { className: "p-3" }),
          showDiscount && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          data.print_tax_details && /* @__PURE__ */ jsx("td", { className: "p-3" }),
          /* @__PURE__ */ jsx("td", { className: "p-3" })
        ] }, `empty-${idx}`))
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-6 border-t pt-6", children: /* @__PURE__ */ jsxs("div", { className: "w-64 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "Sub Total" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.subtotal) })
      ] }),
      data.print_total_quantity && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "Total Qty" }),
        /* @__PURE__ */ jsx("span", { children: calculations.qty })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "Tax" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.gst) })
      ] }),
      calculations.invoiceDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-red-500 font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Discount" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "-",
          formatAmount(calculations.invoiceDiscount)
        ] })
      ] }),
      data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery Charges" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.delivery_charge) })
      ] }),
      data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: item.label }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(item.value) })
      ] }, idx)),
      data.print_you_saved && calculations.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-emerald-600 font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "You Saved" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.discount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-black mt-2 pt-2 border-t", style: { color: themeColor }, children: [
        /* @__PURE__ */ jsx("span", { children: "Total" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.total) })
      ] }),
      data.print_received_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-600 mt-2", children: [
        /* @__PURE__ */ jsx("span", { children: "Received" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.paid) })
      ] }),
      data.print_balance_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-red-500 font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Balance Due" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.balance) })
      ] }),
      data.print_show_previous_balance && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
          /* @__PURE__ */ jsx("span", { children: "Prev Balance" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.prev_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm font-bold border-t pt-1", style: { color: themeColor }, children: [
          /* @__PURE__ */ jsx("span", { children: "Net Balance" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
        ] })
      ] }),
      data.print_party_balance && !data.print_show_previous_balance && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "Party Balance" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-12 pt-6 border-t text-center space-y-2", children: [
      data.print_amount_words !== "0" && /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold italic text-slate-600 bg-slate-50 py-1 rounded", children: [
        '"',
        numberToWords(calculations.total, data.print_amount_words),
        '"'
      ] }),
      data.print_description !== false && data.print_description !== "0" && data.print_description !== 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: data.print_terms || "Thank you for your business!" }),
      /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-400 font-medium pt-2", children: [
        "Powered by",
        " ",
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://venqore.com?utm_source=invoice_footer",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-indigo-600 font-bold hover:underline",
            children: "VenQore"
          }
        )
      ] }),
      (data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end text-xs mt-6 pt-4 border-t border-dashed border-slate-200", children: [
        data.print_payment_mode && /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-500", children: "Payment Mode: " }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: sale ? (sale.payment_method || "Cash").toUpperCase() : "CASH" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-6 ml-auto font-bold", children: [
          data.print_received_by && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-28 border-b border-slate-300 h-6" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-500 mt-1", children: "Received By" })
          ] }),
          data.print_delivered_by && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-28 border-b border-slate-300 h-6" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-500 mt-1", children: "Delivered By" })
          ] }),
          data.print_acknowledgement && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-36 border-b border-slate-300 h-6" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-500 mt-1", children: "Customer Acknowledgement" })
          ] })
        ] })
      ] }),
      data.print_signature_text && /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10" }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 w-32" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-slate-500 mt-1", children: data.print_signature_text })
      ] }) })
    ] })
  ] });
  if (data.print_header_all_pages) {
    return /* @__PURE__ */ jsxs("table", { className: "w-full h-full font-sans print-layout-master-table", style: { borderCollapse: "collapse", border: "none" }, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { style: { border: "none", padding: 0 }, children: [
        headerContent,
        billToContent
      ] }) }) }),
      /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { border: "none", padding: 0, verticalAlign: "top" }, children: mainContent }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "font-sans h-full flex flex-col", children: [
    headerContent,
    billToContent,
    mainContent
  ] });
};
const itemsHeadingSize = (val) => {
  const map = { "2": 1.25, "3": 1.5, "4": 1.875, "5": 2.25 };
  return map[val] || 1.875;
};
const itemsBodySize = (val) => {
  const map = { "1": 0.75, "2": 0.875, "3": 1, "4": 1.125 };
  return map[val] || 0.875;
};
const ThemeRegularClassic = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
  const formatAmount = (amount) => formatCurrency(amount, data);
  const headerContent = /* @__PURE__ */ jsxs("div", { className: "text-center mb-8 border-b-4 double border-slate-800 pb-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold uppercase tracking-widest mb-2", children: data.business_name }),
    /* @__PURE__ */ jsx("p", { className: "text-sm italic", children: data.business_address }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs", children: [
      data.business_phone,
      data.business_email && ` | Email: ${data.business_email}`,
      data.tax_number && ` | Tax/NTN: ${data.tax_number}`
    ] })
  ] });
  const billToContent = /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-6 border p-4 text-left", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("strong", { children: [
        entityLabel.toUpperCase(),
        ":"
      ] }),
      /* @__PURE__ */ jsx("p", { children: entityName }),
      sale?.contact?.address && /* @__PURE__ */ jsx("p", { children: sale.contact.address })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("strong", { children: "INVOICE #:" }),
        " ",
        sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}005`
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("strong", { children: "DATE:" }),
        " ",
        sale ? new Date(sale.created_at || sale.date).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString()
      ] })
    ] })
  ] });
  const mainContent = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-slate-800 mb-6", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-100", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-slate-800 p-2 text-left", children: "DESCRIPTION" }),
        /* @__PURE__ */ jsx("th", { className: "border border-slate-800 p-2 text-center", children: data.print_show_free_qty && items.some((i) => i.free_qty > 0) ? "QTY + FREE" : "QTY" }),
        /* @__PURE__ */ jsx("th", { className: "border border-slate-800 p-2 text-right", children: "UNIT PRICE" }),
        /* @__PURE__ */ jsx("th", { className: "border border-slate-800 p-2 text-right", children: "AMOUNT" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        items.map((item, i) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "border border-slate-800 p-2 text-left", children: [
            /* @__PURE__ */ jsx("div", { children: item.name }),
            (data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-500 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5", children: [
              data.thermal_show_batch && item.batch && /* @__PURE__ */ jsxs("span", { children: [
                "Batch: ",
                item.batch
              ] }),
              data.thermal_show_expiry && item.exp && /* @__PURE__ */ jsxs("span", { children: [
                "Exp: ",
                item.exp
              ] }),
              data.thermal_show_mfg_date && item.mfg_date && /* @__PURE__ */ jsxs("span", { children: [
                "Mfg: ",
                item.mfg_date
              ] }),
              data.thermal_show_size && item.size && /* @__PURE__ */ jsxs("span", { children: [
                "Size: ",
                item.size
              ] }),
              data.thermal_show_model && item.model && /* @__PURE__ */ jsxs("span", { children: [
                "Model: ",
                item.model
              ] }),
              data.thermal_show_serial && item.serial && /* @__PURE__ */ jsxs("span", { children: [
                "S/N: ",
                item.serial
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 text-center", children: data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 text-right", children: formatAmount(item.rate) }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 text-right", children: formatAmount(item.amount) })
        ] }, i)),
        Array.from({ length: Math.max(0, (parseInt(data.print_min_item_rows) || 0) - items.length) }).map((_, idx) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 h-8" }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 text-center h-8" }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 text-right h-8" }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-800 p-2 text-right h-8" })
        ] }, `empty-${idx}`))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-1/2 text-left space-y-2", children: [
        data.print_amount_words !== "0" && /* @__PURE__ */ jsxs("div", { className: "text-xs italic font-bold", children: [
          '"',
          numberToWords(calculations.total, data.print_amount_words),
          '"'
        ] }),
        data.print_description !== false && data.print_description !== "0" && data.print_description !== 0 && /* @__PURE__ */ jsx("div", { className: "text-xs italic whitespace-pre-wrap", children: data.print_terms || "Thank you for your business!" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-1/2 ml-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
          /* @__PURE__ */ jsx("span", { children: "SUBTOTAL:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.subtotal) })
        ] }),
        calculations.invoiceDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1 text-red-600 font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "DISCOUNT:" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "-",
            formatAmount(calculations.invoiceDiscount)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
          /* @__PURE__ */ jsx("span", { children: "TAX:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.gst) })
        ] }),
        data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
          /* @__PURE__ */ jsx("span", { children: "DELIVERY:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.delivery_charge) })
        ] }),
        data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            String(item.label || "EXTRA").toUpperCase(),
            ":"
          ] }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(item.value) })
        ] }, idx)),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-xl py-2", children: [
          /* @__PURE__ */ jsx("span", { children: "TOTAL:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.total) })
        ] }),
        data.print_received_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
          /* @__PURE__ */ jsx("span", { children: "RECEIVED:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.paid) })
        ] }),
        data.print_balance_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1 font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "BALANCE DUE:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.balance) })
        ] }),
        data.print_show_previous_balance && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
            /* @__PURE__ */ jsx("span", { children: "PREV BALANCE:" }),
            /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.prev_balance) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold py-1", children: [
            /* @__PURE__ */ jsx("span", { children: "NET BALANCE:" }),
            /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
          ] })
        ] }),
        data.print_party_balance && !data.print_show_previous_balance && /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-slate-800 py-1", children: [
          /* @__PURE__ */ jsx("span", { children: "PARTY BALANCE:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
        ] })
      ] })
    ] }),
    (data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end text-xs mt-8 pt-4 border-t border-dashed border-slate-800", children: [
      data.print_payment_mode && /* @__PURE__ */ jsxs("div", { className: "text-left font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Payment Mode: " }),
        /* @__PURE__ */ jsx("span", { children: sale ? (sale.payment_method || "Cash").toUpperCase() : "CASH" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-6 ml-auto font-bold", children: [
        data.print_received_by && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-28 border-b border-slate-800 h-6" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: "Received By" })
        ] }),
        data.print_delivered_by && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-28 border-b border-slate-800 h-6" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: "Delivered By" })
        ] }),
        data.print_acknowledgement && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-36 border-b border-slate-800 h-6" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: "Customer Acknowledgement" })
        ] })
      ] })
    ] }),
    data.print_signature_text && /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center font-bold", children: [
      /* @__PURE__ */ jsx("div", { className: "h-10" }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-slate-800 w-32" }),
      /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: data.print_signature_text })
    ] }) })
  ] });
  if (data.print_header_all_pages) {
    return /* @__PURE__ */ jsxs("table", { className: "w-full h-full font-serif print-layout-master-table", style: { borderCollapse: "collapse", border: "none" }, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { style: { border: "none", padding: 0 }, children: [
        headerContent,
        billToContent
      ] }) }) }),
      /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { border: "none", padding: 0, verticalAlign: "top" }, children: mainContent }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "font-serif h-full flex flex-col text-slate-900", children: [
    headerContent,
    billToContent,
    mainContent,
    /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-400 font-medium pt-2 text-center mt-auto", children: [
      "Powered by",
      " ",
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://venqore.com?utm_source=invoice_footer",
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: "#4f46e5", fontWeight: "bold" },
          children: "VenQore"
        }
      )
    ] })
  ] });
};
const ThemeRegularBold = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
  const formatAmount = (amount) => formatCurrency(amount, data);
  const headerContent = /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 text-white p-8 -mx-8 -mt-8 mb-8 flex justify-between items-center text-left", style: { backgroundColor: themeColor }, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black", children: data.business_name }),
      /* @__PURE__ */ jsx("p", { className: "opacity-80 mt-1", children: "INVOICE" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-right opacity-80 text-sm", children: [
      /* @__PURE__ */ jsx("p", { children: data.business_phone }),
      /* @__PURE__ */ jsx("p", { children: data.business_address }),
      data.business_email && /* @__PURE__ */ jsx("p", { children: data.business_email }),
      data.tax_number && /* @__PURE__ */ jsxs("p", { children: [
        "Tax/NTN: ",
        data.tax_number
      ] })
    ] })
  ] });
  const billToContent = /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-8 mb-10 text-left", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-400 uppercase text-xs mb-2", children: entityLabel }),
      /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-slate-800", children: entityName })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-400 uppercase text-xs mb-2", children: "Invoice Info" }),
      /* @__PURE__ */ jsx("p", { className: "font-mono", children: sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}-1001` }),
      /* @__PURE__ */ jsx("p", { className: "font-mono text-slate-500", children: sale ? new Date(sale.created_at || sale.date).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString() })
    ] })
  ] });
  const mainContent = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("table", { className: "w-full mb-8", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b-2 border-slate-900", children: [
        /* @__PURE__ */ jsx("th", { className: "text-left py-3 font-black text-slate-900 uppercase text-xs", children: "Item Description" }),
        /* @__PURE__ */ jsx("th", { className: "text-right py-3 font-black text-slate-900 uppercase text-xs", children: "Total" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        items.map((item, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100", children: [
          /* @__PURE__ */ jsxs("td", { className: "py-4 text-left", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold", children: item.name }),
            (data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-500 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5", children: [
              data.thermal_show_batch && item.batch && /* @__PURE__ */ jsxs("span", { children: [
                "Batch: ",
                item.batch
              ] }),
              data.thermal_show_expiry && item.exp && /* @__PURE__ */ jsxs("span", { children: [
                "Exp: ",
                item.exp
              ] }),
              data.thermal_show_mfg_date && item.mfg_date && /* @__PURE__ */ jsxs("span", { children: [
                "Mfg: ",
                item.mfg_date
              ] }),
              data.thermal_show_size && item.size && /* @__PURE__ */ jsxs("span", { children: [
                "Size: ",
                item.size
              ] }),
              data.thermal_show_model && item.model && /* @__PURE__ */ jsxs("span", { children: [
                "Model: ",
                item.model
              ] }),
              data.thermal_show_serial && item.serial && /* @__PURE__ */ jsxs("span", { children: [
                "S/N: ",
                item.serial
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500", children: [
              item.qty,
              " x ",
              formatAmount(item.rate)
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-4 text-right font-bold", children: formatAmount(item.amount) })
        ] }, i)),
        Array.from({ length: Math.max(0, (parseInt(data.print_min_item_rows) || 0) - items.length) }).map((_, idx) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 h-12", children: [
          /* @__PURE__ */ jsx("td", { className: "py-4" }),
          /* @__PURE__ */ jsx("td", { className: "py-4 text-right" })
        ] }, `empty-${idx}`))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-1/2 text-left space-y-2", children: [
        data.print_amount_words !== "0" && /* @__PURE__ */ jsxs("div", { className: "text-xs italic font-bold", children: [
          '"',
          numberToWords(calculations.total, data.print_amount_words),
          '"'
        ] }),
        data.print_description !== false && data.print_description !== "0" && data.print_description !== 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: data.print_terms || "Thank you for your business!" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-1/2 ml-auto text-sm space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Subtotal:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.subtotal) })
        ] }),
        calculations.invoiceDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-red-600 font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "Discount:" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "-",
            formatAmount(calculations.invoiceDiscount)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Tax Amount:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.gst) })
        ] }),
        data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Delivery:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.delivery_charge) })
        ] }),
        data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            item.label,
            ":"
          ] }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(item.value) })
        ] }, idx)),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-base border-t border-slate-900 pt-1", children: [
          /* @__PURE__ */ jsx("span", { children: "TOTAL DUE:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.total) })
        ] }),
        data.print_received_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Received:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.paid) })
        ] }),
        data.print_balance_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "Balance Due:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.balance) })
        ] }),
        data.print_show_previous_balance && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Prev Balance:" }),
            /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.prev_balance) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold border-t border-slate-900 pt-1", children: [
            /* @__PURE__ */ jsx("span", { children: "Net Balance:" }),
            /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
          ] })
        ] }),
        data.print_party_balance && !data.print_show_previous_balance && /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "Party Balance:" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
        ] })
      ] })
    ] }),
    (data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end text-xs mt-8 pt-4 border-t-2 border-slate-900", children: [
      data.print_payment_mode && /* @__PURE__ */ jsxs("div", { className: "text-left font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Payment Mode: " }),
        /* @__PURE__ */ jsx("span", { children: sale ? (sale.payment_method || "Cash").toUpperCase() : "CASH" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-6 ml-auto font-bold", children: [
        data.print_received_by && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-28 border-b-2 border-slate-900 h-6" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: "Received By" })
        ] }),
        data.print_delivered_by && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-28 border-b-2 border-slate-900 h-6" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: "Delivered By" })
        ] }),
        data.print_acknowledgement && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-36 border-b-2 border-slate-900 h-6" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: "Customer Acknowledgement" })
        ] })
      ] })
    ] }),
    data.print_signature_text && /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center font-bold", children: [
      /* @__PURE__ */ jsx("div", { className: "h-10" }),
      /* @__PURE__ */ jsx("div", { className: "border-t-2 border-slate-900 w-32" }),
      /* @__PURE__ */ jsx("div", { className: "text-2xs mt-1", children: data.print_signature_text })
    ] }) })
  ] });
  if (data.print_header_all_pages) {
    return /* @__PURE__ */ jsxs("table", { className: "w-full h-full font-sans print-layout-master-table", style: { borderCollapse: "collapse", border: "none" }, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { style: { border: "none", padding: 0 }, children: [
        headerContent,
        billToContent
      ] }) }) }),
      /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { border: "none", padding: 0, verticalAlign: "top" }, children: mainContent }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "font-sans h-full flex flex-col", children: [
    headerContent,
    billToContent,
    mainContent,
    /* @__PURE__ */ jsxs("div", { className: "text-2xs text-slate-400 font-medium pt-2 text-center mt-auto", children: [
      "Powered by",
      " ",
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://venqore.com?utm_source=invoice_footer",
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: "#4f46e5", fontWeight: "bold" },
          children: "VenQore"
        }
      )
    ] })
  ] });
};
const ThermalRenderer = (props) => {
  const { data } = props;
  const theme = data.print_theme || "modern";
  switch (theme) {
    case "classic":
      return /* @__PURE__ */ jsx(ThemeThermalClassic, { ...props });
    case "bold":
      return /* @__PURE__ */ jsx(ThemeThermalBold, { ...props });
    default:
      return /* @__PURE__ */ jsx(ThemeThermalModern, { ...props });
  }
};
const ThemeThermalModern = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
  const fontSize = (data.thermal_font_size || 12) + "px";
  const fontWeight = data.thermal_use_bold ? "bold" : "normal";
  const formatAmount = (amount) => {
    return formatCurrency(amount, data);
  };
  const getAmountInWords = (amount) => {
    if (data.print_amount_words === "0") return null;
    return numberToWords(amount, data.print_amount_words);
  };
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-black", style: { fontSize, fontWeight }, children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
      data.print_logo && data.print_logo_path && /* @__PURE__ */ jsx(
        "img",
        {
          src: data.print_logo_path,
          alt: "Logo",
          className: "w-16 h-16 object-contain mx-auto mb-2 grayscale"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "font-black text-lg mb-1 leading-tight", children: data.business_name }),
      /* @__PURE__ */ jsx("div", { className: "text-[0.85em]", children: data.business_address }),
      data.business_phone && /* @__PURE__ */ jsxs("div", { className: "text-[0.85em]", children: [
        "Tel: ",
        data.business_phone
      ] }),
      data.business_email && /* @__PURE__ */ jsxs("div", { className: "text-[0.85em]", children: [
        "Email: ",
        data.business_email
      ] }),
      data.tax_number && /* @__PURE__ */ jsxs("div", { className: "text-[0.85em]", children: [
        "Tax/NTN: ",
        data.tax_number
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-y border-dashed border-black py-2 mb-3 text-[0.85em]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-left", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "Date: ",
            (/* @__PURE__ */ new Date()).toLocaleDateString()
          ] }),
          /* @__PURE__ */ jsx("span", { children: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-right", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "# ",
            sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Cashier: ",
            sale?.user?.name || "Admin"
          ] })
        ] })
      ] }),
      showEntity && /* @__PURE__ */ jsxs("div", { className: "border-t border-dashed border-black mt-1 pt-1 font-bold text-center", children: [
        entityLabel,
        ": ",
        entityName
      ] })
    ] }),
    data.thermal_show_headers && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.8em] font-black border-b-2 border-black pb-1 mb-2 uppercase tracking-tight", children: [
      /* @__PURE__ */ jsx("span", { className: "flex-1", children: "Item" }),
      /* @__PURE__ */ jsx("span", { className: "text-right w-20", children: data.print_show_free_qty && items.some((i) => i.free_qty > 0) ? "Qty+Free" : "Qty" }),
      /* @__PURE__ */ jsx("span", { className: "text-right w-24", children: "Amt" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 mb-4", children: items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col border-b border-black pb-2 last:border-0 last:pb-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 pr-1", children: /* @__PURE__ */ jsxs("span", { className: data.thermal_use_bold ? "font-black" : "font-bold", children: [
          data.thermal_show_sno ? `${item.sno}. ` : "",
          item.name
        ] }) }),
        data.thermal_show_headers ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 text-right font-bold text-[0.9em]", children: data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty }),
          /* @__PURE__ */ jsx("div", { className: "w-24 text-right font-bold whitespace-nowrap", children: formatAmount(item.amount) })
        ] }) : /* @__PURE__ */ jsx("div", { className: "font-bold whitespace-nowrap", children: formatAmount(item.amount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-3 text-[0.85em] mt-0.5", children: [
        !data.thermal_show_headers && /* @__PURE__ */ jsxs("span", { children: [
          data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty,
          " ",
          data.thermal_show_units ? "pc" : "",
          " x ",
          formatAmount(item.rate)
        ] }),
        data.print_show_discount && (item.discount_percent > 0 || item.discount_amount > 0) && /* @__PURE__ */ jsx("span", { className: "font-bold", children: item.discount_percent > 0 ? `(-${item.discount_percent}% = ${formatAmount(item.discount_amount)})` : `(-${formatAmount(item.discount_amount)})` }),
        data.thermal_show_mrp && item.mrp > 0 && /* @__PURE__ */ jsxs("span", { className: "line-through decoration-black", children: [
          "MRP: ",
          formatAmount(item.mrp)
        ] })
      ] }),
      data.thermal_show_description && item.desc && /* @__PURE__ */ jsx("div", { className: "text-[0.8em] italic mt-0.5", children: item.desc }),
      (data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && /* @__PURE__ */ jsxs("div", { className: "text-[0.75em] font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5", children: [
        data.thermal_show_batch && item.batch && /* @__PURE__ */ jsxs("span", { children: [
          "Batch: ",
          item.batch,
          " "
        ] }),
        data.thermal_show_expiry && item.exp && /* @__PURE__ */ jsxs("span", { children: [
          "Exp: ",
          item.exp
        ] }),
        data.thermal_show_mfg_date && item.mfg_date && /* @__PURE__ */ jsxs("span", { children: [
          "Mfg: ",
          item.mfg_date
        ] }),
        data.thermal_show_size && item.size && /* @__PURE__ */ jsxs("span", { children: [
          "Size: ",
          item.size
        ] }),
        data.thermal_show_model && item.model && /* @__PURE__ */ jsxs("span", { children: [
          "Model: ",
          item.model
        ] }),
        data.thermal_show_serial && item.serial && /* @__PURE__ */ jsxs("span", { children: [
          "S/N: ",
          item.serial
        ] })
      ] })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "p-2 rounded mb-4 border border-black", style: { fontSize: "1.1em" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.9em] mb-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.subtotal) })
      ] }),
      data.print_total_quantity && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.9em] mb-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Total Qty" }),
        /* @__PURE__ */ jsx("span", { children: calculations.qty })
      ] }),
      data.print_tax_details && calculations.gst > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.9em] mb-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Tax Amount" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.gst) })
      ] }),
      calculations.invoiceDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.9em] mb-1 text-red-600 font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Discount" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "-",
          formatAmount(calculations.invoiceDiscount)
        ] })
      ] }),
      data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.9em] mb-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery Charges" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.delivery_charge) })
      ] }),
      data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.9em] mb-1", children: [
        /* @__PURE__ */ jsx("span", { children: item.label }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(item.value) })
      ] }, idx)),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-black mt-2 pt-2 border-t border-black", children: [
        /* @__PURE__ */ jsx("span", { children: "TOTAL" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.total) })
      ] }),
      data.print_received_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.8em] mt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Received" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.paid) })
      ] }),
      data.print_balance_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.8em] font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Balance Due" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.balance) })
      ] }),
      data.print_show_previous_balance && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.8em] text-slate-500", children: [
          /* @__PURE__ */ jsx("span", { children: "Prev Balance" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.prev_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.85em] font-black border-t border-dashed border-black pt-1", children: [
          /* @__PURE__ */ jsx("span", { children: "Net Balance" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
        ] })
      ] }),
      data.print_party_balance && !data.print_show_previous_balance && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[0.8em] text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "Party Balance" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
      ] }),
      data.print_you_saved && calculations.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[1em] mt-2 pt-2 border-t border-dashed border-black font-black", children: [
        /* @__PURE__ */ jsx("span", { children: "You Saved" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.discount) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center space-y-3", children: [
      data.print_amount_words !== "0" && /* @__PURE__ */ jsxs("div", { className: "text-[0.8em] font-bold italic border-b border-black pb-2", children: [
        '"',
        getAmountInWords(calculations.total),
        '"'
      ] }),
      data.print_description !== false && data.print_description !== "0" && data.print_description !== 0 && /* @__PURE__ */ jsxs("div", { className: "text-[0.85em] italic whitespace-pre-wrap leading-tight opacity-90", children: [
        data.print_terms || "",
        data.thermal_custom_footer && /* @__PURE__ */ jsx("div", { className: "mt-2 font-bold", children: data.thermal_custom_footer }),
        !data.print_terms && !data.thermal_custom_footer && "*** THANK YOU ***\nSee you again!"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-[0.75em] opacity-60 mt-2", children: [
        "Powered by",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://venqore.com?utm_source=invoice_footer", target: "_blank", rel: "noopener noreferrer", style: { color: "#4f46e5", fontWeight: "bold" }, children: "VenQore" })
      ] }),
      (data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-[0.85em] gap-1 border-t border-dashed border-black pt-2 mt-2", children: [
        data.print_payment_mode && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Payment: " }),
          /* @__PURE__ */ jsx("span", { children: sale ? (sale.payment_method || "Cash").toUpperCase() : "CASH" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 w-full mt-1", children: [
          data.print_received_by && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Received By:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] }),
          data.print_delivered_by && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Delivered By:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] }),
          data.print_acknowledgement && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Customer Sign:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] })
        ] })
      ] }),
      data.print_signature_text && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mt-4 pt-4", children: [
        /* @__PURE__ */ jsx("div", { className: "border-t border-black w-32 mb-1" }),
        /* @__PURE__ */ jsx("div", { className: "text-[0.75em] font-bold", children: data.print_signature_text })
      ] }),
      (data.thermal_show_barcode === true || data.thermal_show_barcode === 1 || data.thermal_show_barcode !== false && data.thermal_show_barcode !== "0" && data.thermal_show_barcode !== 0) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mt-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-2/3 mx-auto", style: {
          backgroundImage: `repeating-linear-gradient(90deg, 
                                #000 0px, #000 2px, 
                                transparent 2px, transparent 4px,
                                #000 4px, #000 8px,
                                transparent 8px, transparent 10px)`
        } }),
        /* @__PURE__ */ jsxs("div", { className: "text-[0.6em] font-mono mt-1 tracking-widest opacity-70", children: [
          "*",
          sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`,
          "*"
        ] })
      ] }),
      parseInt(data.thermal_extra_lines ?? data.print_feed_lines) > 0 && /* @__PURE__ */ jsx("div", { style: { height: parseInt(data.thermal_extra_lines ?? data.print_feed_lines) * 12 + "px" } })
    ] })
  ] });
};
const ThemeThermalClassic = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
  const formatAmount = (amount) => {
    return formatCurrency(amount, data);
  };
  const getAmountInWords = (amount) => {
    if (data.print_amount_words === "0") return null;
    return numberToWords(amount, data.print_amount_words);
  };
  return /* @__PURE__ */ jsxs("div", { className: "font-mono text-xs text-black", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-3 border-b-2 border-black border-dashed pb-2", children: [
      data.print_logo && data.print_logo_path && /* @__PURE__ */ jsx(
        "img",
        {
          src: data.print_logo_path,
          alt: "Logo",
          className: "w-12 h-12 object-contain mx-auto mb-2 grayscale"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "font-bold text-lg uppercase", children: data.business_name }),
      /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap", children: data.business_address }),
      data.business_phone && /* @__PURE__ */ jsxs("div", { children: [
        "Tel: ",
        data.business_phone
      ] }),
      data.business_email && /* @__PURE__ */ jsxs("div", { children: [
        "Email: ",
        data.business_email
      ] }),
      data.tax_number && /* @__PURE__ */ jsxs("div", { children: [
        "Tax/NTN: ",
        data.tax_number
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-2 pb-2 border-b border-black border-dashed", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "DT: ",
          sale ? new Date(sale.created_at || sale.date).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString()
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "TM: ",
          sale ? new Date(sale.created_at || sale.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "# ",
          sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "OP: ",
          sale?.user?.name || "Admin"
        ] })
      ] }),
      showEntity && /* @__PURE__ */ jsxs("div", { className: "mt-1 text-center font-bold uppercase", children: [
        entityLabel.substr(0, 4),
        ": ",
        entityName
      ] })
    ] }),
    data.thermal_show_headers && /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold border-b border-black border-dashed pb-1 mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "flex-1", children: "ITEM" }),
      /* @__PURE__ */ jsx("span", { className: "text-right w-16", children: data.print_show_free_qty && items.some((i) => i.free_qty > 0) ? "QTY+FREE" : "QTY" }),
      /* @__PURE__ */ jsx("span", { className: "text-right w-20", children: "AMT" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-2", children: items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 pr-1 font-bold", children: [
          data.thermal_show_sno ? `${item.sno}. ` : "",
          item.name.toUpperCase()
        ] }),
        data.thermal_show_headers ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 text-right", children: item.qty }),
          /* @__PURE__ */ jsx("div", { className: "w-20 text-right", children: formatAmount(item.amount) })
        ] }) : /* @__PURE__ */ jsx("div", { children: formatAmount(item.amount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-2 text-[0.9em]", children: [
        !data.thermal_show_headers && /* @__PURE__ */ jsxs("span", { children: [
          data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty,
          " ",
          data.thermal_show_units ? "pc" : "",
          " x ",
          formatAmount(item.rate)
        ] }),
        data.print_show_discount && (item.discount_percent > 0 || item.discount_amount > 0) && /* @__PURE__ */ jsx("span", { children: item.discount_percent > 0 ? `(Disc: -${item.discount_percent}% = ${formatAmount(item.discount_amount)})` : `(Disc: -${formatAmount(item.discount_amount)})` })
      ] }),
      data.thermal_show_mrp && item.mrp > 0 && /* @__PURE__ */ jsxs("div", { className: "line-through", children: [
        "MRP: ",
        formatAmount(item.mrp)
      ] }),
      data.thermal_show_description && item.desc && /* @__PURE__ */ jsx("div", { className: "italic", children: item.desc }),
      (data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && /* @__PURE__ */ jsxs("div", { className: "text-[0.9em]", children: [
        data.thermal_show_batch && item.batch && /* @__PURE__ */ jsxs("span", { children: [
          "BATCH: ",
          item.batch,
          " "
        ] }),
        data.thermal_show_expiry && item.exp && /* @__PURE__ */ jsxs("span", { children: [
          "EXP: ",
          item.exp,
          " "
        ] }),
        data.thermal_show_mfg_date && item.mfg_date && /* @__PURE__ */ jsxs("span", { children: [
          "MFG: ",
          item.mfg_date,
          " "
        ] }),
        data.thermal_show_size && item.size && /* @__PURE__ */ jsxs("span", { children: [
          "SIZE: ",
          item.size,
          " "
        ] }),
        data.thermal_show_model && item.model && /* @__PURE__ */ jsxs("span", { children: [
          "MODEL: ",
          item.model,
          " "
        ] }),
        data.thermal_show_serial && item.serial && /* @__PURE__ */ jsxs("span", { children: [
          "S/N: ",
          item.serial
        ] })
      ] })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t-2 border-black border-dashed pt-2 mb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "SUBTOTAL" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.subtotal) })
      ] }),
      data.print_total_quantity && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "TTL QTY" }),
        /* @__PURE__ */ jsx("span", { children: calculations.qty })
      ] }),
      data.print_tax_details && calculations.gst > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "TAX" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.gst) })
      ] }),
      calculations.invoiceDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-red-600 font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "DISCOUNT" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "-",
          formatAmount(calculations.invoiceDiscount)
        ] })
      ] }),
      data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "DELIVERY" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.delivery_charge) })
      ] }),
      data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: String(item.label || "EXTRA").toUpperCase() }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(item.value) })
      ] }, idx)),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black border-dashed", children: [
        /* @__PURE__ */ jsx("span", { children: "NET TOTAL" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.total) })
      ] }),
      data.print_received_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "PAID" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.paid) })
      ] }),
      data.print_balance_amount && /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "BALANCE DUE" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.balance) })
      ] }),
      data.print_show_previous_balance && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
          /* @__PURE__ */ jsx("span", { children: "PREV BALANCE" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.prev_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold border-t border-black border-dashed pt-1", children: [
          /* @__PURE__ */ jsx("span", { children: "NET BALANCE" }),
          /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
        ] })
      ] }),
      data.print_party_balance && !data.print_show_previous_balance && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
        /* @__PURE__ */ jsx("span", { children: "PARTY BALANCE" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.net_balance) })
      ] }),
      data.print_you_saved && calculations.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1 pt-1 border-t border-black border-dashed font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "YOU SAVED" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.discount) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      data.print_amount_words !== "0" && /* @__PURE__ */ jsx("div", { className: "mb-2 italic uppercase border-b border-black border-dashed pb-1", children: getAmountInWords(calculations.total) }),
      data.print_description !== false && data.print_description !== "0" && data.print_description !== 0 && /* @__PURE__ */ jsxs("div", { className: "whitespace-pre-wrap mb-2", children: [
        data.print_terms || "",
        data.thermal_custom_footer && /* @__PURE__ */ jsx("div", { className: "mt-1 font-bold", children: data.thermal_custom_footer }),
        !data.print_terms && !data.thermal_custom_footer && "*** THANK YOU ***"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-[0.75em] opacity-60 mt-1", children: [
        "Powered by",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://venqore.com?utm_source=invoice_footer", target: "_blank", rel: "noopener noreferrer", style: { color: "#4f46e5", fontWeight: "bold" }, children: "VenQore" })
      ] }),
      (data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-[0.9em] gap-1 border-t border-black border-dashed pt-2 mt-2", children: [
        data.print_payment_mode && /* @__PURE__ */ jsxs("div", { className: "font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "PAYMENT: " }),
          /* @__PURE__ */ jsx("span", { children: sale ? (sale.payment_method || "Cash").toUpperCase() : "CASH" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 w-full mt-1", children: [
          data.print_received_by && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "RECEIVED BY:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] }),
          data.print_delivered_by && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "DELIVERED BY:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] }),
          data.print_acknowledgement && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "CUST SIGN:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] })
        ] })
      ] }),
      data.print_signature_text && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4", children: [
        /* @__PURE__ */ jsx("div", { className: "border-t border-black w-32 mx-auto mb-1" }),
        /* @__PURE__ */ jsx("div", { children: data.print_signature_text })
      ] }),
      (data.thermal_show_barcode === true || data.thermal_show_barcode === 1 || data.thermal_show_barcode !== false && data.thermal_show_barcode !== "0" && data.thermal_show_barcode !== 0) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mt-2", children: [
        /* @__PURE__ */ jsx("div", { className: "mt-2 h-8 w-2/3 mx-auto opacity-70", style: {
          backgroundImage: `repeating-linear-gradient(90deg, 
                                #000 0px, #000 1px, 
                                transparent 1px, transparent 2px,
                                #000 2px, #000 4px,
                                transparent 4px, transparent 5px)`
        } }),
        /* @__PURE__ */ jsxs("div", { className: "text-[0.6em] font-mono mt-1 tracking-widest opacity-50 uppercase", children: [
          "*",
          sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`,
          "*"
        ] })
      ] }),
      parseInt(data.thermal_extra_lines ?? data.print_feed_lines) > 0 && /* @__PURE__ */ jsx("div", { style: { height: parseInt(data.thermal_extra_lines ?? data.print_feed_lines) * 12 + "px" } })
    ] })
  ] });
};
const ThemeThermalBold = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
  const formatAmount = (amount) => {
    return formatCurrency(amount, data);
  };
  const getAmountInWords = (amount) => {
    if (data.print_amount_words === "0") return null;
    return numberToWords(amount, data.print_amount_words);
  };
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-sm font-bold border-2 border-black p-1 text-black", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-black text-white p-3 text-center mb-4", children: [
      data.print_logo && data.print_logo_path && /* @__PURE__ */ jsx(
        "img",
        {
          src: data.print_logo_path,
          alt: "Logo",
          className: "w-12 h-12 object-contain mx-auto mb-2 invert brightness-200"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-xl uppercase tracking-wider", children: data.business_name }),
      /* @__PURE__ */ jsx("div", { className: "text-xs font-normal opacity-90", children: data.business_address }),
      data.business_phone && /* @__PURE__ */ jsx("div", { className: "text-xs font-normal opacity-90", children: data.business_phone }),
      data.business_email && /* @__PURE__ */ jsx("div", { className: "text-xs font-normal opacity-90", children: data.business_email }),
      data.tax_number && /* @__PURE__ */ jsxs("div", { className: "text-xs font-normal opacity-90", children: [
        "Tax/NTN: ",
        data.tax_number
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs mb-4 px-1 border-b-4 border-black pb-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "DATE: ",
          sale ? new Date(sale.created_at || sale.date).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString()
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "BILL #: ",
          sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "TIME: ",
          sale ? new Date(sale.created_at || sale.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        ] }),
        showEntity && /* @__PURE__ */ jsxs("div", { children: [
          entityLabel.substr(0, 4).toUpperCase(),
          ": ",
          entityName.toUpperCase()
        ] })
      ] })
    ] }),
    data.thermal_show_headers && /* @__PURE__ */ jsxs("div", { className: "flex justify-between bg-black text-white p-1 mb-2 text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "flex-1 pl-1", children: "ITEM Description" }),
      /* @__PURE__ */ jsx("span", { className: "text-center w-16", children: data.print_show_free_qty && items.some((i) => i.free_qty > 0) ? "QTY+FREE" : "QTY" }),
      /* @__PURE__ */ jsx("span", { className: "text-right w-24 pr-1", children: "AMOUNT" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 mb-6 px-1", children: items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "border-b-2 border-black pb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 pr-1 text-base", children: [
          data.thermal_show_sno ? `${item.sno}. ` : "",
          item.name
        ] }),
        data.thermal_show_headers ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 text-center text-sm", children: item.qty }),
          /* @__PURE__ */ jsx("div", { className: "w-24 text-right text-base", children: formatAmount(item.amount) })
        ] }) : /* @__PURE__ */ jsx("div", { className: "text-base", children: formatAmount(item.amount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-3 text-xs mt-1", children: [
        !data.thermal_show_headers ? /* @__PURE__ */ jsxs("span", { children: [
          item.qty,
          " ",
          data.thermal_show_units ? "pc" : "",
          " x ",
          formatAmount(item.rate)
        ] }) : /* @__PURE__ */ jsxs("span", { children: [
          "Rate: ",
          formatAmount(item.rate)
        ] }),
        data.thermal_show_mrp && item.mrp > 0 && /* @__PURE__ */ jsxs("span", { className: "line-through", children: [
          "MRP: ",
          formatAmount(item.mrp)
        ] }),
        data.print_show_discount && (item.discount_percent > 0 || item.discount_amount > 0) && /* @__PURE__ */ jsx("span", { children: item.discount_percent > 0 ? `Disc: -${item.discount_percent}% (${formatAmount(item.discount_amount)})` : `Disc: -${formatAmount(item.discount_amount)}` })
      ] }),
      (data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && /* @__PURE__ */ jsxs("div", { className: "text-[0.7em] font-mono mt-1 flex flex-wrap gap-x-2 gap-y-0.5", children: [
        data.thermal_show_batch && item.batch && /* @__PURE__ */ jsxs("span", { children: [
          "BATCH: ",
          item.batch,
          " "
        ] }),
        data.thermal_show_expiry && item.exp && /* @__PURE__ */ jsxs("span", { children: [
          "EXP: ",
          item.exp,
          " "
        ] }),
        data.thermal_show_mfg_date && item.mfg_date && /* @__PURE__ */ jsxs("span", { children: [
          "MFG: ",
          item.mfg_date,
          " "
        ] }),
        data.thermal_show_size && item.size && /* @__PURE__ */ jsxs("span", { children: [
          "SIZE: ",
          item.size,
          " "
        ] }),
        data.thermal_show_model && item.model && /* @__PURE__ */ jsxs("span", { children: [
          "MODEL: ",
          item.model,
          " "
        ] }),
        data.thermal_show_serial && item.serial && /* @__PURE__ */ jsxs("span", { children: [
          "S/N: ",
          item.serial
        ] })
      ] })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "text-right px-1 text-sm space-y-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "Subtotal:" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.subtotal) })
      ] }),
      data.print_total_quantity && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
        /* @__PURE__ */ jsx("span", { children: "Total Qty:" }),
        /* @__PURE__ */ jsx("span", { children: calculations.qty })
      ] }),
      data.print_tax_details && calculations.gst > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
        /* @__PURE__ */ jsx("span", { children: "Tax Amount:" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.gst) })
      ] }),
      calculations.invoiceDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-red-600 font-bold", children: [
        /* @__PURE__ */ jsx("span", { children: "Discount:" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "-",
          formatAmount(calculations.invoiceDiscount)
        ] })
      ] }),
      data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery:" }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.delivery_charge) })
      ] }),
      data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          item.label,
          ":"
        ] }),
        /* @__PURE__ */ jsx("span", { children: formatAmount(item.value) })
      ] }, idx))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-black text-white p-2 mt-2 flex justify-between items-center text-lg", children: [
      /* @__PURE__ */ jsx("span", { children: "TOTAL PAYABLE" }),
      /* @__PURE__ */ jsx("span", { children: formatAmount(calculations.total) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-1 mt-2 text-right text-xs space-y-0.5", children: [
      data.print_received_amount && /* @__PURE__ */ jsxs("div", { children: [
        "Received: ",
        formatAmount(calculations.paid)
      ] }),
      data.print_balance_amount && /* @__PURE__ */ jsxs("div", { children: [
        "Balance Due: ",
        formatAmount(calculations.balance)
      ] }),
      data.print_show_previous_balance && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Prev Balance: ",
          formatAmount(calculations.prev_balance)
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "font-bold border-t border-black pt-1", children: [
          "Net Balance: ",
          formatAmount(calculations.net_balance)
        ] })
      ] }),
      data.print_party_balance && !data.print_show_previous_balance && /* @__PURE__ */ jsxs("div", { className: "font-bold", children: [
        "Party Balance: ",
        formatAmount(calculations.net_balance)
      ] }),
      data.print_you_saved && calculations.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1 font-black text-sm", children: [
        "SAVINGS: ",
        formatAmount(calculations.discount)
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center mt-6 px-1", children: [
      data.print_amount_words !== "0" && /* @__PURE__ */ jsx("div", { className: "text-xs italic mb-4 border-b border-black pb-2", children: getAmountInWords(calculations.total) }),
      data.print_description !== false && data.print_description !== "0" && data.print_description !== 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs whitespace-pre-wrap", children: [
        data.print_terms || "",
        data.thermal_custom_footer && /* @__PURE__ */ jsx("div", { className: "mt-2 text-base", children: data.thermal_custom_footer }),
        !data.print_terms && !data.thermal_custom_footer && "THANK YOU FOR VISITING"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-[0.7em] opacity-60 mt-2", children: [
        "Powered by",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://venqore.com?utm_source=invoice_footer", target: "_blank", rel: "noopener noreferrer", style: { color: "#4f46e5", fontWeight: "bold" }, children: "VenQore" })
      ] }),
      (data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-xs font-bold gap-1 border-t-2 border-black pt-2 mt-2", children: [
        data.print_payment_mode && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "PAYMENT: " }),
          /* @__PURE__ */ jsx("span", { children: sale ? (sale.payment_method || "Cash").toUpperCase() : "CASH" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 w-full mt-1", children: [
          data.print_received_by && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "RECEIVED BY:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] }),
          data.print_delivered_by && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "DELIVERED BY:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] }),
          data.print_acknowledgement && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "CUSTOMER SIGN:" }),
            /* @__PURE__ */ jsx("span", { children: "_________________" })
          ] })
        ] })
      ] }),
      data.print_signature_text && /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("div", { className: "border-t-2 border-black w-24 mx-auto mb-1" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs", children: data.print_signature_text })
      ] }),
      (data.thermal_show_barcode === true || data.thermal_show_barcode === 1 || data.thermal_show_barcode !== false && data.thermal_show_barcode !== "0" && data.thermal_show_barcode !== 0) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mt-2", children: [
        /* @__PURE__ */ jsx("div", { className: "mt-2 h-8 w-2/3 mx-auto opacity-70", style: {
          backgroundImage: `repeating-linear-gradient(90deg, 
                                #000 0px, #000 1px, 
                                transparent 1px, transparent 2px,
                                #000 2px, #000 4px,
                                transparent 4px, transparent 5px)`
        } }),
        /* @__PURE__ */ jsxs("div", { className: "text-[0.6em] font-mono mt-1 tracking-widest opacity-50 uppercase", children: [
          "*",
          sale ? sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id : `${data.sale_prefix}1001`,
          "*"
        ] })
      ] }),
      parseInt(data.thermal_extra_lines ?? data.print_feed_lines) > 0 && /* @__PURE__ */ jsx("div", { style: { height: parseInt(data.thermal_extra_lines ?? data.print_feed_lines) * 12 + "px" } })
    ] })
  ] });
};
export {
  PrintPreview as P
};
