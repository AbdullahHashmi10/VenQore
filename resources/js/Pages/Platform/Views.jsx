import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    DollarSign, TrendingUp, ShieldCheck, FlaskConical, Inbox, UserCog, BadgeCheck,
    Settings, HardDrive, Server, ToggleRight, Tag, Play, RotateCcw, Camera,
    CheckCircle2, XCircle, CircleDot, CreditCard, Banknote, Percent, Globe,
    Upload, FileCheck2, ScanFace, Phone, MessageSquare, Bot, Database, Activity,
} from 'lucide-react';
import SmokeTestRunner from '@/Components/SuperAdmin/SmokeTestRunner';
import {
    useT, Panel, KpiCard, Button, Badge, ComingSoon, EmptyState, DataTable,
    StatusBadge, Field, Input, Select, Spinner, Drawer,
} from '@/Platform/ui';
import { BRAND, GRADIENTS, fmtCurrency, fmtNumber } from '@/Platform/theme';

/* ════════════════ REVENUE (paid, server-side) ════════════════ */
export function RevenueView({ revenue = {}, stats = {}, payout_pool = {} }) {
    const t = useT();
    const planMrr = revenue.plan_mrr || [];

    // Partner form state
    const [partnerName, setPartnerName] = useState('');
    const [partnerRole, setPartnerRole] = useState('');
    const [partnerEquity, setPartnerEquity] = useState('');

    // Drawing form state
    const [drawPartnerId, setDrawPartnerId] = useState('');
    const [drawAmount, setDrawAmount] = useState('');
    const [drawDescription, setDrawDescription] = useState('');

    const [months, setMonths] = useState(payout_pool.months || 1);

    const handleMonthsChange = (val) => {
        const m = Math.max(1, parseInt(val) || 1);
        setMonths(m);
        router.visit(window.route('platform.dashboard'), {
            data: { view: 'revenue', months: m },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const addPartner = (e) => {
        e.preventDefault();
        router.post(window.route('platform.partners.store'), {
            name: partnerName,
            role: partnerRole,
            equity_pct: partnerEquity,
        }, {
            onSuccess: () => {
                setPartnerName('');
                setPartnerRole('');
                setPartnerEquity('');
            },
            preserveScroll: true,
        });
    };

    const removePartner = (id) => {
        if (confirm('Are you sure you want to remove this partner?')) {
            router.delete(window.route('platform.partners.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const logDrawing = (e) => {
        e.preventDefault();
        router.post(window.route('platform.drawings.store'), {
            partner_id: drawPartnerId,
            amount: drawAmount,
            description: drawDescription,
        }, {
            onSuccess: () => {
                setDrawPartnerId('');
                setDrawAmount('');
                setDrawDescription('');
            },
            preserveScroll: true,
        });
    };

    const clearAllDrawings = () => {
        const passcode = prompt('Enter your action passcode to confirm clearing drawings:');
        if (passcode) {
            router.post(window.route('platform.drawings.clear-history'), { passcode }, {
                preserveScroll: true,
            });
        }
    };

    const totalEquityAllocated = payout_pool.total_equity_allocated || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Header icon={DollarSign} accent={BRAND.emerald} title="Revenue & Dividends" subtitle="Real paid-subscription income — computed server-side, internal & demo excluded." />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,210px),1fr))', gap: 14 }}>
                <KpiCard label="MRR" value={fmtCurrency(revenue.mrr)} icon={DollarSign} accent={BRAND.emerald} gradient={GRADIENTS.revenue} footnote="Monthly recurring revenue" />
                <KpiCard label="ARR" value={fmtCurrency(revenue.arr)} icon={TrendingUp} accent={BRAND.indigo} footnote="Annual run-rate" />
                <KpiCard label="Net Revenue" value={fmtCurrency(revenue.net_revenue)} icon={Banknote} accent={BRAND.violet} footnote="After est. gateway fees" />
                <KpiCard label="Paid Subscribers" value={fmtNumber(revenue.paid_count)} icon={CreditCard} accent={BRAND.sky} footnote="Active paying stores" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))', gap: 20 }}>
                {/* MRR by Plan */}
                <Panel pad={0}>
                    <div style={{ padding: '16px 18px', borderBottom: `1px solid ${t.border}`, fontSize: 15, fontWeight: 800, color: t.ink }}>MRR by Plan</div>
                    {planMrr.length === 0 ? (
                        <EmptyState icon={DollarSign} title="No paid subscriptions yet" message="Once stores subscribe to a paid plan, their MRR contribution appears here." />
                    ) : (
                        <div style={{ padding: 12 }}>
                            {planMrr.map((p) => (
                                <div key={p.plan} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 11 }} className="vq-row">
                                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: t.ink, textTransform: 'capitalize' }}>{p.plan}</span>
                                    <span style={{ fontSize: 12.5, color: t.muted }}>{p.count} subs</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: BRAND.emerald, minWidth: 80, textAlign: 'right' }}>{fmtCurrency(p.mrr)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Cumulative Payout Settings */}
                <Panel>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 800, color: t.ink, fontSize: 15 }}>Cumulative Dividends Pool</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                            <span style={{ color: t.muted, fontWeight: 700 }}>Months:</span>
                            <input type="number" min="1" max="24" value={months} onChange={e => handleMonthsChange(e.target.value)} style={{ width: 55, padding: '6px 8px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.border}`, color: BRAND.indigo2, fontWeight: 800, textAlign: 'center', outline: 'none' }} />
                        </div>
                    </div>
                    
                    {totalEquityAllocated > 100 && (
                        <div style={{ padding: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <div><strong>Warning:</strong> Total equity allocation is <strong>{totalEquityAllocated}%</strong>, which exceeds 100%! Payout projects will exceed net profit pool.</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.panel2, borderRadius: 10 }}>
                            <span style={{ fontSize: 12, color: t.muted, fontWeight: 700, textTransform: 'uppercase' }}>Monthly Net Pool</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: BRAND.emerald }}>{fmtCurrency(payout_pool.net_mrr_pkr || 0, 'PKR')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.panel2, borderRadius: 10 }}>
                            <span style={{ fontSize: 12, color: t.muted, fontWeight: 700, textTransform: 'uppercase' }}>Cumulative Pot ({months} mo)</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: BRAND.indigo }}>{fmtCurrency(payout_pool.cumulative_payout_pot || 0, 'PKR')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.panel2, borderRadius: 10 }}>
                            <span style={{ fontSize: 12, color: t.muted, fontWeight: 700, textTransform: 'uppercase' }}>Unallocated Surplus</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: t.ink }}>{Math.max(0, 100 - totalEquityAllocated)}%</span>
                        </div>
                    </div>
                </Panel>
            </div>

            {/* Partners Profiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,320px),1fr))', gap: 20 }}>
                {/* Profiles Grid */}
                <Panel pad={18}>
                    <div style={{ fontWeight: 800, color: t.ink, fontSize: 15, marginBottom: 14 }}>Equity Partner Profiles</div>
                    {(!payout_pool.profiles || payout_pool.profiles.length === 0) ? (
                        <EmptyState icon={DollarSign} title="No partners registered" message="Add partners on the right to build the equity distribution list." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {payout_pool.profiles.map(p => (
                                <div key={p.id} style={{ background: t.panel2, borderRadius: 14, padding: 14, border: `1px solid ${t.border}`, position: 'relative' }}>
                                    <button onClick={() => removePartner(p.id)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: BRAND.rose, cursor: 'pointer' }} aria-label="Delete partner">
                                        <X size={15} />
                                    </button>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${BRAND.indigo}1f`, color: BRAND.indigo2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: t.ink, fontSize: 13.5 }}>{p.name}</div>
                                            <div style={{ fontSize: 11, color: t.muted }}>{p.role}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: `1px solid ${t.border}`, paddingTop: 10, fontSize: 11.5, fontFamily: 'monospace' }}>
                                        <div>
                                            <span style={{ color: t.muted, fontSize: 10, display: 'block', marginBottom: 2 }}>Share ({p.equity_pct}%)</span>
                                            <span style={{ fontWeight: 800, color: t.ink }}>{fmtCurrency(p.total_share, 'PKR')}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: t.muted, fontSize: 10, display: 'block', marginBottom: 2 }}>Amount Drawn</span>
                                            <span style={{ fontWeight: 800, color: BRAND.amber }}>{fmtCurrency(p.total_drawn, 'PKR')}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: t.muted, fontSize: 10, display: 'block', marginBottom: 2 }}>Remaining</span>
                                            <span style={{ fontWeight: 900, color: p.remaining >= 0 ? BRAND.emerald : BRAND.rose }}>{fmtCurrency(p.remaining, 'PKR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Operations side panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Add Partner Form */}
                    <Panel>
                        <div style={{ fontWeight: 800, color: t.ink, fontSize: 14, marginBottom: 12 }}>Register New Partner</div>
                        <form onSubmit={addPartner} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Field label="Full Name">
                                <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Full Name" required />
                            </Field>
                            <Field label="Role">
                                <Input value={partnerRole} onChange={e => setPartnerRole(e.target.value)} placeholder="e.g. VP Marketing" required />
                            </Field>
                            <Field label="Equity Share (%)">
                                <Input type="number" step="0.1" value={partnerEquity} onChange={e => setPartnerEquity(e.target.value)} placeholder="Equity Share Percentage" required />
                            </Field>
                            <Button type="submit">Add Partner</Button>
                        </form>
                    </Panel>

                    {/* Log Partner Drawing Form */}
                    <Panel>
                        <div style={{ fontWeight: 800, color: t.ink, fontSize: 14, marginBottom: 12 }}>Log Partner Drawing</div>
                        <form onSubmit={logDrawing} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Field label="Select Partner">
                                <Select
                                    value={drawPartnerId}
                                    onChange={e => setDrawPartnerId(e.target.value)}
                                    options={[
                                        { value: '', label: 'Select Partner...' },
                                        ...(payout_pool.profiles || []).map(p => ({ value: String(p.id), label: `${p.name} (${p.equity_pct}%)` }))
                                    ]}
                                    required
                                />
                            </Field>
                            <Field label="Draw Amount (PKR)">
                                <Input type="number" value={drawAmount} onChange={e => setDrawAmount(e.target.value)} placeholder="Draw Amount" required />
                            </Field>
                            <Field label="Description">
                                <Input value={drawDescription} onChange={e => setDrawDescription(e.target.value)} placeholder="e.g. Q1 Dividend" />
                            </Field>
                            <Button type="submit" variant="secondary" style={{ color: BRAND.amber, borderColor: BRAND.amber }}>Record Payout</Button>
                        </form>
                    </Panel>
                </div>
            </div>

            {/* Drawings Transactions Log Table */}
            <Panel pad={0}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ fontWeight: 800, color: t.ink, fontSize: 15 }}>Drawing Transaction Logs</div>
                    {payout_pool.drawings && payout_pool.drawings.length > 0 && (
                        <button onClick={clearAllDrawings} style={{ background: 'none', border: 'none', color: BRAND.rose, fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Clear History
                        </button>
                    )}
                </div>
                <DataTable
                    columns={[
                        { header: 'Date', cell: (r) => r.date },
                        { header: 'Partner Name', cell: (r) => <span style={{ fontWeight: 700, color: t.ink }}>{r.partner_name}</span> },
                        { header: 'Amount (PKR)', cell: (r) => <span style={{ fontWeight: 800, color: BRAND.amber }}>{fmtCurrency(r.amount, 'PKR')}</span> },
                        { header: 'Description', cell: (r) => r.description || '—' }
                    ]}
                    rows={payout_pool.drawings || []}
                    emptyTitle="No drawings logged yet"
                    emptyMessage="All dividends logged for partners will be listed here."
                />
            </Panel>

            <Note t={t}>This page reads only from <code>PlatformRevenueService</code> and persists equity configurations to SQL. There is no financial math in the browser, and no <code>localStorage</code> ledger.</Note>
        </div>
    );
}

/* ════════════════ GMV (merchant volume) ════════════════ */
export function GmvView({ revenue = {}, stats = {} }) {
    const t = useT();
    return (
        <div>
            <Header icon={TrendingUp} accent={BRAND.sky} title="Merchant GMV" subtitle="Gross merchant volume — what your customers sell to their customers. This is not VenQore revenue." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,210px),1fr))', gap: 14, marginBottom: 18 }}>
                <KpiCard label="Total GMV" value={fmtCurrency(revenue.gmv ?? stats.total_volume)} icon={TrendingUp} accent={BRAND.sky} gradient={GRADIENTS.gmv} big />
                <KpiCard label="Active Stores" value={fmtNumber(stats.active_stores)} icon={Database} accent={BRAND.indigo} />
                <KpiCard label="Avg per Store" value={fmtCurrency((revenue.gmv || 0) / Math.max(1, stats.active_stores || 1))} icon={Activity} accent={BRAND.violet} />
            </div>
            <Panel>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: `${BRAND.sky}1f`, color: BRAND.sky, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Globe size={22} /></div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.ink }}>Why GMV ≠ Revenue</div>
                        <p style={{ fontSize: 13.5, color: t.sub, lineHeight: 1.65, margin: '6px 0 0' }}>
                            GMV is the total value of sales processed through every merchant's store. VenQore earns subscription revenue (see the Revenue page), not a cut of merchant sales. Showing these separately keeps the platform's true income honest.
                        </p>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

/* ════════════════ TESTING CENTER ════════════════ */
export function TestingView() {
    const t = useT();

    const initialCategories = [
        { key: 'financial', name: 'Financial Integrity', desc: 'Ledger balance · FIFO · revenue rules', icon: DollarSign, count: 14 },
        { key: 'isolation', name: 'Tenant Isolation', desc: 'No cross-tenant data leakage', icon: ShieldCheck, count: 9 },
        { key: 'billing', name: 'Billing & Coupons', desc: 'Subscriptions · coupon redemption', icon: CreditCard, count: 11 },
        { key: 'auth', name: 'Auth & Permissions', desc: 'Login · PIN · role gates', icon: UserCog, count: 8 },
        { key: 'infra', name: 'Infrastructure', desc: 'Queue · mail · webhooks', icon: Server, count: 6 },
        { key: 'smoke', name: 'Smoke (live, read-only)', desc: 'Production health · never mutates', icon: Activity, count: 5 },
    ];

    const [activeCategory, setActiveCategory] = useState(null);
    const [statuses, setStatuses] = useState(
        initialCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: 'idle' }), {})
    );

    const handleRunCategory = (key) => {
        setStatuses(prev => ({ ...prev, [key]: 'running' }));
        setActiveCategory(key);
    };

    const handleRunAll = () => {
        setStatuses(prev => {
            const next = { ...prev };
            initialCategories.forEach(c => {
                next[c.key] = 'running';
            });
            return next;
        });
        setActiveCategory('all');
    };

    const handleTestComplete = (key, passed) => {
        setStatuses(prev => ({ ...prev, [key]: passed ? 'passed' : 'failed' }));
    };

    const handleRunAllComplete = (passed) => {
        setStatuses(prev => {
            const next = { ...prev };
            initialCategories.forEach(c => {
                next[c.key] = passed ? 'passed' : 'failed';
            });
            return next;
        });
    };

    const runKeys = Object.keys(statuses);
    const passedCount = runKeys.filter(k => statuses[k] === 'passed').length;
    const failedCount = runKeys.filter(k => statuses[k] === 'failed').length;

    let verdictType = 'initial';
    if (runKeys.some(k => statuses[k] === 'running')) {
        verdictType = 'running';
    } else if (failedCount > 0) {
        verdictType = 'attention';
    } else if (passedCount > 0) {
        verdictType = 'healthy';
    }

    return (
        <div>
            <Header 
                icon={ShieldCheck} 
                accent={BRAND.emerald} 
                title="Testing Center" 
                subtitle="One-click categorized health check. Green across the board means you're cleared to ship."
                actions={
                    <Button icon={Play} onClick={handleRunAll} disabled={verdictType === 'running'}>
                        {verdictType === 'running' ? <Spinner color="#fff" /> : 'Run full health check'}
                    </Button>
                } 
            />

            {/* Verdict Banner */}
            <Panel style={{ 
                marginBottom: 18, 
                background: verdictType === 'healthy' 
                    ? `${BRAND.emerald}11` 
                    : verdictType === 'attention' 
                        ? `${BRAND.rose}11` 
                        : verdictType === 'running' 
                            ? `${BRAND.amber}11` 
                            : GRADIENTS.brandSoft,
                border: `1px solid ${
                    verdictType === 'healthy' 
                        ? BRAND.emerald 
                        : verdictType === 'attention' 
                            ? BRAND.rose 
                            : verdictType === 'running' 
                                ? BRAND.amber 
                                : 'transparent'
                }`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                        width: 52, height: 52, borderRadius: 14, 
                        background: verdictType === 'healthy' 
                            ? `${BRAND.emerald}22` 
                            : verdictType === 'attention' 
                                ? `${BRAND.rose}22` 
                                : `${BRAND.indigo}22`, 
                        color: verdictType === 'healthy' 
                            ? BRAND.emerald 
                            : verdictType === 'attention' 
                                ? BRAND.rose 
                                : BRAND.indigo, 
                        display: 'grid', placeItems: 'center' 
                    }}>
                        {verdictType === 'healthy' ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
                    </div>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: t.ink }}>
                            {verdictType === 'healthy' && 'Platform Healthy'}
                            {verdictType === 'attention' && 'Attention Required'}
                            {verdictType === 'running' && 'Running Verification Suites…'}
                            {verdictType === 'initial' && 'Testing Center Ready'}
                        </div>
                        <div style={{ fontSize: 13, color: t.muted }}>
                            {verdictType === 'healthy' && `All ${passedCount} suites verification checks passed. Ready to deploy.`}
                            {verdictType === 'attention' && `${failedCount} suites failed verification tests. Check logs below.`}
                            {verdictType === 'running' && 'Executing verification checks in background...'}
                            {verdictType === 'initial' && 'No tests run yet in this session. Start verification above.'}
                        </div>
                    </div>
                </div>
            </Panel>

            {/* Suite Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))', gap: 14 }}>
                {initialCategories.map((c) => {
                    const status = statuses[c.key];
                    return (
                        <Panel key={c.key} hover>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: 11, 
                                    background: status === 'passed' 
                                        ? `${BRAND.emerald}1f` 
                                        : status === 'failed' 
                                            ? `${BRAND.rose}1f` 
                                            : `${BRAND.indigo}1f`, 
                                    color: status === 'passed' 
                                        ? BRAND.emerald 
                                        : status === 'failed' 
                                            ? BRAND.rose 
                                            : BRAND.indigo2, 
                                    display: 'grid', placeItems: 'center', flexShrink: 0 
                                }}>
                                    <c.icon size={19} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>{c.name}</span>
                                        {status === 'passed' && <Badge color={BRAND.emerald}>Passed</Badge>}
                                        {status === 'failed' && <Badge color={BRAND.rose}>Failed</Badge>}
                                        {status === 'running' && <Badge color={BRAND.amber}>Running</Badge>}
                                        {status === 'idle' && <Badge color={BRAND.slate}>Idle</Badge>}
                                    </div>
                                    <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>{c.desc}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                                        <span style={{ fontSize: 11.5, color: t.faint }}>{c.count} checks</span>
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                            {(status === 'passed' || status === 'failed') && (
                                                <Button size="sm" variant="secondary" onClick={() => setActiveCategory(c.key)}>
                                                    View Logs
                                                </Button>
                                            )}
                                            <Button size="sm" variant="secondary" icon={Play} onClick={() => handleRunCategory(c.key)} disabled={verdictType === 'running'}>
                                                {status === 'running' ? <Spinner size={13} /> : 'Run'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    );
                })}
            </div>

            {/* Test Run Drawer */}
            {activeCategory && (
                <Drawer
                    open={!!activeCategory}
                    onClose={() => setActiveCategory(null)}
                    title={activeCategory === 'all' ? 'Full Health Check' : `${initialCategories.find(c => c.key === activeCategory)?.name} Suite`}
                    subtitle="Pest test suite execution terminal logs"
                    width={600}
                >
                    <div style={{ background: '#09090e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 }}>
                        <SmokeTestRunner 
                            category={activeCategory} 
                            onComplete={(passed) => {
                                if (activeCategory === 'all') {
                                    handleRunAllComplete(passed);
                                } else {
                                    handleTestComplete(activeCategory, passed);
                                }
                            }} 
                        />
                    </div>
                </Drawer>
            )}

            <Note t={t}>Built on the existing live Smoke suite (read-only against <code>venqore_pos</code>). Additional categories tag Pest suites; a single banner summarizes ship-readiness.</Note>
        </div>
    );
}

/* ════════════════ DEMO & SANDBOX ════════════════ */
export function DemoView() {
    const t = useT();
    return (
        <div>
            <Header icon={FlaskConical} accent={BRAND.violet} title="Demo & Sandbox" subtitle="The golden-master demo store — status, one-click reset, and deploy-proof snapshots." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,220px),1fr))', gap: 14, marginBottom: 18 }}>
                <KpiCard label="Demo Status" value="Active" icon={CircleDot} accent={BRAND.emerald} footnote="Golden master protected" />
                <KpiCard label="Last Reset" value="—" icon={RotateCcw} accent={BRAND.indigo} footnote="Reset to golden master" />
                <KpiCard label="Snapshots" value="0" icon={Camera} accent={BRAND.sky} footnote="Stored versions" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px),1fr))', gap: 14 }}>
                <Panel hover>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Reset Demo</div>
                    <p style={{ fontSize: 12.5, color: t.muted, margin: '6px 0 14px' }}>Wipe the demo store and restore it to the pristine golden master.</p>
                    <Button variant="secondary" icon={RotateCcw} onClick={() => router.post(window.route('platform.demo-store.reset'))}>Reset to golden master</Button>
                </Panel>
                <Panel hover>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Snapshot & Restore</span>
                        <Badge color={BRAND.amber}>Backend Pending</Badge>
                    </div>
                    <p style={{ fontSize: 12.5, color: t.muted, margin: '6px 0 14px' }}>Capture a versioned snapshot so deploys never wipe the demo. Auto-restores after updates.</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button variant="secondary" icon={Camera} disabled>Take snapshot</Button>
                        <Button variant="ghost" icon={Upload} disabled>Restore</Button>
                    </div>
                </Panel>
            </div>
        </div>
    );
}

/* ════════════════ SUPPORT INBOX ════════════════ */
export function SupportView({ tickets = {}, ticket_filters = {} }) {
    const t = useT();
    const activeFilters = ticket_filters || { status: 'open', source: 'all' };

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyBody, setReplyBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rows = tickets.data || [];

    const handleFilterChange = (newSource, newStatus) => {
        router.visit(window.route('platform.dashboard'), {
            data: {
                view: 'support',
                ticket_source: newSource,
                ticket_status: newStatus,
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleRowClick = (row) => {
        fetch(window.route('platform.ticket.show', row.id))
            .then(res => res.json())
            .then(data => setSelectedTicket(data))
            .catch(err => alert('Failed to fetch ticket: ' + err.message));
    };

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (!replyBody.trim()) return;
        setIsSubmitting(true);

        router.post(window.route('platform.ticket.reply', selectedTicket.id), {
            body: replyBody
        }, {
            onSuccess: () => {
                setReplyBody('');
                setIsSubmitting(false);
                // Refresh ticket details
                fetch(window.route('platform.ticket.show', selectedTicket.id))
                    .then(res => res.json())
                    .then(data => setSelectedTicket(data));
            },
            onError: () => {
                setIsSubmitting(false);
            },
            preserveScroll: true
        });
    };

    const handleStatusUpdate = (newStatus) => {
        const routeName = selectedTicket.source === 'vena_chat' ? 'platform.vena.ticket.status' : 'platform.ticket.status';
        router.post(window.route(routeName, selectedTicket.id), {
            status: newStatus
        }, {
            onSuccess: () => {
                // Refresh ticket details
                fetch(window.route('platform.ticket.show', selectedTicket.id))
                    .then(res => res.json())
                    .then(data => setSelectedTicket(data));
            },
            preserveScroll: true
        });
    };

    const getSourceLabel = (src) => {
        if (src === 'vena_chat') return 'Vena Chat';
        if (src === 'digital_hub') return 'Digital Hub';
        return 'V1 Ticket';
    };

    const getSourceColor = (src) => {
        if (src === 'vena_chat') return BRAND.fuchsia;
        if (src === 'digital_hub') return BRAND.sky;
        return BRAND.indigo;
    };

    // Chat transcript parser for Vena
    const transcript = selectedTicket ? (
        selectedTicket.source === 'vena_chat'
            ? (() => {
                  const message = selectedTicket.message || '';
                  const transcriptStart = message.indexOf('--- CHAT TRANSCRIPT ---');
                  if (transcriptStart === -1) {
                      return { header: message, lines: [] };
                  }
                  const header = message.slice(0, transcriptStart).trim();
                  const transcriptRaw = message.slice(transcriptStart + '--- CHAT TRANSCRIPT ---'.length).trim();
                  const lines = transcriptRaw
                      .split('\n')
                      .filter(Boolean)
                      .map((line) => {
                          const match = line.match(/^\[([^\]]+)\]\s+(\w+):\s+(.+)$/);
                          if (match) {
                              return { time: match[1], sender: match[2], body: match[3] };
                          }
                          return { time: '', sender: '', body: line };
                      });
                  return { header, lines };
              })()
            : null
    ) : null;

    return (
        <div>
            <Header icon={Inbox} accent={BRAND.indigo} title="Support Inbox" subtitle="One triage queue across V1 tickets, Vena chats and Digital-Hub conversations." />
            
            <DataTable
                columns={[
                    { 
                        header: 'Subject / Requester', 
                        cell: (r) => (
                            <div>
                                <div style={{ fontWeight: 700, color: t.ink }}>{r.subject || `Support Ticket #${r.id}`}</div>
                                <div style={{ fontSize: 11, color: t.muted }}>
                                    by {r.submitted_by?.name || r.requester_name || 'Anonymous'} · {r.submitted_by?.email || r.requester_email || ''}
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Store',
                        cell: (r) => r.tenant ? <span style={{ fontWeight: 600 }}>{r.tenant.name}</span> : <span style={{ color: t.faint }}>—</span>
                    },
                    { 
                        header: 'Source', 
                        cell: (r) => <Badge color={getSourceColor(r.source)}>{getSourceLabel(r.source)}</Badge> 
                    },
                    { 
                        header: 'Status', 
                        cell: (r) => <StatusBadge status={r.status} /> 
                    },
                    {
                        header: 'Created',
                        cell: (r) => new Date(r.created_at).toLocaleDateString()
                    }
                ]}
                rows={rows.map(row => ({
                    ...row,
                    __onClick: () => handleRowClick(row)
                }))}
                filters={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Select 
                            value={activeFilters.source} 
                            onChange={(e) => handleFilterChange(e.target.value, activeFilters.status)} 
                            style={{ width: 140 }} 
                            options={[
                                { value: 'all', label: 'All Sources' }, 
                                { value: 'portal', label: 'V1 Portal' }, 
                                { value: 'vena_chat', label: 'Vena Chat' }, 
                                { value: 'digital_hub', label: 'Digital Hub' }
                            ]} 
                        />
                        <Select 
                            value={activeFilters.status} 
                            onChange={(e) => handleFilterChange(activeFilters.source, e.target.value)} 
                            style={{ width: 140 }} 
                            options={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'open', label: 'Open' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'resolved', label: 'Resolved' },
                                { value: 'closed', label: 'Closed' }
                            ]} 
                        />
                    </div>
                }
                pagination={{
                    current_page: tickets.current_page || 1,
                    last_page: tickets.last_page || 1,
                    total: tickets.total || 0,
                    onPage: (p) => {
                        router.visit(window.route('platform.dashboard'), {
                            data: {
                                view: 'support',
                                ticket_source: activeFilters.source,
                                ticket_status: activeFilters.status,
                                tickets_page: p
                            },
                            preserveState: true,
                            preserveScroll: true
                        });
                    }
                }}
                emptyTitle="Inbox zero" 
                emptyMessage="No tickets match this filter. Beautiful."
            />

            {/* Support Thread Drawer */}
            {selectedTicket && (
                <Drawer
                    open={!!selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    title={selectedTicket.subject || `Support Ticket #${selectedTicket.id}`}
                    subtitle={`${getSourceLabel(selectedTicket.source)} · Status: ${selectedTicket.status.toUpperCase()}`}
                    width={520}
                    footer={
                        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                            <Select
                                value={selectedTicket.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                style={{ width: 150 }}
                                options={[
                                    { value: 'open', label: 'Open' },
                                    { value: 'in_progress', label: 'In Progress' },
                                    { value: 'resolved', label: 'Resolved' },
                                    { value: 'closed', label: 'Closed' }
                                ]}
                            />
                            <Button variant="secondary" style={{ marginLeft: 'auto' }} onClick={() => setSelectedTicket(null)}>Close Pane</Button>
                        </div>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Requester Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: t.muted, borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }}>
                            <div>
                                <strong>From:</strong> {selectedTicket.submitted_by?.name || selectedTicket.requester_name || 'Anonymous'}
                                <br />
                                <strong>Email:</strong> {selectedTicket.submitted_by?.email || selectedTicket.requester_email || '—'}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong>Store:</strong> {selectedTicket.tenant?.name || '—'}
                                <br />
                                <strong>Date:</strong> {new Date(selectedTicket.created_at).toLocaleString()}
                            </div>
                        </div>

                        {/* Ticket Description or Vena chat transcripts */}
                        {selectedTicket.source === 'vena_chat' && transcript ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>Vena Escalation Transcript:</div>
                                <div style={{ background: t.panel2, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12, fontSize: 12, fontFamily: 'monospace', maxHeight: 250, overflowY: 'auto' }} className="vq-scroll">
                                    {transcript.lines.map((line, idx) => (
                                        <div key={idx} style={{ marginBottom: 6 }}>
                                            <span style={{ color: t.muted }}>[{line.time}]</span>{' '}
                                            <strong style={{ color: line.sender === 'Bot' ? BRAND.indigo2 : BRAND.emerald }}>{line.sender}:</strong>{' '}
                                            <span style={{ color: t.ink }}>{line.body}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>Description:</div>
                                <div style={{ background: t.panel2, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, fontSize: 13, color: t.sub, whiteSpace: 'pre-wrap' }}>
                                    {selectedTicket.message || 'No description provided.'}
                                </div>
                            </div>
                        )}

                        {/* Reply Thread (for non-Vena V1/digital tickets) */}
                        {selectedTicket.source !== 'vena_chat' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: t.ink }}>Replies ({selectedTicket.replies?.length || 0})</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto' }} className="vq-scroll">
                                    {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                                        <div style={{ fontSize: 12.5, color: t.muted, fontStyle: 'italic' }}>No replies logged yet.</div>
                                    ) : (
                                        selectedTicket.replies.map(r => (
                                            <div key={r.id} style={{ background: r.is_platform_owner ? `${BRAND.indigo}0a` : t.panel2, border: `1px solid ${r.is_platform_owner ? `${BRAND.indigo}22` : t.border}`, borderRadius: 10, padding: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: r.is_platform_owner ? BRAND.indigo2 : t.ink, marginBottom: 4 }}>
                                                    <span>{r.author?.name || 'Customer'} {r.is_platform_owner && '(Agent)'}</span>
                                                    <span style={{ fontWeight: 'normal', color: t.muted }}>{new Date(r.created_at).toLocaleString()}</span>
                                                </div>
                                                <div style={{ fontSize: 12.5, color: t.sub, whiteSpace: 'pre-wrap' }}>{r.body}</div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Send Reply Form */}
                                {selectedTicket.status !== 'closed' && (
                                    <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                                        <Field label="Send Response">
                                            <textarea
                                                value={replyBody}
                                                onChange={e => setReplyBody(e.target.value)}
                                                placeholder="Write your response to the customer..."
                                                required
                                                rows="3"
                                                style={{
                                                    width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 10,
                                                    background: t.inputBg, color: t.ink, fontFamily: 'inherit',
                                                    border: `1px solid ${t.inputBorder}`, outline: 'none'
                                                }}
                                            />
                                        </Field>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Sending...' : 'Send Reply'}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </Drawer>
            )}

/* ════════════════ IMPERSONATION LOG ════════════════ */
export function ImpersonationView() {
    const t = useT();
    return (
        <div>
            <Header icon={UserCog} accent={BRAND.amber} title="Impersonation" subtitle="Audited, time-boxed session takeover. Every start and end is logged." />
            <ComingSoon
                title="Impersonation Audit Log"
                status="Backend Pending"
                icon={UserCog}
                description="Start impersonation from any store or user, with a reversible, time-boxed session. Every action is recorded in the platform audit log. The interface below shows the intended experience."
                preview={
                    <DataTable
                        columns={[
                            { header: 'Actor', cell: () => <span style={{ fontWeight: 700, color: t.ink }}>Platform Owner</span> },
                            { header: 'Target store', cell: () => '—' },
                            { header: 'Started', cell: () => '—' },
                            { header: 'Duration', cell: () => '—' },
                            { header: 'Status', cell: () => <Badge color={BRAND.slate}>Ended</Badge> },
                        ]}
                        rows={[]}
                        emptyTitle="No impersonation sessions yet"
                        emptyMessage="When you impersonate a store, an auditable row is created here."
                    />
                }
            />
        </div>
    );
}

/* ════════════════ PK VERIFICATIONS ════════════════ */
export function PkVerificationsView({ stats = {}, pk_verifications = [] }) {
    const t = useT();
    const [rejectingVerification, setRejectingVerification] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const counts = stats.monetization?.pk_verifications || { pending: 0, approved: 0, rejected: 0 };

    const handleApprove = (v) => {
        if (confirm(`Approve CNIC verification for store "${v.tenant_name}"?`)) {
            router.post(window.route('platform.pk-verifications.approve', v.id), {}, {
                preserveScroll: true
            });
        }
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectReason.trim()) return;
        router.post(window.route('platform.pk-verifications.reject', rejectingVerification.id), {
            reason: rejectReason
        }, {
            onSuccess: () => {
                setRejectingVerification(null);
                setRejectReason('');
            },
            preserveScroll: true
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Header icon={BadgeCheck} accent={BRAND.fuchsia} title="PK Verifications" subtitle="CNIC review queue — gate PKR pricing behind verified identity. One account per ID card." />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,200px),1fr))', gap: 14 }}>
                <KpiCard label="Pending Review" value={counts.pending} icon={ScanFace} accent={BRAND.amber} />
                <KpiCard label="Approved" value={counts.approved} icon={FileCheck2} accent={BRAND.emerald} />
                <KpiCard label="Rejected" value={counts.rejected} icon={XCircle} accent={BRAND.rose} />
            </div>

            <Panel pad={0}>
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${t.border}`, fontSize: 15, fontWeight: 800, color: t.ink }}>
                    Verification Queue
                </div>
                
                <DataTable
                    columns={[
                        { header: 'Submitted', cell: (r) => r.created_at },
                        {
                            header: 'Store',
                            cell: (r) => (
                                <div>
                                    <div style={{ fontWeight: 700, color: t.ink }}>{r.tenant_name}</div>
                                    <div style={{ fontSize: 11, color: t.muted }}>slug: {r.tenant_slug}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Owner / Contact',
                            cell: (r) => (
                                <div>
                                    <div style={{ fontWeight: 700, color: t.ink }}>{r.user_name}</div>
                                    <div style={{ fontSize: 11, color: t.muted }}>{r.user_email}</div>
                                    <div style={{ fontSize: 11, color: t.muted }}>{r.phone}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Status',
                            cell: (r) => <StatusBadge status={r.status} />
                        },
                        {
                            header: 'Documents (Private)',
                            cell: (r) => (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <a
                                        href={window.route('platform.pk-verifications.download', { verification: r.id, side: 'front' })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: 12, color: BRAND.indigo, fontWeight: 700, textDecoration: 'none' }}
                                    >
                                        Front Image
                                    </a>
                                    <span style={{ color: t.border }}>|</span>
                                    <a
                                        href={window.route('platform.pk-verifications.download', { verification: r.id, side: 'back' })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: 12, color: BRAND.indigo, fontWeight: 700, textDecoration: 'none' }}
                                    >
                                        Back Image
                                    </a>
                                </div>
                            )
                        },
                        {
                            header: 'Actions',
                            align: 'right',
                            cell: (r) => {
                                if (r.status !== 'pending') {
                                    if (r.status === 'rejected' && r.rejection) {
                                        return <span style={{ fontSize: 11.5, color: t.muted }}>Reason: {r.rejection}</span>;
                                    }
                                    return <span style={{ fontSize: 11.5, color: t.muted }}>—</span>;
                                }
                                return (
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <Button
                                            size="sm"
                                            variant="success"
                                            icon={CheckCircle2}
                                            onClick={() => handleApprove(r)}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            icon={XCircle}
                                            onClick={() => setRejectingVerification(r)}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                );
                            }
                        }
                    ]}
                    rows={pk_verifications}
                    emptyTitle="No verifications logged"
                    emptyMessage="Verification requests submitted by tenants from Pakistan will appear here."
                />
            </Panel>

            {rejectingVerification && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'grid', placeItems: 'center', padding: 20 }}>
                    <div onClick={() => setRejectingVerification(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,10,0.6)', backdropFilter: 'blur(4px)' }} />
                    <Panel style={{ position: 'relative', width: 'min(440px,100%)', background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 20, padding: 26, boxShadow: t.shadow }}>
                        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: t.ink, marginBottom: 12 }}>Reject Verification Request</h3>
                        <p style={{ margin: 0, fontSize: 13.5, color: t.sub, marginBottom: 16 }}>
                            Provide a reason for rejecting the verification request for <strong>{rejectingVerification.tenant_name}</strong>.
                        </p>
                        <form onSubmit={handleRejectSubmit}>
                            <Field label="Rejection Reason">
                                <Input
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Blurry front card image"
                                    required
                                    autoFocus
                                />
                            </Field>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                                <Button type="button" variant="secondary" onClick={() => setRejectingVerification(null)}>Cancel</Button>
                                <Button type="submit" variant="danger">Confirm Rejection</Button>
                            </div>
                        </form>
                    </Panel>
                </div>
            )}

            <Note t={t}>CNIC images are stored privately on secure disk. Only the cryptographic hash of the CNIC is queryable for uniqueness checks.</Note>
        </div>
    );
}

/* ════════════════ PLATFORM SETTINGS ════════════════ */
export function SettingsView({ stats = {}, settings = {} }) {
    const t = useT();

    // Financial forms
    const [usdPkrRate, setUsdPkrRate] = useState(settings.usd_pkr_rate || '278.50');
    const [gatewayFeePct, setGatewayFeePct] = useState(settings.gateway_fee_pct || '5');
    const [defaultGraceDays, setDefaultGraceDays] = useState(settings.default_grace_days || '7');

    // Modules
    const [publicSignups, setPublicSignups] = useState(settings.public_signups_enabled === '1');
    const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenance_mode_enabled === '1');
    const [appsumoEnabled, setAppsumoEnabled] = useState(settings.appsumo_enabled === '1');
    const [vensynqEnabled, setVensynqEnabled] = useState(settings.vensynq_enabled === '1');

    const handleSaveFinancials = (e) => {
        e.preventDefault();
        router.post(window.route('platform.settings.save'), {
            usd_pkr_rate: usdPkrRate,
            gateway_fee_pct: gatewayFeePct,
            default_grace_days: defaultGraceDays,
        }, {
            preserveScroll: true
        });
    };

    const handleToggleVensynq = (val) => {
        setVensynqEnabled(val);
        router.post(window.route('platform.vensynq.toggle'), { enabled: val }, {
            preserveScroll: true
        });
    };

    const handleToggleSetting = (key, val, setter) => {
        setter(val);
        router.post(window.route('platform.settings.save'), {
            [key]: val ? 1 : 0
        }, {
            preserveScroll: true
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Header icon={Settings} accent={BRAND.slate} title="Platform Settings" subtitle="Server-persisted platform configuration — FX rates, fees, grace defaults & feature flags." />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,320px),1fr))', gap: 20 }}>
                {/* Financial Controls */}
                <Panel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Percent size={18} color={BRAND.indigo2} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Financial Settings</span>
                    </div>
                    
                    <form onSubmit={handleSaveFinancials} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Field label="USD → PKR Exchange Rate" hint="Used by revenue conversions (MRR, GMV)">
                            <Input value={usdPkrRate} onChange={e => setUsdPkrRate(e.target.value)} type="number" step="0.01" required />
                        </Field>
                        <Field label="Gateway Fee Rate (%)" hint="Subtracted to compute estimated net revenue">
                            <Input value={gatewayFeePct} onChange={e => setGatewayFeePct(e.target.value)} type="number" step="0.1" required />
                        </Field>
                        <Field label="Default Grace Period (Days)" hint="Days a store remains active after plan expiry before view-only mode">
                            <Input value={defaultGraceDays} onChange={e => setDefaultGraceDays(e.target.value)} type="number" required />
                        </Field>
                        <Button type="submit">Save Financial Policies</Button>
                    </form>
                </Panel>

                {/* Module Toggles */}
                <Panel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ToggleRight size={18} color={BRAND.violet} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Module Control Switches</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <ToggleRow
                            t={t}
                            label="VenSynQ Multichannel Sync"
                            sub="Persists to global settings (survives updates)"
                            active={vensynqEnabled}
                            onChange={handleToggleVensynq}
                        />
                        <ToggleRow
                            t={t}
                            label="Public Signups"
                            sub="Allow new store registrations on the web"
                            active={publicSignups}
                            onChange={(val) => handleToggleSetting('public_signups_enabled', val, setPublicSignups)}
                        />
                        <ToggleRow
                            t={t}
                            label="AppSumo codes module"
                            sub="Allow generation and redemption of AppSumo codes"
                            active={appsumoEnabled}
                            onChange={(val) => handleToggleSetting('appsumo_enabled', val, setAppsumoEnabled)}
                        />
                        <ToggleRow
                            t={t}
                            label="Maintenance Mode"
                            sub="Locks POS platform access for scheduled updates"
                            active={maintenanceMode}
                            onChange={(val) => handleToggleSetting('maintenance_mode_enabled', val, setMaintenanceMode)}
                        />
                    </div>
                </Panel>
            </div>
            
            <Note t={t}>Settings persist to the global <code>settings</code> table (<code>tenant_id = null</code>) — the same deploy-safe pattern VenSynQ already uses.</Note>
        </div>
    );
}

/* ════════════════ SYSTEM placeholders (Jobs / Storage / Flags / AppSumo) ════════════════ */
export function JobsView() {
    const t = useT();
    const [data, setData]       = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError]     = React.useState(null);
    const [selected, setSelected] = React.useState(null);
    const [busy, setBusy]       = React.useState(false);

    const fetchMetrics = React.useCallback(() => {
        setLoading(true);
        fetch(window.route('platform.jobs.metrics'))
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(d => { setData(d); setError(null); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        fetchMetrics();
        const timer = setInterval(fetchMetrics, 15000); // auto-refresh every 15s
        return () => clearInterval(timer);
    }, [fetchMetrics]);

    const doAction = (url, method = 'POST') => {
        setBusy(true);
        fetch(url, { method, headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content, 'Content-Type': 'application/json', 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(d => { if (d.success) fetchMetrics(); else alert(d.message || 'Action failed.'); })
            .catch(e => alert(e.message))
            .finally(() => setBusy(false));
    };

    const horizonColor = data?.horizon_status === 'running' ? BRAND.emerald
        : data?.horizon_status === 'paused' ? BRAND.amber
        : BRAND.rose;

    return (
        <div>
            <Header icon={Server} accent={BRAND.indigo} title="Jobs & Queues" subtitle="Live queue depth, workers, and failed jobs — auto-refreshes every 15 seconds." />

            {/* Horizon Status + KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,200px),1fr))', gap: 14, marginBottom: 20 }}>
                <Panel hover pad={18}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.muted, marginBottom: 6 }}>Horizon Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: horizonColor, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 20, fontWeight: 800, color: horizonColor, textTransform: 'capitalize' }}>
                            {loading ? '…' : (data?.horizon_status?.replace('_', ' ') ?? 'Unknown')}
                        </span>
                    </div>
                </Panel>
                <KpiCard label="Pending Jobs" value={loading ? '…' : (data?.total_pending ?? 0)} icon={CircleDot} accent={BRAND.amber} />
                <KpiCard label="Failed Jobs" value={loading ? '…' : (data?.total_failed ?? 0)} icon={XCircle} accent={BRAND.rose} />
                <KpiCard label="Workers" value={loading ? '…' : (data?.horizon_workers ?? 'N/A')} icon={Server} accent={BRAND.indigo} />
            </div>

            {/* Pending Queues */}
            {data?.pending?.length > 0 && (
                <Panel style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.ink, marginBottom: 12 }}>Pending by Queue</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {data.pending.map(q => (
                            <div key={q.queue} style={{ padding: '6px 14px', borderRadius: 10, background: `${BRAND.amber}18`, border: `1px solid ${BRAND.amber}33`, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.amber }}>{q.queue}</span>
                                <span style={{ fontSize: 13, fontWeight: 900, color: t.ink }}>{q.count}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            )}

            {/* Failed Jobs Table */}
            <Panel>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.ink }}>
                        Failed Jobs <span style={{ fontSize: 12, fontWeight: 500, color: t.muted }}>({data?.total_failed ?? '…'})</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" onClick={fetchMetrics} disabled={loading}><RotateCcw size={13} /> Refresh</Button>
                        {data?.total_failed > 0 && (
                            <Button size="sm" variant="danger" disabled={busy} onClick={() => {
                                if (confirm('Flush ALL failed jobs? This cannot be undone.'))
                                    doAction(window.route('platform.jobs.flush-failed'));
                            }}>
                                <XCircle size={13} /> Flush All
                            </Button>
                        )}
                    </div>
                </div>

                {loading && !data ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
                ) : error ? (
                    <div style={{ color: BRAND.rose, padding: 20, textAlign: 'center', fontSize: 13 }}>⚠ {error}</div>
                ) : data?.failed?.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="No failed jobs" sub="Your queues are healthy." />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.failed.map(job => (
                            <div key={job.id} style={{
                                padding: '14px 16px', borderRadius: 12,
                                border: `1px solid ${selected?.id === job.id ? BRAND.rose + '66' : t.border}`,
                                background: selected?.id === job.id ? `${BRAND.rose}08` : t.card,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }} onClick={() => setSelected(selected?.id === job.id ? null : job)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, marginBottom: 3 }}>
                                            {job.payload?.displayName ?? 'Unknown Job'}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: t.muted }}>
                                            Queue: <strong>{job.queue}</strong> · Failed: {job.failed_at} · Attempts: {job.payload?.attempts ?? 0}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <Button size="xs" onClick={e => { e.stopPropagation(); doAction(window.route('platform.jobs.retry', job.id)); }} disabled={busy}>
                                            <RotateCcw size={11} /> Retry
                                        </Button>
                                        <Button size="xs" variant="danger" onClick={e => { e.stopPropagation(); if (confirm('Delete this failed job?')) doAction(window.route('platform.jobs.delete-failed', job.id), 'DELETE'); }} disabled={busy}>
                                            <XCircle size={11} />
                                        </Button>
                                    </div>
                                </div>
                                {selected?.id === job.id && job.exception && (
                                    <pre style={{ marginTop: 12, fontSize: 11, color: BRAND.rose, background: `${BRAND.rose}0a`, padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: `1px solid ${BRAND.rose}22`, maxHeight: 200, overflowY: 'auto' }}>
                                        {job.exception}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
        </div>
    );
}


export function StorageView() {
    const t = useT();
    return (
        <div>
            <Header icon={HardDrive} accent={BRAND.sky} title="Storage" subtitle="Per-tenant and total storage usage, with cleanup actions." />
            <ComingSoon title="Storage Usage & Cleanup" status="Coming Soon" icon={HardDrive}
                description="See uploads, backups and demo snapshots per tenant and platform-wide, with reclaim actions for orphaned files."
                preview={
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,200px),1fr))', gap: 14 }}>
                        <KpiCard label="Total Used" value="—" icon={Database} accent={BRAND.sky} />
                        <KpiCard label="Uploads" value="—" icon={Upload} accent={BRAND.indigo} />
                        <KpiCard label="Backups" value="—" icon={Camera} accent={BRAND.violet} />
                    </div>
                } />
        </div>
    );
}

export function FlagsView() {
    const t = useT();
    const flags = ['variants', 'serials', 'batches', 'manufacturing', 'multichannel sync', 'AI assistant'];
    return (
        <div>
            <Header icon={ToggleRight} accent={BRAND.emerald} title="Feature Flags" subtitle="A central hub for per-store capability switches." />
            <ComingSoon title="Feature Flag Hub" status="Backend Pending" icon={ToggleRight}
                description="The per-store feature-flag route exists; this gives it a real management hub to flip capabilities per tenant or globally."
                preview={
                    <Panel>
                        {flags.map((f, i) => <ToggleRow key={f} t={t} label={f.charAt(0).toUpperCase() + f.slice(1)} sub="Global default" on={i % 2 === 0} last={i === flags.length - 1} />)}
                    </Panel>
                } />
        </div>
    );
}

export function AppSumoView() {
    const t = useT();
    return (
        <div>
            <Header icon={Tag} accent={BRAND.amber} title="AppSumo / LTD Codes" subtitle="Lifetime-deal code generation, import and redemption." />
            <ComingSoon title="AppSumo Lifetime Deals" status="Coming Soon" icon={Tag}
                description="The generator/import/export already exists in code but is currently route-disabled. Re-enable behind a feature flag to manage LTD codes, or keep it parked here until your next campaign."
                preview={
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,180px),1fr))', gap: 14 }}>
                        <KpiCard label="Total Codes" value="—" icon={Tag} accent={BRAND.amber} />
                        <KpiCard label="Redeemed" value="—" icon={CheckCircle2} accent={BRAND.emerald} />
                        <KpiCard label="Available" value="—" icon={CircleDot} accent={BRAND.indigo} />
                    </div>
                } />
        </div>
    );
}

/* ════════════════ shared bits ════════════════ */
function Header({ icon: Icon, title, subtitle, accent = BRAND.indigo, actions }) {
    const t = useT();
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${accent}1f`, color: accent, display: 'grid', placeItems: 'center', border: `1px solid ${accent}33`, flexShrink: 0 }}><Icon size={24} /></div>
                <div style={{ minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: 25, fontWeight: 900, letterSpacing: '-0.03em', color: t.ink }}>{title}</h1>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13.5, color: t.muted, maxWidth: 720 }}>{subtitle}</p>}
                </div>
            </div>
            {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
    );
}

function Note({ children, t }) {
    return (
        <div style={{ marginTop: 18, padding: '13px 16px', borderRadius: 13, background: `${BRAND.indigo}10`, border: `1px solid ${BRAND.indigo}26`, fontSize: 12.5, color: t.sub, lineHeight: 1.6 }}>
            {children}
        </div>
    );
}

function ToggleRow({ t, label, sub, active, onChange, last }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: last ? 'none' : `1px solid ${t.rowBorder}` }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{label}</div>
                {sub && <div style={{ fontSize: 11.5, color: t.muted }}>{sub}</div>}
            </div>
            <button onClick={() => onChange?.(!active)} className="vq-press" style={{ width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: active ? BRAND.emerald : t.border2, position: 'relative', transition: 'background .2s' }}>
                <span style={{ position: 'absolute', top: 3, left: active ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
            </button>
        </div>
    );
}
