import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
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
        <OneGlanceLayout title="Marketing & Campaigns" activeMenu="Marketing" noPadding>
            <Head title="Marketing Campaigns" />

            <ListPageFrame className="p-1.5">
                <ListToolbar
                    title="Campaigns"
                    actions={<ListAddButton icon={Plus}>New Campaign</ListAddButton>}
                />
                <ListStatCards cards={[
                    { label: 'Active Campaigns', value: (Array.isArray(campaigns) ? campaigns : (campaigns?.data || [])).filter(c => c.status === 'scheduled').length, icon: Megaphone },
                    { label: 'Messages Sent', value: 0, icon: MessageCircle, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Audience Reach', value: 0, icon: Users, icon_tone: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', value_tone: 'text-blue-600' },
                ]} />
                <div className="md:flex-1 md:min-h-0 md:overflow-auto space-y-6 md:space-y-0">
                <MobileListHeader title="Campaigns" add={{ onClick: () => {}, label: 'New Campaign' }} />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Active', value: (Array.isArray(campaigns) ? campaigns : (campaigns?.data || [])).filter(c => c.status === 'scheduled').length, tone: 'brand', icon: Megaphone },
                    { label: 'Sent', value: 0, tone: 'emerald', icon: MessageCircle },
                    { label: 'Reach', value: 0, tone: 'blue', icon: Users },
                ]} />

                {/* Main Content Area */}
                <div className="bg-surface rounded-2xl border border-line min-h-[400px] md:min-h-full md:flex md:items-center md:justify-center">
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
