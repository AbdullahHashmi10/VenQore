import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Printer, ArrowLeft, Mail, Phone, MapPin, ArrowLeftRight, ShoppingCart, FileText, Edit } from 'lucide-react';
import SellModuleTabs from '@/Components/SellModuleTabs';
import { useAlert } from '@/Contexts/AlertContext';

export default function ProposalShow({ proposal }) {
    const {
        store
    } = usePage().props;

    const { showAlert, showConfirm } = useAlert();

    const handlePrint = () => {
        window.open(route("store.proposals.print", [store.slug, proposal.id]), '_blank');
    };

    const handleConvertToSale = () => {
        showConfirm({
            title: 'Convert to Sale?',
            message: 'This will create a sale and deduct inventory immediately.',
            type: 'warning',
            confirmLabel: 'Yes, Convert',
            onConfirm: () => {
                router.post(route("store.proposals.convert-to-sale", [store.slug, proposal.id]));
            }
        });
    };

    const handleConvertToPreSale = () => {
        showConfirm({
            title: 'Convert to Pre-Sale?',
            message: 'This will create a pre-sale and reserve inventory (no deduction).',
            type: 'info',
            confirmLabel: 'Yes, Convert',
            onConfirm: () => {
                router.post(route("store.proposals.convert-to-presale", [store.slug, proposal.id]));
            }
        });
    };

    // Status color
    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-slate-100 text-slate-600',
            sent: 'bg-blue-100 text-blue-700',
            accepted: 'bg-emerald-100 text-emerald-700',
            declined: 'bg-red-100 text-red-700',
            expired: 'bg-amber-100 text-amber-700',
            converted: 'bg-purple-100 text-purple-700'
        };
        return colors[status] || colors.draft;
    };

    return (
        <OneGlanceLayout title={`Proposal #${proposal.reference_number}`} activeMenu="Sell">
            <Head title={`Proposal #${proposal.reference_number}`} />
            <div className="flex flex-col h-full">
                <SellModuleTabs activeTab="proposals" />

                <div className="pb-8">
                    {/* Print Styles */}
                    <style>{`
                        @media print {
                            @page { margin: 0; }
                            body { -webkit-print-color-adjust: exact; }
                            nav, aside, header, .no-print { display: none !important; }
                            main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                            .print-container { padding: 40px !important; box-shadow: none !important; border: none !important; }
                        }
                    `}</style>

                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6 no-print">
                            <Link
                                href={route("store.proposals.index", {
                                    store_slug: store.slug
                                })}
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                <ArrowLeft size={20} /> Back to Proposals
                            </Link>
                            <div className="flex gap-3">
                                {/* Convert buttons only for pending proposals */}
                                {proposal.status !== 'accepted' && proposal.status !== 'converted' && (
                                    <>
                                        <button
                                            onClick={handleConvertToSale}
                                            className="flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium"
                                        >
                                            <ShoppingCart size={18} /> Convert to Sale
                                        </button>
                                        <button
                                            onClick={handleConvertToPreSale}
                                            className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium"
                                        >
                                            <FileText size={18} /> Convert to Pre-Sale
                                        </button>
                                    </>
                                )}
                                <Link
                                    href={route("store.proposals.edit", [store.slug, proposal.id])}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 font-medium"
                                >
                                    <Edit size={18} /> Edit
                                </Link>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                                >
                                    <Printer size={20} /> Print Proposal
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-8 print-container">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                                            A
                                        </div>
                                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">VENQORE</h1>
                                    </div>
                                    <div className="text-sm text-slate-500 space-y-1">
                                        <p>123 Business Street</p>
                                        <p>City, Country 12345</p>
                                        <p>Phone: +1 234 567 890</p>
                                        <p>Email: info@venqorepos.com</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">PROPOSAL</h2>
                                    <p className="text-slate-500 font-medium">#{proposal.reference_number}</p>
                                    <div className="mt-4 space-y-1 text-sm">
                                        <p className="text-slate-500">Date: <span className="text-slate-800 dark:text-slate-200 font-medium">{new Date(proposal.created_at).toLocaleDateString()}</span></p>
                                        {proposal.valid_until && (
                                            <p className="text-slate-500">Valid Until: <span className="text-slate-800 dark:text-slate-200 font-medium">{new Date(proposal.valid_until).toLocaleDateString()}</span></p>
                                        )}
                                        <p className="text-slate-500">Status: <span className={`uppercase font-bold px-2 py-0.5 rounded-lg text-xs ${getStatusColor(proposal.status)}`}>{proposal.status}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-8 mb-8 grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Prepared For</h3>
                                    {proposal.customer ? (
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-white text-lg">{proposal.customer.name}</p>
                                            {proposal.customer.email && (
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Mail size={14} /> {proposal.customer.email}
                                                </p>
                                            )}
                                            {proposal.customer.phone && (
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Phone size={14} /> {proposal.customer.phone}
                                                </p>
                                            )}
                                            {proposal.customer.address && (
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <MapPin size={14} /> {proposal.customer.address}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">{proposal.customer_name || 'No Customer'}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Proposal Details</h3>
                                    <p className="text-sm text-slate-500">Created By: <span className="font-medium text-slate-800 dark:text-white">{proposal.user?.name || 'Unknown'}</span></p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-8">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3">Item Description</th>
                                            <th className="py-3 text-center">Qty</th>
                                            <th className="py-3 text-right">Unit Price</th>
                                            <th className="py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(proposal.items || []).map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-4">
                                                    <p className="font-bold text-slate-800 dark:text-white">{item.product?.name || item.product_name || 'Unknown Item'}</p>
                                                </td>
                                                <td className="py-4 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                                <td className="py-4 text-right text-slate-600 dark:text-slate-300">Rs {parseFloat(item.unit_price || 0).toLocaleString()}</td>
                                                <td className="py-4 text-right font-medium text-slate-800 dark:text-white">Rs {parseFloat(item.total || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                                    <div className="flex justify-between text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        <span>Total</span>
                                        <span>Rs {parseFloat(proposal.total_amount || 0).toLocaleString()}</span>
                                    </div>
                                    {proposal.expected_margin > 0 && (
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Expected Margin</span>
                                            <span className="font-medium text-emerald-600">Rs {parseFloat(proposal.expected_margin || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {proposal.notes && (
                                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{proposal.notes}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 text-sm">
                                <p>This is a proposal/quotation and not a confirmed order.</p>
                                <p className="mt-1 text-xs">For any inquiries, please contact us at support@venqorepos.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
