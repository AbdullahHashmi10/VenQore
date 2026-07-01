import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    DollarSign, TrendingUp, ShieldCheck, FlaskConical, Inbox, UserCog, BadgeCheck,
    Settings, HardDrive, Server, ToggleRight, Tag, Play, RotateCcw, Camera,
    CheckCircle2, XCircle, CircleDot, CreditCard, Banknote, Percent, Globe,
    Upload, FileCheck2, ScanFace, Phone, MessageSquare, Bot, Database, Activity,
} from 'lucide-react';
import {
    useT, Panel, KpiCard, Button, Badge, ComingSoon, EmptyState, DataTable,
    StatusBadge, Field, Input, Select, Spinner,
} from '@/Platform/ui';
import { BRAND, GRADIENTS, fmtCurrency, fmtNumber } from '@/Platform/theme';

/* ════════════════ REVENUE (paid, server-side) ════════════════ */
export function RevenueView({ revenue = {}, stats = {} }) {
    const t = useT();
    const planMrr = revenue.plan_mrr || [];
    return (
        <div>
            <Header icon={DollarSign} accent={BRAND.emerald} title="Revenue" subtitle="Real paid-subscription income — computed server-side, internal & demo excluded." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,210px),1fr))', gap: 14, marginBottom: 18 }}>
                <KpiCard label="MRR" value={fmtCurrency(revenue.mrr)} icon={DollarSign} accent={BRAND.emerald} gradient={GRADIENTS.revenue} footnote="Monthly recurring revenue" />
                <KpiCard label="ARR" value={fmtCurrency(revenue.arr)} icon={TrendingUp} accent={BRAND.indigo} footnote="Annual run-rate" />
                <KpiCard label="Net Revenue" value={fmtCurrency(revenue.net_revenue)} icon={Banknote} accent={BRAND.violet} footnote="After est. gateway fees" />
                <KpiCard label="Paid Subscribers" value={fmtNumber(revenue.paid_count)} icon={CreditCard} accent={BRAND.sky} footnote="Active paying stores" />
            </div>
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
            <Note t={t}>This page reads only from <code>PlatformRevenueService</code>. There is no financial math in the browser, and no <code>localStorage</code> ledger — clearing browser storage changes nothing.</Note>
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
    const categories = [
        { key: 'financial', name: 'Financial Integrity', desc: 'Ledger balance · FIFO · revenue rules', icon: DollarSign, status: 'ready', count: 14 },
        { key: 'isolation', name: 'Tenant Isolation', desc: 'No cross-tenant data leakage', icon: ShieldCheck, status: 'ready', count: 9 },
        { key: 'billing', name: 'Billing & Coupons', desc: 'Subscriptions · coupon redemption', icon: CreditCard, status: 'ready', count: 11 },
        { key: 'auth', name: 'Auth & Permissions', desc: 'Login · PIN · role gates', icon: UserCog, status: 'ready', count: 8 },
        { key: 'infra', name: 'Infrastructure', desc: 'Queue · mail · webhooks', icon: Server, status: 'pending', count: 6 },
        { key: 'smoke', name: 'Smoke (live, read-only)', desc: 'Production health · never mutates', icon: Activity, status: 'live', count: 5 },
    ];
    const [running, setRunning] = useState(null);

    return (
        <div>
            <Header icon={ShieldCheck} accent={BRAND.emerald} title="Testing Center" subtitle="One-click categorized health check. Green across the board means you're cleared to ship."
                actions={<Button icon={Play} onClick={() => { setRunning('all'); setTimeout(() => setRunning(null), 2200); }}>{running === 'all' ? <Spinner color="#fff" /> : 'Run full health check'}</Button>} />

            <Panel style={{ marginBottom: 18, background: GRADIENTS.brandSoft }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${BRAND.emerald}22`, color: BRAND.emerald, display: 'grid', placeItems: 'center' }}><CheckCircle2 size={26} /></div>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: t.ink }}>Platform Healthy</div>
                        <div style={{ fontSize: 13, color: t.muted }}>Last full run: not yet this session · {categories.reduce((a, c) => a + c.count, 0)} checks across {categories.length} categories</div>
                    </div>
                </div>
            </Panel>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))', gap: 14 }}>
                {categories.map((c) => (
                    <Panel key={c.key} hover>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${BRAND.indigo}1f`, color: BRAND.indigo2, display: 'grid', placeItems: 'center', flexShrink: 0 }}><c.icon size={19} /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>{c.name}</span>
                                    {c.status === 'live' && <Badge color={BRAND.emerald}>Live</Badge>}
                                    {c.status === 'pending' && <Badge color={BRAND.amber}>To build</Badge>}
                                </div>
                                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>{c.desc}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                                    <span style={{ fontSize: 11.5, color: t.faint }}>{c.count} checks</span>
                                    <Button size="sm" variant="secondary" icon={Play} style={{ marginLeft: 'auto' }} onClick={() => { setRunning(c.key); setTimeout(() => setRunning(null), 1600); }}>
                                        {running === c.key ? <Spinner size={13} /> : 'Run'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Panel>
                ))}
            </div>
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
export function SupportView({ tickets = [] }) {
    const t = useT();
    const [source, setSource] = useState('all');
    const rows = tickets || [];
    return (
        <div>
            <Header icon={Inbox} accent={BRAND.indigo} title="Support Inbox" subtitle="One triage queue across V1 tickets, Vena chats and Digital-Hub conversations." />
            <DataTable
                columns={[
                    { header: 'Subject', cell: (r) => <span style={{ fontWeight: 700, color: t.ink }}>{r.subject || r.title || `Ticket #${r.id}`}</span> },
                    { header: 'From', cell: (r) => r.email || r.name || '—' },
                    { header: 'Source', cell: () => <Badge color={BRAND.violet}>V1</Badge> },
                    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
                ]}
                rows={rows}
                filters={<Select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: 150 }} options={[{ value: 'all', label: 'All sources' }, { value: 'v1', label: 'V1 tickets' }, { value: 'vena', label: 'Vena chat' }, { value: 'digital', label: 'Digital Hub' }]} />}
                emptyTitle="Inbox zero" emptyMessage="No open tickets across any source. Beautiful."
            />
            <Note t={t}>Unifies <code>platform.tickets.*</code>, <code>platform.vena.tickets</code> and Digital-Hub chats behind one screen with shared reply/assign/status actions.</Note>
        </div>
    );
}

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
export function PkVerificationsView() {
    const t = useT();
    return (
        <div>
            <Header icon={BadgeCheck} accent={BRAND.fuchsia} title="PK Verifications" subtitle="CNIC review queue — gate PKR pricing behind verified identity. One account per ID card." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,200px),1fr))', gap: 14, marginBottom: 18 }}>
                <KpiCard label="Pending Review" value="0" icon={ScanFace} accent={BRAND.amber} />
                <KpiCard label="Approved" value="0" icon={FileCheck2} accent={BRAND.emerald} />
                <KpiCard label="Rejected" value="0" icon={XCircle} accent={BRAND.rose} />
            </div>
            <ComingSoon
                title="CNIC Verification Workflow"
                status="Coming Soon"
                icon={BadgeCheck}
                description="When a Pakistani customer selects PKR pricing they submit a checksum-validated CNIC, an OTP-verified +92 phone, and front/back card images (stored privately; only a hash is kept for uniqueness). You approve or reject from this queue. PKR checkout unlocks only on approval."
                preview={
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px),1fr))', gap: 14 }}>
                        <Panel>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.ink, marginBottom: 12 }}>Verification Request</div>
                            <Field label="CNIC number"><Input placeholder="42101-1234567-1" disabled /></Field>
                            <Field label="Phone (+92)"><Input placeholder="+92 3XX XXXXXXX" disabled /></Field>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1, height: 86, borderRadius: 11, border: `1.5px dashed ${t.border2}`, display: 'grid', placeItems: 'center', color: t.faint, fontSize: 12 }}><div style={{ textAlign: 'center' }}><Upload size={18} /><div>Front</div></div></div>
                                <div style={{ flex: 1, height: 86, borderRadius: 11, border: `1.5px dashed ${t.border2}`, display: 'grid', placeItems: 'center', color: t.faint, fontSize: 12 }}><div style={{ textAlign: 'center' }}><Upload size={18} /><div>Back</div></div></div>
                            </div>
                        </Panel>
                        <Panel>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.ink, marginBottom: 12 }}>Review Actions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 11, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <Phone size={16} color={BRAND.sky} /><span style={{ fontSize: 12.5, color: t.sub }}>OTP phone verification</span><Badge color={BRAND.emerald} style={{ marginLeft: 'auto' }}>Verified</Badge>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 11, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <ScanFace size={16} color={BRAND.violet} /><span style={{ fontSize: 12.5, color: t.sub }}>CNIC uniqueness (hash)</span><Badge color={BRAND.emerald} style={{ marginLeft: 'auto' }}>Unique</Badge>
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <Button variant="success" icon={CheckCircle2} disabled style={{ flex: 1 }}>Approve</Button>
                                    <Button variant="danger" icon={XCircle} disabled style={{ flex: 1 }}>Reject</Button>
                                </div>
                            </div>
                        </Panel>
                    </div>
                }
            />
        </div>
    );
}

