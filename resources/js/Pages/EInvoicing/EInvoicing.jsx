import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    FileText,
    Search,
    Download,
    Plus,
    Truck,
    Globe,
    CheckCircle,
    XCircle,
    AlertTriangle,
    QrCode,
    Printer
} from 'lucide-react';

export default function EInvoicingIndex({ invoices = [], stats = {}, fbr_enabled = false }) {
    const [activeTab, setActiveTab] = useState('e-invoice'); // 'e-invoice' or 'e-way-bill'
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState('');

    // E-Way Bill Form State
    const [selectedSale, setSelectedSale] = useState(null);
    const [transporterName, setTransporterName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [isSubmittingWaybill, setIsSubmittingWaybill] = useState(false);

    // Filter invoices by search query
    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchesSearch = !searchTerm ||
                invoice.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.fbr_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.eway_bill_number?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [invoices, searchTerm]);

    // Unreported invoices for selection inside the modal
    const unreportedInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            if (activeTab === 'e-invoice') {
                if (invoice.is_fbr_reported) return false;
            } else {
                if (invoice.eway_bill_number) return false;
            }
            
            const matchesSearch = !modalSearch ||
                invoice.reference_number?.toLowerCase().includes(modalSearch.toLowerCase()) ||
                invoice.customer?.name?.toLowerCase().includes(modalSearch.toLowerCase());
            return matchesSearch;
        });
    }, [invoices, modalSearch, activeTab]);

    // Handle reporting to FBR
    const handleReport = (saleId) => {
        router.post(route('store.e-invoicing.generate'), {
            sale_id: saleId
        }, {
            preserveScroll: true
        });
    };

    // Handle E-Way Bill Generation Submission
    const handleWaybillSubmit = (e) => {
        e.preventDefault();
        if (!selectedSale || !transporterName || !vehicleNumber) return;

        setIsSubmittingWaybill(true);
        router.post(route('store.e-invoicing.waybill'), {
            sale_id: selectedSale.id,
            transporter_name: transporterName,
            vehicle_number: vehicleNumber
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setSelectedSale(null);
                setTransporterName('');
                setVehicleNumber('');
                setIsSubmittingWaybill(false);
            },
            onError: () => {
                setIsSubmittingWaybill(false);
            }
        });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSale(null);
        setTransporterName('');
        setVehicleNumber('');
    };

    return (
        <OneGlanceLayout title="E-Invoicing & E-Way Bill" activeMenu="Sales">
            <Head title="E-Invoicing" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                                <QrCode className="text-cyan-600 dark:text-cyan-400" size={24} />
                            </div>
                            E-Invoicing & E-Way Bill
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Generate and manage government mandated electronic documents</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setActiveTab('e-invoice'); handleCloseModal(); }}
                            className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'e-invoice'
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            E-Invoices
                        </button>
                        <button
                            onClick={() => { setActiveTab('e-way-bill'); handleCloseModal(); }}
                            className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'e-way-bill'
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            E-Way Bills
                        </button>
                    </div>
                </div>

                {/* Integration Disabled Warning */}
                {activeTab === 'e-invoice' && !fbr_enabled && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">FBR E-Invoicing Integration Disabled</h4>
                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                Electronic invoice reporting to the Federal Board of Revenue is currently disabled. Go to Settings in the Admin Panel to enable FBR integration and set your POS ID.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                                {activeTab === 'e-invoice' ? (
                                    <FileText className="text-cyan-600 dark:text-cyan-400" size={20} />
                                ) : (
                                    <Truck className="text-cyan-600 dark:text-cyan-400" size={20} />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Generated Today</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">
                                    {activeTab === 'e-invoice' ? (stats.generated_today || 0) : (stats.waybills_today || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Success Rate</p>
                                <p className="text-2xl font-black text-emerald-600">{stats.success_rate || '100%'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Pending Generation</p>
                                <p className="text-2xl font-black text-amber-600">
                                    {activeTab === 'e-invoice' ? (stats.pending_generation || 0) : (stats.pending_waybills || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <XCircle className="text-red-600 dark:text-red-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Failed / Errors</p>
                                <p className="text-2xl font-black text-red-600">{stats.failed_errors || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab === 'e-invoice' ? 'E-Invoices' : 'E-Way Bills'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-bold shadow-lg shadow-cyan-500/20"
                        >
                            <Plus size={18} />
                            Generate New {activeTab === 'e-invoice' ? 'E-Invoice' : 'E-Way Bill'}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Doc Number</th>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">{activeTab === 'e-invoice' ? 'Ack No / Bill No' : 'Waybill Reference'}</th>
                                    {activeTab === 'e-way-bill' && <th className="px-6 py-4 text-left">Transporter / Vehicle</th>}
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'e-way-bill' ? 8 : 7} className="px-6 py-12 text-center">
                                            <QrCode size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                            <p className="text-slate-500 font-medium">No {activeTab === 'e-invoice' ? 'E-Invoices' : 'E-Way Bills'} found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice) => {
                                        const isWaybillGenerated = !!invoice.eway_bill_number;
                                        
                                        return (
                                            <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {new Date(invoice.posted_at || invoice.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {invoice.reference_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                    {invoice.customer?.name || 'Walk-in Customer'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-800 dark:text-slate-200">
                                                    Rs {new Intl.NumberFormat().format(invoice.total)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-500 dark:text-slate-400 font-mono">
                                                    {activeTab === 'e-invoice' ? (invoice.fbr_invoice_number || '-') : (invoice.eway_bill_number || '-')}
                                                </td>
                                                {activeTab === 'e-way-bill' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                        {invoice.transporter_name ? (
                                                            <div>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{invoice.transporter_name}</p>
                                                                <p className="text-xs text-slate-400 font-mono">{invoice.vehicle_number}</p>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    {activeTab === 'e-invoice' ? (
                                                        invoice.is_fbr_reported ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                <CheckCircle size={12} /> Reported
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                                <AlertTriangle size={12} /> Pending
                                                            </span>
                                                        )
                                                    ) : (
                                                        isWaybillGenerated ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                <CheckCircle size={12} /> Generated
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                                <AlertTriangle size={12} /> Pending
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    {activeTab === 'e-invoice' ? (
                                                        invoice.is_fbr_reported ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (invoice.fbr_qr_data) {
                                                                        window.open(invoice.fbr_qr_data, '_blank');
                                                                    } else {
                                                                        alert('QR Code verification details not available.');
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 rounded-lg transition-colors font-bold text-xs"
                                                            >
                                                                <QrCode size={14} /> Verify QR
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleReport(invoice.id)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-bold text-xs shadow-md shadow-cyan-500/10"
                                                            >
                                                                Report
                                                            </button>
                                                        )
                                                    ) : (
                                                        isWaybillGenerated ? (
                                                            <button
                                                                onClick={() => {
                                                                    alert(`E-Way Bill Details:\n\nWaybill No: ${invoice.eway_bill_number}\nTransporter: ${invoice.transporter_name}\nVehicle No: ${invoice.vehicle_number}`);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 rounded-lg transition-colors font-bold text-xs"
                                                            >
                                                                <Printer size={14} /> Print Waybill
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedSale(invoice);
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-bold text-xs shadow-md shadow-cyan-500/10"
                                                            >
                                                                Generate EWB
                                                            </button>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {selectedSale ? 'Enter Transport Details' : `Generate New ${activeTab === 'e-invoice' ? 'E-Invoice' : 'E-Way Bill'}`}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedSale ? `Provide shipping details for invoice ${selectedSale.reference_number}` : 'Select a posted transaction to report electronically'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            {selectedSale ? (
                                <form onSubmit={handleWaybillSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transporter Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. DHL, FedEx, Fast Logistics"
                                                value={transporterName}
                                                onChange={(e) => setTransporterName(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-sm text-slate-800 dark:text-white font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vehicle Number</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. ABC-1234, LH-5544"
                                                value={vehicleNumber}
                                                onChange={(e) => setVehicleNumber(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-sm text-slate-800 dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSale(null)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingWaybill}
                                            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                                        >
                                            {isSubmittingWaybill ? 'Generating...' : 'Generate E-Way Bill'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by invoice number or customer name..."
                                            value={modalSearch}
                                            onChange={(e) => setModalSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-sm text-slate-800 dark:text-white font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {unreportedInvoices.length === 0 ? (
                                            <p className="text-center text-sm text-slate-500 py-8">
                                                No pending unreported transactions found.
                                            </p>
                                        ) : (
                                            unreportedInvoices.map((sale) => (
                                                <div key={sale.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{sale.reference_number}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {sale.customer?.name || 'Walk-in Customer'} • {new Date(sale.posted_at || sale.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                                                            Rs {new Intl.NumberFormat().format(sale.total)}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (activeTab === 'e-invoice') {
                                                                    handleReport(sale.id);
                                                                    setIsModalOpen(false);
                                                                } else {
                                                                    setSelectedSale(sale);
                                                                }
                                                            }}
                                                            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
                                                        >
                                                            {activeTab === 'e-invoice' ? 'Report' : 'Select'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
