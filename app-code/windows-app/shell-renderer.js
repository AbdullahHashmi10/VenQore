const { ipcRenderer } = require('electron');
const path = require('path');

/**
 * VenQore Station Shell Renderer — SaaS Cloud Edition (v2.0.0)
 * Loads the cloud URL directly. No local server. Pure hardware bridge.
 */

// ─── ELEMENT REFS ─────────────────────────────────────────────────────────────
const viewContainer  = document.getElementById('view-container');
const webview        = document.getElementById('app-view');
const loader         = document.getElementById('loader-overlay');
const offlineOverlay = document.getElementById('offline-overlay');
const statusTitle    = document.getElementById('loading-status');

// Login overlay elements
const loginOverlay    = document.getElementById('native-login-overlay');
const storeSlugInput  = document.getElementById('store-slug-input');
const btnConnectStore = document.getElementById('btn-connect-store');
const btnDirectSignin = document.getElementById('btn-direct-signin');
const linkRegister    = document.getElementById('link-register');
const slugSuffixLabel = document.getElementById('slug-suffix-label');

// Error overlay elements
const errorOverlay  = document.getElementById('native-error-overlay');
const errorTitle    = document.getElementById('error-title');
const errorDesc     = document.getElementById('error-desc');
const errorUrl      = document.getElementById('error-url');
const btnErrorRetry = document.getElementById('btn-error-retry');
const btnErrorHome  = document.getElementById('btn-error-home');

// Set webview preload
const preloadPath = path.join(__dirname, 'preload.js');
webview.setAttribute('preload', `file://${preloadPath.replace(/\\/g, '/')}`);

let isBlurred   = false;
let cloudUrl    = '';
let failCount   = 0;
let isOnline    = true;
let hasLoaded   = false;

// ─── BOOT: GET CLOUD URL AND LOAD ─────────────────────────────────────────────
// ─── BOOT: GET CLOUD/LOCAL PREFS AND LOAD ─────────────────────────────────────
async function boot() {
    cloudUrl = await ipcRenderer.invoke('amd:get-cloud-url');
    console.log('[Shell] Booting → Cloud:', cloudUrl);
    
    currentPrefs = await ipcRenderer.invoke('amd:get-prefs');
    const baseHost = new URL(cloudUrl).host;
    
    // Style slug input label depending on dev/local mode
    if (baseHost.includes('127.0.0.1') || baseHost.includes('localhost')) {
        slugSuffixLabel.textContent = ` (Local: ${baseHost})`;
    } else {
        slugSuffixLabel.textContent = `.${baseHost.replace('app.', '')}`;
    }
    
    // Check if store is connected
    if (currentPrefs.connectedStore) {
        console.log('[Shell] Store linked:', currentPrefs.connectedStore);
        loginOverlay.classList.add('hidden');
        
        // Gating consent check
        if (currentPrefs.activityTrackingEnabled && !currentPrefs.consentAccepted) {
            consentOverlay.classList.remove('hidden');
            webview.src = 'about:blank';
        } else {
            consentOverlay.classList.add('hidden');
            webview.src = `${cloudUrl}/s/${currentPrefs.connectedStore}/pos`;
        }
    } else {
        console.log('[Shell] No store linked. Showing pairing screen.');
        loginOverlay.classList.remove('hidden');
        consentOverlay.classList.add('hidden');
        loader.classList.add('hidden');
        webview.src = 'about:blank';
    }
}

// ─── NATIVE LOGIN / SETUP ACTIONS ─────────────────────────────────────────────
btnConnectStore.addEventListener('click', async () => {
    const slug = storeSlugInput.value.trim().toLowerCase();
    if (!slug) {
        alert('Please enter a store slug.');
        return;
    }
    
    await ipcRenderer.invoke('amd:save-prefs', { connectedStore: slug });
    loginOverlay.classList.add('hidden');
    loader.classList.remove('hidden');
    statusTitle.innerText = 'Connecting to store...';
    webview.src = `${cloudUrl}/s/${slug}/pos`;
});

btnDirectSignin.addEventListener('click', () => {
    loginOverlay.classList.add('hidden');
    loader.classList.remove('hidden');
    statusTitle.innerText = 'Redirecting to sign in...';
    webview.src = `${cloudUrl}/login`;
});

