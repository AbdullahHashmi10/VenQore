import React from 'react';
import { Users, Award, ShieldAlert, ArrowUpRight } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import { usePage } from '@inertiajs/react';
import { useTermText } from '@/lib/terms';

export default function CustomersSuppliersSection({ data, setData }) {
    const tt = useTermText();
    const { store } = usePage().props;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Customer Grouping & Loyalty */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Customers and rewards</h3>

                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.party_grouping === true || data.party_grouping === '1'}
                            onChange={v => setData('party_grouping', v)}
                            label="Group customers and suppliers"
                            description={tt('Categorize customers and suppliers by territory, industry, or corporate tier')}
                        />

                        <Toggle
                            enabled={data.loyalty_enabled === true || data.loyalty_enabled === '1'}
                            onChange={v => setData('loyalty_enabled', v)}
                            label="Loyalty Points Program"
                            description={tt('Reward customers with redeemable balance points on checkout transactions')}
                        />

                        {data.loyalty_enabled && (
                            <div className="py-3 animate-in fade-in slide-in-from-top-1">
                                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-500/20 flex items-center justify-between text-xs text-brand-700 dark:text-brand-300">
                                    <span>Fine-tune point conversion ratios &amp; tier perks</span>
                                    <a
                                        href={`/s/${store?.slug}/growth-engine/settings`}
                                        className="font-bold underline hover:text-brand-800 ml-2 shrink-0 flex items-center gap-1"
                                    >
                                        <span>Growth Rules</span>
                                        <ArrowUpRight size={12} />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Card: Credit Limit & Risk */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Customer credit</h3>

                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.enable_credit_limit !== '0' && data.enable_credit_limit !== false}
                            onChange={v => setData('enable_credit_limit', v)}
                            label="Enable Customer Credit Limits"
                            description={tt('Warn or stop staff when a customer owes more than their allowed credit amount')}
                        />
                    </div>

                    <div className="p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted leading-relaxed">
                        <p className="font-bold text-ink mb-1">Overdue Reminder Schedule:</p>
                        <p>
                            Automated notification windows for overdue receivables are configured under{' '}
                            <strong>Operations &gt; Reminders &amp; Alerts</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
