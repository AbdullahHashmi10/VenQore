'use strict';
/**
 * PrinterService — every printer Station can reach, one queue per printer,
 * and the routing decision between raw ESC/POS and the Windows driver.
 */
const { EventEmitter } = require('events');
const escpos = require('./escpos');
const netprinter = require('./netprinter');
const { rasterPlan, driverBody, documentHtml } = require('./receipt-html');
const renderer = require('./renderer');

// Names/drivers/ports that are almost always ESC/POS receipt printers.
const THERMAL_HINT = /\b(pos|thermal|receipt|tm[- ]?[a-z]?\d|tm-|rp[- ]?\d|xp[- ]?\d|xprinter|80mm|58mm|76mm|bixolon|srp[- ]?\d|star\s?(tsp|sp|mc)|tsp\d|citizen|ct-s|rongta|rp80|sewoo|gprinter|gp-|zjiang|zj-|hoin|munbyn|sunmi|posiflex|sam4s|ellix|hprt|everycom|epson\s?tm|black\s?copper|bc-85|tvs\s?rp|rugtek|winpos|wp-|nyear|hp\s?a799|metapace|partner\s?rp|kitchen)\b/i;
const NOT_THERMAL = /(pdf|xps|onenote|fax|zebra|zdesigner|tsc|godex|label|microsoft print|send to)/i;

// What a print job is *for*. Each role can have its own printer (and a backup), so the
// kitchen ticket, the customer bill and the shelf label never fight over one default.
const ROLES = ['receipt', 'kitchen', 'bar', 'takeaway', 'label', 'document'];
const ROLE_LABEL = { receipt: 'Customer bills', kitchen: 'Kitchen tickets', bar: 'Bar tickets', takeaway: 'Takeaway tickets', label: 'Labels', document: 'A4 documents & reports' };

const DEFAULT_PROFILE = { mode: 'auto', paper: 'auto', cut: 'partial', drawerPin: 2, feed: 4, darkness: 165, beep: false };

/** Custom paper for label printers: { widthMm, heightMm } (20–300 mm) → Electron's micron size. */
function labelSize(p) {
    if (!p || typeof p !== 'object') return null;
    const w = Number(p.widthMm), h = Number(p.heightMm);
    if (!(w >= 20 && w <= 300 && h >= 20 && h <= 600)) return null;
    return { width: Math.round(w * 1000), height: Math.round(h * 1000) };
}

function paperMmFor(spec) { return spec.dots === 384 ? 58 : spec.dots === 832 ? 104 : 80; }

class PrinterService extends EventEmitter {
    constructor({ prefs, spool }) {
        super();
        this.prefs = prefs;
        this.spool = spool;
        this.cache = null;       // { at, list }
        this.queues = new Map(); // printer → promise chain
        this.history = [];
        this.status = {};        // name → { state, label, ... }
        this.helperBroken = false;
        this.electronList = null; // fn → Electron's own printer list, set by main
    }

    // ── Discovery ────────────────────────────────────────────────────────
    async list(force = false) {
        if (!force && this.cache && Date.now() - this.cache.at < 20000) return this.cache.list;
        let windows = [];
        if (this.spool.available && !this.helperBroken) {
            try { windows = await this.spool.list(); }
            catch (e) { console.warn('[Printers] spooler list failed, using Electron list:', e.message); }
        }
        if (!windows.length && this.electronList) {
            try {
                windows = (await this.electronList()).map(p => ({ name: p.name, displayName: p.displayName, driver: p.options?.['printer-make-and-model'] || '', port: '', isDefault: false, state: 'unknown', label: '' }));
            } catch {}
        }
        const list = windows.map(p => ({
            name: p.name,
            displayName: p.displayName || p.name,
            isDefault: !!p.isDefault,
            kind: 'windows',
            driver: p.driver || '',
            port: p.port || '',
            jobs: p.jobs || 0,
            status: p.label || (p.state === 'ready' ? 'Ready' : ''),
            state: p.state || 'unknown',
            thermal: this.looksThermal(p),
        }));
        for (const n of this.prefs.get('networkPrinters') || []) {
            const name = `tcp://${n.host}:${n.port || 9100}`;
            const st = this.status[name] || {};
            list.push({ name, displayName: n.label ? `${n.label} (${n.host})` : `Network ${n.host}`, isDefault: false, kind: 'network', driver: 'ESC/POS network', port: `${n.host}:${n.port || 9100}`, jobs: 0, status: st.label || '', state: st.state || 'unknown', thermal: true });
        }
        for (const p of list) this.status[p.name] = { ...(this.status[p.name] || {}), state: p.state, label: p.status, jobs: p.jobs };
        this.cache = { at: Date.now(), list };
        return list;
    }

