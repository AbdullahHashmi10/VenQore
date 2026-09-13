import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Megaphone,
    MessageCircle,
    Mail,
    Users,
    Send,
    Plus,
    BarChart,
    Settings
} from 'lucide-react';

export default function MarketingCampaignsIndex({ campaigns = [] }) {
    const [activeTab, setActiveTab] = useState('campaigns');

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-neutral-100 text-ink-secondary',
            scheduled: 'bg-blue-100 text-blue-700',
            sending: 'bg-amber-100 text-amber-700',
            completed: 'bg-emerald-100 text-emerald-700',
            failed: 'bg-red-100 text-red-700'
        };
        return styles[status] || styles.draft;
    };

    return (
        <OneGlanceLayout title="Marketing & Campaigns" activeMenu="Marketing">
            <Head title="Marketing Campaigns" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
                            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
                                <Megaphone className="text-brand-600 dark:text-brand-400" size={24} />
                            </div>
                            Marketing & Campaigns
                        </h1>
                        <p className="text-ink-muted text-sm mt-1">Engage customers via WhatsApp and Email campaigns</p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-ink rounded-xl hover:bg-brand-700 transition-colors font-bold shadow-lg shadow-brand-500/20"
                    >
                        <Plus size={18} />
                        New Campaign
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface rounded-2xl p-5 border border-line">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
                                <Megaphone className="text-brand-600 dark:text-brand-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-ink-muted uppercase font-bold">Active Campaigns</p>
                                <p className="text-2xl font-bold text-ink">
                                    {(Array.isArray(campaigns) ? campaigns : (campaigns?.data || [])).filter(c => c.status === 'scheduled').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface rounded-2xl p-5 border border-line">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <MessageCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-ink-muted uppercase font-bold">Messages Sent</p>
                                <p className="text-2xl font-bold text-emerald-600">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface rounded-2xl p-5 border border-line">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Users className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-ink-muted uppercase font-bold">Audience Reach</p>
                                <p className="text-2xl font-bold text-blue-600">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-surface rounded-2xl border border-line min-h-[400px]">
                    {/* Placeholder for empty state */}
                    <div className="p-12 text-center">
                        <Megaphone size={64} className="mx-auto text-neutral-200 dark:text-ink-secondary mb-6" />
                        <h3 className="text-xl font-bold text-ink mb-2">No Campaigns Yet</h3>
                        <p className="text-ink-muted max-w-md mx-auto mb-8">
                            Create your first marketing campaign to boost sales. Send offers, updates, and newsletters to your customers via WhatsApp or Email.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors font-bold border border-emerald-200 dark:border-emerald-800">
                                <MessageCircle size={20} />
                                WhatsApp Campaign
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-bold border border-blue-200 dark:border-blue-800">
                                <Mail size={20} />
                                Email Campaign
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
