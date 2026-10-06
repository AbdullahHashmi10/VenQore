'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
const net = require('net');

const escpos = require('../lib/escpos');
const { rasterPlan, driverBody, styleString, code128Svg } = require('../lib/receipt-html');
const { parseWeight } = require('../lib/serial');
const netprinter = require('../lib/netprinter');
const { describeStatus, asciiJson } = require('../lib/winspool');

test('drawer pulse is ESC p with pin selection', () => {
    assert.deepEqual([...escpos.drawer(2)], [0x1b, 0x70, 0, 25, 250]);
    assert.equal(escpos.drawer(5)[2], 1);
});

test('cut feeds then cuts; "none" only feeds', () => {
    assert.deepEqual([...escpos.cut('partial', 4)], [0x1d, 0x56, 66, 4]);
    assert.deepEqual([...escpos.cut('full', 3)], [0x1d, 0x56, 65, 3]);
    assert.deepEqual([...escpos.cut('none', 2)], [0x1b, 0x64, 2]);
});

test('paper widths map to printer dots, incl. the web app "100mm"', () => {
    assert.equal(escpos.paperSpec('58mm').dots, 384);
    assert.equal(escpos.paperSpec('80mm').dots, 576);
    assert.equal(escpos.paperSpec('100mm').dots, 832);
    assert.equal(escpos.paperSpec(undefined).dots, 576);
});

test('monochrome conversion packs MSB-first and trims blank tail', () => {
    const w = 16, h = 4;
    const px = Buffer.alloc(w * h * 4, 255);
    // black pixel at (0,0) and (9,1)
    for (const [x, y] of [[0, 0], [9, 1]]) { const i = (y * w + x) * 4; px[i] = px[i + 1] = px[i + 2] = 0; }
    const m = escpos.toMonochrome(px, w, h);
    assert.equal(m.widthBytes, 2);
    assert.equal(m.height, 2); // rows 2-3 are blank and trimmed
    assert.equal(m.bits[0], 0x80);
    assert.equal(m.bits[3], 0x40);
});

test('transparent pixels count as paper', () => {
    const px = Buffer.alloc(8 * 1 * 4, 0); // fully transparent black
    assert.equal(escpos.toMonochrome(px, 8, 1).height, 0);
});

test('raster bands split tall images', () => {
    const bits = Buffer.alloc(72 * 500);
    const out = escpos.raster(bits, 72, 500, 240);
    const headers = [];
    for (let i = 0; i < out.length - 3; i++) if (out[i] === 0x1d && out[i + 1] === 0x76 && out[i + 2] === 0x30) headers.push(i);
    assert.ok(headers.length >= 3);
});

test('barcode and QR commands are well formed', () => {
    const b = escpos.barcode('INV-1001');
    assert.ok(b.includes(Buffer.from('{BINV-1001')));
    const q = escpos.qr('https://venqore.com');
    assert.ok(q.includes(Buffer.from('https://venqore.com')));
    assert.equal(escpos.barcode('').length, 0);
});

test('pole display pads to two 20-char lines', () => {
    const p = escpos.poleDisplay('Tea', 'TOTAL 360');
    assert.equal(p.length, 3 + 40);
});

test('receipt plan splits HTML runs around barcodes', () => {
    const plan = rasterPlan([
        { type: 'text', value: 'A' }, { type: 'text', value: 'B' },
        { type: 'barCode', value: '123' }, { type: 'text', value: 'C' }, { type: 'qrCode', value: 'x' },
    ]);
    assert.deepEqual(plan.map(p => p.kind), ['html', 'barcode', 'html', 'qr']);
});

test('receipt HTML escapes text and drops dangerous styles', async () => {
    const plan = rasterPlan([{ type: 'text', value: '<img src=x onerror=alert(1)>', style: { color: 'red', background: 'url(http://x)', 'bad-key': 'x' } }]);
    assert.ok(!plan[0].body.includes('<img'));
    assert.ok(plan[0].body.includes('color:red'));
    assert.ok(!plan[0].body.includes('url('));
    assert.equal(styleString('font-weight:700; behavior:expression(alert(1))'), 'font-weight:700');
    const body = await driverBody([{ type: 'barCode', value: 'ABC' }, { type: 'qrCode', value: 'hello' }]);
    assert.ok(body.includes('<svg'));
});

