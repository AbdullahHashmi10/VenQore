import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Users, UserPlus, Crown, Shield, LayoutGrid, CreditCard,
    Eye, MoreVertical, Trash2, Edit2, Copy, CheckCircle2,
    Clock, AlertTriangle, Mail, Key, X, ChevronDown,
    Send, RotateCcw, UserCheck, UserMinus, Zap
} from 'lucide-react';

// ─── Role Config ─────────────────────────────────────────────────────────────
const ROLES = {
    owner:              { label: 'Owner',               color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', Icon: Crown },
    admin:              { label: 'Admin',               color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc', Icon: Shield },
    manager:            { label: 'Manager',             color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', Icon: LayoutGrid },
    cashier:            { label: 'Cashier',             color: '#0ea5e9', bg: '#f0f9ff', border: '#7dd3fc', Icon: CreditCard },
    accountant:         { label: 'Accountant',          color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7', Icon: Zap },
    purchasing_officer: { label: 'Purchasing Officer',  color: '#f97316', bg: '#fff7ed', border: '#fdba74', Icon: CheckCircle2 },
    viewer:             { label: 'Viewer',              color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', Icon: Eye },
};

const INVITABLE_ROLES = ['admin', 'manager', 'cashier', 'accountant', 'purchasing_officer', 'viewer'];

const STATUS_CONFIG = {
    active:    { color: '#10b981', bg: '#f0fdf4', label: 'Active',   Icon: CheckCircle2 },
    invited:   { color: '#6366f1', bg: '#eef2ff', label: 'Invited',  Icon: Mail },
    suspended: { color: '#ef4444', bg: '#fef2f2', label: 'Suspended',Icon: AlertTriangle },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function RolePill({ role }) {
    const cfg = ROLES[role] ?? ROLES.viewer;
    const { Icon } = cfg;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 8,
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
        }}>
            <Icon size={10} />{cfg.label}
        </span>
    );
}

function StatusDot({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.suspended;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 9px', borderRadius: 7,
            background: cfg.bg, color: cfg.color,
            fontSize: 11, fontWeight: 700,
        }}>
            <cfg.Icon size={10} />{cfg.label}
        </span>
    );
}

function Avatar({ name, role }) {
    const cfg = ROLES[role] ?? ROLES.viewer;
    const initial = (name ?? '?')[0].toUpperCase();
    return (
        <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, color: cfg.color, flexShrink: 0,
        }}>
            {initial}
        </div>
    );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ storeId, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '', role: 'cashier', display_name: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('store.staff.invite', { store_slug: storeSlug }), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
        }}>
            <div style={{
                background: 'var(--card-bg,#fff)',
                border: '1px solid var(--card-border,#e2e8f0)',
                borderRadius: 24, padding: 32,
                width: '100%', maxWidth: 460,
                boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
                animation: 'slideUp 0.2s ease',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-main,#0f172a)' }}>
                            Invite a Team Member
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                            They'll receive an email with a 7-day invite link.
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Email */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Email Address *
                        </label>
                        <input
                            type="email" required
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="colleague@example.com"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`, background: 'var(--input-bg,#f8fafc)', fontSize: 13, outline: 'none', color: 'var(--text-main,#0f172a)', boxSizing: 'border-box' }}
                        />
                        {errors.email && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.email}</div>}
                    </div>

                    {/* Role */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Role *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={data.role}
                                onChange={e => setData('role', e.target.value)}
                                style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'var(--input-bg,#f8fafc)', fontSize: 13, outline: 'none', color: 'var(--text-main,#0f172a)', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                            >
                                {INVITABLE_ROLES.map(r => (
                                    <option key={r} value={r}>{ROLES[r]?.label ?? r}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>

                        {/* Role description */}
                        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: (ROLES[data.role]?.bg ?? '#f8fafc'), border: `1px solid ${ROLES[data.role]?.border ?? '#e2e8f0'}`, fontSize: 12, color: ROLES[data.role]?.color ?? '#64748b' }}>
                            {data.role === 'admin'              && 'Full store access — same as owner, except billing and store deletion.'}
                            {data.role === 'manager'            && 'All operational access. Can view all 38 reports. Cannot manage staff roles.'}
                            {data.role === 'cashier'            && 'POS terminal only. Minimal dashboard. Cannot see financial data.'}
                            {data.role === 'accountant'         && 'Full financial access. Cannot access POS or manage staff.'}
                            {data.role === 'purchasing_officer' && 'Purchase orders, suppliers, and stock receiving. No sales/finance access.'}
                            {data.role === 'viewer'             && 'Read-only access to P&L, Balance Sheet, and Inventory Valuation only.'}
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Display Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={data.display_name}
                            onChange={e => setData('display_name', e.target.value)}
                            placeholder="How they appear in POS (e.g. Ali)"
                            maxLength={50}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'var(--input-bg,#f8fafc)', fontSize: 13, outline: 'none', color: 'var(--text-main,#0f172a)', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: processing ? 0.7 : 1 }}>
                            <Send size={14} /> {processing ? 'Sending…' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Edit Role Modal ──────────────────────────────────────────────────────────
function EditMemberModal({ member, storeId, onClose }) {
    const { data, setData, patch, processing, errors } = useForm({
        role: member.role,
        display_name: member.display_name ?? '',
        status: member.status,
    });

    function submit(e) {
        e.preventDefault();
        patch(route('store.staff.update', { store_slug: storeSlug, member: member.id }), {
            onSuccess: onClose,
        });
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid #e2e8f0', borderRadius: 24, padding: 30, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main,#0f172a)' }}>Edit {member.name}</div>
                    <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>
                </div>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Role</label>
                        <select value={data.role} onChange={e => setData('role', e.target.value)}
                            disabled={member.role === 'owner'}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'var(--input-bg,#f8fafc)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                            {INVITABLE_ROLES.map(r => <option key={r} value={r}>{ROLES[r]?.label ?? r}</option>)}
                        </select>
                        {member.role === 'owner' && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Owner role cannot be changed.</div>}
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Display Name</label>
                        <input value={data.display_name} onChange={e => setData('display_name', e.target.value)}
                            placeholder="POS display name"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'var(--input-bg,#f8fafc)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)}
                            disabled={member.role === 'owner'}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'var(--input-bg,#f8fafc)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, storeId, canManage, myRole }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const isOwner = member.role === 'owner';
    const isMe = member.user_id === usePage().props.auth?.user?.id;

    function remove() {
        if (!confirm(`Remove ${member.name} from the store? They will lose all access immediately.`)) return;
        router.delete(route('store.staff.remove', { store_slug: storeSlug, member: member.id }), { preserveScroll: true });
        setMenuOpen(false);
    }

    return (
        <>
            {editing && <EditMemberModal member={member} storeId={storeId} onClose={() => setEditing(false)} />}
            <tr
                style={{ borderBottom: '1px solid var(--card-border,#f1f5f9)', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {/* Member info */}
                <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={member.name} role={member.role} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main,#0f172a)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {member.display_name || member.name}
                                {isMe && <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#6366f1', padding: '1px 6px', borderRadius: 5, letterSpacing: '0.04em' }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{member.email}</div>
                            {member.display_name && member.name !== member.display_name && (
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Name: {member.name}</div>
                            )}
                        </div>
                    </div>
                </td>

                {/* Role */}
                <td style={{ padding: '14px 16px' }}><RolePill role={member.role} /></td>

                {/* Status */}
                <td style={{ padding: '14px 16px' }}><StatusDot status={member.status} /></td>

                {/* PIN */}
                <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: member.pos_pin_set ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                        <Key size={11} />
                        {member.pos_pin_set ? 'PIN Set' : 'No PIN'}
                    </span>
                </td>

                {/* Joined */}
                <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>
                    {member.status === 'invited'
                        ? <span style={{ color: '#6366f1', fontSize: 11 }}>Invited {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : ''}</span>
                        : member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'
                    }
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {canManage && !isOwner && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                            >
                                <MoreVertical size={15} />
                            </button>
                            {menuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
                                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 40, background: 'var(--card-bg,#fff)', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden' }}>
                                        <button onClick={() => { setEditing(true); setMenuOpen(false); }}
                                            style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontSize: 13, color: '#475569', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            <Edit2 size={13} /> Edit Role
                                        </button>
                                        <button onClick={remove}
                                            style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontSize: 13, color: '#ef4444', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            <Trash2 size={13} /> Remove
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </td>
            </tr>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffIndex({ members, join_code, store_id }) {
    const { my_role, auth, flash } = usePage().props;
    const [showInvite, setShowInvite] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [search, setSearch] = useState('');

    const canManage = ['owner', 'admin'].includes(my_role);

    function copyCode() {
        navigator.clipboard.writeText(join_code ?? '');
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    }

    const filtered = (members ?? []).filter(m =>
        !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.role?.toLowerCase().includes(search.toLowerCase())
    );

    const active    = filtered.filter(m => m.status === 'active');
    const invited   = filtered.filter(m => m.status === 'invited');
    const suspended = filtered.filter(m => m.status === 'suspended');

    return (
        <OneGlanceLayout mode="admin" activeMenu="Staff Management">
            <Head title="Staff Management" />
            {showInvite && <InviteModal storeId={store_id} onClose={() => setShowInvite(false)} />}

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>

                {/* Flash */}
                {flash?.success && (
                    <div style={{ marginBottom: 20, padding: '12px 18px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} /> {flash.success}
                    </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main,#0f172a)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Users size={20} color="#6366f1" /> Team Management
                        </h1>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                            {members?.length ?? 0} member{members?.length !== 1 ? 's' : ''} · {active.length} active, {invited.length} pending, {suspended.length} suspended
                        </p>
                    </div>
                    {canManage && (
                        <button
                            onClick={() => setShowInvite(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'transform 0.12s, box-shadow 0.12s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)'; }}
                        >
                            <UserPlus size={15} /> Invite Staff
                        </button>
                    )}
                </div>

                {/* Join Code + Search Row */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#e2e8f0)', borderRadius: 12, padding: '0 14px' }}>
                        <Users size={14} color="#94a3b8" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, or role…"
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, padding: '10px 0', color: 'var(--text-main,#0f172a)' }}
                        />
                    </div>

                    {/* Join Code Card */}
                    {canManage && join_code && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-bg,#fff)', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px' }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Join Code</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#6366f1', letterSpacing: '0.12em', fontFamily: 'monospace' }}>{join_code}</div>
                            </div>
                            <button onClick={copyCode}
                                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: codeCopied ? '#f0fdf4' : 'transparent', color: codeCopied ? '#10b981' : '#64748b', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                {codeCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                                {codeCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 120 }}>Staff can join instantly at the Join page</div>
                        </div>
                    )}
                </div>

                {/* Staff Table */}
                <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#e2e8f0)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--card-border,#f1f5f9)' }}>
                                {['Member', 'Role', 'Status', 'POS PIN', 'Joined', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        {h === 'Actions' && !canManage ? '' : h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                                        <Users size={32} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                                        <div style={{ color: '#94a3b8', fontSize: 14 }}>
                                            {search ? 'No members match your search.' : 'No team members yet. Invite your first staff member!'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map(member => (
                                <MemberRow
                                    key={member.id}
                                    member={member}
                                    storeId={store_id}
                                    canManage={canManage}
                                    myRole={my_role}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Role Legend */}
                <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#e2e8f0)', borderRadius: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Role Permissions</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                        {Object.entries(ROLES).filter(([r]) => r !== 'owner').map(([role, cfg]) => (
                            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <RolePill role={role} />
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
                        💡 Each role gets a tailored dashboard — Cashiers see only POS, Accountants see only finance, Viewers are read-only.
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </OneGlanceLayout>
    );
}
