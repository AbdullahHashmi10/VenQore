const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizePrintContent } = require('../print-payload');
test('native print boundary escapes text and nested table cells', () => {
    const rows = sanitizePrintContent([
        { type: 'text', value: '<img src=x onerror="require(\'fs\')">' },
        { type: 'table', tableHeader: ['<b>Product</b>'], tableBody: [[{ type: 'text', value: '<script>bad()</script>' }, 'A&B']] },
    ]);
    assert.equal(rows[0].value.includes('<'), false);
    assert.equal(rows[1].tableBody[0][0].value.includes('<'), false);
    assert.equal(rows[1].tableBody[0][1], 'A&amp;B');
});
test('unsupported file-reading image payloads fail closed', () => {
    assert.throws(() => sanitizePrintContent([{ type: 'image', path: 'C:\\secret.txt' }]));
});
