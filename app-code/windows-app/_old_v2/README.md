# VenQore Station - Desktop Hardware Bridge

**VenQore Station** is a lightweight Electron wrapper that gives your VenQore POS web application access to hardware features that browsers cannot access directly:

- ✅ **Silent Printing** - No print dialogs
- ✅ **Auto Paper Cut** - ESC/POS commands
- ✅ **Cash Drawer Control** - Kick drawer on sale
- ✅ **System Tray** - Runs in background

## Quick Start

### 1. Install Dependencies

```bash
cd amd-station
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```

This will open VenQore Station pointing to `http://127.0.0.1:8000` (your local Laravel server).

### 3. Build for Production

```bash
npm run build:win
```

This creates an installer in the `dist/` folder.

## How It Works

### The Bridge Architecture

```
┌─────────────────┐    IPC     ┌─────────────────┐
│   VenQore POS Web   │ ◄──────► │  VenQore Station    │
│   (React App)   │   Bridge   │  (Electron)     │
└─────────────────┘            └────────┬────────┘
         │                              │
         ▼                              ▼
    Browser Print              ESC/POS Commands
     (Fallback)                   USB Printer
```

1. **React (Frontend)** calls `window.amdAPI.print()` or `window.amdAPI.openDrawer()`
2. **Preload Script** (the bridge) forwards the call via IPC
3. **Main Process** sends raw ESC/POS commands to the thermal printer

### Using in Your React Code

```javascript
import { AMDStation, useAMDStation } from '@/Utils/AMDStation';

// Option 1: Direct usage
const handlePayment = async () => {
    await AMDStation.printAndOpenDrawer({
        businessName: 'VenQore Electronics',
        invoiceNumber: 'INV-001',
        items: cart,
        total: grandTotal
    });
};

// Option 2: React Hook
function POSPage() {
    const { isConnected, print, openDrawer, printers } = useAMDStation();
    
    return (
        <div>
            {isConnected && (
                <span className="text-green-500">● VenQore Station Connected</span>
            )}
            <button onClick={() => print(receiptData)}>Print Receipt</button>
        </div>
    );
}
```

## API Reference

### `window.amdAPI`

When running inside VenQore Station, these methods are available:

| Method | Description |
|--------|-------------|
| `check()` | Returns `{isAMDStation: true, version, platform}` |
| `print(data)` | Silent print with auto-cut |
| `openDrawer(printerName?)` | Kick cash drawer |
| `getPrinters()` | List available printers |
| `setDefaultPrinter(name)` | Set session default |

### Print Data Format

```javascript
const receiptData = {
    content: [
        { type: 'text', value: 'VenQore STORE', style: { fontWeight: '700', textAlign: 'center', fontSize: '24px' } },
        { type: 'text', value: '-------------------', style: { textAlign: 'center' } },
        { type: 'text', value: '1x Phone .... Rs.85,000' },
        { type: 'text', value: 'TOTAL: Rs.85,000', style: { fontWeight: '700', fontSize: '18px' } },
    ],
    printerName: 'EPSON TM-T88V',
    copies: 1,
    paperWidth: '80mm'
};
```

## Configuration

Edit `main.js` to change the server URL:

```javascript
const config = {
    serverUrl: process.argv.includes('--dev') 
        ? 'http://127.0.0.1:8000'      // Development
        : 'https://venqore-pos.com',        // Production
};
```

## Troubleshooting

### Printer Not Found
1. Make sure the thermal printer is installed in Windows
2. Print a test page from Windows Settings
3. Check the printer name matches exactly

### Cash Drawer Not Opening
1. The drawer must be connected to the printer's RJ12 port
2. Some printers need specific ESC/POS commands
3. Check your printer manual for drawer kick command

### Code Signing (Windows)
For production distribution without security warnings:
1. Get a code signing certificate
2. Add to `electron-builder` config

## Project Structure

```
amd-station/
├── main.js          # Electron main process (hardware handlers)
├── preload.js       # Bridge script (exposes APIs to web)
├── package.json     # Dependencies and build config
├── assets/
│   └── icon.png     # App icon
└── dist/            # Built installers (after npm run build)
```

## Future Enhancements

- [ ] Offline mode with IndexedDB
- [ ] Barcode scanner integration
- [ ] Weight scale support
- [ ] Multiple cash drawer support
- [ ] Auto-update functionality
