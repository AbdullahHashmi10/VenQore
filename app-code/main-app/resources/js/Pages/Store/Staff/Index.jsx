import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { vq } from '@/theme/runtime';
import {
    Users, UserPlus, Crown, Shield, LayoutGrid, CreditCard,
    Eye, MoreVertical, Trash2, Edit2, Copy, CheckCircle2,
    Clock, AlertTriangle, Mail, Key, X, ChevronDown,
    Send, RotateCcw, UserCheck, UserMinus, Zap
} from 'lucide-react';
import { useTermText } from '@/lib/terms';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';

// ─── Role Config ─────────────────────────────────────────────────────────────
const ROLES = {
    owner:              { label: 'Owner',               color: vq.amber[500], bg: vq.amber[50], border: vq.amber[300], Icon: Crown },
    admin:              { label: 'Admin',               color: vq.indigo[500], bg: vq.indigo[50], border: vq.indigo[300], Icon: Shield },
    manager:            { label: 'Manager',             color: vq.violet[500], bg: vq.violet[50], border: vq.violet[300], Icon: LayoutGrid },
    cashier:            { label: 'Cashier',             color: vq.sky[500], bg: vq.sky[50], border: vq.sky[300], Icon: CreditCard },
    accountant:         { label: 'Accountant',          color: vq.emerald[500], bg: vq.green[50], border: vq.emerald[300], Icon: Zap },
    purchasing_officer: { label: 'Purchasing Officer',  color: vq.orange[500], bg: vq.orange[50], border: vq.orange[300], Icon: CheckCircle2 },
    viewer:             { label: 'Viewer',              color: vq.slate[500], bg: vq.slate[50], border: vq.slate[300], Icon: Eye },
};

const INVITABLE_ROLES = ['admin', 'manager', 'cashier', 'accountant', 'purchasing_officer', 'viewer'];