    looksThermal(p) {
        const s = `${p.name} ${p.driver || ''} ${p.port || ''}`;
        if (NOT_THERMAL.test(s)) return false;
        return THERMAL_HINT.test(s) || /generic\s*\/\s*text only/i.test(p.driver || '');
    }

    profile(name) {
        const saved = (this.prefs.get('printerProfiles') || {})[name] || {};
        return { ...DEFAULT_PROFILE, ...saved };
    }

    setProfile(name, updates) {
        const all = { ...(this.prefs.get('printerProfiles') || {}) };
        const clean = {};
        if (['auto', 'escpos', 'driver'].includes(updates.mode)) clean.mode = updates.mode;
        if (['auto', '58mm', '80mm', '104mm'].includes(updates.paper)) clean.paper = updates.paper;
        if (['partial', 'full', 'none'].includes(updates.cut)) clean.cut = updates.cut;
        if ([2, 5].includes(Number(updates.drawerPin))) clean.drawerPin = Number(updates.drawerPin);
        if (Number.isInteger(Number(updates.feed)) && updates.feed >= 0 && updates.feed <= 12) clean.feed = Number(updates.feed);
        if (Number(updates.darkness) >= 100 && Number(updates.darkness) <= 230) clean.darkness = Number(updates.darkness);
        if (typeof updates.beep === 'boolean') clean.beep = updates.beep;
        all[name] = { ...(all[name] || {}), ...clean };
        this.prefs.set({ printerProfiles: all });
        return this.profile(name);
    }

    /** Explicit name → saved default → only/first thermal printer → Windows default. */
    async resolve(name) {
        const list = await this.list();
        const pick = (n) => list.find(p => p.name === n);
        if (name) {
            // Only printers Station already knows (installed, or network printers a manager added in
            // Station settings). A web page can never aim Station at an arbitrary IP address.
            const p = pick(name);
            if (!p) throw new Error(`Printer "${name}" is not installed on this computer.`);
            return p;
        }
        const saved = this.prefs.get('defaultPrinter');
        if (saved) {
            const p = pick(saved);
            if (p) return p;
            throw new Error(`The receipt printer "${saved}" is not connected. Check the cable/power or choose another in Station settings.`);
        }
        const thermal = list.filter(p => p.thermal);
        if (thermal.length) return thermal[0];
        const def = list.find(p => p.isDefault);
        if (def) return def;
        throw new Error('No printer found. Install the receipt printer driver, or add a network printer in Station settings.');
    }

    // ── Roles ────────────────────────────────────────────────────────────
    roleConfig(role) {
        role = ROLES.includes(role) ? role : 'receipt';
        const saved = (this.prefs.get('printerRoles') || {})[role] || {};
        // "Customer bills" is the Station default printer — one source, no drift.
        const printer = role === 'receipt' ? (this.prefs.get('defaultPrinter') || null) : (saved.printer || null);
        return { role, printer, fallback: saved.fallback || null };
    }

    async setRole(role, { printer = null, fallback = null } = {}) {
        if (!ROLES.includes(role)) return { success: false, error: 'Unknown print role.' };
        const list = await this.list(true);
        const known = (n) => n === null || n === '' || list.some(p => p.name === n);
        if (!known(printer) || !known(fallback)) return { success: false, error: 'Choose a printer that is installed or added in Station.' };
        printer = printer || null; fallback = fallback || null;
        if (printer && printer === fallback) fallback = null;
        const all = { ...(this.prefs.get('printerRoles') || {}) };
        all[role] = { printer: role === 'receipt' ? null : printer, fallback };
        const patch = { printerRoles: all };
        if (role === 'receipt') patch.defaultPrinter = printer;
        this.prefs.set(patch);
        return { success: true };
    }

    rolesView() {
        return ROLES.map(r => ({ ...this.roleConfig(r), label: ROLE_LABEL[r] }));
    }

    /**
     * Printer names to try, in order.
     * A role the manager set up on THIS till wins (kitchen tickets go to this till's kitchen printer even if the
     * store-wide setting names another PC's printer). Otherwise: the name the POS gave → role → customer-bills printer.
     */
    candidates(job) {
        const names = [];
        const add = (n) => { if (n && !names.includes(n)) names.push(n); };
        const r = this.roleConfig(job.role);
        const bills = this.roleConfig('receipt');
        if (r.role !== 'receipt' && r.printer) { add(r.printer); add(r.fallback); add(job.printerName); }
        else { add(job.printerName); if (!job.printerName || r.role !== 'receipt') add(r.printer); add(r.fallback); }
        // nothing named and no printer for this role → the customer-bills printer (never when the POS named one explicitly for a bill)
        if (!names.length || (!r.printer && !job.printerName)) { add(bills.printer); add(bills.fallback); }
        return names.length ? names : [null];
    }

