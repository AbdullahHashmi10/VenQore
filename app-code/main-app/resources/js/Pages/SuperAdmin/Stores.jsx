import React, { useState } from 'react';
import { usePage, Head, router, Link } from '@inertiajs/react';
import {
    Store, Search, Building2, Trash2, RotateCcw, ShieldAlert,
    MoreHorizontal, Filter, ChevronLeft, ChevronRight, CheckCircle,
    User, Mail, ArrowRight, ShieldCheck, AlertCircle, Clock
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, StatusBadge, Button,
    Input, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import Dropdown from '@/Components/Dropdown';

export default function Stores({ tenants, filters }) {
    const t = useT();
    const [search, setSearch] = useState(filters?.search || '');
    const [trashed, setTrashed] = useState(filters?.trashed || false);
    const [selected, setSelected] = useState([]);

    const tenantList = tenants?.data ?? [];

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelected(tenantList.map((st) => st.id));
        else setSelected([]);
    };

    const handleSelect = (id) => {
        if (selected.includes(id)) setSelected(selected.filter((i) => i !== id));
        else setSelected([...selected, id]);
    };

    const handleBulkDelete = () => {
        if (confirm(`Move ${selected.length} selected store(s) to trash?`)) {
            router.post(route('platform.stores.bulk-destroy'), { ids: selected }, {
                onSuccess: () => setSelected([]),
            });
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('platform.stores'), { search, trashed }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearch('');
        router.get(route('platform.stores'), { trashed }, { preserveState: true });
    };

    const toggleTrashed = () => {
        const newVal = !trashed;
        setTrashed(newVal);
        setSelected([]);
        router.get(route('platform.stores'), { search, trashed: newVal }, { preserveState: true });
    };

    const onRestore = (id) => {
        if (confirm('Restore this store to active directory?')) {
            router.post(route('platform.store.restore', id), {}, { preserveScroll: true });
        }
    };

    const onPurge = (id) => {
        const passcode = prompt('Enter your action passcode to confirm permanently purging this store:');
        if (passcode) {
            router.delete(route('platform.store.purge', id), {
                data: { passcode },
                preserveScroll: true,
            });
        }
    };

    const activeStoresCount = tenantList.filter((s) => s.status === 'active').length;

    return (
        <OneGlanceLayout mode="admin" activeMenu="Stores" title="Store Management">
            <Head title="Platform HQ | Store Management" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* V6 Page Header */}
                <PageHeader
                    icon={Store}
                    accent={BRAND.indigo}
                    title="Store Management"
                    subtitle="Monitor, inspect, suspend, and configure all tenant store deployments."
                    actions={
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Button
                                variant={trashed ? 'danger' : 'secondary'}
                                icon={Trash2}
                                onClick={toggleTrashed}
                            >
                                {trashed ? 'Viewing Trash (Exit)' : 'Trash Bin'}
                            </Button>
                        </div>
                    }
                />

                {/* Quick KPI Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Registered
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {tenants?.total ?? tenantList.length}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Merchant storefronts</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Active on Platform
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.emerald, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {activeStoresCount}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Stores operational</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Selected For Action
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: selected.length > 0 ? BRAND.indigo : t.muted, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {selected.length}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Stores checked</div>
                    </Panel>
                </div>

                {/* Filter & Bulk Actions Bar */}
                <Panel pad={16}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 340px', maxWidth: 540 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by store name, slug, or owner email…"
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                            <Button type="submit" variant="primary">
                                Search
                            </Button>
                            {filters?.search && (
                                <Button type="button" variant="secondary" onClick={clearSearch}>
                                    Clear
                                </Button>
                            )}
                        </form>

                        {selected.length > 0 && !trashed && (
                            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>
                                Trash ({selected.length}) Selected
                            </Button>
                        )}
                    </div>
                </Panel>

                {/* Stores Table */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                                <tr>
                                    <th style={{ width: 44, textAlign: 'center', padding: '12px 14px', background: t.panel2, borderBottom: `1px solid ${t.border}` }}>
                                        <input
                                            type="checkbox"
                                            checked={tenantList.length > 0 && selected.length === tenantList.length}
                                            onChange={handleSelectAll}
                                            style={{ accentColor: BRAND.indigo, cursor: 'pointer' }}
                                        />
                                    </th>
                                    {['Store', 'Owner', 'Plan', 'Status', ...(trashed ? ['Deleted At'] : []), 'Actions'].map((h, idx) => {
                                        const isLast = idx === (trashed ? 5 : 4);
                                        return (
                                            <th
                                                key={h}
                                                style={{
                                                    padding: '12px 18px',
                                                    textAlign: isLast ? 'right' : 'left',
                                                    color: t.muted,
                                                    fontWeight: 800,
                                                    fontSize: 11,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                    background: t.panel2,
                                                    borderBottom: `1px solid ${t.border}`,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {h}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {tenantList.length === 0 ? (
                                    <tr>
                                        <td colSpan={trashed ? 6 : 5} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                            <EmptyState
                                                icon={Building2}
                                                title={trashed ? 'Trash is empty' : 'No stores found'}
                                                message={search ? `No stores matching "${search}".` : 'No store records exist matching current view.'}
                                                action={search ? <Button variant="secondary" size="sm" onClick={clearSearch}>Clear Filter</Button> : null}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    tenantList.map((st) => {
                                        const isSelected = selected.includes(st.id);
                                        return (
                                            <tr
                                                key={st.id}
                                                className="vq-row"
                                                style={{
                                                    borderBottom: `1px solid ${t.rowBorder}`,
                                                    background: isSelected ? `${BRAND.indigo}0f` : 'transparent',
                                                }}
                                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = t.hover; }}
                                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                {/* Checkbox */}
                                                <td style={{ width: 44, textAlign: 'center', padding: '14px 14px', verticalAlign: 'middle' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelect(st.id)}
                                                        style={{ accentColor: BRAND.indigo, cursor: 'pointer' }}
                                                    />
                                                </td>

                                                {/* Store details */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: 800, color: t.ink, fontSize: 14 }}>
                                                        {st.name}
                                                    </div>
                                                    <div style={{ fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                        <span style={{ fontFamily: 'monospace', color: t.sub }}>{st.slug}</span>
                                                        <span style={{ color: t.faint }}>·</span>
                                                        <span style={{ fontFamily: 'monospace' }}>#{st.id}</span>
                                                    </div>
                                                </td>

                                                {/* Owner details */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: 700, color: t.ink, fontSize: 13 }}>
                                                        {st.owner_name || '—'}
                                                    </div>
                                                    <div style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }}>
                                                        {st.owner_email || '—'}
                                                    </div>
                                                </td>

                                                {/* Plan */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <Badge color={BRAND.indigo} tone="soft">
                                                        {st.plan || 'trial'}
                                                    </Badge>
                                                </td>

                                                {/* Status */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <StatusBadge status={st.status || 'active'} />
                                                </td>

                                                {/* Trashed info */}
                                                {trashed && (
                                                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: BRAND.rose, fontSize: 12, fontWeight: 600 }}>
                                                        {st.deleted_at ? new Date(st.deleted_at).toLocaleString() : 'Trashed'}
                                                    </td>
                                                )}

                                                {/* Actions */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                    {trashed ? (
                                                        <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                icon={RotateCcw}
                                                                onClick={() => onRestore(st.id)}
                                                            >
                                                                Restore
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                icon={Trash2}
                                                                onClick={() => onPurge(st.id)}
                                                            >
                                                                Purge
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                                            <Link
                                                                href={route('platform.tenants.overrides.show', { tenant: st.id })}
                                                                style={{ textDecoration: 'none' }}
                                                            >
                                                                <Button size="sm" variant="secondary">
                                                                    Manage
                                                                </Button>
                                                            </Link>

                                                            <Dropdown>
                                                                <Dropdown.Trigger>
                                                                    <button
                                                                        type="button"
                                                                        style={{
                                                                            width: 32,
                                                                            height: 32,
                                                                            borderRadius: 9,
                                                                            border: `1px solid ${t.border}`,
                                                                            background: t.inputBg,
                                                                            color: t.sub,
                                                                            display: 'grid',
                                                                            placeItems: 'center',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                        title="More store actions"
                                                                    >
                                                                        <MoreHorizontal size={16} />
                                                                    </button>
                                                                </Dropdown.Trigger>
                                                                <Dropdown.Content align="right" width="48">
                                                                    {st.status === 'suspended' ? (
                                                                        <Dropdown.Link
                                                                            href={route('platform.store.activate', st.id)}
                                                                            method="post"
                                                                            as="button"
                                                                            style={{ fontSize: 13, fontWeight: 600 }}
                                                                        >
                                                                            Activate Store
                                                                        </Dropdown.Link>
                                                                    ) : (
                                                                        <Dropdown.Link
                                                                            href={route('platform.store.suspend', st.id)}
                                                                            method="post"
                                                                            as="button"
                                                                            style={{ fontSize: 13, fontWeight: 600, color: BRAND.amber }}
                                                                        >
                                                                            Suspend Store
                                                                        </Dropdown.Link>
                                                                    )}

                                                                    {st.status === 'trial' && (
                                                                        <Dropdown.Link
                                                                            href={route('platform.store.extend-trial', st.id)}
                                                                            method="post"
                                                                            as="button"
                                                                            style={{ fontSize: 13, fontWeight: 600 }}
                                                                        >
                                                                            Extend Trial (7 Days)
                                                                        </Dropdown.Link>
                                                                    )}

                                                                    <div style={{ borderTop: `1px solid ${t.border}`, margin: '4px 0' }} />

                                                                    <Dropdown.Link
                                                                        href={route('platform.store.destroy', st.id)}
                                                                        method="delete"
                                                                        as="button"
                                                                        style={{ fontSize: 13, fontWeight: 600, color: BRAND.rose }}
                                                                    >
                                                                        Trash Store
                                                                    </Dropdown.Link>
                                                                </Dropdown.Content>
                                                            </Dropdown>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tenants?.last_page > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 20px',
                            borderTop: `1px solid ${t.border}`,
                            flexWrap: 'wrap',
                            gap: 12,
                        }}>
                            <span style={{ fontSize: 12.5, color: t.muted }}>
                                Page {tenants.current_page} of {tenants.last_page} · {tenants.total} stores total
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={ChevronLeft}
                                    disabled={tenants.current_page <= 1}
                                    onClick={() => router.get(route('platform.stores'), { search, trashed, page: tenants.current_page - 1 }, { preserveState: true })}
                                >
                                    Prev
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={tenants.current_page >= tenants.last_page}
                                    onClick={() => router.get(route('platform.stores'), { search, trashed, page: tenants.current_page + 1 }, { preserveState: true })}
                                >
                                    Next <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Panel>
            </div>
        </OneGlanceLayout>
    );
}
