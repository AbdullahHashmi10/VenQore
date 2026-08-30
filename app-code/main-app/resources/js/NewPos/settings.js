/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — the settings model, and Auto                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Two kinds of setting live here and they are not the same kind of thing.
 *
 *   comp   THE COMPOSITION — geometry. Where the catalog goes and how much
 *          room it gets, how the cart and the tender split, whether the tender
 *          is a column, a bar or a button, whether there is a floor plan.
 *          Read by composeTerminal(). Every value is a WISH: the measured
 *          floors clamp it, so no setting here can produce an illegal layout.
 *
 *   ops    THE OPERATIONAL SETTINGS — rank 3 in the capability inventory.
 *          Once per setup, shift or month. Their budget on the working surface
 *          is ZERO: a monthly control docked permanently is 30 days of noise
 *          for 1 day of use. They live in the drawer and nowhere else.
 *
 * ── AUTO ────────────────────────────────────────────────────────────────────
 * Auto does not guess what business you are in — it cannot, and guessing wrong
 * is worse than asking. You pick a PROFILE once; Auto then picks the geometry
 * for whatever screen the register is standing on, and re-picks when that
 * changes. Touch any geometry knob and it drops to Manual, with one tap back.
 *
 * Persistence is per user AND per device, because the same cashier on a phone
 * and on the counter terminal does not want the same register.
 */

import { presetComposition } from '@/LayoutLaw/engine';
import { LAW } from '@/LayoutLaw/law';

export const PROFILES = [
    {
        id: 'scan',
        name: 'Scanner-driven',
        note: 'Large inventory, barcode-first. Pharmacy, hardware, distribution.',
        family: { desk: 'scan', short: 'scan', tablet: 'scan', phone: 'counter' },
    },
    {
        id: 'retail',
        name: 'General retail',
        note: 'Staff both scan and browse. 200–2,000 SKUs.',
        family: { desk: 'column', short: 'stack', tablet: 'row', phone: 'counter' },
    },
    {
        id: 'visual',
        name: 'Browse-led',
        note: 'The product is the interface. Café, QSR, boutique.',
        family: { desk: 'grid', short: 'stack', tablet: 'row', phone: 'counter' },
    },
    {
        id: 'table',
        name: 'Table service',
        note: 'The unit of work is the table, not the sale.',
        family: { desk: 'table', short: 'table', tablet: 'table', phone: 'counter' },
    },
];

export const RETURN_POLICIES = [
    { id: 'reference', label: 'Reference required', note: 'A return must load an original invoice.' },
    { id: 'party_or_ref', label: 'Customer or reference', note: 'Either identifies the original sale.' },
    { id: 'open', label: 'Open returns', note: 'Any item may be returned without a reference.' },
];

export const DEFAULT_OPS = {
    senior: false,          // large text mode
    uiScale: 1,             // interface scale
    autoPrint: true,        // auto-print on complete
    openDrawerOnCash: true, // hardware
    defaultTax: 1,          // TAX_RATES index
    taxMode: 'exclusive',   // inclusive | exclusive
    returnPolicy: 'reference',
    returnWindowDays: 14,   // enforced by the policy — was parsed and discarded
    allowOversell: false,   // stop_sale_negative_stock, inverted
    roundOff: true,
    discountPresets: [5, 10, 15, 20],
    autoFillCash: true,
    showMargin: false,
    confirmBackorder: true,
    warehouse: 1,
    bank: 1,
};

/** Permissions the register actually enforces at the control. */
export const DEFAULT_PERMS = {
    'pos.checkout': true,
    'pos.void_item': true,
    'pos.refund': true,
    'pos.price_override': true,
    'pos.discount': true,
    'pos.open_drawer': true,
};

export const BUSINESS_SUGGESTIONS = [
    {
        id: 'retail',
        title: 'General Retail & Mart',
        tag: 'Standard',
        icon: '🛍️',
        desc: 'Product catalog on side, fast cart, instant payment. Best for general retail, grocery, mini-marts, apparel.',
        profile: 'retail',
        preset: 'column',
        ops: { senior: false, autoPrint: true },
    },
    {
        id: 'scan',
        title: 'Barcode / High-Speed Counter',
        tag: 'High Speed',
        icon: '⚡',
        desc: 'No catalog clutter. 100% focused on barcode scanning and keyboard speed. Best for pharmacy, busy checkout, wholesale.',
        profile: 'scan',
        preset: 'scan',
        ops: { senior: false, autoPrint: true, autoFillCash: true },
    },
    {
        id: 'visual',
        title: 'Cafe, Bakery & Food',
        tag: 'Visual Touch',
        icon: '☕',
        desc: 'Touch grid with prominent categories and item tiles. Built for touchscreens, cafes, bakeries, fast food.',
        profile: 'visual',
        preset: 'grid',
        ops: { senior: false, autoPrint: true },
    },
    {
        id: 'simple',
        title: 'Simple / Non-Techie Counter',
        tag: 'Easy & Clear',
        icon: '✨',
        desc: 'Large text, extra clear buttons, simple 2-step checkout without complex data. Perfect for single counters or non-technical staff.',
        profile: 'retail',
        preset: 'column',
        ops: { senior: true, autoPrint: true, autoFillCash: true },
    },
    {
        id: 'table',
        title: 'Restaurant & Table Service',
        tag: 'Dine-In',
        icon: '🍽️',
        desc: 'Table floor plan management, hold/recall orders by table, and bill splitting. Best for dine-in restaurants & salons.',
        profile: 'table',
        preset: 'table',
        ops: { senior: false, autoPrint: true },
    },
];

