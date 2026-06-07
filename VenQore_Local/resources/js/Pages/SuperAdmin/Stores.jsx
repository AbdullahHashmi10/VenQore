import React, { useState } from 'react';
import { usePage, Head, router } from '@inertiajs/react';
import { 
    Search, Building2, Trash2, RotateCcw, ShieldAlert,
    ChevronLeft, Filter, Download, MoreHorizontal
} from 'lucide-react';

export default function Stores({ tenants, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [trashed, setTrashed] = useState(filters.trashed || false);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.stores'), { search, trashed }, { preserveState: true });
    };

    const toggleTrashed = () => {
        const newVal = !trashed;
        setTrashed(newVal);
        router.get(route('admin.stores'), { search, trashed: newVal }, { preserveState: true });
    };

    const onRestore = (id) => {
        if (confirm('Restore this store?')) {
            router.post(route('admin.store.restore', id));
        }
    };

    const onPurge = (id) => {
        if (confirm('PERMANENTLY DELETE this store? This cannot be undone.')) {
            router.delete(route('admin.store.purge', id));
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24 }}>
            <Head title="Platform HQ | Stores" />
            
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Store Management</h1>
                        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                            View and manage all tenant stores on the platform.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
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
                            <Trash2 size={16} /> {trashed ? 'Viewing Trash' : 'View Trash'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 16px' }}>
                        <Search size={18} color="#475569" />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by store name, slug or owner email..." 
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
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Store</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Owner</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Plan</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                                {trashed && <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Deleted At</th>}
                                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.data.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{t.slug}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontSize: 13 }}>{t.owner_name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{t.owner_email}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{t.plan}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: t.status === 'active' ? '#10b981' : '#f59e0b' }}>{t.status.toUpperCase()}</span>
                                    </td>
                                    {trashed && <td style={{ padding: '16px 20px', color: '#ef4444', fontSize: 12 }}>{t.deleted_at}</td>}
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        {t.is_trashed ? (
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button onClick={() => onRestore(t.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <RotateCcw size={14} /> Restore
                                                </button>
                                                <button onClick={() => onPurge(t.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                            {tenants.data.length === 0 && (
                                <tr>
                                    <td colSpan={trashed ? 6 : 5} style={{ padding: 64, textAlign: 'center', color: '#475569' }}>
                                        <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                        <div>No stores found.</div>
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
