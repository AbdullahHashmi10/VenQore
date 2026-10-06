import React, { useState } from 'react';
import { usePage, Head, router, Link } from '@inertiajs/react';
import {
    Users as UsersIcon, UserCog, Search, Trash2, RotateCcw,
    ShieldCheck, MoreHorizontal, Mail, Shield, User,
    ChevronLeft, ChevronRight, CheckCircle, Clock
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, StatusBadge, Button,
    Input, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import Dropdown from '@/Components/Dropdown';

export default function Users({ users, filters }) {
    const t = useT();
    const [search, setSearch] = useState(filters?.search || '');
    const [trashed, setTrashed] = useState(filters?.trashed || false);
    const [selected, setSelected] = useState([]);

    const userList = users?.data ?? [];

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelected(userList.map((u) => u.id));
        else setSelected([]);
    };

    const handleSelect = (id) => {
        if (selected.includes(id)) setSelected(selected.filter((i) => i !== id));
        else setSelected([...selected, id]);
    };

    const handleBulkDelete = () => {
        if (confirm(`Move ${selected.length} user(s) to trash?`)) {
            router.post(route('platform.users.bulk-destroy'), { ids: selected }, {
                onSuccess: () => setSelected([]),
            });
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('platform.users'), { search, trashed }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearch('');
        router.get(route('platform.users'), { trashed }, { preserveState: true });
    };

    const toggleTrashed = () => {
        const newVal = !trashed;
        setTrashed(newVal);
        setSelected([]);
        router.get(route('platform.users'), { search, trashed: newVal }, { preserveState: true });
    };

    const onRestore = (id) => {
        if (confirm('Restore this user account?')) {
            router.post(route('platform.user.restore', id), {}, { preserveScroll: true });
        }
    };

    const onPurge = (id) => {
        const passcode = prompt('Enter your action passcode to confirm permanently deleting this user:');
        if (passcode) {
            router.delete(route('platform.user.purge', id), {
                data: { passcode },
                preserveScroll: true,
            });
        }
    };

    const adminCount = userList.filter((u) => u.is_platform_admin).length;

    return (
        <OneGlanceLayout mode="admin" activeMenu="Platform Users" title="User Management">
            <Head title="Platform HQ | User Management" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* V6 Page Header */}
                <PageHeader
                    icon={UsersIcon}
                    accent={BRAND.indigo}
                    title="Platform Users"
                    subtitle="Manage platform-wide operators, merchant owners, and staff account security."
                    actions={
                        <Button
                            variant={trashed ? 'danger' : 'secondary'}
                            icon={Trash2}
                            onClick={toggleTrashed}
                        >
                            {trashed ? 'Viewing Deleted (Exit)' : 'Deleted Users'}
                        </Button>
                    }
                />

                {/* Quick KPI Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Accounts
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {users?.total ?? userList.length}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Active user identities</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Platform Operators
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.emerald, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {adminCount}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Privileged admin accounts</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Selected For Action
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: selected.length > 0 ? BRAND.indigo : t.muted, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {selected.length}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Users checked</div>
                    </Panel>
                </div>

                {/* Filters & Action Bar */}
                <Panel pad={16}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 340px', maxWidth: 540 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by user name or email address…"
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
                                Delete ({selected.length}) Selected
                            </Button>
                        )}
                    </div>
                </Panel>

                {/* Users Table */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                            <thead>
                                <tr>
                                    <th style={{ width: 44, textAlign: 'center', padding: '12px 14px', background: t.panel2, borderBottom: `1px solid ${t.border}` }}>
                                        <input
                                            type="checkbox"
                                            checked={userList.length > 0 && selected.length === userList.length}
                                            onChange={handleSelectAll}
                                            style={{ accentColor: BRAND.indigo, cursor: 'pointer' }}
                                        />
                                    </th>
                                    {['Identity', 'Platform Access', 'Joined', ...(trashed ? ['Deleted At'] : []), 'Actions'].map((h, idx) => {
                                        const isLast = idx === (trashed ? 4 : 3);
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
                                {userList.length === 0 ? (
                                    <tr>
                                        <td colSpan={trashed ? 5 : 4} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                            <EmptyState
                                                icon={UserCog}
                                                title={trashed ? 'No deleted users' : 'No users found'}
                                                message={search ? `No accounts matching "${search}".` : 'No user account records match current criteria.'}
                                                action={search ? <Button variant="secondary" size="sm" onClick={clearSearch}>Reset search</Button> : null}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    userList.map((u) => {
                                        const isSelected = selected.includes(u.id);
                                        const initial = (u.name?.[0] || 'U').toUpperCase();
                                        return (
                                            <tr
                                                key={u.id}
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
                                                        onChange={() => handleSelect(u.id)}
                                                        style={{ accentColor: BRAND.indigo, cursor: 'pointer' }}
                                                    />
                                                </td>

                                                {/* Identity with clean Avatar */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 11,
                                                            background: `${BRAND.indigo}22`,
                                                            color: BRAND.indigo,
                                                            border: `1px solid ${BRAND.indigo}33`,
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            fontWeight: 900,
                                                            fontSize: 14,
                                                            flexShrink: 0,
                                                        }}>
                                                            {initial}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontWeight: 800, color: t.ink, fontSize: 14 }}>
                                                                {u.name}
                                                            </div>
                                                            <div style={{ fontSize: 11.5, color: t.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span>{u.email}</span>
                                                                <span style={{ color: t.faint }}>·</span>
                                                                <span style={{ fontFamily: 'monospace' }}>#{u.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Platform Access Role */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    {u.is_platform_admin ? (
                                                        <Badge color={BRAND.emerald} tone="soft">
                                                            <ShieldCheck size={12} style={{ marginRight: 4 }} />
                                                            {u.platform_role ? `HQ ${u.platform_role.toUpperCase()}` : 'HQ OWNER'}
                                                        </Badge>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: t.sub, fontWeight: 600 }}>
                                                            Store Staff / Merchant
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Joined timestamp */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.sub, fontSize: 12.5 }}>
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                                </td>

                                                {/* Trashed info */}
                                                {trashed && (
                                                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: BRAND.rose, fontSize: 12, fontWeight: 600 }}>
                                                        {u.deleted_at ? new Date(u.deleted_at).toLocaleString() : 'Deleted'}
                                                    </td>
                                                )}

                                                {/* Actions */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                    {u.is_trashed ? (
                                                        <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                icon={RotateCcw}
                                                                onClick={() => onRestore(u.id)}
                                                            >
                                                                Restore
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                icon={Trash2}
                                                                onClick={() => onPurge(u.id)}
                                                            >
                                                                Purge
                                                            </Button>
                                                        </div>
                                                    ) : (
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
                                                                    title="User actions"
                                                                >
                                                                    <MoreHorizontal size={16} />
                                                                </button>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content align="right" width="48">
                                                                <Dropdown.Link
                                                                    href={route('platform.user.destroy', u.id)}
                                                                    method="delete"
                                                                    as="button"
                                                                    style={{ fontSize: 13, fontWeight: 600, color: BRAND.rose }}
                                                                >
                                                                    Trash Account
                                                                </Dropdown.Link>
                                                            </Dropdown.Content>
                                                        </Dropdown>
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
                    {users?.last_page > 1 && (
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
                                Page {users.current_page} of {users.last_page} · {users.total} accounts total
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={ChevronLeft}
                                    disabled={users.current_page <= 1}
                                    onClick={() => router.get(route('platform.users'), { search, trashed, page: users.current_page - 1 }, { preserveState: true })}
                                >
                                    Prev
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={users.current_page >= users.last_page}
                                    onClick={() => router.get(route('platform.users'), { search, trashed, page: users.current_page + 1 }, { preserveState: true })}
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
