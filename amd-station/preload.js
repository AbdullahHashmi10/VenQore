/**
 * VenQore Station - Preload Script (The Bridge)
 * Exposes safe APIs from Electron to the web page
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose the VenQore API to the website
contextBridge.exposeInMainWorld('amdAPI', {

    /**
     * Check if running inside VenQore Station
     * @returns {Promise<{isAMDStation: boolean, version: string, platform: string}>}
     */
    check: () => ipcRenderer.invoke('amd:check'),

    /**
     * Print a receipt silently with auto-cut
     * @param {Object} data - Print data
     * @param {Array} data.content - Array of print elements
     * @param {string} data.printerName - Target printer name
     * @param {number} data.copies - Number of copies (default: 1)
     * @param {string} data.paperWidth - Paper width (default: '80mm')
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    print: (data) => ipcRenderer.invoke('amd:print', data),

    /**
     * Open the cash drawer
     * @param {string} printerName - Printer connected to drawer
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    openDrawer: (printerName) => ipcRenderer.invoke('amd:drawer', printerName),

    /**
     * Get list of available printers
     * @returns {Promise<Array<{name: string, displayName: string, isDefault: boolean}>>}
     */
    getPrinters: () => ipcRenderer.invoke('amd:printers'),

    /**
     * Set the default printer for the session
     * @param {string} printerName - Printer name to set as default
     * @returns {Promise<{success: boolean}>}
     */
    setDefaultPrinter: (printerName) => ipcRenderer.invoke('amd:set-printer', printerName),

    /**
     * Window Controls (For Frameless Window)
     */
    minimize: () => ipcRenderer.send('amd:window-minimize'),
    maximize: () => ipcRenderer.send('amd:window-maximize'),
    close: () => ipcRenderer.send('amd:window-close'),
    forceClose: () => ipcRenderer.send('amd:force-close'),

    onExitRequest: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('amd:request-exit-auth', subscription);
        // Return cleanup function
        return () => ipcRenderer.removeListener('amd:request-exit-auth', subscription);
    },
});

// Notify the page that VenQore Station is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('[VenQore Station Bridge] Ready - Hardware APIs available');

    // Dispatch custom event so React can detect VenQore Station
    window.dispatchEvent(new CustomEvent('amd-station-ready', {
        detail: { version: '1.0.0' }
    }));
});
