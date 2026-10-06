/**
 * VenQore Station Bridge - React Utility (SaaS Cloud Edition)
 * Connects your React app to VenQore Station for hardware control.
 * The station is a hardware bridge to the cloud — no local server.
 *
 * Usage:
 *   import { AMDStation, useAMDStation } from '@/Utils/AMDStation';
 *
 *   const { isConnected, print, openDrawer } = useAMDStation();
 *   await AMDStation.print(receiptData);
 *   await AMDStation.openDrawer();
 *
 *   // Register terminal ID after login:
 *   AMDStation.registerTerminal(user.terminal_id);
 */

import { useState, useEffect } from 'react';

/**
 * Check if VenQore Station is available
 */
export function isAMDStationAvailable() {
    return typeof window !== 'undefined' && window.amdAPI !== undefined;
}

/**
 * What is wrong with a printer, in words a cashier can act on — or null if it is fine / unknown.
 * `hw` is the Station hardware status. `role` is 'receipt' | 'kitchen' | 'bar' | 'takeaway' | 'label' | 'document'.
 */
export function describePrinterProblem(hw, role = 'receipt') {
    if (!hw || !Array.isArray(hw.printers)) return null;
    const roles = Array.isArray(hw.printRoles) ? hw.printRoles : [];
    const cfg = roles.find(r => r.role === role);
    const name = (cfg && cfg.printer) || (role === 'receipt' ? hw.defaultPrinter : null) || hw.defaultPrinter
        || (hw.printers.find(p => p.thermal) || {}).name;
    if (!name) return role === 'receipt' ? 'No receipt printer is set up in Station.' : null;
    const p = hw.printers.find(x => x.name === name);
    if (!p) return `Printer "${name}" is not connected.`;
    if (p.state === 'offline' || p.state === 'error') return `${p.displayName || p.name}: ${p.status || 'offline'}`;
    return null;
}

/**
 * VenQore Station API wrapper (SaaS Edition)
 */
