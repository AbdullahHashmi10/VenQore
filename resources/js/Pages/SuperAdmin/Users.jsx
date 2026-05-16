import React, { useState } from 'react';
import { usePage, Head, router, Link } from '@inertiajs/react';
import { 
    Search, UserCog, Trash2, RotateCcw, ShieldCheck,
    MoreHorizontal, Mail, Shield
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import Dropdown from '@/Components/Dropdown';

export default function Users({ users, filters }) {
    const { isDarkMode: isDark } = useTheme();
    const T = isDark ? {
        text: '#f1f5f9',
        textHero: '#ffffff',
        textSub: '#94a3b8',
        textMuted: '#64748b',
        border: 'rgba(255,255,255,0.1)',
        bgInput: 'rgba(255,255,255,0.03)',
        bgTable: 'rgba(255,255,255,0.02)',
        bgHead: 'rgba(255,255,255,0.02)',
        rowBorder: 'rgba(255,255,255,0.03)',
    } : {
        text: '#0f172a',
        textHero: '#0f172a',
        textSub: '#475569',
        textMuted: '#64748b',
        border: 'rgba(0,0,0,0.1)',
        bgInput: '#ffffff',
        bgTable: '#ffffff',
        bgHead: '#f8fafc',
        rowBorder: 'rgba(0,0,0,0.05)',
    };

    const [search, setSearch] = useState(filters.search || '');
    const [trashed, setTrashed] = useState(filters.trashed || false);
    const [selected, setSelected] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelected(users.data.map(u => u.id));
        else setSelected([]);
    };

    const handleSelect = (id) => {
        if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
        else setSelected([...selected, id]);
    };

    const handleBulkDelete = () => {
        if (confirm(`Move ${selected.length} users to trash?`)) {
            router.post(route('platform.users.bulk-destroy'), { ids: selected }, {
                onSuccess: () => setSelected([])
            });
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('platform.users'), { search, trashed }, { preserveState: true });
    };

    const toggleTrashed = () => {
        const newVal = !trashed;
        setTrashed(newVal);
        setSelected([]);
        router.get(route('platform.users'), { search, trashed: newVal }, { preserveState: true });
    };

    const onRestore = (id) => {
        if (confirm('Restore this user account?')) {
            router.post(route('platform.user.restore', id));
        }
    };

    const onPurge = (id) => {
        if (confirm('PERMANENTLY DELETE this user? Their account will be gone forever.')) {
            router.delete(route('platform.user.purge', id));
        }
    };

    return (
        <OneGlanceLayout mode="admin" activeMenu="Platform Users">
            <Head title="Platform HQ | User Management" />
            
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: T.text }}>User Management</h1>
                        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>
                            View and manage all platform and store users.
                        </p>
                    </div>
                    <button 
                        onClick={toggleTrashed}
                        style={{ 
                            padding: '10px 16px', 
                            borderRadius: 12, 
                            background: trashed ? 'rgba(239,68,68,0.1)' : T.bgInput,
                            border: `1px solid ${trashed ? '#ef4444' : T.border}`,
                            color: trashed ? '#ef4444' : T.textSub,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Trash2 size={16} /> {trashed ? 'Viewing Deleted' : 'View Deleted Users'}
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flex: 1 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: '0 16px' }}>
                            <Search size={18} color={T.textMuted} />
                            <input 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                placeholder="Search by name or email..." 
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, padding: '14px 0', fontSize: 14 }} 
                            />
                        </div>
                        <button type="submit" style={{ padding: '0 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
                    </form>
                    {selected.length > 0 && !trashed && (
                         <button onClick={handleBulkDelete} style={{ padding: '0 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Delete {selected.length} Selected</button>
                    )}
                </div>

                {/* Table */}
                <div style={{ background: T.bgTable, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: T.bgHead, borderBottom: `1px solid ${T.border}` }}>
                                <th style={{ width: 40, textAlign: 'center', padding: '16px 12px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={users.data.length > 0 && selected.length === users.data.length}
                                        onChange={handleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Identity</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Platform Access</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Joined</th>
                                {trashed && <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Deleted At</th>}
                                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map(u => (
                                <tr key={u.id} style={{ borderBottom: `1px solid ${T.rowBorder}`, transition: 'background 0.2s', background: selected.includes(u.id) ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                                    <td style={{ width: 40, textAlign: 'center', padding: '16px 12px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selected.includes(u.id)}
                                            onChange={() => handleSelect(u.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>{u.name[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: T.text }}>{u.name}</div>
                                                <div style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {u.is_platform_admin ? (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <ShieldCheck size={10} /> PLATFORM {u.platform_role?.toUpperCase() || 'OWNER'}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 11, color: T.textSub }}>Standard User</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 20px', color: T.textMuted, fontSize: 13 }}>{u.created_at}</td>
                                    {trashed && <td style={{ padding: '16px 20px', color: '#ef4444', fontSize: 12 }}>{u.deleted_at}</td>}
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        {u.is_trashed ? (
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button onClick={() => onRestore(u.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <RotateCcw size={14} /> Restore
                                                </button>
                                                <button onClick={() => onPurge(u.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Trash2 size={14} /> Purge
                                                </button>
                                            </div>
                                        ) : (
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button style={{ color: T.textSub, background: 'none', border: 'none', cursor: 'pointer' }}>
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content align="right" width="48">
                                                    <Dropdown.Link href={route('platform.user.destroy', u.id)} method="delete" as="button" style={{ fontSize: 13, fontWeight: 500, color: '#ef4444' }}>
                                                        Trash User
                                                    </Dropdown.Link>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={trashed ? 5 : 4} style={{ padding: 64, textAlign: 'center', color: T.textSub }}>
                                        <UserCog size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                        <div>No users found.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
