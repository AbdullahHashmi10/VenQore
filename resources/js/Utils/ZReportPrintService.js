/**
 * ZReportPrintService.js
 *
 * Formats and prints Register End-of-Shift Z-Reports on 80mm/58mm thermal printers.
 * Supports ESC/POS via AMDStation and clean browser thermal printing.
 */

import { AMDStation, isAMDStationAvailable } from './AMDStation';
import { formatCurrency } from './format';

export const ZReportPrintService = {
    /**
     * Print Z-Report
     * @param {Object} zReport - Z-report data from RegisterShiftController
     * @param {Object} options - { paperWidth: '80mm'|'58mm' }
     */
    async printZReport(zReport, options = {}) {
        if (!zReport) {
            console.warn('[ZReportPrintService] No Z-report data provided');
            return { success: false, error: 'Empty Z-report data' };
        }

        const paperWidth = options.paperWidth || '80mm';

        try {
            if (isAMDStationAvailable()) {
                const escPosContent = this.formatEscPos(zReport, { paperWidth });
                const result = await AMDStation.print(escPosContent, {
                    paperWidth,
                    copies: 1,
                    printerName: options.printerName,
                });

                if (result && result.success !== false) {
                    return { success: true, method: 'station' };
                }
            }

            // Fallback to iframe HTML print
            await this.printViaIframe(zReport, { paperWidth });
            return { success: true, method: 'browser' };
        } catch (err) {
            console.error('[ZReportPrintService] Print error:', err);
            return { success: false, error: err.message || 'Failed to print Z-Report' };
        }
    },

    /**
     * Format for ESC/POS Thermal Printers
     */
    formatEscPos(zReport, options = {}) {
        const ESC = '\x1B';
        const GS  = '\x1D';
        const LF  = '\n';

        const store = zReport.store || {};
        const shift = zReport.shift || {};
        const sales = zReport.sales || {};
        const recon = zReport.cash_reconciliation || {};
        const tenders = zReport.tenders || {};

        let text = '';
        // Initialize
        text += ESC + '@';
        // Center alignment
        text += ESC + 'a' + '\x01';
        // Double height & bold for title
        text += ESC + '!' + '\x18';
        text += (store.name || 'VENQORE POS').toUpperCase() + LF;
        text += ESC + '!' + '\x00'; // Normal
        if (store.address) text += store.address + LF;
        if (store.phone) text += 'Tel: ' + store.phone + LF;
        if (store.tax_number) text += 'TRN: ' + store.tax_number + LF;

        text += '================================' + LF;
        text += ESC + '!' + '\x08'; // Bold
        text += '*** REGISTER Z-REPORT ***' + LF;
        text += ESC + '!' + '\x00';
        text += '================================' + LF;

        // Left align
        text += ESC + 'a' + '\x00';
        text += `Shift ID   : #${shift.id}\n`;
        text += `Register   : ${shift.register_id || 'REG-1'}\n`;
        text += `Cashier    : ${shift.opened_by || 'Staff'}\n`;
        text += `Closed By  : ${shift.closed_by || 'Manager'}\n`;
        text += `Opened At  : ${shift.opened_at || '-'}\n`;
        text += `Closed At  : ${shift.closed_at || '-'}\n`;
        text += '--------------------------------\n';

        text += ESC + '!' + '\x08';
        text += 'SALES SUMMARY\n';
        text += ESC + '!' + '\x00';
        text += `Total Bills      : ${sales.count || 0}\n`;
        text += `Gross Sales      : ${formatCurrency(sales.gross_sales || 0)}\n`;
        text += `Discounts        : ${formatCurrency(sales.discounts || 0)}\n`;
        text += `Net Sales        : ${formatCurrency(sales.net_sales || 0)}\n`;
        text += `Tax Collected    : ${formatCurrency(sales.tax || 0)}\n`;
        if (sales.tips > 0) text += `Tips Collected   : ${formatCurrency(sales.tips)}\n`;
        if (sales.service_charges > 0) text += `Service Charge   : ${formatCurrency(sales.service_charges)}\n`;
        text += '--------------------------------\n';
        text += ESC + '!' + '\x08';
        text += `TOTAL REVENUE    : ${formatCurrency(sales.grand_total || 0)}\n`;
        text += ESC + '!' + '\x00';
        text += '--------------------------------\n';

        text += ESC + '!' + '\x08';
        text += 'PAYMENT BREAKDOWN\n';
        text += ESC + '!' + '\x00';
        text += `Cash             : ${formatCurrency(tenders.cash || 0)}\n`;
        text += `Card / Digital   : ${formatCurrency(tenders.card || 0)}\n`;
        text += `Credit (A/R)     : ${formatCurrency(tenders.credit || 0)}\n`;
        if (tenders.other > 0) text += `Other            : ${formatCurrency(tenders.other)}\n`;
        text += '--------------------------------\n';

        text += ESC + '!' + '\x08';
        text += 'CASH DRAWER RECONCILIATION\n';
        text += ESC + '!' + '\x00';
        text += `Opening Float    : ${formatCurrency(recon.opening_float || 0)}\n`;
        text += `+ Cash Sales     : ${formatCurrency(recon.cash_sales || 0)}\n`;
        text += `+ Cash In        : ${formatCurrency(recon.cash_in || 0)}\n`;
        text += `- Cash Out       : ${formatCurrency(recon.cash_out || 0)}\n`;
        text += `--------------------------------\n`;
        text += `Expected Cash    : ${formatCurrency(recon.expected_cash || 0)}\n`;
        text += `Actual Counted   : ${formatCurrency(recon.counted_cash || 0)}\n`;
        text += `--------------------------------\n`;
        text += ESC + '!' + '\x08';
        const varPrefix = recon.variance > 0 ? '+' : '';
        text += `VARIANCE (${recon.variance_type?.toUpperCase()}) : ${varPrefix}${formatCurrency(recon.variance || 0)}\n`;
        text += ESC + '!' + '\x00';
        text += '================================\n';
        text += `Printed: ${zReport.printed_at || new Date().toLocaleString()}\n`;
        text += '\n\n\n';
        text += GS + 'V' + '\x41' + '\x03'; // Cut paper

        return text;
    },

    /**
     * Print via Browser Iframe
     */
    printViaIframe(zReport, options = {}) {
        return new Promise((resolve, reject) => {
            const width = options.paperWidth === '58mm' ? '54mm' : '76mm';
            const store = zReport.store || {};
            const shift = zReport.shift || {};
            const sales = zReport.sales || {};
            const recon = zReport.cash_reconciliation || {};
            const tenders = zReport.tenders || {};
            const movements = zReport.movements || [];

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Z-Report #${shift.id}</title>
    <style>
        @page {
            size: ${width} auto;
            margin: 0;
        }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            width: ${width};
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
            background: #fff;
            line-height: 1.35;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
        .subtitle { font-size: 10px; margin-bottom: 4px; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .double-divider { border-top: 2px solid #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .section-header { font-weight: bold; text-transform: uppercase; margin: 6px 0 3px 0; font-size: 11px; }
        .highlight { background: #eee; padding: 2px 0; font-weight: bold; }
        .variance-balanced { color: #000; font-weight: bold; }
        .variance-shortage { color: #000; font-weight: bold; text-decoration: underline; }
        .variance-overage { color: #000; font-weight: bold; }
    </style>
</head>
<body>
    <div class="text-center">
        <div class="title">${store.name || 'VENQORE POS'}</div>
        ${store.address ? `<div class="subtitle">${store.address}</div>` : ''}
        ${store.phone ? `<div class="subtitle">Tel: ${store.phone}</div>` : ''}
        ${store.tax_number ? `<div class="subtitle">TRN: ${store.tax_number}</div>` : ''}
    </div>

    <div class="double-divider"></div>
    <div class="text-center bold" style="font-size: 13px; letter-spacing: 1px;">
        *** REGISTER Z-REPORT ***
    </div>
    <div class="double-divider"></div>

    <div class="row"><span>Shift ID:</span><span class="bold">#${shift.id}</span></div>
    <div class="row"><span>Register:</span><span>${shift.register_id || 'REG-1'}</span></div>
    <div class="row"><span>Opened By:</span><span>${shift.opened_by || 'Staff'}</span></div>
    <div class="row"><span>Closed By:</span><span>${shift.closed_by || 'Manager'}</span></div>
    <div class="row"><span>Opened At:</span><span>${shift.opened_at || '-'}</span></div>
    <div class="row"><span>Closed At:</span><span>${shift.closed_at || '-'}</span></div>

    <div class="divider"></div>
    <div class="section-header">Sales Summary</div>
    <div class="row"><span>Total Bills:</span><span>${sales.count || 0}</span></div>
    <div class="row"><span>Gross Sales:</span><span>${formatCurrency(sales.gross_sales || 0)}</span></div>
    <div class="row"><span>Discounts:</span><span>-${formatCurrency(sales.discounts || 0)}</span></div>
    <div class="row"><span>Net Sales:</span><span>${formatCurrency(sales.net_sales || 0)}</span></div>
    <div class="row"><span>Tax Collected:</span><span>${formatCurrency(sales.tax || 0)}</span></div>
    ${sales.tips > 0 ? `<div class="row"><span>Tips:</span><span>${formatCurrency(sales.tips)}</span></div>` : ''}
    ${sales.service_charges > 0 ? `<div class="row"><span>Service Charges:</span><span>${formatCurrency(sales.service_charges)}</span></div>` : ''}
    <div class="divider"></div>
    <div class="row highlight">
        <span>TOTAL REVENUE:</span>
        <span>${formatCurrency(sales.grand_total || 0)}</span>
    </div>

    <div class="divider"></div>
    <div class="section-header">Tenders / Payment Breakdown</div>
    <div class="row"><span>Cash:</span><span>${formatCurrency(tenders.cash || 0)}</span></div>
    <div class="row"><span>Card / Digital:</span><span>${formatCurrency(tenders.card || 0)}</span></div>
    <div class="row"><span>Credit (A/R):</span><span>${formatCurrency(tenders.credit || 0)}</span></div>
    ${tenders.other > 0 ? `<div class="row"><span>Other:</span><span>${formatCurrency(tenders.other)}</span></div>` : ''}

    <div class="divider"></div>
    <div class="section-header">Cash Drawer Reconciliation</div>
    <div class="row"><span>Opening Float:</span><span>${formatCurrency(recon.opening_float || 0)}</span></div>
    <div class="row"><span>+ Cash Sales:</span><span>${formatCurrency(recon.cash_sales || 0)}</span></div>
    <div class="row"><span>+ Pay-Ins (Cash In):</span><span>${formatCurrency(recon.cash_in || 0)}</span></div>
    <div class="row"><span>- Pay-Outs (Cash Out):</span><span>-${formatCurrency(recon.cash_out || 0)}</span></div>
    <div class="divider"></div>
    <div class="row"><span>Expected in Drawer:</span><span class="bold">${formatCurrency(recon.expected_cash || 0)}</span></div>
    <div class="row"><span>Actual Counted:</span><span class="bold">${formatCurrency(recon.counted_cash || 0)}</span></div>
    <div class="divider"></div>
    <div class="row highlight ${recon.variance < 0 ? 'variance-shortage' : recon.variance > 0 ? 'variance-overage' : 'variance-balanced'}">
        <span>VARIANCE (${recon.variance_type?.toUpperCase()}):</span>
        <span>${recon.variance > 0 ? '+' : ''}${formatCurrency(recon.variance || 0)}</span>
    </div>

    ${movements.length > 0 ? `
    <div class="divider"></div>
    <div class="section-header">Cash Movements Log</div>
    ${movements.map(m => `
        <div class="row" style="font-size: 10px;">
            <span>[${m.type.toUpperCase()}] ${m.reason}</span>
            <span>${m.type === 'in' ? '+' : '-'}${formatCurrency(m.amount)}</span>
        </div>
    `).join('')}
    ` : ''}

    ${shift.notes ? `
    <div class="divider"></div>
    <div class="section-header">Shift Notes</div>
    <div style="font-size: 10px; font-style: italic;">${shift.notes}</div>
    ` : ''}

    <div class="double-divider"></div>
    <div class="text-center" style="font-size: 9px; margin-top: 6px;">
        <div>Printed at ${zReport.printed_at || new Date().toLocaleString()}</div>
        <div>End of Shift Report</div>
    </div>
</body>
</html>
            `;

            let iframe = document.getElementById('z-report-print-iframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'z-report-print-iframe';
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);
            }

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();

            iframe.onload = () => {
                setTimeout(() => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                        resolve({ success: true, method: 'browser' });
                    } catch (e) {
                        reject(e);
                    }
                }, 300);
            };
        });
    }
};
