/* ==========================================================================
   The register, drawn small — by the same engine the register uses
   ==========================================================================
   The old preview drew coloured blocks labelled "Catalog", "Cart" and
   "Payment" with pixel widths under them. It was accurate and nobody could
   read it. This one draws the actual register: your own products on the
   buttons (when the catalog has loaded), an order with lines in it, the teal
   total panel, the Pay button, the top-bar buttons you switched on, and the
   floor when this till is on the restaurant screen.

   It is still not a picture someone drew. `composeFor` asks the layout engine
   exactly the question the live register asks, for the device chosen above
   the preview — so when a phone cannot carry a product column the preview
   shows a Products button, because the real phone will too.
   ========================================================================== */

import React, { useMemo } from 'react';
import {
    Unlock, Pause, History, Undo2, Printer, Keyboard, Maximize2, Settings, Plus, Search,
    ChefHat, Tv, ScanBarcode, Users,
} from 'lucide-react';
import { composeFor } from '@/Layout/usePosLayout';

export const PREVIEW_DEVICES = [
    { id: 'phone',   label: 'Phone',   vw: 390,  vh: 780,  kind: 'phone' },
    { id: 'tablet',  label: 'Tablet',  vw: 1024, vh: 720,  kind: 'tablet' },
    { id: 'laptop',  label: 'Laptop',  vw: 1366, vh: 720,  kind: 'laptop' },
    { id: 'desktop', label: 'Big screen', vw: 1920, vh: 1080, kind: 'desktop' },
];

const HUES = ['#23C4A6', '#F59E0B', '#6366F1', '#EF4444', '#0EA5E9', '#A855F7', '#84CC16', '#EC4899'];

const DEMO_RETAIL = [
    { name: 'Basmati Rice 5kg', price: 2450, stock: 34 }, { name: 'Cooking Oil 1L', price: 690, stock: 12 },
    { name: 'Green Tea 100g', price: 380, stock: 0 }, { name: 'Dish Soap', price: 220, stock: 51 },
    { name: 'Biscuits Family', price: 150, stock: 88 }, { name: 'Mineral Water', price: 90, stock: 140 },
    { name: 'Shampoo 400ml', price: 845, stock: 7 }, { name: 'Sugar 1kg', price: 160, stock: 63 },
    { name: 'Washing Powder', price: 520, stock: 19 }, { name: 'Milk Pack 1L', price: 280, stock: 40 },
    { name: 'Toothpaste', price: 310, stock: 22 }, { name: 'Matchbox', price: 20, stock: 300 },
];
const DEMO_FOOD = [
    { name: 'Zinger Burger', price: 650, stock: null }, { name: 'Loaded Fries', price: 420, stock: null },
    { name: 'Mint Lemonade', price: 280, stock: null }, { name: 'Chicken Karahi', price: 1650, stock: null },
    { name: 'Garlic Naan', price: 90, stock: null }, { name: 'Caesar Salad', price: 720, stock: null },
    { name: 'Alfredo Pasta', price: 980, stock: null }, { name: 'Cappuccino', price: 450, stock: null },
    { name: 'Molten Lava Cake', price: 560, stock: null }, { name: 'Club Sandwich', price: 690, stock: null },
];

/** Normalise whatever the catalog loaded into the shape the preview draws. */
export function sampleItems(products, restaurant) {
    const real = (Array.isArray(products) ? products : [])
        .filter(p => p && p.name)
        .slice(0, 14)
        .map((p, i) => ({
            id: p.id,
            name: String(p.name),
            price: Number(p.price ?? p.selling_price ?? 0) || 0,
            stock: p.type === 'service' || p.is_service ? null
                : (p.stock_quantity !== undefined && p.stock_quantity !== null ? Number(p.stock_quantity) : null),
            image: p.image_url || p.image_path || null,
            category_id: p.category_id ?? p.category?.id ?? null,
            category: p.category?.name || p.category_name || null,
            hue: HUES[i % HUES.length],
        }));
    if (real.length >= 4) return { items: real, real: true };
    const demo = (restaurant ? DEMO_FOOD : DEMO_RETAIL).map((d, i) => ({ ...d, id: `demo-${i}`, hue: HUES[i % HUES.length] }));
    return { items: demo, real: false };
}

