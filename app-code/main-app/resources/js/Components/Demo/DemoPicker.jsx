/**
 * DemoPicker — the two-step dialog (business, then user type) used by the /demo
 * page and by the in-app demo pill. It only collects the choice; the caller
 * decides what to do with it (both post to the demo login).
 */
import { createPortal } from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft, ArrowRight, Briefcase, Calculator, Check, Eye, Factory, Search, Shield,
    ShoppingBag, ShoppingCart, Sparkles, Truck, UtensilsCrossed, User, X,
    Building2, Clock, Package, Utensils, Pill, TrendingUp, Boxes, Car, Users, Settings,
} from 'lucide-react';
import localCatalogue from '@/Data/businessTypes.json';

const SECTOR_ICON = {
    services: Briefcase,
    retail: ShoppingBag,
    food: UtensilsCrossed,
    wholesale: Truck,
    manufacturing: Factory,
};

const ROLE_ICON = {
    owner: Shield, admin: Briefcase, manager: User, cashier: ShoppingCart, accountant: Calculator,
    purchasing_officer: Truck, viewer: Eye, franchise_admin: Building2, shift_supervisor: Clock,
    inventory_controller: Package, production_supervisor: Factory, kitchen_manager: Utensils,
    dispenser: Pill, sales_executive: TrendingUp, fulfillment_lead: Boxes, delivery_driver: Car,
    hr_officer: Users,
};

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function Option({ icon: Icon, name, note, selected, onSelect }) {
    return (
        <button type="button" className="vq-dm-opt" aria-pressed={selected} onClick={onSelect}>
            <span className="vq-dm-opt__icon"><Icon size={18} aria-hidden="true" /></span>
            <span className="vq-dm-opt__text">
                <span className="vq-dm-opt__name">{name}</span>
                {note ? <span className="vq-dm-opt__note">{note}</span> : null}
            </span>
            <span className="vq-dm-opt__check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
        </button>
    );
}

