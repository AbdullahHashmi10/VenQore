import React, { useState, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import SyncHealthPanel from './Components/SyncHealthPanel';
import MoneyPipeline from './Components/MoneyPipeline';
import { vq } from '@/theme/runtime';
import {
    Zap, Link2, Truck, Check, Clock, AlertTriangle,
    PackageCheck, BarChart2, RefreshCw, ChevronRight,
    CheckCircle2, AlertCircle, Settings
} from 'lucide-react';

// ─── Platform visual config ───────────────────────────────────────────────────
const AmazonLogo = ({ size = 16 }) => (
    <svg viewBox="0 0 16 16" style={{ width: size, height: size, display: 'block' }}>
        <path fill="#ffffff" d="M10.813 11.968c.157.083.36.074.5-.05l.005.005a90 90 0 0 1 1.623-1.405c.173-.143.143-.372.006-.563l-.125-.17c-.345-.465-.673-.906-.673-1.791v-3.3l.001-.335c.008-1.265.014-2.421-.933-3.305C10.404.274 9.06 0 8.03 0 6.017 0 3.77.75 3.296 3.24c-.047.264.143.404.316.443l2.054.22c.19-.009.33-.196.366-.387.176-.857.896-1.271 1.703-1.271.435 0 .929.16 1.188.55.264.39.26.91.257 1.376v.432q-.3.033-.621.065c-1.113.114-2.397.246-3.36.67C3.873 5.91 2.94 7.08 2.94 8.798c0 2.2 1.387 3.298 3.168 3.298 1.506 0 2.328-.354 3.489-1.54l.167.246c.274.405.456.675 1.047 1.166ZM6.03 8.431C6.03 6.627 7.647 6.3 9.177 6.3v.57c.001.776.002 1.434-.396 2.133-.336.595-.87.961-1.465.961-.812 0-1.286-.619-1.286-1.533" />
        <path fill="#FF9900" d="M.435 12.174c2.629 1.603 6.698 4.084 13.183.997.28-.116.475.078.199.431C13.538 13.96 11.312 16 7.57 16 3.832 16 .968 13.446.094 12.386c-.24-.275.036-.4.199-.299z" />
        <path fill="#FF9900" d="M13.828 11.943c.567-.07 1.468-.027 1.645.204.135.176-.004.966-.233 1.533-.23.563-.572.961-.762 1.115s-.333.094-.23-.137c.105-.23.684-1.663.455-1.963-.213-.278-1.177-.177-1.625-.13l-.09.009q-.142.013-.233.024c-.193.021-.245.027-.274-.032-.074-.209.779-.556 1.347-.623" />
    </svg>
);

const TikTokLogo = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: 'block' }}>
        <path fill="#69C9D0" transform="translate(-0.6, -0.3)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
        <path fill="#EE1D52" transform="translate(0.6, 0.3)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
        <path fill="#ffffff" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
    </svg>
);

