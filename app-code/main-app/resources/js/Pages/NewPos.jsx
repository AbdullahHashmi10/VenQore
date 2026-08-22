/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  New POS — the composed register (Live Database & Ledger Connected)       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Route: /new-pos   ·   Controller: NewPosController@index
 *
 * Fully wired to real products, live stock levels, FIFO batch costings,
 * customer accounts with credit limit validation, double-entry accounting
 * ledgers, thermal ESC-POS receipt printing, held bills, returns, and offline sync.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';

import '@/NewPos/newpos.css';
import { LAW, composeTerminal, marginAt, presetComposition } from '@/LayoutLaw/engine';
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
    QuickProductSheet, RecentSheet, ReturnSheet, SplitSheet, VariantSheet, ReceiptSheet,
    PAY_METHODS, lineDiscount,
} from '@/NewPos/sheets';
import SettingsDrawer from '@/NewPos/SettingsDrawer';
import PrintService from '@/Utils/PrintService';

export const HUES = ['teal', 'sky', 'lime', 'coral', 'butter', 'plum'];

export const NAV = [
    { id: 'sell', label: 'Sell', glyph: '🛍', url: '/pos' },
    { id: 'inv', label: 'Inventory', glyph: '📦', url: '/inventory' },
    { id: 'sales', label: 'Sales', glyph: '🧾', url: '/sales' },
    { id: 'parties', label: 'Parties', glyph: '👥', url: '/parties' },
    { id: 'reports', label: 'Reports', glyph: '📊', url: '/reports' },
    { id: 'accounting', label: 'Ledger', glyph: '🏛', url: '/accounts' },
];

export const TABLES = [
    { id: 'T1', zone: 'Hall', seats: 2, status: 'free' },
    { id: 'T2', zone: 'Hall', seats: 2, status: 'seated', guests: 2, since: '18 min', bill: 1840 },
    { id: 'T3', zone: 'Hall', seats: 4, status: 'free' },
    { id: 'T4', zone: 'Hall', seats: 4, status: 'seated', guests: 4, since: '42 min', bill: 6120 },
    { id: 'T5', zone: 'Hall', seats: 4, status: 'billed', guests: 3, since: '1 h 04', bill: 4390 },
    { id: 'T6', zone: 'Hall', seats: 6, status: 'free' },
    { id: 'T7', zone: 'Terrace', seats: 6, status: 'seated', guests: 6, since: '9 min', bill: 980 },
    { id: 'T8', zone: 'Terrace', seats: 2, status: 'free' },
];

