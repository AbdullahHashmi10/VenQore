'use strict';
// The receipt payload crosses from web content into the native print path.
// Everything in it is data: text is escaped when the HTML is built, styles are
// whitelisted, and nothing may make Station read a local file.

const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const SAFE_IMAGE = /^data:image\/(png|jpe?g|gif|webp|bmp);base64,[a-z0-9+/=\s]+$/i;

function safeCell(cell) {
    if (cell && typeof cell === 'object') {
        if (cell.type !== 'text') throw new Error('Receipt table cells must be text');
        return { ...cell, value: escapeText(cell.value) };
    }
    return escapeText(cell);
}

/** Throws on anything the native printer path will not accept. */
function validatePrintContent(content) {
    if (!Array.isArray(content)) throw new Error('Receipt content must be a list of rows');
    if (content.length > 800) throw new Error('Receipt is too long');
    for (const row of content) {
        if (!row || typeof row !== 'object') throw new Error('Invalid receipt row');
        if (row.type === 'text' || row.type === 'table' || row.type === 'barCode' || row.type === 'qrCode') continue;
        if (row.type === 'image' && typeof row.url === 'string' && SAFE_IMAGE.test(row.url) && !row.path) continue;
        throw new Error('Unsupported receipt content type');
    }
    return content;
}

/** Kept for older callers/tests: validates and returns an HTML-escaped copy. */
function sanitizePrintContent(content) {
    validatePrintContent(content);
    return content.map(row => {
        if (row.type === 'text') return { ...row, value: escapeText(row.value) };
        if (row.type === 'table') return {
            ...row,
            tableHeader: row.tableHeader?.map(safeCell),
            tableBody: row.tableBody?.map(cells => cells.map(safeCell)),
            tableFooter: row.tableFooter?.map(safeCell),
        };
        return row;
    });
}

module.exports = { sanitizePrintContent, validatePrintContent, escapeText, SAFE_IMAGE };