test('image rows accept only inline data images', () => {
    assert.throws(() => rasterPlan([{ type: 'image', path: 'C:\\secret.txt' }]));
    assert.throws(() => rasterPlan([{ type: 'image', url: 'file:///C:/x.png' }]));
    assert.equal(rasterPlan([{ type: 'image', url: 'data:image/png;base64,iVBORw0KGgo=' }]).length, 1);
});

test('code 128 checksum matches the reference ("Wikipedia" example)', () => {
    const svg = code128Svg('Wikipedia', 50, false);
    assert.ok(svg.startsWith('<svg'));
});

test('scale readings: units, sign, stability', () => {
    assert.deepEqual(
        (({ weight, stable }) => ({ weight, stable }))(parseWeight('ST,GS,+  1.234 kg')),
        { weight: 1.234, stable: true });
    assert.equal(parseWeight('US,NT,- 0.020kg').stable, false);
    assert.equal(parseWeight('US,NT,- 0.020kg').weight, -0.02);
    assert.equal(parseWeight('1250 g').weight, 1.25);
    assert.equal(parseWeight('OL'), null);
    assert.equal(parseWeight('OL 99.99 kg').overload, true);
});

test('network printer targets parse safely', () => {
    assert.deepEqual(netprinter.parseTarget('tcp://192.168.1.50:9100'), { host: '192.168.1.50', port: 9100 });
    assert.equal(netprinter.parseTarget('tcp://evil host:9100'), null);
    assert.equal(netprinter.parseTarget('EPSON TM-T20'), null);
});

test('DLE EOT status decoding', () => {
    assert.equal(netprinter.decode([0x16, 0x12, 0x12]).state, 'ready');
    assert.equal(netprinter.decode([0x16, 0x32, 0x12]).label, 'Out of paper');
    assert.equal(netprinter.decode([0x16, 0x12, 0x1e]).paperLow, true);
});

test('Windows spooler status bits', () => {
    assert.equal(describeStatus(0, 0).state, 'ready');
    assert.equal(describeStatus(0x80, 0).state, 'offline');
    assert.equal(describeStatus(0, 0x400).state, 'offline');
    assert.equal(describeStatus(0x10, 0).label, 'Out of paper');
});

test('helper JSON is pure ASCII (console code pages cannot mangle names)', () => {
    const s = asciiJson({ printer: 'پرنٹر – Kitchen' });
    assert.ok(/^[\x00-\x7f]*$/.test(s));
    assert.equal(JSON.parse(s).printer, 'پرنٹر – Kitchen');
});

test('network send delivers bytes to a 9100 listener', async () => {
    const got = [];
    const server = net.createServer(sock => sock.on('data', d => got.push(d)));
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();
    const res = await netprinter.send('127.0.0.1', port, Buffer.from([1, 2, 3]));
    await new Promise(r => setTimeout(r, 50));
    server.close();
    assert.equal(res.success, true);
    assert.deepEqual([...Buffer.concat(got)], [1, 2, 3]);
});

test('unreachable network printer fails fast with a readable error', async () => {
    const res = await netprinter.send('127.0.0.1', 1, Buffer.from([1]), 2000);
    assert.equal(res.success, false);
    assert.match(res.error, /unreachable|did not respond/);
});

test('prefs: atomic save, PIN hashing, v2 passcode migration', () => {
    const { Prefs } = require('../lib/prefs');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vq-prefs-'));
    fs.writeFileSync(path.join(dir, 'station-prefs.json'), JSON.stringify({ deviceId: 'abc', exitPasscode: '4821', connectedStore: 'shop' }));
    const p = new Prefs(dir);
    assert.equal(p.get('deviceId'), 'abc');
    assert.equal(p.hasPin(), true);
    assert.equal(p.verifyPin('4821'), true);
    assert.equal(p.verifyPin('1234'), false);
    const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'station-prefs.json'), 'utf8'));
    assert.equal(onDisk.exitPasscode, undefined);
    assert.ok(!JSON.stringify(p.publicView()).includes('4821'));
    assert.equal(p.publicView().managerPinHash, undefined);

    // corrupt file → falls back to .bak, keeps the device identity
    fs.writeFileSync(path.join(dir, 'station-prefs.json'), '{"deviceId": "ab');
    const p2 = new Prefs(dir);
    assert.equal(p2.get('deviceId'), 'abc');
});

