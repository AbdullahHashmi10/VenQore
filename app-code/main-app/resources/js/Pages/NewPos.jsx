/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  New POS — the composed register                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Route: /new-pos   ·   Controller: NewPosController@index
 *
 * ── WHAT THIS IS ────────────────────────────────────────────────────────────
 * The register from `extras/Layout Law/venqore-pos.html`, built as a real page
 * instead of a simulation. Two differences from that file, and they are the
 * point of this one:
 *
 *   1. It runs against the REAL viewport. No device frame, no width slider, no
 *      `--vq-margin-now` fudge — `composeTerminal()` is handed
 *      `window.innerWidth/innerHeight` and the page is whatever it says.
 *
 *   2. The composer is not a documentation toy above the screen. It is the
 *      SETTINGS DRAWER behind the gear, which is where a cashier would look for
 *      it, and it persists per user and per device.
 *
 * ── WHAT IT IS NOT, YET ─────────────────────────────────────────────────────
 * Nothing here talks to the server. Products, customers, parked sales, recent
 * invoices and the offline queue come from `@/NewPos/mock`. Every field is
 * named the way the live payload names it, so wiring is a swap of that import
 * plus the four fetches listed at the top of it — not a rewrite. Completing a
 * sale shows the toast it would show and clears the tab; it posts nothing.
 *
 * ── THE THREE RULES THE SURFACE OBEYS ───────────────────────────────────────
 *   RANK 1 · act        every transaction · always visible · capped at SEVEN
 *   RANK 2 · adjust     some transactions · one gesture away, revealed by the
 *                       thing it acts on, so it costs nothing until needed
 *   RANK 3 · configure  once per setup, shift or month · the drawer, and ONLY
 *                       the drawer. Budget on the working surface: zero.
 *
 * Turn on "Show control ranks" in Settings → Arrange and the surface audits
 * itself: every control carries its rank in `data-rank`.
 *
 * ── THE FOURTEEN ────────────────────────────────────────────────────────────
 * The capability inventory found fourteen live defects in the shipped POS. Each
 * is answered here and marked `FIX:` so the answer can be found from the
 * defect. Nothing on this screen advertises behaviour it does not have — that
 * was defect nine, and it is the easiest one to re-introduce.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';

import '@/NewPos/newpos.css';
import { LAW, composeTerminal, marginAt, presetComposition } from '@/LayoutLaw/engine';
import {
    BANKS, CATEGORIES, DISCOUNT_PRESETS, HUES, NAV, OPENING_CART, PARTIES, PAY_METHODS,
    PRODUCTS, QUEUE, TABLES, TAX_RATES, WAREHOUSES, bandedPrice, lookup, productById,
} from '@/NewPos/mock';
import {
    DEFAULTS, autoComposition, clearRescue, loadPrefs, loadRescue, savePrefs, saveRescue,
} from '@/NewPos/settings';
import {
    Flag, HUE_VAR, Icon, Kbd, Money, Pane, RowButton, Sheet, Splitter, Stepper, Toasts, n0,
    useViewport,
} from '@/LayoutLaw/ui';
import {
    BreakupSheet, ChargesSheet, DiscountSheet, KeysSheet, LineSheet, NavDrawer, NotesSheet,
    OfflineSheet, OverpaySheet, Palette, ParkedSheet, PartySheet, QuickBankSheet,
    QuickProductSheet, RecentSheet, ReturnSheet, SplitSheet, VariantSheet, lineDiscount,
} from '@/NewPos/sheets';
import SettingsDrawer from '@/NewPos/SettingsDrawer';

/* ════════════════════════════════════════════════════════════════════════════
   A SALE
   ════════════════════════════════════════════════════════════════════════════ */

let uidSeq = 1;
const uid = () => `u${uidSeq += 1}`;

/** FIX · idempotency: one key per document, generated once and sent with every
 *  attempt, so a retry after a timeout cannot post the same sale twice. */