export const AMDStation = {
    /**
     * Check if running in VenQore Station
     * Returns { isAMDStation, version, deviceId, terminalId, platform }
     */
    async check() {
        if (!isAMDStationAvailable()) return { isAMDStation: false };
        try { return await window.amdAPI.check(); }
        catch (e) { return { isAMDStation: false }; }
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
        try { return await window.amdAPI.getPrefs(); }
        catch (e) { return {}; }
    },

    /**
     * Save station preferences
     */
    async savePrefs(updates) {
        if (!isAMDStationAvailable()) return { success: false };
        try { return await window.amdAPI.savePrefs(updates); }
        catch (e) { return { success: false, error: e.message }; }
    },

    /**
     * Get available printers
     */
    async getPrinters() {
        if (!isAMDStationAvailable()) return [];
        try { return await window.amdAPI.getPrinters(); }
        catch (e) { return []; }
    },

    /**
     * Set default printer
     */
    async setDefaultPrinter(printerName) {
        if (!isAMDStationAvailable()) return { success: false };
        try { return await window.amdAPI.setDefaultPrinter(printerName); }
        catch (e) { return { success: false, error: e.message }; }
    },

    /**
     * Station 3+: live hardware status — printers (with online / paper state),
     * serial scanner / scale / pole display, customer display.
     */
    async getHardwareStatus() {
        if (!isAMDStationAvailable() || !window.amdAPI.getHardwareStatus) return null;
        try { return await window.amdAPI.getHardwareStatus(); }
        catch (e) { return null; }
    },

    /** Subscribe to hardware status changes. Returns an unsubscribe function. */
    onHardwareStatus(cb) {
        if (!isAMDStationAvailable() || !window.amdAPI.onHardwareStatus) return () => {};
        return window.amdAPI.onHardwareStatus(cb);
    },

    /**
     * Station 3+: silent A4 / Letter document print through the Windows driver
     * (no print dialog). Falls back to { success:false } on older Stations.
     */
    async printHtml(html, { printerName, role, pageSize = 'A4', copies = 1, landscape = false } = {}) {
        if (!isAMDStationAvailable() || !window.amdAPI.printHtml) return { success: false, error: 'Silent document printing needs VenQore Station 3 or newer.' };
        try { return await window.amdAPI.printHtml({ html, printerName, role, pageSize, copies, landscape }); }
        catch (e) { return { success: false, error: e.message }; }
    },

    /** Station 3+: silent A4 document (invoice, statement, Z-report) to the printer set for "A4 documents". */
    printDocument(html, options = {}) { return this.printHtml(html, { role: 'document', ...options }); },

    /** Station 3+: shelf / barcode label to the label printer. size: { widthMm, heightMm }. */
    printLabel(html, { widthMm = 50, heightMm = 30, copies = 1, printerName } = {}) {
        return this.printHtml(html, { role: 'label', printerName, pageSize: { widthMm, heightMm }, copies });
    },

    /** Station 3+: which printer each kind of job goes to on this till. */
    async getPrintRoles() {
        if (!isAMDStationAvailable() || !window.amdAPI.getPrintRoles) return [];
        try { return await window.amdAPI.getPrintRoles(); } catch (e) { return []; }
    },

    /** Station 3+: latest reading from the scale ({ weight, unit, stable, ... }) or null. */
    async getWeight() {
        if (!isAMDStationAvailable() || !window.amdAPI.getWeight) return null;
        try { return await window.amdAPI.getWeight(); } catch (e) { return null; }
    },

    /**
     * Station 3+: customer-facing second screen (and 2x20 pole display, mirrored).
     * state: { mode:'idle'|'cart'|'paid', storeName, currency, items:[{name,qty,price,total}], subtotal, discount, tax, total, paid, change, message }
     */
    customerDisplay: {
        open: () => (isAMDStationAvailable() && window.amdAPI.openCustomerDisplay ? window.amdAPI.openCustomerDisplay() : Promise.resolve({ success: false })),
        close: () => (isAMDStationAvailable() && window.amdAPI.closeCustomerDisplay ? window.amdAPI.closeCustomerDisplay() : Promise.resolve({ success: false })),
        update: (state) => (isAMDStationAvailable() && window.amdAPI.updateCustomerDisplay ? window.amdAPI.updateCustomerDisplay(state) : Promise.resolve({ success: false })),
    },

    /**
     * Send a raw thermal job to VenQore Station.
     * Raw ESC/POS data must never be sent to the browser's page-print dialog.
     */
    async print(data, options = {}) {
        if (isAMDStationAvailable()) {
            // Use VenQore Station for silent printing
            const printData = {
                content: this.formatReceiptData(data),
                printerName: options.printerName,
                role: options.role,
                copies: options.copies || 1,
                paperWidth: options.paperWidth || '80mm',
                autoCut: options.autoCut !== undefined ? options.autoCut : true,
            };

            try {
                const result = await window.amdAPI.print(printData);
                return result;
            } catch (e) {
                console.error('[AMDStation] Print failed:', e);
                return { success: false, error: e.message };
            }
        } else {
            return {
                success: false,
                error: 'VenQore Station is not running. Raw thermal printing requires the desktop companion.',
            };
        }
    },

    /** Kitchen / bar / takeaway ticket: goes to the printer set for that job on this till. */
    printTicket(data, options = {}) { return this.print(data, { role: 'kitchen', ...options }); },

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

        if (printResult?.success && options.openDrawer !== false) {
            const drawer = await this.openDrawer(options.printerName);
            if (!drawer?.success) {
                window.dispatchEvent(new CustomEvent('amd:toast', { detail: {
                    message: `Receipt printed. ${drawer?.error || 'Cash drawer request failed.'}`, type: 'warning',
                } }));
            }
            return { ...printResult, drawer };
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
        for (const [key, label] of [['serviceCharge', 'Service charge'], ['tipAmount', 'Tip'], ['deliveryCharge', 'Delivery'], ['roundOff', 'Round off']]) {
            if (Number(String(data[key] ?? 0).replaceAll(',', '')) !== 0) {
                content.push({ type: 'text', value: `${label}: ${currencySymbol}${data[key]}`, style: { textAlign: 'right' } });
            }
        }
        if (data.subtotal !== undefined) {
            content.push({
                type: 'text',
                value: `Subtotal: ${currencySymbol}${data.subtotal}`,
                style: { textAlign: 'right' }
            });
        }

        if (data.tax !== undefined && Number(String(data.tax).replaceAll(',', '')) > 0) {
            content.push({
                type: 'text',
                value: `Tax: ${currencySymbol}${data.tax}`,
                style: { textAlign: 'right', fontSize: '12px' }
            });
        }

        if (data.discount !== undefined && Number(String(data.discount).replaceAll(',', '')) > 0) {
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
                value: `Paid: ${currencySymbol}${data.paidAmount}`,
                style: { textAlign: 'right' }
            });
        }

        if (data.changeAmount !== undefined && Number(String(data.changeAmount).replaceAll(',', '')) > 0) {
            content.push({
                type: 'text',
                value: `Change: ${currencySymbol}${data.changeAmount}`,
                style: { textAlign: 'right' }
            });
        }

        if (data.balanceAmount !== undefined) {
            content.push({ type: 'text', value: `Balance due: ${currencySymbol}${data.balanceAmount}`, style: { textAlign: 'right' } });
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
    const [hardware, setHardware] = useState(null);
    const [stationVersion, setStationVersion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            const status = await AMDStation.check();
            setIsConnected(status.isAMDStation);
            setStationVersion(status.version || null);

            if (status.isAMDStation) {
                const printerList = await AMDStation.getPrinters();
                setPrinters(printerList);

                // Preserve the saved choice even when that device is disconnected.
                // Never silently replace it with a system PDF printer.
                const prefs = await AMDStation.getPrefs();
                setDefaultPrinter(prefs.defaultPrinter || null);
                setHardware(await AMDStation.getHardwareStatus());
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

        // Station 3+: printers plugged in / unplugged while the POS is open.
        const offHardware = AMDStation.onHardwareStatus((hw) => {
            if (hw) setHardware(hw);
            if (Array.isArray(hw?.printers)) setPrinters(hw.printers);
            if (hw && 'defaultPrinter' in hw) setDefaultPrinter(hw.defaultPrinter || null);
        });

        return () => {
            window.removeEventListener('amd-station-ready', handleReady);
            offHardware();
        };
    }, []);

    return {
        isConnected,
        loading,
        printers,
        hardware,
        stationVersion,
        /* Real state of the bills printer: "Out of paper", "Offline"… — null when fine or unknown. */
        printerProblem: describePrinterProblem(hardware, 'receipt'),
        problemFor: (role) => describePrinterProblem(hardware, role),
        defaultPrinter,
        setDefaultPrinter: async (name) => {
            const result = await AMDStation.setDefaultPrinter(name);
            if (result?.success) setDefaultPrinter(name);
            return result;
        },
        print: (data, options) => AMDStation.print(data, { ...options, printerName: options?.printerName || (options?.role && options.role !== 'receipt' ? undefined : defaultPrinter) }),
        openDrawer: () => AMDStation.openDrawer(defaultPrinter),
        printAndOpenDrawer: (data, options) => AMDStation.printAndOpenDrawer(data, { ...options, printerName: options?.printerName || defaultPrinter }),
    };
}

