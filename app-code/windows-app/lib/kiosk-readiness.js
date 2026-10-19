'use strict';
const { execFileSync } = require('child_process');

function classifyWindows({ platform, arch, build, edition }) {
    const supported = platform === 'win32' && arch === 'x64' && Number(build) >= 19045;
    const shellLauncher = /^(Enterprise|Education|IoTEnterprise)/i.test(edition || '');
    const assignedAccess = shellLauncher || /^Professional/i.test(edition || '');
    return {
        supported, edition: edition || 'Unknown', build: String(build || ''),
        kioskProvisioned: false,
        method: shellLauncher ? 'shell-launcher' : assignedAccess ? 'assigned-access' : 'unavailable',
        message: !supported ? 'This Station build requires Windows 10 build 19045 or later, or Windows 11, on a 64-bit x64 PC. This does not establish Microsoft lifecycle support.'
            : shellLauncher ? 'This edition supports Shell Launcher. Administrator provisioning and an application allowlist are required before this PC can be treated as a dedicated POS.'
            : assignedAccess ? 'This edition supports Assigned Access. A restricted desktop profile must be provisioned and tested for Station by an administrator.'
            : 'Station app lock is available. This edition does not provide the supported Windows kiosk features required for a fully dedicated POS PC.',
    };
}
function inspectWindows() {
    let edition = '', build = '';
    if (process.platform === 'win32') {
        try {
            const key = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion';
            for (const name of ['EditionID', 'CurrentBuildNumber']) {
                const out = execFileSync('reg.exe', ['query', key, '/v', name], { encoding: 'utf8', windowsHide: true, timeout: 3000 });
                const value = out.match(/REG_SZ\s+([^\r\n]+)/)?.[1]?.trim() || '';
                if (name === 'EditionID') edition = value; else build = value;
            }
        } catch { /* Unknown is not reported as ready. */ }
    }
    return classifyWindows({ platform: process.platform, arch: process.arch, build, edition });
}
module.exports = { classifyWindows, inspectWindows };
