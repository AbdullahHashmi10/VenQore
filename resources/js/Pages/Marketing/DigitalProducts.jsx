import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import MarketingLayout from './Shared/MarketingLayout';
import {
    Package, ExternalLink, ArrowRight,
    CheckCircle2, Lock, Hexagon, Fingerprint,
    Cpu, Rocket, Database, Layers, X
} from 'lucide-react';

export default function DigitalProducts({ products = [], stats = {} }) {
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Close the preview modal on Escape
    useEffect(() => {
        if (!selectedProduct) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setSelectedProduct(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedProduct]);

    // Filter products by status
    const activeProducts = products.filter(p => p.status === 'active');
    const devProducts = products.filter(p => p.status === 'dev');
    const soonProducts = products.filter(p => p.status === 'soon');

    return (
        <MarketingLayout
            title="VenQore Digital Products catalog"
            description="Explore our premium collection of offline POS modules, standalone platforms, and custom accounting extensions."
        >
            <Head title="Digital Products & Registry Catalog" />

            {/* HERO */}
            <section className="vq-section vq-mkt-hero">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0 }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">VenQore ecosystem</span>
                        <h1 className="vq-display vq-mt-4">Digital registry</h1>
                        <p className="vq-lede">
                            The definitive suite of double-entry ledger systems, point-of-sale registers, and analytics overlays. Built for zero-latency, offline-first operational dominance.
                        </p>
                    </div>

                    <div className="vq-grid vq-grid--3 vq-mt-12 vq-dp-stats">
                        <div className="vq-card vq-stat">
                            <span className="vq-stat__label">Total modules</span>
                            <span className="vq-stat__value">{stats.total}</span>
                        </div>
                        <div className="vq-card vq-stat">
                            <span className="vq-stat__label">Live &amp; active</span>
                            <span className="vq-stat__value vq-dp-live">{stats.done}</span>
                        </div>
                        <div className="vq-card vq-stat">
                            <span className="vq-stat__label">In pipeline</span>
                            <span className="vq-stat__value vq-accent-text">{stats.pending}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 1 — core flagship modules */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Core flagship modules</span>
                        <h2 className="vq-h1 vq-mt-4">Fully operational</h2>
                        <p className="vq-lede">
                            Tested, deployed, and production-ready accounting systems with fully operational double-entry ledger registers.
                        </p>
                    </div>

                    {activeProducts.length === 0 ? (
                        <div className="vq-card vq-card--xl vq-center vq-dp-empty">
                            <Package size={40} aria-hidden="true" />
                            <p>No active flagship modules configured.</p>
                        </div>
                    ) : (
                        <div className="vq-stack vq-gap-8">
                            {activeProducts.map((product) => (
                                <article key={product.id} className="vq-card vq-card--xl vq-dp-flag">
                                    <div className="vq-dp-flag__main">
                                        <div className="vq-row vq-wrap vq-gap-3">
                                            <span className="vq-badge vq-badge--success"><CheckCircle2 size={14} aria-hidden="true" /> Validated core</span>
                                            <span className="vq-badge">Build {product.version || 'v1.0.0'}</span>
                                        </div>
                                        <h3 className="vq-h1 vq-mt-6">{product.name}</h3>
                                        <p className="vq-lede vq-mt-4">{product.description}</p>

                                        <div className="vq-grid vq-grid--2 vq-mt-8" style={{ gap: 'var(--vq-space-4)' }}>
                                            <div className="vq-dp-point">
                                                <span className="vq-tile__icon" style={{ marginBottom: 0 }}><Database aria-hidden="true" /></span>
                                                <div>
                                                    <h4>Ledger integrity</h4>
                                                    <p>Cryptographically secure double-entry transaction routing.</p>
                                                </div>
                                            </div>
                                            <div className="vq-dp-point">
                                                <span className="vq-tile__icon" style={{ marginBottom: 0 }}><Layers aria-hidden="true" /></span>
                                                <div>
                                                    <h4>Component expansion</h4>
                                                    <p>Hot-swappable UI layouts without touching core logic.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vq-dp-flag__side">
                                        <span className="vq-tile__icon"><Fingerprint aria-hidden="true" /></span>
                                        <h4 className="vq-h3">Acquisition portals</h4>
                                        <p className="vq-small vq-text-2 vq-mt-2">Select an authorized merchant provider to license this module.</p>

                                        {(!product.platforms || product.platforms.length === 0) ? (
                                            <div className="vq-dp-none vq-mt-6">No external checkout gateways configured yet.</div>
                                        ) : (
                                            <div className="vq-stack vq-gap-3 vq-mt-6">
                                                {product.platforms.map((platform, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={platform.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`vq-btn ${idx === 0 ? 'vq-btn--primary' : 'vq-btn--secondary'} vq-btn--lg vq-btn--block vq-dp-buy`}
                                                    >
                                                        <span>Secure checkout · {platform.label || platform.name}</span>
                                                        <ArrowRight size={18} className="vq-btn__arrow" aria-hidden="true" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* SECTION 2 — active pipeline */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Active pipeline</span>
                        <h2 className="vq-h1 vq-mt-4">Under construction</h2>
                        <p className="vq-lede">
                            High-priority modules currently in the engineering bay. Architecture defined, coding in progress.
                        </p>
                    </div>

                    {devProducts.length === 0 ? (
                        <div className="vq-card vq-card--xl vq-center vq-dp-empty"><p>No pipeline modules in active assembly.</p></div>
                    ) : (
                        <div className="vq-grid vq-grid--2">
                            {devProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => setSelectedProduct(product)}
                                    className="vq-card vq-card--xl vq-card--interactive vq-dp-dev"
                                >
                                    <div className="vq-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                        <span className="vq-tile__icon" style={{ marginBottom: 0 }}><Cpu aria-hidden="true" /></span>
                                        <span className="vq-badge vq-badge--accent">Engineering bay</span>
                                    </div>
                                    <h3 className="vq-tile__title vq-mt-6">{product.name}</h3>
                                    <p className="vq-tile__body vq-mt-3 vq-dp-clamp">{product.description}</p>
                                    <div className="vq-dp-dev__foot">
                                        <span className="vq-caption">Build {product.version || 'Beta Dev'}</span>
                                        <span className="vq-link">Preview links <ArrowRight size={16} aria-hidden="true" /></span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* SECTION 3 — roadmap */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--dot">Future add-ons</span>
                        <h2 className="vq-h2 vq-mt-4">Conceptual roadmap</h2>
                        <p className="vq-lede">Blueprints generated. Engineering blocked until current pipeline clears.</p>
                    </div>

                    {soonProducts.length === 0 ? (
                        <div className="vq-card vq-card--xl vq-center vq-dp-empty"><p>No roadmap items cataloged.</p></div>
                    ) : (
                        <div className="vq-grid vq-grid--4">
                            {soonProducts.map((product) => (
                                <div key={product.id} className="vq-card vq-card--flat vq-dp-soon">
                                    <div className="vq-row" style={{ justifyContent: 'space-between' }}>
                                        <Hexagon size={22} aria-hidden="true" />
                                        <Lock size={16} aria-hidden="true" />
                                    </div>
                                    <h3 className="vq-dp-soon__name">{product.name}</h3>
                                    <p className="vq-dp-clamp">{product.description}</p>
                                    <span className="vq-badge vq-badge--soon vq-dp-soon__tag">Pending core</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* MODAL FOR DEVELOPMENT PREVIEWS */}
            {selectedProduct && (
                <div className="vq-gate" onClick={() => setSelectedProduct(null)}>
                    <div
                        className="vq-gate__card vq-dp-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dp-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button type="button" onClick={() => setSelectedProduct(null)} className="vq-gate__close" aria-label="Close">
                            <X size={20} />
                        </button>

                        <div className="vq-center">
                            <span className="vq-tile__icon" style={{ margin: '0 auto var(--vq-space-5)' }}><Rocket aria-hidden="true" /></span>
                            <span className="vq-eyebrow vq-eyebrow--accent">Early access preview</span>
                            <h2 id="dp-modal-title" className="vq-h2 vq-mt-3">{selectedProduct.name}</h2>
                            <p className="vq-small vq-text-2 vq-mt-3" style={{ marginInline: 'auto' }}>{selectedProduct.description}</p>
                        </div>

                        <h3 className="vq-label vq-mt-8" style={{ display: 'block', paddingBottom: 8, borderBottom: '1px solid var(--vq-line)' }}>Pre-order / testing portals</h3>
                        {(!selectedProduct.platforms || selectedProduct.platforms.length === 0) ? (
                            <div className="vq-dp-none vq-mt-4">Testing portals are currently closed.</div>
                        ) : (
                            <div className="vq-stack vq-gap-3 vq-mt-4 custom-scrollbar" style={{ maxHeight: 250, overflowY: 'auto' }}>
                                {selectedProduct.platforms.map((platform, idx) => (
                                    <a
                                        key={idx}
                                        href={platform.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="vq-card vq-card--interactive vq-dp-portal"
                                    >
                                        <span className="vq-row vq-gap-3">
                                            <ExternalLink size={18} aria-hidden="true" />
                                            <span className="vq-dp-portal__name">{platform.label || platform.name}</span>
                                        </span>
                                        <span className="vq-link">Access <ArrowRight size={16} aria-hidden="true" /></span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </MarketingLayout>
    );
}
