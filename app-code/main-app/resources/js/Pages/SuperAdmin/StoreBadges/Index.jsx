import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import { useT, PageHeader, Panel, Button, Input, EmptyState } from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import { Award, RefreshCw, Search } from 'lucide-react';

const TONE = { amber: BRAND.amber, emerald: BRAND.emerald, violet: BRAND.violet, sky: BRAND.sky, rose: BRAND.rose, teal: BRAND.emerald };

/** Auto | On | Off for one badge on one store. "Auto" hands the badge back to the rules. */
function Control({ t, store, badge, state, busy, onSet }) {
    const mode = state.override || 'auto';
    const opt = (m, label) => (
        <button key={m} type="button" disabled={busy} onClick={() => mode !== m && onSet(store, badge, m)}
            style={{
                padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
                border: `1px solid ${t.border}`, marginLeft: -1,
                background: mode === m ? (m === 'off' ? BRAND.rose : m === 'on' ? BRAND.emerald : BRAND.indigo) : 'transparent',
                color: mode === m ? '#fff' : t.muted,
            }}>{label}</button>
    );
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <span style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden' }}>{opt('auto', 'Auto')}{opt('on', 'On')}{opt('off', 'Off')}</span>
            <span style={{ fontSize: 11, color: state.shown ? BRAND.emerald : t.muted, fontWeight: 600 }}>
                {state.shown ? 'Showing' : 'Hidden'}{state.override ? ' (your override)' : state.auto ? ' (earned)' : ''}
            </span>
        </div>
    );
}

export default function StoreBadgesIndex({ stores, catalogue = [], filters = {} }) {
    const t = useT();
    const [q, setQ] = useState(filters.q || '');
    const [busy, setBusy] = useState(false);

    const go = (params) => router.get(route('platform.store-badges.index'), { q: q || undefined, ...params }, { preserveState: true, preserveScroll: true });
    const set = (store, badge, mode) => {
        setBusy(true);
        router.post(route('platform.store-badges.update', { storefront: store.id }), { badge, mode }, {
            preserveScroll: true, onFinish: () => setBusy(false),
        });
    };
    const refresh = () => {
        setBusy(true);
        router.post(route('platform.store-badges.refresh'), {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    return (
        <OneGlanceLayout title="Store Badges">
            <Head title="Store Badges" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <PageHeader
                    icon={Award}
                    accent={BRAND.amber}
                    title="Store Badges"
                    subtitle="Badges are earned automatically every night. Here you can force any badge on or off for a store; your choice is never undone by the nightly run."
                    actions={<Button variant="secondary" icon={RefreshCw} disabled={busy} onClick={refresh}>Recalculate now</Button>}
                />

                <Panel pad={16}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {catalogue.map((b) => (
                            <span key={b.key} title={b.description} style={{ fontSize: 12, fontWeight: 700, color: TONE[b.tone] || BRAND.slate, background: `${TONE[b.tone] || BRAND.slate}22`, padding: '3px 10px', borderRadius: 999 }}>
                                ★ {b.label}
                            </span>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); go({}); }} style={{ display: 'flex', gap: 8, marginTop: 14, maxWidth: 420 }}>
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search store name or link" />
                        <Button type="submit" variant="secondary" icon={Search}>Search</Button>
                    </form>
                </Panel>

                {stores.data.length === 0 ? (
                    <Panel pad={40}><EmptyState icon={Award} title="No stores found" message="Stores appear here once a business creates its online store." /></Panel>
                ) : (
                    <Panel pad={0} style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: t.muted, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '12px 18px' }}>Store</th>
                                    {catalogue.map((b) => <th key={b.key} style={{ padding: '12px 10px' }} title={b.description}>{b.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {stores.data.map((s) => (
                                    <tr key={s.id} style={{ borderTop: `1px solid ${t.rowBorder}`, verticalAlign: 'top' }}>
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ fontWeight: 700, color: t.ink }}>{s.name}</div>
                                            <div style={{ fontSize: 12, color: t.muted }}>/{s.slug} · {s.status} · joined {new Date(s.created_at).toLocaleDateString()}</div>
                                        </td>
                                        {catalogue.map((b) => (
                                            <td key={b.key} style={{ padding: '14px 10px' }}>
                                                <Control t={t} store={s} badge={b.key} state={s.badges[b.key]} busy={busy} onSet={set} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Panel>
                )}

                {stores.last > 1 && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Button variant="secondary" disabled={stores.current <= 1} onClick={() => go({ page: stores.current - 1 })}>Previous</Button>
                        <span style={{ color: t.muted, fontSize: 13 }}>Page {stores.current} of {stores.last} · {stores.total} stores</span>
                        <Button variant="secondary" disabled={stores.current >= stores.last} onClick={() => go({ page: stores.current + 1 })}>Next</Button>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