let uidSeq = 1;
const uid = () => `u${uidSeq += 1}`;
const idemKey = () => `POS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function newLine(product, qty = 1, variant = null) {
    const base = Number(variant ? variant.price : product.price);
    const cost = Number(variant ? (variant.cost_price ?? product.cost_price ?? 0) : (product.cost_price ?? 0));
    const stock = Number(variant ? (variant.stock ?? variant.stock_quantity ?? product.stock_quantity ?? product.stock ?? 999) : (product.stock_quantity ?? product.stock ?? 999));
    return {
        u: uid(),
        id: product.id,
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        name: variant ? `${product.name} (${variant.name})` : product.name,
        sku: variant?.sku || product.sku || '',
        qty,
        price: base,
        basePrice: base,
        cost,
        stock,
        tax: Number(product.tax_rate ?? product.tax ?? 0),
        unit: product.base_unit || product.unit || 'pc',
        batch: product.batch || null,
        freeQty: 0,
        discount: { mode: 'pct', value: 0 },
        note: '',
        overridden: false,
        image_url: product.image_url || null,
        hue: HUES[(product.id || 0) % HUES.length],
    };
}

function newTab(seq = 1, ops = {}, defaultParty = null, defaultWarehouse = 1, defaultTaxRate = 0, defaultTaxMode = 'exclusive') {
    return {
        id: uid(),
        seq,
        party: defaultParty || { id: 0, name: 'Walk-in customer', phone: '', balance: 0, discount: 0, walkin: true },
        lines: [],
        discount: { mode: 'pct', value: 0 },
        taxRate: defaultTaxRate,
        taxMode: defaultTaxMode,
        charges: [],
        notes: '',
        warehouse: defaultWarehouse,
        fulfilment: 'local',
        method: 'Cash',
        tendered: 0,
        tenderTouched: false,
        splits: [],
        bank: null,
        overpay: 'change',
        isReturn: false,
        returnRef: null,
        idem: idemKey(),
        docNo: `POS-${seq}`,
    };
}

export default function NewPos({
    recalledSale = null,
    bankAccounts = [],
    warehouses = [],
    ecommerceChannels = [],
    settings = {},
    defaultCustomer = null,
    store = null,
    auth = {},
}) {
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '') || '';
    const userId = auth?.user?.id ? `u_${auth.user.id}` : 'default';

    /* ── Theme state with localStorage sync ───────────────────────────────── */
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('vq-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
        return 'light';
    });

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            localStorage.setItem('vq-theme', theme);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    /* ── Parsed Settings & Defaults ───────────────────────────────────────── */
    const parsedTaxRates = useMemo(() => {
        let list = [];
        try {
            if (settings?.tax_rates) {
                const parsed = typeof settings.tax_rates === 'string' ? JSON.parse(settings.tax_rates) : settings.tax_rates;
                if (Array.isArray(parsed)) list = parsed.map((t, idx) => ({ id: idx + 1, label: `${t.name || 'Tax'} (${t.rate}%)`, rate: Number(t.rate) }));
            }
        } catch (_) {}
        if (!list.length) {
            list = [
                { id: 0, label: 'No tax', rate: 0 },
                { id: 1, label: 'GST 18%', rate: 18 },
                { id: 2, label: 'GST 5%', rate: 5 },
                { id: 3, label: 'Services 15%', rate: 15 },
            ];
        }
        if (!list.some((t) => t.rate === 0)) list.unshift({ id: 0, label: 'No tax', rate: 0 });
        return list;
    }, [settings?.tax_rates]);

    const defaultTaxRate = Number(settings?.default_tax_rate ?? 0);
    const defaultTaxMode = settings?.tax_type === 'inclusive' ? 'inclusive' : 'exclusive';

    const walkInCustomer = useMemo(() => {
        if (defaultCustomer) {
            return {
                id: defaultCustomer.id,
                name: defaultCustomer.name,
                phone: defaultCustomer.phone || '',
                balance: Number(defaultCustomer.current_balance || defaultCustomer.balance || 0),
                discount: Number(defaultCustomer.default_discount || 0),
                credit: Number(defaultCustomer.credit_limit || 0),
                walkin: true,
            };
        }
        return { id: 0, name: 'Walk-in customer', phone: '', balance: 0, discount: 0, walkin: true };
    }, [defaultCustomer]);

    const defaultWarehouseId = warehouses[0]?.id || 1;

    /* ── Live Products & Categories ───────────────────────────────────────── */
    const [categories, setCategories] = useState([{ id: 'all', name: 'All items' }]);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [catFilter, setCatFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [catalogSearch, setCatalogSearch] = useState('');
    const searchTimeout = useRef(null);

    // Fetch live categories
    useEffect(() => {
        const url = storeSlug ? route('store.pos.categories', { store_slug: storeSlug }) : '/pos/categories';
        axios.get(url)
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                const formatted = data.map((c) => ({ id: c.id, name: c.name, count: c.product_count }));
                setCategories([{ id: 'all', name: 'All items' }, ...formatted]);
            })
            .catch(() => {});
    }, [storeSlug]);

    // Fetch initial featured products
    const fetchFeatured = useCallback(() => {
        setLoadingProducts(true);
        const url = storeSlug ? route('store.pos.featured', { store_slug: storeSlug }) : '/pos/products/featured';
        axios.get(url)
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setProducts(data);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));
    }, [storeSlug]);

    useEffect(() => {
        fetchFeatured();
    }, [fetchFeatured]);

    // Live debounced search & category query
    const performSearch = useCallback((query = '', catId = 'all') => {
        if (!query.trim() && catId === 'all') {
            fetchFeatured();
            return;
        }
        setLoadingProducts(true);
        const url = storeSlug ? route('store.pos.search', { store_slug: storeSlug }) : '/pos/products';
        axios.get(url, { params: { q: query, category_id: catId !== 'all' ? catId : undefined } })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setProducts(data);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));
    }, [fetchFeatured, storeSlug]);

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            performSearch(search, catFilter);
        }, 250);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [search, catFilter, performSearch]);

    /* ── Live Banks ───────────────────────────────────────────────────────── */
    const [banks, setBanks] = useState(() => (bankAccounts.length ? bankAccounts : [
        { id: 1, name: 'Bank Transfer / POS Card', code: 'BANK' },
    ]));

    /* ── User Preferences ─────────────────────────────────────────────────── */
    const [prefs, setPrefs] = useState(() => loadPrefs(userId));
    useEffect(() => savePrefs(userId, prefs), [prefs, userId]);

    /* ── Viewport & Layout Law Composition ─────────────────────────────────── */
    const vp = useViewport();
    const [fractions, setFractions] = useState({});

    const composition = useMemo(() => {
        if (prefs?.auto) {
            const { comp } = autoComposition(prefs?.profile || 'retail', vp.w, vp.h);
            return comp;
        }
        return prefs?.comp || presetComposition(prefs?.preset || 'column');
    }, [prefs?.auto, prefs?.profile, prefs?.comp, prefs?.preset, vp.w, vp.h]);

    const T = useMemo(() => {
        const spec = { ...(composition || presetComposition('column')), fractions };
        return composeTerminal(spec, vp.w, vp.h, {
            scale: prefs?.ops?.uiScale || 1,
            margin: marginAt(vp.w),
            senior: Boolean(prefs?.ops?.senior),
            rail: Boolean(prefs?.rail),
        });
    }, [composition, fractions, prefs?.ops?.senior, prefs?.ops?.uiScale, prefs?.rail, vp.h, vp.w]);

    const getFrac = useCallback((leftKey, rightKey) => fractions[`${leftKey}_${rightKey}`] ?? 0.5, [fractions]);
    const setFrac = useCallback((leftKey, rightKey, f) => {
        setFractions((prev) => ({ ...prev, [`${leftKey}_${rightKey}`]: f }));
    }, []);

    /* ── Tabs & Cart State ────────────────────────────────────────────────── */
    const [tabs, setTabs] = useState(() => {
        if (recalledSale) {
            const lines = (recalledSale.items || []).map((item) => ({
                u: uid(),
                id: item.product_id,
                product_id: item.product_id,
                variant_id: item.variant_id || item.product_variant_id || null,
                name: item.product?.name || item.name || 'Item',
                sku: item.productVariant?.sku || item.product?.sku || item.sku || '',
                price: Number(item.price || item.unit_price || 0),
                basePrice: Number(item.product?.price || item.price || 0),
                cost: Number(item.product?.cost_price || item.cost_price || 0),
                stock: Number(item.product?.stocks?.reduce((a, s) => a + (Number(s.quantity) || 0), 0) || 99),
                tax: Number(item.product?.tax_rate ?? 0),
                unit: item.product?.base_unit || 'pc',
                image_url: item.product?.image_path || item.product?.image_url || null,
                qty: Number(item.quantity || 1),
                freeQty: Number(item.free_quantity || 0),
                discount: { mode: item.discount_type === 'percentage' ? 'pct' : 'amt', value: Number(item.discount || 0) },
                note: item.note || '',
                hue: HUES[(item.product_id || 0) % HUES.length],
            }));
            const recTab = {
                ...newTab(1, prefs.ops, recalledSale.customer || walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode),
                lines,
                notes: recalledSale.notes || '',
                discount: { mode: recalledSale.discount_type === 'percentage' ? 'pct' : 'amt', value: Number(recalledSale.discount || 0) },
                taxRate: Number(recalledSale.tax_rate ?? defaultTaxRate),
                docNo: recalledSale.invoice_number || `INV-${recalledSale.id}`,
            };
            return [recTab];
        }
        return [newTab(1, prefs.ops, walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode)];
    });

    const [active, setActive] = useState(0);
    const [sel, setSel] = useState(-1);
    const tab = tabs[active] || tabs[0];

    const patchTab = useCallback((patch) => {
        setTabs((ts) => ts.map((t, i) => (i === active ? { ...t, ...patch } : t)));
    }, [active]);

    /* ── Sheets, Drawers, Overlays ────────────────────────────────────────── */
    const [sheet, setSheet] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [variantPicker, setVariantPicker] = useState(null);
    const [completedSale, setCompletedSale] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [table, setTable] = useState(null);
    const [online, setOnline] = useState(true);
    const [queue, setQueue] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');
        } catch (_) { return []; }
    });

    useEffect(() => {
        try {
            localStorage.setItem('pos_offline_queue', JSON.stringify(queue));
        } catch (_) {}
    }, [queue]);

    const [toasts, setToasts] = useState([]);

    const toast = useCallback((text, opts = {}) => {
        const t = { id: `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, tone: opts.tone || 'info', action: opts.action, onAction: opts.onAction };
        setToasts((ts) => [...ts.slice(-3), t]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), opts.ms || 3400);
    }, []);

    const onToastAction = useCallback((t) => {
        t.onAction?.();
        setToasts((ts) => ts.filter((x) => x.id !== t.id));
    }, []);

    const searchRef = useRef(null);

    /* ── Cart rescue (Survives reloads) ───────────────────────────────────── */
    useEffect(() => {
        if (!recalledSale) {
            const saved = loadRescue(userId);
            if (saved?.tabs?.length && saved.tabs.some((t) => t.lines?.length)) {
                setTabs(saved.tabs);
                toast('Restored active cart from your last session.', { tone: 'good', ms: 4000 });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const id = setTimeout(() => saveRescue(userId, tabs), 500);
        return () => clearTimeout(id);
    }, [tabs, userId]);

    /* ── Offline sale syncer ──────────────────────────────────────────────── */
    const syncOfflineQueue = useCallback(async () => {
        if (!online || !queue.length) return;
        const pending = queue.filter((q) => q.state !== 'error');
        for (const item of pending) {
            try {
                const url = storeSlug ? route('store.sales.store', { store_slug: storeSlug }) : '/sales';
                // eslint-disable-next-line no-await-in-loop
                const res = await axios.post(url, item.payload);
                if (res.data?.success) {
                    setQueue((prev) => prev.filter((q) => q.id !== item.id));
                    toast(`Offline sale ${item.id} posted successfully.`, { tone: 'good' });
                }
            } catch (err) {
                setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, state: 'error', why: err.response?.data?.message || 'Server rejected' } : q)));
            }
        }
    }, [online, queue, storeSlug, toast]);

    useEffect(() => {
        if (online && queue.some((q) => q.state === 'pending' || q.state === 'syncing')) {
            const timer = setTimeout(syncOfflineQueue, 1500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [online, queue, syncOfflineQueue]);

    /* ── Bill arithmetic ──────────────────────────────────────────────────── */
    const m = useMemo(() => {
        const lines = tab.lines;
        const gross = lines.reduce((a, l) => a + l.qty * l.price + (l.freeQty || 0) * l.price, 0);
        const lineDisc = lines.reduce((a, l) => a + lineDiscount(l), 0);
        const sub = Math.max(0, gross - lineDisc);
        const docDisc = tab.discount.mode === 'pct'
            ? (sub * Math.min(100, Math.max(0, tab.discount.value || 0))) / 100
            : Math.min(sub, Math.max(0, tab.discount.value || 0));
        const taxable = Math.max(0, sub - docDisc);
        const charges = (tab.charges || []).reduce((a, c) => a + (Number(c.amount) || 0), 0);

        let tax = 0;
        if (tab.taxRate > 0) {
            if (tab.taxMode === 'inclusive') {
                tax = Math.round((taxable - (taxable / (1 + tab.taxRate / 100))) * 100) / 100;
            } else {
                tax = Math.round(((taxable * tab.taxRate) / 100) * 100) / 100;
            }
        }

        const unrounded = tab.taxMode === 'inclusive'
            ? taxable + charges
            : taxable + tax + charges;

        const total = prefs?.ops?.roundOff ? Math.round(unrounded) : Math.round(unrounded * 100) / 100;
        const round = total - unrounded;

        return {
            gross, lineDisc, sub, docDisc, charges, tax, total, round,
            count: lines.reduce((a, l) => a + l.qty, 0),
            taxLabel: tab.taxRate > 0 ? `${tab.taxRate}%` : '0%',
            taxMode: tab.taxMode,
        };
    }, [tab.charges, tab.discount, tab.lines, tab.taxMode, tab.taxRate, prefs?.ops?.roundOff]);

    const change = tab.tendered > 0 ? tab.tendered - m.total : 0;

    /* ── Cart Mutations ───────────────────────────────────────────────────── */
    const addProduct = useCallback((product, variant = null) => {
        if (!variant && product.has_variants && product.variants?.length) {
            setVariantPicker(product);
            return;
        }

        // Check negative stock
        const stock = Number(variant ? (variant.stock ?? variant.stock_quantity ?? product.stock_quantity ?? product.stock) : (product.stock_quantity ?? product.stock ?? 999));
        if (stock <= 0 && settings?.prevent_negative_stock === '1') {
            toast(`"${product.name}" is out of stock.`, { tone: 'bad' });
            return;
        }

        setTabs((ts) => ts.map((t, i) => {
            if (i !== active) return t;
            const targetSku = variant ? variant.sku : product.sku;
            const existingIdx = t.lines.findIndex((l) => (variant ? l.variant_id === variant.id : l.product_id === product.id && !l.variant_id) || (targetSku && l.sku === targetSku));

            if (existingIdx >= 0) {
                const lines = [...t.lines];
                lines[existingIdx] = { ...lines[existingIdx], qty: lines[existingIdx].qty + 1 };
                return { ...t, lines };
            }
            return { ...t, lines: [newLine(product, 1, variant), ...t.lines] };
        }));
        setSel(0);
        toast(`Added ${variant ? `${product.name} (${variant.name})` : product.name}`, { tone: 'good', ms: 1600 });
    }, [active, settings?.prevent_negative_stock, toast]);

    const removeLine = useCallback((line) => {
        patchTab({ lines: tab.lines.filter((l) => l.u !== line.u) });
        setSel(-1);
    }, [patchTab, tab.lines]);

    const patchLine = useCallback((line, patch) => {
        patchTab({ lines: tab.lines.map((l) => (l.u === line.u ? { ...l, ...patch } : l)) });
    }, [patchTab, tab.lines]);

    /* ── Barcode Scanner & Search Handler ─────────────────────────────────── */
    const onSearchKey = async (e) => {
        if (e.key === 'Enter') {
            const query = search.trim();
            if (!query) return;

            // Barcode Scanner direct lookup
            try {
                const url = storeSlug ? route('store.pos.barcode', { store_slug: storeSlug, code: query }) : `/pos/barcode/${query}`;
                const res = await axios.get(url);
                if (res.data?.found && res.data?.product) {
                    const prod = res.data.product;
                    const variant = res.data.variant_id
                        ? prod.variants?.find((v) => v.id === res.data.variant_id)
                        : null;
                    addProduct(prod, variant);
                    setSearch('');
                    return;
                }
            } catch (_) {}

            // Fallback to search list match
            if (products.length === 1) {
                addProduct(products[0]);
                setSearch('');
            } else if (products.length > 1) {
                setCatalogSearch(query);
                setSheet('catalog');
            } else {
                toast(`No product found for "${query}".`, { tone: 'bad' });
            }
        }
        if (e.key === 'Escape') setSearch('');
    };

    /* ── Actions: Drawer, Hold, Complete ─────────────────────────────────── */
    const openDrawer = useCallback(() => {
        if (!prefs?.perms?.['pos.open_drawer']) {
            toast('Your role may not open the cash drawer.', { tone: 'bad' });
            return;
        }
        // Trigger drawer pulse via hardware service if configured
        if (PrintService.isAMDStationAvailable?.()) {
            PrintService.printWithAMDStation({}, settings, { openDrawer: true });
        }
        toast('Cash drawer opened.', { tone: 'good' });
    }, [prefs?.perms, settings, toast]);

    const holdSale = useCallback(async () => {
        if (!tab.lines.length) {
            toast('Nothing to hold. Cart is empty.', { tone: 'bad' });
            return;
        }
        try {
            const url = storeSlug ? route('store.sales.park', { store_slug: storeSlug }) : '/sales/park';
            await axios.post(url, {
                cart_data: JSON.stringify(tab.lines),
                customer_id: tab.party?.id && !tab.party.walkin ? tab.party.id : null,
                notes: tab.notes || '',
                total_amount: m.total,
            });
            toast('Sale held in Parked. You can recall it anytime.', { tone: 'good' });
        } catch (_) {
            toast('Saved to local hold queue.', { tone: 'good' });
        }
        patchTab({
            lines: [], notes: '', charges: [], discount: { mode: 'pct', value: 0 },
            tendered: 0, tenderTouched: false, splits: [], isReturn: false, returnRef: null,
        });
        setSel(-1);
    }, [m.total, patchTab, storeSlug, tab.lines, tab.notes, tab.party?.id, tab.party?.walkin, toast]);

    const complete = useCallback(async (opts = {}) => {
        if (!tab.lines.length) {
            toast('Cart is empty. Add products to complete sale.', { tone: 'bad' });
            return false;
        }
        const ch = (tab.tendered || m.total) - m.total;
        if (tab.splits.length) {
            const paid = tab.splits.reduce((a, x) => a + (Number(x.amount) || 0), 0);
            if (paid + 0.5 < m.total) {
                toast(`Split covers PKR ${n0(paid)} of ${n0(m.total)}. Add the rest.`, { tone: 'bad' });
                setSheet('split');
                return false;
            }
        } else if (!tab.isReturn && tab.method === 'Cash' && ch < -0.5) {
            toast(`Short by PKR ${n0(Math.abs(ch))}.`, { tone: 'bad' });
            return false;
        }

        if (!opts.skipOverpay && !tab.isReturn && !tab.splits.length && tab.method === 'Cash' && ch > 0.5) {
            setSheet('overpay');
            return false;
        }

        const asChange = (opts.overpay || tab.overpay) !== 'ledger';

        // Prepare live sale payload for backend SaleController::store
        const payload = {
            customer_id: tab.party?.id && !tab.party.walkin ? tab.party.id : null,
            sale_date: new Date().toISOString().slice(0, 10),
            items: tab.lines.map((l) => ({
                product_id: l.product_id || l.id,
                variant_id: l.variant_id || null,
                quantity: Number(l.qty),
                free_quantity: Number(l.freeQty || 0),
                price: Number(l.price),
                discount: Number(lineDiscount(l)),
                discount_type: l.discount?.mode === 'pct' ? 'percentage' : 'fixed',
                tax_rate: Number(l.tax ?? tab.taxRate ?? 0),
                serials: l.serials || [],
            })),
            payment_method: tab.splits.length > 1
                ? 'split'
                : (tab.method || 'Cash').toLowerCase(),
            payment_account_id: tab.bank || null,
            payments: tab.splits.length > 1
                ? tab.splits.map((s) => ({
                    method: s.method.toLowerCase(),
                    amount: Number(s.amount),
                    bank_account_id: s.bank || null,
                }))
                : [{
                    method: (tab.method || 'Cash').toLowerCase(),
                    amount: Math.min(Number(tab.tendered || m.total), Number(m.total)),
                    bank_account_id: tab.bank || null,
                }],
            amount_paid: Number(tab.tendered || m.total),
            discount: Number(m.docDisc || 0),
            discount_type: tab.discount?.mode === 'pct' ? 'percentage' : 'fixed',
            tax: Number(m.tax || 0),
            tax_rate: Number(tab.taxRate || 0),
            tax_inclusive: tab.taxMode === 'inclusive',
            delivery_charge: Number(tab.charges?.find((c) => /delivery|shipping/i.test(c.label))?.amount || 0),
            extra_charge_value: Number(tab.charges?.filter((c) => !/delivery|shipping/i.test(c.label)).reduce((a, c) => a + Number(c.amount || 0), 0)),
            extra_charge_label: tab.charges?.filter((c) => !/delivery|shipping/i.test(c.label)).map((c) => c.label).join(', ') || null,
            add_to_ledger: opts.overpay === 'ledger' || tab.overpay === 'ledger',
            notes: tab.notes || null,
            warehouse_id: tab.warehouse || defaultWarehouseId,
            idempotency_key: tab.idem || idemKey(),
            source: 'pos',
        };

        if (!online) {
            const offlineSale = {
                id: `Q-${Date.now().toString().slice(-4)}`,
                at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                total: m.total,
                lines: tab.lines.length,
                state: 'pending',
                why: 'Offline — saved to local queue',
                payload,
            };
            setQueue((qs) => [...qs, offlineSale]);
            toast(`Saved offline (${offlineSale.id}). Will sync when connected.`, { tone: 'good', ms: 5000 });
        } else {
            try {
                const url = storeSlug ? route('store.sales.store', { store_slug: storeSlug }) : '/sales';
                const res = await axios.post(url, payload);
                const recordedSale = res.data?.sale || {
                    id: res.data?.sale_id || Date.now(),
                    invoice_number: res.data?.reference || `INV-${Date.now()}`,
                    total: m.total,
                    amount_paid: tab.tendered || m.total,
                    change: ch > 0 ? ch : 0,
                    payment_method: tab.method || 'Cash',
                    customer: tab.party,
                    items: tab.lines,
                };

                toast(`Sale ${recordedSale.invoice_number || ''} completed & posted to ledger.`, { tone: 'good', ms: 4000 });

                // Cash drawer trigger on cash sale
                if (prefs?.ops?.openDrawerOnCash && tab.method === 'Cash' && asChange) {
                    openDrawer();
                }

                // Quick print receipt if auto-print enabled
                if (prefs?.ops?.autoPrint || settings?.auto_print_receipt === '1') {
                    const printType = settings?.default_print_type || 'thermal';
                    setTimeout(() => PrintService.quickPrint(recordedSale, printType, settings), 300);
                }

                // Open receipt modal
                setCompletedSale(recordedSale);

                // Refresh stock counts in background
                fetchFeatured();
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.response?.data?.errors?.customer_id?.[0] || 'Checkout failed. Please review values.';
                toast(errorMsg, { tone: 'bad', ms: 5000 });
                return false;
            }
        }

        // Reset the current tab
        const tabId = tab.id;
        setTabs((ts) => ts.map((t) => (t.id === tabId
            ? { ...newTab(t.seq, prefs.ops, walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode), party: t.party, warehouse: t.warehouse }
            : t)));
        setSel(-1);
        clearRescue(userId);
        return true;
    }, [defaultTaxMode, defaultTaxRate, defaultWarehouseId, fetchFeatured, m.docDisc, m.tax, m.total, online, openDrawer, patchTab, prefs.ops, settings, storeSlug, tab, toast, userId, walkInCustomer]);

    /* ── Tabs Management ──────────────────────────────────────────────────── */
    const addTab = useCallback(() => {
        setTabs((ts) => [...ts, newTab(ts.length + 1, prefs.ops, walkInCustomer, defaultWarehouseId, defaultTaxRate, defaultTaxMode)]);
        setActive(tabs.length);
        setSel(-1);
    }, [defaultTaxMode, defaultTaxRate, defaultWarehouseId, prefs.ops, tabs.length, walkInCustomer]);

    const closeTab = useCallback((i) => {
        if (tabs.length === 1) {
            patchTab({
                lines: [], notes: '', charges: [], discount: { mode: 'pct', value: 0 },
                tendered: 0, tenderTouched: false, splits: [],
            });
            setSel(-1);
            return;
        }
        setTabs((ts) => ts.filter((_, j) => j !== i));
        setActive((a) => Math.max(0, a >= i ? a - 1 : a));
        setSel(-1);
    }, [patchTab, tabs.length]);

    const cancelSale = useCallback(() => {
        patchTab({
            lines: [], notes: '', charges: [], discount: { mode: 'pct', value: 0 },
            tendered: 0, tenderTouched: false, splits: [], isReturn: false, returnRef: null,
        });
        setSel(-1);
        toast('Active sale cleared.');
    }, [patchTab, toast]);

    /* ── Recalling Parked Sale ────────────────────────────────────────────── */
    const recallParked = useCallback(async (parked) => {
        try {
            const url = storeSlug ? route('store.sales.recall', { store_slug: storeSlug, id: parked.id }) : `/sales/parked/${parked.id}`;
            const res = await axios.get(url);
            const saleData = res.data?.sale || res.data;
            const items = typeof saleData.cart_data === 'string' ? JSON.parse(saleData.cart_data || '[]') : (saleData.items || []);

            patchTab({
                lines: items.map((it) => ({
                    u: uid(),
                    id: it.product_id || it.id,
                    product_id: it.product_id || it.id,
                    variant_id: it.variant_id || null,
                    name: it.name || it.product?.name || 'Item',
                    sku: it.sku || '',
                    qty: Number(it.quantity || it.qty || 1),
                    price: Number(it.price || it.unit_price || 0),
                    basePrice: Number(it.price || 0),
                    cost: Number(it.cost || 0),
                    stock: 99,
                    tax: Number(it.tax || 0),
                    unit: it.unit || 'pc',
                    freeQty: Number(it.freeQty || 0),
                    discount: it.discount || { mode: 'pct', value: 0 },
                    note: it.note || '',
                    hue: HUES[(it.product_id || 0) % HUES.length],
                })),
                party: saleData.customer ? {
                    id: saleData.customer.id,
                    name: saleData.customer.name,
                    phone: saleData.customer.phone || '',
                    balance: Number(saleData.customer.balance || 0),
                    discount: Number(saleData.customer.default_discount || 0),
                    credit: Number(saleData.customer.credit_limit || 0),
                    walkin: false,
                } : walkInCustomer,
                notes: saleData.notes || '',
            });
            toast(`Recalled held sale #${parked.reference_number || parked.id}`, { tone: 'good' });
        } catch (_) {
            toast('Could not recall held sale.', { tone: 'bad' });
        }
    }, [patchTab, storeSlug, toast, walkInCustomer]);

    /* ── Keymap handler ───────────────────────────────────────────────────── */
    const anyOverlay = Boolean(sheet || settingsOpen || paletteOpen || navOpen || confirm || variantPicker || completedSale);

    useEffect(() => {
        const typing = () => {
            const el = document.activeElement;
            if (!el) return false;
            if (el.dataset && el.dataset.scan === 'true') return false;
            return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
        };

        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (completedSale) setCompletedSale(null);
                else if (variantPicker) setVariantPicker(null);
                else if (confirm) setConfirm(null);
                else if (paletteOpen) setPaletteOpen(false);
                else if (settingsOpen) setSettingsOpen(false);
                else if (sheet) setSheet(null);
                else if (navOpen) setNavOpen(false);
                else if (sel >= 0) setSel(-1);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
                return;
            }
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
            switch (e.key) {
                case 'F1': e.preventDefault(); searchRef.current?.focus(); break;
                case 'F2': case 'F3': case 'F5': case 'F6':
                    e.preventDefault(); withLine(() => setSheet('line')); break;
                case 'F4': e.preventDefault(); withLine((l) => removeLine(l)); break;
                case 'F7': e.preventDefault(); setSheet('tax'); break;
                case 'F8': e.preventDefault(); setSheet('charges'); break;
                case 'F9': e.preventDefault(); setSheet('discount'); break;
                case 'F11': e.preventDefault(); setSheet('party'); break;
                case 'F12': e.preventDefault(); setSheet('notes'); break;
                case '?': if (!typing()) { e.preventDefault(); setSheet('keys'); } break;
                default: break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, anyOverlay, closeTab, complete, confirm, navOpen, paletteOpen, sel, setSel, settingsOpen, sheet, tab.lines, tabs.length, toast, variantPicker, completedSale, addTab]);

    /* ── Renderers ────────────────────────────────────────────────────────── */
    const tabLabel = (t) => {
        if (t.isReturn) return `Return #${t.seq}`;
        if (t.party && !t.party.walkin) return `${t.party.name.split(' ')[0]} (#${t.seq})`;
        return `Sale #${t.seq}`;
    };

    const renderTile = (p) => (
        <button
            key={p.id}
            type="button"
            className="nqp-tile"
            data-rank="1"
            onClick={() => addProduct(p)}
        >
            <div className="nqp-tile-head">
                <span className="nqp-sw" style={{ background: HUE_VAR[HUES[(p.id || 0) % HUES.length]] }}>
                    {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    ) : (
                        <span style={{ fontSize: 16 }}>📦</span>
                    )}
                </span>
                <span className="nqp-tile-pr num">PKR {n0(p.price)}</span>
            </div>
            <div className="nqp-tile-body">
                <span className="nqp-tile-name">{p.name}</span>
                <span className="nqp-tile-sub">{p.sku} · {p.stock_quantity ?? p.stock ?? 0} in stock</span>
            </div>
            {tab.lines.some((l) => l.product_id === p.id) ? (
                <span className="nqp-tile-badge">
                    {tab.lines.filter((l) => l.product_id === p.id).reduce((a, l) => a + l.qty, 0)}
                </span>
            ) : null}
        </button>
    );

    const renderCatalogFilters = () => (
        <div className="nqp-catchips">
            {categories.map((c) => (
                <button
                    key={c.id}
                    type="button"
                    className="nqp-catchip"
                    aria-pressed={catFilter === c.id}
                    onClick={() => setCatFilter(c.id)}
                >
                    {c.name} {c.count !== undefined ? `(${c.count})` : ''}
                </button>
            ))}
        </div>
    );

    const renderCatalogBody = (tiles) => (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>
            {renderCatalogFilters()}
            {loadingProducts ? (
                <div className="nqp-empty">Loading catalogue…</div>
            ) : null}
            {!loadingProducts && !products.length ? (
                <div className="nqp-empty">No products match your filter.</div>
            ) : null}
            <div className="nqp-grid" style={{ gridTemplateColumns: `repeat(${tiles || 3}, minmax(0, 1fr))` }}>
                {products.map(renderTile)}
            </div>
        </div>
    );

    const renderCartBody = (fit) => (
        <div className="nqp-lines" data-fit={fit}>
            {tab.lines.map((l, i) => {
                const isSel = i === sel;
                const net = l.qty * l.price - lineDiscount(l);
                return (
                    <div
                        key={l.u}
                        className="nqp-line"
                        data-sel={isSel ? 'true' : undefined}
                        onClick={() => setSel(i)}
                    >
                        <span className="nqp-sw" style={{ background: HUE_VAR[l.hue || 'teal'] }}>
                            {l.image_url ? (
                                <img src={l.image_url} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                            ) : (
                                <span style={{ fontSize: 13 }}>📦</span>
                            )}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="nqp-line-head">
                                <span className="nqp-line-name">{l.name}</span>
                                <span className="nqp-line-tot num">PKR {n0(net)}</span>
                            </div>
                            <div className="nqp-line-sub">
                                {l.qty} {l.unit} × {n0(l.price)}
                                {lineDiscount(l) > 0 ? ` · -${n0(lineDiscount(l))} off` : ''}
                                {l.freeQty > 0 ? ` · +${l.freeQty} bonus` : ''}
                            </div>
                        </div>
                        <Stepper
                            value={l.qty}
                            onChange={(q) => {
                                if (q <= 0) removeLine(l);
                                else patchLine(l, { qty: q });
                            }}
                        />
                        <button
                            type="button"
                            className="nqp-line-del"
                            aria-label="Remove item"
                            onClick={(e) => { e.stopPropagation(); removeLine(l); }}
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
            {!tab.lines.length ? (
                <div className="nqp-empty">
                    <span style={{ fontSize: 32, opacity: 0.4, display: 'block', marginBottom: 8 }}>🛒</span>
                    Cart is empty. Scan a barcode or tap items to add.
                </div>
            ) : null}
        </div>
    );

    const taxLabel = parsedTaxRates.find((t) => t.rate === tab.taxRate)?.label || `${tab.taxRate}%`;

    const renderTenderBody = (fit, w, full) => {
        const avail = Math.max(90, w - 40 - 110);
        return (
            <>
                <button type="button" className="nqp-party" data-rank="1" onClick={() => setSheet('party')}>
                    <span className="nqp-avatar">{tab.party?.name ? tab.party.name[0].toUpperCase() : 'W'}</span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span className="nqp-line-name" style={{ display: 'block' }}>{tab.party?.name || 'Walk-in Customer'}</span>
                        <span className="nqp-line-sub">
                            {tab.party?.walkin ? 'Walk-in cash customer'
                                : `${tab.party?.phone || 'No phone'} · Balance: PKR ${n0(tab.party?.balance || 0)}${tab.party?.discount ? ` · ${tab.party.discount}% discount` : ''}`}
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
                    <label htmlFor={`nqp-tendered-${full ? 'sheet' : 'col'}`}>Amount tendered (PKR)</label>
                    <input
                        id={`nqp-tendered-${full ? 'sheet' : 'col'}`}
                        className="num"
                        inputMode="decimal"
                        data-rank="1"
                        value={tab.tendered ? n0(tab.tendered) : ''}
                        placeholder={n0(m.total)}
                        onChange={(e) => patchTab({ tendered: Number(e.target.value.replace(/[^\d.]/g, '')) || 0, tenderTouched: true })}
                    />
                </div>

                {full ? (
                    <div className="nqp-keypad">
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
                        <span className="nqp-fv">{(warehouses.find((x) => x.id === tab.warehouse)?.name || 'Main store').split(' — ')[0]}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" data-set={tab.charges.length ? 'true' : undefined} onClick={() => setSheet('charges')}>
                        <span className="nqp-fk">Charges F8</span>
                        <span className="nqp-fv">{m.charges ? n0(m.charges) : '—'}</span>
                    </button>
                    <button type="button" className="nqp-fchip" data-rank="2" data-set={tab.notes ? 'true' : undefined} onClick={() => setSheet('notes')}>
                        <span className="nqp-fk">Remarks F12</span>
                        <span className="nqp-fv">{tab.notes ? 'set' : '—'}</span>
                    </button>
                    {tab.method !== 'Cash' || tab.splits.length ? (
                        <button type="button" className="nqp-fchip" data-rank="2" onClick={() => setSheet('bank')}>
                            <span className="nqp-fk">Deposit to</span>
                            <span className="nqp-fv">{(banks.find((b) => b.id === tab.bank)?.name || banks[0]?.name || 'Bank').split(' — ')[0]}</span>
                        </button>
                    ) : null}
                </div>
            </>
        );
    };

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
                    <button type="button" data-rank="2" title="Tap for breakdown (Ctrl+F)" onClick={() => setSheet('breakup')} style={{ minWidth: 0 }}>
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
                        <span>{tab.isReturn ? 'Refund' : 'Complete (Ctrl+S)'}</span>
                        {showAmount ? <Money value={m.total} font={15} avail={amountAvail} /> : null}
                    </button>
                    <button type="button" className="nqp-cta" data-ghost="true" data-rank="1" onClick={holdSale}>Hold</button>
                    <button type="button" className="nqp-cta" data-ghost="true" data-rank="2" disabled={!prefs?.perms?.['pos.open_drawer']} onClick={openDrawer}>Drawer</button>
                </div>
            </div>
        );
    };

    /* ── Floor plan body ──────────────────────────────────────────────────── */
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
                            toast(`Selected Table ${t.id} (${t.zone})`);
                        }}
                    >
                        <span style={{ fontFamily: 'var(--vq-font-numeric)', fontSize: 18, fontWeight: 700 }}>{t.id}</span>
                        <span className="nqp-line-sub">
                            {t.status === 'free' ? `${t.seats} seats` : `${t.guests || 2} guests · ${t.since}`}
                        </span>
                        {busy && t.bill ? <span className="nqp-tile-pr">PKR {n0(t.bill)}</span> : null}
                    </button>
                );
            })}
        </div>
    );

    /* ── Layout Assembly ──────────────────────────────────────────────────── */
    const cat = T?.catalog;
    const cols = [];
    if (cat && cat.mode === 'left') cols.push(['catalog', cat.px]);
    if (T?.floor && T.floor.mode === 'left') cols.push(['floor', T.floor.px]);
    if (T?.cart) cols.push(['cart', T.cart.px]);
    if (T?.tender && T.tender.mode === 'column') cols.push(['tender', T.tender.px]);
    if (cat && cat.mode === 'right') cols.push(['catalog', cat.px]);

    const qtyTotal = (tab.lines || []).reduce((a, l) => a + (l.qty || 0), 0);
    const railW = Math.round(T?.railW || 0);

    const dock = T?.dock || [];
    const dockCarriesActions = dock.length > 0 && T?.tender?.mode !== 'column' && vp.w >= 620;
    const dockExtras = dock.filter((d) => d.id !== 'tender').length + (dockCarriesActions ? 2 : 0);
    const tenderInline = dock.some((d) => d.id === 'tender' && d.inline);
    const dockTight = vp.w < 560 && dock.length > 1;
    const showDockTotal = tenderInline && !dockTight;
    const dockSlots = (showDockTotal ? 1 : 0) + (dock.length ? 1 : 0) + dockExtras;
    const dockPool = Math.max(120, (T?.avail || vp.w) - 20 - 10 * Math.max(0, dockSlots - 1));
    const dockWeights = (showDockTotal ? 1.6 : 0) + 2.2 + dockExtras;
    const dockTotalAvail = Math.max(60, (dockPool * 1.6) / dockWeights - 14);
    const dockPayAvail = Math.max(60, (dockPool * 2.2) / dockWeights - 96);

    const renderPane = (key, px) => {
        if (key === 'catalog') {
            return (
                <Pane key="catalog" title="Catalogue" width={px} extra={<span className="mono">{products.length} items</span>}>
                    {renderCatalogBody(cat.tiles)}
                </Pane>
            );
        }
        if (key === 'floor') {
            return (
                <Pane key="floor" title="Tables" width={px} extra={<span className="mono">{TABLES.filter((t) => t.status !== 'free').length} active</span>}>
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
                title={tab.isReturn ? 'Return Items' : 'Sale Cart'}
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
                footer={T?.tender?.mode !== 'column' && !dockCarriesActions ? (
                    <div className="nqp-pf">
                        <div className="nqp-actions">
                            <button type="button" className="nqp-cta" data-ghost="true" data-rank="1" onClick={holdSale}>Hold</button>
                            <button type="button" className="nqp-cta" data-ghost="true" data-rank="2" disabled={!prefs?.perms?.['pos.open_drawer']} onClick={openDrawer}>Drawer</button>
                        </div>
                    </div>
                ) : null}
            >
                {renderCartBody(T?.cart?.fit || 'full')}
            </Pane>
        );
    };

    const commands = [
        { label: 'New sale tab', key: 'Ctrl+T', run: addTab },
        { label: 'Complete sale', key: 'Ctrl+S', run: complete },
        { label: 'Hold this sale', run: holdSale },
        { label: 'Parked sales', run: () => setSheet('parked') },
        { label: 'Recent invoices', run: () => setSheet('recent') },
        { label: 'Start a return', run: () => setSheet('return') },
        { label: 'Open cash drawer', run: openDrawer },
        { label: 'Bill breakdown', key: 'Ctrl+F', run: () => setSheet('breakup') },
        { label: 'Document discount', key: 'F9', run: () => setSheet('discount') },
        { label: 'Additional charges', key: 'F8', run: () => setSheet('charges') },
        { label: 'Sale remarks', key: 'F12', run: () => setSheet('notes') },
        { label: 'New customer', key: 'Ctrl+D', run: () => setSheet('party') },
        { label: 'Offline queue', run: () => setSheet('offline') },
        { label: 'Keyboard map', key: '?', run: () => setSheet('keys') },
        { label: 'Register settings', run: () => setSettingsOpen(true) },
        { label: 'Back to Dashboard', run: () => { window.location.href = storeSlug ? `/s/${storeSlug}/dashboard` : '/dashboard'; } },
    ];

    const narrow = vp.w < 768;

    return (
        <>
            <Head title="VenQore POS — Register" />
            <div
                className="nqp"
                data-theme={theme}
                data-rankmode={prefs?.ops?.rankMode ? 'true' : undefined}
                data-senior={prefs?.ops?.senior ? 'true' : 'false'}
                style={{ '--nqp-scale': prefs?.ops?.uiScale || 1, '--nqp-margin': `${Math.round(marginAt(vp.w))}px` }}
            >
                {/* ── RAIL ─────────────────────────────────────────────────── */}
                {railW > 0 ? (
                    <nav className="nqp-rail" style={{ width: railW }} data-rank="2" aria-label="Sections">
                        {NAV.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                className="nqp-railicon"
                                aria-label={n.label}
                                title={n.label}
                                aria-current={n.id === 'sell' ? 'true' : undefined}
                                onClick={() => {
                                    if (n.id !== 'sell' && n.url) {
                                        window.location.href = storeSlug ? `/s/${storeSlug}${n.url}` : n.url;
                                    }
                                }}
                            >
                                {n.glyph}
                            </button>
                        ))}
                        <span className="nqp-rail-sp" />
                        <button type="button" className="nqp-railicon" aria-label="Register settings" data-rank="3" onClick={() => setSettingsOpen(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                    </nav>
                ) : null}

                <div className="nqp-main">
                    {/* ── BAR ──────────────────────────────────────────────── */}
                    <header className="nqp-bar">
                        <Icon label="Menu" rank="2" title="Navigation menu" onClick={() => setNavOpen(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </Icon>
                        <Icon
                            label="Dashboard"
                            rank="2"
                            onClick={() => {
                                window.location.href = storeSlug ? `/s/${storeSlug}/dashboard` : '/dashboard';
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                        </Icon>
                        {vp.w >= 560 ? (
                            <span className="nqp-brand">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="6" fill="url(#vq-logo-grad)" />
                                    <path d="M7 8L12 17L17 8" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <defs>
                                        <linearGradient id="vq-logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#23C4A6" />
                                            <stop offset="1" stopColor="#076B5E" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                {store?.name || 'VenQore'}
                            </span>
                        ) : null}

                        {/* Open sale tabs */}
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
                        <Icon label="New sale" rank="2" title="New sale (Ctrl+T)" onClick={addTab}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </Icon>

                        <span className="nqp-sp" />

                        {vp.w >= 980 ? (
                            <button type="button" className="nqp-status" data-action="true" data-rank="2" disabled={!prefs?.perms?.['pos.refund']} onClick={() => setSheet('return')}>
                                {tab.isReturn ? `Return · ${tab.returnRef?.invoice_number || 'open'}` : 'Return (F10)'}
                            </button>
                        ) : null}

                        {vp.w >= 720 ? (
                            <button
                                type="button"
                                className="nqp-status"
                                data-rank="3"
                                data-action="true"
                                title="Click to toggle simulated online/offline state"
                                onClick={() => setOnline((o) => !o)}
                            >
                                <span className="nqp-dot" data-state={online ? undefined : 'bad'} />
                                {online ? 'Online' : 'Offline'}
                            </button>
                        ) : null}

                        {queue.length ? (
                            <button
                                type="button"
                                className="nqp-status"
                                data-action="true"
                                data-rank="3"
                                title={`${queue.length} sales queued`}
                                onClick={() => setSheet('offline')}
                            >
                                <span className="nqp-dot" data-state={queue.some((q) => q.state === 'error') ? 'bad' : 'off'} />
                                {vp.w >= 560 ? `${queue.length} queued` : queue.length}
                            </button>
                        ) : null}

                        {/* Theme Toggle */}
                        <Icon label={theme === 'dark' ? 'Light mode' : 'Dark mode'} rank="3" onClick={toggleTheme}>
                            {theme === 'dark' ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </Icon>

                        <Icon label="Keyboard map" rank="2" onClick={() => setSheet('keys')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <line x1="6" y1="8" x2="6.01" y2="8" />
                                <line x1="10" y1="8" x2="10.01" y2="8" />
                                <line x1="14" y1="8" x2="14.01" y2="8" />
                                <line x1="18" y1="8" x2="18.01" y2="8" />
                                <line x1="6" y1="12" x2="6.01" y2="12" />
                                <line x1="10" y1="12" x2="10.01" y2="12" />
                                <line x1="14" y1="12" x2="14.01" y2="12" />
                                <line x1="18" y1="12" x2="18.01" y2="12" />
                                <line x1="7" y1="16" x2="17" y2="16" />
                            </svg>
                        </Icon>
                        <Icon label="Register settings" rank="3" onClick={() => setSettingsOpen(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </Icon>
                    </header>

                    {/* ── TERMINAL ─────────────────────────────────────────── */}
                    <main className="nqp-term">
                        <div className="nqp-search" data-rank="1" style={{ position: 'relative' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flex: '0 0 auto' }}>
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                ref={searchRef}
                                data-scan="true"
                                value={search}
                                placeholder="Scan barcode (F1) or type name / SKU…"
                                aria-label="Scan or search"
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={onSearchKey}
                            />
                            {search ? (
                                <button type="button" className="nqp-iconbtn" aria-label="Clear" onClick={() => setSearch('')}>
                                    ✕
                                </button>
                            ) : null}
                            {vp.w >= 560 ? <Kbd>F1</Kbd> : null}
                        </div>

                        {cat && cat.mode === 'top' ? (
                            <div className="nqp-band" style={{ gridTemplateColumns: `repeat(${cat.tiles}, minmax(0,1fr))`, height: cat.h }}>
                                {products.slice(0, cat.tiles * cat.rows).map(renderTile)}
                            </div>
                        ) : null}

                        <div className="nqp-panes">
                            {cols.map(([key, px], i) => (
                                <React.Fragment key={key}>
                                    {renderPane(key, px)}
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
                                {products.slice(0, cat.tiles * cat.rows).map(renderTile)}
                            </div>
                        ) : null}

                        {/* ── THE DOCK ───────────────────────────────────────── */}
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
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="nqp-dockbtn"
                                        data-rank="2"
                                        onClick={() => {
                                            if (item.id === 'catalog') setSheet('catalog');
                                            else if (item.id === 'floor') setSheet('floor');
                                        }}
                                    >
                                        <span className="lab">{item.label}</span>
                                    </button>
                                )))}
                            </div>
                        ) : null}
                    </main>
                </div>

                {/* ── SHEETS & MODALS ──────────────────────────────────────── */}
                <LineSheet
                    open={sheet === 'line'}
                    onClose={() => setSheet(null)}
                    line={sel >= 0 ? tab.lines[sel] : null}
                    onChange={(patch) => { if (sel >= 0) patchLine(tab.lines[sel], patch); }}
                    onRemove={() => { if (sel >= 0) removeLine(tab.lines[sel]); }}
                    perms={prefs?.perms}
                    showMargin={prefs?.ops?.showMargin}
                    narrow={narrow}
                />

                <PartySheet
                    open={sheet === 'party'}
                    onClose={() => setSheet(null)}
                    onPick={(p) => {
                        patchTab({
                            party: p,
                            discount: p.discount > 0 ? { mode: 'pct', value: p.discount } : tab.discount,
                        });
                        toast(`Customer set to ${p.name}`);
                    }}
                    current={tab.party}
                    storeSlug={storeSlug}
                    defaultCustomer={walkInCustomer}
                    narrow={narrow}
                />

                <ParkedSheet
                    open={sheet === 'parked'}
                    onClose={() => setSheet(null)}
                    onRecall={recallParked}
                    onDelete={async (parkedId) => {
                        try {
                            const url = storeSlug ? route('store.sales.parked.delete', { store_slug: storeSlug, id: parkedId }) : `/sales/parked/${parkedId}`;
                            await axios.delete(url);
                            toast('Held sale discarded.');
                        } catch (_) {}
                    }}
                    storeSlug={storeSlug}
                    narrow={narrow}
                />

                <RecentSheet
                    open={sheet === 'recent'}
                    onClose={() => setSheet(null)}
                    onReprint={(sale) => PrintService.quickPrint(sale, settings?.default_print_type, settings)}
                    onReturn={(sale) => {
                        patchTab({
                            isReturn: true,
                            returnRef: sale,
                            party: sale.customer ? {
                                id: sale.customer.id,
                                name: sale.customer.name,
                                phone: sale.customer.phone || '',
                                balance: 0,
                                discount: 0,
                                credit: 0,
                                walkin: false,
                            } : walkInCustomer,
                        });
                        toast(`Started return against ${sale.invoice_number || sale.reference_number || sale.id}`);
                    }}
                    perms={prefs?.perms}
                    narrow={narrow}
                    storeSlug={storeSlug}
                    settings={settings}
                />

                <ReturnSheet
                    open={sheet === 'return'}
                    onClose={() => setSheet(null)}
                    onLoad={(sale) => {
                        if (sale) {
                            patchTab({
                                isReturn: true,
                                returnRef: sale,
                                party: sale.customer ? {
                                    id: sale.customer.id,
                                    name: sale.customer.name,
                                    phone: sale.customer.phone || '',
                                    balance: 0,
                                    discount: 0,
                                    credit: 0,
                                    walkin: false,
                                } : walkInCustomer,
                            });
                            toast(`Loaded return invoice ${sale.invoice_number || sale.reference_number || sale.id}`);
                        } else {
                            patchTab({ isReturn: true, returnRef: null });
                            toast('Started open return session.');
                        }
                    }}
                    policy={prefs?.ops?.returnPolicy || 'reference'}
                    windowDays={prefs?.ops?.returnWindowDays || 14}
                    party={tab.party}
                    perms={prefs?.perms}
                    narrow={narrow}
                    storeSlug={storeSlug}
                />

                <DiscountSheet
                    open={sheet === 'discount'}
                    onClose={() => setSheet(null)}
                    tab={tab}
                    setTab={patchTab}
                    presetsList={prefs?.ops?.discountPresets || [5, 10, 15, 20]}
                    perms={prefs?.perms}
                    narrow={narrow}
                />

                <ChargesSheet
                    open={sheet === 'charges'}
                    onClose={() => setSheet(null)}
                    tab={tab}
                    setTab={patchTab}
                    narrow={narrow}
                />

                <NotesSheet
                    open={sheet === 'notes'}
                    onClose={() => setSheet(null)}
                    tab={tab}
                    setTab={patchTab}
                    narrow={narrow}
                />

                <SplitSheet
                    open={sheet === 'split'}
                    onClose={() => setSheet(null)}
                    tab={tab}
                    setTab={patchTab}
                    total={m.total}
                    banks={banks}
                    onNewBank={() => setSheet('newBank')}
                    narrow={narrow}
                />

                <OverpaySheet
                    open={sheet === 'overpay'}
                    onClose={() => setSheet(null)}
                    amount={change}
                    party={tab.party}
                    onChoose={(overpayMode) => {
                        complete({ skipOverpay: true, overpay: overpayMode });
                    }}
                    narrow={narrow}
                />

                <QuickProductSheet
                    open={sheet === 'quickProduct'}
                    onClose={() => setSheet(null)}
                    categories={categories}
                    onCreate={async (p) => {
                        try {
                            const url = storeSlug ? route('store.inventory.store', { store_slug: storeSlug }) : '/inventory';
                            const res = await axios.post(url, {
                                name: p.name,
                                sku: p.sku || `SKU-${Date.now()}`,
                                price: p.price,
                                stock: p.stock || 0,
                                category_id: p.category_id,
                            });
                            const created = res.data?.product || res.data || p;
                            addProduct(created);
                            fetchFeatured();
                            toast(`Created and added "${created.name}"`);
                        } catch (_) {
                            addProduct(p);
                        }
                    }}
                    narrow={narrow}
                />

                <QuickBankSheet
                    open={sheet === 'newBank'}
                    onClose={() => setSheet(null)}
                    onCreate={async (b) => {
                        try {
                            const url = storeSlug ? route('store.bank-accounts.store', { store_slug: storeSlug }) : '/bank-accounts';
                            const res = await axios.post(url, { name: b.name, account_number: b.code });
                            const created = res.data?.bankAccount || { id: Date.now(), name: b.name, code: b.code };
                            setBanks((prev) => [...prev, created]);
                            patchTab({ bank: created.id });
                            toast(`Added bank account "${b.name}"`);
                        } catch (_) {
                            const created = { id: Date.now(), name: b.name, code: b.code };
                            setBanks((prev) => [...prev, created]);
                            patchTab({ bank: created.id });
                        }
                    }}
                    narrow={narrow}
                />

                <VariantSheet
                    open={Boolean(variantPicker)}
                    onClose={() => setVariantPicker(null)}
                    product={variantPicker}
                    onPick={(variant) => {
                        addProduct(variantPicker, variant);
                        setVariantPicker(null);
                    }}
                    narrow={narrow}
                />

                <ReceiptSheet
                    open={Boolean(completedSale)}
                    onClose={() => setCompletedSale(null)}
                    sale={completedSale}
                    settings={settings}
                    store={store}
                />

                <KeysSheet open={sheet === 'keys'} onClose={() => setSheet(null)} narrow={narrow} />
                <OfflineSheet
                    open={sheet === 'offline'}
                    onClose={() => setSheet(null)}
                    queue={queue}
                    online={online}
                    onRetry={syncOfflineQueue}
                    onRecall={(q) => {
                        if (q.payload?.items) {
                            patchTab({
                                lines: q.payload.items.map((it) => ({
                                    u: uid(),
                                    id: it.product_id,
                                    product_id: it.product_id,
                                    name: `Item #${it.product_id}`,
                                    price: Number(it.price || 0),
                                    qty: Number(it.quantity || 1),
                                    stock: 99,
                                    discount: { mode: 'pct', value: 0 },
                                    hue: 'teal',
                                })),
                            });
                            setSheet(null);
                            toast('Recalled offline sale into tab.');
                        }
                    }}
                    onDelete={(q) => setQueue((prev) => prev.filter((x) => x.id !== q.id))}
                    narrow={narrow}
                />

                <BreakupSheet open={sheet === 'breakup'} onClose={() => setSheet(null)} m={m} tab={tab} narrow={narrow} />

                {/* Tax selector sheet */}
                <Sheet open={sheet === 'tax'} onClose={() => setSheet(null)} title="Tax rate" size={narrow ? 'bottom' : 'side'}>
                    <div className="nqp-field" style={{ padding: '8px 0' }}>
                        <div className="nqp-seg" style={{ marginBottom: 12 }}>
                            <button type="button" aria-pressed={tab.taxMode === 'exclusive'} onClick={() => patchTab({ taxMode: 'exclusive' })}>Exclusive (added)</button>
                            <button type="button" aria-pressed={tab.taxMode === 'inclusive'} onClick={() => patchTab({ taxMode: 'inclusive' })}>Inclusive (in price)</button>
                        </div>
                        {parsedTaxRates.map((t) => (
                            <RowButton
                                key={t.id}
                                className="nqp-row"
                                onClick={() => {
                                    patchTab({ taxRate: t.rate });
                                    setSheet(null);
                                }}
                            >
                                <span className="nqp-rowmain">
                                    <span className="nqp-rowtitle">{t.label}</span>
                                </span>
                                {tab.taxRate === t.rate ? <Flag>Active</Flag> : null}
                            </RowButton>
                        ))}
                    </div>
                </Sheet>

                {/* Warehouse selector sheet */}
                <Sheet open={sheet === 'location'} onClose={() => setSheet(null)} title="Warehouse / Location" size={narrow ? 'bottom' : 'side'}>
                    <div className="nqp-field" style={{ padding: '8px 0' }}>
                        {warehouses.map((w) => (
                            <RowButton
                                key={w.id}
                                className="nqp-row"
                                onClick={() => {
                                    patchTab({ warehouse: w.id });
                                    setSheet(null);
                                }}
                            >
                                <span className="nqp-rowmain">
                                    <span className="nqp-rowtitle">{w.name}</span>
                                    {w.is_default ? <span className="nqp-line-sub">Default location</span> : null}
                                </span>
                                {tab.warehouse === w.id ? <Flag>Selected</Flag> : null}
                            </RowButton>
                        ))}
                    </div>
                </Sheet>

                {/* Payment method selector sheet */}
                <Sheet open={sheet === 'method'} onClose={() => setSheet(null)} title="Payment method" size={narrow ? 'bottom' : 'side'}>
                    <div className="nqp-field" style={{ padding: '8px 0' }}>
                        {PAY_METHODS.map((method) => (
                            <RowButton
                                key={method}
                                className="nqp-row"
                                onClick={() => {
                                    patchTab({ method, splits: [] });
                                    setSheet(null);
                                }}
                            >
                                <span className="nqp-rowmain"><span className="nqp-rowtitle">{method}</span></span>
                                {tab.method === method && !tab.splits.length ? <Flag>Selected</Flag> : null}
                            </RowButton>
                        ))}
                        <RowButton
                            className="nqp-row"
                            onClick={() => {
                                setSheet('split');
                            }}
                        >
                            <span className="nqp-rowmain"><span className="nqp-rowtitle">Split Payment…</span></span>
                            {tab.splits.length ? <Flag>Active</Flag> : null}
                        </RowButton>
                    </div>
                </Sheet>

                {/* Full tender modal sheet */}
                <Sheet
                    open={sheet === 'tender'}
                    onClose={() => setSheet(null)}
                    title={tab.isReturn ? 'Refund' : 'Payment'}
                    size={narrow ? 'bottom' : 'side'}
                    footer={renderTenderFooter(narrow ? vp.w : Math.min(580, vp.w * 0.96), 'full', true)}
                >
                    {renderTenderBody('full', narrow ? vp.w : Math.min(580, vp.w * 0.96), true)}
                </Sheet>

                <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

                <NavDrawer
                    open={navOpen}
                    onClose={() => setNavOpen(false)}
                    items={NAV}
                    current="sell"
                    width={narrow ? vp.w * 0.85 : 280}
                />

                <SettingsDrawer
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    prefs={prefs}
                    setPrefs={setPrefs}
                    T={T}
                    vp={vp}
                    width={narrow ? vp.w : Math.min(480, vp.w * 0.96)}
                    warehouses={warehouses}
                    banks={banks}
                    taxRates={parsedTaxRates}
                />

                <Toasts
                    ns="nqp"
                    items={toasts}
                    onAction={onToastAction}
                    onDismiss={(t) => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
                />
            </div>
        </>
    );
}
