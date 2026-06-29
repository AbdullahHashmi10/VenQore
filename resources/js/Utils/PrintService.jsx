/**
 * VENQORE Print Service
 *
 * Comprehensive printing utility supporting:
 * - Regular A4/Letter printing (HTML-based)
 * - Thermal receipt printing (58mm/80mm)
 * - VenQore Station hardware integration (silent print, auto-cut, cash drawer)
 *
 * HOW THERMAL PAGE SIZING WORKS
 * ─────────────────────────────
 * For thermal printing the browser needs @page { size: 80mm Xmm } where X = exact
 * content height.  If X is too large the browser "fits" the tiny content into a tall
 * page → text scales down (squishes).  If X is too small content gets cut.
 *
 * The reliable way to get X:
 *   1. Render the receipt HTML into a HIDDEN DIV in the MAIN document (all Tailwind/font
 *      styles are already loaded here — no style-parsing delay like an iframe has).
 *   2. Set that div's width to the thermal paper width in mm so lines wrap exactly as they
 *      will on paper.
 *   3. Wait for images to load, then read scrollHeight.
 *   4. Convert px → mm using screen DPI (96 px/inch → 1 mm = 3.7795 px).
 *   5. Embed the exact @page size into the HTML string before opening the print iframe.
 *
 * Because the @page size is already correct in the HTML, openPrintWindow just loads and
 * prints — no post-hoc overrides needed.
 */

import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { formatNumber } from './format';
import { AMDStation, isAMDStationAvailable } from './AMDStation';
import PrintPreview from '@/Components/PrintPreview';

// Browsers render at 96 DPI.  1 mm = 96/25.4 ≈ 3.7795 px.
const PX_PER_MM = 96 / 25.4;

class PrintService {
    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main entry point for printing invoices/receipts.
     */
    static async printInvoice(sale, settings = {}, type = 'regular', options = {}) {
        const data = this.normalizeSettings(settings);

        // VenQore Station (hardware silent-print) takes priority for thermal
        if (type === 'thermal' && isAMDStationAvailable()) {
            try {
                return await this.printWithAMDStation(sale, data, options);
            } catch (e) {
                console.error('[PrintService] AMD Station failed, falling back to browser:', e);
            }
        }

        const isThermal = type === 'thermal';
        const widthMm   = isThermal ? this._thermalWidthMm(data) : this._regularWidthMm(data);

        // Render receipt via PrintPreview (single source of truth for all themes)
        const previewHtml = this._renderToHtml(sale, data, type);

        // Collect all current page styles so the iframe prints with correct fonts/Tailwind
        const allStyles = this._collectStyles();

        let pageDeclaration;
        if (isThermal) {
            pageDeclaration = `size: ${widthMm}mm 297mm;`;
            console.log(`[PrintService] Thermal @page → ${widthMm}mm x 297mm`);
        } else {
            const orient = data.paper_orientation === 'Landscape' ? 'landscape' : 'portrait';
            pageDeclaration = `size: ${data.paper_size || 'A4'} ${orient};`;
        }

        const html = this._buildHtml(previewHtml, allStyles, pageDeclaration, sale, isThermal, data);
        this._openPrintWindow(html, type, widthMm);
    }

