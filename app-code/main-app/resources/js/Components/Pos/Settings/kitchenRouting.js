/* ==========================================================================
   Kitchen routing — the browser's copy of the rule
   ==========================================================================
   The server decides where a ticket goes (KitchenTicketService::
   stationResolver). This file mirrors that rule exactly so the settings
   preview can show which ticket each item will land on BEFORE anything is
   fired. If you change one, change the other.
   ========================================================================== */

export const PRINTER_OPTIONS = [
    { value: 'kitchen', label: 'Kitchen printer', desc: 'The printer set for kitchen tickets in VenQore Station.' },
    { value: 'bar',     label: 'Bar printer',     desc: 'A separate printer at the bar or drinks counter.' },
    { value: 'receipt', label: 'Receipt printer', desc: 'The till’s own receipt printer. Handy for a small café with one printer.' },
    { value: 'none',    label: 'Screen only',     desc: 'No paper. The order only shows on the kitchen screen.' },
];

export const printerLabel = v => (PRINTER_OPTIONS.find(o => o.value === v) || PRINTER_OPTIONS[0]).label;

export const STATION_HUES = ['#F59E0B', '#0EA5E9', '#EF4444', '#A855F7', '#84CC16', '#EC4899', '#14B8A6', '#6366F1'];

/* Suggestions offered when adding a station, in the order kitchens ask for them. */
export const STATION_IDEAS = ['Bar', 'Drinks', 'Grill', 'Fryer', 'Cold prep', 'Pizza', 'Pasta', 'Desserts', 'Bakery', 'Tandoor'];

export const DEFAULT_ROUTING = {
    mode: 'single',
    main_name: 'Kitchen',
    main_printer: 'kitchen',
    use_product_tags: true,
    stations: [],
};

const PRINTERS = new Set(PRINTER_OPTIONS.map(o => o.value));
const idOk = v => typeof v === 'string' || typeof v === 'number';

export function normaliseRouting(raw) {
    let r = raw;
    if (typeof r === 'string') { try { r = JSON.parse(r); } catch (_) { r = null; } }
    if (!r || typeof r !== 'object') r = {};
    const main = String(r.main_name || '').trim().slice(0, 32) || 'Kitchen';
    const seen = new Set([main.toLowerCase()]);
    const stations = [];
    for (const s of Array.isArray(r.stations) ? r.stations.slice(0, 24) : []) {
        if (!s || typeof s !== 'object') continue;
        const name = String(s.name || '').trim().slice(0, 32);
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        stations.push({
            id: String(s.id || `st_${Math.random().toString(36).slice(2, 10)}`),
            name,
            printer: PRINTERS.has(s.printer) ? s.printer : 'kitchen',
            categories: [...new Set((s.categories || []).filter(idOk).map(String))],
            products: [...new Set((s.products || []).filter(idOk).map(String))],
        });
    }
    return {
        mode: r.mode === 'stations' ? 'stations' : 'single',
        main_name: main,
        main_printer: PRINTERS.has(r.main_printer) ? r.main_printer : 'kitchen',
        use_product_tags: r.use_product_tags !== false,
        stations,
    };
}

/** Same order as the server: product, then category, then the name on the product. */
export function resolveStation(routing, item) {
    const main = { name: routing.main_name, printer: routing.main_printer, main: true };
    if (routing.mode !== 'stations' || !routing.stations.length) return main;
    const pid = item?.id != null ? String(item.id) : '';
    const cid = item?.category_id != null ? String(item.category_id) : '';
    for (const s of routing.stations) if (pid && s.products.includes(pid)) return { name: s.name, printer: s.printer, id: s.id };
    for (const s of routing.stations) if (cid && s.categories.includes(cid)) return { name: s.name, printer: s.printer, id: s.id };
    if (routing.use_product_tags) {
        const tag = String(item?.kitchen_station || '').trim().toLowerCase();
        if (tag) for (const s of routing.stations) if (s.name.toLowerCase() === tag) return { name: s.name, printer: s.printer, id: s.id };
    }
    return main;
}

export function hueFor(routing, stationName) {
    const i = routing.stations.findIndex(s => s.name === stationName);
    return i < 0 ? 'var(--vq-accent)' : STATION_HUES[i % STATION_HUES.length];
}