const idemKey = () => `idem-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

function newLine(product, qty = 1, variant = null) {
    const base = variant ? variant.price : product.price;
    const { price, band } = bandedPrice({ ...product, price: base }, qty);
    return {
        u: uid(),
        pid: product.id,
        name: variant ? `${product.name} — ${variant.name}` : product.name,
        sku: variant ? variant.sku : product.sku,
        qty,
        price,
        basePrice: base,
        band,
        cost: product.cost,             // FIX · cost travels WITH the line, so the
        tax: product.tax,               //       margin readout is a real number
        unit: product.unit,
        batch: product.batch || null,
        freeQty: 0,
        discount: { mode: 'pct', value: 0 },
        note: '',
        overridden: false,
        variantId: variant ? variant.id : null,
        manufactured: false,
    };
}

/* `ops` is passed in because a default that the drawer writes and no sale ever
   reads is a setting that does not exist. Default tax, tax mode, location and
   deposit account all land here. */
function newTab(seq, ops) {
    const o = ops || {};
    return {
        id: `t${seq}-${Math.random().toString(36).slice(2, 6)}`,
        seq,
        docNo: null,                          // FIX · a tab is labelled by its document
        party: PARTIES[0],                    //       number or its party, never Date.now()
        lines: [],
        discount: { mode: 'pct', value: 0 },  // FIX · ONE discount value
        charges: [],                          // FIX · charges are part of the total
        notes: '',                            // FIX · notes are resident, one payload path
        taxRate: TAX_RATES.find((t) => t.id === o.defaultTax)?.rate ?? 18,
        taxMode: o.taxMode || 'exclusive',
        warehouse: o.warehouse ?? 1,
        bank: o.bank ?? 1,
        method: 'Cash',
        splits: [],
        fulfilment: 'local',
        tendered: 0,
        tenderTouched: false,
        isReturn: false,
        returnRef: null,
        overpay: 'change',
        idem: idemKey(),
    };
}

const tabLabel = (t) => t.docNo || (t.party && !t.party.walkin ? t.party.name : `Sale ${t.seq}`);

/* ════════════════════════════════════════════════════════════════════════════
   THE PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function NewPos({ auth }) {
    const userId = auth?.user?.id ?? 'demo';
    const vp = useViewport();

    /* ── preferences ─────────────────────────────────────────────────────── */
    const [prefs, setPrefs] = useState(() => loadPrefs(userId));
    const [rankMode, setRankMode] = useState(false);
    const [settingsTab, setSettingsTab] = useState('arrange');
    /* Debounced. A splitter drag writes `prefs` once per pointermove, and a
       synchronous JSON.stringify into localStorage on every frame of a drag is
       the kind of jank that makes a register feel broken. */
    useEffect(() => {
        const id = setTimeout(() => savePrefs(userId, prefs), 250);
        return () => clearTimeout(id);
    }, [userId, prefs]);

    /* AUTO. The profile is the only thing the operator states; the geometry for
       whatever screen this is comes from the law, and is re-picked whenever the
       screen changes — so rotating a tablet or docking a laptop rearranges the
       register rather than cramming the desktop layout into a smaller box. */
    useEffect(() => {
        if (!prefs.auto) return;
        const { preset, comp } = autoComposition(prefs.profile, vp.w, vp.h);
        if (preset !== prefs.preset || JSON.stringify(comp) !== JSON.stringify(prefs.comp)) {
            setPrefs((p) => (p.auto ? { ...p, preset, comp } : p));
        }
    }, [prefs.auto, prefs.profile, prefs.preset, prefs.comp, vp.w, vp.h]);

    /* ── the composed terminal ───────────────────────────────────────────── */
    const T = useMemo(
        () => composeTerminal(prefs.comp, vp.w, vp.h, { rail: prefs.rail }),
        [prefs.comp, vp.w, vp.h, prefs.rail],
    );
    const narrow = vp.w < 620;

    /* ── the sales ───────────────────────────────────────────────────────── */
    const [tabs, setTabs] = useState(() => {
        const first = newTab(1, DEFAULTS.ops);
        first.lines = OPENING_CART.map(({ pid, qty }) => newLine(productById(pid), qty));
        return [first];
    });
    const [active, setActive] = useState(0);
    const [sel, setSel] = useState(-1);
    const tab = tabs[Math.min(active, tabs.length - 1)];

    const patchTab = useCallback((patch) => {
        setTabs((ts) => ts.map((t, i) => (i === active ? { ...t, ...patch } : t)));
    }, [active]);

    const patchLine = useCallback((u, patch) => {
        setTabs((ts) => ts.map((t, i) => (i === active
            ? { ...t, lines: t.lines.map((l) => (l.u === u ? { ...l, ...patch } : l)) }
            : t)));
    }, [active]);

    /* ── UI state ────────────────────────────────────────────────────────── */
    const [sheet, setSheet] = useState(null);
    const [navOpen, setNavOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [variantFor, setVariantFor] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [online, setOnline] = useState(true);
    const [queue, setQueue] = useState(QUEUE);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [products, setProducts] = useState(PRODUCTS);
    const [banks, setBanks] = useState(BANKS);
    const [table, setTable] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const searchRef = useRef(null);
    const undoRef = useRef({});

    const anyOverlay = !!sheet || navOpen || settingsOpen || paletteOpen || !!confirm;

    const toast = useCallback((text, opts = {}) => {
        const t = { id: `${Date.now()}-${Math.random()}`, text, ...opts };
        setToasts((ts) => [...ts.slice(-2), t]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), opts.ms || 3200);
        return t;
    }, []);

    /* ════════════════════════════════════════════════════════════════════════
       CART MATHS — one formula, and every number on the screen reads it
       ════════════════════════════════════════════════════════════════════════ */
    const m = useMemo(() => {
        const gross = tab.lines.reduce((a, l) => a + l.qty * l.price, 0);
        const lineDisc = tab.lines.reduce((a, l) => a + lineDiscount(l), 0);
        const sub = gross - lineDisc;
        // FIX · ONE discount value and ONE formula. The shipped register wrote
        // `discount` from F9 and read `discountValue` in the total, which was
        // always defined — so the F9 dialog appeared to do nothing at all.
        // Clamped here as well as at the field: a percentage above 100 made the
        // payment column print rows that did not sum to their own total, and the
        // Math.max(0, …) below hid the overflow instead of preventing it.
        const docDisc = tab.discount.mode === 'pct'
            ? (sub * Math.min(100, Math.max(0, tab.discount.value || 0))) / 100
            : Math.min(sub, Math.max(0, tab.discount.value || 0));
        // FIX · charges are a document field and part of the total, on every
        // screen. F8 used to store a charge that no total ever read.
        const charges = tab.charges.reduce((a, c) => a + (Number(c.amount) || 0), 0);
        const taxable = Math.max(0, sub - docDisc);
        const rate = tab.taxRate || 0;
        const tax = tab.taxMode === 'inclusive'
            ? taxable - taxable / (1 + rate / 100)
            : (taxable * rate) / 100;
        const beforeRound = tab.taxMode === 'inclusive'
            ? taxable + charges
            : taxable + tax + charges;
        const rounded = prefs.ops.roundOff ? Math.round(beforeRound) : beforeRound;
        return {
            gross,
            lineDisc,
            sub,
            docDisc,
            charges,
            tax,
            round: rounded - beforeRound,
            beforeRound,
            total: tab.isReturn ? -rounded : rounded,
            taxMode: tab.taxMode,
            taxLabel: `${rate}%`,
            count: tab.lines.reduce((a, l) => a + l.qty + l.freeQty, 0),
        };
    }, [tab, prefs.ops.roundOff]);

    const change = tab.tendered - m.total;

    /* Auto-fill exact cash — but never overwrite a figure the cashier typed. */
    useEffect(() => {
        if (!prefs.ops.autoFillCash || tab.tenderTouched) return;
        patchTab({ tendered: Math.max(0, Math.round(m.total)) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [m.total, prefs.ops.autoFillCash, tab.tenderTouched]);

    /* ════════════════════════════════════════════════════════════════════════
       CART OPERATIONS
       ════════════════════════════════════════════════════════════════════════ */

    /* FIX · `pos.void_item` is enforced AT THE CONTROL. It was defined in
       config/permissions.php and checked nowhere, so any cashier could delete a
       line. Cancel is undoable for ten seconds — no dialog, and no loss. */
    const removeLine = useCallback((l) => {
        if (!prefs.perms['pos.void_item']) {
            toast('Your role may not void a line.', { tone: 'bad' });
            return;
        }
        const removed = l;
        const tabId = tab.id;
        setTabs((ts) => ts.map((t) => (t.id === tabId ? { ...t, lines: t.lines.filter((x) => x.u !== l.u) } : t)));
        setSel(-1);
        const t = toast(`${l.name} removed.`, { action: 'Undo', ms: 8000 });
        // Keyed by tab ID, one entry per toast. Keyed by INDEX, closing an
        // earlier tab made Undo restore into the wrong sale; keeping only the
        // last snapshot, two removals inside eight seconds lost the first.
        undoRef.current = { ...undoRef.current, [t.id]: { tabId, kind: 'line', line: removed } };
    }, [active, prefs.perms, tab.lines, toast]);

    const setQty = useCallback((l, q) => {
        if (q <= 0) { removeLine(l); return; }
        const p = productById(l.pid, products);
        const { price, band } = bandedPrice({ ...(p || {}), price: l.basePrice }, q);
        patchLine(l.u, { qty: q, band, price: l.overridden ? l.price : price });
    }, [patchLine, removeLine]);

    /* Returns whether a line was actually added, because "created and added"
       was being announced for a product the stock rule had just refused. */
    const addProduct = useCallback((p, qty = 1, variant = null, force = false) => {
        if (p.kind === 'variant' && !variant) { setVariantFor(p); setSheet('variant'); return false; }

        /* FIX · the reserved-stock backorder confirm. The shipped register wrote
           `if (!window.confirm(...))` against an override that returns a Promise —
           a Promise is always truthy, so the negation was always false and the
           check never blocked anything, ever. Here the sale genuinely pauses:
           nothing is added until the question is answered. */
        if (!force && prefs.ops.confirmBackorder && prefs.ops.allowOversell && p.stock > 0) {
            const have = (tab.lines.find((l) => l.sku === (variant ? variant.sku : p.sku)) || {}).qty || 0;
            if (have + qty > p.stock) {
                setConfirm({
                    title: 'Not enough in stock',
                    body: `${p.name} has ${p.stock} ${p.unit} on hand and this sale would take ${have + qty}. `
                        + `The difference goes on backorder.`,
                    cta: `Backorder ${have + qty - p.stock}`,
                    onYes: () => addProduct(p, qty, variant, true),
                });
                return false;
            }
        }

        // Auto-manufacture from a recipe: a composite whose own stock is zero is
        // made now from its raw materials, and the line SAYS so rather than
        // quietly succeeding.
        let manufactured = false;
        if (p.kind === 'composite' && p.stock <= 0) {
            manufactured = true;
            const recipe = (p.recipe || []).join(', ');
            toast(`${p.name} made from its recipe${recipe ? ` — ${recipe} deducted` : ''}.`, { tone: 'good' });
        } else if (!prefs.ops.allowOversell && p.stock <= 0 && p.kind !== 'composite') {
            toast(`${p.name} is out of stock. Settings → Operate → Allow overselling to sell it anyway.`, { tone: 'bad' });
            return false;
        }

        setTabs((ts) => ts.map((t, i) => {
            if (i !== active) return t;
            const key = variant ? variant.sku : p.sku;
            const found = t.lines.find((l) => l.sku === key);
            if (!found) return { ...t, lines: [...t.lines, { ...newLine(p, qty, variant), manufactured }] };
            const q = found.qty + qty;
            // Wholesale price banding, applied automatically — unless the cashier
            // has overridden the price on this line, which always wins.
            const { price, band } = bandedPrice({ ...p, price: found.basePrice }, q);
            return {
                ...t,
                lines: t.lines.map((l) => (l.u === found.u
                    ? { ...l, qty: q, band, price: l.overridden ? l.price : price }
                    : l)),
            };
        }));
        return true;
    }, [active, prefs.ops.allowOversell, prefs.ops.confirmBackorder, tab.lines, toast]);

    const cancelSale = useCallback(() => {
        if (!tab.lines.length) return;
        const snapshot = tab.lines;
        const tabId = tab.id;
        // The tendered figure belongs to the sale that was cleared. Leaving it —
        // and leaving tenderTouched true, which disables auto-fill for the life
        // of the tab — is how the next customer gets change nobody paid.
        patchTab({
            lines: [], discount: { mode: 'pct', value: 0 }, charges: [], notes: '',
            tendered: 0, tenderTouched: false, splits: [], isReturn: false, returnRef: null,
        });
        setSel(-1);
        const t = toast('Sale cleared.', { action: 'Undo', ms: 10000 });
        undoRef.current = { ...undoRef.current, [t.id]: { tabId, kind: 'clear', lines: snapshot } };
    }, [active, patchTab, tab.lines, toast]);

    const onToastAction = useCallback((t) => {
        const u = (undoRef.current || {})[t.id];
        if (u) {
            setTabs((ts) => ts.map((x) => {
                if (x.id !== u.tabId) return x;
                // A removal puts back ONE line, so anything scanned since it
                // survives. Only a clear restores the whole snapshot.
                if (u.kind === 'line') {
                    return x.lines.some((l) => l.u === u.line.u) ? x : { ...x, lines: [...x.lines, u.line] };
                }
                return { ...x, lines: u.lines };
            }));
            const next = { ...undoRef.current };
            delete next[t.id];
            undoRef.current = next;
        }
        setToasts((ts) => ts.filter((x) => x.id !== t.id));
    }, []);

    /* ── scan / search ───────────────────────────────────────────────────────
       Barcode-first. An exact barcode or SKU wins before any fuzzy match, so a
       scanner never opens a picker. */
    const { exact, matches } = useMemo(() => lookup(search, products), [search, products]);

    const onSearchKey = (e) => {
        if (e.key === 'Enter') {
            const hit = exact || (matches.length === 1 ? matches[0] : null);
            if (hit) { addProduct(hit); setSearch(''); } else if (matches.length) {
                setCatalogSearch(search); setSheet('catalog');
            } else if (search.trim()) {
                toast(`Nothing matches "${search.trim()}".`, { tone: 'bad' });
            }
        }
        if (e.key === 'Escape') setSearch('');
    };

    /* ── the register's own actions ──────────────────────────────────────── */
    const openDrawer = useCallback(() => {
        // FIX · AMDStation.openDrawer() and the thermal_open_drawer setting both
        // existed with no button anywhere in the shipped UI.
        if (!prefs.perms['pos.open_drawer']) { toast('Your role may not open the drawer.', { tone: 'bad' }); return; }
        toast('Cash drawer opened.', { tone: 'good' });
    }, [prefs.perms, toast]);

    const holdSale = useCallback(() => {
        if (!tab.lines.length) { toast('Nothing to hold.'); return; }
        toast(`Held as HLD-00${44 + tabs.length} — recall it from Parked.`, { tone: 'good' });
        patchTab({
            lines: [], notes: '', charges: [], discount: { mode: 'pct', value: 0 },
            tendered: 0, tenderTouched: false, splits: [], isReturn: false, returnRef: null,
        });
        setSel(-1);
    }, [patchTab, tab.lines.length, tabs.length, toast]);

    const complete = useCallback((opts = {}) => {
        if (!tab.lines.length) { toast('Nothing to complete.', { tone: 'bad' }); return false; }
        const ch = tab.tendered - m.total;
        // A split has to cover the bill too. The old guard skipped the check
        // entirely the moment `splits` was non-empty, so a one-rupee split
        // posted a 45,000 sale.
        if (tab.splits.length) {
            const paid = tab.splits.reduce((a, x) => a + (Number(x.amount) || 0), 0);
            if (paid + 0.5 < m.total) {
                toast(`Split covers ${n0(paid)} of ${n0(m.total)}. Add the rest.`, { tone: 'bad' });
                setSheet('split');
                return false;
            }
        } else if (!tab.isReturn && tab.method === 'Cash' && ch < -0.5) {
            toast(`Short by ${n0(Math.abs(ch))}. Take more, or split the payment.`, { tone: 'bad' });
            return false;
        }
        if (!opts.skipOverpay && !tab.isReturn && !tab.splits.length && tab.method === 'Cash' && ch > 0.5) {
            setSheet('overpay');
            return false;
        }
        // 'ledger' means the customer's account keeps it. Announcing change and
        // opening the drawer for money that is not going back is the opposite
        // of what was just chosen.
        const asChange = (opts.overpay || tab.overpay) !== 'ledger';

        // FIX · only a genuine network failure queues. A server rejection — a 422
        // or a plan-limit refusal — is a validation error on the field that
        // caused it, never a silent "offline sale" that will never post.
        if (!online) {
            const q = {
                id: `Q-${7784 + queue.length}`,
                at: new Date().toTimeString().slice(0, 5),
                total: m.total,
                lines: tab.lines.length,
                state: 'pending',
                why: 'No connection when completed',
            };
            setQueue((qs) => [...qs, q]);
            toast(`Queued as ${q.id}. It posts by itself the moment you are back online.`, { tone: 'good', ms: 5000 });
        } else {
            const no = `INV-${10232 + tabs.length}`;
            toast(
                `${tab.isReturn ? 'Return' : 'Sale'} ${no} posted`
                + `${prefs.ops.autoPrint ? ' · printing' : ''}`
                + `${ch > 0.5 && !tab.isReturn && asChange ? ` · change ${n0(ch)}` : ''}.`,
                { tone: 'good', ms: 4200 },
            );
            if (prefs.ops.openDrawerOnCash && tab.method === 'Cash' && asChange) openDrawer();
        }

        const tabId = tab.id;
        setTabs((ts) => ts.map((t) => (t.id === tabId
            ? { ...newTab(t.seq, prefs.ops), party: t.party, warehouse: t.warehouse, taxRate: t.taxRate, taxMode: t.taxMode }
            : t)));
        setSel(-1);
        clearRescue(userId);
        return true;
    }, [m.total, online, openDrawer, prefs.ops, queue.length, tab, tabs.length, toast, userId]);

    /* ── tabs ────────────────────────────────────────────────────────────── */
    const addTab = useCallback(() => {
        setTabs((ts) => [...ts, newTab(ts.length + 1, prefs.ops)]);
        setActive(tabs.length);
        setSel(-1);
    }, [prefs.ops, tabs.length]);

    const closeTab = useCallback((i) => {
        if (tabs.length === 1) { cancelSale(); return; }
        setTabs((ts) => ts.filter((_, j) => j !== i));
        setActive((a) => Math.max(0, a >= i ? a - 1 : a));
        setSel(-1);
    }, [cancelSale, tabs.length]);

    /* ── cart rescue ─────────────────────────────────────────────────────────
       A crash, a reload, a closed lid: the cart survives. It is automatic, and
       the only UI it gets is the toast that says it happened. */
    useEffect(() => {
        const saved = loadRescue(userId);
        if (saved?.tabs?.length && saved.tabs.some((t) => t.lines?.length)) {
            setTabs(saved.tabs);
            toast('Your cart was restored from before the page closed.', { tone: 'good', ms: 5000 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const id = setTimeout(() => saveRescue(userId, tabs), 400);
        return () => clearTimeout(id);
    }, [tabs, userId]);

    /* The queue drains itself the moment the connection comes back. */
    useEffect(() => {
        if (!online) return undefined;
        const id = setTimeout(() => {
            setQueue((qs) => qs.map((q) => (q.state === 'pending' ? { ...q, state: 'syncing', why: 'Retrying now' } : q)));
        }, 1500);
        return () => clearTimeout(id);
    }, [online]);

    /* ════════════════════════════════════════════════════════════════════════
       THE KEYMAP
       FIX · scoped to the surface and SUSPENDED inside a field or a sheet. The
       shipped handler had no "am I typing?" guard, so F-keys fired from inside
       modal inputs — a cashier typing a quantity could delete a line.
       F10 (loyalty) and the old F6 stub are gone: a key that emits "coming
       soon" is worse than a key that is not on the map.
       ════════════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        /* The guard has to exempt the SCAN BOX, and this is not a detail.
           A scanner types into whatever holds the caret, so the register parks
           the caret in the scan field and puts it back whenever anything else
           releases it. A guard that reads "am I in an input?" is therefore true
           essentially always, and the entire keymap is dead — F9 does nothing,
           and Ctrl+W reaches the BROWSER and closes the tab with the sale in it.

           The rule the law actually wants is "suspended inside a field the
           cashier is filling in, and inside a sheet". The scan box is neither:
           it is the working surface's default state. */
        const typing = () => {
            const el = document.activeElement;
            if (!el) return false;
            if (el.dataset && el.dataset.scan === 'true') return false;
            return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
                || el.tagName === 'SELECT' || el.isContentEditable;
        };

        const onKey = (e) => {
            // Esc closes the top layer, and works everywhere — including inside a
            // field, because being stuck in one is exactly when you need it.
            if (e.key === 'Escape') {
                if (confirm) setConfirm(null);
                else if (paletteOpen) setPaletteOpen(false);
                else if (settingsOpen) setSettingsOpen(false);
                else if (sheet) setSheet(null);
                else if (navOpen) setNavOpen(false);
                else if (sel >= 0) setSel(-1);
                return;
            }
            // Ctrl+K works everywhere too: it is how you get out of being lost.
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
                return;
            }
            // A SHEET suspends the map — that is what the original defect was
            // about, F-keys firing from inside a modal's inputs. A resident
            // field does not: function keys and Ctrl-combos never collide with
            // typing, and only the single-character shortcuts below check.
            if (anyOverlay) return;

            const line = sel >= 0 ? tab.lines[sel] : null;
            const withLine = (fn) => {
                if (line) fn(line);
                else toast('Select a line first — Ctrl+1…9, or tap it.');
            };

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Tab') { e.preventDefault(); setActive((a) => (a + 1) % tabs.length); return; }
                if (/^[1-9]$/.test(e.key)) { e.preventDefault(); setSel(Math.min(tab.lines.length - 1, Number(e.key) - 1)); return; }
                const k = e.key.toLowerCase();
                if (k === 's' || k === 'p') { e.preventDefault(); complete(); }
                else if (k === 'n') { e.preventDefault(); if (complete()) addTab(); }
                else if (k === 'd') { e.preventDefault(); setSheet('party'); }
                else if (k === 't') { e.preventDefault(); addTab(); }
                else if (k === 'w') { e.preventDefault(); closeTab(active); }
                else if (k === 'f') { e.preventDefault(); setSheet('breakup'); }
                return;
            }
            if (e.altKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
                else document.exitFullscreen?.().catch(() => {});
                return;
            }
            switch (e.key) {
                // F2/F3/F5/F6 all open the ONE line editor, on the field they name.
                case 'F1': e.preventDefault(); searchRef.current?.focus(); break;
                case 'F2': case 'F3': case 'F5': case 'F6':
                    e.preventDefault(); withLine(() => setSheet('line')); break;
                case 'F4': e.preventDefault(); withLine((l) => removeLine(l)); break;
                case 'F7': e.preventDefault(); setSheet('tax'); break;
                case 'F8': e.preventDefault(); setSheet('charges'); break;
                case 'F9': e.preventDefault(); setSheet('discount'); break;
                case 'F11': e.preventDefault(); setSheet('party'); break;
                case 'F12': e.preventDefault(); setSheet('notes'); break;
                // The one key on the map that is also a character you might type.
                case '?': if (!typing()) { e.preventDefault(); setSheet('keys'); } break;
                default: break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    /* A scanner types into whatever has focus, so the search field is the
       default owner of the caret and takes it back whenever nothing else wants
       it. */
    useEffect(() => {
        if (!anyOverlay) searchRef.current?.focus();
    }, [anyOverlay]);

    /* ════════════════════════════════════════════════════════════════════════
       SPLITTERS — drag the dividers in the screen itself
       ════════════════════════════════════════════════════════════════════════ */
    const getFrac = (k) => (k === 'catalog' ? prefs.comp.catalog.size
        : k === 'tender' ? prefs.comp.split.tender
            : prefs.comp.split.cart);

    const setFrac = (k, v, k2, v2) => {
        setPrefs((p) => {
            const c = { ...p.comp, catalog: { ...p.comp.catalog }, split: { ...p.comp.split } };
            const put = (key, val) => {
                if (key === 'catalog') c.catalog.size = Math.max(0.12, Math.min(0.55, val));
                else if (key === 'tender') c.split.tender = Math.max(0, Math.min(0.45, val));
                else c.split.cart = Math.max(0.3, Math.min(1, val));
            };
            put(k, v);
            if (k2 && v2 !== undefined) put(k2, v2);
            // Dragging a divider is arranging by hand, so Auto steps aside — and
            // says so, at the top of the drawer, with one tap back.
            return { ...p, auto: false, comp: c };
        });
    };

    /* ════════════════════════════════════════════════════════════════════════
       PIECES
       These are functions, not components. Declaring a component inside a render
       gives it a new identity on every keystroke, React unmounts and remounts it,
       and the "Amount tendered" field loses the caret mid-number.
       ════════════════════════════════════════════════════════════════════════ */
    const inCart = (sku) => (tab.lines.find((l) => l.sku === sku) || {}).qty || 0;

    const visibleProducts = useMemo(() => products.filter((p) => {
        if (catFilter !== 'all' && p.cat !== catFilter) return false;
        if (!catalogSearch.trim()) return true;
        const q = catalogSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }), [products, catFilter, catalogSearch]);

    const renderTile = (p) => {
        const q = inCart(p.sku);
        const out = p.stock <= 0 && p.kind !== 'composite';
        return (
            <button
                key={p.id}
                type="button"
                className="nqp-tile"
                data-rank="1"
                data-out={out ? 'true' : undefined}
                onClick={() => addProduct(p)}
            >
                <span className="nqp-sw" style={{ background: HUE_VAR[p.hue] }} />
                {p.kind !== 'simple' ? (
                    <span className="nqp-kindtag">{p.kind === 'variant' ? 'variants' : p.kind === 'composite' ? 'recipe' : 'serial'}</span>
                ) : null}
                <span className="nqp-tile-nm">{p.name}</span>
                <span className="nqp-tile-pr">{n0(p.price)}</span>
                {q ? <span className="nqp-incart">{q}</span> : null}
            </button>
        );
    };

    const renderCatalogFilters = () => (
        <div className="nqp-cats">
            {CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="nqp-catchip" data-rank="2" aria-pressed={catFilter === c.id} onClick={() => setCatFilter(c.id)}>
                    {c.name}
                </button>
            ))}
        </div>
    );

    const renderCatalogBody = (per) => {
        if (per >= 2) {
            return (
                <div style={{ display: 'grid', gap: 12, padding: 12, gridTemplateColumns: `repeat(${per}, minmax(0,1fr))` }}>
                    {visibleProducts.map(renderTile)}
                </div>
            );
        }
        return (
            <>
                {visibleProducts.map((p) => {
                    const q = inCart(p.sku);
                    return (
                        <button key={p.id} type="button" className="nqp-catrow" data-rank="1" onClick={() => addProduct(p)}>
                            <span className="nqp-sw" style={{ background: HUE_VAR[p.hue] }} />
                            <span style={{ flex: 1, minWidth: 0 }}>
                                <span className="nqp-line-name" style={{ display: 'block' }}>{p.name}</span>
                                <span className="nqp-line-sub">
                                    {p.sku} · {p.stock > 0 ? `${p.stock} in stock` : p.kind === 'composite' ? 'made to order' : 'out of stock'}
                                </span>
                            </span>
                            {q ? <span className="nqp-badge">{q}</span> : null}
                            <span className="num" style={{ fontSize: 13 }}>{n0(p.price)}</span>
                        </button>
                    );
                })}
                {!visibleProducts.length ? <div className="nqp-empty">Nothing in this category matches.</div> : null}
            </>
        );
    };

    /* ── cart ────────────────────────────────────────────────────────────── */
    const renderCartBody = (fit) => {
        if (!tab.lines.length) {
            return (
                <div className="nqp-empty">
                    {tab.isReturn ? 'Load an invoice, or scan the items coming back.' : 'Scan a barcode or tap an item to start.'}
                </div>
            );
        }
        return tab.lines.map((l, i) => {
            const net = l.qty * l.price - lineDiscount(l);
            const flags = (
                <>
                    {l.overridden ? <Flag tone="warn">price set</Flag> : null}
                    {l.discount.value ? <Flag tone="info">{l.discount.mode === 'pct' ? `${l.discount.value}%` : `−${n0(l.discount.value)}`}</Flag> : null}
                    {l.freeQty ? <Flag>+{l.freeQty} free</Flag> : null}
                    {l.band ? <Flag title={`Wholesale band from ${l.band} ${l.unit}`}>wholesale</Flag> : null}
                    {l.manufactured ? <Flag tone="info">made now</Flag> : null}
                    {l.note ? <Flag tone="info">note</Flag> : null}
                    {prefs.ops.showMargin && l.cost && l.price > 0 ? (
                        <Flag tone={l.price > l.cost ? undefined : 'bad'}>{(((l.price - l.cost) / l.price) * 100).toFixed(0)}% margin</Flag>
                    ) : null}
                </>
            );
            return (
                <div key={l.u}>
                    {/* Not a <button>: it contains the quantity stepper, and a
                        button inside a button is invalid HTML the browser
                        silently unnests. RowButton is the same thing with a
                        role and a keyboard handler. */}
                    <RowButton
                        className="nqp-line"
                        data-sel={i === sel ? 'true' : undefined}
                        onClick={() => setSel(sel === i ? -1 : i)}
                    >
                        {fit === 'minimal' ? (
                            <>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    <span className="nqp-line-name" style={{ display: 'block' }}>{l.name}</span>
                                    <span className="nqp-line-sub">{l.qty} × {n0(l.price)}</span>
                                </span>
                                <Money value={net} font={15} avail={92} className="nqp-line-tot" />
                            </>
                        ) : fit === 'relay' ? (
                            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <span className="nqp-line-name">{l.name}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Stepper qty={l.qty} onMinus={() => setQty(l, l.qty - 1)} onPlus={() => setQty(l, l.qty + 1)} />
                                    <span className="nqp-line-rate num">{n0(l.price)}</span>
                                    <Money value={net} font={15} avail={110} className="nqp-line-tot" style={{ marginLeft: 'auto' }} />
                                </span>
                                <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{flags}</span>
                            </span>
                        ) : (
                            <>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    <span className="nqp-line-name" style={{ display: 'block' }}>{l.name}</span>
                                    <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>{flags}</span>
                                </span>
                                {/* Quantity is visible on EVERY line, not behind a
                                    selection — but it belongs to the cart-lines
                                    object, so it costs one unit of attention, not
                                    one per line. */}
                                <Stepper qty={l.qty} onMinus={() => setQty(l, l.qty - 1)} onPlus={() => setQty(l, l.qty + 1)} />
                                <span className="nqp-line-rate num">{n0(l.price)}</span>
                                <Money value={net} font={15} avail={110} className="nqp-line-tot" />
                                <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Remove ${l.name}`}
                                    className="nqp-line-del"
                                    data-rank="2"
                                    onClick={(e) => { e.stopPropagation(); removeLine(l); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeLine(l); } }}
                                >
                                    ✕
                                </span>
                            </>
                        )}
                    </RowButton>
                    {i === sel ? (
                        /* RANK 2 · revealed by the thing it acts on. Every one of
                           these opens the SAME line editor, on the field it names —
                           the shipped register had two near-identical modals and
                           opening the wrong one was a top overwhelm complaint. */
                        <div className="nqp-adj">
                            <button type="button" className="nqp-adjbtn" data-rank="2" onClick={() => setSheet('line')}>Edit line <Kbd>F2</Kbd></button>
                            <button type="button" className="nqp-adjbtn" data-rank="2" disabled={!prefs.perms['pos.discount']} onClick={() => setSheet('line')}>Discount</button>
                            <button type="button" className="nqp-adjbtn" data-rank="2" disabled={!prefs.perms['pos.price_override']} onClick={() => setSheet('line')}>Price</button>
                            <button type="button" className="nqp-adjbtn" data-rank="2" onClick={() => setSheet('line')}>Free qty</button>
                            <button type="button" className="nqp-adjbtn" data-rank="2" onClick={() => setSheet('line')}>Note</button>
                            {productById(l.pid, products)?.kind === 'variant' ? (
                                <button type="button" className="nqp-adjbtn" data-rank="2" onClick={() => { setVariantFor(productById(l.pid, products)); setSheet('variant'); }}>Variant</button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            );
        });
    };

    /* ── tender ──────────────────────────────────────────────────────────── */
    const taxLabel = TAX_RATES.find((t) => t.rate === tab.taxRate)?.label || `${tab.taxRate}%`;

    const renderTenderBody = (fit, w, full) => {
        const avail = Math.max(90, w - 40 - 110);
        return (
            <>
                <button type="button" className="nqp-party" data-rank="1" onClick={() => setSheet('party')}>
                    <span className="nqp-avatar">{tab.party.name[0]}</span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span className="nqp-line-name" style={{ display: 'block' }}>{tab.party.name}</span>
                        <span className="nqp-line-sub">
                            {tab.party.walkin ? 'Walk-in — cash sale'
                                : `Balance ${n0(tab.party.balance)}${tab.party.discount ? ` · ${tab.party.discount}% default discount` : ''}`}
                        </span>
                    </span>
                    {w > 300 ? <Kbd>F11</Kbd> : null}
                </button>

                {[
                    ['Subtotal', m.sub],
                    ['Discount', -m.docDisc],
                    [`Tax ${taxLabel}${tab.taxMode === 'inclusive' ? ' (included)' : ''}`, m.tax],
                    m.charges ? ['Charges', m.charges] : null,
                    m.round ? ['Round off', m.round] : null,
                ].filter(Boolean).map(([k, v]) => (
                    <div className="nqp-tot" key={k}>
                        <span className="k">{k}</span>
                        <Money value={v} font={15} avail={avail} className="v" />
                    </div>
                ))}

                <div className="nqp-field">
                    <label htmlFor={`nqp-tendered-${full ? 'sheet' : 'col'}`}>Amount tendered</label>
                    <input
                        id={`nqp-tendered-${full ? 'sheet' : 'col'}`}
                        className="num"
                        inputMode="decimal"
                        data-rank="1"
                        value={n0(tab.tendered)}
                        onChange={(e) => patchTab({ tendered: Number(e.target.value.replace(/[^\d.]/g, '')) || 0, tenderTouched: true })}
                    />
                </div>
                {full ? (
                    /* The keypad belongs in the full sheet. In a resident column
                       the tendered field plus the pinned actions are enough, and a
                       keypad only pushes what matters into the scroll. */
                    <div className="nqp-keypad">
                        {/* No decimal key. The tendered amount is held as a number
                            and a "·" that could never produce one was a key that
                            advertised behaviour it did not have — defect nine, in
                            miniature. "Exact" earns the slot instead. */}
                        {['1', '2', '3', '⌫', '4', '5', '6', 'C', '7', '8', '9', '00', '+500', '+1000', '0', 'Exact'].map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => {
                                    const cur = String(Math.round(tab.tendered) || '');
                                    let next = cur;
                                    if (k === '⌫') next = cur.slice(0, -1);
                                    else if (k === 'C') next = '';
                                    else if (k === 'Exact') next = String(Math.max(0, Math.round(m.total)));
                                    else if (k === '+500') next = String((Number(cur) || 0) + 500);
                                    else if (k === '+1000') next = String((Number(cur) || 0) + 1000);
                                    else next = cur + k;
                                    patchTab({ tendered: Number(next) || 0, tenderTouched: true });
                                }}
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                ) : null}

                {/* RANK 2, so it sits BELOW rank 1 rather than above it. The
                    reference put this row directly under the customer, which
                    pushed the total — a rank-1 control that must always be
                    visible — off the bottom of a 286px payment column. A chip
                    rather than a button because a chip shows its current value,
                    which is the thing a cashier checks at a glance. */}
                <div className="nqp-fields">
                    <button type="button" className="nqp-fchip" data-rank="2" onClick={() => setSheet('method')}>
                        <span className="nqp-fk">Method</span>
                        <span className="nqp-fv">{tab.splits.length ? 'Split' : tab.method}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" data-set={tab.discount.value ? 'true' : undefined} onClick={() => setSheet('discount')}>
                        <span className="nqp-fk">Discount F9</span>
                        <span className="nqp-fv">{tab.discount.value ? (tab.discount.mode === 'pct' ? `${tab.discount.value}%` : n0(tab.discount.value)) : '—'}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" onClick={() => setSheet('tax')}>
                        <span className="nqp-fk">Tax F7</span>
                        <span className="nqp-fv">{taxLabel}{tab.taxMode === 'inclusive' ? ' inc' : ''}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" onClick={() => setSheet('location')}>
                        <span className="nqp-fk">Location</span>
                        <span className="nqp-fv">{(WAREHOUSES.find((x) => x.id === tab.warehouse)?.name || '').split(' — ')[0]}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" data-set={tab.charges.length ? 'true' : undefined} onClick={() => setSheet('charges')}>
                        <span className="nqp-fk">Charges F8</span>
                        <span className="nqp-fv">{m.charges ? n0(m.charges) : '—'}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" data-set={tab.notes ? 'true' : undefined} onClick={() => setSheet('notes')}>
                        <span className="nqp-fk">Remarks F12</span>
                        <span className="nqp-fv">{tab.notes ? 'set' : '—'}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" onClick={() => setSheet('fulfilment')}>
                        <span className="nqp-fk">Fulfilment</span>
                        <span className="nqp-fv">{tab.fulfilment === 'local' ? 'Local stock' : 'Dropship'}</span>
                    </button>
                    {tab.method !== 'Cash' || tab.splits.length ? (
                        <button type="button" className="nqp-fchip" data-rank="2" onClick={() => setSheet('bank')}>
                            <span className="nqp-fk">Deposit to</span>
                            <span className="nqp-fv">{(banks.find((b) => b.id === tab.bank)?.name || '').split(' — ')[0]}</span>
                        </button>
                    ) : null}
                </div>

            </>
        );
    };

    /* ── THE PINNED FOOTER ───────────────────────────────────────────────────
       Rank 1 is "always visible on the working surface", and the three numbers
       that qualify — the total, the change and the button that commits them —
       are here rather than in the scrolling body.

       The reference kept the total in the body. That reads fine in a 526px
       payment column on a 1080p screen and fails completely in a 286px one on a
       695px screen, where the body is 160px tall and the total sits below the
       fold behind two rank-2 rows. A pinned footer cannot be scrolled away, so
       the total cannot be, and the body is then free to hold whatever it holds.

       This is the same fix as the Scan bug, applied one level up: it is not
       enough to pin the ACTIONS if the number they act on can still escape. */
    const renderTenderFooter = (w, fit, full) => {
        const stacked = w < 360;
        const rowW = w - 48;
        const amountAvail = (stacked ? rowW : rowW * 0.5) - 100;
        const showAmount = amountAvail >= 80;
        const totalFont = full || fit === 'full' ? 32 : fit === 'compact' ? 26 : 22;
        return (
            <div className="nqp-pf">
                <div className="nqp-tot nqp-grand">
                    <span className="k">{tab.isReturn ? 'Refund' : 'Total'}</span>
                    <button type="button" data-rank="2" title="Tap for the breakdown (Ctrl+F)" onClick={() => setSheet('breakup')} style={{ minWidth: 0 }}>
                        <Money value={m.total} font={totalFont} avail={Math.max(90, w - 40 - 74)} ccy="PKR" className="v" />
                    </button>
                </div>
                <div className="nqp-tot" style={{ paddingTop: 4, paddingBottom: 4 }}>
                    <span className="k">Change</span>
                    <Money
                        value={change}
                        font={15}
                        avail={Math.max(80, w - 150)}
                        className="v"
                        style={{ color: change >= 0 ? 'var(--vq-success)' : 'var(--vq-danger)' }}
                    />
                </div>
                <div className="nqp-actions">
                    <button
                        type="button"
                        className="nqp-cta"
                        data-rank="1"
                        style={{ flex: stacked ? '1 0 100%' : 2 }}
                        onClick={() => complete()}
                    >
                        <span>{tab.isReturn ? 'Refund' : 'Complete'}</span>
                        {showAmount ? <Money value={m.total} font={15} avail={amountAvail} /> : null}
                    </button>
                    <button type="button" className="nqp-cta" data-ghost="true" data-rank="1" onClick={holdSale}>Hold</button>
                    <button type="button" className="nqp-cta" data-ghost="true" data-rank="2" disabled={!prefs.perms['pos.open_drawer']} onClick={openDrawer}>Drawer</button>
                </div>
            </div>
        );
    };

    /* ── floor plan ──────────────────────────────────────────────────────── */
    const renderFloorBody = (per) => (
        <div style={{ display: 'grid', gap: 10, padding: 12, gridTemplateColumns: `repeat(${Math.max(1, per)}, minmax(0,1fr))` }}>
            {TABLES.map((t) => {
                const busy = t.status !== 'free';
                return (
                    <button
                        key={t.id}
                        type="button"
                        className="nqp-tile"
                        data-rank="1"
                        style={{
                            height: per > 1 ? 96 : 58,
                            borderColor: busy ? 'var(--vq-accent)' : undefined,
                            background: busy ? 'var(--vq-accent-quiet)' : undefined,
                        }}
                        onClick={() => {
                            setTable(t);
                            setSheet(null);
                            toast(`${t.id} — ${t.zone}. ${busy ? `Order open, ${n0(t.bill)} so far.` : 'Seated. Take the order.'}`);
                        }}
                    >
                        <span style={{ fontFamily: 'var(--vq-font-numeric)', fontSize: 18, fontWeight: 700 }}>{t.id}</span>
                        <span className="nqp-line-sub">
                            {t.status === 'free' ? `${t.seats} seats`
                                : t.status === 'reserved' ? `reserved ${t.since}`
                                    : `${t.guests} guests · ${t.since}`}
                        </span>
                        {busy && t.bill ? <span className="nqp-tile-pr">{n0(t.bill)}</span> : null}
                    </button>
                );
            })}
        </div>
    );

    /* ════════════════════════════════════════════════════════════════════════
       LAYOUT — assembled purely from what the engine returned
       ════════════════════════════════════════════════════════════════════════ */
    const cat = T.catalog;
    const cols = [];
    if (cat && cat.mode === 'left') cols.push(['catalog', cat.px]);
    if (T.floor && T.floor.mode === 'left') cols.push(['floor', T.floor.px]);
    cols.push(['cart', T.cart.px]);
    if (T.tender.mode === 'column') cols.push(['tender', T.tender.px]);
    if (cat && cat.mode === 'right') cols.push(['catalog', cat.px]);

    const qtyTotal = tab.lines.reduce((a, l) => a + l.qty, 0);
    const railW = Math.round(T.railW || 0);
    const selLine = sel >= 0 ? tab.lines[sel] : null;

    /* ── DOCK ARITHMETIC ────────────────────────────────────────────────────
       formatToFit is only as honest as the width it is handed. Passing it a
       guess like `vw * 0.4` is how a total ends up reading "PKR 26," — the
       ladder thought it had 156px and the flex row gave it 97. So the shares
       are computed from the same weights the CSS uses.

       On a narrow dock the separate total box is dropped and the amount is
       printed INSIDE the Pay button instead. That is Odoo's trick and a good
       one: the total is still on screen, and it is on the thing you press. */
    const dockCarriesActions = T.dock.length > 0 && T.tender.mode !== 'column' && vp.w >= 620;
    const dockExtras = T.dock.filter((d) => d.id !== 'tender').length + (dockCarriesActions ? 2 : 0);
    const tenderInline = T.dock.some((d) => d.id === 'tender' && d.inline);
    const dockTight = vp.w < 560 && T.dock.length > 1;
    const showDockTotal = tenderInline && !dockTight;
    const dockSlots = (showDockTotal ? 1 : 0) + (T.dock.length ? 1 : 0) + dockExtras;
    const dockPool = Math.max(120, T.avail - 20 - 10 * Math.max(0, dockSlots - 1));
    const dockWeights = (showDockTotal ? 1.6 : 0) + 2.2 + dockExtras;
    const dockTotalAvail = Math.max(60, (dockPool * 1.6) / dockWeights - 14);
    const dockPayAvail = Math.max(60, (dockPool * 2.2) / dockWeights - 96);

    const renderPane = (key, px) => {
        if (key === 'catalog') {
            return (
                <Pane key="catalog" title="Catalogue" width={px} extra={<span className="mono">{visibleProducts.length} items</span>}>
                    {px > 300 ? renderCatalogFilters() : null}
                    {renderCatalogBody(cat.tiles)}
                </Pane>
            );
        }
        if (key === 'floor') {
            return (
                <Pane
                    key="floor"
                    title="Floor"
                    width={px}
                    extra={<span className="mono">{TABLES.filter((t) => t.status !== 'free').length} of {TABLES.length} seated</span>}
                >
                    {renderFloorBody(T.floor.fit === 'map' ? 2 : 1)}
                </Pane>
            );
        }
        if (key === 'tender') {
            return (
                <Pane
                    key="tender"
                    title={tab.isReturn ? 'Refund' : 'Payment'}
                    width={px}
                    footer={renderTenderFooter(px, T.tender.fit, false)}
                >
                    {renderTenderBody(T.tender.fit, px, false)}
                </Pane>
            );
        }
        return (
            <Pane
                key="cart"
                title={tab.isReturn ? 'Returning' : 'Cart'}
                width={px}
                minWidth={T.cart.underflow ? T.cart.minWidth : undefined}
                extra={(
                    <>
                        <span className="mono">{tab.lines.length} lines · {qtyTotal} qty</span>
                        {tab.lines.length ? (
                            <button type="button" className="nqp-adjbtn" data-rank="2" onClick={cancelSale} style={{ marginLeft: 8 }}>Clear</button>
                        ) : null}
                    </>
                )}
                /* Hold is rank 1 and must stay on the working surface in EVERY
                   composition. When the payment panel is not a resident column
                   its pinned footer is not on screen, so someone else has to
                   carry them.

                   On a wide screen that is the DOCK, because the dock is a row
                   the engine has already measured — putting them there costs no
                   height at all. On a narrow one the dock has no horizontal room
                   to spare, so the cart takes a footer instead and pays ~68px
                   for it, which a tall phone can afford and a 720px laptop
                   cannot. */
                footer={T.tender.mode !== 'column' && !dockCarriesActions ? (
                    <div className="nqp-pf">
                        <div className="nqp-actions">
                            <button type="button" className="nqp-cta" data-ghost="true" data-rank="1" onClick={holdSale}>Hold</button>
                            <button type="button" className="nqp-cta" data-ghost="true" data-rank="2" disabled={!prefs.perms['pos.open_drawer']} onClick={openDrawer}>Drawer</button>
                        </div>
                    </div>
                ) : null}
            >
                {renderCartBody(T.cart.fit)}
            </Pane>
        );
    };

    const commands = [
        { label: 'New sale tab', key: 'Ctrl+T', run: addTab },
        { label: 'Hold this sale', run: holdSale },
        { label: 'Parked sales', run: () => setSheet('parked') },
        { label: 'Recent invoices', run: () => setSheet('recent') },
        { label: 'Start a return', run: () => setSheet('return') },
        { label: 'Open the cash drawer', run: openDrawer },
        { label: 'Reprint the last receipt', run: () => toast('Reprinting INV-10231.', { tone: 'good' }) },
        { label: 'Bill breakdown', key: 'Ctrl+F', run: () => setSheet('breakup') },
        { label: 'Document discount', key: 'F9', run: () => setSheet('discount') },
        { label: 'Additional charges', key: 'F8', run: () => setSheet('charges') },
        { label: 'Sale remarks', key: 'F12', run: () => setSheet('notes') },
        { label: 'New product', run: () => setSheet('quickProduct') },
        { label: 'New customer', key: 'Ctrl+D', run: () => setSheet('party') },
        { label: 'Offline queue', run: () => setSheet('offline') },
        { label: 'Keyboard map', key: '?', run: () => setSheet('keys') },
        { label: 'Register settings', run: () => setSettingsOpen(true) },
        { label: 'Leave the register', run: () => toast('This is where the register hands you back to the dashboard.') },
    ];

    return (
        <>
            <Head title="New POS" />
            <div
                className="nqp"
                data-rankmode={rankMode ? 'true' : undefined}
                data-senior={prefs.ops.senior ? 'true' : 'false'}
                style={{ '--nqp-scale': prefs.ops.uiScale, '--nqp-margin': `${Math.round(marginAt(vp.w))}px` }}
            >
                {/* ── RAIL ─────────────────────────────────────────────────── */}
                {railW > 0 ? (
                    <nav className="nqp-rail" style={{ width: railW }} data-rank="2" aria-label="Sections">
                        {NAV.slice(0, 6).map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                className="nqp-railicon"
                                aria-label={n.label}
                                title={n.label}
                                aria-current={n.id === 'sell' ? 'true' : undefined}
                            >
                                {n.glyph}
                            </button>
                        ))}
                        <span className="nqp-rail-sp" />
                        <button type="button" className="nqp-railicon" aria-label="Register settings" data-rank="3" onClick={() => setSettingsOpen(true)}>⚙</button>
                    </nav>
                ) : null}

                <div className="nqp-main">
                    {/* ── BAR ──────────────────────────────────────────────── */}
                    <header className="nqp-bar">
                        <Icon label="Menu" rank="2" title="The nav — present at every width, on every screen" onClick={() => setNavOpen(true)}>☰</Icon>
                        {/* With the nav hidden there must still be a way back out
                            of the register. Asked for explicitly, and right. */}
                        <Icon label="Leave the register" rank="2" onClick={() => toast('This is where the register hands you back to the dashboard.')}>←</Icon>
                        {vp.w >= 560 ? <span className="nqp-brand">VenQore</span> : null}

                        {/* A plain group, not role="tablist". Each sale is TWO
                            buttons — open it, close it — and a tab whose focusable
                            children are not the tab itself is worse for a screen
                            reader than no tab role at all. */}
                        <div className="nqp-tabs" data-rank="2" role="group" aria-label="Open sales">
                            {tabs.map((t, i) => (
                                <span key={t.id} className="nqp-tab" data-current={i === active ? 'true' : undefined}>
                                    <button
                                        type="button"
                                        className="nqp-tab-lab nqp-tight"
                                        aria-current={i === active ? 'true' : undefined}
                                        onClick={() => { setActive(i); setSel(-1); }}
                                    >
                                        {tabLabel(t)}
                                    </button>
                                    <button type="button" className="nqp-tab-x nqp-tight" aria-label={`Close ${tabLabel(t)}`} onClick={() => closeTab(i)}>✕</button>
                                </span>
                            ))}
                        </div>
                        {/* Outside the scrolling strip on purpose: with six sales
                            open, a New-sale button that scrolls away is a button
                            a phone cannot reach. */}
                        <Icon label="New sale" rank="2" title="New sale (Ctrl+T)" onClick={addTab}>＋</Icon>

                        <span className="nqp-sp" />

                        {vp.w >= 980 ? (
                            <button type="button" className="nqp-status" data-action="true" data-rank="2" disabled={!prefs.perms['pos.refund']} onClick={() => setSheet('return')}>
                                {tab.isReturn ? `Return · ${tab.returnRef?.id || 'open'}` : 'Return'}
                            </button>
                        ) : null}

                        {/* RANK 3 read-outs. A read-out must not look like a
                            toggle — these are chips with no pressed state. */}
                        {vp.w >= 720 ? (
                            <button
                                type="button"
                                className="nqp-status"
                                data-rank="3"
                                data-action="true"
                                title="Simulated — click to go offline and watch a sale queue"
                                onClick={() => setOnline((o) => !o)}
                            >
                                <span className="nqp-dot" data-state={online ? undefined : 'bad'} />
                                {online ? 'Online' : 'Offline'}
                            </button>
                        ) : null}
                        {vp.w >= 1180 ? (
                            <span className="nqp-status" data-rank="3"><span className="nqp-dot" />Printer · drawer</span>
                        ) : null}
                        {queue.length ? (
                            /* Rank 3 read-out. On a phone it keeps the dot and the
                               count and drops the word, because the alternative is
                               a bar so full that the sale tab clips to "Sal". */
                            <button
                                type="button"
                                className="nqp-status"
                                data-action="true"
                                data-rank="3"
                                title={`${queue.length} sales waiting to post`}
                                onClick={() => setSheet('offline')}
                            >
                                <span className="nqp-dot" data-state={queue.some((q) => q.state === 'error') ? 'bad' : 'off'} />
                                {vp.w >= 560 ? `${queue.length} queued` : queue.length}
                            </button>
                        ) : null}

                        <Icon label="Keyboard map" rank="2" onClick={() => setSheet('keys')}>⌨</Icon>
                        <Icon label="Register settings" rank="3" onClick={() => setSettingsOpen(true)}>⚙</Icon>
                    </header>

                    {/* ── TERMINAL ─────────────────────────────────────────── */}
                    <main className="nqp-term">
                        <div className="nqp-search" data-rank="1" style={{ position: 'relative' }}>
                            <span aria-hidden style={{ opacity: 0.45 }}>⌕</span>
                            <input
                                ref={searchRef}
                                data-scan="true"
                                value={search}
                                placeholder={prefs.comp.catalog.mode === 'off' ? 'Scan a barcode, or type a name or SKU' : 'Scan or search…'}
                                aria-label="Scan or search"
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={onSearchKey}
                            />
                            {search ? <button type="button" className="nqp-iconbtn" aria-label="Clear" onClick={() => setSearch('')}>✕</button> : null}
                            {vp.w >= 560 ? <Kbd>F1</Kbd> : null}
                            {search.trim() && !exact && matches.length ? (
                                <div className="nqp-typeahead">
                                    {matches.slice(0, 8).map((p) => (
                                        <button key={p.id} type="button" className="nqp-catrow" onClick={() => { addProduct(p); setSearch(''); }}>
                                            <span className="nqp-sw" style={{ background: HUE_VAR[p.hue] }} />
                                            <span style={{ flex: 1, minWidth: 0 }}>
                                                <span className="nqp-line-name" style={{ display: 'block' }}>{p.name}</span>
                                                <span className="nqp-line-sub">{p.sku} · {p.stock} in stock</span>
                                            </span>
                                            <span className="num" style={{ fontSize: 13 }}>{n0(p.price)}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {cat && cat.mode === 'top' ? (
                            <div className="nqp-band" style={{ gridTemplateColumns: `repeat(${cat.tiles}, minmax(0,1fr))`, height: cat.h }}>
                                {visibleProducts.slice(0, cat.tiles * cat.rows).map(renderTile)}
                            </div>
                        ) : null}

                        <div className="nqp-panes">
                            {cols.map(([key, px], i) => (
                                <React.Fragment key={key}>
                                    {renderPane(key, px)}
                                    {/* No divider beside the floor: the law fixes a
                                        floor column at 20% and there is no fraction
                                        to drag. Rendering one wrote the CART
                                        fraction twice, in opposite directions, and
                                        the cart shrank while the floor sat still. */}
                                    {i < cols.length - 1 && key !== 'floor' && cols[i + 1][0] !== 'floor' ? (
                                        <Splitter
                                            leftKey={key}
                                            rightKey={cols[i + 1][0]}
                                            pool={T.avail}
                                            get={getFrac}
                                            set={setFrac}
                                            label={`Resize ${key} and ${cols[i + 1][0]}`}
                                        />
                                    ) : (i < cols.length - 1 ? <div className="nqp-split" aria-hidden="true" style={{ cursor: 'default' }} /> : null)}
                                </React.Fragment>
                            ))}
                        </div>

                        {cat && cat.mode === 'bottom' ? (
                            <div className="nqp-band" style={{ gridTemplateColumns: `repeat(${cat.tiles}, minmax(0,1fr))`, height: cat.h }}>
                                {visibleProducts.slice(0, cat.tiles * cat.rows).map(renderTile)}
                            </div>
                        ) : null}

                        {/* ── THE DOCK ─────────────────────────────────────────
                            A real layout row. Its height was subtracted from the
                            usable height before anything else was measured, so it
                            cannot overlap a pane by construction — which is
                            exactly how the old floating Browse-catalog button
                            managed to cover the payment panel. */}
                        {T.dock.length ? (
                            <div className="nqp-dock" style={{ height: T.dockH }}>
                                {T.dock.map((item) => (item.id === 'tender' ? (
                                    <React.Fragment key="tender">
                                        {showDockTotal ? (
                                            <div className="nqp-docktotal" style={{ flex: 1.6 }}>
                                                <div className="k">Total</div>
                                                <Money value={m.total} font={22} avail={dockTotalAvail} className="v" />
                                            </div>
                                        ) : null}
                                        <button type="button" className="nqp-cta nqp-dockpay" data-rank="1" onClick={() => setSheet('tender')}>
                                            <span className="lab">{item.label}</span>
                                            {!showDockTotal ? (
                                                <Money value={m.total} font={19} avail={dockPayAvail} ccy="PKR" className="amt" />
                                            ) : null}
                                        </button>
                                    </React.Fragment>
                                ) : (
                                    <button key={item.id} type="button" className="nqp-cta" data-ghost="true" data-rank="2" style={{ flex: 1 }} onClick={() => setSheet(item.id)}>
                                        <span>{item.label}</span>
                                        {item.id === 'catalog' ? <span className="mono">{visibleProducts.length}</span> : null}
                                    </button>
                                )))}
                                {dockCarriesActions ? (
                                    <>
                                        <button type="button" className="nqp-cta" data-ghost="true" data-rank="1" style={{ flex: 1 }} onClick={holdSale}>Hold</button>
                                        <button type="button" className="nqp-cta" data-ghost="true" data-rank="2" style={{ flex: 1 }} disabled={!prefs.perms['pos.open_drawer']} onClick={openDrawer}>Drawer</button>
                                    </>
                                ) : null}
                            </div>
                        ) : null}
                    </main>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    OVERLAYS
                    ════════════════════════════════════════════════════════════ */}
                <div
                    className="nqp-scrim"
                    data-open={anyOverlay ? 'true' : 'false'}
                    aria-hidden="true"
                    onClick={() => { setSheet(null); setNavOpen(false); setSettingsOpen(false); setPaletteOpen(false); setConfirm(null); }}
                />

                {/* The one blocking question the register asks. It is a sheet like
                    any other, so it cannot be dismissed by accident and cannot be
                    covered by anything. */}
                <Sheet
                    open={!!confirm}
                    onClose={() => setConfirm(null)}
                    title={confirm ? confirm.title : ''}
                    size={narrow ? 'bottom' : 'side'}
                    footer={(
                        <div className="nqp-actions">
                            <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setConfirm(null)}>Cancel</button>
                            <button
                                type="button"
                                className="nqp-cta"
                                data-sheet-focus
                                onClick={() => { const c = confirm; setConfirm(null); if (c) c.onYes(); }}
                            >
                                {confirm ? confirm.cta : 'Continue'}
                            </button>
                        </div>
                    )}
                >
                    <div style={{ padding: 20, fontSize: 14, lineHeight: 1.55 }}>{confirm ? confirm.body : ''}</div>
                </Sheet>

                {/* Catalogue, full screen — the same rows and the same tiles as
                    the resident column, with a live in-cart count on every one. */}
                <Sheet
                    open={sheet === 'catalog'}
                    onClose={() => setSheet(null)}
                    title="Catalogue"
                    size="full"
                    subtitle={`${qtyTotal} in cart`}
                    footer={(
                        <div className="nqp-actions">
                            <div className="nqp-docktotal">
                                <div className="k">Total</div>
                                <Money value={m.total} font={20} avail={Math.max(90, vp.w * 0.35)} ccy="PKR" className="v" />
                            </div>
                            <button type="button" className="nqp-cta" style={{ flex: 2 }} onClick={() => setSheet(null)}>Done</button>
                        </div>
                    )}
                >
                    <div className="nqp-field" style={{ paddingTop: 12 }}>
                        <input placeholder="Search the catalogue…" value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} />
                    </div>
                    {renderCatalogFilters()}
                    {renderCatalogBody(Math.max(2, Math.floor((vp.w - 32 + 12) / (LAW.controlMetrics.tile_min + 12))))}
                </Sheet>

                {/* Payment, full — the SAME controls as the column, plus a keypad. */}
                <Sheet
                    open={sheet === 'tender'}
                    onClose={() => setSheet(null)}
                    title={tab.isReturn ? 'Refund' : 'Take payment'}
                    size={narrow ? 'bottom' : 'wide'}
                    footer={renderTenderFooter(narrow ? vp.w : Math.min(580, vp.w * 0.96), 'full', true)}
                >
                    {renderTenderBody('full', narrow ? vp.w : Math.min(580, vp.w * 0.96), true)}
                </Sheet>

                <Sheet open={sheet === 'floor'} onClose={() => setSheet(null)} title="Floor" size="full" subtitle={table ? `at ${table.id}` : undefined}>
                    {renderFloorBody(Math.max(2, Math.floor(vp.w / 200)))}
                </Sheet>

                <LineSheet
                    open={sheet === 'line'}
                    onClose={() => setSheet(null)}
                    line={selLine}
                    narrow={narrow}
                    perms={prefs.perms}
                    showMargin={prefs.ops.showMargin}
                    onChange={(patch) => selLine && patchLine(selLine.u, patch)}
                    onRemove={() => selLine && removeLine(selLine)}
                />

                <PartySheet
                    open={sheet === 'party'}
                    onClose={() => setSheet(null)}
                    current={tab.party}
                    narrow={narrow}
                    onPick={(p) => {
                        // Selecting a party with a default discount applies it AND
                        // says so — a discount that appears silently is a discount
                        // nobody can explain to the customer.
                        if (p.discount) {
                            patchTab({ party: p, discount: { mode: 'pct', value: p.discount } });
                            toast(`${p.name} has a ${p.discount}% default discount — applied.`, { tone: 'good' });
                        } else {
                            patchTab({ party: p });
                        }
                    }}
                />

                <VariantSheet
                    open={sheet === 'variant'}
                    onClose={() => { setSheet(null); setVariantFor(null); }}
                    product={variantFor}
                    narrow={narrow}
                    onPick={(v) => { if (variantFor) addProduct(variantFor, 1, v); }}
                />

                <ParkedSheet
                    open={sheet === 'parked'}
                    onClose={() => setSheet(null)}
                    narrow={narrow}
                    onRecall={(h) => { addTab(); toast(`${h.id} recalled into a new tab.`, { tone: 'good' }); }}
                />

                <RecentSheet
                    open={sheet === 'recent'}
                    onClose={() => setSheet(null)}
                    narrow={narrow}
                    perms={prefs.perms}
                    onReprint={(r) => toast(`Reprinting ${r.id}.`, { tone: 'good' })}
                    onReturn={(r) => { patchTab({ isReturn: true, returnRef: r }); toast(`Return started against ${r.id}.`); }}
                />

                <ReturnSheet
                    open={sheet === 'return'}
                    onClose={() => setSheet(null)}
                    narrow={narrow}
                    policy={prefs.ops.returnPolicy}
                    windowDays={prefs.ops.returnWindowDays}
                    party={tab.party}
                    perms={prefs.perms}
                    onLoad={(r) => {
                        patchTab({ isReturn: true, returnRef: r });
                        toast(r ? `Return started against ${r.id}.` : 'Open return started.');
                    }}
                />

                <QuickProductSheet
                    open={sheet === 'quickProduct'}
                    onClose={() => setSheet(null)}
                    narrow={narrow}
                    onCreate={(f) => {
                        const p = {
                            id: Date.now(),
                            name: f.name,
                            sku: f.sku || `NEW-${Date.now() % 1000}`,
                            barcode: f.sku,
                            cat: f.cat,
                            stock: Number(f.stock) || 0,
                            price: Number(f.price) || 0,
                            cost: Math.round((Number(f.price) || 0) * 0.8),
                            unit: 'pc',
                            hue: HUES[Math.floor(Math.random() * HUES.length)],
                            kind: 'simple',
                            tax: 18,
                        };
                        setProducts((ps) => [p, ...ps]);
                        const added = addProduct(p);
                        toast(added ? `${p.name} created and added.` : `${p.name} created.`, { tone: 'good' });
                    }}
                />

                <QuickBankSheet
                    open={sheet === 'quickBank'}
                    onClose={() => setSheet(null)}
                    narrow={narrow}
                    onCreate={(f) => {
                        const b = { id: Date.now(), name: f.name, code: f.code };
                        setBanks((bs) => [...bs, b]);
                        patchTab({ bank: b.id });
                        toast(`${b.name} created.`, { tone: 'good' });
                    }}
                />

                <OfflineSheet
                    open={sheet === 'offline'}
                    onClose={() => setSheet(null)}
                    narrow={narrow}
                    queue={queue}
                    online={online}
                    onRetry={(q) => {
                        if (!online) { toast('Still offline.', { tone: 'bad' }); return; }
                        setQueue((qs) => qs.filter((x) => (q ? x.id !== q.id : x.state === 'error')));
                        toast(q ? `${q.id} posted.` : 'Everything that could post has posted.', { tone: 'good' });
                    }}
                    onRecall={(q) => { addTab(); setSheet(null); toast(`${q.id} recalled into a new tab — fix it and complete it.`); }}
                    onDelete={(q) => { setQueue((qs) => qs.filter((x) => x.id !== q.id)); toast(`${q.id} discarded.`); }}
                />

                <KeysSheet open={sheet === 'keys'} onClose={() => setSheet(null)} narrow={narrow} />
                <BreakupSheet open={sheet === 'breakup'} onClose={() => setSheet(null)} m={m} tab={tab} narrow={narrow} />

                <DiscountSheet
                    open={sheet === 'discount'}
                    onClose={() => setSheet(null)}
                    tab={tab}
                    setTab={patchTab}
                    narrow={narrow}
                    perms={prefs.perms}
                    presetsList={prefs.ops.discountPresets.length ? prefs.ops.discountPresets : DISCOUNT_PRESETS}
                    onEditPreset={(v) => toast(`Preset ${v}% — edit the set in Settings → Operate → Discount presets.`)}
                />

                <ChargesSheet open={sheet === 'charges'} onClose={() => setSheet(null)} tab={tab} setTab={patchTab} narrow={narrow} />
                <NotesSheet open={sheet === 'notes'} onClose={() => setSheet(null)} tab={tab} setTab={patchTab} narrow={narrow} />

                <SplitSheet
                    open={sheet === 'split'}
                    onClose={() => setSheet(null)}
                    tab={tab}
                    setTab={patchTab}
                    total={m.total}
                    banks={banks}
                    narrow={narrow}
                    onNewBank={() => setSheet('quickBank')}
                />

                <OverpaySheet
                    open={sheet === 'overpay'}
                    onClose={() => setSheet(null)}
                    amount={change}
                    party={tab.party}
                    narrow={narrow}
                    onChoose={(how) => {
                        patchTab({ overpay: how });
                        toast(
                            how === 'change'
                                ? `Change ${n0(change)} — drawer opening.`
                                : `${n0(change)} held on ${tab.party.name}'s account.`,
                            { tone: 'good' },
                        );
                        setTimeout(() => complete({ skipOverpay: true, overpay: how }), 30);
                    }}
                />

                {/* Small single-choice sheets. Each is a field, revealed by its own
                    chip, and each writes exactly one value. */}
                <Sheet open={sheet === 'method'} onClose={() => setSheet(null)} title="Payment method" size={narrow ? 'bottom' : 'side'}>
                    {PAY_METHODS.map((x) => (
                        <button key={x} type="button" className="nqp-row" onClick={() => { patchTab({ method: x, splits: [] }); setSheet(null); }}>
                            <span className="nqp-rowmain"><span className="nqp-rowtitle">{x}</span></span>
                            {tab.method === x && !tab.splits.length ? <Flag>Current</Flag> : null}
                        </button>
                    ))}
                    <button type="button" className="nqp-row" onClick={() => setSheet('split')}>
                        <span className="nqp-rowmain">
                            <span className="nqp-rowtitle">Split across methods</span>
                            <span className="nqp-line-sub">Cash, card, bank, UPI and credit, in any combination.</span>
                        </span>
                        {tab.splits.length ? <Flag>Current</Flag> : null}
                    </button>
                </Sheet>

                <Sheet open={sheet === 'tax'} onClose={() => setSheet(null)} title="Document tax" size={narrow ? 'bottom' : 'side'}>
                    {TAX_RATES.map((t) => (
                        <button key={t.id} type="button" className="nqp-row" onClick={() => { patchTab({ taxRate: t.rate }); setSheet(null); }}>
                            <span className="nqp-rowmain"><span className="nqp-rowtitle">{t.label}</span></span>
                            {tab.taxRate === t.rate ? <Flag>Current</Flag> : null}
                        </button>
                    ))}
                    <div style={{ padding: 16 }}>
                        <div className="nqp-seg">
                            <button type="button" aria-pressed={tab.taxMode === 'exclusive'} onClick={() => patchTab({ taxMode: 'exclusive' })}>Tax on top</button>
                            <button type="button" aria-pressed={tab.taxMode === 'inclusive'} onClick={() => patchTab({ taxMode: 'inclusive' })}>Tax included</button>
                        </div>
                    </div>
                </Sheet>

                <Sheet open={sheet === 'location'} onClose={() => setSheet(null)} title="Location" size={narrow ? 'bottom' : 'side'}>
                    <div className="nqp-note" style={{ margin: '12px 16px' }}>
                        Warehouses were passed to the shipped screen and had no control anywhere, so a
                        multi-branch store could not choose which stock a sale came out of.
                    </div>
                    {WAREHOUSES.map((w) => (
                        <button key={w.id} type="button" className="nqp-row" onClick={() => { patchTab({ warehouse: w.id }); setSheet(null); }}>
                            <span className="nqp-rowmain">
                                <span className="nqp-rowtitle">{w.name}</span>
                                {w.is_default ? <span className="nqp-line-sub">Default</span> : null}
                            </span>
                            {tab.warehouse === w.id ? <Flag>Current</Flag> : null}
                        </button>
                    ))}
                </Sheet>

                <Sheet
                    open={sheet === 'bank'}
                    onClose={() => setSheet(null)}
                    title="Deposit to"
                    size={narrow ? 'bottom' : 'side'}
                    footer={(
                        <div className="nqp-actions">
                            <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setSheet('quickBank')}>New bank account</button>
                        </div>
                    )}
                >
                    {banks.map((b) => (
                        <button key={b.id} type="button" className="nqp-row" onClick={() => { patchTab({ bank: b.id }); setSheet(null); }}>
                            <span className="nqp-rowmain"><span className="nqp-rowtitle">{b.name}</span><span className="nqp-line-sub">{b.code}</span></span>
                            {tab.bank === b.id ? <Flag>Current</Flag> : null}
                        </button>
                    ))}
                </Sheet>

                <Sheet open={sheet === 'fulfilment'} onClose={() => setSheet(null)} title="Fulfilment" size={narrow ? 'bottom' : 'side'}>
                    {[
                        ['local', 'Local stock', 'Deducted from this location now.'],
                        ['dropship', 'Dropship', 'The supplier ships it; no stock moves here.'],
                    ].map(([id, t, s]) => (
                        <button key={id} type="button" className="nqp-row" onClick={() => { patchTab({ fulfilment: id }); setSheet(null); }}>
                            <span className="nqp-rowmain"><span className="nqp-rowtitle">{t}</span><span className="nqp-line-sub">{s}</span></span>
                            {tab.fulfilment === id ? <Flag>Current</Flag> : null}
                        </button>
                    ))}
                </Sheet>

                <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} items={NAV} current="sell" width={Math.min(264, vp.w - 56)} />

                <SettingsDrawer
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    prefs={prefs}
                    T={T}
                    vp={vp}
                    tab={settingsTab}
                    setTab={setSettingsTab}
                    rankMode={rankMode}
                    setRankMode={setRankMode}
                    setComp={(comp) => setPrefs((p) => ({ ...p, comp }))}
                    setPreset={(id) => setPrefs((p) => ({ ...p, preset: id, comp: presetComposition(id) }))}
                    setProfile={(id) => setPrefs((p) => ({ ...p, profile: id }))}
                    setAuto={(v) => setPrefs((p) => ({ ...p, auto: v }))}
                    setOps={(patch) => setPrefs((p) => ({ ...p, ops: { ...p.ops, ...patch } }))}
                    setPerm={(k, v) => setPrefs((p) => ({ ...p, perms: { ...p.perms, [k]: v } }))}
                    setRail={(v) => setPrefs((p) => ({ ...p, rail: v }))}
                    onReset={() => {
                        setPrefs({
                            ...DEFAULTS,
                            comp: presetComposition('column'),
                            ops: { ...DEFAULTS.ops },
                            perms: { ...DEFAULTS.perms },
                        });
                        toast('Register settings reset.');
                    }}
                />

                <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

                <Toasts items={toasts} onAction={onToastAction} onDismiss={(t) => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
            </div>
        </>
    );
}
