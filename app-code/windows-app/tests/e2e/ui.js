// electron tests/e2e/ui.js — boots the real Station against a mock VenQore server and screenshots each screen.
const { app, BrowserWindow, webContents } = require('electron');
const http = require('http'); const net = require('net'); const fs = require('fs'); const path = require('path');
const OUT = '/tmp/vq-shots'; fs.mkdirSync(OUT, { recursive: true });
const ud = fs.mkdtempSync('/tmp/vq-ui-'); app.setPath('userData', ud);
fs.writeFileSync(path.join(ud, 'station-prefs.json'), JSON.stringify({ networkPrinters: [{ id: '1', label: 'Counter', host: '127.0.0.1', port: 9189 }, { id: '2', label: 'Kitchen', host: '127.0.0.1', port: 9190 }], defaultPrinter: 'tcp://127.0.0.1:9189', printerRoles: { kitchen: { printer: 'tcp://127.0.0.1:9190', fallback: null } }, autoStart: false, exitPasscode: '1234' }));
const printed = []; net.createServer(s => s.on('data', d => printed.push(d))).listen(9189, '127.0.0.1');
const kitchen = []; net.createServer(s => s.on('data', d => kitchen.push(d))).listen(9190, '127.0.0.1');
const rogue = []; net.createServer(s => s.on('data', d => rogue.push(d))).listen(9191, '127.0.0.1');
const POS = `<!doctype html><html><head><title>VenQore POS</title><style>body{font-family:sans-serif;background:#F1F5F2;margin:0;padding:24px}input{font-size:18px;padding:8px}</style></head><body>
<h1>Mock POS</h1><input id="q" placeholder="scan"><pre id="out">…</pre><script>
addEventListener('amd-station-ready', async () => {
 const c = await amdAPI.check(); const p = await amdAPI.getPrinters();
 const r = await amdAPI.print({ content:[{type:'text',value:'From the cloud page',style:{textAlign:'center',fontWeight:'700'}},{type:'barCode',value:'INV-77'}], paperWidth:'80mm' });
 const d = await amdAPI.openDrawer(); const hw = await amdAPI.getHardwareStatus();
 let blocked = 'n/a'; try { blocked = typeof require } catch(e) { blocked = 'err' }
 const k = await amdAPI.print({ role:'kitchen', content:[{type:'text',value:'KITCHEN TICKET'}] });
 const bad = await amdAPI.print({ printerName:'tcp://127.0.0.1:9191', content:[{type:'text',value:'rogue'}] });
 document.getElementById('out').textContent = JSON.stringify({ kitchenOk:k.success, kitchenPrinter:k.printer, rogueOk:bad.success, rogueErr:bad.error, check:c.isAMDStation, version:c.version, printers:p.length, print:r.success, mode:r.mode, drawer:d.success, hwPrinters:hw.printers.length, require: blocked, ua: navigator.userAgent.includes('VenQoreStation') }, null, 1);
 window.__done = true;
});</script></body></html>`;
const srv = http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    if (req.url === '/api/heartbeat') {
      const j = JSON.parse(body || '{}');
      if (j.pairing_token === 'ABCD-2345' || req.headers['x-device-secret']) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ status: 'alive', terminal_id: '7f0c3a52-1b1e-4c5e-9a55-0d5d2f1e7a10', device_secret: req.headers['x-device-secret'] ? undefined : 'x'.repeat(48) })); }
      res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ code: 'PAIRING_REQUIRED', error: 'Pairing required' }));
    }
    if (req.url.startsWith('/s/demo/pos')) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(POS); }
    res.writeHead(404, { 'content-type': 'text/html' }); res.end('<title>404</title>Not found');
  });
}).listen(8123, '127.0.0.1');
process.env.VENQORE_DEV_URL = 'http://127.0.0.1:8123';
process.argv.push('--dev');
require('../../main.js');
const wait = ms => new Promise(r => setTimeout(r, ms));
const shot = async (name) => { const w = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().endsWith('shell.html')); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(OUT, name + '.png'), img.toPNG()); };
const js = (code) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().endsWith('shell.html')).webContents.executeJavaScript(code);
app.whenReady().then(async () => {
  await wait(3500); await shot('01-pair');
  await js(`document.querySelector('#pair-slug').value='demo'; document.querySelector('#pair-code').value='ABCD-2345'; document.querySelector('#pair-form').requestSubmit(); true`);
  await wait(4000); await shot('02-pos');
  const guest = webContents.getAllWebContents().find(w => w.getType() === 'webview');
  const out = guest ? await guest.executeJavaScript('document.getElementById("out").textContent') : 'no guest';
  console.log('GUEST', out.replace(/\s+/g, ' '));
  console.log('ROLES rogueOkWas', 'see GUEST'); console.log('ROLES kitchenBytes', Buffer.concat(kitchen).length, 'rogueBytes', Buffer.concat(rogue).length);
  guest.executeJavaScript("location.href = '/pricing'").catch(() => {}); await wait(1500);
  console.log('MARKETING_NAV_ENDS_AT', guest.getURL());
  await guest.loadURL('http://127.0.0.1:8123/s/demo/pos'); await wait(1500);
  await guest.executeJavaScript("window.open('/s/demo/pos?doc=1', '_blank'); true", true);
  await wait(2500);
  const doc = webContents.getAllWebContents().find(w => w.getURL().includes('doc=1'));
  console.log('DOCWIN', doc ? doc.getType() : 'none', doc ? (await doc.executeJavaScript('typeof window.amdAPI + " " + (document.getElementById("out")||{}).textContent')).replace(/\s+/g,' ') : '');
  if (doc) BrowserWindow.fromWebContents(doc).close();
  guest.executeJavaScript("location.href = 'https://example.com/'").catch(() => {});
  await wait(1200);
  console.log('AFTER_EXTERNAL_NAV', guest.getURL());
  await js(`openSettings('printers'); true`); await wait(1500); await shot('03-settings-printers');
  await js(`document.querySelector('.pr .pr-row').click(); true`); await wait(400); await shot('04-printer-profile');
  await js(`selectTab('devices'); true`); await wait(800); await shot('05-devices');
  await js(`selectTab('display'); true`); await wait(400); await shot('06-display');
  await js(`selectTab('station'); true`); await wait(400); await shot('07-station');
  await js(`selectTab('security'); true`); await wait(400); await shot('08-security');
  await js(`closeSettings(); onCloseRequest({needPin:true}); true`); await wait(600); await shot('09-pin');
  await js(`document.querySelector('[data-k=cancel]').click(); showOffline(); true`); await wait(500); await shot('10-offline');
  await js(`show('#ov-offline', false); toast('Receipt printed · escpos','success'); banner('This till is not paired with the store yet. Printing works; pair it so the store can manage this terminal.','Pair now',()=>{}); true`); await wait(500); await shot('11-toast-banner');
  console.log('PRINTED_BYTES', Buffer.concat(printed).length, 'drawer', Buffer.concat(printed).includes(Buffer.from([0x1b,0x70,0])));
  const prefs = JSON.parse(fs.readFileSync(path.join(ud, 'station-prefs.json'), 'utf8'));
  console.log('PREFS', JSON.stringify({ store: prefs.connectedStore, secret: !!prefs.deviceSecret, terminal: prefs.terminalId, pin: !!prefs.managerPinHash, plain: prefs.exitPasscode }));
  app.exit(0);
});