linkRegister.addEventListener('click', (e) => {
    e.preventDefault();
    const baseHost = new URL(cloudUrl).host;
    const regUrl = baseHost.includes('127.0.0.1') || baseHost.includes('localhost')
        ? `http://${baseHost}/register`
        : `https://app.venqore.com/register`;
    ipcRenderer.invoke('amd:open-external', regUrl);
});

// ─── NATIVE SYSTEM ERROR ACTIONS ─────────────────────────────────────────────
function showNativeErrorOverlay(title, url) {
    errorOverlay.classList.remove('hidden');
    webview.classList.add('hidden');
    errorTitle.innerText = title || 'System Error';
    errorUrl.innerText = url || webview.getURL() || 'Unknown URL';
    
    if (title.includes('404') || title.includes('Not Found')) {
        errorDesc.innerText = 'The requested store page or POS resource could not be found. Please check your store subdomain slug and try again.';
    } else if (title.includes('500') || title.includes('Server Error')) {
        errorDesc.innerText = 'The local or cloud server encountered an internal error. Please check your database settings and backend logs.';
    } else {
        errorDesc.innerText = 'An unexpected system error occurred while loading this page.';
    }
}

function hideNativeErrorOverlay() {
    errorOverlay.classList.add('hidden');
    webview.classList.remove('hidden');
}

btnErrorRetry.addEventListener('click', () => {
    hideNativeErrorOverlay();
    loader.classList.remove('hidden');
    statusTitle.innerText = 'Retrying connection...';
    webview.reload();
});

btnErrorHome.addEventListener('click', async () => {
    hideNativeErrorOverlay();
    await ipcRenderer.invoke('amd:save-prefs', { connectedStore: null });
    loginOverlay.classList.remove('hidden');
    webview.src = 'about:blank';
    storeSlugInput.value = '';
});

// ─── PASSCODE GATING & NUMPAD INPUT LOGIC ─────────────────────────────────────
let passcodeAction = ''; // 'exit' or 'settings'
let enteredPasscode = '';

const passcodeOverlay    = document.getElementById('native-passcode-overlay');
const consentOverlay     = document.getElementById('native-consent-overlay');
const offlineLockOverlay = document.getElementById('native-offline-lock-overlay');

function updatePasscodeDots() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`passcode-dot-${i}`);
        if (i <= enteredPasscode.length) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    }
}

document.querySelectorAll('.num-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (enteredPasscode.length < 4) {
            enteredPasscode += btn.dataset.val;
            updatePasscodeDots();
            if (enteredPasscode.length === 4) {
                setTimeout(verifyPasscode, 200);
            }
        }
    });
});

document.getElementById('btn-passcode-clear').addEventListener('click', () => {
    enteredPasscode = '';
    updatePasscodeDots();
});

document.getElementById('btn-passcode-cancel').addEventListener('click', () => {
    enteredPasscode = '';
    updatePasscodeDots();
    passcodeOverlay.classList.add('hidden');
});

function verifyPasscode() {
    const correctPin = currentPrefs.exitPasscode || '1234';
    if (enteredPasscode === correctPin) {
        enteredPasscode = '';
        updatePasscodeDots();
        passcodeOverlay.classList.add('hidden');
        
        if (passcodeAction === 'exit') {
            ipcRenderer.send('amd:force-close');
        } else if (passcodeAction === 'settings') {
            openSettingsPanel();
        }
    } else {
        // Shake feedback
        enteredPasscode = '';
        updatePasscodeDots();
        const container = document.querySelector('.passcode-container');
        if (container) {
            container.style.animation = 'none';
            container.offsetHeight; // Reflow
            container.style.animation = 'shake 0.3s ease';
        }
    }
}

function showPasscodeOverlay(action) {
    passcodeAction = action;
    enteredPasscode = '';
    updatePasscodeDots();
    passcodeOverlay.classList.remove('hidden');
}

// ─── CONSENT ACCEPTANCE ───────────────────────────────────────────────────────
document.getElementById('btn-consent-accept').addEventListener('click', async () => {
    await ipcRenderer.invoke('amd:save-prefs', { consentAccepted: true });
    consentOverlay.classList.add('hidden');
    boot();
});

