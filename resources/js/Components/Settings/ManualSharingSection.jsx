import React from 'react';
import { MessageSquare, Share2, Info } from 'lucide-react';
import Toggle from '@/Components/Toggle';

export default function ManualSharingSection({ data, setData, saveSettings }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* Disclaimer Banner */}
            <div className="p-4 bg-app rounded-2xl border border-line flex items-start gap-3 text-xs text-ink-muted leading-relaxed">
                <Info size={16} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold text-ink">Explicit Delivery Policy: </span>
                    VENQORE uses standard WhatsApp Web / mobile Click-to-Chat protocol. Clicking share generates a prefilled conversation window on your device. We do not dispatch background SMS or automated Meta Cloud API calls, guaranteeing no third-party messaging fees.
                </div>
            </div>

            {/* Template Editors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Card: Document Templates */}
                <div className="space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Document Prefill Templates</h3>

                    {/* Sales Invoice */}
                    <div className="space-y-2">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted block">Sales Invoice Receipt Template</label>
                        <textarea
                            rows={3}
                            value={data.message_template_sales || ''}
                            onChange={e => setData('message_template_sales', e.target.value)}
                            className="w-full p-3 bg-app text-ink border border-line rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none"
                            placeholder="Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready. Receipt: [Link]"
                        />
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-3xs font-bold text-ink-muted uppercase">Tags:</span>
                            {['[Firm_Name]', '[Invoice_Number]', '[Invoice_Amount]', '[Link]'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setData('message_template_sales', (data.message_template_sales || '') + ' ' + tag)}
                                    className="px-1.5 py-0.5 bg-app hover:bg-surface border border-line rounded text-3xs font-mono font-bold text-brand-600 dark:text-brand-400"
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sales Return */}
                    <div className="space-y-2 pt-3 border-t border-line">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted block">Credit Note / Return Template</label>
                        <textarea
                            rows={3}
                            value={data.message_template_returns || ''}
                            onChange={e => setData('message_template_returns', e.target.value)}
                            className="w-full p-3 bg-app text-ink border border-line rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none"
                            placeholder="Greetings from [Firm_Name]. Credit Note / Return [Return_Number] for [Return_Amount] has been processed. Summary: [Link]"
                        />
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-3xs font-bold text-ink-muted uppercase">Tags:</span>
                            {['[Firm_Name]', '[Return_Number]', '[Return_Amount]', '[Link]'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setData('message_template_returns', (data.message_template_returns || '') + ' ' + tag)}
                                    className="px-1.5 py-0.5 bg-app hover:bg-surface border border-line rounded text-3xs font-mono font-bold text-brand-600 dark:text-brand-400"
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Reminder */}
                    <div className="space-y-2 pt-3 border-t border-line">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted block">Manual Receivable Reminder Template</label>
                        <textarea
                            rows={3}
                            value={data.message_template_reminders || ''}
                            onChange={e => setData('message_template_reminders', e.target.value)}
                            className="w-full p-3 bg-app text-ink border border-line rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none"
                            placeholder="Dear [Customer_Name], this is a friendly reminder that invoice #[Invoice_Number] from [Firm_Name] is outstanding. Current amount due: [Due_Amount]. View receipt: [Link]"
                        />
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-3xs font-bold text-ink-muted uppercase">Tags:</span>
                            {['[Customer_Name]', '[Invoice_Number]', '[Due_Amount]', '[Firm_Name]', '[Link]'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setData('message_template_reminders', (data.message_template_reminders || '') + ' ' + tag)}
                                    className="px-1.5 py-0.5 bg-app hover:bg-surface border border-line rounded text-3xs font-mono font-bold text-brand-600 dark:text-brand-400"
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Card: Attachment & Sharing Options */}
                <div className="space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Sharing Preferences</h3>

                        <Toggle
                            enabled={data.whatsapp_offer_pdf !== '0' && data.whatsapp_offer_pdf !== false}
                            onChange={v => setData('whatsapp_offer_pdf', v)}
                            label="Offer PDF Attachment Alongside Draft"
                            description="Opens native mobile share sheet or provides direct PDF receipt download link."
                        />

                        <div className="p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted space-y-1">
                            <p className="font-bold text-ink">Sender Name Source:</p>
                            <p>
                                The <code>[Firm_Name]</code> tag automatically uses your official Business Name configured under{' '}
                                <strong>Business &gt; Business Profile</strong> (currently: <em>{data.business_name || 'VENQORE'}</em>).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
