import { printBrowserHtml, escapePrintText } from './BrowserPrint';
import { thermalPageText } from './thermalPageText';
import { rememberedPrintType } from './printPreference';
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
import axios from 'axios';
import { formatNumber, getCurrencySymbol } from './format';
import { AMDStation, isAMDStationAvailable } from './AMDStation';
import PrintPreview from '@/Components/PrintPreview';

import { vq } from '@/theme/runtime';
import { withAddOns } from '@/Utils/addOnLabel';
// Browsers render at 96 DPI.  1 mm = 96/25.4 ≈ 3.7795 px.
const PX_PER_MM = 96 / 25.4;

class PrintService {
    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main entry point for printing invoices/receipts.
     */
    static async printInvoice(sale, settings = null, type = null, options = {}) {
        const resolvedSettings = settings || this.getSettings();
        const data = this.normalizeSettings(resolvedSettings);
        const target = await this.resolvePrintTarget(data, type, options);
        type = target.type;
        options = { ...options, printerName: target.printerName };

        // VenQore Station (hardware silent-print) takes priority for thermal
        if (type === 'thermal' && isAMDStationAvailable()) {
            try {
                const stationRes = await this.printWithAMDStation(sale, data, options);
                if (stationRes?.success === true) {
                    return stationRes;
                }
                const message = stationRes?.error || 'VenQore Station could not print to the selected thermal printer.';
                console.error('[PrintService] AMD Station returned failure:', stationRes);
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: `${message} Check the Station printer selection and connection, then retry.`, type: 'error' },
                }));
                return { success: false, transport: 'station', error: message };
            } catch (e) {
                const message = e?.message || 'VenQore Station could not reach the selected thermal printer.';
                console.error('[PrintService] AMD Station failed:', e);
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: `${message} Check the Station printer selection and connection, then retry.`, type: 'error' },
                }));
                return { success: false, transport: 'station', error: message };
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
            let heightMm = 297;
            try {
                heightMm = await this._measureThermalHeight(previewHtml, widthMm);
            } catch (_) {}
            pageDeclaration = `size: ${widthMm}mm ${heightMm}mm;`;
            console.log(`[PrintService] Thermal @page → ${widthMm}mm x ${heightMm}mm`);
        } else {
            const orient = data.paper_orientation === 'Landscape' ? 'landscape' : 'portrait';
            if (data.paper_size === 'Custom') {
                const w = parseFloat(data.custom_paper_width) || 210;
                const h = parseFloat(data.custom_paper_height) || 297;
                pageDeclaration = orient === 'landscape' ? `size: ${h}mm ${w}mm;` : `size: ${w}mm ${h}mm;`;
            } else {
                pageDeclaration = `size: ${data.paper_size || 'A4'} ${orient};`;
            }
        }

        const html = this._buildHtml(previewHtml, allStyles, pageDeclaration, sale, isThermal, data);
        return this._openPrintWindow(html, type, widthMm);
    }

    /**
     * Quick-print with auto-detected settings.
     * Pass liveSettings from React props to bypass stale window.amdSettings.
     */
    static async quickPrint(sale, type = null, liveSettings = null) {
        const settings = liveSettings ? this.normalizeSettings(liveSettings) : this.getSettings();

        if (sale && sale.id && !sale.id.toString().includes('temp') && sale.customer_prev_balance === undefined) {
            try {
                // URLs on this site look like: http://127.0.0.1:8000/s/test-store/sales/list or /transactions
                const pathParts = window.location.pathname.split('/');
                let storeSlug = pathParts[1] === 's' && pathParts[2] ? pathParts[2] : null;
                if (!storeSlug) {
                    storeSlug = window.amdSettings?.store_slug || window.amdSettings?.slug;
                }
                if (!storeSlug) {
                    try {
                        const appEl = document.getElementById('app');
                        if (appEl?.dataset?.page) {
                            const pd = JSON.parse(appEl.dataset.page);
                            storeSlug = pd?.props?.store?.slug;
                        }
                    } catch (_) {}
                }

                if (storeSlug) {
                    const isPurchase = sale.supplier_id !== undefined || (sale.invoice_type && sale.invoice_type === 'purchase') || sale.purchase_number !== undefined || sale.type === 'purchase';
                    const isReturn = sale.status === 'returned' || sale.return_number !== undefined || sale.type === 'return';
                    
                    let routeName = 'store.sales.show';
                    let routeParam = { store_slug: storeSlug, sale: sale.id };

                    if (isPurchase) {
                        routeName = 'store.purchases.show';
                        routeParam = { store_slug: storeSlug, purchase: sale.id };
                    } else if (isReturn) {
                        routeName = 'store.returns.show';
                        routeParam = { store_slug: storeSlug, return: sale.id };
                    }

                    const response = await axios.get(route(routeName, routeParam), {
                        headers: { Accept: 'application/json' }
                    });
                    
                    const fullSale = response.data?.sale || response.data?.purchase || response.data?.return || response.data;
                    if (fullSale) {
                        sale = fullSale;
                    }
                }
            } catch (err) {
                console.error("PrintService failed to fetch full sale data, printing fallback:", err);
            }
        }

        return await this.printInvoice(sale, settings, type);
    }

    /**
     * Print guest check / pre-bill for a table.
     */
    static async printBill({ sale, total, table } = {}, settings = null, type = null) {
        const resolvedSettings = settings || this.getSettings();
        const rawItems = sale?.cart || sale?.items || [];
        const items = rawItems.map((item, idx) => {
            const qty = Number(item.qty ?? item.quantity ?? 1);
            const origPrice = Number(item.original_price ?? item.price ?? item.unit_price ?? 0);
            const unitDisc = Number(item.discount ?? 0);
            const netPrice = Math.max(0, origPrice - unitDisc);
            return {
                ...item,
                sno: idx + 1,
                name: withAddOns(item.name || item.product?.name || 'Item', item),
                quantity: qty,
                qty: qty,
                unit_price: origPrice,
                price: netPrice,
                discount_amount: unitDisc * qty,
                line_total: qty * netPrice,
            };
        });

        const billSale = {
            ...sale,
            items,
            cart: items,
            invoice_no: sale?.invoice_no || sale?.reference_number || (table ? `BILL - ${table.name || table.table_number || ('Table #' + table.id)}` : 'GUEST CHECK'),
            reference_number: sale?.reference_number || (table ? `Table ${table.name || table.table_number || table.id}` : 'Guest Check'),
            created_at: sale?.created_at || new Date().toISOString(),
            subtotal_gross: items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0),
            total_item_discounts: items.reduce((sum, i) => sum + (i.discount_amount || 0), 0),
            total: total !== undefined ? total : (sale?.total || items.reduce((sum, i) => sum + (i.line_total || 0), 0)),
            is_bill: true,
        };

        return await this.printInvoice(billSale, resolvedSettings, type);
    }

    static async resolvePrintTarget(settings, requestedType = null, options = {}) {
        let printerName = options.printerName;
        let receiptPrinter = Boolean(printerName);
        if (isAMDStationAvailable()) {
            const prefs = await AMDStation.getPrefs();
            // Station's saved device is explicitly configured as its receipt printer.
            printerName ||= prefs.defaultPrinter;
            receiptPrinter ||= Boolean(printerName);
            if (!printerName) {
                const printers = await AMDStation.getPrinters();
                const systemDefault = printers.find(printer => printer.isDefault);
                if (systemDefault && (settings?.default_print_type === 'thermal' ||
                    /thermal|receipt|pos[- _]?\d|tm[- _]|rp[- _]|58mm|80mm/i.test(systemDefault.name))) {
                    printerName = systemDefault.name;
                    receiptPrinter = true;
                }
            }
        }
        const remembered = rememberedPrintType();
        if (remembered && typeof window !== 'undefined') {
            window.amdSettings = { ...(window.amdSettings || {}), default_print_type: remembered };
        }
        return {
            // Explicit format, configured device, register preference, saved default.
            type: requestedType || (receiptPrinter ? 'thermal' : null) || remembered || settings?.default_print_type || 'regular',
            printerName,
        };
    }

    // Print buttons on payment, return, order and report pages must obey the
    // same default as invoices instead of printing the desktop page onto A4.
    static async printPage(element = null, settings = this.getSettings()) {
        try {
            const data = this.normalizeSettings(settings);
            const target = await this.resolvePrintTarget(data);
            if (target.type !== 'thermal') {
                window.print();
                return { success: true, transport: 'browser', dialogOpened: true };
            }
            const source = element || document.querySelector('main') || document.getElementById('app');
            if (!source) throw new Error('No printable document was found.');
            const text = [data.business_name, document.title, thermalPageText(source)].filter(Boolean).join('\n\n');
            const width = `${this._thermalWidthMm(data)}mm`;
            if (isAMDStationAvailable()) {
                const result = await AMDStation.print([
                    { type: 'text', value: text, style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '12px' } },
                ], { printerName: target.printerName, paperWidth: width, copies: data.thermal_copies });
                if (!result?.success) throw new Error(result?.error || 'The selected receipt printer could not print.');
                return result;
            }
            return await printBrowserHtml(`<!doctype html><html><head><meta charset="utf-8"><title>${escapePrintText(document.title)}</title>
                <style>body { margin: 0; width: ${width}; padding: 2mm; box-sizing: border-box; }
                pre { margin: 0; font: 12px monospace; white-space: pre-wrap; overflow-wrap: anywhere; }</style>
                </head><body><pre>${escapePrintText(text)}</pre></body></html>`, width);
        } catch (error) {
            window.dispatchEvent(new CustomEvent('amd:toast', { detail: { message: error.message, type: 'error' } }));
            return { success: false, error: error.message };
        }
    }

    static async printUrl(url, settings = this.getSettings()) {
        const data = this.normalizeSettings(settings);
        const target = await this.resolvePrintTarget(data);
        if (target.type !== 'thermal') {
            window.open(url, '_blank', 'noopener,noreferrer');
            return { success: true, transport: 'browser', windowOpened: true };
        }

        return new Promise(resolve => {
            const frame = document.createElement('iframe');
            frame.title = 'Printable document';
            frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:1000px;border:0';
            const cleanup = () => frame.remove();
            const timeout = setTimeout(() => {
                cleanup();
                resolve({ success: false, error: 'The printable document did not load.' });
            }, 15000);
            frame.onload = async () => {
                clearTimeout(timeout);
                const result = await this.printPage(frame.contentDocument?.body, data);
                cleanup();
                resolve(result);
            };
            frame.src = url;
            document.body.appendChild(frame);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HARDWARE (VenQore Station)
    // ─────────────────────────────────────────────────────────────────────────

    static async printWithAMDStation(sale, settings, options = {}) {
        const receiptData = this._formatForStation(sale, settings);
        return await AMDStation.printAndOpenDrawer(receiptData, {
            openDrawer: options.openDrawer !== false && settings.thermal_open_drawer,
            printerName: options.printerName,
            copies:     options.copies || settings.thermal_copies || 1,
            paperWidth: settings.thermal_page_size === '2inch' ? '58mm' : (settings.thermal_page_size === '4inch' ? '100mm' : '80mm'),
            autoCut:    options.autoCut !== undefined ? options.autoCut : (settings.thermal_auto_cut !== false),
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETTINGS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Read settings — freshest source first.
     *  1. window.amdSettings (updated on Inertia navigation and successful saves)
     *  2. Inertia data-page attribute (initial boot fallback)
     */
    static getSettings() {
        let raw = {};
        try {
            const appEl = document.getElementById('app');
            if (appEl?.dataset?.page) {
                const pd = JSON.parse(appEl.dataset.page);
                if (pd?.props?.settings) {
                    raw = { ...pd.props.settings };
                }
                if (pd?.props?.store) {
                    raw.store_name = raw.store_name || pd.props.store.name;
                    raw.business_name = raw.business_name || pd.props.store.name;
                    raw.business_address = raw.business_address || pd.props.store.address;
                    raw.business_phone = raw.business_phone || pd.props.store.phone;
                    raw.business_email = raw.business_email || pd.props.store.email;
                    raw.print_logo_path = raw.print_logo_path || pd.props.store.logo_path || pd.props.store.logo_url;
                    raw.store_slug = pd.props.store.slug;
                }
            }
        } catch (_) { /* fall through */ }

        if (typeof window !== 'undefined' && window.amdSettings) {
            // Inertia's navigate event updates this snapshot. The root data-page
            // attribute only contains the initial boot payload, not later visits.
            raw = { ...raw, ...window.amdSettings };
        }
        const remembered = rememberedPrintType();
        if (remembered && !raw.default_print_type) {
            raw.default_print_type = remembered;
        }
        return this.normalizeSettings(raw);
    }

    /**
     * Convert raw DB strings ('0'/'1') to proper typed values.
     */
    static normalizeSettings(raw) {
        if (!raw) return {};
        const b = (v, def = false) => {
            if (typeof v === 'boolean') return v;
            if (v === true  || v === 1 || v === '1' || v === 'true'  || v === 'on')  return true;
            if (v === false || v === 0 || v === '0' || v === 'false' || v === 'off') return false;
            return def;
        };
        const n = (v, def = 0)  => { const p = parseInt(v); return isNaN(p) ? def : p; };
        const s = (v, def = '') => (v == null ? def : String(v));

        const businessName = raw.business_name || raw.store_name || (typeof window !== 'undefined' ? (window.amdSettings?.business_name || window.amdSettings?.store_name) : '') || '';
        const businessAddress = raw.business_address || raw.store_address || (typeof window !== 'undefined' ? (window.amdSettings?.business_address || window.amdSettings?.store_address) : '') || '';
        const businessPhone = raw.business_phone || raw.store_phone || (typeof window !== 'undefined' ? (window.amdSettings?.business_phone || window.amdSettings?.store_phone) : '') || '';
        const businessEmail = raw.business_email || raw.store_email || (typeof window !== 'undefined' ? (window.amdSettings?.business_email || window.amdSettings?.store_email) : '') || '';
        const logoCandidate = raw.print_logo_path || raw.logo_path || raw.logo_url || (typeof window !== 'undefined' ? (window.amdSettings?.print_logo_path || window.amdSettings?.logo_path || window.amdSettings?.logo_url) : '') || null;

        return {
            ...raw,
            // Business
            business_name:    s(businessName),
            business_address: s(businessAddress),
            business_phone:   s(businessPhone),
            business_email:   s(businessEmail),
            tax_number:       s(raw.tax_number || (typeof window !== 'undefined' ? window.amdSettings?.tax_number : '')),
            sale_prefix:      s(raw.sale_prefix, 'INV-'),
            currency:         s(raw.currency || (typeof window !== 'undefined' ? window.amdSettings?.currency : 'PKR'), 'PKR'),
            currency_symbol:  s(raw.currency_symbol || (typeof window !== 'undefined' ? window.amdSettings?.currency_symbol : 'Rs'), 'Rs'),
            decimal_places:   n(raw.decimal_places !== undefined ? raw.decimal_places : (typeof window !== 'undefined' ? window.amdSettings?.decimal_places : 2), 2),

            // Regular print
            paper_size:             s(raw.paper_size, 'A4'),
            paper_orientation:      s(raw.paper_orientation, 'Portrait'),
            print_theme:            s(raw.print_theme, 'modern'),
            print_theme_color:      s(raw.print_theme_color, vq.indigo[600]),
            print_logo:             b(raw.print_logo, true),
            print_logo_path: (() => {
                const p = logoCandidate;
                if (!p) return null;
                if (/^(https?|blob|data):/.test(p)) return p;
                if (typeof window !== 'undefined' && window.location) {
                    return `${window.location.origin}${p.startsWith('/') ? p : '/' + p}`;
                }
                return p;
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
            print_qr_code:             b(raw.print_qr_code, true),
            print_show_delivery_charge: b(raw.print_show_delivery_charge, true),
            print_show_extra_charge:    b(raw.print_show_extra_charge, true),

            // Regular totals/footer
            print_total_quantity:  b(raw.print_total_quantity, true),
            print_amount_decimal:  b(raw.print_amount_decimal, true),
            print_received_amount: b(raw.print_received_amount, true),
            print_balance_amount:  b(raw.print_balance_amount, true),
            print_tax_details:     b(raw.print_tax_details, true),
            print_you_saved:       b(raw.print_you_saved, false),
            print_show_previous_balance: b(raw.print_show_previous_balance, false),
            print_amount_words:    s(raw.print_amount_words, '0'),
            print_terms:           s(raw.print_terms, ''),
            print_header_all_pages:b(raw.print_header_all_pages, true),
            print_payment_mode:    b(raw.print_payment_mode, true),
            print_party_balance:   b(raw.print_party_balance, false),
            print_amount_grouping: b(raw.print_amount_grouping, true),
            print_received_by:     b(raw.print_received_by, false),
            print_delivered_by:    b(raw.print_delivered_by, false),
            print_acknowledgement: b(raw.print_acknowledgement, false),
            print_extra_space_top: n(raw.print_extra_space_top, 0),
            print_min_item_rows:   n(raw.print_min_item_rows, 5),
            print_description:     b(raw.print_description, true),

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
            thermal_custom_chars:   n(raw.thermal_custom_chars, 48),
            thermal_show_mfg_date:  b(raw.thermal_show_mfg_date, false),
            thermal_show_size:      b(raw.thermal_show_size, false),
            thermal_show_model:     b(raw.thermal_show_model, false),
            thermal_show_serial:    b(raw.thermal_show_serial, false),
            thermal_extra_lines:    n(raw.thermal_extra_lines, 3),

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
        const sizes = { A4: [210, 297], A5: [148, 210], Letter: [216, 279], Legal: [216, 356] };
        const size = data.paper_size === 'Custom'
            ? [parseFloat(data.custom_paper_width) || 210, parseFloat(data.custom_paper_height) || 297]
            : (sizes[data.paper_size] || sizes.A4);
        return size[data.paper_orientation === 'Landscape' ? 1 : 0];
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
        const copies = parseInt(isThermal ? (data?.thermal_copies || 1) : (data?.print_copies || 1)) || 1;
        let contentHtml = '';
        for (let c = 0; c < copies; c++) {
            contentHtml += `<div class="print-copy-wrapper" style="${c > 0 ? (isThermal ? 'break-before: page;' : 'page-break-before: always;') : ''}">${previewHtml}</div>`;
        }

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${String(title ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</title>
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
<body>${contentHtml}</body>
</html>`;
    }

    /**
     * Open a hidden iframe and trigger the browser print dialog.
     * The @page size is already correct in the HTML — no post-hoc measurement.
     */
    static _openPrintWindow(html, type, widthMm) {
        return printBrowserHtml(html, null).then(result => ({ ...result, transport: 'browser' }));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VenQore Station helpers
    // ─────────────────────────────────────────────────────────────────────────

    static _formatForStation(sale, settings) {
        const items = sale.items || sale.cart || [];
        const money = value => formatNumber(value, null, settings);
        const total = Number(sale.invoice_total ?? sale.total ?? sale.total_amount ?? 0);
        const paid = Number(sale.paid_amount ?? sale.amount_paid ?? sale.paid ?? 0);
        return {
            businessName: settings.business_name || 'VenQore Store',
            businessAddress: settings.business_address,
            businessPhone: settings.business_phone,
            currencySymbol: getCurrencySymbol(settings) + ' ',
            invoiceNumber: sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id,
            ticketCode: sale.ticket_code || sale.token_no || sale.order_number || (sale.table ? (sale.table.name || sale.table.code || 'Table ' + sale.table.id) : (sale.reference_number || sale.invoice_no || null)),
            date: sale.created_at || new Date().toLocaleString(),
            customerName: sale.customer?.name || 'Walk-in Customer',
            items: items.map(item => {
                const qty = Number(item.quantity ?? item.qty ?? 1);
                const price = Number(item.original_price ?? item.unit_price ?? item.price ?? 0);
                const netPrice = Number(item.price ?? item.unit_price ?? price);
                const discount = Number(item.discount_amount ?? (item.original_price && item.price && Number(item.original_price) > Number(item.price) ? (Number(item.original_price) - Number(item.price)) * qty : (item.discount ? Number(item.discount) * qty : 0)));
                return {
                    name: withAddOns(item.product?.name || item.name || item.description || 'Item', item),
                    qty, price: money(price),
                    total: money(item.net_amount ?? (item.line_total != null ? Number(item.line_total) - Number(item.tax_amount ?? 0) : qty * netPrice - discount)),
                };
            }),
            subtotal: money(sale.subtotal_gross ?? sale.subtotal ?? items.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 1) * Number(item.unit_price ?? item.price ?? 0), 0)),
            tax: money(sale.total_tax ?? sale.tax ?? sale.tax_amount ?? 0),
            discount: money(sale.total_item_discounts ?? sale.discount ?? 0),
            serviceCharge: money(sale.service_charge ?? 0),
            tipAmount: money(sale.tip_amount ?? 0),
            deliveryCharge: money(sale.delivery_charge ?? sale.shipping_charges ?? 0),
            roundOff: money(sale.round_off ?? 0),
            total: money(total),
            paidAmount: money(paid),
            changeAmount: money(sale.change ?? Math.max(0, paid - total)),
            balanceAmount: money(Math.max(0, total - paid)),
            footerMessage: settings.print_terms || settings.thermal_custom_footer || 'Thank you!',
            showBarcode: settings.thermal_show_barcode !== false,
        };
    }
}

export default PrintService;
