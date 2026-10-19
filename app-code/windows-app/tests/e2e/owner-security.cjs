'use strict';
// Exercises real Electron IPC using an isolated profile and local mock server.
const { app, BrowserWindow, webContents } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'vq-owner-test-')));
fs.writeFileSync(path.join(app.getPath('userData'), 'station-prefs.json'), JSON.stringify({ autoStart: false }));
const server = http.createServer((req, res) => {
    if (req.url === '/api/heartbeat') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ terminal_id: 'test-terminal', device_secret: 'x'.repeat(48) }));
    } else res.end('<!doctype html><title>Test POS</title><p>Test POS</p>');
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const deadline = setTimeout(() => { console.error('Owner security test timed out'); app.exit(1); }, 30000);
server.listen(0, '127.0.0.1', async () => {
    process.env.VENQORE_DEV_URL = `http://127.0.0.1:${server.address().port}`;
    process.argv.push('--dev');
    require('../../main.js');
    try {
        await app.whenReady();
        let win;
        for (let i = 0; i < 100; i++) {
            win = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().endsWith('shell.html'));
            if (win && !win.webContents.isLoading()) break;
            await delay(100);
        }
        assert.ok(win);
        const run = code => win.webContents.executeJavaScript(code);
        assert.equal((await run("station.pair({slug:'https://www.venqore.com/s/demo/station-pair#code=ABCD-2345'})")).ok, true);
        assert.equal((await run("station.setPin({next:'784269'})")).success, true);
        await run('station.lockOwner()');
        assert.equal((await run("station.savePrefs({appLock:true})")).success, false);
        assert.equal((await run("station.verifyPin('784269')")).ok, true);
        assert.equal((await run("station.savePrefs({appLock:true})")).success, true);
        assert.equal((await run("station.windowAction('minimize')")).success, false);
        assert.equal((await run("station.openExternal('https://example.com')")).success, false);
        assert.equal((await run('station.openLogs()')).success, false);
        assert.equal((await run("station.setPin({current:'784269',next:null})")).success, false);
        assert.equal((await run("station.quit({pin:'000000'})")).success, false);
        await run("navigate(S.cloud + '/s/demo/pos')");
        let guest;
        for (let i = 0; i < 100; i++) {
            guest = webContents.getAllWebContents().find(w => w.getType() === 'webview');
            if (guest && !guest.isLoading() && guest.getURL().includes('/s/demo/pos')) break;
            await delay(100);
        }
        await guest.executeJavaScript('window.amdAPI.forceClose()');
        await delay(200);
        assert.equal(win.isDestroyed(), false);
        assert.equal((await run("station.installUpdate({confirmed:true,pin:'000000'})")).success, false);
        console.log('PASS: pairing link, owner authorization, app-lock escape checks, page exit and update PIN');
        clearTimeout(deadline); server.close(); app.exit(0);
    } catch (error) { console.error(error); clearTimeout(deadline); server.close(); app.exit(1); }
});
