import React, { useState } from 'react';
import { usePage, Head, router, Link } from '@inertiajs/react';
import { 
    Search, UserCog, Trash2, RotateCcw, ShieldCheck,
    MoreHorizontal, Mail, Shield
} from 'lucide-react';

export default function Users({ users, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [trashed, setTrashed] = useState(filters.trashed || false);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('store.admin.users', { store_slug: store.slug }), { search, trashed }, { preserveState: true });
    };

    const toggleTrashed = () => {
        const newVal = !trashed;
        setTrashed(newVal);
        router.get(route('store.admin.users', { store_slug: store.slug }), { search, trashed: newVal }, { preserveState: true });
    };

    const onRestore = (id) => {
        if (confirm('Restore this user account?')) {
            router.post(route('admin.user.restore', id));
        }
    };

    const onPurge = (id) => {
        if (confirm('PERMANENTLY DELETE this user? Their account will be gone forever.')) {
            router.delete(route('admin.user.purge', id));
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24 }}>
            <Head title="Platform HQ | User Management" />
            
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>User Management</h1>
                        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                            View and manage all platform and store users.
                        </p>
                    </div>
                    <button 
                        onClick={toggleTrashed}
                        style={{ 
                            padding: '10px 16px', 
                            borderRadius: 12, 
                            background: trashed ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${trashed ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                            color: trashed ? '#ef4444' : '#94a3b8',
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
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 16px' }}>
                        <Search size={18} color="#475569" />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by name or email..." 
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '14px 0', fontSize: 14 }} 
                        />
                    </div>
                    <button type="submit" style={{ padding: '0 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
                </form>

                {/* Table */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Identity</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Platform Access</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Joined</th>
                                {trashed && <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Deleted At</th>}
                                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{u.name[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {u.is_platform_admin ? (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <ShieldCheck size={10} /> PLATFORM {u.platform_role.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#475569' }}>Standard User</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 13 }}>{u.created_at}</td>
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
                                            <button style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <MoreHorizontal size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={trashed ? 5 : 4} style={{ padding: 64, textAlign: 'center', color: '#475569' }}>
                                        <UserCog size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                        <div>No users found.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Link href={route('store.admin.dashboard', { store_slug: store.slug })} style={{ color: '#6366f1', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Back to Command Center</Link>
            </div>
        </div>
    );
}
