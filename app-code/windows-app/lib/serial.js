'use strict';
/**
 * Serial (COM) devices: barcode scanner, weighing scale, pole display.
 *
 * v2 opened a port once and forgot it: unplug the scanner and it was gone
 * until someone reopened Settings; restart Station and the saved port was
 * never reopened at all. Here every device has a desired state, reconnects
 * on hot-plug, and reports its live status.
 */
const { EventEmitter } = require('events');
const escpos = require('./escpos');

const VALID_BAUD = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
const PORT_RE = /^(COM\d{1,3}|\/dev\/tty[A-Za-z0-9._-]+)$/;
const SCALE_POLL = { none: null, W: Buffer.from('W\r'), P: Buffer.from('P\r'), ENQ: Buffer.from([0x05]), SI: Buffer.from('SI\r\n') };

function loadSerial() {
    try { return require('serialport'); } catch (e) { console.error('[Serial] serialport unavailable:', e.message); return null; }
}

/** "ST,GS,+  1.234 kg" · "US,NT,- 0.020kg" · "   12.5 lb" · "W 001.250" → reading */
function parseWeight(line, defaultUnit = 'kg') {
    const text = String(line || '').replace(/[\x00-\x1f]/g, ' ').trim();
    if (!text) return null;
    const m = /([+-])?\s*(\d+(?:[.,]\d+)?)\s*(kg|g|lb|lbs|oz)?/i.exec(text);
    if (!m) return null;
    let value = parseFloat(m[2].replace(',', '.'));
    if (m[1] === '-') value = -value;
    const unit = (m[3] || defaultUnit).toLowerCase().replace('lbs', 'lb');
    const kg = unit === 'g' ? value / 1000 : unit === 'lb' ? value * 0.45359237 : unit === 'oz' ? value * 0.028349523 : value;
    const unstable = /\b(US|MO|MOTION)\b|\?/i.test(text);
    const overload = /\b(OL|OVER|ERR)\b/i.test(text);
    return { weight: Math.round(kg * 1000) / 1000, value, unit, stable: !unstable && !overload, overload, raw: text };
}

class SerialDevice extends EventEmitter {
    constructor(kind, manager) {
        super();
        this.kind = kind;
        this.manager = manager;
        this.port = null;
        this.path = null;
        this.baudRate = 9600;
        this.wanted = false;
        this.connected = false;
        this.error = null;
        this.buffer = '';
        this.flushTimer = null;
        this.pollTimer = null;
        this.last = null;
    }

    status() {
        return { kind: this.kind, path: this.path, baudRate: this.baudRate, connected: this.connected, wanted: this.wanted, error: this.error, last: this.last };
    }

    async open(path, baudRate = 9600, opts = {}) {
        if (!PORT_RE.test(String(path)) || !VALID_BAUD.includes(Number(baudRate))) return { success: false, error: 'Invalid port or baud rate' };
        await this.close(false);
        this.path = path; this.baudRate = Number(baudRate); this.opts = opts; this.wanted = true;
        return this.connect();
    }

    connect() {
        const sp = loadSerial();
        if (!sp) return Promise.resolve({ success: false, error: 'Serial support is not available in this build.' });
        return new Promise((resolve) => {
            let port;
            try {
                port = new sp.SerialPort({ path: this.path, baudRate: this.baudRate, autoOpen: false });
            } catch (e) { this.error = e.message; this.emitStatus(); return resolve({ success: false, error: e.message }); }
            port.open((err) => {
                if (err) {
                    this.error = /access denied|busy/i.test(err.message) ? `${this.path} is in use by another program` : err.message;
                    this.connected = false; this.emitStatus();
                    if (this.wanted) this.manager.watch();
                    return resolve({ success: false, error: this.error });
                }
                this.port = port; this.connected = true; this.error = null;
                port.on('data', (d) => this.onData(d));
                port.on('error', (e) => { this.error = e.message; console.warn(`[Serial:${this.kind}]`, e.message); });
                port.on('close', () => {
                    this.connected = false; this.port = null; this.stopPoll();
                    if (this.wanted) { this.error = 'Disconnected — waiting for the device'; this.manager.watch(); }
                    this.emitStatus();
                });
                this.startPoll();
                this.emitStatus();
                console.log(`[Serial:${this.kind}] connected ${this.path} @ ${this.baudRate}`);
                resolve({ success: true });
            });
        });
    }

