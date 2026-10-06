import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { ChefHat, Bell, Clock, Maximize2, Minimize2, Volume2, VolumeX, Sparkles, ArrowLeft } from 'lucide-react';
import RestaurantFeatureGate from '@/Components/Restaurant/RestaurantFeatureGate';

const POLL_INTERVAL_MS = 5000;

export default function CustomerQueue({ storeSlug, businessName = 'Restaurant', orders: initialOrders = [], preparesOrdersEnabled = true }) {
    const [isPrepActive, setIsPrepActive] = useState(preparesOrdersEnabled);
    const [orders, setOrders] = useState(initialOrders);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [newlyReadyId, setNewlyReadyId] = useState(null);
    const prevReadyIdsRef = useRef(new Set(initialOrders.filter(o => o.status === 'ready').map(o => o.id)));

    // Update live clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Pleasant "Ding-Dong" ready chime using Web Audio API
    const playReadyChime = useCallback(() => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            
            // First note (E5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
            gain1.gain.setValueAtTime(0.3, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.6);

            // Second note (C5)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.2);
            gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.2);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.2);
            osc2.stop(ctx.currentTime + 1.0);
        } catch (_) {}
    }, []);

    // Polling queue state
    const fetchQueue = useCallback(async () => {
        try {
            const res = await axios.get(route('store.restaurant.queue.state', { store_slug: storeSlug }));
            if (Array.isArray(res.data?.orders)) {
                const freshOrders = res.data.orders;
                setOrders(freshOrders);

                // Detect newly ready orders to trigger chime
                const currentReady = freshOrders.filter(o => o.status === 'ready');
                const newArrival = currentReady.find(o => !prevReadyIdsRef.current.has(o.id));
                if (newArrival) {
                    setNewlyReadyId(newArrival.id);
                    if (soundEnabled) {
                        playReadyChime();
                    }
                    setTimeout(() => setNewlyReadyId(null), 8000);
                }
                prevReadyIdsRef.current = new Set(currentReady.map(o => o.id));
            }
        } catch (_) {}
    }, [storeSlug, soundEnabled, playReadyChime]);

    useEffect(() => {
        const interval = setInterval(fetchQueue, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    // Filter orders for the two display boards
    const preparingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    if (!isPrepActive) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col justify-between p-6">
                <Head title="Order TV Screen — Disabled" />
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.restaurant.settings', { store_slug: storeSlug })}
                            onClick={(e) => {
                                if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
                                    e.preventDefault();
                                    window.history.back();
                                }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
                            title="Go back to previous page or Restaurant Settings"
                        >
                            <ArrowLeft size={14} aria-hidden="true" />
                            <span>Back</span>
                        </Link>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <ChefHat size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Order TV Screen</h1>
                            <p className="text-xs text-neutral-400">Customer Pickup & Order Queue Board</p>
                        </div>
                    </div>
                </div>
                <RestaurantFeatureGate
                    storeSlug={storeSlug}
                    title="Order TV Screen Is Currently Disabled"
                    description="Turn this setting on to activate the live order status queue and show preparing/ready pickup numbers to customers."
                    settingKey="prepares_orders"
                    turnOnLabel="Turn this setting on"
                    isEnabled={isPrepActive}
                    icon={ChefHat}
                    onToggled={(val) => setIsPrepActive(val)}
                    mode="full"
                    badgeText="Customer TV Display"
                />
                <div />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col select-none overflow-x-hidden">
            <Head title={`Order Status — ${businessName}`} />

            {/* Top Display Bar */}
            <header className="px-6 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('store.restaurant.settings', { store_slug: storeSlug })}
                        onClick={(e) => {
                            if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
                                e.preventDefault();
                                window.history.back();
                            }
                        }}
                        className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
                        title="Go back to previous page or Restaurant Settings"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span>Back</span>
                    </Link>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white flex items-center gap-2">
                            {businessName}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                Live
                            </span>
                        </h1>
                        <p className="text-xs text-neutral-400">Customer Order Pickup Board</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Clock */}
                    <div className="flex items-center gap-2 text-neutral-300 font-mono text-lg sm:text-xl font-bold bg-neutral-800/80 px-4 py-1.5 rounded-xl border border-neutral-700/60 shadow-inner">
                        <Clock size={18} className="text-neutral-400" />
                        <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    {/* Sound Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            setSoundEnabled(!soundEnabled);
                            if (!soundEnabled) playReadyChime();
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            soundEnabled
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                        title={soundEnabled ? 'Chime sound is enabled' : 'Click to enable ready chime sound'}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>

                    {/* Fullscreen Button */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
                        title="Toggle TV Fullscreen (F11)"
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </header>

            {/* Split Screen Queue Board */}
            <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6">
                {/* ── LEFT: PREPARING ────────────────────────────────────────── */}
                <section className="bg-neutral-900/90 rounded-2xl border border-neutral-800 flex flex-col overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-400">
                                Preparing
                            </h2>
                        </div>
                        <span className="text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 font-mono">
                            {preparingOrders.length} in progress
                        </span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {preparingOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-16">
                                <Sparkles size={48} className="mb-3 opacity-40" />
                                <p className="text-lg font-bold">All current orders are ready!</p>
                                <p className="text-sm">New orders will appear here as they are fired.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {preparingOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className="bg-neutral-800/80 hover:bg-neutral-800 border-2 border-neutral-700/80 rounded-2xl p-5 text-center flex flex-col justify-center items-center transition-all shadow-md group"
                                    >
                                        <span className="text-xs uppercase font-bold tracking-widest text-neutral-400 mb-1">
                                            {order.order_type === 'takeaway' ? 'Takeaway' : (order.order_type === 'delivery' ? 'Delivery' : 'Dine-In')}
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight leading-none">
                                            {order.order_number}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── RIGHT: READY FOR PICKUP ───────────────────────────────── */}
                <section className="bg-neutral-900/90 rounded-2xl border-2 border-emerald-500/30 flex flex-col overflow-hidden shadow-2xl relative">
                    <div className="px-6 py-4 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                <Bell size={22} className="animate-bounce" />
                                Ready for Pickup
                            </h2>
                        </div>
                        <span className="text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
                            {readyOrders.length} ready
                        </span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {readyOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-16">
                                <Bell size={48} className="mb-3 opacity-30" />
                                <p className="text-lg font-bold">No orders currently ready</p>
                                <p className="text-sm">Orders move here once the kitchen marks them ready.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {readyOrders.map(order => {
                                    const isJustReady = newlyReadyId === order.id;
                                    return (
                                        <div
                                            key={order.id}
                                            className={`rounded-2xl p-5 text-center flex flex-col justify-center items-center transition-all shadow-lg ${
                                                isJustReady
                                                    ? 'bg-emerald-500/30 border-4 border-emerald-400 ring-4 ring-emerald-500/50 animate-pulse scale-105'
                                                    : 'bg-emerald-950/40 border-2 border-emerald-500/60 hover:border-emerald-400'
                                            }`}
                                        >
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 mb-1">
                                                Collect at counter
                                            </span>
                                            <div className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono tracking-tight leading-none">
                                                {order.order_number}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Bottom Footer Notice */}
            <footer className="px-6 py-3 bg-neutral-900/60 border-t border-neutral-800 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <span>Please match the <strong>Order / Token #</strong> on your receipt with the numbers on this screen.</span>
            </footer>
        </div>
    );
}
