import React, { useState } from 'react';
import { Head, usePage, useForm, router, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Zap, Plus, Link2, Unlink, Check, Clock, AlertTriangle,
    BarChart2, RefreshCw, Edit2, Trash2, ChevronLeft,
    CheckCircle2, AlertCircle, X, Save, ExternalLink, Settings, Home, HardDrive
} from 'lucide-react';

const AmazonLogo = () => (
    <svg viewBox="0 0 16 16" style={{ width: 28, height: 28, display: 'block' }}>
        <path fill="#ffffff" d="M10.813 11.968c.157.083.36.074.5-.05l.005.005a90 90 0 0 1 1.623-1.405c.173-.143.143-.372.006-.563l-.125-.17c-.345-.465-.673-.906-.673-1.791v-3.3l.001-.335c.008-1.265.014-2.421-.933-3.305C10.404.274 9.06 0 8.03 0 6.017 0 3.77.75 3.296 3.24c-.047.264.143.404.316.443l2.054.22c.19-.009.33-.196.366-.387.176-.857.896-1.271 1.703-1.271.435 0 .929.16 1.188.55.264.39.26.91.257 1.376v.432q-.3.033-.621.065c-1.113.114-2.397.246-3.36.67C3.873 5.91 2.94 7.08 2.94 8.798c0 2.2 1.387 3.298 3.168 3.298 1.506 0 2.328-.354 3.489-1.54l.167.246c.274.405.456.675 1.047 1.166ZM6.03 8.431C6.03 6.627 7.647 6.3 9.177 6.3v.57c.001.776.002 1.434-.396 2.133-.336.595-.87.961-1.465.961-.812 0-1.286-.619-1.286-1.533" />
        <path fill="#FF9900" d="M.435 12.174c2.629 1.603 6.698 4.084 13.183.997.28-.116.475.078.199.431C13.538 13.96 11.312 16 7.57 16 3.832 16 .968 13.446.094 12.386c-.24-.275.036-.4.199-.299z" />
        <path fill="#FF9900" d="M13.828 11.943c.567-.07 1.468-.027 1.645.204.135.176-.004.966-.233 1.533-.23.563-.572.961-.762 1.115s-.333.094-.23-.137c.105-.23.684-1.663.455-1.963-.213-.278-1.177-.177-1.625-.13l-.09.009q-.142.013-.233.024c-.193.021-.245.027-.274-.032-.074-.209.779-.556 1.347-.623" />
    </svg>
);

const TikTokLogo = () => (
    <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, display: 'block' }}>
        <path fill="#69C9D0" transform="translate(-0.6, -0.3)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
        <path fill="#EE1D52" transform="translate(0.6, 0.3)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
        <path fill="#ffffff" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
    </svg>
);

const EbayLogo = () => (
    <svg viewBox="0 0 1000 400.75" style={{ width: 44, height: 18, display: 'block' }}>
        <path fill="#f12c2d" d="m 199.63633,185.86602 c -1.94427,-46.87735 -35.77951,-64.41973 -71.94139,-64.41973 -38.99421,0 -70.12667,19.7327 -75.58026,64.41973 z M 51.034408,219.1909 c 2.704332,45.48365 34.069782,72.38437 77.197532,72.38437 29.88033,0 56.45979,-12.17498 65.35948,-38.66041 h 51.68424 c -10.05205,53.73979 -67.15384,71.98058 -116.303,71.98058 C 39.606424,324.89544 0,275.67889 0,209.30653 0,136.24203 40.965642,88.12194 129.78809,88.12194 c 70.69867,0 122.49992,36.99926 122.49992,117.75572 v 13.31324 z" />
        <path fill="#0968f6" d="m 380.83181,290.6235 c 46.57228,0 78.44078,-33.52181 78.44078,-84.10854 0,-50.58203 -31.8685,-84.10854 -78.44078,-84.10854 -46.31058,0 -78.44392,33.52651 -78.44392,84.10854 0,50.58673 32.13334,84.10854 78.44392,84.10854 z M 252.2854,0 h 50.10249 l -0.005,125.87707 c 24.55682,-29.25975 58.38892,-37.75513 91.68976,-37.75513 55.83503,0 117.85132,37.6773 117.85132,119.02875 0,68.12232 -49.32155,117.74475 -118.78114,117.74475 -36.35726,0 -70.58062,-13.04265 -91.68663,-38.88294 0,10.32107 -0.57618,20.72364 -1.70503,30.56413 h -49.17162 c 0.85513,-15.90944 1.70555,-35.7184 1.70555,-51.74693 z" />
        <path fill="#ffbc13" d="m 633.07803,212.53323 c -45.43873,1.48929 -73.6715,9.689 -73.6715,39.61897 0,19.37591 15.44713,40.38162 54.66334,40.38162 52.57698,0 80.64259,-28.65902 80.64259,-75.66331 l 0.003,-5.16994 c -18.43302,0 -41.16414,0.16089 -61.63704,0.83266 z m 111.75103,62.10248 c 0,14.58313 0.42155,28.9782 1.69406,41.94092 h -46.61408 c -1.24325,-10.67368 -1.6972,-21.27945 -1.6972,-31.56656 -25.20195,30.97941 -55.17735,39.88537 -96.76149,39.88537 -61.67674,0 -94.70072,-32.59982 -94.70072,-70.30689 0,-54.61215 44.91583,-73.86739 122.89013,-75.65391 21.32332,-0.48686 45.27419,-0.55894 65.07531,-0.55894 l -0.003,-5.33606 c 0,-36.56098 -23.44364,-51.59335 -64.06765,-51.59335 -30.15876,0 -52.38579,12.48057 -54.6764,34.0468 h -52.65168 c 5.57217,-53.77165 62.06643,-67.37115 111.74005,-67.37115 59.50837,0 109.77228,21.17288 109.77228,84.11481 z" />
        <path fill="#93c822" d="M 1000,96.45747 845.05541,400.75099 H 788.94926 L 833.49578,316.25589 716.89033,96.45747 h 58.6266 l 85.80469,171.73057 85.56283,-171.73057 z" />
    </svg>
);

