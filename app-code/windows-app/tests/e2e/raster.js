// electron tests/e2e/raster.js — prints the Station test page to a fake 9100 printer and decodes the raster to PNG.
const { app, nativeImage } = require('electron');
const net = require('net');
const fs = require('fs');
const path = require('path');
app.setPath('userData', fs.mkdtempSync('/tmp/vq-raster-'));
app.whenReady().then(async () => {
  const got = [];
  const server = net.createServer(s => s.on('data', d => got.push(d)));
  await new Promise(r => server.listen(9188, '127.0.0.1', r));
  const { PrinterService } = require('../../lib/printers');
  const store = { defaultPrinter: 'tcp://127.0.0.1:9188', networkPrinters: [{ host: '127.0.0.1', port: 9188, label: 'Fake' }], printerProfiles: {} };
  const prefs = { get: k => store[k], set: u => Object.assign(store, u) };
  const svc = new PrinterService({ prefs, spool: { available: false } });
  const t0 = Date.now();
  const res = await svc.testPrint(null, '3.0.0');
  const ms = Date.now() - t0;
  const t1 = Date.now();
  const res2 = await svc.print({ content: [{ type: 'text', value: 'Second job (warm renderer)', style: { textAlign: 'center' } }] });
  const ms2 = Date.now() - t1;
  const dr = await svc.openDrawer(null);
  await new Promise(r => setTimeout(r, 300));
  server.close();
  const buf = Buffer.concat(got);
  // decode every GS v 0 band into one image
  const bands = []; let w = 0;
  for (let i = 0; i < buf.length - 8; i++) {
    if (buf[i] === 0x1d && buf[i + 1] === 0x76 && buf[i + 2] === 0x30 && buf[i + 3] === 0) {
      const xb = buf[i + 4] | (buf[i + 5] << 8), h = buf[i + 6] | (buf[i + 7] << 8);
      bands.push(buf.subarray(i + 8, i + 8 + xb * h)); w = xb; i += 7 + xb * h;
    }
  }
  const bits = Buffer.concat(bands); const W = w * 8, H = bits.length / w;
  const rgba = Buffer.alloc(W * H * 4, 255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bits[y * w + (x >> 3)] & (0x80 >> (x & 7))) { const k = (y * W + x) * 4; rgba[k] = rgba[k + 1] = rgba[k + 2] = 0; }
  const img = nativeImage.createFromBitmap(rgba, { width: W, height: H });
  fs.writeFileSync('/tmp/raster-out.png', img.toPNG());
  const has = (seq) => buf.includes(Buffer.from(seq));
  console.log(JSON.stringify({ res, ms, res2, ms2, drawer: dr, bytes: buf.length, W, H, cut: has([0x1d, 0x56, 66]), drawerCmd: has([0x1b, 0x70, 0]), barcode: has([0x1d, 0x6b, 73]), qr: has([0x1d, 0x28, 0x6b]) }));
  app.exit(0);
});