// ─── OFFLINE LOCK GATE SYNC RETRY ─────────────────────────────────────────────
ipcRenderer.on('status:offline-lock', (event, { days }) => {
    offlineLockOverlay.classList.remove('hidden');
    loader.classList.add('hidden');
    webview.src = 'about:blank';
    
    let lastSyncStr = 'Never';
    if (currentPrefs.lastOnlineSyncAt) {
        try {
            lastSyncStr = new Date(currentPrefs.lastOnlineSyncAt).toLocaleString();
        } catch {}
    }
    document.getElementById('offline-last-sync-label').textContent = lastSyncStr;
});

document.getElementById('btn-offline-sync-retry').addEventListener('click', async () => {
    // Retry pairing/connection sequence
    await boot();
    setTimeout(async () => {
        const freshPrefs = await ipcRenderer.invoke('amd:get-prefs');
        const lastSync = new Date(freshPrefs.lastOnlineSyncAt || new Date());
        const daysOffline = (new Date() - lastSync) / (1000 * 60 * 60 * 24);
        if (daysOffline <= 7) {
            offlineLockOverlay.classList.add('hidden');
        }
    }, 2000);
});

// ─── EXIT PASSCODE INTERCEPT FROM MAIN ────────────────────────────────────────
ipcRenderer.on('amd:request-close-check', () => {
    const loginOverlay = document.getElementById('native-login-overlay');
    const isLoginVisible = loginOverlay && !loginOverlay.classList.contains('hidden');

    // Check if the webview is showing a login, registration, or guest page
    let isWebviewLoggedOut = false;
    try {
        const url = webview.getURL() || '';
        isWebviewLoggedOut = url.includes('/login') || 
                             url.includes('/register') || 
                             url.includes('/VenQore-login') || 
                             url.includes('/staff-login') || 
                             url.includes('/forgot-password') || 
                             url.includes('/reset-password') || 
                             url === 'about:blank' || 
                             url === '';
    } catch (e) {
        console.error('Failed to get webview URL:', e);
    }

    if (isLoginVisible || isWebviewLoggedOut || !currentPrefs.connectedStore) {
        // Not paired, not signed in, or showing the login/setup screen: close instantly
        ipcRenderer.send('amd:force-close');
    } else if (currentPrefs.activityTrackingEnabled) {
        showPasscodeOverlay('exit');
    } else {
        ipcRenderer.send('amd:confirm-close');
    }
});

boot();

// ─── WEBVIEW BRIDGE (Relay IPC from webview to main) ─────────────────────────
webview.addEventListener('ipc-message', (event) => {
    if (event.channel === 'theme-change') {
        document.body.classList.toggle('light-theme', event.args[0] === 'light');
        return;
    }
    try { ipcRenderer.send(event.channel, ...event.args); } catch {}
});

webview.addEventListener('console-message', (e) => {
    if (e.level !== 0) console.log(`[WebCore] ${e.message}`);
});

webview.addEventListener('dom-ready', () => {
    try {
        const title = webview.getTitle();
        const url = webview.getURL();
        
        console.log(`[Shell] Page title: "${title}" for URL: ${url}`);
        
        const isErrorPage = 
            title.includes('404') || 
            title.includes('500') || 
            title.includes('Not Found') || 
            title.includes('Server Error') ||
            title.includes('Laravel') ||
            title.includes('Forbidden') ||
            title.includes('Unauthorized');
            
        if (isErrorPage && url !== 'about:blank' && !url.includes('error.html')) {
            console.warn('[Shell] Detected error page:', title);
            showNativeErrorOverlay(title, url);
        } else {
            if (url !== 'about:blank' && !url.includes('error.html')) {
                hideNativeErrorOverlay();
            }
        }
    } catch (e) {
        console.error('[Shell] Error checking page title:', e);
    }
});

// ─── WEBVIEW LOAD SUCCESS ─────────────────────────────────────────────────────
webview.addEventListener('did-stop-loading', () => {
    const url = webview.getURL();
    if (!url || url === 'about:blank') return;

    console.log('[Shell] Loaded:', url);
    hasLoaded  = true;
    failCount  = 0;

    // Auto-detect store slug from URL if user signs in directly
    const match = url.match(/\/s\/([^\/]+)\/pos/);
    if (match && match[1]) {
        const slug = match[1];
        ipcRenderer.invoke('amd:save-prefs', { connectedStore: slug });
    }

    offlineOverlay.classList.add('hidden');
    setTimeout(() => { loader.classList.add('hidden'); }, 400);
});

