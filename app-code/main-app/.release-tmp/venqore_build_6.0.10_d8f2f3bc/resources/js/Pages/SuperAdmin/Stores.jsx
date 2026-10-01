import React, { useState } from 'react';
import { usePage, Head, router, Link } from '@inertiajs/react';
import { 
    Search, Building2, Trash2, RotateCcw, ShieldAlert,
    ChevronLeft, Filter, Download, MoreHorizontal
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell
import { useTheme } from '@/Contexts/ThemeContext';
import Dropdown from '@/Components/Dropdown';

import { vq } from '@/theme/runtime';
export default function Stores({ tenants, filters }) {
    const { isDarkMode: isDark } = useTheme();
    const T = isDark ? {
        text: vq.slate[100],
        textSub: vq.slate[400],
        textMuted: vq.slate[500],
        border: 'rgba(255,255,255,0.1)',
        bgInput: 'rgba(255,255,255,0.03)',
        bgTable: 'rgba(255,255,255,0.02)',
        bgHead: 'rgba(255,255,255,0.02)',
        rowBorder: 'rgba(255,255,255,0.03)',
    } : {
        text: vq.slate[900],
        textSub: vq.slate[600],
        textMuted: vq.slate[500],
        border: 'rgba(0,0,0,0.1)',
        bgInput: '#ffffff',
        bgTable: '#ffffff',
        bgHead: vq.slate[50],
        rowBorder: 'rgba(0,0,0,0.05)',
    };

    const [search, setSearch] = useState(filters.search || '');
    const [trashed, setTrashed] = useState(filters.trashed || false);
    const [selected, setSelected] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelected(tenants.data.map(t => t.id));
        else setSelected([]);
    };

    const handleSelect = (id) => {
        if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
        else setSelected([...selected, id]);
    };

    const handleBulkDelete = () => {
        if (confirm(`Move ${selected.length} stores to trash?`)) {
            router.post(route('platform.stores.bulk-destroy'), { ids: selected }, {
                onSuccess: () => setSelected([])
            });
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('platform.stores'), { search, trashed }, { preserveState: true });
    };

    const toggleTrashed = () => {
        const newVal = !trashed;
        setTrashed(newVal);
        setSelected([]); // Clear selection when switching views
        router.get(route('platform.stores'), { search, trashed: newVal }, { preserveState: true });
    };

    const onRestore = (id) => {
        if (confirm('Restore this store?')) {
            router.post(route('platform.store.restore', id));
        }
    };

    const onPurge = (id) => {
        const passcode = prompt('Enter your action passcode to confirm permanently deleting this store:');
        if (passcode) {
            router.delete(route('platform.store.purge', id), {
                data: { passcode }
            });
        }
    };

    return (
        <OneGlanceLayout mode="admin" activeMenu="Stores">
            <Head title="Platform HQ | Stores" />
            
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: T.text }}>Store Management</h1>
                        <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>
                            View and manage all tenant stores on the platform.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                         <button 
                            onClick={toggleTrashed}
                            style={{ 
                                padding: '10px 16px', 
                                borderRadius: 12, 
                                background: trashed ? 'rgba(239,68,68,0.1)' : T.bgInput,
                                border: `1px solid ${trashed ? vq.red[500] : T.border}`,
                                color: trashed ? vq.red[500] : T.textSub,
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
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flex: 1 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: '0 16px' }}>
                            <Search size={18} color={T.textMuted} />
                            <input 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                placeholder="Search by store name, slug or owner email..." 
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, padding: '14px 0', fontSize: 14 }} 
                            />
                        </div>
                        <button type="submit" style={{ padding: '0 24px', background: vq.indigo[500], color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
                    </form>
                    {selected.length > 0 && !trashed && (
                         <button onClick={handleBulkDelete} style={{ padding: '0 24px', background: vq.red[500], color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Delete {selected.length} Selected</button>
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
                                        checked={tenants.data.length > 0 && selected.length === tenants.data.length}
                                        onChange={handleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Store</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Owner</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Plan</th>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Status</th>
                                {trashed && <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Deleted At</th>}
                                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.data.map(t => (
                                <tr key={t.id} style={{ borderBottom: `1px solid ${T.rowBorder}`, transition: 'background 0.2s', background: selected.includes(t.id) ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                                    <td style={{ width: 40, textAlign: 'center', padding: '16px 12px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selected.includes(t.id)}
                                            onChange={() => handleSelect(t.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 600, color: T.text }}>{t.name}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{t.slug}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{t.owner_name}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{t.owner_email}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: vq.indigo[500], background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{t.plan}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: t.status === 'active' ? vq.emerald[500] : vq.amber[500], background: (t.status === 'active' ? vq.emerald[500] : vq.amber[500]) + '10', border: '1px solid ' + (t.status === 'active' ? vq.emerald[500] : vq.amber[500]) + '20', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{t.status}</span>
                                    </td>
                                    {trashed && <td style={{ padding: '16px 20px', color: vq.red[500], fontSize: 12 }}>{t.deleted_at}</td>}
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        {trashed ? (
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button onClick={() => onRestore(t.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: vq.emerald[500], border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <RotateCcw size={14} /> Restore
                                                </button>
                                                <button onClick={() => onPurge(t.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: vq.red[500], border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                                                    {t.status === 'suspended' ? (
                                                        <Dropdown.Link href={route('platform.store.activate', t.id)} method="post" as="button" style={{ fontSize: 13, fontWeight: 500 }}>
                                                            Activate Store
                                                        </Dropdown.Link>
                                                    ) : (
                                                        <Dropdown.Link href={route('platform.store.suspend', t.id)} method="post" as="button" style={{ fontSize: 13, fontWeight: 500, color: vq.amber[500] }}>
                                                            Suspend Store
                                                        </Dropdown.Link>
                                                    )}
                                                    {t.status === 'trial' && (
                                                        <Dropdown.Link href={route('platform.store.extend-trial', t.id)} method="post" as="button" style={{ fontSize: 13, fontWeight: 500 }}>
                                                            Extend Trial (7 Days)
                                                        </Dropdown.Link>
                                                    )}
                                                    <div style={{ borderTop: '1px solid ' + T.rowBorder, margin: '4px 0' }}></div>
                                                    <Dropdown.Link href={route('platform.store.destroy', t.id)} method="delete" as="button" style={{ fontSize: 13, fontWeight: 500, color: vq.red[500] }}>
                                                        Trash Store
                                                    </Dropdown.Link>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {tenants.data.length === 0 && (
                                <tr>
                                    <td colSpan={trashed ? 6 : 5} style={{ padding: 64, textAlign: 'center', color: vq.slate[600] }}>
                                        <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                        <div>No stores found.</div>
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