    async close(forget = true) {
        if (forget) this.wanted = false;
        this.stopPoll();
        const port = this.port;
        this.port = null;
        this.connected = false;
        if (port && port.isOpen) await new Promise(r => port.close(() => r()));
        this.emitStatus();
        return { success: true };
    }

    write(buf) {
        if (!this.port || !this.connected) return { success: false, error: `${this.kind} is not connected` };
        this.port.write(buf);
        return { success: true };
    }

    startPoll() {
        if (this.kind !== 'scale') return;
        const cmd = SCALE_POLL[this.opts?.poll || 'none'];
        if (!cmd) return;
        this.pollTimer = setInterval(() => { try { this.port && this.port.write(cmd); } catch {} }, 250);
    }
    stopPoll() { clearInterval(this.pollTimer); this.pollTimer = null; }

    onData(chunk) {
        if (this.kind === 'pole') return;
        this.buffer += chunk.toString('latin1');
        // STX/ETX framed scales and CR / LF / CRLF terminated scanners.
        const parts = this.buffer.split(/\r\n|\r|\n|\x03/);
        this.buffer = parts.pop();
        for (const p of parts) this.onLine(p.replace(/\x02/g, ''));
        // Scanners configured with no suffix: flush after a quiet gap.
        clearTimeout(this.flushTimer);
        if (this.buffer) this.flushTimer = setTimeout(() => { const b = this.buffer; this.buffer = ''; this.onLine(b); }, this.kind === 'scanner' ? 80 : 300);
        if (this.buffer.length > 4096) this.buffer = '';
    }

    onLine(line) {
        if (this.kind === 'scanner') {
            const code = line.replace(/[\x00-\x1f\x7f]/g, '').trim();
            if (!code || code.length > 200) return;
            this.last = { code, at: Date.now() };
            this.emit('scan', code);
        } else if (this.kind === 'scale') {
            const r = parseWeight(line, this.opts?.unit || 'kg');
            if (!r) return;
            const prev = this.last;
            this.last = { ...r, at: Date.now() };
            if (!prev || prev.weight !== r.weight || prev.stable !== r.stable || Date.now() - prev.at > 1000) this.emit('weight', this.last);
        }
    }

    emitStatus() { this.manager.emit('status', this.manager.status()); }
}

class SerialManager extends EventEmitter {
    constructor() {
        super();
        this.devices = { scanner: new SerialDevice('scanner', this), scale: new SerialDevice('scale', this), pole: new SerialDevice('pole', this) };
        this.watchTimer = null;
    }

    async list() {
        const sp = loadSerial();
        if (!sp) return { success: false, error: 'Serial support unavailable', ports: [] };
        try {
            const ports = await sp.SerialPort.list();
            return { success: true, ports: ports.map(p => ({ path: p.path, manufacturer: p.manufacturer || '', friendlyName: p.friendlyName || '', vendorId: p.vendorId || '', productId: p.productId || '', serialNumber: p.serialNumber || '' })) };
        } catch (e) { return { success: false, error: e.message, ports: [] }; }
    }

    /** Hot-plug: while any wanted device is down, look for its port every 3 s. */
    watch() {
        if (this.watchTimer) return;
        this.watchTimer = setInterval(async () => {
            const waiting = Object.values(this.devices).filter(d => d.wanted && !d.connected);
            if (!waiting.length) { clearInterval(this.watchTimer); this.watchTimer = null; return; }
            const { ports } = await this.list();
            const present = new Set(ports.map(p => p.path));
            for (const d of waiting) if (present.has(d.path)) await d.connect();
        }, 3000);
    }

    status() {
        const out = {};
        for (const [k, d] of Object.entries(this.devices)) out[k] = d.status();
        return out;
    }

    pole(line1, line2) { return this.devices.pole.write(escpos.poleDisplay(line1, line2)); }

    async closeAll() { for (const d of Object.values(this.devices)) await d.close(true).catch(() => {}); clearInterval(this.watchTimer); }
}

module.exports = { SerialManager, parseWeight, VALID_BAUD, PORT_RE };
