import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { 
    Clock, 
    RotateCcw, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Send, 
    FileText 
} from 'lucide-react';

export default function MySubmissions({ documents = { data: [] }, filters = {} }) {
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const docs = Array.isArray(documents) ? documents : (documents.data || []);

    const handleFilter = (status) => {
        setSelectedStatus(status);
        router.get(window.location.pathname, { status: status || undefined }, { preserveState: true });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> Pending</span>;
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
            case 'returned':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"><RotateCcw className="w-3.5 h-3.5" /> Returned for Correction</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <OneGlanceLayout>
            <Head title="My Approval Submissions" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Send className="w-7 h-7 text-indigo-600" />
                            My Submissions (Maker)
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Track the status of transactions you have submitted for manager review and approval.
                        </p>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => handleFilter('')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${!selectedStatus ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        All Statuses
                    </button>
                    <button
                        onClick={() => handleFilter('pending')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Pending Review
                    </button>
                    <button
                        onClick={() => handleFilter('returned')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === 'returned' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Returned for Correction
                    </button>
                    <button
                        onClick={() => handleFilter('approved')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === 'approved' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => handleFilter('rejected')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === 'rejected' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Rejected
                    </button>
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b">
                            <tr>
                                <th className="px-6 py-3.5">Document #</th>
                                <th className="px-6 py-3.5">Type</th>
                                <th className="px-6 py-3.5">Submitted Date</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {docs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-400">
                                        <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        No submitted documents found.
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
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(doc.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {formatCurrency(doc.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={route('store.approvals.show', { store_slug: window.location.pathname.split('/')[2], id: doc.id })}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View
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
