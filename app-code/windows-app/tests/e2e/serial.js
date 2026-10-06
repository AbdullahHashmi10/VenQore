// Serial scanner (keyboard-wedge emulation) + scale against virtual COM ports made with socat.
const { app, webContents } = require('electron');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ud = fs.mkdtempSync('/tmp/vq-serial-'); app.setPath('userData', ud);
fs.writeFileSync(path.join(ud, 'station-prefs.json'), JSON.stringify({ connectedStore: 'demo', deviceSecret: 'x'.repeat(48), scannerPort: '/dev/ttyVQ0', scalePort: '/dev/ttyVQ2', autoStart: false }));
const POS = `<!doctype html><title>POS</title><body><input id="q" autofocus><ul id="log"></ul><script>
let added=[]; document.getElementById('q').addEventListener('keydown', e => { if (e.key==='Enter') { added.push(e.target.value); e.target.value=''; } });
amdAPI.onScaleReading(r => { window.lastWeight = r; });
window.state = () => JSON.stringify({ added, weight: window.lastWeight });
</script>`;
http.createServer((req, res) => { if (req.url === '/api/heartbeat') { res.writeHead(200, {'content-type':'application/json'}); return res.end('{"status":"alive"}'); } res.writeHead(200, {'content-type':'text/html'}); res.end(POS); }).listen(8124, '127.0.0.1');
process.env.VENQORE_DEV_URL = 'http://127.0.0.1:8124'; process.argv.push('--dev');
require('../../main.js');
app.on('web-contents-created', (_e, wc) => wc.on('console-message', (e) => console.log('CON', wc.getType(), e.message || e)));
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(4500);
  fs.appendFileSync('/dev/ttyVQ1', '6291041500213\r\n');
  await wait(300);
  fs.appendFileSync('/dev/ttyVQ1', 'ABC-778\r');
  fs.appendFileSync('/dev/ttyVQ3', 'ST,GS,+  1.234 kg\r\n');
  await wait(1200);
  { const { BrowserWindow } = require('electron'); const w = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().endsWith('shell.html')); fs.writeFileSync('/tmp/serial-shot.png', (await w.webContents.capturePage()).toPNG()); w.webContents.on('console-message', (e) => console.log('SHELLCON', e.message)); }
  const guest = webContents.getAllWebContents().find(w => w.getType() === 'webview');
  console.log('URL', guest.getURL(), await guest.executeJavaScript('typeof amdAPI + " " + typeof window.state + " " + document.title'));
  console.log('SERIAL', await guest.executeJavaScript('window.state()'));
  app.exit(0);
});