    /**
     * Quick-print with auto-detected settings.
     * Pass liveSettings from React props to bypass stale window.amdSettings.
     */
    static quickPrint(sale, type = null, liveSettings = null) {
        const settings     = liveSettings ? this.normalizeSettings(liveSettings) : this.getSettings();
        const effectiveType = type || settings.default_print_type || 'regular';
        this.printInvoice(sale, settings, effectiveType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HARDWARE (VenQore Station)
    // ─────────────────────────────────────────────────────────────────────────

    static async printWithAMDStation(sale, settings, options = {}) {
        const receiptData = this._formatForStation(sale, settings);
        return await AMDStation.printAndOpenDrawer(receiptData, {
            openDrawer: options.openDrawer !== false && settings.thermal_open_drawer,
            copies:     options.copies || settings.thermal_copies || 1,
            paperWidth: settings.thermal_page_size === '2inch' ? '58mm' : '80mm',
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
            const appEl = document.getElementById('app');
            if (appEl?.dataset?.page) {
                const pd = JSON.parse(appEl.dataset.page);
                if (pd?.props?.settings) return this.normalizeSettings(pd.props.settings);
            }
        } catch (_) { /* fall through */ }
        return this.normalizeSettings(window.amdSettings || {});
    }

    /**
     * Convert raw DB strings ('0'/'1') to proper typed values.
     */
    static normalizeSettings(raw) {
        if (!raw) return {};
        const b = (v, def = false) => {
            if (typeof v === 'boolean') return v;
            if (v === true  || v === '1' || v === 'true'  || v === 'on')  return true;
            if (v === false || v === '0' || v === 'false' || v === 'off') return false;
            return def;
        };
        const n = (v, def = 0)  => { const p = parseInt(v); return isNaN(p) ? def : p; };
        const s = (v, def = '') => (v == null ? def : String(v));

        return {
            ...raw,
            // Business
            business_name:    s(raw.business_name || raw.store_name),
            business_address: s(raw.business_address || raw.store_address),
            business_phone:   s(raw.business_phone  || raw.store_phone),
            business_email:   s(raw.business_email),
            tax_number:       s(raw.tax_number),
            sale_prefix:      s(raw.sale_prefix, 'INV-'),
            currency:         s(raw.currency, 'PKR'),
            currency_symbol:  s(raw.currency_symbol, 'Rs'),
            decimal_places:   n(raw.decimal_places, 2),

            // Regular print
            paper_size:             s(raw.paper_size, 'A4'),
            paper_orientation:      s(raw.paper_orientation, 'Portrait'),
            print_theme:            s(raw.print_theme, 'modern'),
            print_theme_color:      s(raw.print_theme_color, '#4f46e5'),
            print_logo:             b(raw.print_logo, true),
            print_logo_path: (() => {
                const p = raw.print_logo_path || null;
                if (!p) return null;
                if (/^(https?|blob|data):/.test(p)) return p;
                return `${window.location.origin}${p.startsWith('/') ? p : '/' + p}`;
            })(),
            print_signature_text:      s(raw.print_signature_text, 'Authorized Signatory'),
            print_original_copy:       b(raw.print_original_copy, false),
            print_company_text_size:   s(raw.print_company_text_size, '4'),
            print_invoice_text_size:   s(raw.print_invoice_text_size, '3'),
            margin_top:    n(raw.margin_top, 20),
            margin_bottom: n(raw.margin_bottom, 20),
            margin_left:   n(raw.margin_left, 20),
            margin_right:  n(raw.margin_right, 20),
            custom_paper_width:  n(raw.custom_paper_width, 210),
            custom_paper_height: n(raw.custom_paper_height, 297),

            // Regular toggles
            print_show_sno:         b(raw.print_show_sno, true),
            print_show_units:       b(raw.print_show_units, true),
            print_show_mrp:         b(raw.print_show_mrp, false),
            print_show_description: b(raw.print_show_description, true),
            print_show_hsn:         b(raw.print_show_hsn, false),
            print_show_discount:    b(raw.print_show_discount, false),
            print_show_free_qty:    b(raw.print_show_free_qty, false),

            // Regular totals/footer
            print_total_quantity:  b(raw.print_total_quantity, true),
            print_amount_decimal:  b(raw.print_amount_decimal, true),
            print_received_amount: b(raw.print_received_amount, true),
            print_balance_amount:  b(raw.print_balance_amount, true),
            print_tax_details:     b(raw.print_tax_details, true),
            print_you_saved:       b(raw.print_you_saved, false),
            print_amount_words:    s(raw.print_amount_words, '0'),
            print_terms:           s(raw.print_terms, ''),
            print_header_all_pages:b(raw.print_header_all_pages, true),
            print_payment_mode:    b(raw.print_payment_mode, true),

            // Thermal
            default_print_type:     s(raw.default_print_type, 'regular'),
            thermal_page_size:      s(raw.thermal_page_size, '3inch'),
            thermal_font_size:      n(raw.thermal_font_size, 12),
            thermal_use_bold:       b(raw.thermal_use_bold, true),
            thermal_auto_cut:       b(raw.thermal_auto_cut, true),
            thermal_open_drawer:    b(raw.thermal_open_drawer, false),
            thermal_copies:         n(raw.thermal_copies, 1),
            thermal_show_headers:   b(raw.thermal_show_headers, false),
            thermal_show_sno:       b(raw.thermal_show_sno, false),
            thermal_show_units:     b(raw.thermal_show_units, false),
            thermal_show_mrp:       b(raw.thermal_show_mrp, false),
            thermal_show_description: b(raw.thermal_show_description, false),
            thermal_show_batch:     b(raw.thermal_show_batch, false),
            thermal_show_expiry:    b(raw.thermal_show_expiry, false),
            thermal_show_barcode:   b(raw.thermal_show_barcode, true),
            thermal_custom_footer:  s(raw.thermal_custom_footer, ''),

            print_feed_lines: n(raw.print_feed_lines, 0),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    static _thermalWidthMm(data) {
        if (data.thermal_page_size === '2inch') return 58;
        if (data.thermal_page_size === '4inch') return 100;
        return 80;
    }

    static _regularWidthMm(data) {
        const sizes = { A4: 210, A5: 148, Letter: 216, Legal: 216 };
        const pw = data.paper_size === 'Custom'
            ? (parseFloat(data.custom_paper_width) || 210)
            : (sizes[data.paper_size] || 210);
        return data.paper_orientation === 'Landscape'
            ? (data.paper_size === 'A4' ? 297 : pw)
            : pw;
    }

    static _renderToHtml(sale, data, type) {
        const node = document.createElement('div');
        const root = createRoot(node);
        flushSync(() => {
            root.render(<PrintPreview data={data} sale={sale} type={type} mode="light" forPrint={true} />);
        });
        const html = node.innerHTML;
        root.unmount();
        return html;
    }

    static _collectStyles() {
        return Array.from(document.styleSheets)
            .map(sheet => {
                try { return Array.from(sheet.cssRules || []).map(r => r.cssText).join('\n'); }
                catch { return ''; }
            })
            .join('\n');
    }

    /**
     * Measure the true rendered height of the receipt at thermal paper width.
     *
     * Injects the receipt HTML into a hidden div in the MAIN document so that
     * all Tailwind classes and fonts are already loaded — no style-parsing delay.
     * Waits for images before measuring.
     */
    static _measureThermalHeight(previewHtml, widthMm) {
        return new Promise(resolve => {
            const div = document.createElement('div');
            // Position off-screen but still laid out by the browser
            div.style.cssText = [
                'position:fixed',
                'left:-9999px',
                'top:0',
                `width:${widthMm}mm`,   // exact thermal paper width
                'visibility:hidden',
                'overflow:visible',
                'z-index:-1',
                'pointer-events:none',
            ].join(';');
            div.innerHTML = previewHtml;
            document.body.appendChild(div);

            const measure = () => {
                const container = div.querySelector('.print-container') || div;
                const heightPx  = container.scrollHeight || container.offsetHeight || 0;
                if (document.body.contains(div)) document.body.removeChild(div);
                // +10 mm buffer so the bottom line is never clipped
                const heightMm = heightPx > 0
                    ? Math.ceil(heightPx / PX_PER_MM) + 10
                    : 500;
                console.log(`[PrintService] Measured: ${heightPx}px → ${heightMm}mm (width=${widthMm}mm)`);
                resolve(heightMm);
            };

            const imgs = Array.from(div.querySelectorAll('img'));
            if (imgs.length === 0) {
                // No images — two rAFs to let layout settle
                requestAnimationFrame(() => requestAnimationFrame(measure));
            } else {
                let pending = imgs.length;
                const onLoad = () => { if (--pending <= 0) requestAnimationFrame(() => requestAnimationFrame(measure)); };
                imgs.forEach(img => {
                    if (img.complete) { onLoad(); }
                    else { img.onload = onLoad; img.onerror = onLoad; }
                });
                // Safety: measure even if some images time out
                setTimeout(() => { if (document.body.contains(div)) measure(); }, 4000);
            }
        });
    }

    static _buildHtml(previewHtml, allStyles, pageDeclaration, sale, isThermal, data) {
        const title = sale?.reference_number || sale?.invoice_no || sale?.id || '';
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
        const isThermal = type === 'thermal';

        const iframe = document.createElement('iframe');
        iframe.style.cssText = [
            'position:fixed',
            'border:none',
            'visibility:hidden',
            'pointer-events:none',
            isThermal ? `left:-9999px;top:0;width:${widthMm}mm;height:1px` : 'left:0;top:0;width:0;height:0',
        ].join(';');
        iframe.name = 'printFrame';
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
            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 2500);
        };

        // For thermal: images are already measured in the main doc, so a short delay suffices
        const delay = isThermal ? 350 : 500;
        setTimeout(triggerPrint, delay);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VenQore Station helpers
    // ─────────────────────────────────────────────────────────────────────────

    static _formatForStation(sale, settings) {
        const items = sale.items || sale.cart || [];
        return {
            businessName:    settings.business_name || 'VenQore Store',
            businessAddress: settings.business_address,
            businessPhone:   settings.business_phone,
            invoiceNumber:   sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id,
            date:            sale.created_at || new Date().toLocaleString(),
            customerName:    sale.customer?.name || 'Walk-in Customer',
            items: items.map(item => ({
                name:  item.product?.name || item.name,
                qty:   item.quantity || item.qty || 1,
                price: formatNumber(item.unit_price || item.price || 0),
                total: formatNumber((item.unit_price || item.price || 0) * (item.quantity || item.qty || 1)),
            })),
            subtotal:      formatNumber(sale.subtotal || items.reduce((s, i) => s + ((i.quantity || i.qty || 1) * (i.unit_price || i.price || 0)), 0)),
            tax:           formatNumber(sale.tax || sale.tax_amount || 0),
            discount:      formatNumber(sale.discount || 0),
            total:         formatNumber(sale.total || sale.total_amount),
            paidAmount:    formatNumber(sale.paid || sale.amount_paid || sale.total),
            changeAmount:  formatNumber(sale.change || 0),
            balanceAmount: formatNumber(sale.balance || 0),
            footerMessage: settings.print_terms || settings.thermal_custom_footer || 'Thank you!',
            showBarcode:   settings.thermal_show_barcode !== false,
        };
    }
}

export default PrintService;