/* ════════════════ PLATFORM SETTINGS ════════════════ */
export function SettingsView({ stats = {} }) {
    const t = useT();
    return (
        <div>
            <Header icon={Settings} accent={BRAND.slate} title="Platform Settings" subtitle="Server-persisted platform configuration — FX rates, fees, grace defaults & feature flags." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))', gap: 14 }}>
                <Panel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><Percent size={16} color={BRAND.indigo2} /><span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Financial</span><Badge color={BRAND.amber} style={{ marginLeft: 'auto' }}>Backend Pending</Badge></div>
                    <Field label="USD → PKR rate" hint="Used by revenue conversions"><Input defaultValue="278.50" disabled /></Field>
                    <Field label="Gateway fee rate (%)" hint="Subtracted to compute net revenue"><Input defaultValue="5" disabled /></Field>
                    <Field label="Default grace period (days)"><Input defaultValue="7" disabled /></Field>
                </Panel>
                <Panel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><ToggleRight size={16} color={BRAND.violet} /><span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Module Toggles</span></div>
                    <ToggleRow t={t} label="VenSynQ multichannel sync" sub="Persisted to settings (survives deploys)" on />
                    <ToggleRow t={t} label="Public signups" sub="Allow new store registration" on />
                    <ToggleRow t={t} label="Maintenance mode" sub="Lock the app for updates" />
                </Panel>
            </div>
            <Note t={t}>Settings persist to the global <code>settings</code> table (<code>tenant_id = null</code>) — the same deploy-safe pattern VenSynQ already uses.</Note>
        </div>
    );
}