const PLATFORM_THEMES = {
    amazon: { 
        label: 'Amazon SP-API', 
        logoText: 'Amazon',
        color: '#FF9900', 
        bg: '#1a1200', 
        border: '#4a2d00',
        gradient: 'linear-gradient(135deg, #FF9900 0%, #cc7a00 100%)'
    },
    tiktok: { 
        label: 'TikTok Shop Partner', 
        logoText: 'TikTok Shop',
        color: '#69C9D0', 
        bg: '#001a1c', 
        border: '#004a50',
        gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
    },
    ebay: { 
        label: 'eBay Fulfillment API', 
        logoText: 'eBay',
        color: '#86B817', 
        bg: '#0d1a00', 
        border: '#2a4d00',
        gradient: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)'
    },
};

const FULFILLMENT_LABELS = {
    fbm: { label: 'FBM — Home Warehouse',      badge: 'bg-blue-900/40 text-blue-300 border-blue-700' },
    fba: { label: 'FBA — Platform Warehouse',  badge: 'bg-purple-900/40 text-purple-300 border-purple-700' },
    jit: { label: 'JIT — Buy Day-Of',          badge: 'bg-amber-900/40 text-amber-300 border-amber-700' },
};

export default function VenSynQSettings({ channels = [], warehouses = [], expenseCategories = [] }) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const store = props.store;

    const [editingChannel, setEditingChannel] = useState(null);

    // Form for editing connected channel settings
    const editForm = useForm({
        name:                     '',
        default_fulfillment_type: 'fbm',
        fee_percentage:           15,
        warehouse_id:             '',
        expense_category_id:      '',
        currency:                 'GBP',
    });

    const handleEditChannel = (e) => {
        e.preventDefault();
        router.patch(route('store.vensynq.channels.update', { store_slug: store?.slug, channel: editingChannel.id }), {
            name:                     editForm.data.name,
            default_fulfillment_type: editForm.data.default_fulfillment_type,
            fee_percentage:           editForm.data.fee_percentage,
            warehouse_id:             editForm.data.warehouse_id,
            expense_category_id:      editForm.data.expense_category_id,
            currency:                 editForm.data.currency,
        }, {
            onSuccess: () => {
                setEditingChannel(null);
                editForm.reset();
            }
        });
    };

    const startEdit = (ch) => {
        setEditingChannel(ch);
        editForm.setData({
            name:                     ch.name,
            default_fulfillment_type: ch.default_fulfillment_type,
            fee_percentage:           ch.fee_percentage,
            warehouse_id:             ch.warehouse_id ?? '',
            expense_category_id:      ch.expense_category_id ?? '',
            currency:                 ch.currency ?? 'GBP',
        });
    };

    const handleDisconnect = (ch) => {
        if (confirm(`Are you sure you want to disconnect store "${ch.name}"? Active synchronization will stop.`)) {
            router.delete(route('store.vensynq.channels.disconnect', { store_slug: store?.slug, channel: ch.id }));
        }
    };

    // Helper to check all connected channels for a platform
    const getConnectedChannels = (platform) => {
        return channels.filter(c => c.platform === platform && c.is_connected);
    };

    return (
        <OneGlanceLayout>
            <Head title="VenSynQ Settings — Integrations Center" />

            <div className="vensynq-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1421 100%)', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", padding: '0 0 80px' }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{ background: 'linear-gradient(90deg, #0a0f1a, #111827)', borderBottom: '1px solid #1e3a5f', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Link href={route('store.vensynq.index', { store_slug: store?.slug })} style={{ width: 36, height: 36, borderRadius: 10, background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'color 0.2s' }} className="hover:text-white">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                VenSynQ Integrations
                            </h1>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>OAuth Connection Center & Fulfillment Defaults</p>
                        </div>
                    </div>
                </div>

                {/* ── Flash Messages ──────────────────────────────────────── */}
                {flash.success && (
                    <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 8, background: '#052e16', border: '1px solid #166534', color: '#4ade80', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 8, background: '#2d0000', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={15} /> {flash.error}
                    </div>
                )}

                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

                    {/* ── Marketplace Grid ─────────────────────────────────── */}
                    <section>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
                            Marketplace Connect Center
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
                            {['amazon', 'tiktok', 'ebay'].map(platform => {
                                const theme = PLATFORM_THEMES[platform];
                                const connectedList = getConnectedChannels(platform);
                                const isConnected = connectedList.length > 0;

                                return (
                                    <div 
                                        key={platform} 
                                        style={{ 
                                            background: '#0d1421', 
                                            border: isConnected ? `1px solid ${theme.color}40` : '1px solid #1e3a5f', 
                                            borderRadius: 14, 
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.2s, border-color 0.2s'
                                        }}
                                    >
                                        {/* Platform Title Banner */}
                                        <div style={{ background: theme.bg, borderBottom: `1px solid ${theme.border}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#0a0f1a', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {platform === 'amazon' && <AmazonLogo />}
                                                    {platform === 'tiktok' && <TikTokLogo />}
                                                    {platform === 'ebay' && <EbayLogo />}
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                                                    {theme.logoText}
                                                </h3>
                                            </div>
                                            <span style={{ 
                                                fontSize: 10, 
                                                fontWeight: 700, 
                                                padding: '2px 8px', 
                                                borderRadius: 20, 
                                                textTransform: 'uppercase',
                                                background: isConnected ? '#062f17' : '#1e293b',
                                                color: isConnected ? '#4ade80' : '#64748b',
                                                border: isConnected ? '1px solid #166534' : '1px solid #334155'
                                            }}>
                                                {isConnected ? `${connectedList.length} Connected` : 'disconnected'}
                                            </span>
                                        </div>

                                        {/* Settings & Status Area */}
                                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
                                            {isConnected ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                                    {connectedList.map((connected, idx) => (
                                                        <div key={connected.id} style={{ borderBottom: idx < connectedList.length - 1 ? '1px solid #1e3a5f' : 'none', paddingBottom: idx < connectedList.length - 1 ? 24 : 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{connected.name}</span>
                                                                    {connected.external_seller_id && (
                                                                        <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Seller ID: {connected.external_seller_id}</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: 8 }}>
                                                                    <button 
                                                                        onClick={() => startEdit(connected)}
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                                                    >
                                                                        <Edit2 size={11} /> Tune
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDisconnect(connected)}
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#2d1a1a', border: '1px solid #5f1e1e', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                                                    >
                                                                        <Unlink size={11} /> Unlink
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div style={{ background: '#0a0f1a', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                                    <span style={{ color: '#64748b' }}>Default Fulfillment</span>
                                                                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                                                                        {FULFILLMENT_LABELS[connected.default_fulfillment_type]?.label ?? connected.default_fulfillment_type}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                                    <span style={{ color: '#64748b' }}>Estimated Platform Fee</span>
                                                                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{connected.fee_percentage}%</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                                    <span style={{ color: '#64748b' }}>Default Warehouse</span>
                                                                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{connected.warehouse?.name ?? 'Not set'}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                                    <span style={{ color: '#64748b' }}>Currency Mapping</span>
                                                                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{connected.currency}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                                    <span style={{ color: '#64748b' }}>Last Synced At</span>
                                                                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                                                        {connected.last_synced_at ? new Date(connected.last_synced_at).toLocaleString('en-GB', { hour: '2-digit', minute:'2-digit', day:'numeric', month:'short' }) : 'Never synced'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {connected.sync_status === 'error' && (
                                                                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: '#2d0000', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 11 }}>
                                                                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                                                    {connected.sync_error_message ?? 'Connection error. Please re-authenticate.'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Link to connect another account for this platform */}
                                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                                                        <a 
                                                            href={route('store.vensynq.connect', { store_slug: store?.slug, platform })}
                                                            style={{ 
                                                                display: 'inline-flex', 
                                                                alignItems: 'center', 
                                                                gap: 6, 
                                                                padding: '8px 16px', 
                                                                borderRadius: 8, 
                                                                background: '#1e293b', 
                                                                border: '1px solid #334155', 
                                                                color: '#cbd5e1', 
                                                                fontSize: 12, 
                                                                fontWeight: 600, 
                                                                textDecoration: 'none', 
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s'
                                                            }}
                                                        >
                                                            <Plus size={14} /> Connect Another Store Account
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                    <div style={{ color: '#64748b', fontSize: 13, lineHeight: '1.5' }}>
                                                        {platform === 'amazon' && 'Fetch shipped and unshipped customer order payloads securely using the official Amazon Seller Partner API.'}
                                                        {platform === 'tiktok' && 'Quietly fetch active TikTok Shop order states. Processes shortfalls instantly as JIT drafts.'}
                                                        {platform === 'ebay' && 'Integrates eBay seller order notifications into the unified VenQore command center.'}
                                                    </div>

                                                    <a 
                                                        href={route('store.vensynq.connect', { store_slug: store?.slug, platform })}
                                                        style={{ 
                                                            width: '100%', 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: 6, 
                                                            padding: '10px', 
                                                            borderRadius: 8, 
                                                            background: theme.gradient, 
                                                            color: '#0a0f1a', 
                                                            fontSize: 13, 
                                                            fontWeight: 700, 
                                                            textDecoration: 'none', 
                                                            cursor: 'pointer',
                                                            boxShadow: `0 4px 14px ${theme.color}25`
                                                        }}
                                                    >
                                                        <Link2 size={14} /> Connect Official {theme.logoText}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* ── Edit Channel Modal (Click 3 Tunings) ───────────────── */}
                {editingChannel && (
                    <Modal title={`Defaults Config: ${editingChannel.name}`} onClose={() => setEditingChannel(null)}>
                        <form onSubmit={handleEditChannel} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Field label="Nickname / Nick" error={editForm.errors.name}>
                                <input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)}
                                    style={inputStyle} required />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <Field label="Platform Source">
                                    <input value={editingChannel.platform.toUpperCase()} style={{ ...inputStyle, background: '#1e293b', color: '#64748b', cursor: 'not-allowed' }} disabled />
                                </Field>
                                <Field label="Default Fulfillment Type" error={editForm.errors.default_fulfillment_type}>
                                    <select value={editForm.data.default_fulfillment_type} onChange={e => editForm.setData('default_fulfillment_type', e.target.value)} style={inputStyle}>
                                        <option value="fbm">FBM — Home Warehouse</option>
                                        <option value="fba">FBA — Platform (revenue only)</option>
                                        <option value="jit">JIT — Buy Day-Of</option>
                                    </select>
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <Field label="Fee Percentage %" error={editForm.errors.fee_percentage}>
                                    <input type="number" step="0.1" min="0" max="100" value={editForm.data.fee_percentage}
                                        onChange={e => editForm.setData('fee_percentage', e.target.value)} style={inputStyle} />
                                </Field>
                                <Field label="Currency Override" error={editForm.errors.currency}>
                                    <select value={editForm.data.currency} onChange={e => editForm.setData('currency', e.target.value)} style={inputStyle}>
                                        <option value="GBP">GBP £</option>
                                        <option value="USD">USD $</option>
                                        <option value="EUR">EUR €</option>
                                        <option value="PKR">PKR ₨</option>
                                    </select>
                                </Field>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <Field label="Default Fulfill Warehouse" error={editForm.errors.warehouse_id}>
                                    <select value={editForm.data.warehouse_id} onChange={e => editForm.setData('warehouse_id', e.target.value)} style={inputStyle}>
                                        <option value="">Select Warehouse…</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Expense category" error={editForm.errors.expense_category_id}>
                                    <select value={editForm.data.expense_category_id} onChange={e => editForm.setData('expense_category_id', e.target.value)} style={inputStyle}>
                                        <option value="">Select Expense category…</option>
                                        {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </Field>
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" onClick={() => setEditingChannel(null)} style={{ ...btnBase, background: '#1e293b', color: '#94a3b8' }}>Cancel</button>
                                <button type="submit" disabled={editForm.processing} style={{ ...btnBase, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}>
                                    {editForm.processing ? 'Saving Defaults…' : 'Save Defaults'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            `}</style>
        </OneGlanceLayout>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#0d1421', border: '1px solid #1e3a5f', borderRadius: 14, padding: 28, width: 520, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{label}</label>
            {children}
            {error && <span style={{ fontSize: 11, color: '#f87171', marginTop: 3, display: 'block' }}>{error}</span>}
        </div>
    );
}

const inputStyle = {
    width: '100%', background: '#0a0f1a', border: '1px solid #1e3a5f', borderRadius: 8,
    padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 8, border: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
};
