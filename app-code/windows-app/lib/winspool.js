'use strict';
/**
 * Windows print spooler bridge — RAW jobs, printer status, default printer.
 *
 * Electron's printer list lost `isDefault` and `status` (Electron 44 only
 * returns name/displayName/description/options), so v2's "default printer"
 * detection and status chip silently never worked. And a cash-drawer pulse or
 * paper cut needs RAW bytes to reach the printer, which Chromium cannot send.
 *
 * This runs ONE long-lived, hidden PowerShell process that compiles a tiny
 * winspool.drv P/Invoke class once and then answers JSON requests on stdin.
 * No native Node module, no rebuild per Electron version, works on every
 * Windows 10/11 machine (PowerShell 5.1 is part of the OS).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSHARP = String.raw`
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class VqSpool {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOCINFOW {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct PRINTER_INFO_2 {
    public string pServerName; public string pPrinterName; public string pShareName; public string pPortName;
    public string pDriverName; public string pComment; public string pLocation; public IntPtr pDevMode;
    public string pSepFile; public string pPrintProcessor; public string pDatatype; public string pParameters;
    public IntPtr pSecurityDescriptor; public uint Attributes; public uint Priority; public uint DefaultPriority;
    public uint StartTime; public uint UntilTime; public uint Status; public uint cJobs; public uint AveragePPM;
  }
  [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern bool OpenPrinter(string name, out IntPtr h, IntPtr pd);
  [DllImport("winspool.drv", SetLastError = true)] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern int StartDocPrinter(IntPtr h, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOW di);
  [DllImport("winspool.drv", SetLastError = true)] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError = true)] static extern bool StartPagePrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError = true)] static extern bool EndPagePrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError = true)] static extern bool WritePrinter(IntPtr h, byte[] buf, int count, out int written);
  [DllImport("winspool.drv", EntryPoint = "EnumPrintersW", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern bool EnumPrinters(int flags, string name, int level, IntPtr buf, int cb, out int needed, out int returned);
  [DllImport("winspool.drv", EntryPoint = "GetDefaultPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern bool GetDefaultPrinter(StringBuilder buf, ref int size);

  public static string Send(string printer, byte[] data, string doc) {
    IntPtr h;
    if (!OpenPrinter(printer, out h, IntPtr.Zero)) return "Printer not found (" + Marshal.GetLastWin32Error() + ")";
    try {
      DOCINFOW di = new DOCINFOW(); di.pDocName = doc; di.pDataType = "RAW";
      if (StartDocPrinter(h, 1, di) == 0) return "Spooler refused the job (" + Marshal.GetLastWin32Error() + ")";
      try {
        if (!StartPagePrinter(h)) return "Spooler page failed (" + Marshal.GetLastWin32Error() + ")";
        int written; bool ok = WritePrinter(h, data, data.Length, out written);
        EndPagePrinter(h);
        if (!ok || written != data.Length) return "Write to printer failed (" + Marshal.GetLastWin32Error() + ")";
      } finally { EndDocPrinter(h); }
      return "";
    } finally { ClosePrinter(h); }
  }
  public static string Default() {
    int size = 0; GetDefaultPrinter(null, ref size);
    if (size <= 0) return "";
    StringBuilder sb = new StringBuilder(size);
    return GetDefaultPrinter(sb, ref size) ? sb.ToString() : "";
  }
  public static PRINTER_INFO_2[] List() {
    int needed, returned; int flags = 2 | 4;
    EnumPrinters(flags, null, 2, IntPtr.Zero, 0, out needed, out returned);
    if (needed <= 0) return new PRINTER_INFO_2[0];
    IntPtr buf = Marshal.AllocHGlobal(needed);
    try {
      if (!EnumPrinters(flags, null, 2, buf, needed, out needed, out returned)) return new PRINTER_INFO_2[0];
      PRINTER_INFO_2[] list = new PRINTER_INFO_2[returned];
      int sz = Marshal.SizeOf(typeof(PRINTER_INFO_2));
      for (int i = 0; i < returned; i++) list[i] = (PRINTER_INFO_2)Marshal.PtrToStructure(new IntPtr(buf.ToInt64() + i * sz), typeof(PRINTER_INFO_2));
      return list;
    } finally { Marshal.FreeHGlobal(buf); }
  }
}`;

const PS = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
Add-Type -TypeDefinition @'
${CSHARP}
'@
function Reply($o) { [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress -Depth 4)); [Console]::Out.Flush() }
Reply @{ ready = $true }
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($line -eq $null) { break }
  if ($line.Trim() -eq '') { continue }
  $id = 0
  try {
    $j = $line | ConvertFrom-Json
    $id = $j.id
    if ($j.op -eq 'raw') {
      $bytes = [Convert]::FromBase64String($j.data)
      $err = [VqSpool]::Send($j.printer, $bytes, $j.doc)
      Reply @{ id = $id; ok = ($err -eq ''); error = $err }
    } elseif ($j.op -eq 'list') {
      $def = [VqSpool]::Default()
      $arr = @()
      foreach ($p in [VqSpool]::List()) {
        $arr += @{ name = $p.pPrinterName; port = $p.pPortName; driver = $p.pDriverName; status = [int64]$p.Status; attributes = [int64]$p.Attributes; jobs = [int64]$p.cJobs; isDefault = ($p.pPrinterName -eq $def) }
      }
      Reply @{ id = $id; ok = $true; printers = $arr; default = $def }
    } elseif ($j.op -eq 'ping') {
      Reply @{ id = $id; ok = $true }
    } else {
      Reply @{ id = $id; ok = $false; error = 'unknown op' }
    }
  } catch {
    Reply @{ id = $id; ok = $false; error = $_.Exception.Message }
  }
}
`;

// Win32 PRINTER_STATUS_* / PRINTER_ATTRIBUTE_* bits we surface.
const STATUS = {
    PAUSED: 0x1, ERROR: 0x2, PAPER_JAM: 0x8, PAPER_OUT: 0x10, PAPER_PROBLEM: 0x40, OFFLINE: 0x80,
    NOT_AVAILABLE: 0x1000, USER_INTERVENTION: 0x100000, DOOR_OPEN: 0x400000,
};
const ATTR_WORK_OFFLINE = 0x400;

function describeStatus(status = 0, attributes = 0) {
    if (attributes & ATTR_WORK_OFFLINE || status & STATUS.OFFLINE || status & STATUS.NOT_AVAILABLE) return { state: 'offline', label: 'Offline' };
    if (status & STATUS.PAPER_OUT) return { state: 'error', label: 'Out of paper' };
    if (status & STATUS.PAPER_JAM) return { state: 'error', label: 'Paper jam' };
    if (status & STATUS.DOOR_OPEN) return { state: 'error', label: 'Cover open' };
    if (status & STATUS.PAUSED) return { state: 'warning', label: 'Paused' };
    if (status & (STATUS.ERROR | STATUS.PAPER_PROBLEM | STATUS.USER_INTERVENTION)) return { state: 'error', label: 'Needs attention' };
    return { state: 'ready', label: 'Ready' };
}

/** JSON with every non-ASCII char escaped so the console code page can't mangle printer names. */
const asciiJson = (o) => JSON.stringify(o).replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

