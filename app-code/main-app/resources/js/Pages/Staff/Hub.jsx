import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Store, ArrowRight, Clock, Crown, Zap, Users,
    ChevronRight, Mail, Sparkles, CheckSquare, Square,
    MessageSquare, ListTodo, ShieldAlert, LogOut, CheckCircle2,
    BookOpen, Megaphone, DollarSign, Lock, LineChart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';


import { vq } from '@/theme/runtime';
/* ═══════════════════════════════════════════════════════════════════════
   STAFF HUB — Unified Platform Employee Cockpit (Midnight Nebula Theme)
   ═══════════════════════════════════════════════════════════════════════ */

const PLATFORM_ROLES = {
    platform_owner:         { label: 'Hashmi Dashboard', icon: Crown, color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
    platform_manager:       { label: 'Platform Manager', icon: Crown, color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
    support_director:       { label: 'Support Director', icon: Zap,   color: 'text-brand-400', bg: 'bg-brand-400/10', border: 'border-brand-400/20' },
    support_dept_manager:   { label: 'Support Manager',  icon: Zap,   color: 'text-brand-400', bg: 'bg-brand-400/10', border: 'border-brand-400/20' },
    support_agent:          { label: 'Support Agent',    icon: Users, color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20' },
    content_writer:         { label: 'Content Writer',   icon: BookOpen, color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
    marketing_manager:      { label: 'Marketing Lead',   icon: Megaphone, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' },
    platform_finance:       { label: 'Finance Officer',  icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
};

function RoleBadge({ role }) {
    const cfg = PLATFORM_ROLES[role] ?? { label: 'Platform Staff', icon: Users, color: 'text-ink-muted', bg: 'bg-neutral-400/10', border: 'border-line-strong' };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
}

export default function StaffHub({ employee, referred_chats = [], tasks = [], stats = { unassigned: 0, active: 0, resolved: 0 } }) {
    const [activeTasks, setActiveTasks] = useState(tasks);
    const [autonomyStats, setAutonomyStats] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [loadingStats, setLoadingStats] = useState(employee.role === 'owner');

    const toggleTask = (taskId) => {
        setActiveTasks(prev =>
            prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        );
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const fetchAutonomyStats = async () => {
        try {
            const res = await axios.get(route('platform.chatbot.autonomy-stats'));
            if (res.data.success) {
                setAutonomyStats(res.data.stats || []);
                setCategoryStats(res.data.categories || []);
            }
        } catch (err) {
            console.error("Failed to fetch autonomy stats", err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        if (employee.role === 'owner') {
            fetchAutonomyStats();
        }
    }, [employee.role]);

    const handleToggleAutonomy = async (category, currentStatus) => {
        try {
            const res = await axios.post(route('platform.chatbot.autonomy-stats.promote'), {
                category,
                autonomous: !currentStatus
            });
            if (res.data.success) {
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: res.data.message, type: 'success' }
                }));
                fetchAutonomyStats();
            }
        } catch (err) {
            console.error("Failed to toggle autonomy", err);
        }
    };

    const hasSupportAccess = ['platform_owner', 'platform_manager', 'support_director', 'support_dept_manager', 'support_agent', 'support', 'owner'].includes(employee.role);

    return (
        <div className="min-h-screen bg-void-950 text-white font-sans selection:bg-violet-500/40 selection:text-white relative overflow-hidden">
            <Head title="Platform Employee Cockpit" />

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 shadow-xl">
                        <Sparkles size={18} className="text-violet-400" />
                    </div>
                    <div>
                        <span className="text-2xs font-bold text-violet-400 uppercase tracking-widest block">VenQore Internal</span>
                        <span className="text-sm font-bold text-white tracking-tight">Team Command Cockpit</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-ink-muted hover:text-white transition-colors flex items-center gap-2 group"
                >
                    <span>Sign Out</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                        <LogOut size={13} className="text-ink-muted group-hover:text-red-400" />
                    </div>
                </button>
            </header>

            {/* Dashboard Container */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ── Left Column — Welcome & Active Rooms ── */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Welcome Card */}
                    <div className="relative rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 w-48 h-48 bg-violet-600/10 rounded-full blur-[50px] -mt-16 -mr-16 pointer-events-none" />
                        
                        <span className="text-3xs font-bold text-violet-400 uppercase tracking-[0.2em] block mb-2">VenQore Platform Staff</span>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {employee.name}
                        </h1>
                        <p className="text-ink-muted text-sm max-w-lg mb-6 leading-relaxed">
                            Authorized as <span className="text-neutral-300 font-semibold">{employee.email}</span>. Operating at the platform control level.
                        </p>

                        <div className="flex flex-wrap gap-2.5">
                            <RoleBadge role={employee.role} />
                        </div>
                    </div>

                    {/* Operational Rooms Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                            <Store size={18} className="text-violet-400" /> Cockpit Rooms
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Support Room (Active if Support Role) */}
                            <div className="group rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 transition-all duration-slow flex flex-col justify-between shadow-lg">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-sm font-bold text-brand-400">
                                            <MessageSquare size={18} />
                                        </div>
                                        <span className="text-2xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white mb-1 group-hover:text-brand-300 transition-colors">Support Room</h3>
                                    <p className="text-xs text-ink-muted mb-4">Manage global customer inbox sessions and co-pilot with Vena AI.</p>
                                    
                                    {/* Real-time support cockpit stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="bg-white/5 border border-white/[0.04] p-2.5 rounded-xl text-center">
                                            <span className="text-3xs text-ink-muted font-bold uppercase tracking-wider block">Unassigned</span>
                                            <span className="text-sm font-bold text-rose-400 block mt-0.5">{stats.unassigned}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/[0.04] p-2.5 rounded-xl text-center">
                                            <span className="text-3xs text-ink-muted font-bold uppercase tracking-wider block">Active</span>
                                            <span className="text-sm font-bold text-brand-400 block mt-0.5">{stats.active}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/[0.04] p-2.5 rounded-xl text-center">
                                            <span className="text-3xs text-ink-muted font-bold uppercase tracking-wider block">Resolved</span>
                                            <span className="text-sm font-bold text-emerald-400 block mt-0.5">{stats.resolved}</span>
                                        </div>
                                    </div>

                                </div>

                                {hasSupportAccess ? (
                                    <Link href={route('platform.chatbot.inbox')} className="w-full text-center py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg hover: transition-all flex items-center justify-center gap-1.5">
                                        Enter Support Command <ArrowRight size={12} />
                                    </Link>
                                ) : (
                                    <div className="w-full text-center py-2.5 rounded-xl bg-neutral-800 text-ink-muted text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                        <Lock size={12} /> Restricted
                                    </div>
                                )}
                            </div>

                            {/* Content & SEO Room (Coming Soon) */}
                            <div className="group rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5 opacity-60 flex flex-col justify-between shadow-lg">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-teal-500/5 flex items-center justify-center text-sm font-bold text-teal-500">
                                            <BookOpen size={18} />
                                        </div>
                                        <span className="text-4xs bg-neutral-800 border border-neutral-700 text-ink-muted font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Locked
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-neutral-300 mb-1">Content & SEO Room</h3>
                                    <p className="text-xs text-ink-secondary mb-6">VenQore landing page articles, knowledge bases, and site SEO tools.</p>
                                </div>
                                <div className="w-full text-center py-2.5 rounded-xl bg-neutral-900 text-ink-secondary text-xs font-bold flex items-center justify-center gap-1.5">
                                    <Lock size={12} /> Coming Soon
                                </div>
                            </div>

                            {/* Marketing Room (Coming Soon) */}
                            <div className="group rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5 opacity-60 flex flex-col justify-between shadow-lg">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-pink-500/5 flex items-center justify-center text-sm font-bold text-pink-500">
                                            <Megaphone size={18} />
                                        </div>
                                        <span className="text-4xs bg-neutral-800 border border-neutral-700 text-ink-muted font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Locked
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-neutral-300 mb-1">Marketing & Growth</h3>
                                    <p className="text-xs text-ink-secondary mb-6">Social reach analytics, marketing lists, and promotional assets.</p>
                                </div>
                                <div className="w-full text-center py-2.5 rounded-xl bg-neutral-900 text-ink-secondary text-xs font-bold flex items-center justify-center gap-1.5">
                                    <Lock size={12} /> Coming Soon
                                </div>
                            </div>

                            {/* Finance Room (Coming Soon) */}
                            <div className="group rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5 opacity-60 flex flex-col justify-between shadow-lg">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/5 flex items-center justify-center text-sm font-bold text-emerald-500">
                                            <LineChart size={18} />
                                        </div>
                                        <span className="text-4xs bg-neutral-800 border border-neutral-700 text-ink-muted font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Locked
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-neutral-300 mb-1">Finance & Subscriptions</h3>
                                    <p className="text-xs text-ink-secondary mb-6">Active subscription fee journals and Gateway reconciliations.</p>
                                </div>
                                <div className="w-full text-center py-2.5 rounded-xl bg-neutral-900 text-ink-secondary text-xs font-bold flex items-center justify-center gap-1.5">
                                    <Lock size={12} /> Coming Soon
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Referrals Session Queue */}
                    {hasSupportAccess && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                                <MessageSquare size={18} className="text-violet-400" /> Referred Platform Queue
                            </h2>

                            {referred_chats.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] p-12 text-center">
                                    <CheckCircle2 size={36} className="text-ink-secondary mx-auto mb-3" />
                                    <h3 className="font-bold text-white text-sm">Inbox Fully Cleared!</h3>
                                    <p className="text-ink-muted text-xs mt-1">There are currently no chatbot session tickets referred specifically to your username.</p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04] shadow-lg">
                                    {referred_chats.map(chat => (
                                        <div key={chat.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.03] transition-colors">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 text-violet-400">
                                                    <MessageSquare size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="font-bold text-white text-sm">{chat.visitor_name}</span>
                                                        <span className="text-3xs bg-neutral-800 border border-neutral-700 text-ink-muted font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {chat.tenant_name}
                                                        </span>
                                                        {chat.sub_status && (
                                                            <span className={`text-4xs font-bold uppercase px-2 py-0.5 rounded-full ${
                                                                chat.sub_status === 'fixed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                                {chat.sub_status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-ink-muted truncate">{chat.visitor_email}</p>
                                                    <p className="text-2xs text-ink-secondary mt-1 flex items-center gap-1">
                                                        <Clock size={10} /> Active: {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <Link href={chat.url} className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-400/40 text-violet-400 hover:text-violet-300 font-bold text-xs transition-all">
                                                Open Conversation <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right Column — Duties & Platform Checklist ── */}
                <div className="space-y-8">
                    
                    {/* Task Checklist card */}
                    <div className="rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                                <ListTodo size={18} className="text-violet-400" /> Platform Duties
                            </h2>
                            <span className="text-2xs bg-neutral-800 text-ink-muted font-bold px-2 py-0.5 rounded-full">
                                {activeTasks.filter(t => t.completed).length}/{activeTasks.length} Completed
                            </span>
                        </div>

                        <div className="space-y-3.5">
                            {activeTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all duration-slow group ${
                                        task.completed 
                                            ? 'bg-emerald-500/[0.02] border-emerald-500/15 text-ink-muted line-through' 
                                            : 'bg-white/[0.01] border-white/[0.05] hover:border-white/[0.1] text-neutral-300'
                                    }`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        {task.completed ? (
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        ) : (
                                            <div className="w-4 h-4 rounded border border-neutral-700 flex items-center justify-center group-hover:border-violet-500 transition-colors" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs leading-relaxed font-medium">{task.text}</p>
                                        <span className={`text-4xs font-bold uppercase tracking-widest mt-1.5 inline-block ${
                                            task.priority === 'high' ? 'text-red-400' : task.priority === 'medium' ? 'text-violet-400' : 'text-ink-muted'
                                        }`}>
                                            {task.priority} Priority
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Operational Notice Box */}
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-6 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />
                        
                        <h3 className="font-bold text-white text-xs tracking-wide uppercase mb-2 flex items-center gap-1.5">
                            <ShieldAlert size={14} className="text-violet-400" /> Platform Security
                        </h3>
                        <p className="text-ink-muted text-xs leading-relaxed">
                            Support agent logs, learning database inputs, and co-pilot suggestions are audited under platform administration standards to maintain VenQore system integrity.
                        </p>
                    </div>
                </div>

            </main>

            {/* ── Autonomy Dashboard Section (Owner & Admin Only) ── */}
            {employee.role === 'owner' && (
                <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-slower">
                    <div className="border-t border-white/[0.04] pt-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    <Sparkles className="text-purple-400" size={24} /> Vena AI Autonomy Dashboard
                                </h2>
                                <p className="text-ink-muted text-xs mt-1">Monitor autonomous resolve rates and manage self-improving escalation boundaries</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl shrink-0">
                                <span className="text-2xs bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Learning Active
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Recharts Stacked Bar Chart */}
                            <div className="lg:col-span-2 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-6 shadow-2xl flex flex-col justify-between h-[360px]">
                                <div className="mb-4">
                                    <h3 className="font-bold text-white text-sm">Resolution Over Time</h3>
                                    <p className="text-ink-muted text-2xs">AI vs Human ticket closures</p>
                                </div>
                                <div className="flex-1 min-h-0 w-full">
                                    {loadingStats ? (
                                        <div className="h-full w-full flex items-center justify-center text-ink-muted text-xs gap-2">
                                            <span className="animate-pulse">Loading charts...</span>
                                        </div>
                                    ) : autonomyStats.length === 0 ? (
                                        <div className="h-full w-full flex items-center justify-center text-ink-muted text-xs">
                                            No resolved session data available yet
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={autonomyStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: vq.slate[950], borderColor: 'rgba(255,255,255,0.08)', borderRadius: '1rem', color: '#fff' }} 
                                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                    labelStyle={{ fontSize: '10px', color: vq.purple[500], fontWeight: 'black', textTransform: 'uppercase' }}
                                                />
                                                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: vq.slate[400] }} />
                                                <Bar dataKey="AI" name="Vena AI" stackId="a" fill={vq.violet[500]} radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="Human" name="Human Support" stackId="a" fill={vq.slate[600]} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Category Autonomy Settings Table */}
                            <div className="rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-6 shadow-2xl flex flex-col justify-between">
                                <div className="mb-6">
                                    <h3 className="font-bold text-white text-sm">Escalation Controls</h3>
                                    <p className="text-ink-muted text-2xs">Define boundaries where Vena answers autonomously</p>
                                </div>

                                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
                                    {loadingStats ? (
                                        <div className="h-48 w-full flex items-center justify-center text-ink-muted text-xs gap-2">
                                            <span className="animate-pulse">Loading controls...</span>
                                        </div>
                                    ) : categoryStats.map(cat => (
                                        <div key={cat.category} className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-white/[0.08] transition-colors">
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold uppercase text-neutral-200 tracking-wide block">
                                                    {cat.category}
                                                </span>
                                                <span className="text-2xs text-ink-muted block mt-0.5">
                                                    {cat.ai_handled_rate}% autonomous handle rate ({cat.total_chats} chats)
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleAutonomy(cat.category, cat.ai_autonomous)}
                                                className={`px-3 py-1.5 rounded-xl text-3xs font-bold uppercase tracking-wider transition-all border shrink-0 ${
                                                    cat.ai_autonomous
                                                        ? 'bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-lg '
                                                        : 'bg-neutral-900 border-white/5 text-ink-muted hover:text-white hover:border-white/10'
                                                }`}
                                            >
                                                {cat.ai_autonomous ? 'Autonomous' : 'Let AI handle'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