    useEscpos(printer, profile) {
        if (profile.mode === 'escpos') return true;
        if (profile.mode === 'driver') return false;
        if (printer.kind === 'network') return true;
        return !!printer.thermal && !this.helperBroken && this.spool.available;
    }

    // ── Transport ────────────────────────────────────────────────────────
    async sendRaw(printer, bytes, doc) {
        const target = netprinter.parseTarget(printer.name);
        if (target) return netprinter.send(target.host, target.port, bytes);
        if (!this.spool.available) return { success: false, error: 'Raw printing to Windows printers is only available on Windows.' };
        try {
            return await this.spool.sendRaw(printer.name, bytes, doc);
        } catch (e) {
            this.helperBroken = true;
            return { success: false, error: 'Windows blocked the print helper: ' + e.message, helper: true };
        }
    }

    enqueue(name, fn) {
        const prev = this.queues.get(name) || Promise.resolve();
        const run = prev.then(fn, fn);
        this.queues.set(name, run.catch(() => {}));
        return run;
    }

    record(entry) {
        this.history.unshift({ at: new Date().toISOString(), ...entry });
        if (this.history.length > 40) this.history.pop();
        this.emit('job', this.history[0]);
    }

    // ── Jobs ─────────────────────────────────────────────────────────────
    async buildEscpos(content, spec, profile, { cut = true, drawer = false, copies = 1 }) {
        const plan = rasterPlan(content);
        const cssWidth = spec.mm * 96 / 25.4;
        const body = [escpos.init()];
        for (const seg of plan) {
            if (seg.kind === 'html') {
                const html = documentHtml(seg.body, { widthMm: spec.mm, zoom: spec.dots / cssWidth });
                const r = await renderer.rasterize(html, spec.dots, { threshold: profile.darkness });
                if (r.height) body.push(escpos.raster(r.bits, r.widthBytes, r.height));
            } else if (seg.kind === 'barcode') {
                body.push(escpos.barcode(seg.value, { height: Math.round(seg.height * 1.6), width: seg.width, hri: seg.hri }));
            } else if (seg.kind === 'qr') {
                body.push(escpos.qr(seg.value, { size: seg.size }));
            }
        }
        if (profile.beep) body.push(escpos.beep());
        body.push(cut ? escpos.cut(profile.cut, profile.feed) : escpos.feed(profile.feed));
        const one = Buffer.concat(body);
        const parts = [];
        for (let i = 0; i < copies; i++) parts.push(one);
        if (drawer) parts.push(escpos.drawer(profile.drawerPin));
        return Buffer.concat(parts);
    }

    /**
     * job: { content, printerName?, copies?, paperWidth?, autoCut?, openDrawer?, label? }
     */
    async print(job) {
        const names = this.candidates(job);
        let last = null;
        for (let i = 0; i < names.length; i++) {
            let printer;
            try { printer = await this.resolve(names[i]); }
            catch (e) {
                this.record({ ok: false, printer: names[i] || '(default)', error: e.message, ms: 0, label: job.label });
                last = { success: false, error: e.message };
                continue;
            }
            const res = await this.printOn(printer, job);
            if (res.success) return i > 0 ? { ...res, fallbackUsed: true } : res;
            last = res;
        }
        return last || { success: false, error: 'No printer available.' };
    }

    printOn(printer, job) {
        const started = Date.now();
        return this.enqueue(printer.name, async () => {
            const profile = this.profile(printer.name);
            const spec = escpos.paperSpec(profile.paper === 'auto' ? job.paperWidth : profile.paper);
            const copies = Math.max(1, Math.min(5, job.copies | 0 || 1));
            let res, mode;
            try {
                if (this.useEscpos(printer, profile)) {
                    mode = 'escpos';
                    const bytes = await this.buildEscpos(job.content, spec, profile, { cut: job.autoCut !== false, drawer: !!job.openDrawer, copies });
                    res = await this.sendRaw(printer, bytes, job.label || 'VenQore receipt');
                    if (!res.success && res.helper && printer.kind === 'windows') {
                        mode = 'driver (fallback)';
                        res = await this.printViaDriver(printer, job.content, spec, copies);
                    }
                } else {
                    mode = 'driver';
                    res = await this.printViaDriver(printer, job.content, spec, copies);
                    if (res.success && job.openDrawer) {
                        // same queue — send the pulse directly (calling openDrawer() here would wait on itself)
                        const d = await this.sendRaw(printer, Buffer.concat([escpos.init(), escpos.drawer(profile.drawerPin)]), 'Cash drawer');
                        if (!d.success) res = { ...res, drawerError: d.error };
                    }
                }
            } catch (e) {
                res = { success: false, error: e.message };
            }
            this.record({ ok: !!res.success, printer: printer.displayName || printer.name, mode, ms: Date.now() - started, error: res.error, label: job.label });
            if (!res.success) console.warn('[Print] failed on', printer.name, res.error);
            this.cache = this.cache && { ...this.cache, at: 0 }; // refresh status on next look
            return { ...res, printer: printer.name, mode };
        });
    }

