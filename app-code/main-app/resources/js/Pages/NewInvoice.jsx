/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  New invoice — one editor, thirteen documents, composed by its user       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Route: /new-invoice   ·   Controller: NewInvoiceController@index
 *
 * ── WHAT THIS IS ────────────────────────────────────────────────────────────
 * The document editor from `extras/Layout Law/venqore-document.html`, built as a
 * real page instead of a simulation — the same move as `/new-pos`, on the other
 * working surface. It runs against the REAL viewport, and its composer is the
 * settings drawer behind the gear rather than a documentation panel above the
 * screen.
 *
 * Eight of the thirteen document screens in the codebase are the same file
 * copy-pasted, with the labels swapped and a handful of fields silently dropped
 * from the payload. Here a TYPE IS A CONFIGURATION — see `NewInvoice/fields.js`
 * — and there is exactly one payload builder, so a field that renders is a field
 * that posts.
 *
 * ── WHAT IT IS NOT, YET ─────────────────────────────────────────────────────
 * Nothing here talks to the server. Products, parties, terms, accounts and
 * locations come from `@/NewInvoice/mock`. Saving shows the toast it would show
 * and prints the payload it would send — the payload is on screen, behind
 * ⋯ → "What this would post", because settling that contract is the point of
 * this page.
 *
 * ── THE ARRANGEMENT IS YOURS ────────────────────────────────────────────────
 * Collapse the customer block and hand the height to the items. Put the summary
 * on the right, under the lines, or nowhere. Decide what happens to it when you
 * scroll. Drag the divider. The law's job is not to choose; it is to stop your
 * choice from breaking — and to say so, in the read-out at the bottom of
 * Settings → Arrange, when it has to overrule you.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';

import '@/NewInvoice/newinvoice.css';
import { LAW, composeDocument, marginAt, presetDocument, docMetrics } from '@/LayoutLaw/engine';
import { Icon, Kbd, Money, Sheet, Toasts, useViewport } from '@/LayoutLaw/ui';
import {
    ACCOUNTS, LOCATIONS, NAV, OPENING_LINES, PRODUCTS, TAX_RATES, TERMS, TODAY,
    partiesFor, productById, searchProducts,
} from '@/NewInvoice/mock';
import {
    DEFAULTS, autoComposition, clearDraft, loadDraft, loadPrefs, savePrefs, saveDraft,
} from '@/NewInvoice/settings';
import { buildPayload, columnsFor, dueFromTerms, has, label, off, typeById } from '@/NewInvoice/fields';
import { DetailsZone, DockBar, LinesZone, SummaryZone, VSplit, keep, n0, nz, pct, r2 } from '@/NewInvoice/zones';
import {
    ActionsSheet, BreakdownSheet, KeysSheet, LineSheet, MoneySheet, NavDrawer, Palette,
    PartySheet, PayloadSheet, ProductSheet, RecentSheet, SourceSheet, TypeSheet,
} from '@/NewInvoice/sheets';
import SettingsDrawer from '@/NewInvoice/SettingsDrawer';

/* ════════════════════════════════════════════════════════════════════════════
   A DOCUMENT
   ════════════════════════════════════════════════════════════════════════════ */

/* A line id must be unique across a RESTORED draft too. `uidSeq` resets on every
   page load, so a document restored from localStorage already holding `l12`
   collided with the next line created — two <tr> with the same key, and
   patchLine/removeLine hitting both. The random suffix removes the whole class. */