const EbayLogo = ({ size = 16 }) => {
    const scale = size / 28;
    const width = 44 * scale;
    const height = 18 * scale;
    return (
        <svg viewBox="0 0 1000 400.75" style={{ width, height, display: 'block' }}>
            <path fill="#f12c2d" d="m 199.63633,185.86602 c -1.94427,-46.87735 -35.77951,-64.41973 -71.94139,-64.41973 -38.99421,0 -70.12667,19.7327 -75.58026,64.41973 z M 51.034408,219.1909 c 2.704332,45.48365 34.069782,72.38437 77.197532,72.38437 29.88033,0 56.45979,-12.17498 65.35948,-38.66041 h 51.68424 c -10.05205,53.73979 -67.15384,71.98058 -116.303,71.98058 C 39.606424,324.89544 0,275.67889 0,209.30653 0,136.24203 40.965642,88.12194 129.78809,88.12194 c 70.69867,0 122.49992,36.99926 122.49992,117.75572 v 13.31324 z" />
            <path fill="#0968f6" d="m 380.83181,290.6235 c 46.57228,0 78.44078,-33.52181 78.44078,-84.10854 0,-50.58203 -31.8685,-84.10854 -78.44078,-84.10854 -46.31058,0 -78.44392,33.52651 -78.44392,84.10854 0,50.58673 32.13334,84.10854 78.44392,84.10854 z M 252.2854,0 h 50.10249 l -0.005,125.87707 c 24.55682,-29.25975 58.38892,-37.75513 91.68976,-37.75513 55.83503,0 117.85132,37.6773 117.85132,119.02875 0,68.12232 -49.32155,117.74475 -118.78114,117.74475 -36.35726,0 -70.58062,-13.04265 -91.68663,-38.88294 0,10.32107 -0.57618,20.72364 -1.70503,30.56413 h -49.17162 c 0.85513,-15.90944 1.70555,-35.7184 1.70555,-51.74693 z" />
            <path fill="#ffbc13" d="m 633.07803,212.53323 c -45.43873,1.48929 -73.6715,9.689 -73.6715,39.61897 0,19.37591 15.44713,40.38162 54.66334,40.38162 52.57698,0 80.64259,-28.65902 80.64259,-75.66331 l 0.003,-5.16994 c -18.43302,0 -41.16414,0.16089 -61.63704,0.83266 z m 111.75103,62.10248 c 0,14.58313 0.42155,28.9782 1.69406,41.94092 h -46.61408 c -1.24325,-10.67368 -1.6972,-21.27945 -1.6972,-31.56656 -25.20195,30.97941 -55.17735,39.88537 -96.76149,39.88537 -61.67674,0 -94.70072,-32.59982 -94.70072,-70.30689 0,-54.61215 44.91583,-73.86739 122.89013,-75.65391 21.32332,-0.48686 45.27419,-0.55894 65.07531,-0.55894 l -0.003,-5.33606 c 0,-36.56098 -23.44364,-51.59335 -64.06765,-51.59335 -30.15876,0 -52.38579,12.48057 -54.6764,34.0468 h -52.65168 c 5.57217,-53.77165 62.06643,-67.37115 111.74005,-67.37115 59.50837,0 109.77228,21.17288 109.77228,84.11481 z" />
            <path fill="#93c822" d="M 1000,96.45747 845.05541,400.75099 H 788.94926 L 833.49578,316.25589 716.89033,96.45747 h 58.6266 l 85.80469,171.73057 85.56283,-171.73057 z" />
        </svg>
    );
};

const WooLogo = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: 'block' }}>
        <path fill="#7F54B3" d="M2.2 4.6h19.6c1.2 0 2.2 1 2.2 2.2v7.3c0 1.2-1 2.2-2.2 2.2H14.8l1 2.4-4.3-2.4H2.2c-1.2 0-2.2-1-2.2-2.2V6.8c0-1.2 1-2.2 2.2-2.2z"/>
        <path fill="#fff" d="M3.1 7.3c.2-.3.5-.4.8-.4.6 0 .9.3 1 .8l.6 4.1 1.5-2.9c.2-.3.4-.5.7-.5.4 0 .7.3.8.8.2 1.2.4 2.2.7 3.1l1.2-3.5c.1-.3.3-.5.6-.5.2 0 .4.1.5.2.2.1.2.3.2.5l-.1.4-1.8 5c-.1.3-.4.5-.7.5-.4 0-.7-.3-.9-.8-.3-.9-.6-2-.9-3.3l-1.4 2.7c-.3.5-.6.8-.9.8-.4 0-.7-.3-.8-.9L2.9 8.1c-.1-.3 0-.6.2-.8z"/>
    </svg>
);

const PLATFORMS = {
    amazon:      { label: 'Amazon',      color: '#FF9900', bg: '#1a1200', border: '#4a2d00' },
    // T16 — WooCommerce promoted to a first-class VenSynQ channel.
    woocommerce: { label: 'WooCommerce', color: '#9B6FD4', bg: '#150d20', border: '#3d2a5c' },
    tiktok:      { label: 'TikTok Shop', color: '#69C9D0', bg: vq.indigo[950], border: '#004a50' },
    ebay:        { label: 'eBay',        color: '#86B817', bg: '#0d1a00', border: '#2a4d00' },
};