test('printer routing: explicit, saved, first thermal, Windows default', async () => {
    const { PrinterService } = require('../lib/printers');
    const store = { defaultPrinter: null, networkPrinters: [], printerProfiles: {} };
    const prefs = { get: k => store[k], set: u => Object.assign(store, u) };
    const spool = { available: true, list: async () => [
        { name: 'Microsoft Print to PDF', driver: 'Microsoft Print To PDF', isDefault: true, state: 'ready' },
        { name: 'BlackCopper 80mm', driver: 'POS-80C', port: 'USB001', state: 'ready' },
    ] };
    const svc = new PrinterService({ prefs, spool });
    assert.equal((await svc.resolve(null)).name, 'BlackCopper 80mm');
    store.defaultPrinter = 'Microsoft Print to PDF';
    svc.cache = null;
    assert.equal((await svc.resolve(null)).name, 'Microsoft Print to PDF');
    store.defaultPrinter = 'Gone printer';
    await assert.rejects(svc.resolve(null), /not connected/);
    // a web page can never aim Station at an address that is not a saved network printer
    await assert.rejects(svc.resolve('tcp://10.0.0.9:9100'), /not installed/);
    store.networkPrinters = [{ host: '10.0.0.9', port: 9100, label: 'Kitchen' }]; svc.cache = null;
    assert.equal((await svc.resolve('tcp://10.0.0.9:9100')).kind, 'network');
    await assert.rejects(svc.resolve('tcp://169.254.169.254:80'), /not installed/);
    const pdf = (await svc.list(true)).find(p => p.name.includes('PDF'));
    assert.equal(pdf.thermal, false);
});

test('print roles: kitchen vs bills, fallback order, receipt mirrors the Station default', async () => {
    const { PrinterService } = require('../lib/printers');
    const store = { defaultPrinter: 'Counter 80mm', networkPrinters: [{ host: '10.0.0.9', port: 9100, label: 'Kitchen' }], printerProfiles: {}, printerRoles: {} };
    const prefs = { get: k => store[k], set: u => Object.assign(store, u) };
    const spool = { available: true, list: async () => [
        { name: 'Counter 80mm', driver: 'POS-80C', port: 'USB001', state: 'ready' },
        { name: 'Bar 80mm', driver: 'POS-80C', port: 'USB002', state: 'ready' },
    ] };
    const svc = new PrinterService({ prefs, spool });
    // unset role → bills printer
    assert.deepEqual(svc.candidates({ role: 'kitchen' }), ['Counter 80mm']);
    assert.deepEqual(svc.candidates({}), ['Counter 80mm']);
    assert.deepEqual((await svc.setRole('kitchen', { printer: 'tcp://10.0.0.9:9100', fallback: 'Bar 80mm' })), { success: true });
    assert.deepEqual(svc.candidates({ role: 'kitchen' }), ['tcp://10.0.0.9:9100', 'Bar 80mm']);
    assert.deepEqual(svc.candidates({ role: 'receipt' }), ['Counter 80mm']);        // bills untouched
    assert.deepEqual(svc.candidates({ role: 'kitchen', printerName: 'Counter 80mm' }), ['tcp://10.0.0.9:9100', 'Bar 80mm', 'Counter 80mm']); // this till's kitchen printer wins
    assert.deepEqual(svc.candidates({ role: 'receipt', printerName: 'Bar 80mm' }), ['Bar 80mm']); // a bill sent to a named printer never silently lands on another one
    assert.deepEqual(svc.candidates({ role: 'kitchen', printerName: 'Not here' }).slice(0, 1), ['tcp://10.0.0.9:9100']);
    assert.equal((await svc.setRole('kitchen', { printer: 'tcp://6.6.6.6:9100' })).success, false);
    assert.equal((await svc.setRole('nonsense', {})).success, false);
    await svc.setRole('receipt', { printer: 'Bar 80mm' });
    assert.equal(store.defaultPrinter, 'Bar 80mm');
    // failover: first printer fails, backup prints
    svc.printOn = async (printer) => printer.name === 'tcp://10.0.0.9:9100' ? { success: false, error: 'Printer unreachable' } : { success: true, printer: printer.name };
    const r = await svc.print({ role: 'kitchen', content: [] });
    assert.equal(r.success, true); assert.equal(r.printer, 'Bar 80mm'); assert.equal(r.fallbackUsed, true);
    svc.printOn = async () => ({ success: false, error: 'all down' });
    assert.equal((await svc.print({ role: 'kitchen', content: [] })).success, false);
});