const STATUS_CONFIG = {
    active:    { color: vq.emerald[500], bg: vq.green[50], label: 'Active',   Icon: CheckCircle2 },
    invited:   { color: vq.indigo[500], bg: vq.indigo[50], label: 'Invited',  Icon: Mail },
    suspended: { color: vq.red[500], bg: vq.red[50], label: 'Suspended',Icon: AlertTriangle },
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
        email: '', role: 'cashier', display_name: '', transaction_approval_mode: 'inherit',
    });

    function submit(e) {
        e.preventDefault();
        post(route('store.staff.invite', { store_slug: usePage().props.store_slug }), {
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
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-main,rgb(var(--vq-slate-900)))' }}>
                            Invite a Team Member
                        </div>
                        <div style={{ fontSize: 13, color: vq.slate[500], marginTop: 4 }}>
                            They'll receive an email with a 7-day invite link.
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: '1px solid rgb(var(--vq-slate-200))', background: 'transparent', cursor: 'pointer', color: vq.slate[500] }}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Email */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 6 }}>
                            Email Address *
                        </label>
                        <input
                            type="email" required
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="colleague@example.com"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${errors.email ? vq.red[500] : vq.slate[200]}`, background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', color: 'var(--text-main,rgb(var(--vq-slate-900)))', boxSizing: 'border-box' }}
                        />
                        {errors.email && <div style={{ fontSize: 11, color: vq.red[500], marginTop: 4 }}>{errors.email}</div>}
                    </div>

                    {/* Role */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 6 }}>
                            Role *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={data.role}
                                onChange={e => setData('role', e.target.value)}
                                style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', color: 'var(--text-main,rgb(var(--vq-slate-900)))', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                            >
                                {INVITABLE_ROLES.map(r => (
                                    <option key={r} value={r}>{ROLES[r]?.label ?? r}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: vq.slate[400], pointerEvents: 'none' }} />
                        </div>

                        {/* Role description */}
                        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: (ROLES[data.role]?.bg ?? vq.slate[50]), border: `1px solid ${ROLES[data.role]?.border ?? vq.slate[200]}`, fontSize: 12, color: ROLES[data.role]?.color ?? vq.slate[500] }}>
                            {data.role === 'admin'              && 'Full store access — same as owner, except billing and store deletion.'}
                            {data.role === 'manager'            && 'All operational access. Can view all 40 reports. Cannot manage staff roles.'}
                            {data.role === 'cashier'            && 'POS terminal only. Minimal dashboard. Cannot see financial data.'}
                            {data.role === 'accountant'         && 'Full financial access. Cannot access POS or manage staff.'}
                            {data.role === 'purchasing_officer' && 'Purchase orders, suppliers, and stock receiving. No sales/finance access.'}
                            {data.role === 'viewer'             && 'Read-only access to P&L, Balance Sheet, and Inventory Valuation only.'}
                        </div>
                    </div>

                    {/* Transaction Approval Mode */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 6 }}>
                            Transaction Approval Mode
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={data.transaction_approval_mode}
                                onChange={e => setData('transaction_approval_mode', e.target.value)}
                                style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', color: 'var(--text-main,rgb(var(--vq-slate-900)))', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                            >
                                <option value="inherit">Inherit Store Policy (Default)</option>
                                <option value="required">Always Require Approval</option>
                                <option value="direct">Direct Posting (Bypass Approval)</option>
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: vq.slate[400], pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 6 }}>
                            Display Name <span style={{ color: vq.slate[400], fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={data.display_name}
                            onChange={e => setData('display_name', e.target.value)}
                            placeholder="How they appear in POS (e.g. Ali)"
                            maxLength={50}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', color: 'var(--text-main,rgb(var(--vq-slate-900)))', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgb(var(--vq-slate-200))', background: 'transparent', fontSize: 13, fontWeight: 600, color: vq.slate[500], cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, rgb(var(--vq-indigo-500)), rgb(var(--vq-violet-500)))', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: processing ? 0.7 : 1 }}>
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
        transaction_approval_mode: member.transaction_approval_mode ?? 'inherit',
    });

    function submit(e) {
        e.preventDefault();
        patch(route('store.admin.users.update', { store_slug: usePage().props.store_slug, member: member.id }), {
            onSuccess: onClose,
        });
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid rgb(var(--vq-slate-200))', borderRadius: 24, padding: 30, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main,rgb(var(--vq-slate-900)))' }}>Edit {member.name}</div>
                    <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: '1px solid rgb(var(--vq-slate-200))', background: 'transparent', cursor: 'pointer', color: vq.slate[500] }}><X size={14} /></button>
                </div>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 5 }}>Role</label>
                        <select value={data.role} onChange={e => setData('role', e.target.value)}
                            disabled={member.role === 'owner'}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                            {INVITABLE_ROLES.map(r => <option key={r} value={r}>{ROLES[r]?.label ?? r}</option>)}
                        </select>
                        {member.role === 'owner' && <div style={{ fontSize: 11, color: vq.slate[400], marginTop: 4 }}>Owner role cannot be changed.</div>}
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 5 }}>Approval Mode</label>
                        <select value={data.transaction_approval_mode} onChange={e => setData('transaction_approval_mode', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                            <option value="inherit">Inherit Store Policy</option>
                            <option value="required">Always Require Approval</option>
                            <option value="direct">Direct Posting (Bypass Approval)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 5 }}>Display Name</label>
                        <input value={data.display_name} onChange={e => setData('display_name', e.target.value)}
                            placeholder="POS display name"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: vq.slate[600], display: 'block', marginBottom: 5 }}>Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)}
                            disabled={member.role === 'owner'}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'var(--input-bg,rgb(var(--vq-slate-50)))', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgb(var(--vq-slate-200))', background: 'transparent', fontSize: 13, fontWeight: 600, color: vq.slate[500], cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: vq.indigo[500], color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.7 : 1 }}>
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
        router.delete(route('store.admin.users.remove', { store_slug: usePage().props.store_slug, member: member.id }), { preserveScroll: true });
        setMenuOpen(false);
    }

    return (
        <>
            {editing && <EditMemberModal member={member} storeId={storeId} onClose={() => setEditing(false)} />}
            <tr
                style={{ borderBottom: '1px solid var(--card-border,rgb(var(--vq-slate-100)))', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {/* Member info */}
                <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={member.name} role={member.role} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main,rgb(var(--vq-slate-900)))', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {member.display_name || member.name}
                                {isMe && <span style={{ fontSize: 10, fontWeight: 700, background: vq.violet[100], color: vq.indigo[500], padding: '1px 6px', borderRadius: 5, letterSpacing: '0.04em' }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: 11, color: vq.slate[500], marginTop: 2 }}>{member.email}</div>
                            {member.display_name && member.name !== member.display_name && (
                                <div style={{ fontSize: 10, color: vq.slate[400] }}>Name: {member.name}</div>
                            )}
                        </div>
                    </div>
                </td>

                {/* Role */}
                <td style={{ padding: '14px 16px' }}><RolePill role={member.role} /></td>

                {/* Status */}
                <td style={{ padding: '14px 16px' }}><StatusDot status={member.status} /></td>

                {/* Approval Mode */}
                <td style={{ padding: '14px 16px' }}>
                    {member.transaction_approval_mode === 'required' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: vq.amber[50], color: vq.amber[700], border: `1px solid ${vq.amber[300]}`, fontSize: 11, fontWeight: 700 }}>
                            <Shield size={10} /> Required
                        </span>
                    ) : member.transaction_approval_mode === 'direct' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: vq.green[50], color: vq.emerald[700], border: `1px solid ${vq.emerald[300]}`, fontSize: 11, fontWeight: 700 }}>
                            <Zap size={10} /> Direct
                        </span>
                    ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: vq.slate[50], color: vq.slate[600], border: `1px solid ${vq.slate[200]}`, fontSize: 11, fontWeight: 600 }}>
                            Inherit
                        </span>
                    )}
                </td>

                {/* PIN */}
                <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: member.pos_pin_set ? vq.emerald[500] : vq.slate[400], fontWeight: 600 }}>
                        <Key size={11} />
                        {member.pos_pin_set ? 'PIN Set' : 'No PIN'}
                    </span>
                </td>

                {/* Joined */}
                <td style={{ padding: '14px 16px', fontSize: 12, color: vq.slate[500] }}>
                    {member.status === 'invited'
                        ? <span style={{ color: vq.indigo[500], fontSize: 11 }}>Invited {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : ''}</span>
                        : member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'
                    }
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {canManage && !isOwner && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid rgb(var(--vq-slate-200))', background: 'transparent', cursor: 'pointer', color: vq.slate[500], display: 'flex', alignItems: 'center' }}
                            >
                                <MoreVertical size={15} />
                            </button>
                            {menuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
                                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 40, background: 'var(--card-bg,#fff)', border: '1px solid rgb(var(--vq-slate-200))', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden' }}>
                                        <button onClick={() => { setEditing(true); setMenuOpen(false); }}
                                            style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontSize: 13, color: vq.slate[600], cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = vq.slate[50]}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            <Edit2 size={13} /> Edit Role & Approval
                                        </button>
                                        <button onClick={remove}
                                            style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontSize: 13, color: vq.red[500], cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = vq.red[50]}
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
    const tt = useTermText();
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
        <OneGlanceLayout mode="admin" activeMenu="Staff Management" noPadding>
            <Head title={tt('Staff Management')} />
            {showInvite && <InviteModal storeId={store_id} onClose={() => setShowInvite(false)} />}

            <ListPageFrame className="p-2.5">
            <ListToolbar
                title={tt('Team Management')}
                left={canManage && join_code ? (
                    <div className="h-10 flex items-center gap-2 pl-3 pr-1 rounded-[12px] border border-line bg-app">
                        <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Join Code</span>
                        <span className="font-mono font-extrabold tracking-widest text-sm text-brand-600">{join_code}</span>
                        <button type="button" onClick={copyCode} className="h-8 px-2.5 rounded-[12px] text-xs font-bold flex items-center gap-1.5 text-ink-muted hover:bg-interactive-hover transition-colors">
                            {codeCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                            {codeCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                ) : null}
                search={{ value: search, onChange: setSearch, placeholder: 'Search team members…' }}
                actions={canManage ? <ListAddButton icon={UserPlus} onClick={() => setShowInvite(true)}>{tt('Invite Staff')}</ListAddButton> : null}
            />
            <ListStatCards cards={[
                { label: 'Members', value: members?.length ?? 0, icon: Users },
                { label: 'Active', value: active.length, icon: CheckCircle2, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                { label: 'Pending', value: invited.length, icon: Mail, icon_tone: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { label: 'Suspended', value: suspended.length, icon: AlertTriangle, icon_tone: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', value_tone: 'text-rose-600' },
            ]} />
            <div className="md:contents" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>

                {/* Flash */}
                {flash?.success && (
                    <div className="md:!mb-0 md:shrink-0" style={{ marginBottom: 20, padding: '12px 18px', borderRadius: 12, background: vq.green[50], border: '1px solid #bbf7d0', color: vq.green[700], fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} /> {flash.success}
                    </div>
                )}

                <MobileListHeader
                    title={tt('Team Management')}
                    search={{ value: search, onChange: setSearch, placeholder: 'Search team members…' }}
                    add={canManage ? { onClick: () => setShowInvite(true), label: tt('Invite Staff'), icon: UserPlus } : undefined}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Members', value: members?.length ?? 0, tone: 'ink', icon: Users },
                    { label: 'Active', value: active.length, tone: 'emerald', icon: CheckCircle2 },
                    { label: 'Pending', value: invited.length, tone: 'blue', icon: Mail },
                    { label: 'Suspended', value: suspended.length, tone: 'rose', icon: AlertTriangle },
                ]} />
                {canManage && join_code && (
                    <div className="md:hidden flex items-center gap-2 mt-2 mb-3 px-3 py-2 rounded-[12px] border border-line bg-surface">
                        <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Join Code</span>
                        <span className="font-mono font-extrabold tracking-widest text-sm text-brand-600 flex-1">{join_code}</span>
                        <button type="button" onClick={copyCode} className="h-8 px-2.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 text-ink-muted active:bg-interactive-hover">
                            {codeCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                            {codeCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                )}

                {/* Staff Table */}
                <div className="md:!rounded-[14px] md:flex-1 md:min-h-0 md:!overflow-auto" style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,rgb(var(--vq-slate-200)))', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead className="md:sticky md:top-0 md:z-10" style={{ background: 'var(--card-bg,#fff)' }}>
                            <tr style={{ borderBottom: '1px solid var(--card-border,rgb(var(--vq-slate-100)))' }}>
                                {['Member', 'Role', 'Status', 'Approval Mode', 'POS PIN', 'Joined', 'Actions'].map(h => (
                                    <th key={h} className="sticky top-0 z-10" style={{ background: 'var(--card-bg,#fff)', padding: '12px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: vq.slate[400], letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        {h === 'Actions' && !canManage ? '' : h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                                        <Users size={32} color={vq.slate[200]} style={{ margin: '0 auto 12px' }} />
                                        <div style={{ color: vq.slate[400], fontSize: 14 }}>
                                            {search ? 'No members match your search.' : tt('No team members yet. Invite your first staff member!')}
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
                <div className="md:!mt-0 md:shrink-0" style={{ marginTop: 24, padding: '16px 20px', background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,rgb(var(--vq-slate-200)))', borderRadius: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: vq.slate[400], letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Role Permissions</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                        {Object.entries(ROLES).filter(([r]) => r !== 'owner').map(([role, cfg]) => (
                            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <RolePill role={role} />
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, color: vq.slate[400], marginTop: 10 }}>
                        💡 Each role gets a tailored dashboard — Cashiers see only POS, Accountants see only finance, Viewers are read-only.
                    </div>
                </div>
            </div>
            </ListPageFrame>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
`}</style>
        </OneGlanceLayout>
    );
}