export const DEFAULTS = {
    auto: true,
    profile: 'retail',
    preset: 'column',
    comp: presetComposition('column'),
    ops: { ...DEFAULT_OPS },
    perms: { ...DEFAULT_PERMS },
    rail: true,
    wizardCompleted: false,
};

/* ── Which band of screen is this? ───────────────────────────────────────── */
export function screenBand(vw, vh) {
    if (vw <= LAW.pos.phoneMax) return 'phone';
    if (vw < LAW.pos.catalogResidentMinVw) return 'tablet';
    return vh < 760 ? 'short' : 'desk';
}

/** Auto's answer: a preset id for this profile on this screen. */
export function autoPreset(profileId, vw, vh) {
    const p = PROFILES.find((x) => x.id === profileId) || PROFILES[1];
    return p.family[screenBand(vw, vh)];
}

/**
 * Auto's answer as a full composition. The floor plan is the one thing Auto
 * upgrades beyond the preset: a floor is a STEP on anything smaller than a very
 * wide desktop, and a column only where the width carries one for free. The law
 * demotes it back if that turns out to be optimistic.
 */
export function autoComposition(profileId, vw, vh) {
    const id = autoPreset(profileId, vw, vh);
    const comp = presetComposition(id);
    if (profileId === 'table') comp.floor = vw >= 1900 ? 'left' : 'overlay';
    else comp.floor = 'off';
    return { preset: id, comp };
}

/* ── Persistence ─────────────────────────────────────────────────────────── */
const KEY = 'venqore.newpos.prefs.v1';

/** Per user AND per device — the same cashier wants a different register on a
 *  phone than on the counter terminal. */
const scopedKey = (userId, deviceId) => `${KEY}.${userId ?? 'anon'}.${deviceId ?? 'this'}`;

export function deviceId() {
    try {
        let d = localStorage.getItem('venqore.device.id');
        if (!d) {
            d = `dev-${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem('venqore.device.id', d);
        }
        return d;
    } catch { return 'this'; }
}

export function loadPrefs(userId) {
    const base = { ...DEFAULTS, comp: presetComposition('column'), ops: { ...DEFAULT_OPS }, perms: { ...DEFAULT_PERMS } };
    try {
        const raw = localStorage.getItem(scopedKey(userId, deviceId()));
        if (!raw) return base;
        const saved = JSON.parse(raw);
        return {
            ...base,
            ...saved,
            comp: saved.comp ? { ...base.comp, ...saved.comp } : base.comp,
            ops: { ...base.ops, ...(saved.ops || {}) },
            perms: { ...base.perms, ...(saved.perms || {}) },
        };
    } catch { return base; }
}

export function savePrefs(userId, prefs) {
    try { localStorage.setItem(scopedKey(userId, deviceId()), JSON.stringify(prefs)); } catch { /* private mode */ }
}

/* ── Cart rescue ─────────────────────────────────────────────────────────────
   A crash, a reload, a closed lid: the cart survives. The shipped POS already
   did this and it is the single most valuable automatic behaviour in the
   register, so it stays automatic and gets no UI beyond the toast that says it
   happened. */
const CART_KEY = 'venqore.newpos.rescue.v1';

/* Scoped like the preferences are. An unscoped rescue key hands the next
   cashier on a shared till the previous one's open cart. */
const rescueKey = (userId) => `${CART_KEY}.${userId ?? 'anon'}.${deviceId()}`;

export function saveRescue(userId, tabs) {
    try { localStorage.setItem(rescueKey(userId), JSON.stringify({ at: Date.now(), tabs })); } catch { /* ignore */ }
}

export function loadRescue(userId) {
    try {
        const raw = localStorage.getItem(rescueKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Older than 12 hours is yesterday's cart, not a rescue.
        if (!parsed || Date.now() - parsed.at > 12 * 3600 * 1000) return null;
        return parsed;
    } catch { return null; }
}

export function clearRescue(userId) {
    try { localStorage.removeItem(rescueKey(userId)); } catch { /* ignore */ }
}
