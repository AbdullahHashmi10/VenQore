/**
 * KitchenPrintService.js
 * 
 * Generates and prints Kitchen Order Tickets (KOT) on 80mm (default) or 58mm
 * thermal printers via ESC/POS (AMDStation) with iframe print fallback.
 * 
 * Rules:
 * 1. STRICTLY NO PRICES on kitchen dockets.
 * 2. High-contrast, large legible typography for grease/steam environments.
 * 3. Clear badges for DINE-IN, TAKEAWAY, DELIVERY.
 * 4. Distinct banners for ** REPRINT ** and ** CANCELLED **.
 * 5. Failure is loud — surfaces blocking errors with retry instead of silent console logs.
 */

import { AMDStation, isAMDStationAvailable } from './AMDStation';

export const KitchenPrintService = {
    /**
     * Print a KOT docket.
     * @param {Object} kotData - Formatted KOT payload from KitchenTicketService
     * @param {Object} options - { paperWidth: '80mm'|'58mm', isReprint: boolean, isCancellation: boolean }
     */
    async printKOT(kotData, options = {}) {
        if (!kotData || !kotData.items) {
            console.warn('[KitchenPrintService] No KOT data to print');
            return { success: false, error: 'Empty ticket data' };
        }

        const paperWidth = options.paperWidth || kotData.paper_width || '80mm';
        const isReprint = Boolean(options.isReprint || kotData.is_reprint);
        const isCancellation = Boolean(options.isCancellation || kotData.is_cancellation);

        try {
            if (isAMDStationAvailable()) {
                const escPosContent = this.formatEscPos(kotData, { paperWidth, isReprint, isCancellation });
                const result = await AMDStation.print(escPosContent, {
                    paperWidth,
                    copies: options.copies || 1,
                    printerName: options.printerName,
                });

                if (result && result.success !== false) {
                    return { success: true, method: 'station' };
                }

                // If station returned failure, throw error to trigger loud alert
                throw new Error(result?.error || 'Station printer failed to answer');
            } else {
                // Fallback to browser thermal iframe print
                await this.printViaIframe(kotData, { paperWidth, isReprint, isCancellation });
                return { success: true, method: 'browser' };
            }
        } catch (err) {
            console.error('[KitchenPrintService] Loud failure:', err);

            const failureDetail = {
                kot: kotData,
                options,
                error: err.message || 'Thermal printer communication failed',
                retry: () => this.printKOT(kotData, options),
            };

            // Dispatch global event so the POS or KDS UI can display a blocking modal
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('kot:print-failed', { detail: failureDetail }));
            }

            return { success: false, error: failureDetail.error, retry: failureDetail.retry };
        }
    },

    /**
     * Format structured docket for electron-pos-printer / AMDStation ESC/POS
     */
    formatEscPos(kot, { paperWidth, isReprint, isCancellation }) {
        const is58 = paperWidth === '58mm';
        const widthChars = is58 ? 32 : 48;
        const lineSep = '-'.repeat(widthChars);
        const dblSep = '='.repeat(widthChars);

        const content = [];

        // Urgent warning banner for cancellation or reprint
        if (isCancellation) {
            content.push({
                type: 'text',
                value: '*** CANCELLED ***',
                style: { fontWeight: '900', textAlign: 'center', fontSize: '22px' }
            });
            content.push({
                type: 'text',
                value: 'DO NOT PREPARE VOIDED ITEMS',
                style: { fontWeight: '700', textAlign: 'center', fontSize: '13px' }
            });
        } else if (isReprint) {
            content.push({
                type: 'text',
                value: '*** REPRINT ***',
                style: { fontWeight: '900', textAlign: 'center', fontSize: '20px' }
            });
            content.push({
                type: 'text',
                value: 'DUPLICATE TICKET - CHECK IF ALREADY COOKED',
                style: { fontWeight: '700', textAlign: 'center', fontSize: '12px' }
            });
        }

        // Large Order Type banner
        const orderType = (kot.order_type_badge || kot.order_type || 'DINE-IN').toUpperCase();
        content.push({
            type: 'text',
            value: `[ ${orderType} ]`,
            style: { fontWeight: '900', textAlign: 'center', fontSize: '24px', margin: '4px 0' }
        });

        // Table / Ticket #
        const locationStr = kot.table_number ? `TABLE: ${kot.table_number}` : `ORDER: ${kot.order_number}`;
        content.push({
            type: 'text',
            value: locationStr,
            style: { fontWeight: '800', textAlign: 'center', fontSize: '20px' }
        });

        if (kot.customer_name) {
            content.push({
                type: 'text',
                value: `Guest: ${kot.customer_name}`,
                style: { textAlign: 'center', fontSize: '14px' }
            });
        }

        content.push({ type: 'text', value: dblSep, style: { textAlign: 'center' } });

        // Metadata row
        content.push({
            type: 'text',
            value: `Ticket: ${kot.order_number}   Server: ${kot.server_name || 'Staff'}`,
            style: { fontSize: '13px' }
        });
        content.push({
            type: 'text',
            value: `Fired: ${kot.fired_at_human || new Date().toLocaleTimeString()}`,
            style: { fontSize: '13px' }
        });

        content.push({ type: 'text', value: lineSep, style: { textAlign: 'center' } });

        // Items List (STRICTLY NO PRICES)
        (kot.items || []).forEach(item => {
            const qty = item.qty || 1;
            content.push({
                type: 'text',
                value: `${qty}x  ${item.name}`,
                style: { fontWeight: '800', fontSize: '18px', margin: '2px 0' }
            });

            // Modifiers
            if (Array.isArray(item.modifiers) && item.modifiers.length > 0) {
                content.push({
                    type: 'text',
                    value: `   * ${item.modifiers.join(', ')}`,
                    style: { fontSize: '14px', fontStyle: 'italic' }
                });
            }

            // Line Notes
            if (item.notes) {
                content.push({
                    type: 'text',
                    value: `   Note: "${item.notes}"`,
                    style: { fontSize: '14px', fontWeight: '700' }
                });
            }
        });

        content.push({ type: 'text', value: lineSep, style: { textAlign: 'center' } });

        // Footer timestamp
        content.push({
            type: 'text',
            value: `End of Ticket · ${new Date().toLocaleTimeString()}`,
            style: { textAlign: 'center', fontSize: '12px', margin: '6px 0 12px 0' }
        });

        return content;
    },

    /**
     * Browser / Hidden Iframe Thermal Fallback
     */
    printViaIframe(kot, { paperWidth, isReprint, isCancellation }) {
        return new Promise((resolve, reject) => {
            try {
                const widthMm = paperWidth === '58mm' ? '48mm' : '72mm';
                const totalWidthMm = paperWidth === '58mm' ? '58mm' : '80mm';

                const iframeId = 'kot-silent-print-frame';
                let iframe = document.getElementById(iframeId);
                if (iframe) iframe.remove();

                iframe = document.createElement('iframe');
                iframe.id = iframeId;
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = 'none';
                iframe.style.visibility = 'hidden';
                document.body.appendChild(iframe);

                const orderType = (kot.order_type_badge || kot.order_type || 'DINE-IN').toUpperCase();

                const itemsHtml = (kot.items || []).map(item => `
                    <div style="margin: 6px 0; border-bottom: 1px dashed #bbb; padding-bottom: 4px;">
                        <div style="font-size: 18px; font-weight: 900; line-height: 1.2;">
                            <span style="display: inline-block; min-width: 28px;">${item.qty}x</span>
                            <span>${item.name}</span>
                        </div>
                        ${item.modifiers && item.modifiers.length > 0 ? `
                            <div style="font-size: 13px; font-style: italic; margin-left: 28px; margin-top: 2px;">
                                * ${item.modifiers.join(', ')}
                            </div>
                        ` : ''}
                        ${item.notes ? `
                            <div style="font-size: 13px; font-weight: 700; margin-left: 28px; margin-top: 2px; color: #111;">
                                Note: "${item.notes}"
                            </div>
                        ` : ''}
                    </div>
                `).join('');

                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>KOT #${kot.order_number}</title>
                        <style>
                            @page {
                                size: ${totalWidthMm} auto;
                                margin: 0;
                            }
                            body {
                                width: ${widthMm};
                                margin: 0 auto;
                                padding: 6px 2px;
                                font-family: 'Courier New', Courier, monospace, sans-serif;
                                color: #000;
                                background: #fff;
                                font-size: 13px;
                                line-height: 1.3;
                            }
                            .center { text-align: center; }
                            .bold { font-weight: bold; }
                            .sep { border-top: 1px solid #000; margin: 6px 0; }
                            .dbl-sep { border-top: 2px solid #000; margin: 6px 0; }
                            .banner {
                                font-size: 22px;
                                font-weight: 900;
                                text-align: center;
                                padding: 4px;
                                border: 2px solid #000;
                                margin-bottom: 6px;
                            }
                            .alert-banner {
                                background: #000;
                                color: #fff;
                                padding: 4px;
                                text-align: center;
                                font-size: 18px;
                                font-weight: 900;
                                margin-bottom: 6px;
                            }
                        </style>
                    </head>
                    <body>
                        ${isCancellation ? `
                            <div class="alert-banner">*** CANCELLED ***</div>
                            <div class="center bold" style="font-size: 12px;">VOIDED ITEMS - DO NOT COOK</div>
                        ` : ''}
                        ${isReprint ? `
                            <div class="alert-banner">*** REPRINT ***</div>
                            <div class="center bold" style="font-size: 12px;">DUPLICATE - CHECK IF PREPARED</div>
                        ` : ''}

                        <div class="banner">[ ${orderType} ]</div>
                        <div class="center" style="font-size: 20px; font-weight: 900;">
                            ${kot.table_number ? `TABLE: ${kot.table_number}` : `ORDER: ${kot.order_number}`}
                        </div>
                        ${kot.customer_name ? `<div class="center bold">Guest: ${kot.customer_name}</div>` : ''}

                        <div class="dbl-sep"></div>

                        <div><b>Ticket:</b> ${kot.order_number} &nbsp; <b>Server:</b> ${kot.server_name || 'Staff'}</div>
                        <div><b>Fired:</b> ${kot.fired_at_human || new Date().toLocaleTimeString()}</div>

                        <div class="sep"></div>

                        <div class="items">
                            ${itemsHtml}
                        </div>

                        <div class="sep"></div>
                        <div class="center" style="font-size: 11px; margin-top: 8px;">
                            End of Ticket · ${new Date().toLocaleTimeString()}
                        </div>
                    </body>
                    </html>
                `;

                const doc = iframe.contentWindow.document;
                doc.open();
                doc.write(html);
                doc.close();

                setTimeout(() => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                        resolve(true);
                    } catch (e) {
                        reject(e);
                    }
                }, 250);
            } catch (err) {
                reject(err);
            }
        });
    }
};

export default KitchenPrintService;
