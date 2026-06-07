const { ipcRenderer } = require('electron');
const path = require('path');

/**
 * VenQore Station - Shell Renderer (Intelligent Bar Edition)
 * Handles the "Cockpit" UI interactions and adaptive theme bars.
 */

const viewContainer = document.getElementById('view-container');
const blurBtn = document.getElementById('blur-toggle');
const webview = document.getElementById('app-view');
const loader = document.getElementById('loader-overlay');
const statusTitle = document.getElementById('loading-status');

// Set preload path with absolute path (required for Electron webviews)
const preloadPath = path.join(__dirname, 'preload.js');
webview.setAttribute('preload', `file://${preloadPath.replace(/\\/g, '/')}`);
console.log('[Shell] Webview preload set to:', preloadPath);

let isBlurred = false;

// --- WEBVIEW BRIDGE (The Relay) ---
// This forwards messages from the website (inside webview) to the Main process
webview.addEventListener('ipc-message', (event) => {
    console.log(`[WebCore Bridge] Relay: ${event.channel}`, event.args);

    // Some messages are handled here in the Shell
    if (event.channel === 'theme-change') {
        const theme = event.args[0];
        document.body.classList.toggle('light-theme', theme === 'light');
        return;
    }

    // Others are forwarded to Main (Hardware, Printers, Window Controls)
    try {
        ipcRenderer.send(event.channel, ...event.args);
    } catch (e) {
        console.error(`[Shell] Failed to forward IPC message '${event.channel}':`, e);
    }
});

// Capture console logs from the webview for debugging in the shell console
webview.addEventListener('console-message', (e) => {
    console.log(`[WebCore] ${e.message} (Line: ${e.line})`);
});

// --- ADAPTIVE THEME SYNC ---
ipcRenderer.on('amd:theme-update', (event, theme) => {
    document.body.classList.toggle('light-theme', theme === 'light');
});

// --- TOP BAR ACTIONS ---

// Privacy Shade (Blur)
blurBtn.addEventListener('click', () => {
    isBlurred = !isBlurred;
    viewContainer.classList.toggle('blurred', isBlurred);
    ipcRenderer.send('amd:toggle-blur', isBlurred);
    blurBtn.innerHTML = isBlurred ? '✨ Unblur' : '👁️ Blur';
    blurBtn.style.color = isBlurred ? '#60a5fa' : '';
});

document.getElementById('privacy-overlay').addEventListener('click', () => {
    isBlurred = false;
    viewContainer.classList.remove('blurred');
    ipcRenderer.send('amd:toggle-blur', false);
    blurBtn.innerHTML = '👁️ Blur';
    blurBtn.style.color = '';
});

// Dual Screen - REMOVED from UI
// document.getElementById('dual-screen')?.addEventListener('click', () => {
//     ipcRenderer.send('amd:launch-dual-pos');
// });

// System Refresh
document.getElementById('refresh').addEventListener('click', () => {
    console.log('[Shell] WebCore Reload Initiated.');
    webview.reload();
});

// Authorized Exit
document.getElementById('close').addEventListener('click', (e) => {
    // We send 'window-close' which Main intercepts to trigger the passcode screen
    ipcRenderer.send('amd:window-close');
});

// Settings
document.getElementById('settings-btn').addEventListener('click', () => {
    ipcRenderer.send('amd:prompt-url');
});

// --- WEBVIEW LIFECYCLE ---

let lastTargetUrl = 'http://localhost:8000'; // Default fallback
let failCount = 0;

ipcRenderer.on('amd:load', (event, url) => {
    console.log('[Shell] Loading URL:', url);
    lastTargetUrl = url;
    webview.src = url;
    failCount = 0; // Reset failure count on fresh load attempt
});

ipcRenderer.on('status:update', (event, msg) => {
    statusTitle.innerText = msg;
});