const BAR_ICONS = {
    returns: Undo2, parked: Pause, recent: History, drawer: Unlock,
    keys: Keyboard, fullscreen: Maximize2, kitchen: ChefHat, queue: Tv,
};

function Tile({ item, shape, pictures, stockBadge, hideOos, inCart, money }) {
    if (hideOos && item.stock === 0) return null;
    const showImg = pictures && shape !== 'pills';
    return (
        <span className="pv-tile" data-shape={shape} data-in={inCart ? '1' : '0'} style={{ '--pv-hue': item.hue }}>
            {showImg && (
                <span
                    className="pv-tile-img"
                    style={item.image ? { backgroundImage: `url("${String(item.image).replace(/"/g, '%22')}")` } : undefined}
                />
            )}
            <span className="pv-tile-body">
                <span className="pv-tile-name">{item.name}</span>
                <span className="pv-tile-price vqs-num">{money(item.price)}</span>
            </span>
            {stockBadge && item.stock !== null && item.stock !== undefined && shape !== 'pills' && (
                <span className="pv-tile-stock" data-out={item.stock <= 0 ? '1' : '0'}>
                    {item.stock <= 0 ? 'Sold out' : `${item.stock} left`}
                </span>
            )}
        </span>
    );
}

export default function RegisterLivePreview({
    comp, device, senior, scale, rail, terminal = 'counter',
    surface = {}, preparesOrders = false, isOnline = true,
    catalogShape = 'auto', categoryOrientation = 'horizontal', showImages = true,
    showStock = true, hideOutOfStock = false, isStockTracking = true,
    products, categories = [], money = v => String(v),
    enableTax = false, taxRate = 0, roundOff = false, serviceChargePct = 0,
    focus = null, floorView = 'cards', showCatalogSheet = false,
}) {
    const restaurant = terminal === 'table';
    const layout = useMemo(
        () => composeFor(comp, device.vw, device.vh, { senior, scale, terminal, rail }),
        [comp, device, senior, scale, terminal, rail],
    );
    const { items } = useMemo(() => sampleItems(products, restaurant || preparesOrders), [products, restaurant, preparesOrders]);

    if (!layout) {
        return <div className="pv-card"><p className="vqs-preview-cap">The preview could not be drawn for this screen.</p></div>;
    }

    const cart = items.slice(0, 4).map((it, i) => ({ ...it, qty: i === 1 ? 2 : 1, sent: restaurant && i < 2 }));
    const inCartIds = new Set(cart.map(c => c.id));
    const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
    const tax = enableTax ? subtotal * (Number(taxRate) || 0) / 100 : 0;
    const service = restaurant ? subtotal * (Number(serviceChargePct) || 0) / 100 : 0;
    const raw = subtotal + tax + service;
    const total = roundOff ? Math.round(raw) : raw;
    const rounding = total - raw;

    const cat = layout.catalog;
    const flr = layout.floor;
    const side = comp?.tenderSide || 'right';
    const tenderCol = layout.tender.mode === 'column';
    const showOrder = comp?.showOrder !== false;
    const stacked = layout.regime !== 'columns';
    const avail = Math.max(1, layout.avail);
    const pct = px => `${Math.max(6, (px / avail) * 100)}%`;
    const fitShape = (variant, tiles) => {
        if (catalogShape === 'pills') return 'pills';
        if (catalogShape === 'rows') return 'rows';
        if (catalogShape === 'large_cards') return 'large';
        if (catalogShape === 'cards') return 'cards';
        return (variant !== 'list' || tiles > 0) ? 'large' : 'rows';
    };

    /* ── panes ───────────────────────────────────────────────────────── */
    const scanInCatalog = comp?.scanBar === 'catalog' || (comp?.scanBar !== 'order' && cat && (cat.mode === 'left' || cat.mode === 'right'));

    const Cats = ({ vertical }) => {
        const names = (categories.length ? categories.map(c => c.name) : (restaurant || preparesOrders
            ? ['Burgers', 'Drinks', 'Desserts', 'Mains'] : ['Grocery', 'Personal care', 'Drinks', 'Household'])).slice(0, vertical ? 7 : 5);
        return vertical ? (
            <span className="pv-cat-side">
                <span className="pv-cat" data-on="1">All</span>
                {names.map(n => <span key={n} className="pv-cat">{n}</span>)}
            </span>
        ) : (
            <span className="pv-cats">
                <span className="pv-cat" data-on="1">All items</span>
                {names.map(n => <span key={n} className="pv-cat">{n}</span>)}
            </span>
        );
    };

    const CatalogPane = ({ kind, style }) => {
        const variant = kind === 'sheet' ? 'grid-3up' : (cat?.fit || 'grid-3up');
        const tiles = kind === 'sheet'
            /* Same numbers the register uses for its full-screen catalog. */
            ? (layout.regime === 'phone' ? 2 : 4)
            : (cat?.tiles || 0);
        const shape = fitShape(variant, tiles);
        const cols = shape === 'rows' ? 1
            : shape === 'pills' ? Math.max(2, Math.min(6, (tiles || 3) + 1))
            : Math.max(1, Math.min(8, tiles || (variant === 'grid-3up' ? 3 : 2)));
        const band = kind === 'band';
        const bandCols = Math.max(3, Math.min(9, cat?.tiles || 6));
        const vertical = categoryOrientation === 'vertical';
        return (
            <span className="pv-pane" style={style} data-flash={focus === 'catalog' ? '1' : '0'}>
                <span className="pv-pane-h">{kind === 'sheet' ? 'Products — opened from the Products button' : 'Products'}</span>
                {scanInCatalog && !band && <span className="pv-scan"><Search size={6} /> Scan or search…</span>}
                {!vertical && <Cats />}
                <span style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }}>
                    {vertical && <Cats vertical />}
                    <span
                        className="pv-tiles"
                        style={{ gridTemplateColumns: `repeat(${band ? bandCols : cols}, minmax(0, 1fr))` }}
                    >
                        {items.map(it => (
                            <Tile
                                key={it.id}
                                item={it}
                                shape={band && shape === 'rows' ? 'cards' : shape}
                                pictures={showImages}
                                stockBadge={showStock && isStockTracking && !restaurant}
                                hideOos={hideOutOfStock && isStockTracking}
                                inCart={inCartIds.has(it.id)}
                                money={money}
                            />
                        ))}
                    </span>
                </span>
            </span>
        );
    };

    const CartPane = ({ style }) => (
        <span className="pv-pane" style={style} data-flash={focus === 'cart' ? '1' : '0'}>
            <span className="pv-pane-h">
                {restaurant ? <>Table T4 · <Users size={6} /> 3 guests</> : 'Current order'}
                <span style={{ marginLeft: 'auto' }}>{cart.length} items</span>
            </span>
            {!scanInCatalog && <span className="pv-scan"><ScanBarcode size={6} /> Scan or search, then press Enter</span>}
            <span className="pv-lines">
                {cart.map((l, i) => (
                    <span key={l.id} className="pv-line" data-active={i === cart.length - 1 ? '1' : '0'}>
                        <span className="pv-line-qty">{l.qty}</span>
                        <span className="pv-line-name">{l.name}</span>
                        {l.sent && <span className="pv-line-sent">SENT</span>}
                        <span className="pv-line-amt">{money(l.price * l.qty)}</span>
                    </span>
                ))}
            </span>
            {restaurant && preparesOrders && (
                <span className="pv-dock" style={{ padding: 3 }}>
                    <span className="pv-dock-btn">Send to kitchen</span>
                </span>
            )}
        </span>
    );

    const TotalBlock = () => (
        <span className="pv-total">
            <span className="pv-total-row"><span>Subtotal</span><b>{money(subtotal)}</b></span>
            {tax > 0 && <span className="pv-total-row"><span>Tax {taxRate}%</span><b>{money(tax)}</b></span>}
            {service > 0 && <span className="pv-total-row"><span>Service charge {serviceChargePct}%</span><b>{money(service)}</b></span>}
            {roundOff && Math.abs(rounding) > 0.0001 && <span className="pv-total-row"><span>Rounding</span><b>{money(rounding)}</b></span>}
            <span className="pv-total-big"><span>Total</span><b>{money(total)}</b></span>
        </span>
    );

    const TenderPane = ({ style }) => (
        <span className="pv-pane" style={style} data-flash={focus === 'tender' ? '1' : '0'}>
            <span className="pv-pane-h">Payment</span>
            <span className="pv-tender">
                <TotalBlock />
                <span className="pv-methods">
                    <span className="pv-method" data-on="1">Cash</span>
                    <span className="pv-method">Card</span>
                    <span className="pv-method">Bank</span>
                </span>
                <span className="pv-tendered"><span>Received</span><b>{money(total)}</b></span>
                <span className="pv-paybtn">Pay {money(total)}</span>
            </span>
        </span>
    );

    const FloorPane = ({ style, full }) => {
        const tables = [
            ['T1', 'ordered'], ['T2', 'free'], ['T3', 'kitchen'], ['T4', 'ordered'],
            ['T5', 'alert'], ['T6', 'free'], ['T7', 'seated'], ['T8', 'free'], ['P1', 'free'],
        ];
        const shape = floorView === 'grid' ? 'square' : floorView === 'list' ? 'row' : undefined;
        const cols = floorView === 'list' ? 1 : full ? 4 : floorView === 'grid' ? 3 : 2;
        return (
            <span className="pv-pane" style={style} data-flash={focus === 'floor' ? '1' : '0'}>
                <span className="pv-pane-h">Tables <span style={{ marginLeft: 'auto' }}>4 open · 4 free</span></span>
                <span className="pv-cats"><span className="pv-cat" data-on="1">All</span><span className="pv-cat">Main hall</span><span className="pv-cat">Patio</span></span>
                <span className="pv-floor" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                    {tables.map(([c, t]) => (
                        <span key={c} className="pv-table" data-tone={t} data-shape={shape}>
                            <b>{c}</b>
                            {shape !== 'square' && <small>{t === 'free' ? 'Free · 4 seats' : t === 'alert' ? 'Waiting 18m' : t === 'kitchen' ? 'In kitchen' : 'Ordered'}</small>}
                        </span>
                    ))}
                </span>
            </span>
        );
    };

    /* Column tracks, in the order the register lays them out. */
    const tracks = [];
    if (!stacked) {
        if (tenderCol && side === 'left') tracks.push(['tender', pct(layout.tender.px)]);
        if (cat && cat.mode === 'left') tracks.push(['catalog', pct(cat.px)]);
        if (flr && flr.mode === 'left') tracks.push(['floor', pct(flr.px)]);
        if (!(showOrder === false && cat && (cat.mode === 'left' || cat.mode === 'right'))) tracks.push(['cart', 'minmax(0,1fr)']);
        else tracks[tracks.length - 1][1] = 'minmax(0,1fr)';
        if (tenderCol && side === 'right') tracks.push(['tender', pct(layout.tender.px)]);
        if (cat && cat.mode === 'right') tracks.push(['catalog', pct(cat.px)]);
    }
    const floorIsStep = restaurant && flr && flr.mode !== 'left';
    /* On the Product buttons page, a catalog that lives behind a button is
       drawn OPEN, so the style being chosen is actually visible. */
    const sheet = showCatalogSheet && (!cat || cat.mode === 'overlay') && comp?.catalog?.mode !== 'off';
    const bandRows = cat && cat.h ? Math.max(1, cat.rows || 1) : 0;
    const band = () => <CatalogPane kind="band" style={{ flex: '0 0 auto', height: `${Math.min(46, 14 + bandRows * 16)}%` }} />;
    const zoom = (senior ? 1.18 : 1) * Math.max(0.9, Math.min(1.3, Number(scale) || 1));

    const barButtons = Object.entries(surface || {})
        .filter(([id, on]) => on && BAR_ICONS[id] && ((id !== 'kitchen' && id !== 'queue') || preparesOrders));

    return (
        <div className="pv-device" data-kind={device.kind}>
            <div className="pv-screen" style={{ aspectRatio: `${device.vw} / ${device.vh}` }}>
                {/* the register's own bar */}
                <div className="pv-bar" data-flash={focus === 'bar' ? '1' : '0'} style={focus === 'bar' ? { boxShadow: 'inset 0 0 0 1.5px var(--vq-accent)' } : undefined}>
                    <span className="pv-bar-tab">{restaurant ? 'T4' : 'Sale 1'}</span>
                    {!restaurant && <span className="pv-bar-tab" data-off="1">Sale 2</span>}
                    <span className="pv-bar-btn"><Plus /></span>
                    <span className="pv-bar-space" />
                    {surface?.online && <span className="pv-bar-dot" data-off={isOnline ? '0' : '1'} />}
                    {device.kind !== 'phone' && barButtons.map(([id]) => {
                        const I = BAR_ICONS[id];
                        return <span key={id} className="pv-bar-btn"><I /></span>;
                    })}
                    {device.kind !== 'phone' && surface?.printer && <span className="pv-bar-btn"><Printer /></span>}
                    <span className="pv-bar-btn"><Settings /></span>
                </div>

                <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex' }}>
                    {rail && device.kind !== 'phone' && <span className="pv-rail"><i /><i /><i /><i /><i /></span>}
                    <div className="pv-work" style={{ zoom }}>
                        {!sheet && cat && cat.mode === 'top' && band()}

                        {sheet ? (
                            <div className="pv-row" style={{ gridTemplateRows: 'minmax(0,1fr)' }}>
                                <CatalogPane kind="sheet" />
                            </div>
                        ) : stacked ? (
                            <div className="pv-row" style={{ gridTemplateRows: 'minmax(0,1fr)' }}>
                                {floorIsStep ? <FloorPane full /> : <CartPane />}
                            </div>
                        ) : (
                            <div className="pv-row" style={{ gridTemplateColumns: tracks.map(t => t[1]).join(' ') }}>
                                {tracks.map(([k], i) => (
                                    k === 'catalog' ? <CatalogPane key={i} />
                                    : k === 'floor' ? <FloorPane key={i} />
                                    : k === 'tender' ? <TenderPane key={i} />
                                    : floorIsStep ? <FloorPane key={i} full /> : <CartPane key={i} />
                                ))}
                            </div>
                        )}

                        {tenderCol && side === 'bottom' && !stacked && (
                            <div className="pv-dockbar" style={{ background: 'none', padding: 0 }}>
                                <span style={{ flex: 1 }}><TotalBlock /></span>
                                <span className="pv-paybtn" style={{ width: '28%', height: 22 }}>Pay</span>
                            </div>
                        )}

                        {cat && cat.mode === 'bottom' && band()}

                        {layout.tender.mode === 'bar' ? (
                            <div className="pv-dockbar" style={focus === 'tender' ? { boxShadow: '0 0 0 2px var(--vq-accent)' } : undefined}>
                                <span>Total</span>
                                <b>{money(total)}</b>
                                {layout.dock.filter(d => d.id !== 'tender').map(d => (
                                    <span key={d.id} className="pv-dock-btn" style={{ flex: '0 0 auto', padding: '0 5px', height: 11 }}>
                                        {d.id === 'catalog' ? 'Products' : d.id === 'floor' ? 'Tables' : d.label}
                                    </span>
                                ))}
                                <span className="pv-paybtn">Pay</span>
                            </div>
                        ) : layout.dock.length > 0 && (
                            <div className="pv-dock">
                                {layout.dock.map(d => (
                                    <span key={d.id} className="pv-dock-btn" data-primary={d.primary ? '1' : '0'}
                                          style={d.id === 'tender' && focus === 'tender' ? { boxShadow: '0 0 0 2px var(--vq-accent)' } : undefined}>
                                        {d.id === 'tender' ? `Pay ${money(total)}` : d.id === 'catalog' ? 'Products' : d.id === 'floor' ? 'Tables' : d.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {device.kind === 'desktop' && <div className="pv-stand" />}
        </div>
    );
}

/** What the engine changed from the wish, in plain words. */
export function plainNotes(comp, layout, device, terminal) {
    if (!layout || !comp) return [];
    const out = [];
    const on = device.kind === 'phone' ? 'a phone' : device.kind === 'tablet' ? 'a tablet' : device.kind === 'laptop' ? 'a laptop' : 'this screen';
    const wantCat = comp.catalog?.mode;
    if (wantCat && wantCat !== 'off' && wantCat !== 'overlay' && layout.catalog?.mode === 'overlay') {
        out.push(`On ${on} there is not enough room for the product list next to the order, so it opens from a "Products" button instead.`);
    }
    if (comp.tender === 'column' && layout.tender.mode !== 'column') {
        out.push(layout.tender.mode === 'bar'
            ? `On ${on} the payment panel becomes a slim bar with the total and a Pay button.`
            : `On ${on} payment opens full screen when you tap Pay.`);
    }
    if (terminal === 'table' && layout.floor && layout.floor.mode !== 'left') {
        out.push(`On ${on} the tables open full screen first; picking a table opens its order.`);
    }
    if (layout.catalog?.demoted) out.push(`Only ${layout.catalog.rows} row of products fits on ${on}; the rest scroll.`);
    return out;
}

