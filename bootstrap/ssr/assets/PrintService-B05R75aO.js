import { jsx } from "react/jsx-runtime";
import "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { a as formatNumber } from "./format-B_ph0Qec.js";
import { P as PrintPreview } from "./PrintPreview--U6vwnpl.js";
function isAMDStationAvailable() {
  return typeof window !== "undefined" && window.amdAPI !== void 0;
}
const AMDStation = {
  /**
   * Check if running in VenQore Station
   * Returns { isAMDStation, version, deviceId, terminalId, platform }
   */
  async check() {
    if (!isAMDStationAvailable()) return { isAMDStation: false };
    try {
      return await window.amdAPI.check();
    } catch (e) {
      return { isAMDStation: false };
    }
  },
  /**
   * Register the terminal ID assigned by the cloud after login.
   * Call this once after a user logs in and you have their terminal_id.
   * @param {number} terminalId
   */
  registerTerminal(terminalId) {
    if (!isAMDStationAvailable()) return;
    window.amdAPI.registerTerminal(terminalId);
  },
  /**
   * Get station preferences (printer, terminal ID, device ID)
   */
  async getPrefs() {
    if (!isAMDStationAvailable()) return {};
    try {
      return await window.amdAPI.getPrefs();
    } catch (e) {
      return {};
    }
  },
  /**
   * Save station preferences
   */
  async savePrefs(updates) {
    if (!isAMDStationAvailable()) return { success: false };
    try {
      return await window.amdAPI.savePrefs(updates);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  /**
   * Get available printers
   */
  async getPrinters() {
    if (!isAMDStationAvailable()) return [];
    try {
      return await window.amdAPI.getPrinters();
    } catch (e) {
      return [];
    }
  },
  /**
   * Set default printer
   */
  async setDefaultPrinter(printerName) {
    if (!isAMDStationAvailable()) return { success: false };
    try {
      return await window.amdAPI.setDefaultPrinter(printerName);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  /**
   * Print receipt with hardware control
   * Falls back to browser print if not in VenQore Station
   */
  async print(data, options = {}) {
    if (isAMDStationAvailable()) {
      const printData = {
        content: this.formatReceiptData(data),
        printerName: options.printerName,
        copies: options.copies || 1,
        paperWidth: options.paperWidth || "80mm"
      };
      try {
        const result = await window.amdAPI.print(printData);
        return result;
      } catch (e) {
        console.error("[AMDStation] Print failed:", e);
        return { success: false, error: e.message };
      }
    } else {
      console.log("[AMDStation] Not available, using browser print");
      window.print();
      return { success: true, fallback: true };
    }
  },
  /**
   * Open cash drawer
   */
  async openDrawer(printerName) {
    if (!isAMDStationAvailable()) {
      console.warn("[AMDStation] Cash drawer not available in browser");
      return { success: false, error: "Cash drawer requires VenQore Station" };
    }
    try {
      return await window.amdAPI.openDrawer(printerName);
    } catch (e) {
      console.error("[AMDStation] Drawer failed:", e);
      return { success: false, error: e.message };
    }
  },
  /**
   * Print and open drawer in one action
   */
  async printAndOpenDrawer(data, options = {}) {
    const printResult = await this.print(data, options);
    if (options.openDrawer !== false) {
      await this.openDrawer(options.printerName);
    }
    return printResult;
  },
  /**
   * Format receipt data for electron-pos-printer
   */
  formatReceiptData(data) {
    if (Array.isArray(data) && data[0]?.type) {
      return data;
    }
    const content = [];
    if (data.businessName) {
      content.push({
        type: "text",
        value: data.businessName,
        style: { fontWeight: "700", textAlign: "center", fontSize: "24px" }
      });
    }
    if (data.businessAddress) {
      content.push({
        type: "text",
        value: data.businessAddress,
        style: { textAlign: "center", fontSize: "12px" }
      });
    }
    if (data.businessPhone) {
      content.push({
        type: "text",
        value: data.businessPhone,
        style: { textAlign: "center", fontSize: "12px" }
      });
    }
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center" }
    });
    if (data.invoiceNumber) {
      content.push({
        type: "text",
        value: `Invoice: ${data.invoiceNumber}`,
        style: { fontSize: "14px" }
      });
    }
    if (data.date) {
      content.push({
        type: "text",
        value: `Date: ${data.date}`,
        style: { fontSize: "12px" }
      });
    }
    if (data.customerName) {
      content.push({
        type: "text",
        value: `Customer: ${data.customerName}`,
        style: { fontSize: "12px" }
      });
    }
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center" }
    });
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item, index) => {
        content.push({
          type: "text",
          value: item.name,
          style: { fontSize: "13px" }
        });
        content.push({
          type: "text",
          value: `${item.qty} x ${item.price} = ${item.total}`,
          style: { textAlign: "right", fontSize: "12px" }
        });
      });
    }
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center" }
    });
    const currencySymbol = data.currencySymbol || (window.amdSettings?.currency_symbol || "") + " ";
    if (data.subtotal !== void 0) {
      content.push({
        type: "text",
        value: `Subtotal: ${currencySymbol}${data.subtotal}`,
        style: { textAlign: "right" }
      });
    }
    if (data.tax !== void 0 && data.tax > 0) {
      content.push({
        type: "text",
        value: `Tax: ${currencySymbol}${data.tax}`,
        style: { textAlign: "right", fontSize: "12px" }
      });
    }
    if (data.discount !== void 0 && data.discount > 0) {
      content.push({
        type: "text",
        value: `Discount: -${currencySymbol}${data.discount}`,
        style: { textAlign: "right", fontSize: "12px" }
      });
    }
    content.push({
      type: "text",
      value: `TOTAL: ${currencySymbol}${data.total}`,
      style: { fontWeight: "700", textAlign: "right", fontSize: "18px" }
    });
    if (data.paidAmount !== void 0) {
      content.push({
        type: "text",
        value: `Paid: ${window.amdSettings?.currency_symbol || ""} ${data.paidAmount}`,
        style: { textAlign: "right" }
      });
    }
    if (data.changeAmount !== void 0 && data.changeAmount > 0) {
      content.push({
        type: "text",
        value: `Change: ${window.amdSettings?.currency_symbol || ""} ${data.changeAmount}`,
        style: { textAlign: "right" }
      });
    }
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center" }
    });
    content.push({
      type: "text",
      value: "Thank You!",
      style: { fontWeight: "700", textAlign: "center", fontSize: "16px" }
    });
    if (data.footerMessage) {
      content.push({
        type: "text",
        value: data.footerMessage,
        style: { textAlign: "center", fontSize: "11px" }
      });
    }
    if (data.showBarcode && data.invoiceNumber) {
      content.push({
        type: "barCode",
        value: data.invoiceNumber.toString(),
        height: 40,
        width: 2,
        displayValue: true,
        fontsize: 8
      });
    }
    return content;
  }
};
const PX_PER_MM = 96 / 25.4;
class PrintService {
  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Main entry point for printing invoices/receipts.
   */
  static async printInvoice(sale, settings = {}, type = "regular", options = {}) {
    const data = this.normalizeSettings(settings);
    if (type === "thermal" && isAMDStationAvailable()) {
      try {
        return await this.printWithAMDStation(sale, data, options);
      } catch (e) {
        console.error("[PrintService] AMD Station failed, falling back to browser:", e);
      }
    }
    const isThermal = type === "thermal";
    const widthMm = isThermal ? this._thermalWidthMm(data) : this._regularWidthMm(data);
    const previewHtml = this._renderToHtml(sale, data, type);
    const allStyles = this._collectStyles();
    let pageDeclaration;
    if (isThermal) {
      pageDeclaration = `size: ${widthMm}mm 297mm;`;
      console.log(`[PrintService] Thermal @page → ${widthMm}mm x 297mm`);
    } else {
      const orient = data.paper_orientation === "Landscape" ? "landscape" : "portrait";
      pageDeclaration = `size: ${data.paper_size || "A4"} ${orient};`;
    }
    const html = this._buildHtml(previewHtml, allStyles, pageDeclaration, sale, isThermal, data);
    this._openPrintWindow(html, type, widthMm);
  }
  /**
   * Quick-print with auto-detected settings.
   * Pass liveSettings from React props to bypass stale window.amdSettings.
   */
  static async quickPrint(sale, type = null, liveSettings = null) {
    const settings = liveSettings ? this.normalizeSettings(liveSettings) : this.getSettings();
    const effectiveType = type || settings.default_print_type || "regular";
    if (sale && sale.id && !sale.id.toString().includes("temp") && sale.customer_prev_balance === void 0) {
      try {
        const pathParts = window.location.pathname.split("/");
        const storeSlug = pathParts[2];
        if (storeSlug) {
          const isPurchase = sale.supplier_id !== void 0 || sale.invoice_type && sale.invoice_type === "purchase" || sale.purchase_number !== void 0;
          const isReturn = sale.status === "returned" || sale.return_number !== void 0;
          let routeName = "store.sales.show";
          let routeParam = { store_slug: storeSlug, sale: sale.id };
          if (isPurchase) {
            routeName = "store.purchases.show";
            routeParam = { store_slug: storeSlug, purchase: sale.id };
          } else if (isReturn) {
            routeName = "store.returns.show";
            routeParam = { store_slug: storeSlug, return: sale.id };
          }
          const response = await axios.get(route(routeName, routeParam), {
            headers: { Accept: "application/json" }
          });
          const fullSale = response.data?.sale || response.data?.purchase || response.data?.return || response.data;
          if (fullSale) {
            this.printInvoice(fullSale, settings, effectiveType);
            return;
          }
        }
      } catch (err) {
        console.error("PrintService failed to fetch full sale data, printing fallback:", err);
      }
    }
    this.printInvoice(sale, settings, effectiveType);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // HARDWARE (VenQore Station)
  // ─────────────────────────────────────────────────────────────────────────
  static async printWithAMDStation(sale, settings, options = {}) {
    const receiptData = this._formatForStation(sale, settings);
    return await AMDStation.printAndOpenDrawer(receiptData, {
      openDrawer: options.openDrawer !== false && settings.thermal_open_drawer,
      copies: options.copies || settings.thermal_copies || 1,
      paperWidth: settings.thermal_page_size === "2inch" ? "58mm" : "80mm"
    });
  }
  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Read settings — freshest source first.
   *  1. Inertia data-page attribute (updated on every navigation)
   *  2. window.amdSettings  (page-load snapshot, may be stale)
   */
  static getSettings() {
    try {
      const appEl = document.getElementById("app");
      if (appEl?.dataset?.page) {
        const pd = JSON.parse(appEl.dataset.page);
        if (pd?.props?.settings) return this.normalizeSettings(pd.props.settings);
      }
    } catch (_) {
    }
    return this.normalizeSettings(window.amdSettings || {});
  }
  /**
   * Convert raw DB strings ('0'/'1') to proper typed values.
   */
  static normalizeSettings(raw) {
    if (!raw) return {};
    const b = (v, def = false) => {
      if (typeof v === "boolean") return v;
      if (v === true || v === "1" || v === "true" || v === "on") return true;
      if (v === false || v === "0" || v === "false" || v === "off") return false;
      return def;
    };
    const n = (v, def = 0) => {
      const p = parseInt(v);
      return isNaN(p) ? def : p;
    };
    const s = (v, def = "") => v == null ? def : String(v);
    return {
      ...raw,
      // Business
      business_name: s(raw.business_name || raw.store_name),
      business_address: s(raw.business_address || raw.store_address),
      business_phone: s(raw.business_phone || raw.store_phone),
      business_email: s(raw.business_email),
      tax_number: s(raw.tax_number),
      sale_prefix: s(raw.sale_prefix, "INV-"),
      currency: s(raw.currency, "PKR"),
      currency_symbol: s(raw.currency_symbol, "Rs"),
      decimal_places: n(raw.decimal_places, 2),
      // Regular print
      paper_size: s(raw.paper_size, "A4"),
      paper_orientation: s(raw.paper_orientation, "Portrait"),
      print_theme: s(raw.print_theme, "modern"),
      print_theme_color: s(raw.print_theme_color, "#4f46e5"),
      print_logo: b(raw.print_logo, true),
      print_logo_path: (() => {
        const p = raw.print_logo_path || null;
        if (!p) return null;
        if (/^(https?|blob|data):/.test(p)) return p;
        return `${window.location.origin}${p.startsWith("/") ? p : "/" + p}`;
      })(),
      print_signature_text: s(raw.print_signature_text, "Authorized Signatory"),
      print_original_copy: b(raw.print_original_copy, false),
      print_company_text_size: s(raw.print_company_text_size, "4"),
      print_invoice_text_size: s(raw.print_invoice_text_size, "3"),
      margin_top: n(raw.margin_top, 20),
      margin_bottom: n(raw.margin_bottom, 20),
      margin_left: n(raw.margin_left, 20),
      margin_right: n(raw.margin_right, 20),
      custom_paper_width: n(raw.custom_paper_width, 210),
      custom_paper_height: n(raw.custom_paper_height, 297),
      // Regular toggles
      print_show_sno: b(raw.print_show_sno, true),
      print_show_units: b(raw.print_show_units, true),
      print_show_mrp: b(raw.print_show_mrp, false),
      print_show_description: b(raw.print_show_description, true),
      print_show_hsn: b(raw.print_show_hsn, false),
      print_show_discount: b(raw.print_show_discount, false),
      print_show_free_qty: b(raw.print_show_free_qty, false),
      print_show_delivery_charge: b(raw.print_show_delivery_charge, true),
      print_show_extra_charge: b(raw.print_show_extra_charge, true),
      // Regular totals/footer
      print_total_quantity: b(raw.print_total_quantity, true),
      print_amount_decimal: b(raw.print_amount_decimal, true),
      print_received_amount: b(raw.print_received_amount, true),
      print_balance_amount: b(raw.print_balance_amount, true),
      print_tax_details: b(raw.print_tax_details, true),
      print_you_saved: b(raw.print_you_saved, false),
      print_show_previous_balance: b(raw.print_show_previous_balance, false),
      print_amount_words: s(raw.print_amount_words, "0"),
      print_terms: s(raw.print_terms, ""),
      print_header_all_pages: b(raw.print_header_all_pages, true),
      print_payment_mode: b(raw.print_payment_mode, true),
      print_party_balance: b(raw.print_party_balance, false),
      print_amount_grouping: b(raw.print_amount_grouping, true),
      print_received_by: b(raw.print_received_by, false),
      print_delivered_by: b(raw.print_delivered_by, false),
      print_acknowledgement: b(raw.print_acknowledgement, false),
      print_extra_space_top: n(raw.print_extra_space_top, 0),
      print_min_item_rows: n(raw.print_min_item_rows, 5),
      print_description: b(raw.print_description, true),
      // Thermal
      default_print_type: s(raw.default_print_type, "regular"),
      thermal_page_size: s(raw.thermal_page_size, "3inch"),
      thermal_font_size: n(raw.thermal_font_size, 12),
      thermal_use_bold: b(raw.thermal_use_bold, true),
      thermal_auto_cut: b(raw.thermal_auto_cut, true),
      thermal_open_drawer: b(raw.thermal_open_drawer, false),
      thermal_copies: n(raw.thermal_copies, 1),
      thermal_show_headers: b(raw.thermal_show_headers, false),
      thermal_show_sno: b(raw.thermal_show_sno, false),
      thermal_show_units: b(raw.thermal_show_units, false),
      thermal_show_mrp: b(raw.thermal_show_mrp, false),
      thermal_show_description: b(raw.thermal_show_description, false),
      thermal_show_batch: b(raw.thermal_show_batch, false),
      thermal_show_expiry: b(raw.thermal_show_expiry, false),
      thermal_show_barcode: b(raw.thermal_show_barcode, true),
      thermal_custom_footer: s(raw.thermal_custom_footer, ""),
      thermal_custom_chars: n(raw.thermal_custom_chars, 48),
      thermal_show_mfg_date: b(raw.thermal_show_mfg_date, false),
      thermal_show_size: b(raw.thermal_show_size, false),
      thermal_show_model: b(raw.thermal_show_model, false),
      thermal_show_serial: b(raw.thermal_show_serial, false),
      thermal_extra_lines: n(raw.thermal_extra_lines, 3),
      print_feed_lines: n(raw.print_feed_lines, 0)
    };
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  static _thermalWidthMm(data) {
    if (data.thermal_page_size === "2inch") return 58;
    if (data.thermal_page_size === "4inch") return 100;
    return 80;
  }
  static _regularWidthMm(data) {
    const sizes = { A4: 210, A5: 148, Letter: 216, Legal: 216 };
    const pw = data.paper_size === "Custom" ? parseFloat(data.custom_paper_width) || 210 : sizes[data.paper_size] || 210;
    return data.paper_orientation === "Landscape" ? data.paper_size === "A4" ? 297 : pw : pw;
  }
  static _renderToHtml(sale, data, type) {
    const node = document.createElement("div");
    const root = createRoot(node);
    flushSync(() => {
      root.render(/* @__PURE__ */ jsx(PrintPreview, { data, sale, type, mode: "light", forPrint: true }));
    });
    const html = node.innerHTML;
    root.unmount();
    return html;
  }
  static _collectStyles() {
    return Array.from(document.styleSheets).map((sheet) => {
      try {
        return Array.from(sheet.cssRules || []).map((r) => r.cssText).join("\n");
      } catch {
        return "";
      }
    }).join("\n");
  }
  /**
   * Measure the true rendered height of the receipt at thermal paper width.
   *
   * Injects the receipt HTML into a hidden div in the MAIN document so that
   * all Tailwind classes and fonts are already loaded — no style-parsing delay.
   * Waits for images before measuring.
   */
  static _measureThermalHeight(previewHtml, widthMm) {
    return new Promise((resolve) => {
      const div = document.createElement("div");
      div.style.cssText = [
        "position:fixed",
        "left:-9999px",
        "top:0",
        `width:${widthMm}mm`,
        // exact thermal paper width
        "visibility:hidden",
        "overflow:visible",
        "z-index:-1",
        "pointer-events:none"
      ].join(";");
      div.innerHTML = previewHtml;
      document.body.appendChild(div);
      const measure = () => {
        const container = div.querySelector(".print-container") || div;
        const heightPx = container.scrollHeight || container.offsetHeight || 0;
        if (document.body.contains(div)) document.body.removeChild(div);
        const heightMm = heightPx > 0 ? Math.ceil(heightPx / PX_PER_MM) + 10 : 500;
        console.log(`[PrintService] Measured: ${heightPx}px → ${heightMm}mm (width=${widthMm}mm)`);
        resolve(heightMm);
      };
      const imgs = Array.from(div.querySelectorAll("img"));
      if (imgs.length === 0) {
        requestAnimationFrame(() => requestAnimationFrame(measure));
      } else {
        let pending = imgs.length;
        const onLoad = () => {
          if (--pending <= 0) requestAnimationFrame(() => requestAnimationFrame(measure));
        };
        imgs.forEach((img) => {
          if (img.complete) {
            onLoad();
          } else {
            img.onload = onLoad;
            img.onerror = onLoad;
          }
        });
        setTimeout(() => {
          if (document.body.contains(div)) measure();
        }, 4e3);
      }
    });
  }
  static _buildHtml(previewHtml, allStyles, pageDeclaration, sale, isThermal, data) {
    const title = sale?.reference_number || sale?.invoice_no || sale?.id || "";
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${title}</title>
  <style>
    ${allStyles}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: white; }
    @page {
      margin: 0;
      ${pageDeclaration}
    }
    @media print {
      html, body {
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
      }
      .print-container {
        height: auto !important;
        overflow: visible !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      .print-container tr,
      .print-container .space-y-3 > div {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>${previewHtml}</body>
</html>`;
  }
  /**
   * Open a hidden iframe and trigger the browser print dialog.
   * The @page size is already correct in the HTML — no post-hoc measurement.
   */
  static _openPrintWindow(html, type, widthMm) {
    const isThermal = type === "thermal";
    const iframe = document.createElement("iframe");
    iframe.style.cssText = [
      "position:fixed",
      "border:none",
      "visibility:hidden",
      "pointer-events:none",
      isThermal ? `left:-9999px;top:0;width:${widthMm}mm;height:1px` : "left:0;top:0;width:0;height:0"
    ].join(";");
    iframe.name = "printFrame";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    let printed = false;
    const triggerPrint = () => {
      if (printed || !iframe.contentWindow) return;
      printed = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 2500);
    };
    const delay = isThermal ? 350 : 500;
    setTimeout(triggerPrint, delay);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // VenQore Station helpers
  // ─────────────────────────────────────────────────────────────────────────
  static _formatForStation(sale, settings) {
    const items = sale.items || sale.cart || [];
    return {
      businessName: settings.business_name || "VenQore Store",
      businessAddress: settings.business_address,
      businessPhone: settings.business_phone,
      invoiceNumber: sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id,
      date: sale.created_at || (/* @__PURE__ */ new Date()).toLocaleString(),
      customerName: sale.customer?.name || "Walk-in Customer",
      items: items.map((item) => ({
        name: item.product?.name || item.name,
        qty: item.quantity || item.qty || 1,
        price: formatNumber(item.unit_price || item.price || 0),
        total: formatNumber((item.unit_price || item.price || 0) * (item.quantity || item.qty || 1))
      })),
      subtotal: formatNumber(sale.subtotal || items.reduce((s, i) => s + (i.quantity || i.qty || 1) * (i.unit_price || i.price || 0), 0)),
      tax: formatNumber(sale.tax || sale.tax_amount || 0),
      discount: formatNumber(sale.discount || 0),
      total: formatNumber(sale.total || sale.total_amount),
      paidAmount: formatNumber(sale.paid || sale.amount_paid || sale.total),
      changeAmount: formatNumber(sale.change || 0),
      balanceAmount: formatNumber(sale.balance || 0),
      footerMessage: settings.print_terms || settings.thermal_custom_footer || "Thank you!",
      showBarcode: settings.thermal_show_barcode !== false
    };
  }
}
export {
  PrintService as P
};