// ─── WEBVIEW LOAD FAILURE ─────────────────────────────────────────────────────
webview.addEventListener('did-fail-load', (e) => {
    if (e.errorCode === -3 || e.errorCode === 0) return; // User navigation / abort
    console.warn('[Shell] Load failed:', e.errorCode, e.errorDescription);
    failCount++;

    if (failCount >= 2) {
        // Show the offline overlay
        loader.classList.add('hidden');
        offlineOverlay.classList.remove('hidden');
        statusTitle.innerText = 'Connection failed';
        failCount = 0;
    } else {
        statusTitle.innerText = `Retrying... (${failCount}/2)`;
        setTimeout(() => webview.reload(), 3000);
    }
});

// ─── OFFLINE RETRY BUTTON ─────────────────────────────────────────────────────
document.getElementById('retry-btn').addEventListener('click', async () => {
    offlineOverlay.classList.add('hidden');
    loader.classList.remove('hidden');
    statusTitle.innerText = 'Reconnecting...';
    failCount = 0;
    
    const prefs = await ipcRenderer.invoke('amd:get-prefs');
    if (prefs.connectedStore) {
        webview.src = `${cloudUrl}/s/${prefs.connectedStore}/pos`;
    } else {
        loginOverlay.classList.remove('hidden');
        loader.classList.add('hidden');
        webview.src = 'about:blank';
    }
});

// ─── LOADER SAFETY NET (30s timeout) ─────────────────────────────────────────
setTimeout(() => {
    if (!loader.classList.contains('hidden') && !hasLoaded) {
        loader.classList.add('hidden');
        offlineOverlay.classList.remove('hidden');
    }
}, 30000);

// ─── STATUS BAR UPDATES ───────────────────────────────────────────────────────
ipcRenderer.on('status:connection', async (event, { online }) => {
    const indicator = document.getElementById('conn-indicator');
    const text      = document.getElementById('status-text');
    isOnline = online;

    if (online) {
        indicator.className = 'indicator online';
        text.innerText = 'ONLINE';
        text.style.color = '#22c55e';
        
        // If we were offline and now back, reload
        if (!hasLoaded || webview.getURL() === 'about:blank') {
            const prefs = await ipcRenderer.invoke('amd:get-prefs');
            if (prefs.connectedStore) {
                offlineOverlay.classList.add('hidden');
                loader.classList.remove('hidden');
                statusTitle.innerText = 'Reconnecting...';
                webview.src = `${cloudUrl}/s/${prefs.connectedStore}/pos`;
            } else {
                offlineOverlay.classList.add('hidden');
                loginOverlay.classList.remove('hidden');
                loader.classList.add('hidden');
            }
        }
    } else {
        indicator.className = 'indicator offline';
        text.innerText = 'OFFLINE';
        text.style.color = '#ef4444';
        // Show offline overlay if app hasn't loaded yet
        if (!hasLoaded) {
            loader.classList.add('hidden');
            offlineOverlay.classList.remove('hidden');
        }
    }
});

ipcRenderer.on('status:sync', (event, time) => {
    document.getElementById('sync-text').innerText = `📡 Sync: ${time}`;
});

ipcRenderer.on('status:printer', (event, name) => {
    document.getElementById('printer-status').innerText = `🖨️ ${name}`;
});

// ─── TOP BAR: EXIT ────────────────────────────────────────────────────────────
document.getElementById('close').addEventListener('click', () => {
    ipcRenderer.send('amd:window-close');
});

ipcRenderer.on('amd:request-exit', () => {
    try { webview.send('amd:request-exit-auth'); } catch {}
});

ipcRenderer.on('amd:reload-app', () => webview.reload());

// ─── TOP BAR: PRIVACY BLUR ────────────────────────────────────────────────────
document.getElementById('blur-toggle').addEventListener('click', () => {
    isBlurred = !isBlurred;
    viewContainer.classList.toggle('blurred', isBlurred);
    document.getElementById('blur-toggle').innerHTML = isBlurred ? '✨ Unblur' : '👁️ Blur';
    document.getElementById('blur-toggle').style.color = isBlurred ? '#60a5fa' : '';
});

document.getElementById('privacy-overlay').addEventListener('click', () => {
    isBlurred = false;
    viewContainer.classList.remove('blurred');
    document.getElementById('blur-toggle').innerHTML = '👁️ Blur';
    document.getElementById('blur-toggle').style.color = '';
});

