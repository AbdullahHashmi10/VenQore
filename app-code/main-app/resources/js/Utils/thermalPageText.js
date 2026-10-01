// Reflow operational documents into a roll-friendly text layout. Tables become
// labeled records so wide reports never shrink to illegible A4-sized columns.
export function thermalPageText(element) {
    const read = node => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ');
        if (node.nodeType !== 1) return '';
        if (node.matches('script, style, nav, aside, button, input, select, textarea, form, svg, [hidden], .no-print, .print\\:hidden, [role="dialog"]')) return '';
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return '';
        if (node.tagName === 'BR') return '\n';
        if (node.tagName === 'TABLE') {
            const headings = Array.from(node.querySelectorAll('thead th')).map(cell => read(cell).trim());
            return '\n' + Array.from(node.rows).filter(row => !row.closest('thead')).map(row =>
                Array.from(row.cells).map((cell, index) => {
                    const value = read(cell).trim();
                    return value ? `${headings[index] ? headings[index] + ': ' : ''}${value}` : '';
                }).filter(Boolean).join('\n')
            ).join('\n\n') + '\n';
        }
        const text = Array.from(node.childNodes).map(read).join('');
        return /^(DIV|SECTION|ARTICLE|MAIN|P|H[1-6]|LI|UL|OL|DL|DT|DD|TR)$/.test(node.tagName)
            ? `\n${text}\n` : text;
    };
    return read(element).replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
