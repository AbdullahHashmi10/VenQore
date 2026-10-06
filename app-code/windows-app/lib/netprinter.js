'use strict';
/**
 * Network (Ethernet/Wi-Fi) ESC/POS printers on raw port 9100 — the usual
 * kitchen / bar printer. No Windows driver needed: Station talks to the IP.
 * Also reads real-time status (DLE EOT), which a driver queue never can:
 * offline, cover open, paper out / near end, and the cash-drawer sensor.
 */
const net = require('net');

function parseTarget(name) {
    const m = /^tcp:\/\/([a-z0-9.\-]+|\[[0-9a-f:]+\]):(\d{1,5})$/i.exec(String(name || ''));
    if (!m) return null;
    const port = Number(m[2]);
    if (port < 1 || port > 65535) return null;
    return { host: m[1].replace(/^\[|\]$/g, ''), port };
}

function send(host, port, data, timeoutMs = 8000) {
    return new Promise((resolve) => {
        const sock = new net.Socket();
        let done = false;
        const finish = (res) => { if (done) return; done = true; try { sock.destroy(); } catch {} resolve(res); };
        sock.setTimeout(timeoutMs);
        sock.once('timeout', () => finish({ success: false, error: `Printer ${host}:${port} did not respond` }));
        sock.once('error', (e) => finish({ success: false, error: `Printer ${host}:${port} unreachable (${e.code || e.message})` }));
        sock.connect(port, host, () => {
            sock.write(data, (err) => {
                if (err) return finish({ success: false, error: err.message });
                sock.end();
                setTimeout(() => finish({ success: true }), 400); // some printers never close their side
            });
        });
        sock.once('close', () => finish({ success: true }));
    });
}

/** DLE EOT 1 (printer) + DLE EOT 2 (offline cause) + DLE EOT 4 (paper). */
function status(host, port, timeoutMs = 2500) {
    return new Promise((resolve) => {
        const sock = new net.Socket();
        const bytes = [];
        let done = false;
        const finish = (res) => { if (done) return; done = true; try { sock.destroy(); } catch {} resolve(res); };
        sock.setTimeout(timeoutMs);
        sock.once('error', () => finish({ online: false, state: 'offline', label: 'Unreachable' }));
        sock.once('timeout', () => finish(bytes.length ? decode(bytes) : { online: true, state: 'ready', label: 'Ready', limited: true }));
        sock.on('data', (d) => { bytes.push(...d); if (bytes.length >= 3) finish(decode(bytes)); });
        sock.connect(port, host, () => sock.write(Buffer.from([0x10, 0x04, 0x01, 0x10, 0x04, 0x02, 0x10, 0x04, 0x04])));
    });
}

function decode([p, o, r]) {
    const out = { online: true, state: 'ready', label: 'Ready' };
    if (p !== undefined) {
        out.drawerSensor = (p & 0x04) ? 'high' : 'low'; // meaning depends on the drawer model
        if (p & 0x08) { out.state = 'offline'; out.label = 'Offline'; }
    }
    if (o !== undefined) {
        if (o & 0x04) { out.state = 'error'; out.label = 'Cover open'; }
        if (o & 0x20) { out.state = 'error'; out.label = 'Out of paper'; }
        if (o & 0x40) { out.state = 'error'; out.label = 'Printer error'; }
    }
    if (r !== undefined) {
        if (r & 0x60) { out.state = 'error'; out.label = 'Out of paper'; }
        else if (r & 0x0c && out.state === 'ready') { out.state = 'warning'; out.label = 'Paper low'; out.paperLow = true; }
    }
    return out;
}

module.exports = { parseTarget, send, status, decode };
