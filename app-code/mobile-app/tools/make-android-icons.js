'use strict';

/**
 * Generates Android launcher assets from the canonical VenQore SVG copied to
 * assets/brand/venqore-icon.svg. Legacy icons use the V6 pine background;
 * adaptive foregrounds stay transparent and inside Android's safe zone.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const { Resvg } = require(path.join(root, '..', 'windows-app', 'node_modules', '@resvg', 'resvg-js'));
const svg = fs.readFileSync(path.join(root, 'assets', 'brand', 'venqore-icon.svg'), 'utf8').replace(/^﻿/, '');

const densities = {
    mdpi: { legacy: 48, adaptive: 108 },
    hdpi: { legacy: 72, adaptive: 162 },
    xhdpi: { legacy: 96, adaptive: 216 },
    xxhdpi: { legacy: 144, adaptive: 324 },
    xxxhdpi: { legacy: 192, adaptive: 432 },
};

function renderPixels(canvasSize, fill, markRatio) {
    const inner = Math.round(canvasSize * markRatio);
    const rendered = new Resvg(svg, { fitTo: { mode: 'width', value: inner }, background: 'rgba(0,0,0,0)' }).render();
    const source = Buffer.from(rendered.pixels);
    const output = Buffer.alloc(canvasSize * canvasSize * 4);
    const background = fill || [0, 0, 0, 0];
    for (let i = 0; i < canvasSize * canvasSize; i++) {
        output[i * 4] = background[0];
        output[i * 4 + 1] = background[1];
        output[i * 4 + 2] = background[2];
        output[i * 4 + 3] = background[3];
    }
    const ox = Math.floor((canvasSize - rendered.width) / 2);
    const oy = Math.floor((canvasSize - rendered.height) / 2);
    for (let y = 0; y < rendered.height; y++) {
        for (let x = 0; x < rendered.width; x++) {
            const s = (y * rendered.width + x) * 4;
            const d = ((y + oy) * canvasSize + x + ox) * 4;
            const alpha = source[s + 3] / 255;
            output[d] = Math.round(source[s] * alpha + output[d] * (1 - alpha));
            output[d + 1] = Math.round(source[s + 1] * alpha + output[d + 1] * (1 - alpha));
            output[d + 2] = Math.round(source[s + 2] * alpha + output[d + 2] * (1 - alpha));
            output[d + 3] = Math.round((alpha + output[d + 3] / 255 * (1 - alpha)) * 255);
        }
    }
    return output;
}

function pngFromRgba(rgba, size) {
    const raw = Buffer.alloc((size * 4 + 1) * size);
    for (let y = 0; y < size; y++) {
        raw[y * (size * 4 + 1)] = 0;
        rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
    }
    const crcTable = Array.from({ length: 256 }, (_, n) => {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        return c >>> 0;
    });
    const crc = (buffer) => {
        let c = 0xffffffff;
        for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type, data) => {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        const typedData = Buffer.concat([Buffer.from(type), data]);
        const checksum = Buffer.alloc(4);
        checksum.writeUInt32BE(crc(typedData));
        return Buffer.concat([length, typedData, checksum]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8;
    header[9] = 6;
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', header),
        chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
for (const [density, sizes] of Object.entries(densities)) {
    const dir = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    const legacy = renderPixels(sizes.legacy, [6, 36, 33, 255], 0.72);
    const foreground = renderPixels(sizes.adaptive, null, 0.62);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), pngFromRgba(legacy, sizes.legacy));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), pngFromRgba(legacy, sizes.legacy));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), pngFromRgba(foreground, sizes.adaptive));
}

console.log('Android launcher icons generated from assets/brand/venqore-icon.svg');
