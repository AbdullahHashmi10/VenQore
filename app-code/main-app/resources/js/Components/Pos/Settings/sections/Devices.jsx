/* ==========================================================================
   Devices & keys: hardware, keyboard shortcuts
   ==========================================================================
   Hardware talks to VenQore Station (the Windows app) when it is running,
   and says plainly what a web browser can and cannot do when it is not.
   Every button here performs the real action — a test print really prints —
   so this page doubles as the setup check for a new till.
   ========================================================================== */

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Cable, Keyboard, Printer, Unlock, ScanBarcode, Scale, Tv, CreditCard, CloudUpload, CheckCircle2,
    Loader2, Download, Wifi, WifiOff, ChefHat, FileText, ExternalLink,
} from 'lucide-react';
import { useSettingsCtx } from '../context';
import { Page, Section, Row, Switch, Select, Button, Callout, Tag, Kbd, Field } from '../primitives';
import { AMDStation } from '@/Utils/AMDStation';

const ROLE_NAMES = {
    receipt: 'Receipts', kitchen: 'Kitchen tickets', bar: 'Bar tickets', takeaway: 'Takeaway tickets',
    label: 'Labels', document: 'A4 documents',
};

export function HardwarePage() {
    const { p, flash } = useSettingsCtx();
    const st = p.station || {};
    const connected = !!st.connected;
    const printers = Array.isArray(st.printers) ? st.printers : [];
    const [roles, setRoles] = useState([]);
    const [weight, setWeight] = useState(null);
    const [busy, setBusy] = useState('');
    const [displayOpen, setDisplayOpen] = useState(false);

    useEffect(() => {
        if (!connected) return undefined;
        let live = true;
        AMDStation.getPrintRoles().then(r => { if (live) setRoles(Array.isArray(r) ? r : []); }).catch(() => {});
        return () => { live = false; };
    }, [connected]);

    const run = async (key, fn) => {
        setBusy(key);
        try { await fn(); } finally { setBusy(''); }
    };

    const readScale = () => run('scale', async () => {
        const w = await AMDStation.getWeight();
        setWeight(w && w.weight != null ? w : { error: true });
    });

    const toggleDisplay = () => run('display', async () => {
        const r = displayOpen ? await AMDStation.customerDisplay.close() : await AMDStation.customerDisplay.open();
        if (r?.success === false) { p.addToast?.('The customer screen could not be opened. Is a second screen plugged in?', 'error'); return; }
        setDisplayOpen(!displayOpen);
        p.addToast?.(displayOpen ? 'Customer screen closed' : 'Customer screen opened on the second display', 'success');
    });

    const problem = st.problemFor ? st.problemFor('receipt') : null;
    let printingLink = null;
    try { printingLink = `${route('store.settings', { store_slug: p.storeSlug })}#printer_device`; } catch (_) { /* route not generated */ }

    return (
        <Page icon={Cable} title="Hardware"
              intro="Printers, the cash drawer, scanner, scale and customer screen. Use the test buttons to check each one is working.">
            <Section title="Connection" scope="device">
                <Row sid="hw.status" flash={flash}
                     title={connected ? <>VenQore Station is running <Tag tone="success">Connected</Tag></> : <>Running in a web browser <Tag>No Station</Tag></>}
                     desc={connected
                         ? `Version ${st.version || '—'}. Receipts print silently and the drawer, scale and customer screen can be used.`
                         : 'Receipts print through the browser’s print window. To print silently and use a cash drawer, scale or customer screen, install the free VenQore Station app on this Windows computer.'}>
                    {!connected && p.stationDownloadUrl && (
                        <a className="vqs-btn" data-v="soft" data-size="sm" href={p.stationDownloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download size={15} /> Get VenQore Station
                        </a>
                    )}
                </Row>
                <Row sid="hw.sync" flash={flash}
                     title={<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{p.isOnline ? <Wifi size={17} /> : <WifiOff size={17} />} {p.isOnline ? 'Online' : 'Offline'}</span>}
                     desc={p.pendingCount > 0
                         ? `${p.pendingCount} sale${p.pendingCount === 1 ? ' is' : 's are'} saved on this device and waiting to upload. They upload by themselves when the internet is back.`
                         : 'Every sale is saved straight away. If the internet drops, sales are kept on this device and uploaded later.'}>
                    {p.pendingCount > 0 && <Button v="s" size="sm" icon={CloudUpload} onClick={p.onOpenSyncHub}>View waiting sales</Button>}
                </Row>
            </Section>

            <Section title="Receipt printer" scope="device">
                <Row sid="hw.printer" stacked={connected && printers.length > 0} flash={flash}
                     title={<>Receipt printer {problem ? <Tag tone="warn">{problem}</Tag> : (connected && st.defaultPrinter ? <Tag tone="success">Ready</Tag> : null)}</>}
                     desc={connected
                         ? (printers.length ? 'The printer receipts go to from this till.' : 'Station is running but found no printers. Check the printer is switched on and connected, then reopen settings.')
                         : 'In a browser you pick the printer in the print window each time. Choose your receipt printer there and tick "Remember" if your browser offers it.'}>
                    {connected && printers.length > 0 && (
                        <Select label="Receipt printer" width={360}
                                value={st.defaultPrinter || ''}
                                onChange={async v => {
                                    const r = await st.setDefaultPrinter?.(v);
                                    p.addToast?.(r?.success ? `Receipts will print on ${v}` : 'That printer could not be chosen', r?.success ? 'success' : 'error');
                                }}
                                options={[{ value: '', label: 'Choose a printer…' }, ...printers.map(pr => ({ value: pr.name, label: `${pr.displayName || pr.name}${pr.state === 'offline' ? ' (offline)' : ''}` }))]} />
                    )}
                </Row>
                <Row sid="hw.test-receipt" flash={flash} title="Print a test receipt"
                     desc="Prints a short slip with your business name, so you can check the printer, the paper width and the cutter.">
                    <Button v="s" icon={busy === 'receipt' ? Loader2 : Printer} disabled={busy === 'receipt'}
                            onClick={() => run('receipt', () => p.onTestReceipt?.())}>Print test</Button>
                </Row>
                <Row flash={flash} title="Print after every sale"
                     desc="Prints the receipt automatically when a sale is paid on this till.">
                    <Switch label="Print after every sale" checked={!!p.printOnComplete} onChange={p.setPrintOnComplete} />
                </Row>
                <Row sid="receipt.where" flash={flash} title="Receipt look and paper"
                     desc="Paper type and width, copies, what each line shows, the thank-you message, your logo and the full invoice design are all in Settings → Printing & Sharing, so there is one place to change them.">
                    {printingLink && (
                        <a className="vqs-btn" data-v="s" href={printingLink} target="_blank" rel="noopener noreferrer">
                            <FileText size={16} /> Open printing settings <ExternalLink size={14} />
                        </a>
                    )}
                </Row>
            </Section>

            <Section title="Cash drawer" scope="device">
                <Row sid="hw.drawer" flash={flash} title="Open the drawer for cash sales"
                     desc="The drawer is plugged into the receipt printer and opens when the printer tells it to.">
                    <Switch label="Open drawer for cash sales" checked={!!p.openDrawerOnCash} onChange={p.setOpenDrawerOnCash} />
                </Row>
                <Row flash={flash} title="Test the drawer" disabled={!connected}
                     desc={connected ? 'Sends one open signal. Keyboard: Ctrl + D.' : 'Needs VenQore Station — a web browser cannot open a drawer.'}>
                    <Button v="s" icon={Unlock} disabled={!connected} onClick={p.onOpenCashDrawer}>Open drawer</Button>
                </Row>
            </Section>

            {/* Kitchen and bar tickets are Front of House only; the register's own
                settings never list them. */}
            {p.restaurantRelevant && (
                <Section title="Kitchen and bar printers" scope="device"
                         desc="Which printer each kind of ticket goes to on this computer. Change these in VenQore Station → Printers.">
                    <Row sid="hw.kitchen-printers" stacked flash={flash} title="Where each job prints">
                        {connected ? (
                            roles.length ? (
                                <div className="vqs-list" style={{ width: '100%' }}>
                                    {roles.map(r => (
                                        <div key={r.role} className="vqs-list-row">
                                            <span className="vqs-grow"><b>{ROLE_NAMES[r.role] || r.role}</b></span>
                                            <span className="vqs-muted">{r.printer || 'Same as receipts'}</span>
                                            {r.backup && <Tag>backup: {r.backup}</Tag>}
                                        </div>
                                    ))}
                                </div>
                            ) : <span className="vqs-muted" style={{ fontSize: 14 }}>This version of Station sends every job to the receipt printer.</span>
                        ) : (
                            <span className="vqs-muted" style={{ fontSize: 14 }}>Without Station, kitchen tickets open the browser print window.</span>
                        )}
                    </Row>
                    {p.preparesOrders && (
                        <Row sid="hw.kitchen-printers" flash={flash} title="Test a kitchen ticket"
                             desc="Prints a sample kitchen ticket the same way a real order does.">
                            <Button v="s" icon={ChefHat} onClick={() => p.onTestKitchenTicket?.()}>Print test ticket</Button>
                        </Row>
                    )}
                </Section>
            )}

            <Section title="Scanner, scale and screens" scope="device">
                <ScannerTest p={p} flash={flash} />
                <Row sid="hw.scale" flash={flash}
                     title={<>Weighing scale {st.hardware?.serial?.scale?.connected ? <Tag tone="success">Connected</Tag> : null}</>}
                     desc={connected
                         ? 'Products sold by weight read the scale when you add them. Put something on the scale and press Read to check it.'
                         : 'A scale connects through VenQore Station.'}
                     example={weight && (weight.error ? 'No reading — check the scale is on and connected in Station.' : <>Reading: <b>{weight.weight} {weight.unit || 'kg'}</b>{weight.stable === false ? ' (still settling)' : ''}</>)}>
                    <Button v="s" icon={busy === 'scale' ? Loader2 : Scale} disabled={!connected || busy === 'scale'} onClick={readScale}>Read scale</Button>
                </Row>
                <Row sid="hw.display" flash={flash} title="Customer screen"
                     desc={connected
                         ? 'Shows the customer each item and the total as you ring them up, on a second screen or pole display. It updates by itself during a sale.'
                         : 'A customer-facing screen needs VenQore Station.'}>
                    <Button v={displayOpen ? 'soft' : 's'} icon={busy === 'display' ? Loader2 : Tv} disabled={!connected || busy === 'display'} onClick={toggleDisplay}>
                        {displayOpen ? 'Close customer screen' : 'Open customer screen'}
                    </Button>
                </Row>
                <Row sid="hw.card" flash={flash} title={<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><CreditCard size={17} /> Card machine</span>}
                     desc="Card machines are used on their own: type the amount on the machine, then choose Card when taking payment so the sale is recorded correctly. VenQore does not control the card machine." />
            </Section>
        </Page>
    );
}

function ScannerTest({ p, flash }) {
    const [value, setValue] = useState('');
    const [result, setResult] = useState(null);
    const times = useRef([]);
    const onKeyDown = e => {
        times.current.push(performance.now());
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = value.trim();
            const t = times.current;
            const fast = t.length > 4 && (t[t.length - 1] - t[0]) / (t.length - 1) < 45;
            times.current = [];
            if (!code) return;
            setResult({ code, fast, loading: true });
            setValue('');
            let url = null;
            try { url = route('store.pos.search', { store_slug: p.storeSlug }); } catch (_) {}
            if (!url) { setResult({ code, fast }); return; }
            axios.get(url, { params: { q: code } })
                .then(({ data }) => {
                    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                    setResult({ code, fast, product: list[0]?.name || null });
                })
                .catch(() => setResult({ code, fast }));
        }
    };
    return (
        <Row sid="hw.scanner" stacked flash={flash} title="Barcode scanner"
             desc="USB and Bluetooth scanners work like a keyboard — nothing to set up. Click in the box and scan any product to test it."
             example={result && (
                 result.loading ? 'Looking it up…'
                     : <>Read <b>{result.code}</b>{result.fast ? ' from a scanner' : ' (typed)'} — {result.product ? <>found <b>{result.product}</b>.</> : 'no product has this barcode yet.'}</>
             )}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Field width={320} label="Scan test" placeholder="Click here, then scan a barcode" prefix={<ScanBarcode size={16} />}
                       value={value} onChange={setValue} onKeyDown={onKeyDown} />
                {result && !result.loading && <CheckCircle2 size={20} style={{ color: 'var(--vq-success)' }} />}
            </div>
        </Row>
    );
}