let uidSeq = 1;
const uid = () => `l${uidSeq += 1}-${Math.random().toString(36).slice(2, 7)}`;
const idemKey = () => `idem-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

function newLine(product, qty = 1, disc = 0) {
    return {
        u: uid(),
        pid: product.id,
        name: product.name,
        sku: product.sku,
        hsn: product.hsn,
        qty,
        free: 0,
        uom: product.uom,
        rate: product.rate,
        cost: product.cost,
        disc,
        tax: product.tax,
        batch: '',
        note: '',
    };
}

function newDoc(type, ops, seq = 148) {
    const date = TODAY;
    const terms = ops.defaultTerms;
    return {
        type: type.id,
        docno: ops.autoNumber ? `${type.prefix}-${String(seq).padStart(6, '0')}` : '',
        party: off(type, 'party') ? null : partiesFor(type.side)[0],
        partyref: '',
        date,
        terms,
        // FIX · Terms WRITES the due date. The Net 7/15/30/60 select was never
        // submitted on any screen, and due_date was sent from a `dueDate` key
        // that no input wrote.
        due: dueFromTerms(date, terms),
        method: type.side === 'buy' ? 'Bank' : 'Credit',
        account: ops.defaultAccount,
        location: ops.defaultLocation,
        locationTo: 2,
        project: 1,
        currency: ops.defaultCurrency,
        fx: '1.0000',
        notes: '',
        lines: [],
        taxRate: ops.defaultTax,
        // Only a type that RENDERS the toggle carries the flag.
        taxInclusive: has(type, 'tax_inclusive_flag') ? ops.taxInclusive : false,
        discount: 0,
        shipping: 0,
        extra: 0,
        settled: 0,
        validUntil: '',
        expectedDate: '',
        frequency: 'Monthly',
        nextRun: '',
        activePaused: 'active',
        goodsStatus: 'Not received',
        status: 'Draft',
        category: '',
        reason: '',
        description: '',
        sourceDoc: '',
        businessPct: 100,
        taxAmount: 0,
        refundAccount: 1,
        landedCosts: 0,
        attachment: '',
        idem: idemKey(),
    };
}

/* ════════════════════════════════════════════════════════════════════════════
   THE PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function NewInvoice({ auth }) {
    const userId = auth?.user?.id ?? 'demo';
    const vp = useViewport();

    const [prefs, setPrefs] = useState(() => loadPrefs(userId));
    const [rankMode, setRankMode] = useState(false);
    const [setTab, setSetTab] = useState('arrange');
    useEffect(() => {
        const id = setTimeout(() => savePrefs(userId, prefs), 250);
        return () => clearTimeout(id);
    }, [userId, prefs]);

    /* The type is declared BELOW, off the active document, because a type
       belongs to a document and not to the preferences. `prefs.type` is only
       what a NEW tab starts as. Reading the editor's labels, fields, columns,
       validation and payload off one global while `computed` read them off the
       document meant tab 1 could be a sales invoice with ten lines while every
       label on it said Expense — and posting it sent `type: "expense"` with a
       142,753 total and no items. */

    const D = useMemo(
        () => composeDocument(prefs.comp, vp.w, vp.h, prefs.rail ? {} : { navW: 0 }),
        [prefs.comp, vp.w, vp.h, prefs.rail],
    );
    /* CAN this screen hold the block open at all? Not "does the wish say open"
       — the law overrides the wish below about 690px of height, and a toggle
       that writes a wish the law is going to ignore is a toggle that does
       nothing. Ask the law directly. */
    const canOpenDetails = useMemo(
        () => composeDocument({ ...prefs.comp, details: 'open' }, vp.w, vp.h, prefs.rail ? {} : { navW: 0 }).details.mode === 'open',
        [prefs.comp, vp.w, vp.h, prefs.rail],
    );
    const narrow = vp.w < 620;
    const M = docMetrics();

    /* ── the documents ───────────────────────────────────────────────────────
       Plural, because `tabs` is a capability the sales invoice switches on and
       Ctrl+T / Ctrl+W / Ctrl+Tab are on the document half of the keymap. A
       capability that exists only in the law is a capability that does not
       exist.

       `setDoc` keeps the single-document signature so every call site reads the
       same as it did — the tab index is resolved here and nowhere else. */
    const [docs, setDocs] = useState(() => {
        const d = newDoc(typeById(DEFAULTS.type), DEFAULTS.ops);
        d.lines = OPENING_LINES.map(({ pid, qty, disc }) => newLine(productById(pid), qty, disc));
        return [d];
    });
    const [active, setActive] = useState(0);
    const doc = docs[Math.min(active, docs.length - 1)];
    const type = typeById(doc.type);

    /* AUTO — the arrangement for this screen AND for the type of the document
       IN FRONT OF YOU. It reads `doc.type` for the same reason everything else
       now does. */
    useEffect(() => {
        if (!prefs.auto) return;
        const { preset, comp } = autoComposition(prefs.profile, doc.type, vp.w, vp.h);
        if (preset !== prefs.preset || JSON.stringify(comp) !== JSON.stringify(prefs.comp)) {
            setPrefs((p) => (p.auto ? { ...p, preset, comp } : p));
        }
    }, [prefs.auto, prefs.profile, doc.type, prefs.preset, prefs.comp, vp.w, vp.h]);
    /* Keyed by the document's own id, NOT by the tab index, and held in a ref
       so every callback below reads the current one. Closing over `active` and
       then forgetting to list `setDoc` in one dependency array is enough to send
       every edit to whichever tab was open on first render — which is exactly
       what happened, invisibly, because the fields are controlled by the tab you
       are looking at. */
    const activeIdRef = useRef(null);
    activeIdRef.current = docs[Math.min(active, docs.length - 1)]?.idem;
    const setDoc = useCallback((next) => {
        setDocs((ds) => ds.map((d) => (d.idem === activeIdRef.current
            ? (typeof next === 'function' ? next(d) : { ...d, ...next })
            : d)));
    }, []);
    const [selected, setSelected] = useState(null);
    const [openCard, setOpenCard] = useState(null);
    const [sheet, setSheet] = useState(null);
    const [pickerFor, setPickerFor] = useState(null);
    const [lineFor, setLineFor] = useState(null);
    const [navOpen, setNavOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState(PRODUCTS);
    const [touched, setTouched] = useState(false);

    const scrollRef = useRef(null);
    const undoRef = useRef({});
    const docsRef = useRef(docs);
    docsRef.current = docs;

    const anyOverlay = !!sheet || navOpen || settingsOpen || paletteOpen;
    const openLine = useCallback((u) => { setSelected(u); setLineFor(u); setSheet('line'); }, []);

    const set = useCallback((patch) => { setTouched(true); setDoc((d) => ({ ...d, ...patch })); }, [setDoc]);

    /* Only ONE of the thirteen has no lines. `has(type,'lines')` looked like the
       test and is not: goods receipt, stock transfer and stock audit never list
       `lines` in their `on` set — they list what is SPECIAL about their lines
       (ordered/received/remaining, qty-only, expected/counted/difference). Using
       the positive test silently emptied all three and replaced their tables
       with an expense's money form. */
    const hasLines = !has(type, 'no_lines');

    const toast = useCallback((text, opts = {}) => {
        const t = { id: `${Date.now()}-${Math.random()}`, text, ...opts };
        setToasts((ts) => [...ts.slice(-2), t]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), opts.ms || 3400);
        return t;
    }, []);

    /* Terms writes the due date — one control, not two — and the date stays
       editable, because a term is a default and not a cage. */
    /* A term is a DEFAULT, not a cage: it writes the due date until you write
       one yourself. The effect also re-fires on a tab switch (the deps change
       identity), which is how a hand-typed due date used to be silently reset
       by simply looking at another document and coming back. */
    useEffect(() => {
        if (!doc.terms || doc.dueTouched) return;
        const next = dueFromTerms(doc.date, doc.terms);
        if (next !== doc.due) setDoc((d) => ({ ...d, due: next }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc.idem, doc.terms, doc.date, doc.dueTouched]);

    /* ── the money, in one place ─────────────────────────────────────────── */
    const computed = useMemo(() => {
        /* A `no_lines` type does not READ the lines. It used to not HAVE them:
           switching to Expense deleted every line on the document, so a mis-tap
           in a thirteen-item list threw away ten minutes of typing and switching
           back gave you an empty invoice. The lines stay in state and this is
           the one place that decides whether they count. `buildPayload` omits
           `items` for the same reason, from the same test. */
        const t = typeById(doc.type);
        const noLines = has(t, 'no_lines');
        const src = noLines ? [] : doc.lines;
        // Every line value goes through `nz`, because a cell that is being typed
        // into holds a string.
        const lineNet = (l) => r2(nz(l.qty) * nz(l.rate) * (1 - pct(l.disc) / 100));
        const gross = r2(src.reduce((a, l) => a + nz(l.qty) * nz(l.rate), 0));
        const sub = r2(src.reduce((a, l) => a + lineNet(l), 0));
        const lineDisc = r2(gross - sub);
        const docDisc = r2((sub * pct(doc.discount)) / 100);
        const taxable = Math.max(0, sub - docDisc);
        const rate = (TAX_RATES.find((x) => x.id === doc.taxRate) || TAX_RATES[0]).rate;
        // Money is rounded to the paisa BEFORE the number ladder sees it.
        // Otherwise 0.18 × a subtotal arrives carrying three binary-float
        // decimals and the ladder faithfully prints its richest rung —
        // PKR 193,746.5380 — which is not wrong, it is just not money.
        //
        // A type with per-line tax is taxed PER LINE. Reading only the document
        // rate made the Tax % column an input that moved no number on the
        // screen and then posted a percentage the total disagreed with — the
        // same shape as F8's phantom charges, one document over.
        const perLine = has(t, 'per_line_tax');
        const docDiscFactor = sub > 0 ? 1 - docDisc / sub : 1;

        /* TAX-INCLUSIVE IS A CAPABILITY, and only the purchase order declares
           it. Honouring `doc.taxInclusive` on every type meant the Settings
           default silently forced tax to zero on a sales invoice that had no
           control to see or clear the flag: the same ten lines totalled 120,977
           instead of 142,753 and posted `tax_amount: 0`.

           And "inclusive" does not mean "no tax" — it means the tax is ALREADY
           IN the price. So it is EXTRACTED: the document is presented ex-tax,
           with the contained tax on its own row, which is both how an accountant
           reads it and the only presentation in which the rows still sum. The
           document discount row is derived last so the arithmetic is exact to
           the paisa rather than three independently-rounded fractions. */
        const inclusive = has(t, 'tax_inclusive_flag') && !!doc.taxInclusive;
        const tax = noLines ? r2(nz(doc.taxAmount))
            : inclusive ? r2(taxable - r2((taxable * 100) / (100 + rate)))
                : perLine
                    ? r2(src.reduce((a, l) => a + (lineNet(l) * docDiscFactor * nz(l.tax)) / 100, 0))
                    : r2((taxable * rate) / 100);
        const charges = r2(nz(doc.shipping) + nz(doc.extra));
        // Inclusive: the tax is inside `taxable`, so it is not added again.
        const before = r2(taxable + (inclusive ? 0 : tax) + charges);
        // FIX · round-off is a DOCUMENT property, applied once. Only the sales
        // invoice and the recurring invoice ever called roundTotal(), so the
        // same cart totalled differently per type.
        const total = prefs.ops.roundOff ? Math.round(before) : before;
        /* MARGIN. Cost travels with the line — `cost` is copied off the product
           when the line is created and posted as `cost_price` — so this is a
           real number rather than a guess, and free quantity is IN it: a
           buy-two-get-one costs three and sells two, which is precisely the
           case a margin read-out exists to catch. Net of both discounts and
           always ex-tax, because tax is not yours. */
        const cost = r2(src.reduce((a, l) => a + (nz(l.qty) + nz(l.free)) * nz(l.cost), 0));
        const net = r2(sub - docDisc);
        const margin = r2(net - cost);

        /* What the SUMMARY prints. Ex-tax when the tax was in the price, and the
           document discount balances so that gross − item − doc + tax === the
           total, exactly, at every density. */
        const f = inclusive ? 100 / (100 + rate) : 1;
        const grossD = inclusive ? r2(gross * f) : gross;
        const lineDiscD = inclusive ? r2(lineDisc * f) : lineDisc;
        const docDiscD = inclusive ? r2(grossD - lineDiscD - r2(taxable - tax)) : docDisc;
        return {
            lineNet,
            perLineTax: perLine,
            taxRate: rate,
            gross: grossD,
            sub: inclusive ? r2(sub * f) : sub,
            lineDisc: lineDiscD,
            docDisc: docDiscD,
            tax,
            inclusive,
            charges,
            cost,
            margin,
            marginPct: net > 0 ? r2((margin / net) * 100) : 0,
            round: r2(total - before),
            total,
            units: r2(src.reduce((a, l) => a + nz(l.qty) + nz(l.free), 0)),
        };
    }, [doc, prefs.ops.roundOff]);

    /* ── validation, at the field that caused it ─────────────────────────── */
    const errors = useMemo(() => {
        const e = {};
        if (!off(type, 'party') && !doc.party) e.party = `A ${label(type, 'party', 'party').toLowerCase()} is required.`;
        if (!doc.date) e.date = 'A document date is required.';
        if (prefs.ops.requireLocation && !doc.location && (has(type, 'location') || has(type, 'location_pair'))) {
            e.location = 'The server requires a location for this type.';
        }
        if (has(type, 'valid_until') && !doc.validUntil) e.validUntil = 'A quotation needs a valid-until date.';
        if (has(type, 'category') && !doc.category) e.category = 'An expense needs a category.';
        if (has(type, 'reason') && !doc.reason) e.reason = 'A reason is required.';
        if (has(type, 'source_doc') && !doc.sourceDoc) e.sourceDoc = 'Pick the document this is against.';
        // `description` renders its asterisk on the expense and had no rule
        // behind it, so Save posted an empty one while the field still claimed
        // to be required.
        if (has(type, 'description') && !String(doc.description || '').trim()) e.description = 'A description is required.';
        if (has(type, 'location_pair') && doc.location != null && String(doc.location) === String(doc.locationTo)) e.locationTo = 'From and To cannot be the same location.';
        return e;
    }, [doc, type, prefs.ops.requireLocation]);

    /* ── line operations ─────────────────────────────────────────────────── */
    const patchLine = useCallback((u, patch) => {
        setTouched(true);
        setDoc((d) => ({ ...d, lines: d.lines.map((l) => (l.u === u ? { ...l, ...patch } : l)) }));
    }, [setDoc]);

    const removeLine = useCallback((line) => {
        if (!prefs.perms['documents.delete_line']) { toast('Your role may not delete a line.', { tone: 'bad' }); return; }
        setTouched(true);
        setDoc((d) => ({ ...d, lines: d.lines.filter((l) => l.u !== line.u) }));
        setOpenCard(null);
        const t = toast(`${line.name} removed.`, { action: 'Undo', ms: 8000 });
        undoRef.current = { ...undoRef.current, [t.id]: { line, docId: activeIdRef.current } };
    }, [prefs.perms, setDoc, toast]);

    const onToastAction = useCallback((t) => {
        const entry = (undoRef.current || {})[t.id];
        if (entry) {
            // Restored into the document it came OUT of, even if you have since
            // switched tabs.
            setDocs((ds) => ds.map((d) => (d.idem === entry.docId && !d.lines.some((l) => l.u === entry.line.u)
                ? { ...d, lines: [...d.lines, entry.line] }
                : d)));
            const next = { ...undoRef.current };
            delete next[t.id];
            undoRef.current = next;
        }
        setToasts((ts) => ts.filter((x) => x.id !== t.id));
    }, []);

    const addLine = useCallback((product) => {
        const p = product || products[0];
        setTouched(true);
        setDoc((d) => ({ ...d, lines: [...d.lines, newLine(p)] }));
    }, [products, setDoc]);

    /* ── the primary action ──────────────────────────────────────────────── */
    const save = useCallback(() => {
        /* `posted_lock` is what makes saving a POSTING — the document becomes a
           locked record. A quotation switches it off, so saving one is not a
           posting and does not need the posting permission: a salesperson who
           may not post an invoice may still quote for one. The switch was in
           the law and nothing read it. */
        if (has(type, 'posted_lock') && !prefs.perms['documents.post']) {
            toast(`Your role may not post a ${type.name.toLowerCase()}.`, { tone: 'bad' });
            return false;
        }
        const keys = Object.keys(errors);
        if (keys.length) {
            /* A document you have just opened must not be red. Every required
               field is empty the moment a type is chosen, and flagging all of
               them before the user has done anything is a form shouting at
               somebody for not having finished typing. The rules run
               continuously — they gate this button from the first keystroke —
               and they become VISIBLE here, on the attempt. The flag lives on
               the document, so it survives a tab switch and a new tab starts
               clean. */
            setDoc((d) => ({ ...d, submitted: true }));
            // A validation failure is an error ON THE FIELD THAT CAUSED IT, and
            // the details block opens so the field is visible rather than
            // hidden behind a collapsed strip.
            if (D.details.mode === 'collapsed') {
                // …and if this screen cannot hold the block open, the field is
                // shown in the sheet instead. Writing a wish the law overrides
                // pointed the user at a red field they could not see.
                if (canOpenDetails) setPrefs((p) => ({ ...p, auto: false, comp: { ...p.comp, details: 'open' } }));
                else setSheet('details');
            }
            toast(errors[keys[0]], { tone: 'bad', ms: 5000 });
            return false;
        }
        if (hasLines && !doc.lines.length) { toast('Add at least one line.', { tone: 'bad' }); return false; }
        if (prefs.ops.confirmZeroCost && type.side === 'buy' && doc.lines.some((l) => !l.rate)) {
            toast('A purchase line has no cost. Set it, or turn the check off in Settings → Operate.', { tone: 'bad', ms: 5000 });
            return false;
        }
        setSaving(true);
        const payload = buildPayload(doc, type, computed);
        setTimeout(() => {
            setSaving(false);
            toast(
                `${type.name} ${doc.docno} posted${prefs.ops.printOnSave ? ' · printing' : ''} — `
                + `${Object.keys(payload).filter((k) => payload[k] !== undefined).length} fields, `
                + `${(payload.items || []).length} lines.`,
                { tone: 'good', ms: 5000 },
            );
            /* The draft holds EVERY open tab, so clearing it after posting one
               of them threw the other two away. What is left is re-saved; only
               an empty set clears. */
            const rest = docsRef.current.filter((d) => d.idem !== doc.idem);
            if (rest.length) saveDraft(userId, rest); else clearDraft(userId);
        }, 320);
        return true;
    }, [D.details.mode, canOpenDetails, computed, doc, errors, hasLines, prefs.ops, prefs.perms, setDoc, toast, type, userId]);

    /* ── draft rescue ────────────────────────────────────────────────────── */
    useEffect(() => {
        const saved = loadDraft(userId);
        const list = Array.isArray(saved) ? saved : (saved && saved.lines ? [saved] : null);
        /* "Has lines" is not the test for "is worth restoring". An expense has
           no lines BY DEFINITION, so a filled-in expense — amount, category,
           description, attachment, notes — was silently discarded on reload and
           overwritten by the next keystroke. Anything typed counts. */
        const worth = (d) => !!(d.lines?.length || d.notes || d.partyref || d.description
            || d.category || d.reason || nz(d.extra) || nz(d.shipping) || nz(d.settled) || d.attachment);
        if (list && list.some(worth)) {
            // `submitted` is a view state, not part of the document. Restoring
            // it painted every required field red on arrival, which is exactly
            // what the flag exists to prevent.
            setDocs(list.map((d) => ({ ...d, submitted: false })));
            toast(
                list.length > 1
                    ? `Your ${list.length} open drafts were restored from before the page closed.`
                    : 'Your draft was restored from before the page closed.',
                { tone: 'good', ms: 5000 },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (!touched) return undefined;
        const id = setTimeout(() => saveDraft(userId, docs), 500);
        return () => clearTimeout(id);
    }, [docs, touched, userId]);

    /* ── tabs ────────────────────────────────────────────────────────────────
       Labelled by the document number, or by the party until one exists — never
       by a raw timestamp, which is what the register's tabs shipped with. */
    const tabLabel = (d) => d.docno || d.party?.name || `${typeById(d.type).prefix} draft`;
    const addTab = useCallback(() => {
        setDocs((ds) => {
            // Counted from the highest number already open, not from the count,
            // so closing one and opening another cannot mint a duplicate.
            const highest = ds.reduce((a, d) => Math.max(a, Number((d.docno || '').split('-')[1]) || 0), 148);
            return [...ds, newDoc(type, prefs.ops, highest + 1)];
        });
        setActive(docs.length);
        setSelected(null);
        setOpenCard(null);
    }, [docs.length, prefs.ops, type]);
    const closeTab = useCallback((i) => {
        if (docs.length === 1) { toast('This is the only document open.'); return; }
        setDocs((ds) => ds.filter((_, j) => j !== i));
        setActive((a) => Math.max(0, a >= i ? a - 1 : a));
        setSelected(null);
        setOpenCard(null);
    }, [docs.length, toast]);

    /* ── switching type keeps the work ───────────────────────────────────── */
    const switchType = useCallback((id) => {
        const next = typeById(id);
        setPrefs((p) => ({ ...p, type: id }));
        setDoc((d) => ({
            ...d,
            type: id,
            docno: prefs.ops.autoNumber ? `${next.prefix}-${d.docno.split('-')[1] || '000148'}` : d.docno,
            // The party list is derived from the side, so a party from the wrong
            // side cannot survive the switch.
            party: off(next, 'party') ? null
                : (d.party && d.party.side === next.side ? d.party : partiesFor(next.side)[0]),
            // The lines SURVIVE a switch to a type that has none. `computed`
            // and `buildPayload` both ignore them for a `no_lines` type, so
            // nothing they hold reaches the total or the server — and switching
            // back gives the document back instead of an empty one.
            lines: d.lines,
            // A different type has a different set of rules. Carrying the flag
            // across painted a document you had only just configured red.
            submitted: false,
            // Only a type that renders the toggle carries the flag.
            taxInclusive: has(next, 'tax_inclusive_flag') ? d.taxInclusive : false,
        }));
        const noun = next.name.toLowerCase();
        toast(`Now ${/^[aeiou]/.test(noun) ? 'an' : 'a'} ${noun}. Same editor — the labels, the fields and the columns follow the type.`);
    }, [prefs.ops.autoNumber, setDoc, toast]);

    /* ── the keymap ──────────────────────────────────────────────────────────
       Scoped to the surface and suspended inside a field or a sheet — with the
       same exemption the register needed for its scan box: a field the user is
       filling in suspends it, and nothing else does.

       FIX · the documented F-key map existed only in Pos.jsx.
       KeyboardShortcutsModal.jsx advertised it to every user and no document
       screen implemented any of it. */
    useEffect(() => {
        /* WHAT "suspended inside a field" actually has to mean.
           On a document the caret lives in a field almost all of the time — you
           are filling one in. A guard that suspends the WHOLE map whenever
           `document.activeElement` is an input therefore suspends it always,
           and F9 does nothing for the entire life of the page. That is the same
           trap the register hit with its scan box, one step further along.
           The keys that genuinely collide with typing are the SINGLE-CHARACTER
           ones — `?` must put a question mark in a note. Function keys and
           Ctrl-combos never collide, so they work wherever you are. What
           suspends the whole map is a SHEET, which is what the original defect
           was actually about: F-keys firing from inside a modal's inputs. */
        const typing = () => {
            const el = document.activeElement;
            if (!el) return false;
            return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
                || el.tagName === 'SELECT' || el.isContentEditable;
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (paletteOpen) setPaletteOpen(false);
                else if (settingsOpen) setSettingsOpen(false);
                else if (sheet) setSheet(null);
                else if (navOpen) setNavOpen(false);
                else if (openCard) setOpenCard(null);
                else if (selected) setSelected(null);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault(); setPaletteOpen(true); return;
            }
            if (anyOverlay) return;

            // AltGr reports ctrlKey AND altKey, so a Polish layout typing 'ś'
            // in a note would otherwise post the document.
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    // The selection belongs to a document. Carrying it across
                    // left F2/F3/F5/F6 pointing at a line id no row on this tab
                    // has: five keys that did nothing and said nothing.
                    setActive((a) => (a + 1) % docs.length);
                    setSelected(null); setOpenCard(null);
                    return;
                }
                const k = e.key.toLowerCase();
                if (k === 's' || k === 'p') { e.preventDefault(); save(); }
                else if (k === 'n') { e.preventDefault(); if (save()) addTab(); }
                else if (k === 'd') { e.preventDefault(); setSheet('party'); }
                else if (k === 'f') { e.preventDefault(); setSheet('breakdown'); }
                else if (k === 't') { e.preventDefault(); addTab(); }
                else if (k === 'w') { e.preventDefault(); closeTab(active); }
                else if (/^[1-9]$/.test(e.key)) {
                    e.preventDefault();
                    const l = doc.lines[Number(e.key) - 1];
                    if (l) { setSelected(l.u); setOpenCard(l.u); }
                }
                return;
            }
            if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); setSheet('product'); setPickerFor(null); return; }
            switch (e.key) {
                case 'F1': e.preventDefault(); setSheet('product'); setPickerFor(null); break;
                // F2–F6 act on the ACTIVE LINE, so they open that line's controls
                // in place — the same tap-to-adjust the register uses.
                // The line's own controls, in place — in the card fit AND in the
                // table fit, where they open as a row beneath the line. A key
                // that works at one width and silently does nothing at another
                // is a key that is not on the map.
                case 'F2': case 'F3': case 'F5': case 'F6': {
                    e.preventDefault();
                    const u = selected || doc.lines[0]?.u;
                    if (!u) { toast('Nothing to edit — add a line first.'); break; }
                    setSelected(u);
                    // In the card fit the line's controls open IN PLACE; in the
                    // table fit there is no in-place row, so they open as the
                    // line's own sheet. Either way the same fields, at any
                    // width — a key that works at one size and silently does
                    // nothing at another is a key that is not on the map.
                    if (D.lines.fit === 'cards') setOpenCard(u); else openLine(u);
                    break;
                }
                case 'F4':
                    e.preventDefault();
                    if (selected) { const l = doc.lines.find((x) => x.u === selected); if (l) removeLine(l); }
                    else toast('Select a line first — Ctrl+1…9, or tap it.');
                    break;
                case 'F7': case 'F8': case 'F9': e.preventDefault(); setSheet('money'); break;
                case 'F11': e.preventDefault(); setSheet('party'); break;
                case 'F12': e.preventDefault(); setSheet('notes'); break;
                // The one key on the map that is a character you might type.
                case '?': if (!typing()) { e.preventDefault(); setSheet('keys'); } break;
                default: break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    /* ── the dock fades in once the summary has scrolled away ────────────── */
    const dockAlways = D.summary.mode === 'off';
    useEffect(() => {
        const node = scrollRef.current;
        if (!node) return undefined;
        const on = () => setScrolled(node.scrollTop > 40);
        node.addEventListener('scroll', on, { passive: true });
        on();
        return () => node.removeEventListener('scroll', on);
    }, [D.dock.length]);

    /* ── composition helpers ─────────────────────────────────────────────── */
    const setComp = (patch) => setPrefs((p) => ({ ...p, auto: false, comp: { ...p.comp, ...patch } }));

    const commands = [
        { label: 'Add a line', key: 'Alt+Q', run: () => { setPickerFor(null); setSheet('product'); } },
        { label: 'New document', key: 'Ctrl+T', run: addTab },
        { label: 'Change the document type', run: () => setSheet('type') },
        { label: `Choose a ${label(type, 'party', 'party').toLowerCase()}`, key: 'F11', run: () => setSheet('party') },
        { label: 'Document totals — tax, discount, delivery', key: 'F9', run: () => setSheet('money') },
        { label: 'Breakdown', key: 'Ctrl+F', run: () => setSheet('breakdown') },
        { label: 'What this would post', run: () => setSheet('payload') },
        { label: 'Recent documents', run: () => setSheet('recent') },
        { label: 'Document actions', run: () => setSheet('actions') },
        { label: 'Collapse the details block', run: () => setComp({ details: D.details.mode === 'open' ? 'collapsed' : 'open' }) },
        { label: 'Keyboard map', key: '?', run: () => setSheet('keys') },
        { label: 'Editor settings', run: () => setSettingsOpen(true) },
        { label: 'Save', key: 'Ctrl+S', run: save },
    ];

    const railW = prefs.rail && D.nav !== 'hidden' ? Math.round(D.vw - D.avail - 2 * D.margin) : 0;
    /* The DENSITY says how many columns the width can carry; the TYPE says which
       of them exist at all. A purchase bill switches free quantity off, so it
       has no Free column at any density — that is the capability being off,
       not the width vetoing it. */
    const columns = columnsFor(type, D.columns);
    const summaryWidth = D.summary.mode === 'right' ? D.summary.px : D.avail;

    const onAction = (a) => {
        if (a === '__more__') { setSheet('actions'); return; }
        toast(`${a} — this is where the document would ${a.toLowerCase()}.`);
    };

    return (
        <>
            <Head title={`New ${type.name.toLowerCase()}`} />
            <div
                className="nqd"
                data-rankmode={rankMode ? 'true' : undefined}
                data-senior={prefs.ops.senior ? 'true' : 'false'}
                style={{
                    '--nqd-scale': prefs.ops.uiScale,
                    '--nqd-margin': `${Math.round(marginAt(vp.w))}px`,
                    // The law's own box heights, handed to the stylesheet. One
                    // source of truth: a 38px summary row where the law measured
                    // 36 is a column the law calls stickable and the browser
                    // does not.
                    '--nqd-zoneh': `${M.zone_h}px`,
                    '--nqd-sumrow': `${M.sum_row}px`,
                    '--nqd-sumtot': `${M.sum_tot_row}px`,
                    '--nqd-actions': `${M.actions_h}px`,
                    '--nqd-btnh': `${M.actions_h - 24}px`,
                    '--nqd-dockh': `${M.dock_h}px`,
                }}
            >
                {railW > 0 ? (
                    <nav
                        className="nqd-rail"
                        style={{ width: railW }}
                        data-rank="2"
                        data-expanded={D.nav === 'expanded' ? 'true' : undefined}
                        aria-label="Sections"
                    >
                        {/* The gear at the foot IS Settings, so the list stops
                            before it rather than offering it twice. */}
                        {NAV.filter((n) => n.id !== 'settings').map((n) => (
                            <button key={n.id} type="button" className="nqd-railicon" aria-label={n.label} title={n.label} aria-current={n.id === 'sell' ? 'true' : undefined}>
                                <span className="glyph" aria-hidden>{n.glyph}</span>
                                {D.nav === 'expanded' ? <span>{n.label}</span> : null}
                            </button>
                        ))}
                        <span className="nqd-rail-sp" />
                        <button type="button" className="nqd-railicon" aria-label="Editor settings" data-rank="3" onClick={() => setSettingsOpen(true)}>
                            <span className="glyph" aria-hidden>⚙</span>
                            {D.nav === 'expanded' ? <span>Settings</span> : null}
                        </button>
                    </nav>
                ) : null}

                <div className="nqd-main">
                    {/* ── BAR ──────────────────────────────────────────────── */}
                    <header className="nqd-bar">
                        <Icon ns="nqd" label="Menu" rank="2" title="The nav — present at every width" onClick={() => setNavOpen(true)}>☰</Icon>
                        <Icon ns="nqd" label="Leave the document" rank="2" onClick={() => toast('This is where the editor hands you back to the list.')}>←</Icon>
                        <button type="button" style={{ minWidth: 0, flex: 1, textAlign: 'left', minHeight: 0 }} data-rank="2" onClick={() => setSheet('type')} title="One editor, thirteen document types">
                            <span className="nqd-title" style={{ display: 'block' }}>{type.name}</span>
                            <span className="nqd-docno">{doc.docno} · {doc.status || 'Draft'}</span>
                        </button>

                        {/* One editor can hold more than one document open. The
                            strip scrolls; the New button sits outside it so a
                            phone can always reach it. */}
                        {vp.w >= 720 || docs.length > 1 ? (
                            <div className="nqd-tabs" role="group" aria-label="Open documents">
                                {docs.map((d, i) => (
                                    <span key={d.idem} className="nqd-tab" data-current={i === active ? 'true' : undefined}>
                                        <button
                                            type="button"
                                            className="nqd-tab-lab nqd-tight"
                                            aria-current={i === active ? 'true' : undefined}
                                            onClick={() => { setActive(i); setSelected(null); setOpenCard(null); }}
                                        >
                                            {tabLabel(d)}
                                        </button>
                                        <button type="button" className="nqd-tab-x nqd-tight" aria-label={`Close ${tabLabel(d)}`} onClick={() => closeTab(i)}>✕</button>
                                    </span>
                                ))}
                            </div>
                        ) : null}
                        <Icon ns="nqd" label="New document" rank="2" title="New document (Ctrl+T)" onClick={addTab}>＋</Icon>

                        {D.navHeld && vp.w > 700 ? (
                            <span className="nqd-held" title="Expanding the nav would cost this composition a line column, so it is holding the rail. Buying a bigger screen should never make the invoice worse.">
                                ▤ rail held
                            </span>
                        ) : null}
                        {D.capped && vp.w > 900 ? (
                            <span className="nqd-status" title={`You asked for ${D.wantedDensity}; this width supports ${D.density}.`}>
                                {D.density} density
                            </span>
                        ) : null}
                        {vp.w > 560 ? <Kbd ns="nqd">Ctrl+K</Kbd> : null}
                        <Icon ns="nqd" label="Keyboard map" rank="2" onClick={() => setSheet('keys')}>⌨</Icon>
                        <Icon ns="nqd" label="Editor settings" rank="3" onClick={() => setSettingsOpen(true)}>⚙</Icon>
                    </header>

                    {/* ── BODY ─────────────────────────────────────────────── */}
                    <div className="nqd-body">
                        {/* The dock is a REAL ROW below this scroller, not a float,
                            so its height is already out of the scroller's box. No
                            second reserve is needed and none is added — the last
                            line can always be scrolled clear of it. */}
                        <div className="nqd-scroll" ref={scrollRef}>
                            <DetailsZone
                                D={D}
                                type={type}
                                doc={doc}
                                set={set}
                                errors={doc.submitted ? errors : {}}
                                total={computed.total}
                                onOpenParty={() => setSheet('party')}
                                onOpenSource={() => setSheet('source')}
                                /* The toggle wrote the value the WISH already
                                   held whenever the law had overridden it, so
                                   below about 690px of height — where the law
                                   force-collapses — the strip was inert and the
                                   document date, terms, due date, settlement
                                   method and money account had no control
                                   anywhere on the page. If the law is the one
                                   holding it shut, the strip opens the block as
                                   a SHEET instead. A height may veto a layout;
                                   it may not veto a field. */
                                onToggle={() => {
                                    if (D.details.mode === 'open') { setComp({ details: 'collapsed' }); return; }
                                    if (canOpenDetails) { setComp({ details: 'open' }); return; }
                                    setSheet('details');
                                }}
                                forced={!canOpenDetails}
                            />

                            <div
                                className="nqd-grid"
                                style={{
                                    gridTemplateColumns: D.summary.mode === 'right'
                                        ? `minmax(0,1fr) 14px ${Math.round(D.summary.px)}px`
                                        : 'minmax(0,1fr)',
                                }}
                            >
                                {hasLines ? (
                                    <LinesZone
                                        D={D}
                                        type={type}
                                        doc={doc}
                                        columns={columns}
                                        perms={prefs.perms}
                                        computed={computed}
                                        selected={selected}
                                        onSelect={setSelected}
                                        openCard={openCard}
                                        setOpenCard={(u) => { setOpenCard(u); if (u) setSelected(u); }}
                                        onPatchLine={patchLine}
                                        onRemoveLine={removeLine}
                                        onAddLine={() => { setPickerFor(null); setSheet('product'); }}
                                        onOpenPicker={(u) => { setPickerFor(u); setSheet('product'); }}
                                        onOpenLine={openLine}
                                        showMargin={prefs.ops.showMargin}
                                    />
                                ) : (
                                    /* `no_lines` types — an expense is an amount,
                                       not a table. The same editor, with the line
                                       capability switched off. */
                                    <section className="nqd-zone" data-rank="1">
                                        <header className="nqd-zh"><span>Amount</span></header>
                                        <div className="nqd-hdr" style={{ gridTemplateColumns: D.details.twoCol ? 'repeat(2,minmax(0,1fr))' : '1fr' }}>
                                            <div className="nqd-f">
                                                <label htmlFor="nqd-amt">Amount excluding tax<span className="nqd-req">*</span></label>
                                                <input id="nqd-amt" className="nqd-ctl num" inputMode="decimal" data-rank="1" value={doc.extra} onChange={(e) => set({ extra: keep(e.target.value) })} />
                                            </div>
                                            {/* Only when the type has not already
                                                given it a capability field of its
                                                own — two inputs bound to one value,
                                                on screen together, is the thing
                                                this page argues against. */}
                                            {!has(type, 'tax_amount') ? (
                                                <div className="nqd-f">
                                                    <label htmlFor="nqd-taxamt">Tax amount</label>
                                                    <input id="nqd-taxamt" className="nqd-ctl num" inputMode="decimal" value={doc.taxAmount} onChange={(e) => set({ taxAmount: keep(e.target.value) })} />
                                                </div>
                                            ) : null}
                                        </div>
                                    </section>
                                )}

                                {D.summary.mode === 'right' ? (
                                    <>
                                        <VSplit
                                            value={prefs.comp.split}
                                            inner={D.avail - 24}
                                            onChange={(v) => setComp({ split: v })}
                                            onReset={() => setComp({ split: presetDocument(prefs.preset || 'panel').split })}
                                        />
                                        <div
                                            className="nqd-sumcol"
                                            data-stick={D.summary.pin === 'sticky' ? 'true' : undefined}
                                            /* A sticky column is bounded by the SCROLLPORT, not by the
                                               grid row it lives in — otherwise it is as tall as the line
                                               table and its own primary button sits below the fold,
                                               which is exactly the bug the register had. */
                                            style={D.summary.pin === 'sticky'
                                                ? { maxHeight: Math.round(D.usable - D.details.h) }
                                                : undefined}
                                        >
                                            <SummaryZone
                                                D={D} type={type} doc={doc} computed={computed} width={summaryWidth}
                                                saving={saving}
                                                onBreakdown={() => setSheet('breakdown')}
                                                onPrimary={save}
                                                onAction={onAction}
                                            />
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            {D.summary.mode === 'below' ? (
                                <div className="nqd-sumcol">
                                    <SummaryZone
                                        D={D} type={type} doc={doc} computed={computed} width={summaryWidth}
                                        saving={saving}
                                        onBreakdown={() => setSheet('breakdown')}
                                        onPrimary={save}
                                        onAction={onAction}
                                    />
                                </div>
                            ) : null}

                        </div>

                        {D.dock.length ? (
                            <div className="nqd-dockrow" style={{ height: D.dockH + Math.round(marginAt(vp.w)) }}>
                                <DockBar
                                    D={D} type={type} doc={doc} computed={computed}
                                    on={dockAlways || scrolled} saving={saving}
                                    onBreakdown={() => setSheet('breakdown')}
                                    onPrimary={save}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    OVERLAYS
                    ════════════════════════════════════════════════════════════ */}
                <div
                    className="nqd-scrim"
                    data-open={anyOverlay ? 'true' : 'false'}
                    aria-hidden="true"
                    onClick={() => { setSheet(null); setNavOpen(false); setSettingsOpen(false); setPaletteOpen(false); }}
                />

                <PartySheet
                    open={sheet === 'party'} onClose={() => setSheet(null)} type={type} current={doc.party} narrow={narrow}
                    onPick={(p) => {
                        const terms = (TERMS.find((t) => t.label === p.terms) || {}).id || doc.terms;
                        // A party's default discount is a DISCOUNT, so the same
                        // permission gates it. Applying it around the check was
                        // a way for a role that may not discount to discount.
                        const mayDiscount = prefs.perms['documents.discount'];
                        /* The party's terms are terms, so they write the due
                           date the same way the select does. Setting `terms`
                           and leaving `dueTouched` alone left the two
                           disagreeing in the payload: `payment_terms: net7`
                           beside a due date thirty days out. */
                        const fromParty = { party: p, terms, dueTouched: false };
                        if (p.discount && mayDiscount) {
                            set({ ...fromParty, discount: p.discount });
                            toast(`${p.name} has a ${p.discount}% default discount — applied to the document.`, { tone: 'good' });
                        } else {
                            set(fromParty);
                            if (p.discount) toast(`${p.name} has a ${p.discount}% default discount, but your role may not give one.`, { tone: 'bad' });
                        }
                    }}
                />

                <ProductSheet
                    open={sheet === 'product'} onClose={() => { setSheet(null); setPickerFor(null); }} narrow={narrow}
                    products={products}
                    onPick={(p) => {
                        if (pickerFor) {
                            patchLine(pickerFor, { pid: p.id, name: p.name, sku: p.sku, hsn: p.hsn, uom: p.uom, rate: p.rate, cost: p.cost, tax: p.tax });
                        } else {
                            addLine(p);
                        }
                    }}
                    onCreate={(f) => {
                        const p = {
                            id: Date.now(), name: f.name, sku: f.sku || `NEW-${Date.now() % 1000}`,
                            hsn: '0000.00', uom: f.uom || 'pc', rate: Number(f.rate) || 0,
                            cost: Math.round((Number(f.rate) || 0) * 0.8), tax: 18, stock: 0, hue: 'teal',
                        };
                        setProducts((ps) => [p, ...ps]);
                        addLine(p);
                        toast(`${p.name} created and added.`, { tone: 'good' });
                    }}
                />

                {/* ONE LINE, ALL OF IT — every field the TYPE gives a line,
                    at every width, whatever the density made a column. */}
                <LineSheet
                    open={sheet === 'line'} onClose={() => { setSheet(null); setLineFor(null); }}
                    line={doc.lines.find((l) => l.u === lineFor) || null}
                    type={type} perms={prefs.perms} narrow={narrow}
                    onPatch={patchLine} onRemove={removeLine}
                    onChangeItem={(u) => { setPickerFor(u); setSheet('product'); }}
                />

                {/* Rendered ONLY while the block is collapsed. Two copies of
                    the same zone on the page at once is two elements with one
                    id — every `htmlFor`, every `#nqd-h-…` and every screen
                    reader then has a choice to make about which one is meant. */}
                <Sheet
                    open={sheet === 'details'} onClose={() => setSheet(null)} title="Customer &amp; details"
                    size={narrow ? 'bottom' : 'wide'} ns="nqd"
                    footer={<button type="button" className="nqd-btn" data-pri="true" onClick={() => setSheet(null)}>Done</button>}
                >
                    {D.details.mode !== 'collapsed' ? null : (
                    <DetailsZone
                        D={{ ...D, details: { ...D.details, mode: 'open', twoCol: !narrow }, avail: narrow ? 380 : 560 }}
                        type={type} doc={doc} set={set} errors={doc.submitted ? errors : {}}
                        total={computed.total}
                        onOpenParty={() => setSheet('party')}
                        onOpenSource={() => setSheet('source')}
                        onToggle={() => setSheet(null)}
                        inSheet
                    />
                    )}
                </Sheet>

                <TypeSheet open={sheet === 'type'} onClose={() => setSheet(null)} current={doc.type} onPick={switchType} narrow={narrow} />
                <SourceSheet open={sheet === 'source'} onClose={() => setSheet(null)} narrow={narrow} onPick={(d) => set({ sourceDoc: d.id })} />
                <BreakdownSheet open={sheet === 'breakdown'} onClose={() => setSheet(null)} type={type} doc={doc} computed={computed} narrow={narrow} showMargin={prefs.ops.showMargin && prefs.perms['documents.price_override']} />
                <PayloadSheet open={sheet === 'payload'} onClose={() => setSheet(null)} type={type} doc={doc} computed={computed} narrow={narrow} />
                <MoneySheet open={sheet === 'money'} onClose={() => setSheet(null)} doc={doc} set={set} perms={prefs.perms} narrow={narrow} />
                <KeysSheet open={sheet === 'keys'} onClose={() => setSheet(null)} narrow={narrow} />
                <ActionsSheet
                    open={sheet === 'actions'} onClose={() => setSheet(null)} type={type} narrow={narrow}
                    onRun={(a) => { if (a === 'Download PDF' || a === 'Duplicate' || a === 'Email' || a === 'WhatsApp') toast(`${a} — a document action, on the document.`); else onAction(a); }}
                />
                <RecentSheet open={sheet === 'recent'} onClose={() => setSheet(null)} narrow={narrow} onOpenDoc={(d) => toast(`${d.id} would open here.`)} />

                {/* Notes has a resident field in the details block; F12 brings the
                    same field forward when the block is collapsed. Same control,
                    same payload path — never a second one. */}
                <MoneyNotesSheet open={sheet === 'notes'} onClose={() => setSheet(null)} doc={doc} set={set} narrow={narrow} />

                <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} items={NAV} current="sell" width={Math.min(264, vp.w - 56)} />

                <SettingsDrawer
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    prefs={prefs} D={D} vp={vp} type={type}
                    tab={setTab} setTab={setSetTab}
                    rankMode={rankMode} setRankMode={setRankMode}
                    setComp={(comp) => setPrefs((p) => ({ ...p, comp }))}
                    setPreset={(id) => setPrefs((p) => ({ ...p, preset: id, comp: presetDocument(id) }))}
                    setProfile={(id) => setPrefs((p) => ({ ...p, profile: id }))}
                    setAuto={(v) => setPrefs((p) => ({ ...p, auto: v }))}
                    setOps={(patch) => setPrefs((p) => ({ ...p, ops: { ...p.ops, ...patch } }))}
                    setPerm={(k, v) => setPrefs((p) => ({ ...p, perms: { ...p.perms, [k]: v } }))}
                    setRail={(v) => setPrefs((p) => ({ ...p, rail: v }))}
                    setType={() => setSheet('type')}
                    onReset={() => {
                        setPrefs({ ...DEFAULTS, comp: presetDocument('panel'), ops: { ...DEFAULTS.ops }, perms: { ...DEFAULTS.perms } });
                        toast('Editor settings reset.');
                    }}
                />

                <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
                <Toasts ns="nqd" items={toasts} onAction={onToastAction} onDismiss={(t) => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
            </div>
        </>
    );
}

/* A tiny sheet, kept beside the page because it is the page's own field brought
   forward — not a second editor for it. */
function MoneyNotesSheet({ open, onClose, doc, set, narrow }) {
    // Built on Sheet, not hand-rolled: `aria-modal` is a promise, and the
    // hand-rolled copy of this markup kept none of it — F12 opened a dialog
    // that never took the caret and that Tab walked straight out of.
    return (
        <Sheet open={open} onClose={onClose} title="Notes" size={narrow ? 'bottom' : 'side'} ns="nqd">
            <div className="nqd-hdr" style={{ gridTemplateColumns: '1fr' }}>
                <div className="nqd-f">
                    <label htmlFor="nqd-notes-sheet">Notes on this document</label>
                    <textarea id="nqd-notes-sheet" data-sheet-focus value={doc.notes} onChange={(e) => set({ notes: e.target.value })} style={{ minHeight: 140 }} />
                    <span className="hint">
                        The same field as the one in the details block, and the same payload key.
                        Notes was in six payloads with no input on any of the eight clone screens.
                    </span>
                </div>
            </div>
            <div className="nqd-actions">
                <button type="button" className="nqd-btn" data-pri="true" onClick={onClose}>Done</button>
            </div>
        </Sheet>
    );
}
