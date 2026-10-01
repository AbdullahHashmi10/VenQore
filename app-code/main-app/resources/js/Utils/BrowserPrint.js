export const escapePrintText = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
export function escapePrintData(value) {
    if (typeof value === 'string') return escapePrintText(value);
    if (Array.isArray(value)) return value.map(escapePrintData);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, escapePrintData(item)]));
    return value;
}

// Each job owns its frame; simultaneous kitchen tickets cannot overwrite it.
export function printBrowserHtml(html, paperWidth = '80mm') {
    return new Promise((resolve, reject) => {
        const frame = document.createElement('iframe');
        frame.title = 'Print document';
        frame.style.cssText = 'position:fixed;left:-10000px;top:0;border:0;width:400px;height:1px';
        let started = false;
        const cleanup = () => frame.remove();
        const timeout = setTimeout(() => { cleanup(); reject(new Error('Print document did not load.')); }, 15000);
        frame.onload = async () => {
            if (started) return;
            started = true;
            try {
                const doc = frame.contentDocument;
                await Promise.race([doc.fonts?.ready || Promise.resolve(), new Promise(resolve => setTimeout(resolve, 3000))]);
                await Promise.race([Promise.all(Array.from(doc.images).map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))), new Promise(resolve => setTimeout(resolve, 4000))]);
                const width = ['58mm', '80mm', '100mm'].includes(paperWidth) ? paperWidth : '80mm';
                const page = doc.createElement('style');
                page.textContent = `@page { size: ${width} ${Math.ceil(doc.body.scrollHeight * 25.4 / 96 + 5)}mm; margin: 0; }`;
                if (paperWidth) doc.head.appendChild(page);
                clearTimeout(timeout);
                frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
                frame.contentWindow.focus();
                frame.contentWindow.print();
                // A dialog being shown does not confirm a physical print.
                resolve({ success: true, method: 'browser', dialogOpened: true });
                setTimeout(cleanup, 120000);
            } catch (error) { clearTimeout(timeout); cleanup(); reject(error); }
        };
        frame.srcdoc = html;
        document.body.appendChild(frame);
    });
}
