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
    Eye
} from 'lucide-react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

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
            if (err.response && err.response.status === 403) {
                // User simply doesn't have permission for reports/growth engine
                // We'll set a flag to hide the widget silently
                setData({ forbidden: true });
                return;
            }
            setError('Failed to load opportunities');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 5 minutes
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-red-200 dark:border-red-800 shadow-sm text-center text-red-500">
                {error}
                <button onClick={fetchData} className="ml-2 text-indigo-500 hover:underline">Retry</button>
            </div>
        );
    }

    const stats = data?.stats || {};
    const recommendations = data?.recommendations || [];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-blue-500';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'retention': return <Users className="text-emerald-500" size={18} />;
            case 'forecast': return <Package className="text-orange-500" size={18} />;
            case 'churn': return <AlertTriangle className="text-red-500" size={18} />;
            case 'recovery': return <Wallet className="text-amber-500" size={18} />;
            default: return <TrendingUp className="text-indigo-500" size={18} />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'retention': return 'Sales Opportunity';
            case 'forecast': return 'Stock Risk';
            case 'churn': return 'Churn Risk';
            case 'recovery': return 'Recovery';
            default: return 'Tip';
        }
    };

    if (data?.forbidden) {
        return null;
    }

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-white/5 dark:to-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Today's Opportunities</h3>
                        <p className="text-xs text-slate-500">AI-powered insights to grow your business</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {window.amdSettings?.currency_symbol || ''} {(stats.potential_revenue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">Potential Revenue</p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-500 transition-all"
                        disabled={loading}
                        title="Run AI Analysis"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="p-6 grid grid-cols-4 gap-4 border-b border-slate-100 dark:border-white/5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.customers_due || 0}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Customers Due</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.stock_risks || 0}</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Stock Risks</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.churn_risks || 0}</p>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">At Risk</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.overdue_invoices || 0}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Overdue</p>
                </div>
            </div>

            {/* Recommendations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {recommendations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No opportunities right now!</p>
                        <p className="text-sm">Check back later or run the AI analysis.</p>
                    </div>
                ) : (
                    recommendations.slice(0, 10).map((rec) => (
                        <div
                            key={rec.id}
                            className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                {/* Priority Dot */}
                                <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(rec.priority)}`}></div>

                                {/* Icon */}
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                    {getTypeIcon(rec.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {getTypeLabel(rec.type)}
                                        </span>
                                        {rec.priority === 'urgent' && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                                                URGENT
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{rec.title}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rec.message}</p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {rec.action_type === 'whatsapp' && rec.party && (
                                            <button
                                                onClick={() => openWhatsApp(rec.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                <MessageCircle size={12} />
                                                WhatsApp
                                            </button>
                                        )}
                                        {rec.action_url && (
                                            <a
                                                href={rec.action_url}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${rec.action_type === 'purchase_order' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                                            >
                                                {rec.action_type === 'purchase_order' ? <Package size={12} /> : <Eye size={12} />}
                                                {rec.action_type === 'purchase_order' ? 'Order Stock' : 'View'}
                                            </a>
                                        )}
                                        <button
                                            onClick={() => dismissTip(rec.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors"
                                        >
                                            <X size={12} />
                                            Dismiss
                                        </button>
                                    </div>
                                </div>

                                {/* Revenue Potential */}
                                {rec.potential_revenue > 0 && (
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                            {window.amdSettings?.currency_symbol || ''} {Number(rec.potential_revenue).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-400">Potential</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {recommendations.length > 10 && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                    <a
                        href={route('store.growth-engine.index', { store_slug: store.slug })}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-1"
                    >
                        View All {recommendations.length} Opportunities
                        <ChevronRight size={16} />
                    </a>
                </div>
            )}
        </div>
    );
};

export default TodaysOpportunities;
