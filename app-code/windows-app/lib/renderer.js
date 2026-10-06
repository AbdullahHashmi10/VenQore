'use strict';
/**
 * Hidden Chromium surfaces for printing.
 *   rasterize(html, dots) → { bits, widthBytes, height }   (ESC/POS path)
 *   printDriver(html, opts)                                 (Windows driver path)
 *
 * One warm window per job type is reused — creating a BrowserWindow per
 * receipt is what made the v2 path feel slow. Jobs are serialised.
 */
const { BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const escpos = require('./escpos');

let rasterWin = null;
let driverWin = null;
let chain = Promise.resolve();
const TILE = 1200;

function tmpFile() {
    const dir = path.join(app.getPath('temp'), 'venqore-station-render');
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `r-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.html`);
}

const SAFE_PREFS = {
    sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: true,
    backgroundThrottling: false, spellcheck: false, webSecurity: true,
    partition: 'venqore-station-render', images: true,
};

function getRasterWin() {
    if (rasterWin && !rasterWin.isDestroyed()) return rasterWin;
    rasterWin = new BrowserWindow({
        show: false, width: 576, height: TILE, useContentSize: true, frame: false,
        skipTaskbar: true, focusable: false,
        webPreferences: { ...SAFE_PREFS, offscreen: true },
    });
    rasterWin.webContents.setFrameRate(30);
    rasterWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    rasterWin.webContents.on('will-navigate', e => e.preventDefault());
    rasterWin.on('closed', () => { rasterWin = null; });
    return rasterWin;
}

function getDriverWin() {
    if (driverWin && !driverWin.isDestroyed()) return driverWin;
    driverWin = new BrowserWindow({
        show: false, width: 800, height: 1000, frame: false, skipTaskbar: true, focusable: false,
        webPreferences: { ...SAFE_PREFS },
    });
    driverWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    driverWin.webContents.on('will-navigate', e => e.preventDefault());
    driverWin.on('closed', () => { driverWin = null; });
    return driverWin;
}

function serial(fn) {
    const run = chain.then(fn, fn);
    chain = run.catch(() => {});
    return run;
}

async function loadHtml(win, html) {
    const file = tmpFile();
    fs.writeFileSync(file, html);
    try {
        await win.loadFile(file);
        await win.webContents.executeJavaScript('document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))))');
    } finally {
        setTimeout(() => fs.unlink(file, () => {}), 2000);
    }
}

const nextFrame = (win) => win.webContents.executeJavaScript('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');

/** Render HTML at exactly `dots` wide and return 1-bit raster rows. */
function rasterize(html, dots, { threshold = 165 } = {}) {
    return serial(async () => {
        const win = getRasterWin();
        win.setContentSize(dots, TILE);
        await loadHtml(win, html);
        const total = Math.ceil(await win.webContents.executeJavaScript('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)'));
        const height = Math.max(1, Math.min(total, 30000));
        const rows = [];
        for (let y = 0; y < height; y += TILE) {
            await win.webContents.executeJavaScript(`window.scrollTo(0, ${y}); window.scrollY`);
            await nextFrame(win);
            const actualY = await win.webContents.executeJavaScript('window.scrollY');
            let img = await win.webContents.capturePage();
            let { width: iw } = img.getSize();
            if (iw !== dots) img = img.resize({ width: dots, quality: 'best' });
            const size = img.getSize();
            const scale = size.height / TILE;
            const skip = Math.max(0, Math.round((y - actualY) * scale));
            const want = Math.min(size.height - skip, Math.round(Math.min(TILE, height - y) * scale));
            if (want <= 0) continue;
            const bmp = img.toBitmap();
            const start = skip * size.width * 4;
            rows.push({ pixels: bmp.subarray(start, start + want * size.width * 4), width: size.width, height: want });
        }
        const width = dots;
        const h = rows.reduce((n, r) => n + r.height, 0);
        const all = Buffer.concat(rows.map(r => r.pixels));
        return escpos.toMonochrome(all, width, h, { threshold, bgra: true });
    });
}

/** Silent driver print. pageMm: paper width; height derived from content unless pageSize given. */
function printDriver(html, { printerName, pageMm = 80, pageSize = null, copies = 1, landscape = false }) {
    return serial(async () => {
        const win = getDriverWin();
        await loadHtml(win, html);
        let size = pageSize;
        if (!size) {
            const px = await win.webContents.executeJavaScript('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)');
            const heightMicrons = Math.max(10000, Math.ceil((px * 25.4 / 96) * 1000) + 2000);
            size = { width: Math.round(pageMm * 1000), height: heightMicrons };
        }
        return await new Promise((resolve) => {
            win.webContents.print({
                silent: true, deviceName: printerName, printBackground: true, copies,
                margins: { marginType: typeof pageSize === 'string' ? 'default' : 'none' }, pageSize: size, landscape,
            }, (ok, reason) => resolve(ok ? { success: true } : { success: false, error: reason || 'Printer refused the job' }));
        });
    });
}

function warm() {
    try { getRasterWin().loadURL('about:blank'); } catch {}
}

function dispose() {
    for (const w of [rasterWin, driverWin]) { try { if (w && !w.isDestroyed()) w.destroy(); } catch {} }
}

module.exports = { rasterize, printDriver, warm, dispose };
