import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import axios from 'axios';
import {
    Download, CheckCircle, Copy, ExternalLink, ArrowRight,
    ShoppingCart, Key, Globe, Zap, ChevronRight, HelpCircle,
    Loader2, Sparkles, Server, Check, AlertCircle, RefreshCw
} from 'lucide-react';

export default function ConnectionSetup({
    connection,
    plain_token,
    setup_token,
    webhook_url,
    store_slug,
    plugin_download_url,
}) {
    const [status, setStatus] = useState(connection.status);
    const [siteUrl, setSiteUrl] = useState(connection.site_url);
    const [isPolling, setIsPolling] = useState(connection.status === 'pending');
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [checking, setChecking] = useState(false);
    const [redirectTimer, setRedirectTimer] = useState(null);

    // WordPress URL Editing & Diagnostic Handshake States
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [editingUrlVal, setEditingUrlVal] = useState(connection.site_url || '');
    const [savingUrl, setSavingUrl] = useState(false);

    const saveUrl = () => {
        if (savingUrl) return;
        let formattedUrl = editingUrlVal.trim();
        if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        setSavingUrl(true);
        axios.put(route('store.woo.connections.settings', { store_slug, connection: connection.id }), {
            site_url: formattedUrl
        })
        .then(() => {
            setSiteUrl(formattedUrl);
            setEditingUrlVal(formattedUrl);
            setIsEditingUrl(false);
        })
        .catch(err => {
            console.error('Failed to save WordPress URL', err);
            alert('Failed to update URL. Please check that it is a valid web address.');
        })
        .finally(() => {
            setSavingUrl(false);
        });
    };

    // Dynamic poll interval
    useEffect(() => {
        if (status !== 'pending') {
            setIsPolling(false);
            return;
        }

        const interval = setInterval(() => {
            axios.get(route('store.woo.connections.status-json', { store_slug, connection: connection.id }))
                .then(res => {
                    if (res.data.status === 'active') {
                        setStatus('active');
                        setSiteUrl(res.data.site_url);
                        setIsPolling(false);
                        clearInterval(interval);
                        
                        // Auto redirect after 3.5 seconds to show the gorgeous success screen
                        const timer = setTimeout(() => {
                            window.location.href = route('store.woo.connections.sync', { store_slug, connection: connection.id });
                        }, 3500);
                        setRedirectTimer(timer);
                    }
                })
                .catch(err => {
                    console.error('Handshake polling failed:', err);
                });
        }, 3000);

        return () => {
            clearInterval(interval);
            if (redirectTimer) clearTimeout(redirectTimer);
        };
    }, [status, store_slug, connection.id]);

    const checkStatusManually = () => {
        if (checking) return;
        setChecking(true);
        axios.get(route('store.woo.connections.status-json', { store_slug, connection: connection.id }))
            .then(res => {
                if (res.data.status === 'active') {
                    setStatus('active');
                    setSiteUrl(res.data.site_url);
                    setIsPolling(false);
                    
                    setTimeout(() => {
                        window.location.href = route('store.woo.connections.sync', { store_slug, connection: connection.id });
                    }, 2500);
                }
            })
            .catch(err => {
                console.error('Manual check failed:', err);
            })
            .finally(() => {
                setChecking(false);
            });
    };

    const copyToken = () => {
        navigator.clipboard.writeText(plain_token ?? '');
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const copyApiUrl = () => {
        navigator.clipboard.writeText(window.location.origin);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    return (
        <OneGlanceLayout title="WooCommerce Setup" activeMenu="Marketing">
            <Head title={`Setup WooCommerce Integration — VenQore`} />

            <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6">
                {/* Header breadcrumb */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('store.woo.connections.index', { store_slug })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm font-medium">
                            ← Back to Connections
                        </Link>
                        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-slate-500 text-sm">
                            Store: <strong className="text-slate-700 dark:text-white font-semibold">{connection.name}</strong>
                        </span>
                    </div>
                    {status === 'pending' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            Waiting for Handshake
                        </div>
                    )}
                </div>

                {status === 'pending' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Interactive Wizard Steps */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="text-violet-500 w-5 h-5 animate-pulse" />
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Zero-Configuration Setup</h2>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                    Setting up WooCommerce is now entirely automated. We've custom-baked a WordPress plugin tailored uniquely for <strong>{connection.name}</strong>. Download, activate, and your store connects securely in real-time.
                                </p>

                                {/* Step-by-Step Flow */}
                                <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800/60">
                                    
                                    {/* Step 1: Download */}
                                    <div className="relative flex gap-5 items-start group">
                                        <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/50 flex items-center justify-center font-bold text-violet-600 dark:text-violet-400 text-base z-10 shadow-sm transition-transform group-hover:scale-105">
                                            <Download className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-2.5">
                                            <div>
                                                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Download your Custom Plugin</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                                    Contains pre-configured security handshakes and credentials baked directly inside.
                                                </p>
                                            </div>
                                            <a
                                                href={plugin_download_url}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-violet-500/10 hover:shadow-violet-500/20"
                                            >
                                                <Download size={14} />
                                                Download venqore-sync.zip
                                            </a>
                                        </div>
                                    </div>

                                    {/* Step 2: Upload */}
                                    <div className="relative flex gap-5 items-start group">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-base z-10 shadow-sm transition-transform group-hover:scale-105">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Install & Activate on WordPress</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                                                Go to your WordPress Admin Dashboard, click <strong className="text-slate-700 dark:text-slate-300">Plugins → Add New → Upload Plugin</strong>, choose the downloaded ZIP, and click <strong className="text-slate-700 dark:text-slate-300">Activate</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 3: Handshake */}
                                    <div className="relative flex gap-5 items-start group">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-base z-10 shadow-sm transition-transform group-hover:scale-105">
                                            <Zap className="w-5 h-5 animate-pulse text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Watch the connection happen</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                                                Once active, the plugin securely reaches back to VenQore, generates API keys, sets up hooks, and validates the connection instantly.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Help & Troubleshooting Link */}
                            <div className="flex justify-between items-center px-2">
                                <button
                                    onClick={() => setShowManual(!showManual)}
                                    className="text-xs font-semibold text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5"
                                >
                                    <HelpCircle size={14} />
                                    {showManual ? 'Hide manual connection details' : 'Trouble connecting? Setup manually'}
                                </button>
                            </div>
                        </div>

                        {/* Connection Loader Status (Glassmorphic Card) */}
                        <div className="lg:col-span-5">
                            <div className="bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black text-white rounded-3xl p-8 text-center relative overflow-hidden border border-slate-850 dark:border-slate-900/60 shadow-xl shadow-slate-900/10 flex flex-col justify-between min-h-[480px] gap-6">
                                {/* Animated radial glow */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.12),transparent_60%)] pointer-events-none" />

                                <div className="space-y-2 mt-2 relative z-10">
                                    <div className="inline-flex px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-medium tracking-wide">
                                        AUTOMATED HANDSHAKE
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-100">Connecting to WooCommerce</h3>
                                    <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                                        Ensure your WordPress site is public and online. We are listening for the secure handshake payload.
                                    </p>
                                </div>

                                {/* Glowing Pulse Indicator */}
                                <div className="relative flex items-center justify-center my-2 h-24 z-10">
                                    <div className="absolute w-24 h-24 rounded-full border border-violet-500/20 bg-violet-500/5 animate-ping opacity-60" />
                                    <div className="absolute w-16 h-16 rounded-full border border-violet-500/30 bg-violet-500/10 animate-pulse" />
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 relative z-20">
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10 mb-2">
                                    {/* WordPress Site URL & Handshake Trigger */}
                                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-left">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WordPress Site URL</span>
                                            {!isEditingUrl && (
                                                <button
                                                    onClick={() => setIsEditingUrl(true)}
                                                    className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold"
                                                >
                                                    Edit URL
                                                </button>
                                            )}
                                        </div>

                                        {isEditingUrl ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editingUrlVal}
                                                    onChange={e => setEditingUrlVal(e.target.value)}
                                                    placeholder="https://my-wordpress-store.com"
                                                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingUrl(false);
                                                            setEditingUrlVal(siteUrl || '');
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700/30"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={saveUrl}
                                                        disabled={savingUrl}
                                                        className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-semibold disabled:opacity-50"
                                                    >
                                                        {savingUrl ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : siteUrl ? (
                                            <div className="space-y-2">
                                                <div className="text-xs font-mono text-slate-300 break-all bg-slate-950/40 p-2 rounded-lg border border-slate-850 truncate select-all" title={siteUrl}>
                                                    {siteUrl}
                                                </div>
                                                <a
                                                    href={`${siteUrl}/?venqore_debug=${setup_token}&venqore_action=force_handshake`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/10 hover:shadow-violet-500/20"
                                                >
                                                    <Zap size={12} className="animate-pulse text-amber-300 fill-amber-300" />
                                                    🚀 Launch Remote Handshake
                                                    <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-slate-400">Not provided. Add site URL to enable remote handshake execution.</p>
                                                <button
                                                    onClick={() => setIsEditingUrl(true)}
                                                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 rounded-xl text-xs font-semibold"
                                                >
                                                    + Add Website URL
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-slate-400">STATUS</div>
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-sm font-semibold tracking-wide text-amber-400">WAITING FOR CONNECTION</span>
                                        </div>
                                    </div>

                                    {/* Manual Check Button */}
                                    <button
                                        onClick={checkStatusManually}
                                        disabled={checking}
                                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900/60 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={12} className={checking ? 'animate-spin text-violet-500' : ''} />
                                        {checking ? 'Checking Status...' : 'Force Connection Check'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Beautiful Glassmorphic Success Screen */
                    <div className="max-w-3xl mx-auto py-8">
                        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl border border-emerald-100 dark:border-emerald-950/60 rounded-3xl p-8 md:p-12 text-center shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                            {/* Success background glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center mx-auto shadow-md animate-bounce">
                                    <Check className="text-emerald-500 w-10 h-10 stroke-[3px]" />
                                </div>

                                <div className="space-y-2">
                                    <div className="inline-flex px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold tracking-wide">
                                        CONNECTION SUCCESSFUL
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-white">Store Successfully Synced! 🎉</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                                        Secure handshake completed with WooCommerce at <span className="font-semibold text-slate-700 dark:text-slate-200">{siteUrl}</span>. VenQore has automatically initiated the initial product import.
                                    </p>
                                </div>

                                <div className="py-2.5 max-w-sm mx-auto bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-center gap-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                    <span className="text-xs text-slate-650 dark:text-slate-355 font-medium">Redirecting to operations control...</span>
                                </div>

                                <div className="pt-4">
                                    <Link
                                        href={route('store.woo.connections.sync', { store_slug, connection: connection.id })}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                                    >
                                        <Zap size={15} />
                                        Access Control Panel
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sliding Troubleshooting details (Manual Fallback) */}
                {showManual && (
                    <div className="border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm animate-slide-up space-y-5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Manual Setup Protocol</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                    If firewall rules or local network configurations prevent the automated handshake, you can configure the plugin manually.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* VenQore URL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">VenQore Host URL</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40">
                                    <code className="text-xs font-mono text-slate-700 dark:text-slate-300 flex-1 truncate">
                                        {window.location.origin}
                                    </code>
                                    <button
                                        onClick={copyApiUrl}
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                        title="Copy URL"
                                    >
                                        {copiedUrl ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Token */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Authentication Token</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40">
                                    <code className="text-xs font-mono text-slate-700 dark:text-slate-300 flex-1 truncate">
                                        {plain_token ?? '(token expired - recreate connection)'}
                                    </code>
                                    <button
                                        onClick={copyToken}
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                        title="Copy Token"
                                    >
                                        {copiedToken ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800/30">
                            <strong>How to use manual credentials:</strong> Open your WordPress Dashboard, navigate to <strong className="text-slate-700 dark:text-slate-300">VenQore Sync</strong>, scroll to the bottom, paste the Host URL and the Authentication Token, and click <strong className="text-slate-700 dark:text-slate-300">Save & Connect</strong>.
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
