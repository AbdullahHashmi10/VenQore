import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { 
    CheckCircle, 
    XCircle, 
    RotateCcw, 
    Eye, 
    Clock, 
    Filter, 
    AlertCircle,
    FileText,
    ShieldCheck
} from 'lucide-react';

export default function ApprovalsInbox({ documents = { data: [] }, filters = {}, stats = {} }) {
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const docs = Array.isArray(documents) ? documents : (documents.data || []);

    const handleFilter = (type) => {
        setSelectedType(type);
        router.get(window.location.pathname, { type: type || undefined, search: searchTerm || undefined }, { preserveState: true });
    };

    return (
        <OneGlanceLayout>
            <Head title="Approvals Inbox" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="w-7 h-7 text-indigo-600" />
                            Approval Inbox (Reviewer)
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review and authorize pending transactions across customer receipts, supplier payments, invoices, and expenses.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link 
                            href={route('store.approvals.my-submissions', { store_slug: window.location.pathname.split('/')[2] })}
                            className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                            My Submissions
                        </Link>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => handleFilter('')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${!selectedType ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        All Types ({docs.length})
                    </button>
                    <button
                        onClick={() => handleFilter('customer_receipt')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === 'customer_receipt' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Customer Receipts
                    </button>
                    <button
                        onClick={() => handleFilter('supplier_payment')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === 'supplier_payment' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Supplier Payments
                    </button>
                    <button
                        onClick={() => handleFilter('sales_invoice')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === 'sales_invoice' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Admin Sales Invoices
                    </button>
                    <button
                        onClick={() => handleFilter('operating_expense')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === 'operating_expense' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Operating Expenses
                    </button>
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b">
                            <tr>
                                <th className="px-6 py-3.5">Document #</th>
                                <th className="px-6 py-3.5">Type</th>
                                <th className="px-6 py-3.5">Maker / Submitted</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {docs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-400">
                                        <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        No pending documents awaiting your review.
                                    </td>
                                </tr>
                            ) : (
                                docs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/75 transition">
                                        <td className="px-6 py-4 font-mono font-medium text-gray-900">
                                            {doc.document_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md">
                                                {doc.document_type?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 font-medium">{doc.maker?.name || 'Staff'}</div>
                                            <div className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {formatCurrency(doc.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                                <Clock className="w-3.5 h-3.5" />
                                                Pending Review
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={route('store.approvals.show', { store_slug: window.location.pathname.split('/')[2], id: doc.id })}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