const CARRIER_OPTIONS = [
    'Royal Mail', 'Evri', 'DPD', 'DHL', 'UPS', 'FedEx', 'Parcelforce', 'Yodel', 'Other'
];

const FULFILLMENT_LABELS = {
    fbm: { label: 'FBM — Home Warehouse',      badge: 'bg-blue-900/40 text-blue-300 border-blue-700' },
    fba: { label: 'FBA — Platform Warehouse',  badge: 'bg-brand-900/40 text-brand-300 border-brand-700' },
    jit: { label: 'JIT — Buy Day-Of',          badge: 'bg-amber-900/40 text-amber-300 border-amber-700' },
};

// ─── VenSynQ Dashboard ────────────────────────────────────────────────────────
export default function VenSynQDashboard({
    channels = [],
    pendingSales = { data: [] },
    jitDraftsCount = 0,
    health = null,              // T16 — computed by IntegrationHealthService
    pipeline = null,            // T17 — Money Pipeline stages
    clearingEnabled = false,    // T17 — has this tenant switched clearing on?
}) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const store = props.store;

    const [trackingEdits, setTrackingEdits] = useState({});
    const [syncing, setSyncing]             = useState(false);
    const [fetching, setFetching]           = useState(false);

    const handleFetchLiveOrders = useCallback(() => {
        setFetching(true);
        router.post(route('store.vensynq.sync-orders', { store_slug: store?.slug }), {}, {
            // preserveScroll stops the page jumping to the top mid-sync, which
            // made the progress indicator scroll out of view on mobile.
            preserveScroll: true,
            onFinish: () => { setFetching(false); }
        });
    }, [store]);

    // ─── Tracking Update ──────────────────────────────────────────────────────
    const setTracking = (saleId, field, value) => {
        setTrackingEdits(prev => ({
            ...prev,
            [saleId]: { ...prev[saleId], [field]: value }
        }));
    };

    const handleSyncTracking = useCallback(() => {
        const updates = Object.entries(trackingEdits)
            .filter(([, v]) => v.tracking_number)
            .map(([sale_id, v]) => ({
                sale_id,
                tracking_number:  v.tracking_number,
                shipping_carrier: v.shipping_carrier ?? '',
            }));

        if (!updates.length) return;
        setSyncing(true);
        router.post(route('store.vensynq.sync-tracking', { store_slug: store?.slug }), { updates }, {
            onFinish: () => { setSyncing(false); setTrackingEdits({}); }
        });
    }, [trackingEdits, store]);

    const dirtyCount = Object.values(trackingEdits).filter(v => v.tracking_number).length;

    return (
        <OneGlanceLayout>
            <Head title="VenSynQ — Multi-Channel Fulfillment" />

            <div className="vensynq-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1421 100%)', color: vq.slate[200], fontFamily: "'Inter', sans-serif", padding: '0 0 80px' }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{ background: 'linear-gradient(90deg, #0a0f1a, #111827)', borderBottom: '1px solid #1e3a5f', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgb(var(--vq-blue-500)), rgb(var(--vq-violet-500)))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={22} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, rgb(var(--vq-blue-400)), rgb(var(--vq-violet-400)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                VenSynQ Dashboard
                            </h1>
                            <p style={{ margin: 0, fontSize: 12, color: vq.slate[500] }}>Multi-Channel Fulfillment Command Center</p>
                        </div>
                    </div>
                    {channels.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button
                                onClick={handleFetchLiveOrders}
                                disabled={fetching}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '8px 18px',
                                    borderRadius: 8,
                                    background: fetching ? vq.slate[800] : 'linear-gradient(135deg, rgb(var(--vq-blue-500)), #1d4ed8)',
                                    border: 'none',
                                    color: fetching ? vq.slate[600] : '#fff',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: fetching ? 'not-allowed' : 'pointer',
                                    boxShadow: fetching ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.25)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <RefreshCw size={14} className={fetching ? 'spin' : ''} />
                                {fetching ? 'Syncing Orders…' : 'Fetch Live Orders'}
                            </button>
                            {jitDraftsCount > 0 && (
                                <a href={route('store.purchases.index', { store_slug: store?.slug })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#2d1a00', border: '1px solid #7c3d00', color: vq.orange[400], fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                                    <AlertTriangle size={14} />
                                    {jitDraftsCount} JIT Draft{jitDraftsCount !== 1 ? 's' : ''} Need Approval
                                </a>
                            )}
                            <a href={route('store.vensynq.settings', { store_slug: store?.slug })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, rgb(var(--vq-slate-800)), rgb(var(--vq-slate-900)))', border: '1px solid #1e3a5f', color: vq.blue[400], fontSize: 13, textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}>
                                <Settings size={15} /> VenSynQ Settings
                            </a>
                        </div>
                    )}
                </div>

                {/* ── Flash Messages ──────────────────────────────────────── */}
                {flash.success && (
                    <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 8, background: vq.green[950], border: '1px solid #166534', color: vq.green[400], fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 8, background: '#2d0000', border: '1px solid #7f1d1d', color: vq.red[400], fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={15} /> {flash.error}
                    </div>
                )}

                <div style={{
                    padding: '28px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 28,
                    alignItems: channels.length === 0 ? 'center' : 'stretch',
                    justifyContent: 'center',
                    minHeight: channels.length === 0 ? '60vh' : 'auto'
                }}>
                    {channels.length === 0 ? (
                        <div className="relative overflow-hidden bg-neutral-900/90 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.25)] p-8 max-w-2xl text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-slow">
                            {/* Background glows */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

                            <div className="flex flex-col items-center gap-4 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-2xs font-bold uppercase tracking-wider">
                                    <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                                    Multi-Channel Sync
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                    Unified Inventory & Order Control
                                </h3>
                                <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                                    VenSynQ acts as your multi-channel command center. It automatically syncs products, real-time stock levels, and customer orders across WooCommerce, Amazon, eBay, and more. Once connected, your marketplace sales post directly into your main dashboard for unified dispatching, shipping tracking updates, and automated JIT purchase orders.
                                </p>
                                <p className="text-xs text-ink-muted leading-relaxed">
                                    Connect your first integration channel in settings to start importing and tracking your sales in one glance.
                                </p>

                                <div className="pt-4">
                                    <a
                                        href={route('store.vensynq.settings', { store_slug: store?.slug })}
                                        className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl border border-brand-500/30 bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all duration-slow shadow-lg active:scale-[0.98] cursor-pointer text-sm"
                                    >
                                        <Link2 size={18} />
                                        <span>Connect Your First Channel</span>
                                        <ChevronRight size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ── T16: Sync Status Dashboard ─────────────────────────── */}
                            {/* Health badges, Sync Now with live progress, freshness
                                timestamps and the 1-click Error Inspector. Placed first
                                so a broken integration is the first thing seen. */}
                            <SyncHealthPanel
                                health={health}
                                storeSlug={store?.slug}
                                syncing={fetching}
                                onSyncNow={handleFetchLiveOrders}
                            />

                            {/* ── T17: Money Pipeline ────────────────────────────────── */}
                            {/* Answers "where is my money right now?" — online sales,
                                money the platforms are still holding, and what has
                                genuinely cleared to the bank. */}
                            <MoneyPipeline
                                pipeline={pipeline}
                                clearingEnabled={clearingEnabled}
                                storeSlug={store?.slug}
                            />

                            {/* ── Overview Cards ─────────────────────────────────────── */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                                
                                {/* Connected Channels Summary */}
                                <div style={{ background: 'linear-gradient(135deg, #0d1e36 0%, #091220 100%)', border: '1px solid #1e3a5f', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                                    <div>
                                        <span style={{ fontSize: 11, color: vq.blue[400], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channel Connections</span>
                                        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: vq.slate[50] }}>
                                            {channels.length} Connected
                                        </div>
                                    </div>
                                    <a href={route('store.vensynq.settings', { store_slug: store?.slug })} style={{ color: vq.sky[400], fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }} className="hover:underline">
                                        Configure channels & defaults <ChevronRight size={13} />
                                    </a>
                                </div>

                                {/* Pending Fulfillment Summary */}
                                <div style={{ background: 'linear-gradient(135deg, #0f241b 0%, #061510 100%)', border: '1px solid #065f46', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                                    <div>
                                        <span style={{ fontSize: 11, color: vq.emerald[400], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Dispatch</span>
                                        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: vq.slate[50] }}>
                                            {pendingSales.total ?? pendingSales.data.length} Orders
                                        </div>
                                    </div>
                                    <span style={{ color: vq.emerald[200], fontSize: 12 }}>
                                        Awaiting tracking details to sync back
                                    </span>
                                </div>

                                {/* JIT Draft Purchases Summary */}
                                <div style={{ background: 'linear-gradient(135deg, #2b1d0a 0%, #150f05 100%)', border: '1px solid #7c3d00', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                                    <div>
                                        <span style={{ fontSize: 11, color: vq.orange[400], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>JIT Draft Purchases</span>
                                        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: vq.slate[50] }}>
                                            {jitDraftsCount} Pending
                                        </div>
                                    </div>
                                    {jitDraftsCount > 0 ? (
                                        <a href={route('store.purchases.index', { store_slug: store?.slug })} style={{ color: vq.orange[300], fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }} className="hover:underline">
                                            Confirm supplier costs now <ChevronRight size={13} />
                                        </a>
                                    ) : (
                                        <span style={{ color: vq.orange[200], fontSize: 12 }}>
                                            All Day-Of JIT purchases fully processed
                                        </span>
                                    )}
                                </div>

                            </div>

                            {/* ── Pending Fulfillment Table ──────────────── */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <h2 style={{ fontSize: 14, fontWeight: 600, color: vq.slate[400], textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                                        Pending Dispatch ({pendingSales.total ?? pendingSales.data.length})
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {dirtyCount > 0 && (
                                            <span style={{ fontSize: 12, color: vq.slate[400] }}>{dirtyCount} tracking number{dirtyCount !== 1 ? 's' : ''} ready to sync</span>
                                        )}
                                        <button
                                            onClick={handleSyncTracking}
                                            disabled={!dirtyCount || syncing}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '8px 18px', borderRadius: 8,
                                                background: dirtyCount ? 'linear-gradient(135deg, rgb(var(--vq-emerald-600)), rgb(var(--vq-emerald-700)))' : vq.slate[800],
                                                border: 'none', color: dirtyCount ? '#fff' : vq.slate[600],
                                                fontSize: 13, fontWeight: 600, cursor: dirtyCount ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {syncing ? <RefreshCw size={14} className="spin" /> : <Truck size={14} />}
                                            {syncing ? 'Syncing…' : 'Sync Tracking'}
                                        </button>
                                    </div>
                                </div>

                                {pendingSales.data.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', background: vq.void[800], border: '1px solid #1e3a5f', borderRadius: 12 }}>
                                        <PackageCheck size={40} color="#1e3a5f" style={{ marginBottom: 14 }} />
                                        <h3 style={{ color: vq.slate[600], fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>All clear!</h3>
                                        <p style={{ color: vq.slate[700], fontSize: 13 }}>No pending dispatches right now. Use the POS Dropship Checkout to log new channel sales.</p>
                                    </div>
                                ) : (
                                    <div style={{ background: vq.void[800], border: '1px solid #1e3a5f', borderRadius: 12, overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ background: '#0f1f35', borderBottom: '1px solid #1e3a5f' }}>
                                                    {['Order ID', 'Channel', 'Date', 'Items', 'Revenue', 'Est. Fee', 'Type', 'Tracking Number', 'Carrier', 'Status'].map(h => (
                                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: vq.slate[500], fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingSales.data.map((sale, idx) => {
                                                    const platform = PLATFORMS[sale.ecommerce_channel?.platform] ?? PLATFORMS.amazon;
                                                    const ft       = FULFILLMENT_LABELS[sale.fulfillment_type] ?? FULFILLMENT_LABELS.fbm;
                                                    const edit     = trackingEdits[sale.id] ?? {};
                                                    return (
                                                        <tr key={sale.id} style={{ borderBottom: '1px solid #162032', transition: 'background 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = vq.gray[900]}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: vq.blue[400], fontSize: 12 }}>
                                                                {sale.channel_order_id ?? `#${sale.id.substring(0, 8)}`}
                                                            </td>
                                                            <td style={{ padding: '10px 14px' }}>
                                                                <span style={{ 
                                                                    display: 'inline-flex', 
                                                                    alignItems: 'center', 
                                                                    gap: 6, 
                                                                    padding: '3px 8px', 
                                                                    borderRadius: 6, 
                                                                    background: platform.bg, 
                                                                    border: `1px solid ${platform.border}`, 
                                                                    color: platform.color, 
                                                                    fontSize: 11, 
                                                                    fontWeight: 600 
                                                                }}>
                                                                    {sale.ecommerce_channel?.platform === 'amazon' && <AmazonLogo size={14} />}
                                                                    {sale.ecommerce_channel?.platform === 'woocommerce' && <WooLogo size={14} />}
                                                                    {sale.ecommerce_channel?.platform === 'tiktok' && <TikTokLogo size={14} />}
                                                                    {sale.ecommerce_channel?.platform === 'ebay' && <EbayLogo size={14} />}
                                                                    {platform.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '10px 14px', color: vq.slate[400], fontSize: 12 }}>
                                                                {new Date(sale.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                            </td>
                                                            <td style={{ padding: '10px 14px', color: vq.slate[200] }}>
                                                                {sale.items?.length ?? 0} item{(sale.items?.length ?? 0) !== 1 ? 's' : ''}
                                                            </td>
                                                            <td style={{ padding: '10px 14px', color: vq.emerald[400], fontWeight: 600 }}>
                                                                £{parseFloat(sale.total ?? 0).toFixed(2)}
                                                            </td>
                                                            <td style={{ padding: '10px 14px', color: vq.red[400], fontSize: 12 }}>
                                                                {sale.gross_platform_fee ? `£${parseFloat(sale.gross_platform_fee).toFixed(2)}` : '—'}
                                                                {!sale.financial_reconciled && <span style={{ marginLeft: 4, fontSize: 10, color: vq.amber[500] }} title="Estimated">~Est.</span>}
                                                            </td>
                                                            <td style={{ padding: '10px 14px' }}>
                                                                <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11, border: '1px solid', ...Object.fromEntries(Object.entries(ft.badge.split(' ').reduce((a, c) => { a[c] = true; return a; }, {})).map(([k]) => [k, true])) }} className={ft.badge}>
                                                                    {ft.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '8px 14px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={edit.tracking_number ?? sale.tracking_number ?? ''}
                                                                    onChange={e => setTracking(sale.id, 'tracking_number', e.target.value)}
                                                                    placeholder="Paste tracking…"
                                                                    style={{ background: vq.void[800], border: '1px solid #1e3a5f', borderRadius: 6, padding: '5px 10px', color: vq.slate[200], fontSize: 12, width: 170 }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '8px 14px' }}>
                                                                <select
                                                                    value={edit.shipping_carrier ?? sale.shipping_carrier ?? ''}
                                                                    onChange={e => setTracking(sale.id, 'shipping_carrier', e.target.value)}
                                                                    style={{ background: vq.void[800], border: '1px solid #1e3a5f', borderRadius: 6, padding: '5px 8px', color: vq.slate[200], fontSize: 12 }}
                                                                >
                                                                    <option value="">Carrier…</option>
                                                                    {CARRIER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            </td>
                                                            <td style={{ padding: '10px 14px' }}>
                                                                <DispatchBadge status={sale.dispatch_status} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                        )}
                    </section>
                </>
            )}
        </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`}</style>
        </OneGlanceLayout>
    );
}

function DispatchBadge({ status }) {
    const map = {
        pending:    { bg: '#1c1400', border: vq.amber[900], color: vq.amber[400], label: 'Pending' },
        dispatched: { bg: vq.green[950], border: vq.green[800], color: vq.green[400], label: 'Dispatched' },
        cancelled:  { bg: '#2d0000', border: vq.red[900], color: vq.red[400], label: 'Cancelled' },
    };
    const s = map[status] ?? map.pending;
    return <span style={{ padding: '3px 9px', borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontWeight: 600 }}>{s.label}</span>;
}