webview.addEventListener('did-stop-loading', () => {
    const url = webview.getURL();
    console.log('[WebCore] Stop Loading:', url);

    // If we have landed on the app OR the error page, hide the loader
    // But don't hide if we are at error page, let error page show itself? 
    // Actually error.html is styled, so we can hide loader.
    if (url && url !== 'about:blank' && (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('error.html'))) {
        console.log('[WebCore] Application Landing Confirmed.');
        // Only show "Launching" if not error
        if (!url.includes('error.html')) {
            statusTitle.innerText = "Launching Interface...";
        } else {
            statusTitle.innerText = "Recovery Mode Active";
        }

        // Force hide immediately to prevent being stuck
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);

        // If success (not error page), reset fail count
        if (!url.includes('error.html')) {
            failCount = 0;
        }
    }
});

webview.addEventListener('did-fail-load', (e) => {
    // Ignore internal navigation failures (like about:blank or during redirects)
    if (e.errorCode === -3 || e.errorCode === 0) return;

    console.error('[WebCore] Load Failed:', e);
    failCount++;

    if (failCount >= 3) {
        console.warn('[WebCore] Too many failures. Redirecting to recovery page.');
        const errorPage = path.join(__dirname, 'error.html');
        // Use file protocol
        // Use lastTargetUrl which we stored
        const target = lastTargetUrl || 'http://localhost:8000';
        webview.src = `file://${errorPage.replace(/\\/g, '/')}?target=${encodeURIComponent(target)}`;

        // Don't reset failCount here? No, reset it so next time we retry the loop works.
        failCount = 0;
    } else {
        statusTitle.innerText = `Connection Failed. Retrying in 2s (Attempt ${failCount}/3)...`;
        statusTitle.style.color = "#ef4444";
        setTimeout(() => { webview.reload(); }, 2000);
    }
});

// Emergency Bypass / Long Wait Handler
setTimeout(() => {
    if (!loader.classList.contains('hidden')) {
        const url = webview.getURL();
        if (url === 'about:blank') {
            // Still waiting for server... keep showing loader but update text
            console.warn('[Shell] Startup delay detected.');
            statusTitle.innerText = "System Initializing... (Please Wait)";
            statusTitle.style.color = "#fbbf24"; // Warning yellow
        } else {
            // We have a URL but loader didn't dismiss? Force it.
            console.warn('[Shell] Emergency Loader Bypass (App Loaded).');
            loader.classList.add('hidden');
        }
    }
}, 30000); // 30s Check

// --- SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
        webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools();
    }
});

// --- BOTTOM BAR ---

ipcRenderer.on('status:connection', (event, status) => {
    // status = { local: bool, internet: bool }

    const indicator = document.getElementById('conn-indicator');
    const text = document.getElementById('status-text');

    if (!status.local) {
        // Critical: Local Engine Down
        indicator.className = 'indicator offline';
        text.innerText = 'ENGINE FAILURE';
        text.style.color = '#ef4444'; // Red
    } else if (!status.internet) {
        // Working, but Offline
        indicator.className = 'indicator offline'; // Keep grey/amber dot
        text.innerText = 'OFFLINE MODE';
        text.style.color = '#f59e0b'; // Amber/Orange
        indicator.style.backgroundColor = '#f59e0b';
    } else {
        // Fully Online
        indicator.className = 'indicator online';
        text.innerText = 'SYSTEM ONLINE';
        text.style.color = '#22c55e'; // Green
        indicator.style.backgroundColor = '#22c55e';
    }
});

ipcRenderer.on('status:sync', (event, time) => {
    document.getElementById('sync-text').innerText = `📡 Sync: ${time}`;
});

ipcRenderer.on('status:printer', (event, name) => {
    document.getElementById('printer-status').innerText = `🖨️ Printer: ${name}`;
});

// IPC Handlers for Window Controls (Triggers from Main)
ipcRenderer.on('amd:request-exit', () => {
    // 1. Force focus to the WebView so the keyboard works immediately
    webview.focus();

    // 2. Trigger the Exit Event via IPC (Bridge)
    // This is received by preload.js, which triggers the callback in React
    try {
        webview.send('amd:request-exit-auth');
        console.log('[Shell] Sent exit auth request to WebCore');
    } catch (e) {
        console.error('[Shell] Failed to send IPC to Webview:', e);
    }
});

ipcRenderer.on('amd:reload-app', () => {
    webview.reload();
});
