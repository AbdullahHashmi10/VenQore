import React, { useState } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head } from '@inertiajs/react';
import { Sparkles, TrendingUp, AlertTriangle, RefreshCcw, ArrowRight, Filter, CheckCircle, Search, Info } from 'lucide-react';
import OpportunityIntelligencePanel from '@/Components/OpportunityIntelligencePanel';

export default function GrowthEngineIndex({ recommendations, stats, filters }) {
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedRec, setSelectedRec] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const handleOpenPanel = (rec) => {
        setSelectedRec(rec);
        setIsPanelOpen(true);
    };

    // Simulate recommendations if empty (for demo/development)
    const hasData = recommendations?.data?.length > 0;
    const displayRecommendations = hasData ? recommendations.data : [
        {
            id: 1,
            type: 'retention',
            priority: 'urgent',
            title: 'Customer Recovery Alert',
            message: 'Bilal General Store has missed their usual weekly order. They are 3 days overdue.',
            action: 'Generate WhatsApp Reminder',
            party_name: 'Bilal General Store',
            created_at: '2 hours ago'
        },
        {
            id: 2,
            type: 'forecast',
            priority: 'high',
            title: 'Stockout Risk Prediction',
            message: 'Based on current sales velocity, "Sugar (50kg)" will run out in 3 days. 5 regular customers are due to order this week.',
            action: 'Draft Purchase Order',
            party_name: null,
            created_at: '5 hours ago'
        },
        {
            id: 3,
            type: 'churn',
            priority: 'medium',
            title: 'Churn Probability Rising',
            message: 'Customer "Ali Traders" has reduced order frequency by 40% this month.',
            action: 'View Customer Profile',
            party_name: 'Ali Traders',
            created_at: '1 day ago'
        }
    ];

    const getIcon = (type) => {
        switch (type) {
            case 'retention': return <RefreshCcw className="text-blue-500" />;
            case 'forecast': return <TrendingUp className="text-emerald-500" />;
            case 'churn': return <AlertTriangle className="text-orange-500" />;
            default: return <Sparkles className="text-indigo-500" />;
        }
    };

    const getBadgeColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <OneGlanceLayout title="Growth Engine" activeMenu="Growth Engine">
            <Head title="Growth Engine" />

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white shadow-xl mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                <Sparkles size={24} className="text-yellow-300" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Growth Engine</h1>
                        </div>
                        <p className="text-indigo-100 text-lg max-w-2xl">
                            AI-powered actionable intelligence to grow your revenue, recover customers, and optimize stock.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <p className="text-sm text-indigo-200 uppercase tracking-widest font-bold">Potential Revenue</p>
                            <p className="text-2xl font-bold mt-1">{getCurrencySymbol()} {hasData ? (stats?.potential_revenue || 0).toLocaleString() : '45,000'}</p>
                        </div>
                        <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <p className="text-sm text-indigo-200 uppercase tracking-widest font-bold">Actions Pending</p>
                            <p className="text-2xl font-bold mt-1">{hasData ? stats?.total_count || 0 : displayRecommendations.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
                {['all', 'retention', 'forecast', 'churn', 'recovery'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all
                            ${activeFilter === filter
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}
                        `}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRecommendations.map((rec) => (
                    <div 
                        key={rec.id} 
                        onClick={() => handleOpenPanel(rec)}
                        className="group bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 relative cursor-pointer overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[10px] uppercase font-bold tracking-wider border-b border-l ${getBadgeColor(rec.priority)}`}>
                            {rec.priority}
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                {getIcon(rec.type)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-1">{rec.title}</h3>
                                <p className="text-xs text-slate-400 font-medium">{rec.created_at}</p>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                            {rec.message}
                        </p>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
                            <button className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
                                {rec.action}
                                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {displayRecommendations.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">All Clear!</h3>
                    <p className="text-slate-500 mt-2">No pending recommendations at this time.</p>
                </div>
            )}

            <OpportunityIntelligencePanel 
                isOpen={isPanelOpen} 
                onClose={() => setIsPanelOpen(false)} 
                recommendation={selectedRec} 
            />
        </OneGlanceLayout>
    );
}