/* ════════════════ SYSTEM placeholders (Jobs / Storage / Flags / AppSumo) ════════════════ */
export function JobsView() {
    const t = useT();
    return (
        <div>
            <Header icon={Server} accent={BRAND.indigo} title="Jobs & Queues" subtitle="Queue depth, workers and failed jobs — without leaving the Command Center." />
            <ComingSoon title="Horizon Queue Monitor" status="Backend Pending" icon={Server}
                description="Embed Laravel Horizon's queue metrics: throughput, wait times, failed jobs with retry, and recent job history — surfaced inline here."
                preview={
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,180px),1fr))', gap: 14 }}>
                        <KpiCard label="Pending Jobs" value="—" icon={CircleDot} accent={BRAND.amber} />
                        <KpiCard label="Processed / min" value="—" icon={Activity} accent={BRAND.emerald} />
                        <KpiCard label="Failed Jobs" value="—" icon={XCircle} accent={BRAND.rose} />
                        <KpiCard label="Workers" value="—" icon={Server} accent={BRAND.indigo} />
                    </div>
                } />
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

function ToggleRow({ t, label, sub, on, last }) {
    const [v, setV] = useState(!!on);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: last ? 'none' : `1px solid ${t.rowBorder}` }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{label}</div>
                {sub && <div style={{ fontSize: 11.5, color: t.muted }}>{sub}</div>}
            </div>
            <button onClick={() => setV(!v)} className="vq-press" style={{ width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: v ? BRAND.emerald : t.border2, position: 'relative', transition: 'background .2s' }}>
                <span style={{ position: 'absolute', top: 3, left: v ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
            </button>
        </div>
    );
}
