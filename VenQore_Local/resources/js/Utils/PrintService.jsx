/**
 * VENQORE Print Service
 * 
 * Comprehensive printing utility supporting:
 * - Regular A4/Letter printing (HTML-based)
 * - Thermal receipt printing (58mm/80mm)
 * - VenQore Station hardware integration (silent print, auto-cut, cash drawer)
 * 
 * This service is the single orchestration layer for all print operations.
 * It uses the PrintPreview component as the single source of truth for rendering.
 */

import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { formatNumber, numberToWords } from './format';
import { AMDStation, isAMDStationAvailable } from './AMDStation';
import PrintPreview from '@/Components/PrintPreview';

class PrintService {
    /**
     * Main entry point for printing invoices/receipts
     * @param {Object} sale - Sale object with items, customer, totals
     * @param {Object} settings - Business settings (name, address, logo, etc.)
     * @param {string} type - 'regular' or 'thermal'
     * @param {Object} options - Additional options (openDrawer, copies)
     */
    static async printInvoice(sale, settings = {}, type = 'regular', options = {}) {
        // Always normalize settings - they may come as raw strings from the backend
        // (window.amdSettings, Inertia shared props) or as proper booleans (Settings.jsx form)
        const data = this.normalizeSettings(settings);

        // For thermal printing, try VenQore Station first (silent printing with hardware control)
        if (type === 'thermal' && isAMDStationAvailable()) {
            try {
                return await this.printWithAMDStation(sale, data, options);
            } catch (e) {
                console.error('[PrintService] AMD Station failed, falling back to browser:', e);
            }
        }

        // Common print execution via ReactDOMServer
        const isThermal = type === 'thermal';
        const MM_TO_PX = 3;
        let width;

        if (isThermal) {
            if (data.thermal_page_size === '2inch') width = 58 * MM_TO_PX;
            else if (data.thermal_page_size === '4inch') width = 100 * MM_TO_PX;
            else width = 80 * MM_TO_PX;
        } else {
            const paperSizes = { 'A4': 210, 'A5': 148, 'Letter': 216, 'Legal': 216 };
            const pW = data.paper_size === 'Custom'
                ? (parseFloat(data.custom_paper_width) || 210)
                : (paperSizes[data.paper_size] || 210);
            width = data.paper_orientation === 'Landscape'
                ? (data.paper_size === 'A4' ? 297 : pW) * MM_TO_PX
                : pW * MM_TO_PX;
        }

        // Render via the single source of truth: PrintPreview component (with NORMALIZED data)
        const rootNode = document.createElement('div');
        const root = createRoot(rootNode);
        flushSync(() => {
            root.render(
                <PrintPreview data={data} sale={sale} type={type} mode="light" forPrint={true} />
            );
        });
        const previewHtml = rootNode.innerHTML;
        root.unmount();

        // Inject current styles
        const allStyles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules || []).map(r => r.cssText).join('\n');
                } catch { return ''; }
            })
            .join('\n');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${sale?.reference_number || sale?.invoice_no || sale?.id || ''}</title>
  <style>
    ${allStyles}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 16px; background: white; display: flex; justify-content: center; }
    @page {
      margin: ${data.margin_top || 0}mm ${data.margin_right || 0}mm ${data.margin_bottom || 0}mm ${data.margin_left || 0}mm;
      ${isThermal ? `size: ${width / MM_TO_PX}mm auto;` : `size: ${data.paper_size || 'A4'} ${data.paper_orientation === 'Landscape' ? 'landscape' : 'portrait'};`}
    }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${previewHtml}</body>
