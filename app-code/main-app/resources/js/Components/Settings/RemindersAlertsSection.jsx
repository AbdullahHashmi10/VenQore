import React, { useState } from 'react';
import { Clock, Bell, Mail, Plus, Trash2, Search, Info } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import { useTermText } from '@/lib/terms';

export default function RemindersAlertsSection({ data, setData }) {
    const tt = useTermText();
    const [reminderSearch, setReminderSearch] = useState('');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* Email Notification Digests */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Email summaries</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Toggle
                        enabled={data.email_notifications !== '0' && data.email_notifications !== false}
                        onChange={v => setData('email_notifications', v)}
                        label="Weekly business summary"
                        description="Email a summary of sales and stock activity to the store owner."
                        icon={Mail}
                    />

                    <Toggle
                        enabled={data.daily_sales_summary === true || data.daily_sales_summary === '1'}
                        onChange={v => setData('daily_sales_summary', v)}
                        label="Daily sales summary"
                        description="Email the day's sales totals to the store owner."
                        icon={Mail}
                    />
                </div>
            </div>

            {/* Customer Overdue Payment Window */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-ink">Overdue payment reminders</h3>
                        <p className="text-xs text-ink-muted">Choose when an unpaid customer bill should appear for follow-up.</p>
                    </div>
                    <Clock size={18} className="text-ink-muted" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Days after the due date</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="90"
                                value={data.payment_reminder_days || 7}
                                onChange={e => setData('payment_reminder_days', parseInt(e.target.value, 10) || 7)}
                                className="w-32 px-3.5 py-2 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <span className="text-xs font-bold text-ink-muted">days past due date</span>
                        </div>
                    </div>

                    <div className="p-3 bg-app rounded-xl border border-line text-2xs text-ink-muted flex items-start gap-2">
                        <Info size={14} className="text-brand-600 shrink-0 mt-0.5" />
                        <span>
                            Staff can review overdue bills and prepare a WhatsApp message. The message is not sent automatically.
                        </span>
                    </div>
                </div>
            </div>

            {/* Service Reminders Section */}
            <div className="bg-surface rounded-2xl border border-line shadow-xs overflow-hidden flex flex-col">
                <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface">
                    <div>
                        <h3 className="text-sm font-bold text-ink">Service follow-ups</h3>
                        <p className="text-xs text-ink-muted">Set how often to remind customers about services such as oil changes.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newReminder = {
                                id: Date.now(),
                                name: tt('New Service'),
                                interval: 30,
                                unit: 'days',
                            };
                            setData('service_reminders', [...(data.service_reminders || []), newReminder]);
                        }}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
                    >
                        <Plus size={14} /> Add Service Cycle
                    </button>
                </div>

                <div className="divide-y divide-line">
                    {(data.service_reminders || []).length > 0 ? (
                        (data.service_reminders || []).map((reminder, idx) => (
                            <div key={reminder.id} className="p-4 flex items-center justify-between hover:bg-app/40 transition-colors group">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-9 h-9 rounded-xl bg-app text-ink-muted flex items-center justify-center shrink-0">
                                        <Clock size={18} />
                                    </div>
                                    <div className="flex-1 max-w-sm">
                                        <input
                                            type="text"
                                            value={reminder.name}
                                            onChange={(e) => {
                                                const newItems = [...data.service_reminders];
                                                newItems[idx].name = e.target.value;
                                                setData('service_reminders', newItems);
                                            }}
                                            placeholder="Service Name (e.g. Engine Oil Service)"
                                            className="w-full bg-transparent border-0 p-0 text-sm font-bold text-ink focus:ring-0 outline-none"
                                        />
                                        <p className="text-3xs text-ink-muted uppercase font-bold tracking-widest mt-0.5">Recurring Service</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-app px-3 py-1.5 rounded-xl border border-line">
                                        <span className="text-3xs font-bold text-ink-muted uppercase">Every</span>
                                        <input
                                            type="number"
                                            value={reminder.interval}
                                            onChange={(e) => {
                                                const newItems = [...data.service_reminders];
                                                newItems[idx].interval = e.target.value;
                                                setData('service_reminders', newItems);
                                            }}
                                            className="w-12 bg-transparent border-0 p-0 text-xs font-bold text-brand-600 dark:text-brand-400 focus:ring-0 text-center outline-none"
                                        />
                                        <select
                                            value={reminder.unit}
                                            onChange={(e) => {
                                                const newItems = [...data.service_reminders];
                                                newItems[idx].unit = e.target.value;
                                                setData('service_reminders', newItems);
                                            }}
                                            className="bg-transparent border-0 p-0 text-xs font-bold text-ink focus:ring-0 outline-none cursor-pointer"
                                        >
                                            <option value="days">Days</option>
                                            <option value="months">Months</option>
                                            <option value="years">Years</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newItems = data.service_reminders.filter(r => r.id !== reminder.id);
                                        setData('service_reminders', newItems);
                                    }}
                                    className="p-2 text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Service Cycle"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 flex flex-col items-center justify-center text-ink-muted">
                            <Clock size={32} className="mb-2 opacity-30" />
                            <p className="font-bold text-xs text-ink">No Service Cycles Configured</p>
                            <p className="text-3xs text-ink-muted mt-0.5">Click "Add Service Cycle" to configure automated recurring maintenance prompts.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
