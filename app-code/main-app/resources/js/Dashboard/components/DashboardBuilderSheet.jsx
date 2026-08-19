import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

/**
 * DashboardBuilderSheet — VenQore Design System v2.0
 *
 * A slide-in drawer following VQ elevation + motion rules:
 *   --vq-z-drawer (500) for the panel itself
 *   --vq-dur-slow (480ms) for open/close
 *   --vq-elev-3 shadow on the panel edge
 *   --vq-accent / --vq-accent-text for active step indicators
 */

const DOMAINS = [
    { key: 'sales',      label: 'Sales',      desc: 'Revenue, orders, customer invoices.' },
    { key: 'finance',    label: 'Finance',     desc: 'Cash accounts, profits, balance status.' },
    { key: 'operations', label: 'Operations',  desc: 'Inventory, stock levels, operations.' },
    { key: 'staff',      label: 'Staff',       desc: 'Shift clock ins, staff counts.' },
];

const SIZES = [
    { key: '2x4', label: '2 Columns × 4 Rows', desc: 'Compact portrait layout.' },
    { key: '2x6', label: '2 Columns × 6 Rows', desc: 'Tall portrait layout.' },
    { key: '2x8', label: '2 Columns × 8 Rows', desc: 'Very tall portrait layout.' },
    { key: '4x4', label: '4 Columns × 4 Rows', desc: 'Square-like layout.' },
    { key: '4x6', label: '4 Columns × 6 Rows', desc: 'Balanced mid-size layout.' },
    { key: '4x8', label: '4 Columns × 8 Rows', desc: 'Tall mid-size layout.' },
    { key: '6x4', label: '6 Columns × 4 Rows', desc: 'Wide landscape layout.' },
    { key: '6x6', label: '6 Columns × 6 Rows', desc: 'Large square-like layout.' },
    { key: '6x8', label: '6 Columns × 8 Rows', desc: 'Large tall layout.' },
    { key: '8x4', label: '8 Columns × 4 Rows', desc: 'Very wide landscape layout.' },
    { key: '8x6', label: '8 Columns × 6 Rows', desc: 'Very wide tall layout.' },
    { key: '8x8', label: '8 Columns × 8 Rows', desc: 'Maximum grid size.' },
];

const STEP_LABELS = ['Domain', 'Metric', 'Visual', 'Size'];

