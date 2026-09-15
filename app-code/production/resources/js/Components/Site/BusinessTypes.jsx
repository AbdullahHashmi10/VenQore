/**
 * BusinessTypes — "one engine, 85+ kinds of business".
 *
 *   <BusinessTypes />                  landing: sector tabs + the types in it
 *   <BusinessTypes variant="directory"/> Solutions: every sector, every type
 *
 * Data and every count come from ./sectorCatalog.js (not businessTypes.js: on Windows that name collides with this file).
 */
import React, { useId, useState } from 'react';
import { ArrowRight, Briefcase, Factory, ShoppingBag, Truck, UtensilsCrossed } from 'lucide-react';
import { SECTORS, BUSINESS_TYPE_CLAIM, SECTOR_COUNT } from './sectorCatalog';

const ICONS = { services: Briefcase, retail: ShoppingBag, food: UtensilsCrossed, wholesale: Truck, manufacturing: Factory };

function TypeGrid({ sector }) {
    return (
        <ul className="vq-bt__types">
            {sector.types.map((t) => (
                <li key={t.name} className="vq-bt__type">
                    <b>{t.name}</b>
                    {t.note && <span>{t.note}</span>}
                </li>
            ))}
        </ul>
    );
}

function Modules({ sector }) {
    return (
        <p className="vq-bt__mods">
            <span>Unlocked by</span>
            {sector.modules.map((m) => <code key={m}>{m}</code>)}
        </p>
    );
}

export default function BusinessTypes({ variant = 'tabs', id = 'business-types', className = '' }) {
    const [active, setActive] = useState(SECTORS[0].key);
    const uid = useId();
    const sector = SECTORS.find((s) => s.key === active) || SECTORS[0];

    const head = (
        <div className="vq-section-head vq-bt__head">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">One engine · {SECTOR_COUNT} sectors</span>
            <h2 className="vq-h2 vq-mt-4">Software for {BUSINESS_TYPE_CLAIM} kinds of business.</h2>
            <p className="vq-lede vq-mt-4">
                Repair shops and pharmacies, cafés and cement dealers, agencies and bakeries. Describe yours and
                VenQore assembles the system for it from the same modules and the same double-entry ledger —
                no custom build, no consultant.
            </p>
        </div>
    );

    if (variant === 'directory') {
        return (
            <section id={id} className={`vq-section vq-bt vq-bt--directory ${className}`}>
                <div className="vq-container">
                    {head}
                    <div className="vq-bt__dir">
                        {SECTORS.map((s) => {
                            const Icon = ICONS[s.key] || Briefcase;
                            return (
                                <article key={s.key} className="vq-card vq-bt__sector" id={`sector-${s.key}`}>
                                    <header className="vq-bt__sector-head">
                                        <span className="vq-bt__icon"><Icon size={20} aria-hidden="true" /></span>
                                        <div>
                                            <h3 className="vq-h3">{s.name}</h3>
                                            <p className="vq-bt__count">{s.types.length} business types</p>
                                        </div>
                                    </header>
                                    <p className="vq-bt__pitch">{s.pitch}</p>
                                    <TypeGrid sector={s} />
                                    <Modules sector={s} />
                                </article>
                            );
                        })}
                    </div>
                    <div className="vq-bt__cta">
                        <p>Yours isn't listed? It is probably a mix of these.</p>
                        <a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                            Describe your business <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id={id} className={`vq-section vq-bt ${className}`}>
            <div className="vq-container">
                {head}
                <div className="vq-bt__tabs" role="tablist" aria-label="Sectors">
                    {SECTORS.map((s) => {
                        const Icon = ICONS[s.key] || Briefcase;
                        const on = s.key === active;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                role="tab"
                                id={`${uid}-tab-${s.key}`}
                                aria-selected={on}
                                aria-controls={`${uid}-panel`}
                                className={`vq-bt__tab${on ? ' is-on' : ''}`}
                                onClick={() => setActive(s.key)}
                            >
                                <Icon size={18} aria-hidden="true" />
                                <span className="vq-bt__tab-name">{s.short}</span>
                                <span className="vq-bt__tab-n">{s.types.length}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="vq-card vq-bt__panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${sector.key}`}>
                    <div className="vq-bt__panel-head">
                        <div>
                            <h3 className="vq-h3">{sector.name}</h3>
                            <p className="vq-bt__pitch">{sector.pitch}</p>
                        </div>
                        <a className="vq-link" href={`/solutions#sector-${sector.key}`}>
                            See all {sector.types.length} <ArrowRight size={15} aria-hidden="true" />
                        </a>
                    </div>
                    <TypeGrid sector={sector} />
                    <Modules sector={sector} />
                </div>
                <div className="vq-bt__cta">
                    <p>Don't see your business? Most are a mix of these.</p>
                    <a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                        Describe yours <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                    </a>
                </div>
            </div>
        </section>
    );
}
