'use strict';
/**
 * Receipt rows (the electron-pos-printer format the web app already sends)
 * → self-contained HTML. Used by both print paths:
 *   • raster ESC/POS: text/table/image runs become HTML segments that are
 *     rendered and rasterised; barcode/QR rows become native printer commands.
 *   • driver mode: one HTML document printed silently through Windows.
 */
const { escapeText, validatePrintContent } = require('../print-payload');

// ── Style whitelist ─────────────────────────────────────────────────────────
const BAD_VALUE = /[<>"'{};\\]|url\s*\(|expression|@import|javascript:/i;

function kebab(k) { return k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }

function styleString(style) {
    if (!style) return '';
    const out = [];
    if (typeof style === 'string') {
        for (const decl of style.split(';')) {
            const i = decl.indexOf(':');
            if (i < 1) continue;
            const k = decl.slice(0, i).trim().toLowerCase();
            const v = decl.slice(i + 1).trim();
            if (/^[a-z-]{1,40}$/.test(k) && v && !BAD_VALUE.test(v) && v.length < 120) out.push(`${k}:${v}`);
        }
        return out.join(';');
    }
    if (typeof style !== 'object') return '';
    for (const [k, raw] of Object.entries(style)) {
        if (!/^[a-zA-Z]{1,40}$/.test(k)) continue;
        if (typeof raw !== 'string' && typeof raw !== 'number') continue;
        const v = String(raw).trim();
        if (!v || BAD_VALUE.test(v) || v.length > 120) continue;
        out.push(`${kebab(k)}:${v}`);
    }
    return out.join(';');
}

const attr = s => (s ? ` style="${s}"` : '');

function cellHtml(cell, tag, rowStyle) {
    if (cell && typeof cell === 'object') {
        return `<${tag}${attr([rowStyle, styleString(cell.style)].filter(Boolean).join(';'))}>${escapeText(cell.value)}</${tag}>`;
    }
    return `<${tag}${attr(rowStyle)}>${escapeText(cell)}</${tag}>`;
}

function rowHtml(row) {
    if (row.type === 'text') {
        return `<div class="t"${attr(styleString(row.style))}>${escapeText(row.value)}</div>`;
    }
    if (row.type === 'table') {
        const hs = styleString(row.tableHeaderStyle), bs = styleString(row.tableBodyStyle), fs = styleString(row.tableFooterStyle);
        const head = Array.isArray(row.tableHeader) && row.tableHeader.length
            ? `<thead><tr>${row.tableHeader.map(c => cellHtml(c, 'th', hs)).join('')}</tr></thead>` : '';
        const body = Array.isArray(row.tableBody)
            ? `<tbody>${row.tableBody.map(r => `<tr>${(Array.isArray(r) ? r : []).map(c => cellHtml(c, 'td', bs)).join('')}</tr>`).join('')}</tbody>` : '';
        const foot = Array.isArray(row.tableFooter) && row.tableFooter.length
            ? `<tfoot><tr>${row.tableFooter.map(c => cellHtml(c, 'th', fs)).join('')}</tr></tfoot>` : '';
        return `<table${attr(styleString(row.style))}>${head}${body}${foot}</table>`;
    }
    if (row.type === 'image') {
        const pos = ['left', 'right'].includes(row.position) ? row.position : 'center';
        const w = /^\d{1,4}(px|%)?$/.test(String(row.width || '')) ? String(row.width) : 'auto';
        return `<div class="img" style="text-align:${pos}"><img src="${row.url.replace(/\s/g, '')}" style="max-width:100%;width:${/\d$/.test(w) ? w + 'px' : w}"></div>`;
    }
    return '';
}

// ── Code 128-B for driver-mode barcodes (raster mode uses the printer's own) ─
const C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];

function code128Svg(value, height = 50, showText = true) {
    const data = String(value || '').replace(/[^\x20-\x7e]/g, '');
    if (!data) return '';
    const codes = [104];
    for (const ch of data) codes.push(ch.charCodeAt(0) - 32);
    let sum = 104;
    for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
    codes.push(sum % 103, 106);
    let x = 10; const rects = [];
    for (const c of codes) {
        const p = C128[c];
        for (let i = 0; i < p.length; i++) {
            const w = Number(p[i]);
            if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}"/>`);
            x += w;
        }
    }
    const total = x + 10;
    const text = showText ? `<text x="${total / 2}" y="${height + 12}" font-size="11" text-anchor="middle" font-family="monospace">${escapeText(data)}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height + (showText ? 15 : 0)}" style="width:90%;max-width:${total * 2}px;shape-rendering:crispEdges">${rects.join('')}${text}</svg>`;
}

async function qrSvg(value) {
    try {
        const QR = require('qrcode');
        const svg = await QR.toString(String(value || ''), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
        return svg.replace('<svg ', '<svg style="width:45%;shape-rendering:crispEdges" ');
    } catch { return ''; }
}

// ── Document ────────────────────────────────────────────────────────────────
const BASE_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000}
body{font-family:"Segoe UI","Noto Sans","Noto Naskh Arabic","Jameel Noori Nastaleeq","Urdu Typesetting",Tahoma,Arial,sans-serif;font-size:12px;line-height:1.3;font-weight:500;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.t{white-space:pre-wrap;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse;font-size:inherit}
th,td{padding:1px 2px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{font-weight:700}
.bc{text-align:center;margin:4px 0}
img{display:inline-block}
`;

function documentHtml(bodyHtml, { widthMm, pageMm, zoom = 1 }) {
    const csp = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";
    const pageCss = pageMm ? `@page{size:${pageMm}mm auto;margin:0}html{width:${pageMm}mm}` : '';
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">
<style>${BASE_CSS}${pageCss}html{zoom:${zoom}}body{width:${widthMm}mm;margin:0 auto;padding:0 0.5mm}</style></head><body>${bodyHtml}</body></html>`;
}

/**
 * Raster plan: [{ kind:'html', html } | { kind:'barcode', value, height, width, hri } | { kind:'qr', value, size }]
 */
function rasterPlan(content) {
    validatePrintContent(content);
    const plan = [];
    let run = [];
    const flush = () => { if (run.length) { plan.push({ kind: 'html', body: run.join('') }); run = []; } };
    for (const row of content) {
        if (row.type === 'barCode') {
            flush();
            plan.push({ kind: 'barcode', value: row.value, height: Number(row.height) || 50, width: Number(row.width) || 2, hri: row.displayValue !== false });
        } else if (row.type === 'qrCode') {
            flush();
            const px = Number(row.width) || Number(row.height) || 120;
            plan.push({ kind: 'qr', value: row.value, size: Math.max(3, Math.min(10, Math.round(px / 22))) });
        } else {
            run.push(rowHtml(row));
        }
    }
    flush();
    return plan;
}

/** Single HTML body for the driver path (barcodes drawn as SVG). */
async function driverBody(content) {
    validatePrintContent(content);
    const parts = [];
    for (const row of content) {
        if (row.type === 'barCode') parts.push(`<div class="bc">${code128Svg(row.value, Number(row.height) || 40, row.displayValue !== false)}</div>`);
        else if (row.type === 'qrCode') parts.push(`<div class="bc">${await qrSvg(row.value)}</div>`);
        else parts.push(rowHtml(row));
    }
    return parts.join('');
}

module.exports = { rasterPlan, driverBody, documentHtml, styleString, code128Svg, C128 };
