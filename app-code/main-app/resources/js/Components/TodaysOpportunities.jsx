import React, { useState, useEffect } from 'react';
import {
 TrendingUp,
 AlertTriangle,
 Wallet,
 Users,
 Package,
 RefreshCw,
 ChevronRight,
 MessageCircle,
 X,
 Eye,
 Sparkles,
 ArrowUpRight,
 CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { usePage, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

const TodaysOpportunities = ({ className = '' }) => {
 const { store } = usePage().props;
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 const fetchData = async (refresh = false) => {
 setLoading(true);
 if (!route().has('store.growth-engine.dashboard')) {
 setLoading(false);
 return;
 }
 try {
 if (refresh) {
 await axios.post(route('store.growth-engine.refresh', { store_slug: store.slug }));
 }
 const response = await axios.get(route('store.growth-engine.dashboard', { store_slug: store.slug }));
 setData(response.data);
 setError(null);
 } catch (err) {
 if (err.response && (err.response.status === 403 || err.response.status === 401)) {
 setData(null);
 setError(null);
 setLoading(false);
 return;
 }
 setError('Failed to load opportunities.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 const interval = setInterval(fetchData, 5 * 60 * 1000);
 return () => clearInterval(interval);
 }, []);

 const dismissTip = async (id) => {
 try {
 await axios.post(route('store.growth-engine.dismiss', [store.slug, id]));
 fetchData();
 } catch (err) {
 console.error(err);
 }
 };

 const openWhatsApp = async (id) => {
 try {
 const response = await axios.get(route('store.growth-engine.whatsapp', [store.slug, id]));
 if (response.data.url) {
 window.open(response.data.url, '_blank');
 }
 } catch (err) {
 console.error(err);
 }
 };

 if (loading && !data) {
 return (
 <div className={`bg-surface rounded-lg p-5 border border-line shadow-sm flex flex-col justify-center min-h-[300px] ${className}`}>
 <div className="animate-pulse space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-sunken rounded-xl" />
 <div className="space-y-1.5 flex-1">
 <div className="h-4 bg-sunken rounded w-1/3" />
 <div className="h-3 bg-sunken rounded w-1/2" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2 pt-2">
 <div className="h-16 bg-sunken rounded-xl" />
 <div className="h-16 bg-sunken rounded-xl" />
 </div>
 <div className="h-24 bg-sunken rounded-xl" />
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className={`bg-surface rounded-lg p-6 border border-rose-100 dark:border-rose-900/30 shadow-xs text-center ${className}`}>
 <AlertTriangle size={24} className="mx-auto text-rose-500 mb-2" />
 <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-3">{error}</p>
 <button
 onClick={() => fetchData(true)}
 className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
 >
 Retry
 </button>
 </div>
 );
 }

 if (data?.forbidden || !data) {
 return null;
 }

 const stats = data?.stats || {};
 const recommendations = data?.recommendations || [];

 const getTypeIcon = (type) => {
 switch (type) {
 case 'retention': return <Users className="text-emerald-500" size={15} />;
 case 'forecast': return <Package className="text-amber-500" size={15} />;
 case 'churn': return <AlertTriangle className="text-rose-500" size={15} />;
 case 'recovery': return <Wallet className="text-blue-500" size={15} />;
 default: return <Sparkles className="text-brand-500" size={15} />;
 }
 };

 const getTypeBadgeClass = (type) => {
 switch (type) {
 case 'retention': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20';
 case 'forecast': return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20';
 case 'churn': return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20';
 case 'recovery': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
 default: return 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border-brand-200/50 dark:border-brand-500/20';
 }
 };

 const getTypeLabel = (type) => {
 switch (type) {
 case 'retention': return 'Sales Growth';
 case 'forecast': return 'Stock Alert';
 case 'churn': return 'Customer Risk';
 case 'recovery': return 'Cash Recovery';
 default: return 'Action Tip';
 }
 };

 return (
 <div className={`bg-surface rounded-lg border border-line shadow-sm overflow-hidden flex flex-col h-full ${className}`}>
 {/* Header */}
 <div className="p-4 sm:p-5 border-b border-line bg-sunken">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-xs shrink-0">
 <Sparkles size={17} />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-1.5">
 <h3 className="font-bold text-ink text-sm tracking-tight truncate">Today's Opportunities</h3>
 <span className="flex h-2 w-2 relative shrink-0">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </span>
 </div>
 <p className="text-3xs text-ink-muted font-medium truncate">AI-powered actions to grow revenue</p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {data.total_potential_revenue > 0 && (
 <div className="text-right hidden sm:block">
 <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
 +{formatCurrency(data.total_potential_revenue || 0, store)}
 </p>
 <p className="text-3xs font-semibold text-ink-muted uppercase tracking-wider">Potential</p>
 </div>
 )}
 <button
 onClick={() => fetchData(true)}
 className="p-1.5 rounded-lg text-ink-muted hover:text-brand-600 hover:bg-white dark:hover:bg-surface transition-colors border border-transparent hover:border-line-strong"
 disabled={loading}
 title="Run AI Analysis"
 >
 <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
 </button>
 </div>
 </div>

 {/* 4 Summary Mini-Pills (2x2 Grid) */}
 <div className="grid grid-cols-2 gap-2 mt-3.5">
 <div className="bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between">
 <div className="min-w-0 pr-1">
 <p className="text-3xs font-bold uppercase tracking-wider text-ink-muted truncate">Customers Due</p>
 <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.customers_due || 0}</p>
 </div>
 <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
 <Users size={12} />
 </div>
 </div>

 <div className="bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between">
 <div className="min-w-0 pr-1">
 <p className="text-3xs font-bold uppercase tracking-wider text-ink-muted truncate">Stock Risks</p>
 <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.stock_risks || 0}</p>
 </div>
 <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
 <Package size={12} />
 </div>
 </div>

 <div className="bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between">
 <div className="min-w-0 pr-1">
 <p className="text-3xs font-bold uppercase tracking-wider text-ink-muted truncate">At Risk</p>
 <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.churn_risks || 0}</p>
 </div>
 <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
 <AlertTriangle size={12} />
 </div>
 </div>

 <div className="bg-white/80 dark:bg-surface rounded-xl p-2.5 border border-line flex items-center justify-between">
 <div className="min-w-0 pr-1">
 <p className="text-3xs font-bold uppercase tracking-wider text-ink-muted truncate">Overdue</p>
 <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{stats.overdue_invoices || 0}</p>
 </div>
 <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
 <Wallet size={12} />
 </div>
 </div>
 </div>
 </div>

 {/* Recommendations List */}
 <div className="flex-1 p-3 space-y-2.5">
 {recommendations.length === 0 ? (
 <div className="py-8 px-4 text-center flex flex-col items-center justify-center h-full">
 <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-500 flex items-center justify-center mb-2.5 shadow-xs">
 <CheckCircle2 size={24} />
 </div>
 <h4 className="font-bold text-ink-secondary dark:text-ink-faint text-xs tracking-tight">All clear for today!</h4>
 <p className="text-3xs text-ink-muted mt-1 max-w-[220px] leading-relaxed">
 No critical alerts or pending customer opportunities detected.
 </p>
 <button
 onClick={() => fetchData(true)}
 className="mt-3 inline-flex items-center gap-1 text-3xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
 >
 <span>Re-run AI Analysis</span>
 <ChevronRight size={11} />
 </button>
 </div>
 ) : (
 recommendations.slice(0, 8).map((rec) => (
 <div
 key={rec.id}
 className="p-3 bg-sunken rounded-xl border border-line hover:border-brand-200 dark:hover:border-brand-900/50 hover:bg-white dark:hover:bg-surface transition-all group"
 >
 <div className="flex items-start gap-2.5">
 <div className="p-1.5 bg-surface rounded-lg shadow-2xs shrink-0 mt-0.5 border border-line">
 {getTypeIcon(rec.type)}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-1.5 mb-0.5">
 <span className={`px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider rounded-md border ${getTypeBadgeClass(rec.type)}`}>
 {getTypeLabel(rec.type)}
 </span>
 {rec.potential_revenue > 0 && (
 <span className="text-3xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
 +{formatCurrency(rec.potential_revenue || 0, store)}
 </span>
 )}
 </div>
 <p className="font-bold text-ink text-xs truncate mt-1">{rec.title}</p>
 <p className="text-3xs text-ink-muted mt-0.5 line-clamp-2 leading-relaxed">{rec.message}</p>

 {/* Action buttons */}
 <div className="flex items-center gap-1.5 mt-2.5">
 {rec.action_type === 'whatsapp' && rec.party && (
 <button
 onClick={() => openWhatsApp(rec.id)}
 className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-3xs font-bold rounded-lg transition-colors shadow-2xs"
 >
 <MessageCircle size={10} />
 <span>WhatsApp</span>
 </button>
 )}
 {rec.action_url && (
 <a
 href={rec.action_url}
 className={`flex items-center gap-1 px-2.5 py-1 text-white text-3xs font-bold rounded-lg transition-colors shadow-2xs ${rec.action_type === 'purchase_order' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-brand-600 hover:bg-brand-700'}`}
 >
 {rec.action_type === 'purchase_order' ? <Package size={10} /> : <Eye size={10} />}
 <span>{rec.action_type === 'purchase_order' ? 'Order Stock' : 'View Details'}</span>
 </a>
 )}
 <button
 onClick={() => dismissTip(rec.id)}
 className="flex items-center gap-1 px-2 py-1 bg-surface hover:bg-interactive-hover text-ink-muted hover:text-ink text-3xs font-bold rounded-lg transition-colors border border-line ml-auto"
 title="Dismiss"
 >
 <X size={10} />
 <span>Dismiss</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Footer */}
 <div className="p-3 border-t border-line bg-sunken dark:bg-surface text-center shrink-0">
 <Link
 href={route('store.growth-engine.dashboard', { store_slug: store.slug })}
 className="text-3xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center justify-center gap-1 hover:underline"
 >
 <span>Open Full Growth Engine</span>
 <ArrowUpRight size={12} />
 </Link>
 </div>
 </div>
 );
};

export default TodaysOpportunities;

