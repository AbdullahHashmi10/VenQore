import React, { useState, useEffect } from 'react';
import { usePage, Head, router, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { ArrowLeft, CheckCircle2, AlertTriangle, Play, XCircle } from 'lucide-react';

export default function DataMapping({ file_path, type, file_headers, preview_data, expected_fields }) {
    const { store } = usePage().props;
    const [mapping, setMapping] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationData, setValidationData] = useState(null);
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);
    const [overrides, setOverrides] = useState({}); 
    const [ignoredRows, setIgnoredRows] = useState([]);
    const [editingContext, setEditingContext] = useState(null); 

    // Initialize mapping based on header string matching
    useEffect(() => {
        const initialMapping = {};
        expected_fields.forEach(field => {
            const exactMatch = file_headers.find(h => h.name.toLowerCase().trim() === field.key.toLowerCase().trim());
            const looseMatch = file_headers.find(h => h.name.toLowerCase().trim() === field.label.toLowerCase().trim() || field.label.toLowerCase().includes(h.name.toLowerCase().trim()));

            if (exactMatch) {
                initialMapping[field.key] = exactMatch.index;
            } else if (looseMatch) {
                initialMapping[field.key] = looseMatch.index;
            } else {
                initialMapping[field.key] = "";
            }
        });
        setMapping(initialMapping);
    }, [expected_fields, file_headers]);

    const handleMappingChange = (expectedKey, value) => {
        setMapping(prev => ({
            ...prev,
            [expectedKey]: value === "" ? null : parseInt(value)
        }));
        setValidationData(null);
    };

    const runValidation = async (currentOverrides = overrides, currentIgnored = ignoredRows) => {
        const missingRequired = expected_fields.filter(field => field.required && mapping[field.key] == null);
        if (missingRequired.length > 0) {
            alert(`Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`);
            return;
        }

        setIsValidating(true);
        try {
            const response = await fetch(route('store.admin.data.validate-import', { store_slug: store.slug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ 
                    file_path, 
                    type, 
                    mapping, 
                    overrides: currentOverrides, 
                    ignored_rows: currentIgnored,
                    options: {
                        allow_negative_stock: allowNegativeStock
                    }
                })
            });
            const data = await response.json();
            if (data.success) {
                setValidationData(data);
            } else {
                alert(data.error || 'Validation failed.');
            }
        } catch (e) {
            alert('Error running validation: ' + e.message);
        } finally {
            setIsValidating(false);
        }
    };

    const submitImport = () => {
        setIsProcessing(true);
        router.post(route('store.admin.data.process-import', { store_slug: store.slug }), {
            file_path,
            type,
            mapping,
            overrides,
            ignored_rows: ignoredRows,
            options: {
                allow_negative_stock: allowNegativeStock
            }
        }, {
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleSkip = (rowIndex) => {
        const newIgnored = [...ignoredRows, rowIndex];
        setIgnoredRows(newIgnored);
        runValidation(overrides, newIgnored);
    };

    const handleBatchSave = (rows) => {
        const newOverrides = { ...overrides };
        rows.forEach(r => {
            if (r.index && !r.is_db) {
                newOverrides[r.index] = r.data;
            }
        });
        setOverrides(newOverrides);
        setEditingContext(null);
        runValidation(newOverrides, ignoredRows);
    };

    const FIELD_MAPS = {
        parties: [
            { key: 'name', label: 'Contact Name' },
            { key: 'phone', label: 'Phone Number', placeholder: 'e.g. +923001234567' },
            { key: 'email', label: 'Email' },
            { key: 'address', label: 'Address' }
        ],
        products: [
            { key: 'name', label: 'Product Name' },
            { key: 'sku', label: 'SKU / Barcode' },
            { key: 'price', label: 'Selling Price' },
            { key: 'cost_price', label: 'Cost Price' },
            { key: 'opening_stock', label: 'Opening Qty' }
        ],
        sales: [
            { key: 'invoice_number', label: 'Invoice #' },
            { key: 'customer_name', label: 'Customer' },
            { key: 'product_name', label: 'Product' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unit_price', label: 'Price' }
        ],
        purchases: [
            { key: 'invoice_number', label: 'Ref / Invoice #' },
            { key: 'supplier_name', label: 'Supplier' },
            { key: 'product_name', label: 'Product' },
            { key: 'quantity', label: 'Qty' },
            { key: 'cost_price', label: 'Cost' }
        ],
        expenses: [
            { key: 'date', label: 'Date (YYYY-MM-DD)' },
            { key: 'category', label: 'Category' },
            { key: 'amount', label: 'Amount' },
            { key: 'reference', label: 'Ref #' }
        ],
        ledger: [
            { key: 'date', label: 'Date' },
            { key: 'account_name', label: 'Account' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' }
        ]
    };

    const currentFields = FIELD_MAPS[type] || FIELD_MAPS.parties;

    const EditColumn = ({ title, subtitle, data, onChange, disabled }) => (
        <div className={`flex-1 space-y-4 p-4 rounded-xl ${disabled ? 'bg-white/5 opacity-50' : 'bg-white/5 border border-white/5'}`}>
            <div>
                <h4 className="text-white font-medium text-sm leading-none">{title}</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {currentFields.map(f => (
                    <div key={f.key}>
                        <label className="text-[10px] text-gray-500 block mb-1">{f.label}</label>
                        <input 
                            type="text" 
                            disabled={disabled}
                            className="w-full bg-[#1E293B] border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-indigo-500 transition-all font-mono"
                            value={data[f.key] || ''}
                            onChange={e => onChange({ ...data, [f.key]: e.target.value })}
                            placeholder={f.placeholder || ''}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <OneGlanceLayout title="Import Column Mapping" activeMenu="Setup">
            <Head title="Data Mapping" />

            {/* Side-by-Side Editing Modal */}
            {editingContext && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Resolve Data Conflict</h3>
                                <p className="text-sm text-gray-400 mt-1">Compare and edit rows to ensure they are unique.</p>
                            </div>
                            <button onClick={() => setEditingContext(null)} className="text-gray-500 hover:text-white transition-colors">
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            {/* Left Column: Original Source */}
                            {editingContext.is_db ? (
                                <EditColumn 
                                    title="Database Record" 
                                    subtitle="Existing Master Data" 
                                    data={editingContext.db_data} 
                                    disabled={true} 
                                />
                            ) : (
                                <EditColumn 
                                    title={`First Seen: Row ${editingContext.first_row_index}`} 
                                    subtitle="Original Entry in File" 
                                    data={editingContext.first_row_data} 
                                    onChange={(d) => setEditingContext({ ...editingContext, first_row_data: d })}
                                />
                            )}

                            <div className="flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                            </div>

                            {/* Right Column: Conflict Target */}
                            <EditColumn 
                                title={`Conflict: Row ${editingContext.row}`} 
                                subtitle="Current Duplicate Entry" 
                                data={editingContext.data} 
                                onChange={(d) => setEditingContext({ ...editingContext, data: d })}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setEditingContext(null)} 
                                className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-all border border-white/5"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleBatchSave([
                                    { index: editingContext.row, data: editingContext.data },
                                    { index: editingContext.first_row_index, data: editingContext.first_row_data }
                                ])} 
                                className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold transition-all shadow-xl shadow-indigo-500/30"
                            >
                                Apply Changes & Fix Conflict
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-4">
                        <Link href={route('store.admin.data', { store_slug: store.slug })} className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-semibold text-white">Map Your Columns for {type.charAt(0).toUpperCase() + type.slice(1)}</h1>
                    </div>
                    {validationData && (
                         <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg">
                            <span className="text-emerald-400 text-sm font-medium">
                                {validationData.new_count} New • {validationData.update_count} Updates 
                                {ignoredRows.length > 0 && <span className="text-gray-400 ml-2">• {ignoredRows.length} Skipped</span>}
                            </span>
                         </div>
                    )}
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">

                    {/* Mapping Controls */}
                    <div className="lg:col-span-1 border border-white/10 rounded-xl bg-[#0F172A] p-6 shadow-2xl flex flex-col min-h-0">
                        <div className="mb-4 shrink-0">
                            <h2 className="text-lg font-medium text-white flex items-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" />
                                Match Columns
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">Select columns to map to fields.</p>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                            {expected_fields.map((field) => (
                                <div key={field.key} className="flex flex-col space-y-1 bg-white/5 p-3 rounded-lg shrink-0">
                                    <label className="text-sm font-medium text-gray-200 flex justify-between">
                                        <span>{field.label} {field.required && <span className="text-red-400">*</span>}</span>
                                    </label>
                                    <select
                                        value={mapping[field.key] !== null ? mapping[field.key] : ""}
                                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                        className={`w-full bg-[#1E293B] border rounded-md text-sm p-2 text-white
                                        ${field.required && mapping[field.key] == null ? 'border-amber-400/50 focus:border-amber-400' : 'border-white/10 focus:border-indigo-500'}`}
                                    >
                                        <option value="">-- Ignore --</option>
                                        {file_headers.map((header) => (
                                            <option key={header.index} value={header.index}>{header.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {type === 'products' && (
                            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative inline-flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={allowNegativeStock}
                                            onChange={(e) => setAllowNegativeStock(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Allow Negative Stock</span>
                                        <p className="text-[10px] text-gray-400">If unchecked, negative opening quantities will be set to 0</p>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-white/10 shrink-0 space-y-3">
                            <button
                                onClick={() => runValidation()}
                                disabled={isValidating || isProcessing}
                                className={`w-full flex justify-center items-center py-2 px-4 rounded-xl text-white text-sm font-medium transition-all
                                ${isValidating ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}
                                `}
                            >
                                {isValidating ? 'Checking for duplicates...' : 'Run Pre-Import Validation'}
                            </button>

                            <button
                                onClick={submitImport}
                                disabled={isProcessing || !validationData}
                                className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-medium transition-all duration-300
                                ${isProcessing || !validationData 
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20'}
                            `}
                            >
                                {isProcessing ? 'Importing...' : 'Confirm & Process Import'}
                            </button>
                            {!validationData && <p className="text-[10px] text-gray-500 text-center">Run validation before importing</p>}
                        </div>
                    </div>

                    {/* Data Preview / Warnings */}
                    <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                        {/* Duplicate Warnings Panel */}
                        {validationData && validationData.warnings && validationData.warnings.length > 0 && (
                            <div className="border border-amber-500/20 rounded-xl bg-amber-500/5 p-4 shrink-0 overflow-y-auto max-h-[250px] custom-scrollbar">
                                <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5" />
                                    Duplicate Warnings ({validationData.warnings.length})
                                </h3>
                                <div className="space-y-3">
                                    {validationData.warnings.map((warn, i) => (
                                        <div key={i} className="flex items-center justify-between gap-4 text-xs text-amber-200/70 border-b border-amber-500/10 pb-2 last:border-0 group">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-amber-400">Row {warn.row}:</span>
                                                    <span className="text-white font-medium">{warn.name}</span>
                                                    <span className="text-gray-400">({warn.phone || 'No phone'})</span>
                                                </div>
                                                <p className="mt-1 text-[10px] text-amber-400/80 italic">{warn.reason}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setEditingContext({ 
                                                        row: warn.row, 
                                                        data: warn.data,
                                                        first_row_index: warn.first_row_index,
                                                        first_row_data: warn.first_row_data,
                                                        is_db: warn.is_db,
                                                        db_data: warn.db_data
                                                    })}
                                                    className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                                                    title="Resolve this conflict"
                                                >
                                                    <Play className="w-3 h-3 rotate-[-90deg]" /> 
                                                </button>
                                                <button 
                                                    onClick={() => handleSkip(warn.row)}
                                                    className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                    title="Skip this row"
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 border border-white/10 rounded-xl bg-[#0F172A] p-6 shadow-2xl flex flex-col min-h-0">
                             <div className="mb-4 shrink-0">
                                <h2 className="text-lg font-medium text-white">Data Preview</h2>
                                <p className="text-sm text-gray-400 mt-1">Found {preview_data.length} records</p>
                            </div>

                            <div className="flex-1 overflow-auto rounded-lg border border-white/10 custom-scrollbar min-h-0">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#1E293B] sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-gray-300 border-b border-white/10 font-medium">#</th>
                                            {expected_fields.map(field => (
                                                <th key={field.key} className={`px-4 py-3 border-b border-white/10 font-medium ${mapping[field.key] != null ? 'text-indigo-300' : 'text-gray-500'}`}>
                                                    {field.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 bg-[#0F172A]">
                                        {preview_data.map((row, index) => (
                                            <tr key={index} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                                                {expected_fields.map(field => {
                                                    const fileColIndex = mapping[field.key];
                                                    const value = fileColIndex != null ? row[fileColIndex] : null;
                                                    return (
                                                        <td key={field.key} className={`px-4 py-2 ${value ? 'text-gray-200' : 'text-gray-600 italic text-xs'}`}>
                                                            {value || '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </OneGlanceLayout>
    );
}
