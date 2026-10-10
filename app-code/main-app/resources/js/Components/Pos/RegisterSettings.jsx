/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  RegisterSettings — the register's settings workspace                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * WHAT CHANGED (Oct 2026)
 * -----------------------
 * The 1240px modal with seven tabs became a full-screen workspace:
 *
 *   header   title · search every setting · "Saved" status · Done
 *   left     categories, grouped by WHO the change affects: this register,
 *            the restaurant (only for businesses that prepare orders or run
 *            tables), the whole business, and devices & keys
 *   middle   the settings, one plain sentence of explanation under each
 *   right    a live preview that changes with the category: the register
 *            itself, the floor, the kitchen tickets, the printed receipt, the
 *            payment panel, the hardware or the keyboard
 *
 * Restaurant settings moved out of Layout into their own pages. The floor got
 * four views (smart cards, by area, seating chart, list), and kitchen tickets
 * got real routing: one ticket for everything, or one per station — with
 * everything unassigned falling back to the main kitchen.
 *
 * THE RULES THIS FILE KEEPS
 * -------------------------
 *  · It owns no register state. Values and setters come down from the
 *    register (`Pages/Pos.jsx`), so there is still one source of truth.
 *  · Whole-business settings are written through the same endpoint as
 *    Settings in the main menu, one section at a time, and the register's
 *    `settings` prop is reloaded after each save.
 *  · Every change applies immediately. "Done" closes; it does not save,
 *    because there is nothing left waiting to be saved.
 *  · The Ask Vena island is hidden while this is open, and the register's
 *    own shortcuts are paused, so F4 in here can never remove a cart line.
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    X, Search, Settings2, Check, Loader2, AlertTriangle, Unlock, Pause, History, Undo2, Wifi, Printer,
    Keyboard, Maximize2, ChefHat, Tv, RotateCcw, Wand2, Eye, EyeOff, Lock,
} from 'lucide-react';
import '@/Components/Pos/Settings/pos-settings.css';
import { SettingsCtx } from '@/Components/Pos/Settings/context';
import { CATEGORIES, GROUPS, TAB_ALIASES, searchSettings, SEARCH_INDEX } from '@/Components/Pos/Settings/catalog';
import { Button } from '@/Components/Pos/Settings/primitives';
import { LayoutPage, CatalogPage, ScreenPage, ButtonsPage } from '@/Components/Pos/Settings/sections/Register';
import { CheckoutPage } from '@/Components/Pos/Settings/sections/Checkout';
import { RestaurantPage, KitchenPage, useKitchenRouting } from '@/Components/Pos/Settings/sections/Restaurant';
import { StockPage, MoneyPage, CashPage } from '@/Components/Pos/Settings/sections/Business';
import { HardwarePage, KeysPage } from '@/Components/Pos/Settings/sections/Devices';
import RegisterLivePreview, { PREVIEW_DEVICES, plainNotes } from '@/Components/Pos/Settings/previews/RegisterLivePreview';
import { FloorPreview, TicketsPreview, PaymentPreview, HardwarePreview, KeysPreview } from '@/Components/Pos/Settings/previews/Previews';
import { composeFor } from '@/Layout/usePosLayout';

/* ══════════════════════════════════════════════════════════════════════════
   THE KEYMAP — one map for the whole product, checked against the handler in
   Pages/Pos.jsx key by key. If you add a shortcut there, add it here.
   ══════════════════════════════════════════════════════════════════════════ */
