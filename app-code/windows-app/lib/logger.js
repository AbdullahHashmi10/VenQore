'use strict';
/**
 * Station log — a small rotating file in userData/logs so a support call can
 * end with "send me the diagnostics file" instead of "what did the screen say".
 * console.* keeps working; every line is also appended to station.log.
 */
const fs = require('fs');
const path = require('path');
const util = require('util');

const MAX_BYTES = 2 * 1024 * 1024;
let logFile = null;
let stream = null;
let bytes = 0;
const recent = []; // last 400 lines kept in memory for diagnostics

function open(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        logFile = path.join(dir, 'station.log');
        try { bytes = fs.statSync(logFile).size; } catch { bytes = 0; }
        if (bytes > MAX_BYTES) rotate();
        stream = fs.createWriteStream(logFile, { flags: 'a' });
        stream.on('error', () => { stream = null; });
    } catch { stream = null; }
}

function rotate() {
    try {
        if (stream) { stream.end(); stream = null; }
        const old = logFile + '.1';
        try { fs.unlinkSync(old); } catch {}
        fs.renameSync(logFile, old);
        bytes = 0;
        stream = fs.createWriteStream(logFile, { flags: 'a' });
        stream.on('error', () => { stream = null; });
    } catch {}
}

function write(level, args) {
    const line = `${new Date().toISOString()} [${level}] ${util.format(...args)}`;
    recent.push(line);
    if (recent.length > 400) recent.shift();
    if (!stream) return;
    stream.write(line + '\n');
    bytes += Buffer.byteLength(line) + 1;
    if (bytes > MAX_BYTES) rotate();
}

function install(dir) {
    open(dir);
    for (const level of ['log', 'info', 'warn', 'error']) {
        const orig = console[level].bind(console);
        console[level] = (...args) => {
            try { orig(...args); } catch {}
            write(level.toUpperCase(), args);
        };
    }
}

module.exports = {
    install,
    recent: () => recent.slice(),
    file: () => logFile,
    dir: () => (logFile ? path.dirname(logFile) : null),
};