// ─── TOP BAR: REFRESH ─────────────────────────────────────────────────────────
document.getElementById('refresh').addEventListener('click', () => {
    failCount = 0;
    offlineOverlay.classList.add('hidden');
    webview.reload();
});

// ─── TOP BAR: SETTINGS GEAR ───────────────────────────────────────────────────
function tryOpenSettings() {
    if (currentPrefs.activityTrackingEnabled) {
        showPasscodeOverlay('settings');
    } else {
        openSettingsPanel();
    }
}
document.getElementById('settings-btn').addEventListener('click', tryOpenSettings);
ipcRenderer.on('amd:open-settings', tryOpenSettings);

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12')     webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools();
    if (e.key === 'Escape')  closeSettingsPanel();
});

// ─── FORWARD BARCODE TO WEBVIEW ───────────────────────────────────────────────
ipcRenderer.on('amd:barcode-scan', (event, barcode) => {
    try { webview.send('amd:barcode-scan', barcode); } catch {}
});

// ─── SCALE LIVE READING ───────────────────────────────────────────────────────
ipcRenderer.on('amd:scale-reading', (event, data) => {
    const el = document.getElementById('scale-value');
    if (el) el.textContent = data.weight;
    document.getElementById('scale-live')?.classList.remove('hidden');
});

// =============================================================================
// SETTINGS PANEL
// =============================================================================

let currentPrefs = {};

async function openSettingsPanel() {
    document.getElementById('settings-overlay').classList.remove('hidden');

    // Load prefs
    currentPrefs = await ipcRenderer.invoke('amd:get-prefs');
    populateSystemInfo(currentPrefs);
    loadPrinterList(currentPrefs.defaultPrinter);

    // Populate tracking toggle and passcode
    const trackingEnabled = !!currentPrefs.activityTrackingEnabled;
    const trackingToggle = document.getElementById('cfg-tracking-enabled');
    const passcodeSettingWrapper = document.getElementById('passcode-setting-wrapper');
    const exitPasscodeInput = document.getElementById('cfg-exit-passcode');
    
    if (trackingToggle) {
        trackingToggle.checked = trackingEnabled;
    }
    if (passcodeSettingWrapper) {
        if (trackingEnabled) {
            passcodeSettingWrapper.classList.remove('hidden');
        } else {
            passcodeSettingWrapper.classList.add('hidden');
        }
    }
    if (exitPasscodeInput) {
        exitPasscodeInput.value = currentPrefs.exitPasscode || '1234';
    }
}

function closeSettingsPanel() {
    document.getElementById('settings-overlay').classList.add('hidden');
    document.getElementById('save-hint').textContent = '';
}

function populateSystemInfo(prefs) {
    document.getElementById('app-version').textContent    = prefs.appVersion   || '--';
    document.getElementById('app-terminal-id').textContent = prefs.terminalId  || 'Not yet assigned';
    document.getElementById('app-device-id').textContent  = prefs.deviceId     ? prefs.deviceId.substring(0, 16) + '...' : '--';
    document.getElementById('update-text').textContent    = 'Up to date ✓';
    try {
        const urlObj = new URL(prefs.cloudUrl);
        document.getElementById('app-connected-url').textContent = urlObj.host + ' ✓';
    } catch (e) {
        document.getElementById('app-connected-url').textContent = prefs.cloudUrl + ' ✓';
    }
}

// Close buttons
document.getElementById('settings-close-btn').addEventListener('click', closeSettingsPanel);
document.getElementById('settings-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-overlay')) closeSettingsPanel();
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.remove('hidden');
    });
});

// Load printer list
async function loadPrinterList(savedPrinter) {
    try {
        const printers = await ipcRenderer.invoke('amd:printers');
        const select = document.getElementById('cfg-default-printer');
        select.innerHTML = '<option value="">-- Auto-select Default --</option>';
        printers.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = `${p.displayName || p.name}${p.isDefault ? ' ✓' : ''}`;
            if (p.name === savedPrinter) opt.selected = true;
            select.appendChild(opt);
        });
    } catch {}
}

// Test printer
document.getElementById('test-printer-btn').addEventListener('click', () => {
    ipcRenderer.invoke('amd:test-print');
});

// Test cash drawer
document.getElementById('test-drawer-btn').addEventListener('click', () => {
    ipcRenderer.invoke('amd:drawer', null);
});

