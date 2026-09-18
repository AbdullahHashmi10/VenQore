import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Monitor, Smartphone, Download, CheckCircle2, ArrowRight,
    Shield, Cpu, Zap, Printer, Usb, Bell, Sparkles, ExternalLink,
    Clock, RefreshCw, Key, HardDrive, HelpCircle, Layers, Check
} from 'lucide-react';

export default function AppsIndex({ tenant, apps }) {
    const { store } = usePage().props;
    const storeSlug = tenant?.slug || store?.slug || 'my-store';

    const windowsApp = apps?.windows || {
        name: 'VenQore Station for Windows',
        version: '1.4.2',
        release_date: '2026-09-01',
        installer_url: '/downloads/VenQore_Station_Setup.exe',
        file_size: '84.6 MB',
        min_os: 'Windows 10 / 11 (64-bit)',
    };

    const mobileApp = apps?.mobile || {
        name: 'VenQore Mobile Companion',
        status: 'coming_soon',
        target_date: 'Q4 2026',
    };

    // Mobile notification subscription state
    const [notifyEmail, setNotifyEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleNotifySubmit = (e) => {
        e.preventDefault();
        if (!notifyEmail || !notifyEmail.includes('@')) return;
        setSubscribed(true);
        window.dispatchEvent(new CustomEvent('amd:toast', {
            detail: {
                message: "You're on the early access list! We'll notify you as soon as VenQore Mobile launches.",
                type: 'success'
            }
        }));
    };

    const [copiedSlug, setCopiedSlug] = useState(false);
    const copySlug = () => {
        navigator.clipboard.writeText(storeSlug);
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
        window.dispatchEvent(new CustomEvent('amd:toast', {
            detail: { message: `Store slug "${storeSlug}" copied to clipboard`, type: 'info' }
        }));
    };

    return (
        <>
            <Head title="Native Applications & Hardware Bridge — VenQore" />

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

                {/* ── Page Header ───────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-widest bg-[#0BAA8F]/15 text-[#0BAA8F] border border-[#0BAA8F]/30">
                                Native Ecosystem
                            </span>
                            <span className="text-2xs text-neutral-400 font-medium">Desktop &amp; Mobile Clients</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span>VenQore Everywhere</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                            Run high-speed hardware till registers on Windows, or manage your stock anywhere with the upcoming mobile companion.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.billing', { store_slug: storeSlug })}
                            className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Billing &amp; Plans
                        </Link>
                        <Link
                            href={route('store.dashboard', { store_slug: storeSlug })}
                            className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                {/* ── Two Main Cards: Windows (Live) & Mobile (Coming Soon) ────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ── Card 1: VenQore Station for Windows (LIVE) ─────────────── */}
                    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        {/* Ambient glow accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0BAA8F]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 flex items-center justify-center text-[#0BAA8F] shrink-0 shadow-inner">
                                        <Monitor size={30} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold text-white tracking-tight">VenQore Station</h2>
                                            <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                Official Build
                                            </span>
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-0.5">
                                            For Windows 10 / 11 (64-bit) · v{windowsApp.version}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
                                The official native desktop application for checkout terminals. It serves as an ultra-fast local hardware bridge that bypasses browser sandboxing to control thermal receipt printers, automatic cash drawer kicks, barcode scanners, and weighing scales.
                            </p>

                            {/* Features list */}
                            <div className="space-y-3 mb-8">
                                {[
                                    { title: 'Direct Raw ESC/POS Printing', desc: 'Instant thermal receipt output on Epson, Star, & Xprinter without browser print prompts.' },
                                    { title: 'Cash Drawer Kick Pulse', desc: 'Sends raw RJ11 impulse to drawer solenoid on cash invoice finalization.' },
                                    { title: 'Serial COM Port Bridge', desc: 'Live continuous polling for digital scales and RS-232 barcode scanners.' },
                                    { title: 'Cashier Kiosk & Focus Tracking', desc: 'Prevents untracked cashier multitasking and records register lock events.' },
                                    { title: 'Silent Background Auto-Updates', desc: 'Keeps till terminals secure and aligned with the latest VenQore POS releases.' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-xs">
                                        <CheckCircle2 size={16} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-white">{item.title}</span>
                                            <span className="text-neutral-400 block text-2xs mt-0.5">{item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Download CTA & Meta */}
                        <div className="relative z-10 pt-6 border-t border-white/[0.06]">
                            <a
                                href={windowsApp.installer_url}
                                download
                                className="w-full py-4 px-6 rounded-xl bg-[#0BAA8F] hover:bg-[#0BAA8F]/90 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[#0BAA8F]/25 active:scale-98"
                            >
                                <Download size={16} />
                                <span>Download Station Setup (.exe)</span>
                            </a>
                            <div className="flex items-center justify-between text-3xs text-neutral-400 mt-3 px-1">
                                <span>Installer size: ~{windowsApp.file_size}</span>
                                <span>Requirements: {windowsApp.min_os}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Card 2: VenQore Mobile (COMING SOON) ───────────────────── */}
                    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        {/* Ambient glow accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                                        <Smartphone size={30} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold text-white tracking-tight">VenQore Mobile</h2>
                                            <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                                                Coming Soon
                                            </span>
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-0.5">
                                            Android (Google Play) &amp; iOS (App Store)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
                                Take VenQore with you onto the sales floor or warehouse aisles. VenQore Mobile is our dedicated companion app built for rapid barcode auditing, queue-busting mobile checkout, and real-time manager alerts.
                            </p>

                            {/* Features list */}
                            <div className="space-y-3 mb-8">
                                {[
                                    { title: 'Camera Barcode Stock Auditing', desc: 'Scan product barcodes with your smartphone camera to verify shelf quantities and price tags.' },
                                    { title: 'Queue-Busting Mobile POS', desc: 'Ring up customers directly in line and print via Bluetooth ESC/POS or send WhatsApp receipts.' },
                                    { title: 'Floor Stock Take & Transfers', desc: 'Conduct fast cycle counts without carrying laptops or clipboards around warehouse racks.' },
                                    { title: 'Owner Daily Pulse & Live Alerts', desc: 'Receive instant push notifications for sales milestones, cash register drops, and low stock.' },
                                    { title: 'Offline Order Queuing', desc: 'Continue logging sales even when walking through poor connectivity warehouse zones.' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-xs">
                                        <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-white">{item.title}</span>
                                            <span className="text-neutral-400 block text-2xs mt-0.5">{item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Early Access Notification Signup */}
                        <div className="relative z-10 pt-6 border-t border-white/[0.06]">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                                    <Bell size={14} className="text-amber-400" />
                                    <span>Get Notified on Launch</span>
                                </div>
                                <p className="text-2xs text-neutral-400 mb-3">
                                    Join the early access beta testing pool to get mobile app builds first.
                                </p>

                                {subscribed ? (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                        <Check size={16} />
                                        <span>You're on the early access list! We'll notify you on release.</span>
                                    </div>
                                ) : (
                                    <form onSubmit={handleNotifySubmit} className="flex gap-2">
                                        <input
                                            type="email"
                                            value={notifyEmail}
                                            onChange={(e) => setNotifyEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            required
                                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/[0.1] text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400 transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shrink-0"
                                        >
                                            Notify Me
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-3xs text-neutral-400 mt-3 px-1">
                                <span>Platform availability: Android 10+ &amp; iOS 16+</span>
                                <span>Target Beta: {mobileApp.target_date}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 4-Step Quick Pairing & Setup Guide ───────────────────────── */}
                <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950/60 border border-white/[0.06]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="text-2xs font-bold text-[#0BAA8F] uppercase tracking-widest mb-1">
                                Setup Instructions
                            </div>
                            <h3 className="text-base font-bold text-white">
                                How to Pair VenQore Station with Your Store
                            </h3>
                        </div>

                        {/* Store Slug Chip with Quick Copy */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                            <span className="text-2xs text-neutral-400">Your Store Slug:</span>
                            <code className="text-xs font-mono font-bold text-[#0BAA8F]">{storeSlug}</code>
                            <button
                                onClick={copySlug}
                                className="text-3xs font-bold text-white hover:text-[#0BAA8F] underline ml-1"
                            >
                                {copiedSlug ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                step: '1',
                                title: 'Install & Launch',
                                desc: 'Download the Windows setup installer above, run it on your register PC, and start VenQore Station.'
                            },
                            {
                                step: '2',
                                title: 'Enter Store Slug',
                                desc: `On the initial welcome screen, type your store slug "${storeSlug}" and click Connect Store.`
                            },
                            {
                                step: '3',
                                title: 'Staff PIN Authorization',
                                desc: 'Authorize the terminal by entering your manager or cashier PIN to bind this hardware device.'
                            },
                            {
                                step: '4',
                                title: 'Configure Peripherals',
                                desc: 'Click Hardware Settings (Gear icon) to set your receipt printer (58mm/80mm), COM scale, and cash drawer.'
                            },
                        ].map((guide) => (
                            <div key={guide.step} className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.05] flex flex-col justify-between">
                                <div>
                                    <div className="w-7 h-7 rounded-lg bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 flex items-center justify-center text-[#0BAA8F] font-bold text-xs mb-3">
                                        {guide.step}
                                    </div>
                                    <h4 className="text-xs font-bold text-white mb-1.5">{guide.title}</h4>
                                    <p className="text-2xs text-neutral-400 leading-relaxed">{guide.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Hardware Compatibility Reference ────────────────────────── */}
                <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Printer size={16} className="text-[#0BAA8F]" />
                        <span>Certified Hardware Compatibility</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-400">
                        <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                            <div className="font-bold text-neutral-200 mb-1">Thermal Receipt Printers</div>
                            <p className="text-2xs leading-relaxed">Epson TM-T88/T20, Star Micronics TSP100/650, Xprinter, Rongta, Sunmi desktop USB/LAN.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                            <div className="font-bold text-neutral-200 mb-1">Barcode Scanners</div>
                            <p className="text-2xs leading-relaxed">Zebra, Honeywell Voyager, Datalogic, Generic USB HID &amp; RS-232 serial scanners (1D &amp; 2D QR).</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                            <div className="font-bold text-neutral-200 mb-1">Electronic Weigh Scales</div>
                            <p className="text-2xs leading-relaxed">CAS PD-II, Mettler Toledo Ariva, Torrey, Avery Berkel via RS-232 COM port protocol.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                            <div className="font-bold text-neutral-200 mb-1">Cash Drawers</div>
                            <p className="text-2xs leading-relaxed">Standard 12V/24V heavy-duty cash drawers connected via RJ11 cable to receipt printer.</p>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

AppsIndex.layout = (page) => <OneGlanceLayout title="Native Applications" activeMenu="Apps">{page}</OneGlanceLayout>;