export default AMDStation;

/**
 * React Hook: Barcode Scanner via COM Port
 *
 * Usage:
 *   const { lastBarcode, isConnected, connect } = useBarcodeScannerPort('COM3', 9600);
 */
export function useBarcodeScannerPort(portPath = null, baudRate = 9600) {
    const [lastBarcode, setLastBarcode] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const connect = async (port, baud) => {
        if (!isAMDStationAvailable()) return;
        try {
            const result = await window.amdAPI.openScanner(port || portPath, baud || baudRate);
            setIsConnected(result.success);
            if (!result.success) setError(result.error);
        } catch (e) {
            setError(e.message);
        }
    };

    const disconnect = async () => {
        if (!isAMDStationAvailable()) return;
        await window.amdAPI.closeSerial('scanner');
        setIsConnected(false);
    };

    useEffect(() => {
        if (!isAMDStationAvailable()) return;

        // Auto-connect if portPath provided
        if (portPath) connect(portPath, baudRate);

        // Also listen for keyboard-wedge barcodes from shell
        const handleBarcode = (e) => {
            if (e.detail) setLastBarcode(e.detail);
        };
        window.addEventListener('amd:barcode-scan', handleBarcode);

        // Listen from preload bridge
        const cleanup = window.amdAPI.onBarcodeScan?.((barcode) => {
            setLastBarcode(barcode);
        });

        return () => {
            window.removeEventListener('amd:barcode-scan', handleBarcode);
            if (typeof cleanup === 'function') cleanup();
        };
    }, [portPath]);

    return { lastBarcode, isConnected, error, connect, disconnect };
}

