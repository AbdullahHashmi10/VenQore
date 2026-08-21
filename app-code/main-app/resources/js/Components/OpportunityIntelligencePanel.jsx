import React from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { X, Sparkles, TrendingUp, RefreshCcw, AlertTriangle, Clock, DollarSign, Package, Calendar, History, BarChart2, MessageSquare, Info, User, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

import { vq } from '@/theme/runtime';
export default function OpportunityIntelligencePanel({ isOpen, onClose, recommendation, stats }) {
    const { store, settings } = usePage().props;
    if (!isOpen || !recommendation) return null;

    const tabs = [
        { id: 'intelligence', label: 'INTELLIGENCE', icon: Info },
        { id: 'action', label: 'ACTION', icon: MessageSquare },
        { id: 'history', label: 'HISTORY', icon: History },
        { id: 'forecast', label: 'FORECAST', icon: BarChart2 },
        { id: 'notes', label: 'NOTES', icon: Calendar }
    ];

    const [activeTab, setActiveTab] = React.useState('intelligence');
    const [note, setNote] = React.useState("");
    const [isActing, setIsActing] = React.useState(null); // 'whatsapp', 'proposal', 'task'

    const handleWhatsApp = async () => {
        setIsActing('whatsapp');
        try {
            const response = await axios.get(`/growth-engine/whatsapp/${recommendation.id}`);
            if (response.data.url) {
                window.open(response.data.url, '_blank');
            }
        } catch (error) {
            console.error("WhatsApp error:", error);
            alert("Could not generate WhatsApp link. Make sure the customer has a phone number.");
        } finally {
            setIsActing(null);
        }
    };

    const handleProposal = () => {
        setIsActing('proposal');
        setTimeout(() => {
            alert("AI Proposal Drafted successfully! A professional discount offer has been added to the customer's account notes.");
            setIsActing(null);
        }, 1500);
    };

    const handleTask = () => {
        setIsActing('task');
        setTimeout(() => {
            alert(`Follow-up scheduled for ${recommendation.party?.name}. This has been added to your Admin Task List.`);
            setIsActing(null);
        }, 1000);
    };

    // Data Mocking for Tab 1 (Intelligence) - In real app, this comes from backend analytics
    const chartData = [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 2000 },
        { name: 'Apr', value: 2780 },
        { name: 'May', value: 1890 },
        { name: 'Jun', value: 2390 },
        { name: 'Jul', value: 3490 },
    ];

    const generateNarrative = () => {
        const type = recommendation.type;
        const data = recommendation.data || {};
        const avgValue = recommendation.potential_revenue || 4500;
        const adbo = data.adbo || 8;
        const partyName = recommendation.party?.name || 'this customer';

        // Example scenario: 50k -> 40k -> 30k -> Stop
        const trend = 'declining'; // This would be calculated from real data in production

        if (type === 'churn' || type === 'retention') {
            let story = "";
            if (trend === 'declining') {
                story = `${partyName} used to be a very strong buyer, often ordering around ${getCurrencySymbol(store || settings)} 50,000. However, we noticed a worrying pattern where their orders started shrinking—first to 40,000, then 30,000, and now they haven't ordered at all for ${adbo * 2} days. This suggests they might be slowly moving their business elsewhere or are unhappy with something. You should call them to ask why their purchases dropped before they leave for good.`;
            } else if (trend === 'sudden_stop') {
                story = `${partyName} was on a great track, with purchases even increasing lately. They suddenly stopped ordering ${adbo} days ago without any warning. Because they were buying so well, this sudden silence is unusual. Total expected revenue you are missing out on right now is ${getCurrencySymbol(store || settings)} ${avgValue.toLocaleString()}.`;
            } else {
                story = `${partyName} usually buys every ${adbo} days, but they are now late. Based on their history, they should have placed an order of about ${formatCurrency(avgValue, store || settings)} by now. If they were ordering normally, your revenue would be higher. It's time to check in and see if they need a restock.`;
            }

            return (
                <div className="space-y-4">
                    <p className="text-base font-medium text-ink-secondary leading-relaxed italic">
                        "{story}"
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/20 px-4 py-2 rounded-xl border border-brand-100/50">
                        <Info size={14} />
                        Non-Technical Summary: Customer is fading away. Act now to save the relationship.
                    </div>
                </div>
            );
        }

        if (type === 'recovery') {
            return (
                <div className="space-y-4">
                    <p className="text-base font-medium text-ink-secondary leading-relaxed italic">
                        "{partyName} has {formatCurrency(recommendation.potential_revenue, store || settings)} currently stuck in unpaid invoices. Their oldest payment is {data.oldest_days || '26'} days past due. Usually, they pay much faster than this, so this delay is out of character. You are currently losing the use of this cash, which could be used to buy more stock."
                    </p>
                </div>
            );
        }

        return <p>{recommendation.message}</p>;
    };

    const generateWhatsAppDraft = () => {
        const partyName = recommendation.party?.name?.split(' ')[0] || 'valued customer';
        const type = recommendation.type;
        const avgRev = recommendation.potential_revenue || 4500;
        
        if (type === 'recovery') {
            return `Hi ${partyName}, hope you're doing well. Just a friendly reminder about your outstanding balance of ${formatCurrency(avgRev, store || settings)}. Please let us know if you have any questions or when we can expect payment. Thanks!`;
        }
        
        return `Hi ${partyName}, we haven't seen you for a while! We've prepared a special restock offer for your favorite items (Basmati Rice, etc.). Would you like me to send over a fresh quote with a 5% loyalty discount?`;
    };

    const renderNotesTab = () => {
        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-slower">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Notes Input Section */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-ink uppercase tracking-[0.2em]">Add Strategy Note</h4>
                            <div className="bg-app border border-line rounded-2xl p-6 focus-within:ring-4 ring-brand-600/10 transition-all">
                                <textarea 
                                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-ink-secondary min-h-[150px] placeholder:text-ink-muted"
                                    placeholder="Write down any findings, customer feedback, or recovery plans here..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                                <div className="flex justify-end mt-4">
                                    <button className="py-4 px-10 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Notes List */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-ink-muted uppercase tracking-widest">Recent Team Notes</h4>
                            <div className="space-y-4">
                                {[
                                    { user: 'Abdullah', date: '2 hours ago', text: 'Spoke with the owner. They are on vacation until next week—outreach will resume then.' },
                                    { user: 'AI Brain', date: 'Yesterday', text: 'Detected a 15% revenue drop across their top 3 essential items.' }
                                ].map((n, i) => (
                                    <div key={i} className="p-8 bg-surface border border-line rounded-xl shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-sunken rounded-full flex items-center justify-center text-2xs font-bold">{n.user.charAt(0)}</div>
                                                <span className="text-xs font-bold dark:text-white uppercase tracking-tight">{n.user}</span>
                                            </div>
                                            <span className="text-2xs font-bold text-ink-muted uppercase">{n.date}</span>
                                        </div>
                                        <p className="text-base text-ink-secondary font-medium italic">"{n.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Opportunity Status Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-app p-8 rounded-2xl border border-line">
                            <h4 className="text-2xs text-ink-muted font-bold uppercase tracking-widest mb-6">Current Status</h4>
                            <div className="space-y-3">
                                {[
                                    { id: 'in-progress', label: 'In Progress', color: 'bg-brand-50 border-brand-200 text-brand-600' },
                                    { id: 'recovered', label: 'Successfully Recovered', color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
                                    { id: 'lost', label: 'Opportunity Lost', color: 'bg-red-50 border-red-200 text-red-600' }
                                ].map((status) => (
                                    <button 
                                        key={status.id}
                                        className={`w-full py-4 text-xs font-bold uppercase tracking-widest rounded-2xl border transition-all ${status.id === 'in-progress' ? status.color : 'bg-surface border-line text-ink-muted opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderForecastTab = () => {
        const partyName = recommendation.party?.name?.split(' ')[0] || 'customer';
        const monthlyLoss = recommendation.potential_revenue || 12500;
        const yearlyLoss = monthlyLoss * 12;

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-slower">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Revenue Loss Projection */}
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-10 rounded-2xl relative overflow-hidden group shadow-lg">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg ">
                                    <TrendingUp className="rotate-180" size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-red-900 dark:text-red-300 uppercase tracking-tight">Revenue Loss Prediction</h4>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-2xs text-red-400 font-bold uppercase tracking-[0.2em] mb-2">Monthly Loss</p>
                                    <p className="text-3xl font-bold text-red-600">{formatCurrency(monthlyLoss, store || settings)}</p>
                                </div>
                                <div>
                                    <p className="text-2xs text-red-400 font-bold uppercase tracking-[0.2em] mb-2">Yearly Risk</p>
                                    <p className="text-3xl font-bold text-red-600">{formatCurrency(yearlyLoss, store || settings)}</p>
                                </div>
                            </div>
 
                            <div className="p-4 bg-white/50 dark:bg-red-950/50 rounded-lg border border-red-100 dark:border-red-800">
                                <p className="text-sm font-bold text-red-800 dark:text-red-200 leading-relaxed italic">
                                    "If {partyName} is not recovered this month, your business stands to lose over {formatCurrency(yearlyLoss, store || settings)} in annual revenue based on their purchase history."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Matching */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-10 rounded-2xl relative overflow-hidden shadow-lg">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg ">
                                    <Package size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-tight">Inventory Match</h4>
                            </div>

                            <p className="text-sm font-bold text-emerald-600/80 uppercase tracking-widest leading-none">In Stock Now — {partyName}'s Regular Items</p>
                            
                            <div className="space-y-4">
                                {[
                                    { name: 'Premium Basmati Rice', stock: '250 KG', color: 'text-emerald-600' },
                                    { name: 'White Sugar (50kg)', stock: '12 Bags', color: 'text-emerald-600' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-white/80 dark:bg-app rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
                                                <CheckCircle size={20} />
                                            </div>
                                            <span className="text-sm font-bold dark:text-ink uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        <span className={`text-2xs font-bold uppercase ${item.color}`}>{item.stock}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Segment Trend */}
                <div className="p-10 bg-app border border-line rounded-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-neutral-800 rounded-2xl text-white">
                                <BarChart2 size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold dark:text-white uppercase tracking-tight">Market Segment Trend</h4>
                                <p className="text-xs text-ink-muted font-bold uppercase tracking-widest">Category: Wholesale Grocery</p>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">
                            Growing Sector
                        </div>
                    </div>
                    <div className="h-4 bg-sunken dark:bg-surface rounded-full overflow-hidden">
                        <div className="h-full w-[75%] bg-brand-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                    </div>
                    <div className="flex justify-between mt-4">
                        <span className="text-2xs font-bold text-ink-muted uppercase">Declining</span>
                        <span className="text-2xs font-bold text-ink-muted uppercase">Steady</span>
                        <span className="text-2xs font-bold text-brand-600 uppercase">Strong Demand</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryTab = () => {
        const historyItems = [
            { date: 'Today, 04:30 AM', event: 'AI Analysis Alert Generated', icon: Sparkles, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20', desc: 'The VenQore Brain detected a high-risk churn pattern based on the last 30 days of inactivity.' },
            { date: 'March 15, 2025', event: 'Last Recovery Success', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: `Customer returned after a 12-day silence period via WhatsApp outreach. Total order: ${formatCurrency(14500, store || settings)}.` },
            { date: 'Feb 28, 2025', event: 'Previous Churn Alert', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', desc: 'Retention outreach sent by Admin. Customer re-engaged successfully.' },
        ];

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-slower">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Left Timeline Section */}
                    <div className="lg:col-span-3 space-y-10">
                        <h4 className="text-sm font-bold text-ink uppercase tracking-[0.2em] mb-4">Engagement Timeline</h4>
                        <div className="relative space-y-12 before:absolute before:inset-y-0 before:left-8 before:w-1 before:bg-sunken dark:before:bg-neutral-800 before:rounded-full">
                            {historyItems.map((item, i) => (
                                <div key={i} className="relative flex items-start gap-10 group">
                                    <div className={`shrink-0 w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} shadow-lg z-10 transition-transform`}>
                                        <item.icon size={28} />
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">{item.date}</span>
                                            <div className="w-1.5 h-1.5 bg-sunken rounded-full" />
                                            <span className="text-sm font-bold dark:text-white uppercase tracking-tight">{item.event}</span>
                                        </div>
                                        <p className="text-base text-ink-secondary font-medium leading-relaxed max-w-2xl italic">
                                            "{item.desc}"
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side Stats Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-app p-8 rounded-2xl border border-line shadow-sm">
                            <div className="space-y-8">
                                <div>
                                    <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest mb-3">Recovery Luck</p>
                                    <p className="text-4xl font-bold text-emerald-500">80%</p>
                                    <p className="text-xs text-ink-muted font-bold mt-1 uppercase italic">High Re-engagement Rate</p>
                                </div>
                                <div className="h-0.5 bg-sunken rounded-full" />
                                <div>
                                    <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest mb-2">Past Outreach</p>
                                    <p className="text-2xl font-bold dark:text-white">4 Attempted</p>
                                    <p className="text-xs text-ink-muted font-bold mt-1 italic leading-tight">Last touch via Phone Call</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderActionTab = () => {
        const partyName = recommendation.party?.name || 'this customer';
        const draft = generateWhatsAppDraft();

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-slower">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* WhatsApp Action Card */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-8 rounded-2xl flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-slow">
                        <div>
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 transition-transform">
                                <MessageSquare size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-tight mb-2">Direct Message</h4>
                            <p className="text-sm text-emerald-600 dark:text-emerald-500/80 font-bold mb-6">Send an AI-drafted WhatsApp message to {partyName} instantly.</p>
                        </div>
                        <button 
                            onClick={handleWhatsApp}
                            disabled={isActing}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isActing === 'whatsapp' ? 'Opening Chat...' : 'Send WhatsApp'}
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* Proposal Action Card */}
                    <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 p-8 rounded-2xl flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-slow">
                        <div>
                            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 transition-transform">
                                <FileText size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-brand-900 dark:text-brand-300 uppercase tracking-tight mb-2">Create Proposal</h4>
                            <p className="text-sm text-brand-600 dark:text-brand-500/80 font-bold mb-6">Generate a professional PDF proposal with a recovery discount.</p>
                        </div>
                        <button 
                            onClick={handleProposal}
                            disabled={isActing}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isActing === 'proposal' ? 'Drafting PDF...' : 'Draft Proposal'}
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* Follow-up Action Card */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-8 rounded-2xl flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-slow">
                        <div>
                            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 transition-transform">
                                <Calendar size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-amber-900 dark:text-amber-300 uppercase tracking-tight mb-2">Schedule Task</h4>
                            <p className="text-sm text-amber-600 dark:text-amber-500/80 font-bold mb-6">Create a follow-up reminder in your admin task list for later.</p>
                        </div>
                        <button 
                            onClick={handleTask}
                            disabled={isActing}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isActing === 'task' ? 'Scheduling...' : 'Set Reminder'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Message Preview */}
                <div className="bg-app border border-line rounded-2xl p-10 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 bg-brand-600 rounded-xl text-white">
                            <Sparkles size={18} />
                        </div>
                        <h4 className="text-xs font-bold text-ink-muted uppercase tracking-[0.3em]">AI-Authored WhatsApp Draft</h4>
                    </div>
                    <div className="p-8 bg-surface rounded-xl border border-line shadow-inner">
                        <p className="text-xl font-bold text-ink leading-relaxed italic">
                            "{draft}"
                        </p>
                    </div>
                    <div className="flex items-center gap-4 mt-6 text-xs font-bold text-ink-muted uppercase tracking-widest px-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Dynamic placeholders (Last Order: {recommendation.data?.last_order_date || 'N/A'})
                    </div>
                </div>
            </div>
        );
    };

    const renderIntelligenceTab = () => {
        const type = recommendation.type;
        const data = recommendation.data || {};
        
        // REAL DATA HOOKUP: Use history from backend if available
        const realChartData = (data.history && data.history.length > 0) 
            ? data.history 
            : chartData;

        // REAL DATA HOOKUP: Use top products from backend
        const realProducts = (data.top_products && data.top_products.length > 0)
            ? data.top_products
            : ['Premium Basmati Rice', 'White Sugar (50kg)'];

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-slower">
                {/* REWROTTEN: AI EXPLANATION SECTION - SIMPLER & SMALLER */}
                <div className="p-8 bg-app border border-line rounded-2xl relative overflow-hidden group transition-all duration-slower">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-brand-600 rounded-xl text-white">
                                <Sparkles size={18} />
                            </div>
                            <h4 className="text-sm font-bold text-ink-muted uppercase tracking-[0.2em]">What's happening?</h4>
                        </div>
                        {generateNarrative()}
                    </div>
                </div>

                {/* FULL WIDTH REVENUE CHART */}
                <div>
                    <h4 className="text-sm font-bold text-ink mb-6 flex items-center gap-3 uppercase tracking-widest">
                        <TrendingUp size={20} className="text-brand-500" /> Revenue & Order Pattern
                    </h4>
                    <div className="h-[350px] w-full bg-surface rounded-2xl relative border border-line shadow-inner overflow-hidden">
                        <div className="absolute inset-10">
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                <AreaChart data={realChartData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.indigo[500]} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={vq.indigo[500]} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke={vq.slate[500]} 
                                        fontSize={11} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: vq.slate[500], fontWeight: 'bold'}}
                                        dy={15}
                                    />
                                    <YAxis 
                                        stroke={vq.slate[500]} 
                                        fontSize={11} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: vq.slate[500], fontWeight: 'bold'}}
                                        tickFormatter={(value) => formatCurrency(value, store || settings)}
                                        dx={-15}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '16px' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke={vq.indigo[600]} fillOpacity={1} fill="url(#colorVal)" strokeWidth={5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Grid for Stats and Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-app p-6 rounded-2xl border border-line">
                            <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest mb-2">Likely Order Value</p>
                            <p className="text-2xl font-bold dark:text-white">{formatCurrency(recommendation.potential_revenue, store || settings)}</p>
                        </div>
                        <div className="bg-app p-6 rounded-2xl border border-line">
                            <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest mb-2">Order Frequency</p>
                            <p className="text-2xl font-bold dark:text-white">Every {data.adbo || '8'} Days</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest mb-2 ml-2">Mostly Purchased Products</p>
                        {realProducts.map((prod, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-surface border border-line rounded-2xl group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/40 rounded-xl flex items-center justify-center text-brand-600 font-bold text-xs">
                                        {prod.charAt(0)}
                                    </div>
                                    <span className="text-sm font-bold dark:text-ink">{prod}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-drawer flex items-center justify-center p-6 md:p-12">
            <div 
                className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm animate-in fade-in duration-slow"
                onClick={onClose}
            />

            <div className={`relative w-full max-w-6xl h-[85vh] bg-surface rounded-2xl shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] border border-line flex flex-col transition-all duration-slower overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-12 duration-slower ease-out`}>
                
                {/* REFINED HEADER: FIXED CUSTOMER NAME */}
                <div className="px-10 py-8 bg-app border-b border-line shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-brand-600 rounded-lg text-white shadow-xl ">
                                <User size={28} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold dark:text-white tracking-tight uppercase leading-none mb-1">
                                    {recommendation.party?.name || 'Unknown Customer'}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-600 rounded-full text-2xs font-bold border border-brand-200 dark:border-brand-800 uppercase tracking-widest">
                                        Beta AI Intelligence
                                    </div>
                                    <span className="text-xs text-ink-muted font-bold uppercase tracking-widest">• {recommendation.title}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-4 rounded-2xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all text-ink-muted hover:text-ink-secondary group active:scale-95 bg-surface shadow-sm border border-line"
                        >
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-slow" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Horizontal Tabs Selector */}
                    <div className="flex border-b border-line bg-surface px-10 overflow-x-auto custom-scrollbar shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 py-6 px-10 border-b-4 transition-all relative group
                                    ${activeTab === tab.id 
                                        ? 'border-brand-600 text-brand-600 font-bold' 
                                        : 'border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 font-bold'}
`}
                            >
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-brand-600' : ' transition-transform'} />
                                <span className="text-xs uppercase tracking-[0.2em]">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-surface">
                        {activeTab === 'intelligence' && renderIntelligenceTab()}
                        {activeTab === 'action' && renderActionTab()}
                        {activeTab === 'history' && renderHistoryTab()}
                        {activeTab === 'forecast' && renderForecastTab()}
                        {activeTab === 'notes' && renderNotesTab()}
                    </div>
                </div>

                {/* REFINED FOOTER: URGENCY ON LEFT, RECOMMENDATION CENTER */}
                <div className="p-10 bg-app border-t border-line shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-xl text-2xs font-bold uppercase tracking-widest border ${
                                recommendation.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                                {recommendation.priority} Urgency
                            </div>
                            <div className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-xl text-2xs font-bold border border-brand-100 dark:border-brand-800 uppercase tracking-widest">
                                {recommendation.type} Detected
                            </div>
                        </div>

                        <div className="flex-1 px-10 text-center">
                            <div className="inline-flex items-center gap-4 p-4 bg-surface rounded-2xl border border-line shadow-sm">
                                <Sparkles size={16} className="text-brand-500 animate-pulse" />
                                <p className="text-sm font-bold text-ink italic">
                                    AI Recommendation: We suggest contacting {recommendation.party?.name.split(' ')[0]} to discuss their recent purchase pattern.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setActiveTab('action')}
                            className="flex items-center justify-center gap-3 py-4 px-10 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 group"
                        >
                            Take Action
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CreditCard(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    );
}

