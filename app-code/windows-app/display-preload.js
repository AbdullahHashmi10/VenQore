'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('customerDisplay', Object.freeze({
    onUpdate(cb) { ipcRenderer.on('display:update', (_e, s) => cb(s)); },
}));