export default function DashboardBuilderSheet({
    isOpen,
    onClose,
    catalogue = [],
    onSubmit
}) {
    if (!isOpen) return null;

    const [step, setStep] = useState(1);
    const [selectedDomain, setSelectedDomain] = useState('sales');
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedChart, setSelectedChart] = useState(null);
    const [selectedSize, setSelectedSize] = useState('4x4');

    // Step 1 -> Step 2 transition: Metric filter
    const metricsForDomain = catalogue.filter(m => m.domain === selectedDomain);

    const handleSelectDomain = (domain) => {
        setSelectedDomain(domain);
        setSelectedMetric(null);
        setSelectedChart(null);
        setStep(2);
    };

    const handleSelectMetric = (metric) => {
        setSelectedMetric(metric);
        setSelectedChart(metric.default_chart || 'stat');
        setStep(3);
    };

    const handleSelectChart = (chart) => {
        setSelectedChart(chart);
        setStep(4);
    };

    const handleFinish = () => {
        onSubmit({
            reading_key: selectedMetric.key,
            period: selectedMetric.default_period || 'today',
            chart: selectedChart,
            size: selectedSize
        });
        // Reset states
        setStep(1);
        setSelectedMetric(null);
        setSelectedChart(null);
        onClose();
    };

    /* ── shared card-row style ── */
    const rowStyle = (active = false) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '12px 14px',
        border: `1px solid ${active ? 'var(--vq-accent)' : 'var(--vq-line)'}`,
        borderRadius: 'var(--vq-r-lg)',
        background: active ? 'var(--vq-accent-quiet)' : 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: `border-color var(--vq-dur-fast), background var(--vq-dur-fast)`,
        fontFamily: 'var(--vq-font-sans)',
    });

    const backBtnStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: 'var(--vq-fs-caption)',
        fontWeight: 'var(--vq-fw-medium)',
        fontFamily: 'var(--vq-font-mono)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--vq-accent-text)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--vq-z-drawer)',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'flex-end',
            userSelect: 'none',
        }}>
            {/* Scrim */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--vq-scrim)',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    transition: `opacity var(--vq-dur-slow) var(--vq-ease-out)`,
                }}
            />

            {/* Panel */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '420px',
                background: 'var(--vq-raised)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--vq-elev-3)',
                borderLeft: '1px solid var(--vq-line)',
                animation: 'vq-slide-in var(--vq-dur-slow) var(--vq-ease) both',
            }}>
                <style>{`
                    @keyframes vq-slide-in {
                        from { transform: translateX(100%); }
                        to   { transform: translateX(0); }
                    }
                `}</style>

                {/* ── Header ── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    borderBottom: '1px solid var(--vq-line)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: 'var(--vq-r-md)',
                            background: 'var(--vq-accent-quiet)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--vq-accent-text)',
                            flexShrink: 0,
                        }}>
                            <Sparkles size={15} />
                        </div>
                        <h2 style={{
                            fontSize: 'var(--vq-fs-h3)',
                            fontWeight: 'var(--vq-fw-semi)',
                            letterSpacing: 'var(--vq-ls-h3)',
                            color: 'var(--vq-text)',
                            margin: 0,
                        }}>
                            Add Metric Card
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '6px',
                            cursor: 'pointer',
                            color: 'var(--vq-text-3)',
                            borderRadius: 'var(--vq-r-sm)',
                            display: 'flex',
                            transition: `color var(--vq-dur-instant), background var(--vq-dur-instant)`,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--vq-text)';
                            e.currentTarget.style.background = 'var(--vq-sunken)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--vq-text-3)';
                            e.currentTarget.style.background = 'none';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Step Navigator ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    borderBottom: '1px solid var(--vq-line-soft)',
                    padding: '14px 20px',
                    flexShrink: 0,
                    gap: '4px',
                }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                        }}>
                            <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: 'var(--vq-r-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'var(--vq-fw-semi)',
                                fontFamily: 'var(--vq-font-mono)',
                                background: step >= s ? 'var(--vq-accent)' : 'var(--vq-sunken)',
                                color: step >= s ? 'var(--vq-on-accent)' : 'var(--vq-text-3)',
                                border: `1px solid ${step >= s ? 'var(--vq-accent)' : 'var(--vq-line)'}`,
                                transition: `background var(--vq-dur-fast), color var(--vq-dur-fast)`,
                            }}>
                                {step > s ? <Check size={11} /> : s}
                            </div>
                            <span style={{
                                fontFamily: 'var(--vq-font-mono)',
                                fontSize: 'var(--vq-fs-eyebrow)',
                                letterSpacing: 'var(--vq-ls-eyebrow)',
                                textTransform: 'uppercase',
                                fontWeight: 'var(--vq-fw-medium)',
                                color: step === s ? 'var(--vq-accent-text)' : 'var(--vq-text-3)',
                                transition: `color var(--vq-dur-fast)`,
                            }}>
                                {STEP_LABELS[s - 1]}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Step Content ── */}
                <div style={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}>

                    {/* STEP 1: Domain Selection */}
                    {step === 1 && (
                        <>
                            <h3 style={{
                                fontSize: 'var(--vq-fs-small)',
                                fontWeight: 'var(--vq-fw-semi)',
                                letterSpacing: '-0.01em',
                                color: 'var(--vq-text)',
                                margin: '0 0 8px',
                            }}>
                                Select a Domain
                            </h3>
                            {DOMAINS.map(d => (
                                <button
                                    key={d.key}
                                    onClick={() => handleSelectDomain(d.key)}
                                    style={rowStyle(selectedDomain === d.key)}
                                    onMouseEnter={e => {
                                        if (selectedDomain !== d.key) {
                                            e.currentTarget.style.borderColor = 'var(--vq-line-strong)';
                                            e.currentTarget.style.background = 'var(--vq-sunken)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedDomain !== d.key) {
                                            e.currentTarget.style.borderColor = 'var(--vq-line)';
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <span style={{
                                        fontSize: 'var(--vq-fs-small)',
                                        fontWeight: 'var(--vq-fw-semi)',
                                        color: 'var(--vq-text)',
                                        marginBottom: '3px',
                                        textTransform: 'capitalize',
                                        display: 'block',
                                    }}>
                                        {d.label}
                                    </span>
                                    <span style={{
                                        fontSize: 'var(--vq-fs-caption)',
                                        color: 'var(--vq-text-2)',
                                        lineHeight: 'var(--vq-lh-caption)',
                                        display: 'block',
                                    }}>
                                        {d.desc}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}

                    {/* STEP 2: Metric Picker */}
                    {step === 2 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h3 style={{
                                    fontSize: 'var(--vq-fs-small)',
                                    fontWeight: 'var(--vq-fw-semi)',
                                    color: 'var(--vq-text)',
                                    margin: 0,
                                }}>
                                    Select a Metric
                                </h3>
                                <button onClick={() => setStep(1)} style={backBtnStyle}>
                                    <ArrowLeft size={11} /> Back
                                </button>
                            </div>
                            {metricsForDomain.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '48px 0',
                                    color: 'var(--vq-text-3)',
                                    fontSize: 'var(--vq-fs-small)',
                                    fontFamily: 'var(--vq-font-sans)',
                                }}>
                                    No metrics available for <strong style={{ color: 'var(--vq-text-2)' }}>{selectedDomain}</strong>.
                                </div>
                            ) : (
                                metricsForDomain.map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => handleSelectMetric(m)}
                                        style={rowStyle(false)}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--vq-line-strong)';
                                            e.currentTarget.style.background = 'var(--vq-sunken)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'var(--vq-line)';
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <span style={{
                                            fontSize: 'var(--vq-fs-small)',
                                            fontWeight: 'var(--vq-fw-semi)',
                                            color: 'var(--vq-text)',
                                            marginBottom: '3px',
                                            display: 'block',
                                        }}>
                                            {m.label}
                                        </span>
                                        <span style={{
                                            fontSize: 'var(--vq-fs-caption)',
                                            color: 'var(--vq-text-2)',
                                            lineHeight: 'var(--vq-lh-caption)',
                                            display: 'block',
                                        }}>
                                            {m.description}
                                        </span>
                                    </button>
                                ))
                            )}
                        </>
                    )}

                    {/* STEP 3: Visual Configuration */}
                    {step === 3 && selectedMetric && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h3 style={{
                                    fontSize: 'var(--vq-fs-small)',
                                    fontWeight: 'var(--vq-fw-semi)',
                                    color: 'var(--vq-text)',
                                    margin: 0,
                                }}>
                                    Select Chart Type
                                </h3>
                                <button onClick={() => setStep(2)} style={backBtnStyle}>
                                    <ArrowLeft size={11} /> Back
                                </button>
                            </div>

                            {/* Selected metric badge */}
                            <div style={{
                                padding: '10px 14px',
                                background: 'var(--vq-sunken)',
                                border: '1px solid var(--vq-line-soft)',
                                borderRadius: 'var(--vq-r-md)',
                                marginBottom: '4px',
                            }}>
                                <span style={{
                                    fontFamily: 'var(--vq-font-mono)',
                                    fontSize: 'var(--vq-fs-eyebrow)',
                                    letterSpacing: 'var(--vq-ls-eyebrow)',
                                    textTransform: 'uppercase',
                                    color: 'var(--vq-text-3)',
                                    display: 'block',
                                    marginBottom: '3px',
                                }}>
                                    Selected Metric
                                </span>
                                <span style={{
                                    fontSize: 'var(--vq-fs-small)',
                                    fontWeight: 'var(--vq-fw-semi)',
                                    color: 'var(--vq-text)',
                                }}>
                                    {selectedMetric.label}
                                </span>
                            </div>

                            {selectedMetric.charts.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleSelectChart(c)}
                                    style={{
                                        ...rowStyle(selectedChart === c),
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    onMouseEnter={e => {
                                        if (selectedChart !== c) {
                                            e.currentTarget.style.borderColor = 'var(--vq-line-strong)';
                                            e.currentTarget.style.background = 'var(--vq-sunken)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedChart !== c) {
                                            e.currentTarget.style.borderColor = 'var(--vq-line)';
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <span style={{
                                        fontSize: 'var(--vq-fs-small)',
                                        fontWeight: selectedChart === c ? 'var(--vq-fw-semi)' : 'var(--vq-fw-medium)',
                                        color: selectedChart === c ? 'var(--vq-accent-text)' : 'var(--vq-text)',
                                        textTransform: 'capitalize',
                                    }}>
                                        {c}
                                    </span>
                                    {selectedChart === c && <Check size={15} style={{ color: 'var(--vq-accent)', flexShrink: 0 }} />}
                                </button>
                            ))}
                        </>
                    )}

                    {/* STEP 4: Sizing / Placement */}
                    {step === 4 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h3 style={{
                                    fontSize: 'var(--vq-fs-small)',
                                    fontWeight: 'var(--vq-fw-semi)',
                                    color: 'var(--vq-text)',
                                    margin: 0,
                                }}>
                                    Select Card Size
                                </h3>
                                <button onClick={() => setStep(3)} style={backBtnStyle}>
                                    <ArrowLeft size={11} /> Back
                                </button>
                            </div>

                            {SIZES.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setSelectedSize(s.key)}
                                    style={rowStyle(selectedSize === s.key)}
                                    onMouseEnter={e => {
                                        if (selectedSize !== s.key) {
                                            e.currentTarget.style.borderColor = 'var(--vq-line-strong)';
                                            e.currentTarget.style.background = 'var(--vq-sunken)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedSize !== s.key) {
                                            e.currentTarget.style.borderColor = 'var(--vq-line)';
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <span style={{
                                        fontSize: 'var(--vq-fs-small)',
                                        fontWeight: 'var(--vq-fw-semi)',
                                        color: selectedSize === s.key ? 'var(--vq-accent-text)' : 'var(--vq-text)',
                                        marginBottom: '3px',
                                        display: 'block',
                                    }}>
                                        {s.label}
                                    </span>
                                    <span style={{
                                        fontSize: 'var(--vq-fs-caption)',
                                        color: 'var(--vq-text-2)',
                                        display: 'block',
                                    }}>
                                        {s.desc}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* ── Footer Controls ── */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--vq-line)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 'var(--vq-control-md)',
                            padding: '0 18px',
                            borderRadius: 'var(--vq-r-md)',
                            fontFamily: 'var(--vq-font-sans)',
                            fontSize: 'var(--vq-fs-small)',
                            fontWeight: 'var(--vq-fw-medium)',
                            color: 'var(--vq-text-2)',
                            background: 'transparent',
                            border: '1px solid var(--vq-line)',
                            cursor: 'pointer',
                            transition: `background var(--vq-dur-fast), color var(--vq-dur-fast)`,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--vq-sunken)';
                            e.currentTarget.style.color = 'var(--vq-text)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--vq-text-2)';
                        }}
                    >
                        Cancel
                    </button>

                    {step === 4 ? (
                        <button
                            onClick={handleFinish}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                height: 'var(--vq-control-md)',
                                padding: '0 20px',
                                borderRadius: 'var(--vq-r-md)',
                                fontFamily: 'var(--vq-font-sans)',
                                fontSize: 'var(--vq-fs-small)',
                                fontWeight: 'var(--vq-fw-semi)',
                                background: 'var(--vq-accent)',
                                color: 'var(--vq-on-accent)',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: 'var(--vq-elev-2)',
                                transition: `background var(--vq-dur-fast), transform var(--vq-dur-fast)`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--vq-accent-hover)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--vq-accent)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <span>Add to Dashboard</span>
                            <Check size={14} />
                        </button>
                    ) : (
                        <button
                            disabled={step === 1 && !selectedDomain}
                            onClick={() => setStep(step + 1)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                height: 'var(--vq-control-md)',
                                padding: '0 18px',
                                borderRadius: 'var(--vq-r-md)',
                                fontFamily: 'var(--vq-font-sans)',
                                fontSize: 'var(--vq-fs-small)',
                                fontWeight: 'var(--vq-fw-semi)',
                                background: 'var(--vq-text)',
                                color: 'var(--vq-text-inverted)',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: (step === 1 && !selectedDomain) ? 0.42 : 1,
                                transition: `background var(--vq-dur-fast), transform var(--vq-dur-fast)`,
                            }}
                            onMouseEnter={e => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.background = 'var(--vq-ink-800)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--vq-text)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <span>Next Step</span>
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
