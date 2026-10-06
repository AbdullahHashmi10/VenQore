'use strict';
/**
 * Station preferences — one JSON file in userData.
 *
 * v2 rewrote the whole file every 5 seconds from the connection monitor and a
 * crash mid-write left a truncated JSON that loadPrefs() silently replaced
 * with defaults (a new deviceId — the terminal "forgot" it was paired).
 * Writes are now atomic (tmp + rename), debounced, and a corrupt file is kept
 * aside as .corrupt instead of being overwritten.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULTS = {
    schema: 3,
    terminalId: null,          // assigned by the cloud
    deviceId: null,            // generated once, kept forever
    deviceSecret: null,        // legacy plain copy — migrated to deviceSecretEnc
    deviceSecretEnc: null,     // issued by the cloud at pairing, encrypted with Windows DPAPI (safeStorage)
    connectedStore: null,      // store slug
    lastOnlineSyncAt: null,

    // Printing
    defaultPrinter: null,
    printerProfiles: {},       // { [printerName]: { mode, paper, cut, drawerPin, feed, darkness } }
    printerRoles: {},          // { [role]: { printer, fallback } } — role 'receipt' mirrors defaultPrinter
    networkPrinters: [],       // [{ id, label, host, port }]

    // Serial devices
    scannerPort: null, scannerBaudRate: 9600, scannerWedge: true, scannerSuffix: 'enter',
    scalePort: null, scaleBaudRate: 9600, scalePoll: 'none', scaleUnit: 'kg',
    polePort: null, poleBaudRate: 9600, poleIdleLine1: 'Welcome', poleIdleLine2: '',

    // Customer display (second monitor)
    customerDisplayAuto: false,

    // Station behaviour
    windowMode: 'fullscreen',  // 'fullscreen' | 'windowed'
    windowBounds: null,
    zoom: 1,
    autoStart: true,
    keepAwake: true,
    safeGraphics: false,
    theme: 'light',

    // Security
    managerPinHash: null,      // scrypt — never the PIN itself
    managerPinSalt: null,
    lockSettings: false,
    activityTrackingEnabled: false,
    consentAccepted: false,
};

class Prefs {
    constructor(dir) {
        this.file = path.join(dir, 'station-prefs.json');
        this.data = { ...DEFAULTS };
        this.timer = null;
        this.load();
    }

    load() {
        let saved = null;
        try {
            if (fs.existsSync(this.file)) saved = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        } catch (e) {
            console.error('[Prefs] Corrupt prefs file kept as .corrupt:', e.message);
            try { fs.copyFileSync(this.file, this.file + '.corrupt'); } catch {}
            try { saved = JSON.parse(fs.readFileSync(this.file + '.bak', 'utf8')); } catch { saved = null; }
        }
        this.data = { ...DEFAULTS, ...(saved || {}) };

        // v2 → v3 migration: the exit passcode was stored in clear text with a
        // shipped default of "1234". Hash a customised one; drop the default.
        if (typeof this.data.exitPasscode === 'string') {
            const old = this.data.exitPasscode;
            delete this.data.exitPasscode;
            if (/^\d{4,8}$/.test(old) && old !== '1234') this.setPin(old, false);
            else if (old === '1234' && this.data.activityTrackingEnabled) this.setPin(old, false); // keep them locked; owner should change it
        }
        if (!this.data.deviceId) this.data.deviceId = crypto.randomUUID();
        if (!Array.isArray(this.data.networkPrinters)) this.data.networkPrinters = [];
        if (!this.data.printerProfiles || typeof this.data.printerProfiles !== 'object') this.data.printerProfiles = {};
        this.data.schema = 3;
        this.flush();
    }

    get(key) { return this.data[key]; }
    all() { return this.data; }

    set(updates, { immediate = false } = {}) {
        this.data = { ...this.data, ...updates };
        if (immediate) this.flush(); else this.schedule();
        return true;
    }

    schedule() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), 400);
    }

    flush() {
        clearTimeout(this.timer);
        this.timer = null;
        try {
            const tmp = this.file + '.tmp';
            fs.mkdirSync(path.dirname(this.file), { recursive: true });
            fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
            try { fs.copyFileSync(this.file, this.file + '.bak'); } catch {}
            fs.renameSync(tmp, this.file);
            return true;
        } catch (e) {
            console.error('[Prefs] Save failed:', e.message);
            return false;
        }
    }

    // ── Manager PIN ───────────────────────────────────────────────────────
    hasPin() { return !!(this.data.managerPinHash && this.data.managerPinSalt); }

    setPin(pin, flush = true) {
        if (pin === null) {
            this.data.managerPinHash = null; this.data.managerPinSalt = null;
        } else {
            const salt = crypto.randomBytes(16).toString('hex');
            this.data.managerPinSalt = salt;
            this.data.managerPinHash = crypto.scryptSync(String(pin), salt, 32).toString('hex');
        }
        if (flush) this.flush();
    }

    verifyPin(pin) {
        if (!this.hasPin()) return true;
        try {
            const want = Buffer.from(this.data.managerPinHash, 'hex');
            const got = crypto.scryptSync(String(pin), this.data.managerPinSalt, 32);
            return want.length === got.length && crypto.timingSafeEqual(want, got);
        } catch { return false; }
    }

    /** What may leave the main process. Secrets never do. */
    publicView() {
        const { deviceSecret, deviceSecretEnc, managerPinHash, managerPinSalt, windowBounds, ...rest } = this.data;
        return { ...rest, hasDeviceSecret: !!(deviceSecret || deviceSecretEnc), hasPin: this.hasPin() };
    }
}

module.exports = { Prefs, DEFAULTS };
