import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    ArrowLeft, 
    Calendar, 
    MessageSquare, 
    Mail, 
    Clock, 
    FileText, 
    User, 
    Info, 
    DollarSign,
    CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export default function Create({ invoices = [] }) {
    const { store, settings } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        invoice_id: '',
        scheduled_at: '',
        type: 'whatsapp',
    });

    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Update selected invoice details when invoice_id changes
    useEffect(() => {
        if (data.invoice_id) {
            const invoice = invoices.find(inv => inv.id === data.invoice_id);
            setSelectedInvoice(invoice || null);
        } else {
            setSelectedInvoice(null);
        }
    }, [data.invoice_id, invoices]);

    // Generate dynamic message preview
    const getMessagePreview = () => {
        if (!selectedInvoice) {
            return "Please select an invoice to preview the reminder message.";
        }
        
        const customerName = selectedInvoice.party?.name || 'Customer';
        const reference = selectedInvoice.reference_number || 'Invoice';
        const balanceDue = parseFloat(selectedInvoice.invoice_total ?? selectedInvoice.total ?? 0);
        
        return `Hi ${customerName}, hope you're doing well. Just a friendly reminder about your outstanding balance of ${formatCurrency(balanceDue, store || settings)} for invoice #${reference}. Please let us know if you have any questions or when we can expect payment. Thank you!`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.invoice-reminders.store', { store_slug: store.slug }));
    };

    return (
        <OneGlanceLayout title="Schedule Reminder" activeMenu="Sales">
            <Head title="Schedule Reminder" />
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Back Link */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route('store.invoice-reminders.index', { store_slug: store.slug })}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Schedule Payment Reminder</h1>
                        <p className="text-slate-500 text-sm mt-1">Set up automated notifications for your unpaid invoices</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Form Panel Wrapper */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Select Invoice */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Select Unpaid/Partial Invoice <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.invoice_id}
                                        onChange={(e) => setData('invoice_id', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-orange-500/20 outline-none font-medium appearance-none"
                                    >
                                        <option value="">-- Choose an Invoice --</option>
                                        {invoices.map((invoice) => (
                                            <option key={invoice.id} value={invoice.id}>
                                                {invoice.reference_number} - {invoice.party?.name || 'Unknown'} ({formatCurrency(parseFloat(invoice.invoice_total ?? invoice.total ?? 0), store || settings)})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <FileText size={18} />
                                    </div>
                                </div>
                                {errors.invoice_id && (
                                    <p className="text-red-500 text-xs font-medium">{errors.invoice_id}</p>
                                )}
                            </div>

                            {/* Invoice Info card (if selected) */}
                            {selectedInvoice && (
                                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-slate-500 block">Customer</span>
                                        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
                                            <User size={14} className="text-slate-400" />
                                            {selectedInvoice.party?.name || 'Unknown'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500 block">Amount Due</span>
                                        <span className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5">
                                            <DollarSign size={14} />
                                            {formatCurrency(parseFloat(selectedInvoice.invoice_total ?? selectedInvoice.total ?? 0), store || settings)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Schedule Time */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Scheduled For <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={data.scheduled_at}
                                        onChange={(e) => setData('scheduled_at', e.target.value)}
                                        min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // must be future date
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-orange-500/20 outline-none font-medium text-slate-800 dark:text-white"
                                    />
                                </div>
                                {errors.scheduled_at && (
                                    <p className="text-red-500 text-xs font-medium">{errors.scheduled_at}</p>
                                )}
                            </div>

                            {/* Type/Channel */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Delivery Channel <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'whatsapp')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                            data.type === 'whatsapp'
                                                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 font-bold'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <MessageSquare size={24} />
                                        <span>WhatsApp</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'email')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                            data.type === 'email'
                                                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 font-bold'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <Mail size={24} />
                                        <span>Email</span>
                                    </button>
                                </div>
                                {errors.type && (
                                    <p className="text-red-500 text-xs font-medium">{errors.type}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50"
                                >
                                    <Clock size={18} />
                                    {processing ? 'Scheduling...' : 'Schedule Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Preview Panel */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                <Info size={18} className="text-slate-400" />
                                Reminder Preview
                            </h3>
                            
                            {data.type === 'whatsapp' ? (
                                /* WhatsApp Mock */
                                <div className="bg-[#efeae2] dark:bg-void-800 rounded-xl p-4 min-h-[220px] flex flex-col justify-between border border-emerald-100 dark:border-emerald-950/30">
                                    <div className="space-y-2">
                                        <div className="inline-block bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none p-3.5 text-sm shadow-sm max-w-[85%] whitespace-pre-wrap leading-relaxed relative">
                                            {getMessagePreview()}
                                            <span className="block text-2xs text-slate-400 text-right mt-1.5">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-center text-xs text-slate-400 mt-4 italic">
                                        Simulated WhatsApp delivery
                                    </div>
                                </div>
                            ) : (
                                /* Email Mock */
                                <div className="bg-white dark:bg-slate-950 rounded-xl p-4 min-h-[220px] flex flex-col justify-between border border-slate-200 dark:border-slate-800">
                                    <div className="space-y-3">
                                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2 text-xs text-slate-400 space-y-1">
                                            <div><span className="font-bold">From:</span> system@venqore.com</div>
                                            <div><span className="font-bold">To:</span> {selectedInvoice?.party?.email || 'customer@email.com'}</div>
                                            <div><span className="font-bold">Subject:</span> Friendly Payment Reminder: Invoice #{selectedInvoice?.reference_number || '----'}</div>
                                        </div>
                                        <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                            {getMessagePreview()}
                                        </div>
                                    </div>
                                    <div className="text-center text-xs text-slate-400 mt-4 italic">
                                        Simulated Email delivery
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </OneGlanceLayout>
    );
}