class WinSpool {
    constructor(scriptDir) {
        this.scriptDir = scriptDir;
        this.proc = null;
        this.ready = null;
        this.pending = new Map();
        this.seq = 0;
        this.available = process.platform === 'win32';
        this.failures = 0;
    }

    start() {
        if (!this.available) return Promise.reject(new Error('Spooler bridge is Windows-only'));
        if (this.ready) return this.ready;
        this.ready = new Promise((resolve, reject) => {
            let settled = false;
            const fail = (err) => { if (!settled) { settled = true; this.ready = null; reject(err); } };
            try {
                fs.mkdirSync(this.scriptDir, { recursive: true });
                const script = path.join(this.scriptDir, 'vq-spool.ps1');
                fs.writeFileSync(script, '\ufeff' + PS, 'utf8');
                const exe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
                const proc = spawn(fs.existsSync(exe) ? exe : 'powershell.exe',
                    ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
                    { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
                this.proc = proc;
                const rl = readline.createInterface({ input: proc.stdout });
                rl.on('line', (line) => {
                    let msg; try { msg = JSON.parse(line.replace(/^\ufeff/, '')); } catch { return; }
                    if (msg.ready) { settled = true; this.failures = 0; resolve(); return; }
                    const p = this.pending.get(msg.id);
                    if (p) { clearTimeout(p.timer); this.pending.delete(msg.id); p.resolve(msg); }
                });
                proc.stderr.on('data', d => console.warn('[Spool]', String(d).trim().slice(0, 400)));
                proc.on('error', fail);
                proc.on('exit', (code) => {
                    this.proc = null; this.ready = null;
                    for (const [, p] of this.pending) { clearTimeout(p.timer); p.resolve({ ok: false, error: 'Print helper stopped' }); }
                    this.pending.clear();
                    fail(new Error('Print helper exited (' + code + ')'));
                });
                setTimeout(() => fail(new Error('Print helper did not start')), 30000);
            } catch (e) { fail(e); }
        });
        this.ready.catch(() => { this.failures++; });
        return this.ready;
    }

    async request(op, payload = {}, timeoutMs = 25000) {
        await this.start();
        const id = ++this.seq;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                resolve({ ok: false, error: 'Printer did not respond in time' });
                this.restart(); // a hung spooler call poisons the helper; start fresh
            }, timeoutMs);
            this.pending.set(id, { resolve, timer });
            try { this.proc.stdin.write(asciiJson({ id, op, ...payload }) + '\n'); }
            catch (e) { clearTimeout(timer); this.pending.delete(id); resolve({ ok: false, error: e.message }); }
        });
    }

    restart() {
        try { this.proc && this.proc.kill(); } catch {}
        this.proc = null; this.ready = null;
    }

    async sendRaw(printer, buffer, doc = 'VenQore Station') {
        const res = await this.request('raw', { printer, doc, data: Buffer.from(buffer).toString('base64') });
        return res.ok ? { success: true } : { success: false, error: res.error || 'Spooler error' };
    }

    async list() {
        const res = await this.request('list', {}, 15000);
        if (!res.ok) throw new Error(res.error || 'Could not list printers');
        const printers = Array.isArray(res.printers) ? res.printers : (res.printers ? [res.printers] : []);
        return printers.map(p => ({ ...p, ...describeStatus(p.status, p.attributes) }));
    }

    stop() {
        try { this.proc && this.proc.stdin.end(); } catch {}
        setTimeout(() => { try { this.proc && this.proc.kill(); } catch {} }, 500);
    }
}

module.exports = { WinSpool, describeStatus, asciiJson, PS };
