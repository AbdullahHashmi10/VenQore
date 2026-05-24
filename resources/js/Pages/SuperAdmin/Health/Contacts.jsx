import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { MessagesSquare, CheckCircle, ArrowLeft, Mail, Clock, CheckCircle2 } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

export default function Contacts({ submissions, filters }) {
    const [selected, setSelected] = useState(null);

    const statusFilter = filters.status || 'new';

    function setFilter(status) {
        router.get(route('platform.health.contacts'), { status }, { preserveState: true });
    }

    function markAsRead() {
        if (!selected) return;
        router.post(route('platform.health.contacts.read', selected.id), {}, {
            onSuccess: () => {
                const updated = { ...selected, status: 'read', read_at: new Date().toISOString() };
                setSelected(updated);
            }
        });
    }

    return (
        <OneGlanceLayout title="Contact Desk" mode="admin">
            <Head title="Contact Forms - System Health" />

            <div className="h-full flex flex-col relative overflow-hidden">
                {/* --- Unified Header Banner --- */}
                <div style={{ 
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(99,102,241,0.05) 100%)', 
                    borderBottom: '1px solid rgba(255,255,255,0.07)', 
                    padding: '32px', 
                    borderRadius: '24px 24px 0 0',
                    marginBottom: 8
                }} className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href={route('platform.dashboard')} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <MessagesSquare className="text-sky-500" size={24} />
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact Desk</h1>
                            </div>
                            <p className="text-slate-400 font-medium mt-1">Queries submitted via marketing pages.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <button onClick={() => setFilter('new')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'new' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-lg shadow-sky-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            Unread
                        </button>
                        <button onClick={() => setFilter('read')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'read' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            Read
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar flex gap-8">
                    
                    {/* List */}
                    <div className="flex-1 max-w-4xl flex flex-col gap-4">
                        {submissions.data.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <CheckCircle className="mx-auto text-sky-500 mb-4 opacity-50" size={48} />
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Inbox Zero 🎉</h3>
                                <p className="text-sm text-slate-500">No {statusFilter} contact submissions right now.</p>
                            </div>
                        ) : (
                            submissions.data.map(sub => (
                                <div 
                                    key={sub.id} 
                                    onClick={() => setSelected(sub)}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${selected?.id === sub.id ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-900/50 shadow-md' : 'bg-white border-slate-200 hover:border-sky-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600'} ${sub.status === 'new' ? 'border-l-4 border-l-sky-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</h3>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">&lt;{sub.email}&gt;</span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={12}/> {new Date(sub.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 truncate">
                                        {sub.subject || 'No Subject'}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-2xl">
                                        {sub.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Details Panel */}
                    {selected && (
                        <div className="w-[400px] flex-shrink-0 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl sticky top-0 h-fit flex flex-col max-h-[calc(100vh-140px)]">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <Mail className="text-sky-500" />
                                Message Details
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Sender</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{selected.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Email</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300"><a href={`mailto:${selected.email}`} className="text-sky-600 hover:underline">{selected.email}</a></div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Company</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{selected.company || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Date</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(selected.created_at).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Message</div>
                                    <div className="text-sm font-normal text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                                        {selected.message}
                                    </div>
                                </div>
                            </div>

                            {selected.status === 'new' && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <button 
                                        onClick={markAsRead}
                                        className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle2 size={18} />
                                        Mark as Read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </OneGlanceLayout>
    );
}