/* ── KEYBOARD ─────────────────────────────────────────────────────────── */

export function KeysPage({ keymap, lastKey }) {
    const { flash } = useSettingsCtx();
    const groups = [...new Set(keymap.map(k => k.group))];
    return (
        <Page icon={Keyboard} title="Keyboard shortcuts"
              intro="Every key the register understands. Shortcuts pause while you are typing in a box, so pressing F4 in a search never removes a line.">
            <Section title="Try a key">
                <Row sid="keys.test" flash={flash} title="Press any key"
                     desc="While this page is open, pressing a key only shows what it does — nothing happens to your sale. The answer appears on the right."
                     example={lastKey ? <>You pressed <b>{lastKey.combo}</b>.</> : null}>
                    {lastKey && <Kbd hit>{lastKey.combo}</Kbd>}
                </Row>
            </Section>
            {groups.map(g => (
                <Section key={g} title={g}>
                    <div className="vqs-list" style={{ margin: '6px 0 4px' }} id={g === groups[0] ? 'vqs-set-keys.map' : undefined}>
                        {keymap.filter(k => k.group === g).map(k => (
                            <div key={k.keys.join()} className="vqs-list-row" data-hit={lastKey && (k.keys.includes(lastKey.combo) || k.match?.test(lastKey.combo)) ? '1' : '0'}>
                                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 170 }}>
                                    {k.keys.map(x => <Kbd key={x} hit={lastKey?.combo === x || (k.match && lastKey && k.match.test(lastKey.combo))}>{x}</Kbd>)}
                                </span>
                                <span className="vqs-grow">{k.does}</span>
                                {k.note && <Tag>{k.note}</Tag>}
                            </div>
                        ))}
                    </div>
                </Section>
            ))}
            <Callout>
                Web browsers keep a few keys for themselves (Ctrl + T, Ctrl + W, Ctrl + N, Ctrl + Tab). They work in the
                VenQore Station app; in a browser, use the <b>Alt</b> versions shown above.
            </Callout>
        </Page>
    );
}

