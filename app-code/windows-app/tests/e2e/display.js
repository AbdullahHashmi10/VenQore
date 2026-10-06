const { app, BrowserWindow } = require('electron'); const path = require('path'); const fs = require('fs');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 1280, height: 720, show: true, webPreferences: { preload: path.join(__dirname, '../../display-preload.js'), contextIsolation: true, sandbox: true } });
  await w.loadFile(path.join(__dirname, '../../customer-display.html'));
  w.webContents.send('display:update', { mode: 'cart', storeName: 'Chai Point Okara', currency: 'Rs', items: [ { name: 'Doodh Patti (large)', qty: '2', price: '180', total: '360' }, { name: 'Chicken Samosa', qty: '4', price: '50', total: '200' }, { name: 'Gulab Jamun', qty: '1', price: '120', total: '120' } ], subtotal: '680', discount: '30', tax: '0', total: '650' });
  await new Promise(r => setTimeout(r, 900)); fs.writeFileSync('/tmp/display-cart.png', (await w.webContents.capturePage()).toPNG());
  w.webContents.send('display:update', { mode: 'paid', currency: 'Rs', paid: '1000', change: '350', items: [] });
  await new Promise(r => setTimeout(r, 900)); fs.writeFileSync('/tmp/display-paid.png', (await w.webContents.capturePage()).toPNG());
  app.exit(0);
});