// Change listener for tracking toggle
document.getElementById('cfg-tracking-enabled').addEventListener('change', (e) => {
    const wrapper = document.getElementById('passcode-setting-wrapper');
    if (e.target.checked) {
        wrapper.classList.remove('hidden');
    } else {
        wrapper.classList.add('hidden');
    }
});

// Save settings
document.getElementById('settings-save-btn').addEventListener('click', async () => {
    const trackingToggle = document.getElementById('cfg-tracking-enabled');
    const exitPasscodeInput = document.getElementById('cfg-exit-passcode');
    
    const wasTracking = !!currentPrefs.activityTrackingEnabled;
    const isTracking = trackingToggle ? trackingToggle.checked : false;
    const passcodeVal = exitPasscodeInput ? exitPasscodeInput.value.trim() : '1234';
    
    if (isTracking && (passcodeVal.length !== 4 || isNaN(passcodeVal))) {
        alert('Exit passcode must be a 4-digit number.');
        return;
    }

    const updates = {
        defaultPrinter: document.getElementById('cfg-default-printer').value || null,
        activityTrackingEnabled: isTracking,
        exitPasscode: passcodeVal
    };

    if (isTracking && !wasTracking) {
        updates.consentAccepted = false;
    }

    const result = await ipcRenderer.invoke('amd:save-prefs', updates);
    const hint = document.getElementById('save-hint');

    if (result.success) {
        currentPrefs = await ipcRenderer.invoke('amd:get-prefs');
        hint.textContent = '✓ Saved!';
        hint.style.color = '#4ade80';
        setTimeout(() => { hint.textContent = ''; }, 3000);
        
        if (isTracking && !wasTracking) {
            closeSettingsPanel();
            boot();
        }
    } else {
        hint.textContent = '✗ Failed to save.';
        hint.style.color = '#f87171';
    }
});

// Disconnect store
document.getElementById('btn-disconnect-store').addEventListener('click', async () => {
    await ipcRenderer.invoke('amd:save-prefs', { connectedStore: null });
    closeSettingsPanel();
    loginOverlay.classList.remove('hidden');
    webview.src = 'about:blank';
    storeSlugInput.value = '';
});

// =============================================================================
// COM PORT MANAGEMENT
// =============================================================================

document.getElementById('refresh-ports-btn').addEventListener('click', async () => {
    const portList = document.getElementById('port-list');
    portList.innerHTML = '<p class="settings-hint">Scanning...</p>';

    const result = await ipcRenderer.invoke('amd:serial-list');
    portList.innerHTML = '';

    if (!result.success || !result.ports.length) {
        portList.innerHTML = '<p class="settings-hint">No COM ports found. Connect a device and scan again.</p>';
        return;
    }

    const scannerSel = document.getElementById('cfg-scanner-port');
    const scaleSel   = document.getElementById('cfg-scale-port');
    scannerSel.innerHTML = '<option value="">Select COM Port...</option>';
    scaleSel.innerHTML   = '<option value="">Select COM Port...</option>';

    result.ports.forEach(p => {
        const item = document.createElement('div');
        item.className = 'port-item';
        item.innerHTML = `<span class="port-badge">${p.path}</span><span>${p.manufacturer || p.friendlyName || 'Serial Device'}</span>`;
        portList.appendChild(item);

        const makeOpt = (sel, saved) => {
            const o = document.createElement('option');
            o.value = p.path;
            o.textContent = `${p.path} — ${p.manufacturer || 'Unknown'}`;
            if (p.path === saved) o.selected = true;
            sel.appendChild(o);
        };
        makeOpt(scannerSel, currentPrefs.scannerPort);
        makeOpt(scaleSel,   currentPrefs.scalePort);
    });

    if (currentPrefs.scannerBaudRate) document.getElementById('cfg-scanner-baud').value = currentPrefs.scannerBaudRate;
    if (currentPrefs.scaleBaudRate)   document.getElementById('cfg-scale-baud').value   = currentPrefs.scaleBaudRate;
});