export const POS_KEYMAP = [
    { group: 'Items on the sale', keys: ['F1'], does: 'Jump to the scan / search box' },
    { group: 'Items on the sale', keys: ['F2'], does: 'Change the quantity of the selected line' },
    { group: 'Items on the sale', keys: ['F3'], does: 'Give a discount on the selected line' },
    { group: 'Items on the sale', keys: ['F4'], does: 'Remove the selected line' },
    { group: 'Items on the sale', keys: ['F5'], does: 'Change the price of the selected line' },
    { group: 'Items on the sale', keys: ['F6'], does: 'Quick price calculator for the selected line' },
    { group: 'Items on the sale', keys: ['Ctrl + 1…8'], match: /^Ctrl \+ [1-8]$/, does: 'Select line 1 to 8' },
    { group: 'Items on the sale', keys: ['Ctrl + 9'], does: 'Select the last line' },
    { group: 'The bill', keys: ['F7'], does: 'Set the tax rate for this sale' },
    { group: 'The bill', keys: ['F8'], does: 'Add an extra charge (delivery, packing…)' },
    { group: 'The bill', keys: ['F9'], does: 'Discount on the whole bill' },
    { group: 'The bill', keys: ['F10'], does: 'Take payment' },
    { group: 'The bill', keys: ['F11'], does: 'Choose the customer' },
    { group: 'The bill', keys: ['F12'], does: 'Add a note to the sale' },
    { group: 'The bill', keys: ['Ctrl + F'], does: 'Show the bill breakdown' },
    { group: 'The bill', keys: ['Ctrl + P'], does: 'Finish the sale as fully paid, and print' },
    { group: 'The bill', keys: ['Ctrl + N', 'Alt + N'], does: 'Finish the sale as fully paid, and start a new one', note: 'Browser: Alt + N' },
    { group: 'Sales tabs', keys: ['Ctrl + S'], does: 'Hold (park) this sale for later' },
    { group: 'Sales tabs', keys: ['Ctrl + T', 'Alt + T'], does: 'Start a new sale in a new tab', note: 'Browser: Alt + T' },
    { group: 'Sales tabs', keys: ['Ctrl + W', 'Alt + W'], does: 'Close this sale tab', note: 'Browser: Alt + W' },
    { group: 'Sales tabs', keys: ['Ctrl + Tab'], does: 'Go to the next sale tab', note: 'Station app' },
    { group: 'Sales tabs', keys: ['Ctrl + R'], does: 'Clear this sale (asks first)' },
    { group: 'The register', keys: ['Ctrl + D'], does: 'Open the cash drawer' },
    { group: 'The register', keys: ['Alt + L'], does: 'Open these settings' },
    { group: 'The register', keys: ['Alt + Z'], does: 'Full screen on / off' },
    { group: 'The register', keys: ['?'], does: 'Show this list of shortcuts' },
    { group: 'The register', keys: ['Esc'], does: 'Close whatever is open on top' },
];

/* ══════════════════════════════════════════════════════════════════════════
   TOP BAR BUTTONS — which controls appear on the register's own bar.
   ══════════════════════════════════════════════════════════════════════════ */
export const SURFACE_BUTTONS = [
    { id: 'drawer', label: 'Open cash drawer', icon: Unlock, dflt: true,
      hint: 'Opens the drawer without a sale — for change or a float check. Ctrl + D does the same.' },
    { id: 'parked', label: 'Held sales', icon: Pause, dflt: true,
      hint: 'Sales you put on hold, ready to bring back. Shows a number when some are waiting.' },
    { id: 'recent', label: 'Recent sales', icon: History, dflt: false,
      hint: 'The last sales from this till, with reprint.' },
    { id: 'returns', label: 'Return mode', icon: Undo2, dflt: false,
      hint: 'One tap to switch the till to refunds. Leave off on a till that never gives refunds.' },
    { id: 'online', label: 'Online light', icon: Wifi, dflt: true,
      hint: 'A small dot: green when sales save straight away, red when they are waiting on this device.' },
    { id: 'printer', label: 'Printer light', icon: Printer, dflt: true,
      hint: 'Shows whether the printer is ready, out of paper or missing. Tap it to open Hardware.' },
    { id: 'keys', label: 'Shortcuts button', icon: Keyboard, dflt: false,
      hint: 'Opens the list of keyboard shortcuts. The ? key opens it too.' },
    { id: 'fullscreen', label: 'Full screen button', icon: Maximize2, dflt: false,
      hint: 'Hides the browser bars so the till fills the screen. Alt + Z does the same.' },
    { id: 'kitchen', label: 'Kitchen screen button', icon: ChefHat, dflt: true, restaurant: true,
      hint: 'Opens the kitchen display in a new tab.' },
    { id: 'queue', label: 'Customer TV screen button', icon: Tv, dflt: true, restaurant: true,
      hint: 'Opens the "order ready" screen for customers in a new tab.' },
];

