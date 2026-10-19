// Client-side CSV export of the rows currently shown.
//
// Two safeguards:
//  1. Permission: downloads need the `data.export` permission. OneGlanceLayout
//     calls setExportAllowed() with the signed-in user's access; until then (or
//     when it is false) exportRowsToCsv refuses and returns false.
//  2. Formula safety: text starting with = + - @ is prefixed with ' so Excel
//     never runs it as a formula.

let exportAllowed = false;

export function setExportAllowed(allowed) {
    exportAllowed = !!allowed;
}

export function canExportCsv() {
    return exportAllowed;
}

const DENIED_MESSAGE = 'You do not have permission to export data. Ask the store owner for "Export Store Data" access.';

export function exportRowsToCsv(filename, columns, rows) {
    if (!exportAllowed) {
        if (typeof window !== 'undefined') window.alert(DENIED_MESSAGE);
        return false;
    }
    const esc = (v) => {
        if (v === null || v === undefined) return '';
        let s = String(v);
        if (typeof v !== 'number' && s !== '' && Number.isNaN(Number(s)) && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
        return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [columns.map((c) => esc(c.label)).join(',')];
    (rows || []).forEach((row) => {
        lines.push(columns.map((c) => esc(c.get(row))).join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
}
