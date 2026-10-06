'use strict';
/**
 * ESC/POS encoder — the bytes a thermal printer actually understands.
 *
 * Station 2 printed receipts as an HTML page through the Windows driver, so it
 * could not cut paper and could not open a cash drawer (kickDrawer() returned
 * a hard-coded failure). Station 3 speaks ESC/POS directly: the receipt is
 * rendered by Chromium (so Urdu, Arabic, logos and any font work), converted
 * to a 1-bit raster, and sent with native cut / drawer / barcode / QR commands.
 */

const ESC = 0x1b, GS = 0x1d;

const PAPER = {
    // printable dots at 203 dpi (8 dots/mm), and the CSS width they map to
    '58mm':  { dots: 384, mm: 48 },
    '80mm':  { dots: 576, mm: 72 },
    '104mm': { dots: 832, mm: 104 },
};

function paperSpec(width) {
    const w = String(width || '80mm').toLowerCase();
    if (w === '100mm' || w === '104mm' || w === '4inch') return PAPER['104mm'];
    if (w === '58mm' || w === '2inch') return PAPER['58mm'];
    return PAPER['80mm'];
}

const init = () => Buffer.from([ESC, 0x40]);
const align = (n) => Buffer.from([ESC, 0x61, n]); // 0 left, 1 centre, 2 right
const feed = (lines = 3) => Buffer.from([ESC, 0x64, Math.max(0, Math.min(255, lines | 0))]);

/** GS V — feed n lines then cut. partial is the safe default (paper stays attached on some heads). */
function cut(kind = 'partial', feedLines = 4) {
    if (kind === 'none') return feed(feedLines);
    return Buffer.from([GS, 0x56, kind === 'full' ? 65 : 66, Math.max(0, Math.min(255, feedLines | 0))]);
}

/** ESC p m t1 t2 — pulse the drawer kick connector. pin 2 (m=0) is the standard cable; pin 5 (m=1) the second drawer. */
function drawer(pin = 2, onMs = 50, offMs = 500) {
    const t1 = Math.max(1, Math.min(255, Math.round(onMs / 2)));
    const t2 = Math.max(1, Math.min(255, Math.round(offMs / 2)));
    return Buffer.from([ESC, 0x70, pin === 5 ? 1 : 0, t1, t2]);
}

/** Printer buzzer (Epson-compatible kitchen printers: ESC B n t). Ignored by printers without one. */
function beep(times = 2, duration = 3) {
    return Buffer.from([ESC, 0x42, Math.min(9, times), Math.min(9, duration)]);
}

/**
 * GS v 0 raster, sent in bands so small-buffer printers don't overflow.
 * bits: Buffer, 1 bit per dot, MSB first, rows of `widthBytes`.
 */
function raster(bits, widthBytes, height, band = 240) {
    const parts = [];
    for (let y = 0; y < height; y += band) {
        const h = Math.min(band, height - y);
        parts.push(Buffer.from([GS, 0x76, 0x30, 0x00, widthBytes & 0xff, widthBytes >> 8, h & 0xff, h >> 8]));
        parts.push(bits.subarray(y * widthBytes, (y + h) * widthBytes));
    }
    return Buffer.concat(parts);
}

/**
 * RGBA/BGRA pixels → packed 1-bit rows. `threshold` 0-255: higher = darker.
 * Trailing blank rows are dropped so a receipt never wastes paper.
 */
function toMonochrome(pixels, width, height, { threshold = 165, bgra = true } = {}) {
    const widthBytes = Math.ceil(width / 8);
    const out = Buffer.alloc(widthBytes * height);
    let lastInk = -1;
    const rI = bgra ? 2 : 0, bI = bgra ? 0 : 2;
    for (let y = 0; y < height; y++) {
        let rowInk = false;
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const a = pixels[i + 3] / 255;
            // composite over white so transparent pixels are paper, not ink
            const lum = (0.299 * pixels[i + rI] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + bI]) * a + 255 * (1 - a);
            if (lum < threshold) {
                out[y * widthBytes + (x >> 3)] |= 0x80 >> (x & 7);
                rowInk = true;
            }
        }
        if (rowInk) lastInk = y;
    }
    const rows = lastInk + 1;
    return { bits: out.subarray(0, rows * widthBytes), widthBytes, height: rows };
}

/** CODE128 barcode (GS k 73). Values outside printable ASCII fall back to a raster-free skip. */
function barcode(value, { height = 60, width = 2, hri = true } = {}) {
    const data = String(value || '').replace(/[^\x20-\x7e]/g, '').slice(0, 250);
    if (!data) return Buffer.alloc(0);
    const payload = Buffer.from('{B' + data, 'ascii');
    return Buffer.concat([
        align(1),
        Buffer.from([GS, 0x68, Math.max(20, Math.min(255, height | 0))]),
        Buffer.from([GS, 0x77, Math.max(2, Math.min(6, width | 0))]),
        Buffer.from([GS, 0x48, hri ? 2 : 0]),
        Buffer.from([GS, 0x66, 0]),
        Buffer.from([GS, 0x6b, 73, payload.length]),
        payload,
        Buffer.from([0x0a]),
        align(0),
    ]);
}

/** Native QR (GS ( k): model 2, size 1-16, error correction M. */
function qr(value, { size = 6 } = {}) {
    const data = Buffer.from(String(value || '').slice(0, 1500), 'utf8');
    if (!data.length) return Buffer.alloc(0);
    const len = data.length + 3;
    return Buffer.concat([
        align(1),
        Buffer.from([GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00]),
        Buffer.from([GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, Math.max(1, Math.min(16, size | 0))]),
        Buffer.from([GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31]),
        Buffer.from([GS, 0x28, 0x6b, len & 0xff, len >> 8, 0x31, 0x50, 0x30]),
        data,
        Buffer.from([GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30]),
        Buffer.from([0x0a]),
        align(0),
    ]);
}

/** 2×20 VFD pole display: clear, then two fixed-width lines. */
function poleDisplay(line1 = '', line2 = '', cols = 20) {
    const fit = (s) => String(s || '').replace(/[^\x20-\x7e]/g, '').slice(0, cols).padEnd(cols, ' ');
    return Buffer.concat([Buffer.from([ESC, 0x40, 0x0c]), Buffer.from(fit(line1) + fit(line2), 'ascii')]);
}

module.exports = { PAPER, paperSpec, init, align, feed, cut, drawer, beep, raster, toMonochrome, barcode, qr, poleDisplay };
