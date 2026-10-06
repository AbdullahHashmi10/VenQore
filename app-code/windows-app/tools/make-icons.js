'use strict';
/**
 * Builds every Station icon from the one source of truth: assets/icon.svg
 * (the same mark the web app serves at /images/icon.svg).
 *   assets/icon.png  512 px   window / Linux
 *   assets/tray.png   32 px   tray (non-Windows)
 *   assets/icon.ico  16–256   exe, installer, shortcuts, tray on Windows
 *   build/icon.ico            electron-builder default location
 * Small sizes are BMP entries (NSIS and old shell versions reject PNG-in-ICO
 * below 256 px); 256 px is PNG-compressed.
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'assets/icon.svg'), 'utf8').replace(/^﻿/, '');

function render(size, pad = 0) {
    const inner = Math.round(size * (1 - pad * 2));
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: inner }, background: 'rgba(0,0,0,0)' }).render();
    const px = Buffer.from(r.pixels);
    // centre on a square transparent canvas (the mark is not exactly square)
    const out = Buffer.alloc(size * size * 4);
    const ox = Math.floor((size - r.width) / 2), oy = Math.floor((size - r.height) / 2);
    for (let y = 0; y < r.height && y + oy < size; y++) {
        if (y + oy < 0) continue;
        px.copy(out, ((y + oy) * size + Math.max(0, ox)) * 4, y * r.width * 4, y * r.width * 4 + Math.min(r.width, size) * 4);
    }
    return { png: pngFromRgba(out, size), rgba: out, w: size, h: size };
}

// minimal PNG encoder (for the padded canvas)
function pngFromRgba(rgba, size) {
    const zlib = require('zlib');
    const raw = Buffer.alloc((size * 4 + 1) * size);
    for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
    const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function bmpEntry(rgba, size) {
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0); header.writeInt32LE(size, 4); header.writeInt32LE(size * 2, 8);
    header.writeUInt16LE(1, 12); header.writeUInt16LE(32, 14); header.writeUInt32LE(0, 16);
    const xor = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const s = (y * size + x) * 4, d = ((size - 1 - y) * size + x) * 4; // bottom-up BGRA
        xor[d] = rgba[s + 2]; xor[d + 1] = rgba[s + 1]; xor[d + 2] = rgba[s]; xor[d + 3] = rgba[s + 3];
    }
    const maskRow = Math.ceil(size / 32) * 4;
    const and = Buffer.alloc(maskRow * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (rgba[(y * size + x) * 4 + 3] < 128) and[(size - 1 - y) * maskRow + (x >> 3)] |= 0x80 >> (x & 7);
    return Buffer.concat([header, xor, and]);
}

function ico(sizes) {
    const images = sizes.map(s => { const r = render(s, s <= 32 ? 0.02 : 0); return s >= 256 ? r.png : bmpEntry(r.rgba, s); });
    const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
    const dir = Buffer.alloc(16 * sizes.length);
    let offset = 6 + dir.length;
    sizes.forEach((s, i) => {
        const o = i * 16;
        dir[o] = s >= 256 ? 0 : s; dir[o + 1] = s >= 256 ? 0 : s; dir[o + 2] = 0; dir[o + 3] = 0;
        dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
        dir.writeUInt32LE(images[i].length, o + 8); dir.writeUInt32LE(offset, o + 12);
        offset += images[i].length;
    });
    return Buffer.concat([head, dir, ...images]);
}

fs.mkdirSync(path.join(root, 'build'), { recursive: true });
fs.writeFileSync(path.join(root, 'assets/icon.png'), render(512).png);
fs.writeFileSync(path.join(root, 'assets/tray.png'), render(32, 0.02).png);
const icoBuf = ico([16, 20, 24, 32, 40, 48, 64, 128, 256]);
fs.writeFileSync(path.join(root, 'assets/icon.ico'), icoBuf);
fs.writeFileSync(path.join(root, 'build/icon.ico'), icoBuf);
fs.writeFileSync(path.join(root, 'build/icon.png'), render(1024).png);
console.log('icons written:', icoBuf.length, 'byte ico');
