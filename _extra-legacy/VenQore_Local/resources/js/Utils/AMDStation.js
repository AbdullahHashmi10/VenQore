/**
 * VenQore Station Bridge - React Utility
 * Connects your React app to VenQore Station for hardware control
 * 
 * Usage:
 *   import { AMDStation, useAMDStation } from '@/Utils/AMDStation';
 *   
 *   // In component:
 *   const { isConnected, print, openDrawer, printers } = useAMDStation();
 *   
 *   // Or direct:
 *   await AMDStation.print(receiptData);
 *   await AMDStation.openDrawer();
 */

import { useState, useEffect } from 'react';

/**
 * Check if VenQore Station is available
 */
export function isAMDStationAvailable() {
    return typeof window !== 'undefined' && window.amdAPI !== undefined;
}

/**
 * VenQore Station API wrapper
 */
export const AMDStation = {
    /**
     * Check if running in VenQore Station
     */
    async check() {
        if (!isAMDStationAvailable()) {
            return { isAMDStation: false };
        }
        try {
            return await window.amdAPI.check();
        } catch (e) {
            console.error('[AMDStation] Check failed:', e);
            return { isAMDStation: false };
        }
    },

    /**
     * Get available printers
     */
    async getPrinters() {
        if (!isAMDStationAvailable()) {
            return [];
        }
        try {
            return await window.amdAPI.getPrinters();
        } catch (e) {
            console.error('[AMDStation] Get printers failed:', e);
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
            console.error('[AMDStation] Set printer failed:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Print receipt with hardware control
     * Falls back to browser print if not in VenQore Station
     */
    async print(data, options = {}) {
        if (isAMDStationAvailable()) {
            // Use VenQore Station for silent printing
            const printData = {
                content: this.formatReceiptData(data),
                printerName: options.printerName,
                copies: options.copies || 1,
                paperWidth: options.paperWidth || '80mm',
            };

            try {
                const result = await window.amdAPI.print(printData);
                return result;
            } catch (e) {
                console.error('[AMDStation] Print failed:', e);
                return { success: false, error: e.message };
            }
        } else {
            // Fallback to browser print
            console.log('[AMDStation] Not available, using browser print');
            window.print();
            return { success: true, fallback: true };
        }
    },

    /**
     * Open cash drawer
     */
    async openDrawer(printerName) {
        if (!isAMDStationAvailable()) {
            console.warn('[AMDStation] Cash drawer not available in browser');
            return { success: false, error: 'Cash drawer requires VenQore Station' };
        }

        try {
            return await window.amdAPI.openDrawer(printerName);
        } catch (e) {
            console.error('[AMDStation] Drawer failed:', e);
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
        // If already formatted, return as-is
        if (Array.isArray(data) && data[0]?.type) {
            return data;
        }

        // Convert simple object to print format
        const content = [];

        // Header
        if (data.businessName) {
            content.push({
                type: 'text',
                value: data.businessName,
                style: { fontWeight: '700', textAlign: 'center', fontSize: '24px' }
            });
        }

        if (data.businessAddress) {
            content.push({
                type: 'text',
                value: data.businessAddress,
                style: { textAlign: 'center', fontSize: '12px' }
            });
        }

        if (data.businessPhone) {
            content.push({
                type: 'text',
                value: data.businessPhone,
                style: { textAlign: 'center', fontSize: '12px' }
            });
        }

        // Divider
        content.push({
            type: 'text',
            value: '--------------------------------',
            style: { textAlign: 'center' }
        });

        // Invoice info
        if (data.invoiceNumber) {
            content.push({
                type: 'text',
                value: `Invoice: ${data.invoiceNumber}`,
                style: { fontSize: '14px' }
            });
        }

        if (data.date) {
            content.push({
                type: 'text',
                value: `Date: ${data.date}`,
                style: { fontSize: '12px' }
            });
        }

        if (data.customerName) {
            content.push({
                type: 'text',
                value: `Customer: ${data.customerName}`,
                style: { fontSize: '12px' }
            });
        }

        // Divider
        content.push({
            type: 'text',
            value: '--------------------------------',
            style: { textAlign: 'center' }
        });

        // Items
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item, index) => {
                content.push({
                    type: 'text',
                    value: item.name,
                    style: { fontSize: '13px' }
                });
                content.push({
                    type: 'text',
                    value: `${item.qty} x ${item.price} = ${item.total}`,
                    style: { textAlign: 'right', fontSize: '12px' }
                });
            });
        }

        // Divider
        content.push({
            type: 'text',
            value: '--------------------------------',
            style: { textAlign: 'center' }
        });

        const currencySymbol = data.currencySymbol || (window.amdSettings?.currency_symbol || '') + ' ';

        // Totals
        if (data.subtotal !== undefined) {
            content.push({
                type: 'text',
                value: `Subtotal: ${currencySymbol}${data.subtotal}`,
                style: { textAlign: 'right' }
            });
        }

        if (data.tax !== undefined && data.tax > 0) {
            content.push({
                type: 'text',
                value: `Tax: ${currencySymbol}${data.tax}`,
                style: { textAlign: 'right', fontSize: '12px' }
            });
        }

        if (data.discount !== undefined && data.discount > 0) {
            content.push({
                type: 'text',
                value: `Discount: -${currencySymbol}${data.discount}`,
                style: { textAlign: 'right', fontSize: '12px' }
            });
        }

        content.push({
            type: 'text',
            value: `TOTAL: ${currencySymbol}${data.total}`,
            style: { fontWeight: '700', textAlign: 'right', fontSize: '18px' }
        });

        if (data.paidAmount !== undefined) {
            content.push({
                type: 'text',
                value: `Paid: ${window.amdSettings?.currency_symbol || ''} ${data.paidAmount}`,
                style: { textAlign: 'right' }
            });
        }

        if (data.changeAmount !== undefined && data.changeAmount > 0) {
            content.push({
                type: 'text',
                value: `Change: ${window.amdSettings?.currency_symbol || ''} ${data.changeAmount}`,
                style: { textAlign: 'right' }
            });
        }

        // Footer
        content.push({
            type: 'text',
            value: '--------------------------------',
            style: { textAlign: 'center' }
        });

        content.push({
            type: 'text',
            value: 'Thank You!',
            style: { fontWeight: '700', textAlign: 'center', fontSize: '16px' }
        });

        if (data.footerMessage) {
            content.push({
                type: 'text',
                value: data.footerMessage,
                style: { textAlign: 'center', fontSize: '11px' }
            });
        }

        // Barcode (If using electron-pos-printer supported format)
        if (data.showBarcode && data.invoiceNumber) {
            content.push({
                type: 'barCode',
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

/**
 * React Hook for VenQore Station
 */
export function useAMDStation() {
    const [isConnected, setIsConnected] = useState(false);
    const [printers, setPrinters] = useState([]);
    const [defaultPrinter, setDefaultPrinter] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            const status = await AMDStation.check();
            setIsConnected(status.isAMDStation);

            if (status.isAMDStation) {
                const printerList = await AMDStation.getPrinters();
                setPrinters(printerList);

                // Set first thermal printer as default, or first available
                const thermal = printerList.find(p =>
                    p.name.toLowerCase().includes('thermal') ||
                    p.name.toLowerCase().includes('pos') ||
                    p.name.toLowerCase().includes('receipt')
                );
                const printer = thermal || printerList.find(p => p.isDefault) || printerList[0];
                if (printer) {
                    setDefaultPrinter(printer.name);
                    AMDStation.setDefaultPrinter(printer.name);
                }
            }

            setLoading(false);
        }

        init();

        // Listen for VenQore Station ready event
        const handleReady = (e) => {
            console.log('[AMDStation Hook] Station ready:', e.detail);
            init();
        };
        window.addEventListener('amd-station-ready', handleReady);

        return () => {
            window.removeEventListener('amd-station-ready', handleReady);
        };
    }, []);

    return {
        isConnected,
        loading,
        printers,
        defaultPrinter,
        setDefaultPrinter: async (name) => {
            setDefaultPrinter(name);
            return AMDStation.setDefaultPrinter(name);
        },
        print: (data, options) => AMDStation.print(data, { ...options, printerName: options?.printerName || defaultPrinter }),
        openDrawer: () => AMDStation.openDrawer(defaultPrinter),
        printAndOpenDrawer: (data, options) => AMDStation.printAndOpenDrawer(data, { ...options, printerName: options?.printerName || defaultPrinter }),
    };
}

export default AMDStation;