</html>`;

        this.openPrintWindow(html, type);
    }


    /**
     * Print using VenQore Station (silent thermal printing with hardware control)
     */
    static async printWithAMDStation(sale, settings, options = {}) {
        const receiptData = this.formatSaleForAMDStation(sale, settings);
        return await AMDStation.printAndOpenDrawer(receiptData, {
            openDrawer: options.openDrawer !== false && settings.thermal_open_drawer,
            copies: options.copies || settings.thermal_copies || 1,
            paperWidth: settings.thermal_page_size === '2inch' ? '58mm' : '80mm',
        });
    }

    /**
     * Format sale data for VenQore Station hardware bridge
     */
    static formatSaleForAMDStation(sale, settings) {
        const items = sale.items || sale.cart || [];
        return {
            businessName: settings.business_name || 'VenQore Store',
            businessAddress: settings.business_address,
            businessPhone: settings.business_phone,
            invoiceNumber: sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id,
            date: sale.created_at || new Date().toLocaleString(),
            customerName: sale.customer?.name || 'Walk-in Customer',
            items: items.map(item => ({
                name: item.product?.name || item.name,
                qty: item.quantity || item.qty || 1,
                price: formatNumber(item.unit_price || item.price || 0),
                total: formatNumber((item.unit_price || item.price || 0) * (item.quantity || item.qty || 1)),
            })),
            subtotal: formatNumber(sale.subtotal || items.reduce((sum, i) => sum + ((i.quantity || i.qty || 1) * (i.unit_price || i.price || 0)), 0)),
            tax: formatNumber(sale.tax || sale.tax_amount || 0),
            discount: formatNumber(sale.discount || 0),
            total: formatNumber(sale.total || sale.total_amount),
            paidAmount: formatNumber(sale.paid || sale.amount_paid || sale.total),
            changeAmount: formatNumber(sale.change || 0),
            balanceAmount: formatNumber(sale.balance || 0),
            footerMessage: settings.print_terms || settings.thermal_custom_footer || 'Thank you!',
            showBarcode: settings.thermal_show_barcode !== false,
        };
    }

    /**
     * Opens a new window and triggers print
     */
    static openPrintWindow(html, type = 'regular') {
        const isThermal = type === 'thermal';
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.name = 'printFrame';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        // Helper to trigger print
        const triggerPrint = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Cleanup after a delay
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            }
        };

        // Wait for all images in the iframe to load before printing
        const images = iframe.contentWindow.document.getElementsByTagName('img');
        if (images.length === 0) {
            // No images, print after a short delay for styles
            setTimeout(triggerPrint, isThermal ? 600 : 300);
        } else {
            let loadedCount = 0;
            const total = images.length;
            const onImageLoad = () => {
                loadedCount++;
                if (loadedCount >= total) {
                    // All images loaded, wait a tiny bit more for layout stabilization
                    setTimeout(triggerPrint, 200);
                }
            };

            for (let i = 0; i < total; i++) {
                if (images[i].complete) {
                    onImageLoad();
                } else {
                    images[i].addEventListener('load', onImageLoad);
                    images[i].addEventListener('error', onImageLoad); // count errors as "done" too
                }
            }

            // Safety timeout (max 3 seconds)
            setTimeout(triggerPrint, 3000);
        }
    }

    /**
     * Normalize raw backend settings strings to proper typed booleans/numbers.
     * 
     * CRITICAL: window.amdSettings contains RAW strings from the database ('0'/'1').
     * PrintPreview (and Settings.jsx) expect properly typed booleans/numbers.
     * Without this normalization, checks like `data.thermal_show_barcode !== false`
     * will be TRUE even when the value is the string '0', causing settings to be ignored.
     * 
     * This mirrors the exact mapping in Settings.jsx -> useForm initialData.
     */
    static normalizeSettings(raw) {
        if (!raw) return {};
        const b = (v, defaultOn = false) => {
            if (typeof v === 'boolean') return v;
            if (v === true || v === '1' || v === 'true' || v === 'on') return true;
            if (v === false || v === '0' || v === 'false' || v === 'off') return false;
            return defaultOn; // undefined/null: use default
        };
        const n = (v, def = 0) => {
            if (v === undefined || v === null || v === '') return def;
            const parsed = parseInt(v);
            return isNaN(parsed) ? def : parsed;
        };
        const s = (v, def = '') => {
            if (v === undefined || v === null) return def;
            return String(v);
        };

        return {
            ...raw, // keep any unlisted keys as-is

            // Business
            business_name: s(raw.business_name || raw.store_name),
            business_address: s(raw.business_address || raw.store_address),
            business_phone: s(raw.business_phone || raw.store_phone),
            business_email: s(raw.business_email),
            tax_number: s(raw.tax_number),
            sale_prefix: s(raw.sale_prefix, 'INV-'),
            currency: s(raw.currency, 'PKR'),
            currency_symbol: s(raw.currency_symbol, 'Rs'),
            decimal_places: n(raw.decimal_places, 0),

            // Regular Print
            paper_size: s(raw.paper_size, 'A4'),
            paper_orientation: s(raw.paper_orientation, 'Portrait'),
            print_theme: s(raw.print_theme, 'modern'),
            print_theme_color: s(raw.print_theme_color, '#4f46e5'),
            print_logo: b(raw.print_logo, true),
            print_logo_path: (() => {
                const path = raw.print_logo_path || null;
                if (!path) return null;
                if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
                const cleanPath = path.startsWith('/') ? path : `/${path}`;
                return `${window.location.origin}${cleanPath}`;
            })(),
            print_signature_text: s(raw.print_signature_text, 'Authorized Signatory'),
            print_original_copy: b(raw.print_original_copy, false),
            print_company_text_size: s(raw.print_company_text_size, '4'),
            print_invoice_text_size: s(raw.print_invoice_text_size, '3'),
            margin_top: n(raw.margin_top, 20),
            margin_bottom: n(raw.margin_bottom, 20),
            margin_left: n(raw.margin_left, 20),
            margin_right: n(raw.margin_right, 20),
            custom_paper_width: n(raw.custom_paper_width, 210),
            custom_paper_height: n(raw.custom_paper_height, 297),

            // Regular column toggles
            print_show_sno: b(raw.print_show_sno, true),
            print_show_units: b(raw.print_show_units, true),
            print_show_mrp: b(raw.print_show_mrp, false),
            print_show_description: b(raw.print_show_description, true),
            print_show_hsn: b(raw.print_show_hsn, false),
            print_show_discount: b(raw.print_show_discount, false),

            // Regular totals & footer
            print_total_quantity: b(raw.print_total_quantity, true),
            print_amount_decimal: b(raw.print_amount_decimal, true),
            print_received_amount: b(raw.print_received_amount, true),
            print_balance_amount: b(raw.print_balance_amount, true),
            print_tax_details: b(raw.print_tax_details, true),
            print_you_saved: b(raw.print_you_saved, false),
            print_amount_words: s(raw.print_amount_words, '0'),
            print_terms: s(raw.print_terms, ''),
            print_header_all_pages: b(raw.print_header_all_pages, true),
            print_payment_mode: b(raw.print_payment_mode, true),

            // Thermal
            default_print_type: s(raw.default_print_type, 'regular'),
            thermal_page_size: s(raw.thermal_page_size, '3inch'),
            thermal_font_size: n(raw.thermal_font_size, 12),
            thermal_use_bold: b(raw.thermal_use_bold, true),
            thermal_auto_cut: b(raw.thermal_auto_cut, true),
            thermal_open_drawer: b(raw.thermal_open_drawer, false),
            thermal_copies: n(raw.thermal_copies, 1),

            // Thermal column toggles
            thermal_show_headers: b(raw.thermal_show_headers, false),
            thermal_show_sno: b(raw.thermal_show_sno, false),
            thermal_show_units: b(raw.thermal_show_units, false),
            thermal_show_mrp: b(raw.thermal_show_mrp, false),
            thermal_show_description: b(raw.thermal_show_description, false),
            thermal_show_batch: b(raw.thermal_show_batch, false),
            thermal_show_expiry: b(raw.thermal_show_expiry, false),
            thermal_show_barcode: b(raw.thermal_show_barcode, true), // ← THE KEY FIX
            thermal_custom_footer: s(raw.thermal_custom_footer, ''),

            // Shared print footer
            print_feed_lines: n(raw.print_feed_lines, 0),
        };
    }

    /**
     * Get and normalize settings from window global
     */
    static getSettings() {
        return this.normalizeSettings(window.amdSettings || {});
    }

    /**
     * Quick print current sale with auto-detected settings
     */
    static quickPrint(sale, type = null) {
        const settings = this.getSettings();
        const effectiveType = type || settings.default_print_type || 'regular';
        this.printInvoice(sale, settings, effectiveType);
    }

    /**
     * Print a custom report (Simplified)
     */
    static printReport(reportData, settings = {}, type = 'regular') {
        // For now, reports also use the modern window pipeline
        this.printInvoice(reportData, settings, type);
    }
}

export default PrintService;
