import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Database, Upload, Check, AlertTriangle, ArrowRight,
    FileSpreadsheet, Users, Package, Loader2, HardDrive, RefreshCw
} from 'lucide-react';

export default function Migration() {
    const {
        store
    } = usePage().props;

    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload'); // upload, analyzing, review, importing, results
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [importLog, setImportLog] = useState([]);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAnalyze = () => {
        if (!file) return;

        setStep('analyzing');
        const formData = new FormData();
        formData.append('file', file);

        axios.post(route('admin.migration.analyze'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(res => {
                if (res.data.success) {
                    setAnalysis(res.data);
                    setStep('review');
                } else {
                    setError(res.data.message);
                    setStep('upload');
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Failed to analyze file.');
                setStep('upload');
            });
    };

    const handleExecute = () => {
        if (!analysis) return;
        setStep('importing');

        axios.post(route('admin.migration.execute'), {
            path: analysis.path,
        })
            .then(res => {
                if (res.data.success) {
                    setImportLog(res.data.log);
                    setStep('results');
                } else {
                    setError(res.data.message);
                    setStep('review');
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Import failed.');
                setStep('review');
            });
    };

    return (
        <OneGlanceLayout title="Import from External System">
            <Head title="Migration Tool" />
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl mb-4">
                        <Database size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">System Migration Tool</h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        Seamlessly import your data from Vyapar backups (.vyp).
                        We'll analyze your file and map Customers, Items, and Stock automatically.
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-center mb-12">
                    <div className={`flex flex - col items - center z - 10 ${step === 'upload' ? 'opacity-100' : 'opacity-50'} `}>
                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'} `}>1</div>
                        <span className="text-xs font-bold uppercase">Upload</span>
                    </div>
                    <div className="w-16 h-0.5 bg-slate-200 mx-2"></div>
                    <div className={`flex flex - col items - center z - 10 ${(['analyzing', 'review', 'importing', 'results'].includes(step)) ? 'opacity-100' : 'opacity-50'} `}>
                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${(['review', 'importing', 'results'].includes(step)) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'} `}>2</div>
                        <span className="text-xs font-bold uppercase">Review</span>
                    </div>
                    <div className="w-16 h-0.5 bg-slate-200 mx-2"></div>
                    <div className={`flex flex - col items - center z - 10 ${step === 'results' ? 'opacity-100' : 'opacity-50'} `}>
                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === 'results' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'} `}>3</div>
                        <span className="text-xs font-bold uppercase">Done</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[400px] relative">

                    {error && (
                        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-6 py-3 text-sm font-bold flex items-center justify-center animate-in slide-in-from-top">
                            <AlertTriangle size={18} className="mr-2" />
                            {error}
                        </div>
                    )}

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-full max-w-md p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50">
                                <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                                <h3 className="font-bold text-lg mb-2">Drop your .vyp file here</h3>
                                <p className="text-xs text-slate-500 mb-6">Found in AppData/Roaming/Vyaparapp/DBUpdateBackup</p>

                                <input
                                    type="file"
                                    accept=".vyp,.db,.sqlite"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4"
                                />

                                {file && (
                                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-mono text-sm inline-block">
                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!file}
                                onClick={handleAnalyze}
                                className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                            >
                                Analyze File <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: ANALYZING */}
                    {step === 'analyzing' && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                            <h3 className="font-bold text-lg">Scanning Database...</h3>
                            <p className="text-slate-500">Identifying Parties, Items, and transaction history.</p>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 'review' && analysis && (
                        <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                    <h3 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 mb-1">Parties</h3>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                                        {analysis.analysis.potential_parties}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1">Items</h3>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                                        {analysis.analysis.potential_items}
                                    </p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                                    <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400 mb-1">Sales</h3>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                                        {analysis.analysis.potential_sales}
                                    </p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800">
                                    <h3 className="font-bold text-sm text-purple-700 dark:text-purple-400 mb-1">Purchases</h3>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                                        {analysis.analysis.potential_purchases}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-8 flex-1 overflow-y-auto">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Raw Table Data Detected</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(analysis.tables).map(([name, count]) => (
                                        <div key={name} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-700 rounded border border-slate-100 dark:border-slate-600">
                                            <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[120px]" title={name}>{name}</span>
                                            <span className="font-bold bg-slate-100 dark:bg-slate-600 px-1.5 rounded">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center mt-auto">
                                <button
                                    onClick={handleExecute}
                                    className="w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                                >
                                    <RefreshCw size={20} />
                                    Start Migration Process
                                </button>
                                <p className="text-xs text-slate-400 mt-3">This action will merge data into your existing system. No existing data will be overwritten.</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: IMPORTING */}
                    {step === 'importing' && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="mb-6 relative">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                                <RefreshCw size={64} className="animate-spin text-indigo-600 relative z-10" />
                            </div>
                            <h3 className="font-bold text-2xl mb-2">Importing Data...</h3>
                            <p className="text-slate-500 max-w-sm">Please wait while we transfer your accounts and inventory. Do not close this window.</p>
                        </div>
                    )}

                    {/* STEP 5: RESULTS */}
                    {step === 'results' && (
                        <div className="p-12 h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <Check size={40} strokeWidth={4} />
                            </div>
                            <h3 className="font-bold text-3xl mb-4 text-slate-900 dark:text-white">Migration Successful!</h3>
                            <p className="text-slate-500 mb-8 max-w-md">
                                Your external data has been successfully imported. You can now view your new customers and products in the system.
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl w-full max-w-lg mb-8 text-left max-h-48 overflow-y-auto">
                                {importLog.map((log, i) => (
                                    <div key={i} className="text-xs font-mono text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-center gap-2">
                                        <Check size={12} className="text-green-500" /> {log}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => router.visit(route("store.parties.index", {
                                    store_slug: store.slug
                                }))} className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                                    View Parties
                                </button>
                                <button onClick={() => router.visit(route("store.inventory.index", {
                                    store_slug: store.slug
                                }))} className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-colors">
                                    View Products
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