    async printViaDriver(printer, content, spec, copies) {
        if (printer.kind === 'network') return { success: false, error: 'Network printers print in ESC/POS mode only.' };
        const pageMm = paperMmFor(spec);
        const html = documentHtml(await driverBody(content), { widthMm: spec.mm, pageMm });
        return renderer.printDriver(html, { printerName: printer.name, pageMm, copies });
    }

    /** Arbitrary document (A4 invoice, label) printed silently through the driver. */
    async printHtml({ html, printerName, role, pageSize = 'A4', copies = 1, landscape = false }) {
        if (typeof html !== 'string' || html.length > 5_000_000) return { success: false, error: 'Invalid document' };
        let printer;
        try {
            if (printerName) printer = await this.resolve(printerName);
            else {
                const r = role && ROLES.includes(role) ? this.roleConfig(role) : null;
                const wanted = r && (r.printer || r.fallback);
                printer = wanted ? await this.resolve(wanted) : ((await this.list()).find(p => p.isDefault) || null);
            }
            if (!printer) throw new Error('No default Windows printer is set.');
        } catch (e) { return { success: false, error: e.message }; }
        const csp = `<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; frame-src 'none'">`;
        const doc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + csp) : csp + html;
        const sizes = ['A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'];
        return this.enqueue(printer.name, async () => {
            const started = Date.now();
            const res = await renderer.printDriver(doc, { printerName: printer.name, pageSize: labelSize(pageSize) || (sizes.includes(pageSize) ? pageSize : 'A4'), copies: Math.max(1, Math.min(10, copies | 0 || 1)), landscape: !!landscape });
            this.record({ ok: !!res.success, printer: printer.displayName || printer.name, mode: 'document', ms: Date.now() - started, error: res.error, label: 'Document' });
            return res;
        });
    }

    async openDrawer(printerName, pin) {
        let printer;
        try { printer = await this.resolve(printerName); }
        catch (e) { return { success: false, error: e.message }; }
        const profile = this.profile(printer.name);
        return this.enqueue(printer.name, async () => {
            const res = await this.sendRaw(printer, Buffer.concat([escpos.init(), escpos.drawer(pin === 5 ? 5 : profile.drawerPin)]), 'Cash drawer');
            this.record({ ok: !!res.success, printer: printer.displayName || printer.name, mode: 'drawer', ms: 0, error: res.error, label: 'Cash drawer' });
            return res.success ? { success: true } : { success: false, error: res.error || 'Cash drawer did not open.' };
        });
    }

    testPrint(printerName, version) {
        const now = new Date();
        return this.print({
            printerName, label: 'Test page', paperWidth: '80mm',
            content: [
                { type: 'text', value: 'VenQore Station', style: { fontWeight: '800', textAlign: 'center', fontSize: '20px' } },
                { type: 'text', value: 'Printer test', style: { textAlign: 'center', fontSize: '13px' } },
                { type: 'text', value: `v${version} · ${now.toLocaleString()}`, style: { textAlign: 'center', fontSize: '10px' } },
                { type: 'text', value: '────────────────────────', style: { textAlign: 'center' } },
                { type: 'table', tableHeader: ['Item', 'Qty', 'Total'], tableBody: [['Tea (large)', '2', '360.00'], ['Samosa', '4', '200.00']], tableFooter: ['', 'Total', '560.00'], style: { fontSize: '12px' } },
                { type: 'text', value: 'شکریہ — Thank you', style: { textAlign: 'center', fontSize: '16px', fontWeight: '700' } },
                { type: 'text', value: 'If you can read Urdu above, fonts are OK.', style: { textAlign: 'center', fontSize: '10px' } },
                { type: 'barCode', value: 'VQ-TEST-001', height: 40, width: 2, displayValue: true },
                { type: 'qrCode', value: 'https://venqore.com', width: 110 },
                { type: 'text', value: 'Paper should cut below this line.', style: { textAlign: 'center', fontSize: '10px' } },
            ],
        });
    }

    // ── Status polling ───────────────────────────────────────────────────
    async refreshStatus() {
        const list = await this.list(true).catch(() => []);
        const nets = list.filter(p => p.kind === 'network');
        await Promise.all(nets.map(async (p) => {
            const t = netprinter.parseTarget(p.name);
            if (!t) return;
            const st = await netprinter.status(t.host, t.port);
            this.status[p.name] = { ...this.status[p.name], ...st };
            p.state = st.state; p.status = st.label;
        }));
        this.emit('status', list);
        return list;
    }
}

module.exports = { PrinterService, THERMAL_HINT, NOT_THERMAL, DEFAULT_PROFILE, ROLES, ROLE_LABEL };