export default function DemoPicker({
    types: typesProp,
    primaryRoles = [],
    specializedRoles = [],
    initialBusiness = null,
    initialRole = 'owner',
    submitLabel = 'Open the demo',
    submittingLabel = 'Opening your demo…',
    trialHref = null,
    submitting = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const [step, setStep] = useState(1);
    const [business, setBusiness] = useState(initialBusiness || null);
    const [role, setRole] = useState(initialRole || 'owner');
    const [query, setQuery] = useState('');
    const [sector, setSector] = useState('all');
    const [moreRoles, setMoreRoles] = useState(false);

    const panelRef = useRef(null);
    const searchRef = useRef(null);

    const types = useMemo(() => {
        if (Array.isArray(typesProp) && typesProp.length) return typesProp;
        return localCatalogue.types.map((t) => ({ key: t.key, name: t.name, sector: t.sector, note: t.note || '' }));
    }, [typesProp]);
    const sectors = localCatalogue.sectors;

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return types.filter((t) => {
            if (sector !== 'all' && t.sector !== sector) return false;
            if (!q) return true;
            return `${t.name} ${t.note || ''} ${t.key}`.toLowerCase().includes(q);
        });
    }, [types, query, sector]);

    const chosen = types.find((t) => t.key === business) || null;
    const allRoles = [...primaryRoles, ...specializedRoles];
    const chosenRole = allRoles.find((r) => r.id === role) || null;
    // A role that lives in the "more" list must be visible when it is the current one.
    const roleIsSpecial = specializedRoles.some((r) => r.id === role);

    const close = useCallback(() => { if (!submitting) onClose?.(); }, [submitting, onClose]);

    // Scroll lock, Escape, focus trap.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); close(); return; }
            if (e.key !== 'Tab' || !panelRef.current) return;
            const nodes = panelRef.current.querySelectorAll(FOCUSABLE);
            if (!nodes.length) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
    }, [close]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (step === 1) searchRef.current?.focus();
            else panelRef.current?.querySelector('.vq-dm-opt[aria-pressed="true"]')?.focus();
        }, 30);
        return () => clearTimeout(t);
    }, [step]);

    const roleCard = (r) => (
        <Option key={r.id} icon={ROLE_ICON[r.id] || Settings} name={r.name} note={r.desc} selected={role === r.id} onSelect={() => setRole(r.id)} />
    );

    const dialog = (
        <div className="vq-dm" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
            <div
                ref={panelRef}
                className="vq-dm__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="vq-dm-title"
                aria-busy={submitting}
            >
                <div className="vq-dm__head">
                    <div>
                        <div className="vq-dm__steps" aria-hidden="true">
                            <i data-on="true" /><i data-on={step === 2} />
                        </div>
                        <div className="vq-dm__kicker">Step {step} of 2</div>
                        <h2 className="vq-dm__title" id="vq-dm-title">
                            {step === 1 ? 'What kind of business is it?' : 'Who are you in the business?'}
                        </h2>
                        <p className="vq-dm__sub">
                            {step === 1
                                ? 'The demo switches on the modules that business uses and hides the rest.'
                                : 'You will see the store exactly as someone in this role does.'}
                        </p>
                    </div>
                    <button type="button" className="vq-dm__close" onClick={close} aria-label="Close" disabled={submitting}>
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="vq-dm__body">
                    {step === 1 ? (
                        <>
                            <div className="vq-dm__tools">
                                <div className="vq-mc-search">
                                    <Search size={18} aria-hidden="true" />
                                    <input
                                        ref={searchRef}
                                        className="vq-input"
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search — pharmacy, restaurant, phone repair…"
                                        aria-label="Search business types"
                                    />
                                </div>
                                <div className="vq-dm__chips" role="group" aria-label="Filter by sector">
                                    <button type="button" className="vq-chip" aria-selected={sector === 'all'} onClick={() => setSector('all')}>
                                        All · {types.length}
                                    </button>
                                    {sectors.map((s) => (
                                        <button key={s.key} type="button" className="vq-chip" aria-selected={sector === s.key} onClick={() => setSector(s.key)}>
                                            {s.short}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {shown.length ? (
                                <div className="vq-dm__grid">
                                    {shown.map((t) => (
                                        <Option
                                            key={t.key}
                                            icon={SECTOR_ICON[t.sector] || ShoppingBag}
                                            name={t.name}
                                            note={t.note}
                                            selected={business === t.key}
                                            onSelect={() => setBusiness(t.key)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="vq-dm__empty">No business matches “{query}”. Try a broader word.</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="vq-dm__ctx">
                                <span>Business: <b>{chosen?.name}</b></span>
                                <button type="button" onClick={() => setStep(1)}>Change</button>
                            </div>
                            <div className="vq-dm__grid">{primaryRoles.map(roleCard)}</div>
                            {specializedRoles.length > 0 && (
                                <>
                                    <button type="button" className="vq-link vq-dm__more" aria-expanded={moreRoles || roleIsSpecial} onClick={() => setMoreRoles((v) => !v)} disabled={roleIsSpecial}>
                                        {(moreRoles || roleIsSpecial) ? 'Hide' : 'Show'} {specializedRoles.length} more roles
                                    </button>
                                    {(moreRoles || roleIsSpecial) && <div className="vq-dm__grid vq-mt-4">{specializedRoles.map(roleCard)}</div>}
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="vq-dm__foot">
                    {error && <p className="vq-dm__error" role="alert">{error}</p>}
                    {trialHref && step === 1 && (
                        <a className="vq-link" href={trialHref}>Start a free trial instead <ArrowRight size={14} aria-hidden="true" /></a>
                    )}
                    <div className="vq-dm__pick">
                        {step === 1
                            ? (chosen ? <>Selected: <b>{chosen.name}</b></> : 'Pick one to continue')
                            : (chosenRole ? <>Viewing as: <b>{chosenRole.name}</b></> : 'Pick a role')}
                    </div>
                    <div className="vq-dm__actions">
                        {step === 2 && (
                            <button type="button" className="vq-btn vq-btn--secondary" onClick={() => setStep(1)} disabled={submitting}>
                                <ArrowLeft size={16} aria-hidden="true" /> Back
                            </button>
                        )}
                        {step === 1 ? (
                            <button type="button" className="vq-btn vq-btn--primary" disabled={!business} onClick={() => setStep(2)}>
                                Continue <span className="vq-btn__arrow"><ArrowRight size={16} aria-hidden="true" /></span>
                            </button>
                        ) : (
                            <button type="button" className="vq-btn vq-btn--primary" disabled={!role || submitting} onClick={() => onSubmit?.({ business, role })}>
                                {submitting ? submittingLabel : submitLabel}
                                {!submitting && <span className="vq-btn__arrow"><ArrowRight size={16} aria-hidden="true" /></span>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Portal to <body>: the app header has a transform, which would otherwise turn
    // `position: fixed` into "fixed inside the header" and push the dialog off-centre.
    return typeof document === 'undefined' ? dialog : createPortal(dialog, document.body);
}