export const DEFAULT_SURFACE = SURFACE_BUTTONS.reduce((a, b) => { a[b.id] = b.dflt; return a; }, {});

const toWire = v => (v === true ? '1' : v === false ? '0' : v);

/** "Ctrl + S" from a keydown, in the same spelling as POS_KEYMAP. */
function comboOf(e) {
    const k = e.key;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(k)) return null;
    let key = k === 'Escape' ? 'Esc' : k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k;
    if (k === '?') return '?';
    if (e.ctrlKey && /^[1-8]$/.test(k)) key = k;
    const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && k.length > 1 && 'Shift'].filter(Boolean);
    return [...mods, key].join(' + ');
}

function pickDevice() {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    return w < 700 ? 'phone' : w < 1150 ? 'tablet' : w < 1600 ? 'laptop' : 'desktop';
}

export default function RegisterSettings(props) {
    const p = props;
    const { open, onClose, initialTab = 'layout' } = p;
    const titleId = useId();
    const shellRef = useRef(null);
    const mainRef = useRef(null);

    const restaurantRelevant = !!p.restaurantRelevant;
    /* Tables, floor and lanes live in Front of House now, so the till never
       shows the "Tables & floor" page. Kitchen tickets stay, for a counter that
       prepares what it sells (a bakery, a juice bar). */
    const visible = useMemo(() => CATEGORIES.filter(c => c.id !== 'restaurant' && (!c.restaurant || restaurantRelevant)), [restaurantRelevant]);
    const visibleIds = useMemo(() => new Set(visible.map(c => c.id)), [visible]);
    const resolveTab = useCallback(t => {
        const id = TAB_ALIASES[t] || t;
        return visibleIds.has(id) ? id : (id === 'restaurant' || id === 'kitchen') ? 'checkout' : 'layout';
    }, [visibleIds]);

    const [tab, setTab] = useState(() => resolveTab(initialTab));
    const [query, setQuery] = useState('');
    const [flash, setFlash] = useState(null);
    const [deviceId, setDeviceId] = useState(pickDevice);
    const [showPreview, setShowPreview] = useState(false);
    const [status, setStatus] = useState({ state: 'saved', at: null, msg: '' });
    const [overrides, setOverrides] = useState({});
    const [passcode, setPasscode] = useState(null);       // remembered for this session once accepted
    const [askPasscode, setAskPasscode] = useState(null); // { retry }
    const [lastKey, setLastKey] = useState(null);
    const inflight = useRef(0);

    useEffect(() => { if (open) { setTab(resolveTab(initialTab)); setQuery(''); } }, [open, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (!visibleIds.has(tab)) setTab(resolveTab(tab)); }, [visibleIds]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { setOverrides({}); }, [p.storeSettings]);

    /* Body flags: hide the Ask Vena island, stop the page behind from scrolling. */
    useEffect(() => {
        if (!open || typeof document === 'undefined') return undefined;
        const b = document.body;
        const prevOverflow = b.style.overflow;
        b.setAttribute('data-vq-settings-open', '1');
        b.style.overflow = 'hidden';
        return () => { b.removeAttribute('data-vq-settings-open'); b.style.overflow = prevOverflow; };
    }, [open]);

    /* Esc closes; Ctrl+K / '/' focuses search; on the Keys page every key is
       only TESTED. Registered in the capture phase so the register never sees
       a key while this is open. */
    useEffect(() => {
        if (!open) return undefined;
        const onKey = e => {
            const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT');
            if (e.key === 'Escape') {
                e.stopPropagation(); e.preventDefault();
                if (askPasscode) { setAskPasscode(null); return; }
                if (query) { setQuery(''); return; }
                onClose?.();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault(); e.stopPropagation();
                shellRef.current?.querySelector('.vqs-search input')?.focus();
                return;
            }
            if (tab === 'keys' && !typing) {
                const c = comboOf(e);
                if (c) {
                    e.preventDefault(); e.stopPropagation();
                    setLastKey({ combo: c, at: Date.now() });
                }
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [open, onClose, tab, query, askPasscode]);

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => shellRef.current?.focus?.(), 40);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [open]);

    /* ── saving ───────────────────────────────────────────────────────── */
    const track = useCallback(promise => {
        inflight.current += 1;
        setStatus({ state: 'saving', at: null, msg: '' });
        return Promise.resolve(promise).then(res => {
            inflight.current -= 1;
            if (inflight.current <= 0) setStatus({ state: 'saved', at: Date.now(), msg: '' });
            return res;
        }, err => {
            inflight.current -= 1;
            const msg = err?.response?.data?.message || 'That change could not be saved.';
            setStatus({ state: 'error', at: Date.now(), msg });
            p.addToast?.(err?.response?.status === 403 && !/passcode/i.test(msg) ? 'You do not have permission to change that.' : msg, 'error');
            throw err;
        });
    }, [p.addToast]);

    const storeVal = useCallback((k, d) => {
        if (Object.prototype.hasOwnProperty.call(overrides, k)) return overrides[k];
        const v = p.storeSettings?.[k];
        return v === undefined || v === null ? d : v;
    }, [overrides, p.storeSettings]);

    const saveStore = useCallback((section, patch, challenge = passcode) => {
        if (!p.canManageStore) {
            p.addToast?.('Only an owner or manager can change business-wide settings.', 'error');
            return Promise.resolve(false);
        }
        const wire = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, toWire(v)]));
        const before = Object.fromEntries(Object.keys(patch).map(k => [k, storeVal(k, undefined)]));
        setOverrides(o => ({ ...o, ...wire }));
        let url;
        try { url = route('store.settings.update', { store_slug: p.storeSlug }); } catch (_) { url = null; }
        if (!url) return Promise.resolve(false);
        const body = { _save_section: section, ...wire, ...(challenge ? { passcode_challenge: challenge } : {}) };
        inflight.current += 1;
        setStatus({ state: 'saving', at: null, msg: '' });
        return axios.post(url, body, { headers: { Accept: 'application/json' } })
            .then(() => {
                inflight.current -= 1;
                if (inflight.current <= 0) setStatus({ state: 'saved', at: Date.now(), msg: '' });
                if (challenge) setPasscode(challenge);
                p.reloadSettings?.();
                return true;
            })
            .catch(err => {
                inflight.current -= 1;
                const msg = err?.response?.data?.message || 'That change could not be saved.';
                if (err?.response?.status === 403 && /passcode/i.test(msg)) {
                    setAskPasscode({ section, patch, wrong: !!challenge });
                    setStatus({ state: 'error', at: Date.now(), msg: 'Passcode needed' });
                } else {
                    setOverrides(o => ({ ...o, ...before }));
                    setStatus({ state: 'error', at: Date.now(), msg });
                    p.addToast?.(msg, 'error');
                }
                return false;
            });
    }, [p.canManageStore, p.storeSlug, p.addToast, p.reloadSettings, passcode, storeVal]);

    /* ── kitchen routing (shared by the Kitchen page and its preview) ── */
    const [kitchen, setKitchen] = useKitchenRouting(p, open && restaurantRelevant && !!p.preparesOrders);

    /* ── search ───────────────────────────────────────────────────────── */
    const results = useMemo(() => searchSettings(query, visibleIds), [query, visibleIds]);
    const goTo = (cat, sid) => {
        setQuery('');
        setTab(cat);
        if (!sid) { mainRef.current?.scrollTo?.({ top: 0 }); return; }
        setFlash(sid);
        setTimeout(() => {
            const el = document.getElementById(`vqs-set-${sid}`);
            el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        }, 60);
        setTimeout(() => setFlash(f => (f === sid ? null : f)), 2200);
    };
    useEffect(() => { mainRef.current?.scrollTo?.({ top: 0 }); }, [tab]);

    const ctx = useMemo(() => ({ p: { ...p, restaurantRelevant }, flash, storeVal, saveStore, track }), [p, restaurantRelevant, flash, storeVal, saveStore, track]);

    if (!open || typeof document === 'undefined') return null;

    const device = PREVIEW_DEVICES.find(d => d.id === deviceId) || PREVIEW_DEVICES[3];
    const money = p.money || (v => (Number(v) || 0).toFixed(2));

    /* ── pages ────────────────────────────────────────────────────────── */
    const page = (() => {
        switch (tab) {
            case 'layout': return <LayoutPage />;
            case 'catalog': return <CatalogPage />;
            case 'screen': return <ScreenPage />;
            case 'buttons': return <ButtonsPage SURFACE_BUTTONS={SURFACE_BUTTONS} />;
            case 'checkout': return <CheckoutPage />;
            case 'restaurant': return <RestaurantPage />;
            case 'kitchen': return <KitchenPage kitchen={kitchen} setKitchen={setKitchen} />;
            case 'stock': return <StockPage />;
            case 'money': return <MoneyPage />;
            case 'cash': return <CashPage />;
            case 'hardware': return <HardwarePage />;
            case 'keys': return <KeysPage keymap={POS_KEYMAP} lastKey={lastKey} />;
            default: return <LayoutPage />;
        }
    })();

    /* ── preview ──────────────────────────────────────────────────────── */
    const registerPreview = (focus, opts = {}) => {
        const layout = composeFor(p.composition, device.vw, device.vh, { senior: p.seniorMode, scale: p.uiScale, terminal: p.terminal, rail: p.showRail });
        const notes = opts.sheet ? [] : plainNotes(p.composition, layout, device, p.terminal);
        return (
            <>
                <div className="vqs-seg" role="radiogroup" aria-label="Preview screen" style={{ alignSelf: 'flex-start' }}>
                    {PREVIEW_DEVICES.map(d => (
                        <button key={d.id} type="button" role="radio" aria-checked={deviceId === d.id} onClick={() => setDeviceId(d.id)}>{d.label}</button>
                    ))}
                </div>
                <RegisterLivePreview
                    comp={p.composition} device={device} senior={p.seniorMode} scale={p.uiScale} rail={p.showRail}
                    terminal={p.terminal} surface={p.surface} preparesOrders={p.preparesOrders} isOnline={p.isOnline}
                    catalogShape={p.composition?.catalogShape || 'auto'} categoryOrientation={p.categoryOrientation}
                    showImages={p.showCatalogImages !== false} showStock={p.showCatalogStock !== false}
                    hideOutOfStock={!!p.hideOutOfStock} isStockTracking={p.isStockTracking}
                    products={p.sampleProducts} categories={p.categories} money={money}
                    enableTax={p.enableTax} taxRate={Number(storeVal('default_tax_rate', 0)) || 0}
                    roundOff={p.roundOff && String(storeVal('round_off_total', 'none')) !== 'none'}
                    serviceChargePct={p.serviceCharge} focus={focus} floorView={p.floorView}
                    showCatalogSheet={!!opts.sheet}
                />
                {notes.map((n, i) => (
                    <div key={i} className="vqs-preview-note"><AlertTriangle size={15} />{n}</div>
                ))}
            </>
        );
    };

    const paymentPreview = (
        <PaymentPreview
            money={money} enableTax={p.enableTax} taxRate={Number(storeVal('default_tax_rate', 0)) || 0}
            roundMode={String(storeVal('round_off_total', 'none'))} roundOffOnTill={!!p.roundOff}
            autoFillCash={!!p.autoFillCash} cashDefault discountPresets={p.discountPresets || []}
            serviceChargePct={p.serviceCharge} tip={p.terminal === 'table' && p.tipEnabled !== false}
            restaurant={p.terminal === 'table'} freeQty={p.enableFreeQty} products={p.sampleProducts}
        />
    );

    const preview = (() => {
        switch (tab) {
            case 'layout': return { title: 'Your register', cap: 'Drawn by the same rules as the real register. Pick a screen size to see how it adapts.', body: registerPreview(null) };
            case 'catalog': return { title: 'Product buttons', cap: `${p.sampleProducts?.length ? 'Showing your own products.' : 'Your own products appear here once the catalog has loaded.'} Where products sit behind a button, they are shown opened.`, body: registerPreview('catalog', { sheet: true }) };
            case 'screen': return { title: 'Your register', cap: p.seniorMode ? 'Easy-read mode: bigger text and buttons. Columns that no longer fit become buttons.' : 'Text and buttons at normal size.', body: registerPreview(null) };
            case 'buttons': return { title: 'The top bar', cap: 'The buttons you switch on appear in the highlighted bar.', body: registerPreview('bar') };
            case 'checkout':
            case 'money':
            case 'cash': return { title: 'The bill and payment', cap: 'How the total is worked out on a sample sale, with the settings on the left.', body: paymentPreview };
            case 'stock': return { title: 'Product buttons', cap: storeVal('stock_maintenance', '1') === '0' ? 'Stock is not tracked, so every product is always available.' : (String(storeVal('stop_sale_negative_stock', '0')) === '1' ? 'A sold-out product cannot be sold — the register stops the sale and says why.' : 'Sold-out products can still be sold; the stock count goes below zero.'), body: registerPreview('catalog', { sheet: true }) };
            case 'restaurant': return {
                title: 'Your floor',
                cap: p.positions?.length ? 'Showing your own tables.' : 'Sample tables. Your own appear once you add them in Edit tables.',
                body: (
                    <>
                        <FloorPreview positions={p.positions} view={p.floorView} sort={p.floorSort} size={p.floorSize}
                                      showMoney={p.floorShow?.showMoney !== false} showServer={p.floorShow?.showServer !== false}
                                      showTime={p.floorShow?.showTime !== false} lanes={p.lanes} money={money} />
                        {p.terminal === 'table' && registerPreview('floor')}
                    </>
                ),
            };
            case 'kitchen': return { title: 'Where an order goes', cap: 'A sample order, split exactly the way the kitchen will receive it.', body: <TicketsPreview routing={kitchen.routing} products={p.sampleProducts} categories={kitchen.categories} /> };
            case 'hardware': return { title: 'This till’s devices', cap: 'What is connected right now.', body: <HardwarePreview station={p.station} isOnline={p.isOnline} pendingCount={p.pendingCount} /> };
            case 'keys': return { title: 'Keyboard', cap: 'Press any key to see what it does.', body: <KeysPreview lastKey={lastKey} keymap={POS_KEYMAP} /> };
            default: return null;
        }
    })();

    const statusEl = (
        <span className="vqs-saved" data-state={status.state} role="status" aria-live="polite" title={status.msg || undefined}>
            {status.state === 'saving' ? <Loader2 size={15} className="vqs-spin" />
                : status.state === 'error' ? <AlertTriangle size={15} /> : <Check size={15} strokeWidth={3} />}
            <span>{status.state === 'saving' ? 'Saving…' : status.state === 'error' ? (status.msg || 'Not saved') : 'All changes saved'}</span>
        </span>
    );

    const ui = (
        <div className="vqs-root" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
            <div ref={shellRef} className="vqs-shell" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
                <header className="vqs-header">
                    <span className="vqs-header-mark" aria-hidden="true"><Settings2 size={20} /></span>
                    <div className="vqs-header-title">
                        <h2 id={titleId}>Register settings</h2>
                        <p>{p.terminal === 'table' ? 'Restaurant screen' : 'Counter screen'} · changes apply straight away</p>
                    </div>
                    <label className="vqs-search">
                        <Search size={17} aria-hidden="true" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search settings — try “drawer”, “receipt” or “tables”"
                            aria-label="Search settings"
                        />
                        {query ? (
                            <button type="button" className="vqs-iconbtn" data-size="sm" style={{ width: 26, height: 26, boxShadow: 'none' }} onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>
                        ) : <kbd>Ctrl K</kbd>}
                    </label>
                    {statusEl}
                    <button type="button" className="vqs-iconbtn vqs-preview-toggle" onClick={() => setShowPreview(v => !v)}
                            aria-pressed={showPreview} title={showPreview ? 'Hide preview' : 'Show preview'}>
                        {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <Button v="p" onClick={onClose}>Done</Button>
                </header>

                {askPasscode && (
                    <PasscodeBar
                        wrong={askPasscode.wrong}
                        onCancel={() => setAskPasscode(null)}
                        onSubmit={code => { const job = askPasscode; setAskPasscode(null); saveStore(job.section, job.patch, code); }}
                    />
                )}

                <div className="vqs-body" data-preview={showPreview ? 'on' : 'off-mobile'}>
                    <nav className="vqs-nav" aria-label="Settings categories">
                        {GROUPS.map(g => {
                            const items = visible.filter(c => c.group === g.id);
                            if (!items.length) return null;
                            return (
                                <div key={g.id} className="vqs-nav-group">
                                    <p className="vqs-eyebrow">{g.label}</p>
                                    {items.map(c => {
                                        const Icon = c.icon;
                                        const count = query ? results.filter(r => r.cat === c.id).length : 0;
                                        return (
                                            <button key={c.id} type="button" className="vqs-nav-item"
                                                    aria-current={!query && tab === c.id ? 'page' : undefined}
                                                    onClick={() => goTo(c.id)}>
                                                <span className="vqs-nav-icon"><Icon size={17} /></span>
                                                <span className="vqs-nav-text">
                                                    <span className="vqs-nav-label">{c.label}</span>
                                                    <span className="vqs-nav-hint">{c.hint}</span>
                                                </span>
                                                {count > 0 && <span className="vqs-nav-dot">{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        <div className="vqs-nav-foot">
                            <Button v="g" size="sm" icon={Wand2} onClick={p.onRunSetupWizard}>Run the setup guide</Button>
                            <Button v="g" size="sm" icon={RotateCcw} onClick={p.onResetAll}>Reset this register</Button>
                        </div>
                    </nav>

                    <main className="vqs-main" ref={mainRef}>
                        <SettingsCtx.Provider value={ctx}>
                            {query ? (
                                <div className="vqs-page">
                                    <header className="vqs-page-head">
                                        <div>
                                            <h3>{results.length ? `${results.length} setting${results.length === 1 ? '' : 's'} found` : 'Nothing found'}</h3>
                                            <p>{results.length ? 'Pick one to jump straight to it.' : `No setting matches “${query}”. Try a simpler word, like “printer” or “discount”.`}</p>
                                        </div>
                                    </header>
                                    <div className="vqs-results">
                                        {results.map(r => {
                                            const c = CATEGORIES.find(x => x.id === r.cat);
                                            const Icon = c?.icon || Search;
                                            return (
                                                <button key={r.sid} type="button" className="vqs-result" onClick={() => goTo(r.cat, r.sid)}>
                                                    <span className="vqs-nav-icon"><Icon size={17} /></span>
                                                    <span style={{ minWidth: 0 }}>
                                                        <span className="vqs-result-title">{r.title}</span>
                                                        <span className="vqs-result-desc" style={{ display: 'block' }}>{c?.label}</span>
                                                    </span>
                                                    <span className="vqs-result-where vqs-tag">Open</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : page}
                        </SettingsCtx.Provider>
                    </main>

                    {preview && (
                        <aside className="vqs-preview" aria-label="Live preview">
                            <div className="vqs-preview-head">
                                <h4>{preview.title}</h4>
                                <span className="vqs-live" style={{ marginLeft: 'auto' }}><i /> Live</span>
                            </div>
                            {preview.cap && <p className="vqs-preview-cap">{preview.cap}</p>}
                            {preview.body}
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(ui, document.body);
}

function PasscodeBar({ onSubmit, onCancel, wrong }) {
    const [code, setCode] = useState('');
    return (
        <div className="vqs-callout" data-tone="warn" style={{ margin: '10px 18px 0', borderRadius: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Lock size={18} />
            <span style={{ flex: '1 1 260px' }}>
                <b>{wrong ? 'That passcode was not right.' : 'This business uses a settings passcode.'}</b> Enter it to save the change.
            </span>
            <form style={{ display: 'flex', gap: 8 }} onSubmit={e => { e.preventDefault(); if (code) onSubmit(code); }}>
                <label className="vqs-input" style={{ width: 160, height: 40 }}>
                    <input type="password" inputMode="numeric" autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Passcode" placeholder="Passcode" />
                </label>
                <Button v="p" size="sm" type="submit">Save</Button>
                <Button v="g" size="sm" onClick={onCancel}>Cancel</Button>
            </form>
        </div>
    );
}

export { SEARCH_INDEX };