// Connect Scanner
document.getElementById('open-scanner-btn').addEventListener('click', async () => {
    const portPath = document.getElementById('cfg-scanner-port').value;
    const baudRate = parseInt(document.getElementById('cfg-scanner-baud').value);
    const statusEl = document.getElementById('scanner-status');
    if (!portPath) { showStatus(statusEl, false, 'Select a COM port first.'); return; }
    showStatus(statusEl, null, 'Connecting...');
    const result = await ipcRenderer.invoke('amd:serial-open-scanner', { portPath, baudRate });
    showStatus(statusEl, result.success, result.success ? `Connected on ${portPath} @ ${baudRate} baud` : result.error);
});

document.getElementById('close-scanner-btn').addEventListener('click', async () => {
    await ipcRenderer.invoke('amd:serial-close', 'scanner');
    showStatus(document.getElementById('scanner-status'), null, 'Disconnected.');
});

// Connect Scale
document.getElementById('open-scale-btn').addEventListener('click', async () => {
    const portPath = document.getElementById('cfg-scale-port').value;
    const baudRate = parseInt(document.getElementById('cfg-scale-baud').value);
    const statusEl = document.getElementById('scale-status');
    if (!portPath) { showStatus(statusEl, false, 'Select a COM port first.'); return; }
    showStatus(statusEl, null, 'Connecting...');
    const result = await ipcRenderer.invoke('amd:serial-open-scale', { portPath, baudRate });
    showStatus(statusEl, result.success, result.success ? `Connected on ${portPath} @ ${baudRate} baud` : result.error);
    if (result.success) document.getElementById('scale-live').classList.remove('hidden');
});

document.getElementById('close-scale-btn').addEventListener('click', async () => {
    await ipcRenderer.invoke('amd:serial-close', 'scale');
    document.getElementById('scale-live').classList.add('hidden');
    showStatus(document.getElementById('scale-status'), null, 'Disconnected.');
});

function showStatus(el, success, msg) {
    el.classList.remove('hidden', 'success', 'error');
    if (success === true)  el.classList.add('success');
    if (success === false) el.classList.add('error');
    el.textContent = (success === true ? '✓ ' : success === false ? '✗ ' : '') + msg;
}

// =============================================================================
// AUTO-UPDATER UI
// =============================================================================

document.getElementById('check-update-btn')?.addEventListener('click', () => {
    ipcRenderer.send('amd:check-updates');
    document.getElementById('update-text').textContent = 'Checking...';
});

ipcRenderer.on('amd:update-available', (event, info) => {
    document.getElementById('update-text').innerHTML = `⬆️ Update v${info.version} available — downloading...`;
    document.getElementById('update-progress').classList.remove('hidden');
    showUpdateBanner(`Update v${info.version} is downloading...`, false);
});

ipcRenderer.on('amd:update-progress', (event, { percent }) => {
    const bar = document.getElementById('update-bar');
    const pct = document.getElementById('update-pct');
    if (bar) bar.style.width = percent + '%';
    if (pct) pct.textContent = percent + '%';
});

ipcRenderer.on('amd:update-ready', (event, info) => {
    document.getElementById('update-progress').classList.add('hidden');
    document.getElementById('update-text').innerHTML = `✅ v${info.version} ready — restart to install`;
    document.getElementById('install-update-btn').classList.remove('hidden');
    showUpdateBanner(`v${info.version} ready! Click to install.`, true);
});

document.getElementById('install-update-btn')?.addEventListener('click', () => {
    ipcRenderer.send('amd:install-update');
});

let updateBanner = null;
function showUpdateBanner(msg, isReady = false) {
    if (updateBanner) updateBanner.remove();
    updateBanner = document.createElement('div');
    updateBanner.style.cssText = `
        position:fixed;bottom:20px;right:20px;z-index:3000;
        background:${isReady ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)'};
        border:1px solid ${isReady ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.35)'};
        color:${isReady ? '#4ade80' : '#a5b4fc'};
        padding:12px 18px;border-radius:10px;font-size:12px;font-weight:600;
        backdrop-filter:blur(10px);max-width:300px;cursor:pointer;
        animation:slideUpPanel 0.3s ease;
    `;
    updateBanner.textContent = '⬆️ ' + msg;
    updateBanner.addEventListener('click', () => {
        openSettingsPanel();
        setTimeout(() => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelector('[data-tab="system"]').classList.add('active');
            document.getElementById('tab-system').classList.remove('hidden');
        }, 100);
    });
    document.body.appendChild(updateBanner);
    if (!isReady) setTimeout(() => updateBanner?.remove(), 5000);
}
