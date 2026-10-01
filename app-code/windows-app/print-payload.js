// electron-pos-printer inserts text and table cells with innerHTML.
// Escape data at the native boundary, including jobs from older web clients.
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
function safeCell(cell) {
    if (cell && typeof cell === 'object') {
        if (cell.type !== 'text') throw new Error('Receipt table cells must be text');
        return { ...cell, value: escapeText(cell.value) };
    }
    return escapeText(cell);
}
function sanitizePrintContent(content) {
    return content.map(row => {
        if (row.type === 'text') return { ...row, value: escapeText(row.value) };
        if (row.type === 'table') return {
            ...row,
            tableHeader: row.tableHeader?.map(safeCell),
            tableBody: row.tableBody?.map(cells => cells.map(safeCell)),
            tableFooter: row.tableFooter?.map(safeCell),
        };
        if (['barCode', 'qrCode'].includes(row.type)) return row;
        throw new Error('Unsupported receipt content type');
    });
}
module.exports = { sanitizePrintContent };
