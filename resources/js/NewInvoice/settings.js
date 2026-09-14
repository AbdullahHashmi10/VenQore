/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — the settings model, and Auto                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Same two kinds of setting as the register, and the same rule about where they
 * live.
 *
 *   comp   THE COMPOSITION — geometry. Whether the customer-and-details block is
 *          open or one line, where the summary goes, what it does while you
 *          scroll, how wide it is, and how dense the line table is. Read by
 *          composeDocument(). Every value is a WISH; the measured floors clamp
 *          it, so nothing here can produce an illegal layout.
 *
 *   ops    THE OPERATIONAL SETTINGS — once per setup, shift or month. Their
 *          budget on the working surface is zero.
 *
 * ── AUTO ────────────────────────────────────────────────────────────────────
 * You pick how you work, once. Auto then chooses the arrangement for whatever
 * screen the editor is open on and re-picks when that changes. Touch a knob and
 * it drops to Manual, with one tap back.
 *
 * Auto is per PROFILE AND per DOCUMENT TYPE, because a stock audit on a
 * warehouse tablet and a Pro purchase bill on a 1920 are not the same editor —
 * and the type already declares the density it wants.
 */

import { presetDocument } from '@/LayoutLaw/engine';
import { LAW } from '@/LayoutLaw/law';
import { typeById } from './fields';

export const PROFILES = [
    {
        id: 'balanced',
        name: 'Balanced',
        note: 'Details open, summary on the right. The default.',
        family: { desk: 'panel', short: 'wide', tablet: 'stack', phone: 'touch' },
    },
    {
        id: 'items',
        name: 'Items first',
        note: 'Collapse the customer block and give the width to the lines.',
        family: { desk: 'wide', short: 'focus', tablet: 'focus', phone: 'touch' },
    },
    {
        id: 'ledger',
        name: 'Accounting',
        note: 'Ten line columns, twelve header fields, the full summary.',
        family: { desk: 'pro', short: 'wide', tablet: 'stack', phone: 'touch' },
    },
    {
        id: 'touch',
        name: 'Touch',
        note: 'Warehouse tablet or phone: cards, one action, nothing else.',
        family: { desk: 'touch', short: 'touch', tablet: 'touch', phone: 'touch' },
    },
];

export const DEFAULT_OPS = {
    uiScale: 1,
    senior: false,
    defaultTax: 1,            // TAX_RATES id — read by EVERY type, not just the invoice
    taxInclusive: false,
    roundOff: true,           // a document property, applied once
    defaultTerms: 'net30',
    defaultLocation: 1,
    defaultAccount: 1,
    defaultCurrency: 'PKR',
    autoNumber: true,
    requireLocation: true,    // the server needs it; so the field is resident
    confirmZeroCost: true,
    showMargin: false,
    printOnSave: false,
};

export const DEFAULT_PERMS = {
    'documents.create': true,
    'documents.discount': true,
    'documents.price_override': true,
    'documents.delete_line': true,
    'documents.post': true,
};

export const DEFAULTS = {
    auto: true,
    profile: 'balanced',
    preset: 'panel',
    type: 'sales_invoice',
    comp: presetDocument('panel'),
    ops: { ...DEFAULT_OPS },
    perms: { ...DEFAULT_PERMS },
    rail: true,
};

/* ── Which band of screen is this? ───────────────────────────────────────── */
export function screenBand(vw, vh) {
    if (vw <= LAW.pos.phoneMax) return 'phone';
    if (vw < LAW.measuredFloors.doc_table_full + LAW.measuredFloors.doc_summary_min) return 'tablet';
    return vh < 800 ? 'short' : 'desk';
}

export function autoPreset(profileId, vw, vh) {
    const p = PROFILES.find((x) => x.id === profileId) || PROFILES[0];
    return p.family[screenBand(vw, vh)];
}

/**
 * Auto's answer as a full composition. The one thing it takes from the DOCUMENT
 * rather than the screen is the density: every type already declares the density
 * it wants (a purchase bill asks for Pro, an expense for Simple), and overriding
 * that from a screen-size profile would be the screen deciding what the document
 * is. The width can still veto it, visibly, in the read-out.
 */
export function autoComposition(profileId, typeId, vw, vh) {
    const id = autoPreset(profileId, vw, vh);
    const comp = presetDocument(id);
    const type = typeById(typeId);
    const order = LAW.document.density.map((d) => d.id);
    // THE DOCUMENT DECIDES THE DENSITY; only the Accounting profile raises it.
    // A type's declared density is its default — an expense is a simple document
    // by nature, and giving it Standard's seven summary rows means five of them
    // read 0.00 forever. Touch never asks for more than Simple whatever the type
    // wants, because a warehouse tablet is not where you read a tax breakdown.
    comp.density = id === 'touch' ? 'simple'
        : profileId === 'ledger'
            ? order[Math.max(order.indexOf(comp.density), order.indexOf(type.density))]
            : type.density;
    return { preset: id, comp };
}

/* ── Persistence — per user AND per device ───────────────────────────────── */
const KEY = 'venqore.newinvoice.prefs.v1';
const scoped = (userId, dev) => `${KEY}.${userId ?? 'anon'}.${dev ?? 'this'}`;

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
    const base = {
        ...DEFAULTS,
        comp: presetDocument('panel'),
        ops: { ...DEFAULT_OPS },
        perms: { ...DEFAULT_PERMS },
    };
    try {
        const raw = localStorage.getItem(scoped(userId, deviceId()));
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
    try { localStorage.setItem(scoped(userId, deviceId()), JSON.stringify(prefs)); } catch { /* private mode */ }
}

/* ── Draft rescue ────────────────────────────────────────────────────────────
   A half-typed invoice survives a reload. Same rule as the register's cart:
   automatic, scoped per user and device, and no UI beyond the toast. */
const DRAFT_KEY = 'venqore.newinvoice.draft.v1';
const draftKey = (userId) => `${DRAFT_KEY}.${userId ?? 'anon'}.${deviceId()}`;

export function saveDraft(userId, doc) {
    try { localStorage.setItem(draftKey(userId), JSON.stringify({ at: Date.now(), doc })); } catch { /* ignore */ }
}

export function loadDraft(userId) {
    try {
        const raw = localStorage.getItem(draftKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || Date.now() - parsed.at > 24 * 3600 * 1000) return null;
        return parsed.doc;
    } catch { return null; }
}

export function clearDraft(userId) {
    try { localStorage.removeItem(draftKey(userId)); } catch { /* ignore */ }
}