/**
 * React Hook: Weight Scale via COM Port
 *
 * Usage:
 *   const { weight, isConnected, connect } = useWeightScale('COM4', 9600);
 */
export function useWeightScale(portPath = null, baudRate = 9600) {
    const [weight, setWeight] = useState(null);
    const [rawReading, setRawReading] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const connect = async (port, baud) => {
        if (!isAMDStationAvailable()) return;
        try {
            const result = await window.amdAPI.openScale(port || portPath, baud || baudRate);
            setIsConnected(result.success);
            if (!result.success) setError(result.error);
        } catch (e) {
            setError(e.message);
        }
    };

    const disconnect = async () => {
        if (!isAMDStationAvailable()) return;
        await window.amdAPI.closeSerial('scale');
        setIsConnected(false);
        setWeight(null);
    };

    useEffect(() => {
        if (!isAMDStationAvailable()) return;

        if (portPath) connect(portPath, baudRate);

        const cleanup = window.amdAPI.onScaleReading?.((data) => {
            setWeight(data.weight);
            setRawReading(data.raw);
        });

        return () => {
            if (typeof cleanup === 'function') cleanup();
        };
    }, [portPath]);

    return { weight, rawReading, isConnected, error, connect, disconnect };
}

/**
 * React Hook: Auto-Updater
 *
 * Usage:
 *   const { updateAvailable, updateVersion, progress, isReady, downloadUpdate, installUpdate } = useAutoUpdater();
 */
export function useAutoUpdater() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateVersion, setUpdateVersion] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!isAMDStationAvailable()) return;

        const cleanupAvailable = window.amdAPI.onUpdateAvailable?.((info) => {
            setUpdateAvailable(true);
            setUpdateVersion(info.version);
            setIsDownloading(true);
        });

        const cleanupProgress = window.amdAPI.onUpdateProgress?.((data) => {
            setProgress(data.percent);
        });

        const cleanupReady = window.amdAPI.onUpdateReady?.((info) => {
            setIsReady(true);
            setIsDownloading(false);
            setProgress(100);
        });

        return () => {
            if (typeof cleanupAvailable === 'function') cleanupAvailable();
            if (typeof cleanupProgress === 'function') cleanupProgress();
            if (typeof cleanupReady === 'function') cleanupReady();
        };
    }, []);

    return {
        updateAvailable,
        updateVersion,
        progress,
        isDownloading,
        isReady,
        downloadUpdate: () => window.amdAPI?.downloadUpdate?.(),
        installUpdate: () => window.amdAPI?.installUpdate?.(),
    };
}
