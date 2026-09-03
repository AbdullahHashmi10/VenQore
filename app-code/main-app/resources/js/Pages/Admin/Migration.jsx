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

        axios.post(route('store.legacy.admin.migration.analyze', { store_slug: store.slug }), formData, {
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

        axios.post(route('store.legacy.admin.migration.execute', { store_slug: store.slug }), {
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
                    <div className="inline-flex items-center justify-center p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl mb-4">
                        <Database size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-ink mb-2">System Migration Tool</h1>
                    <p className="text-ink-muted max-w-lg mx-auto">
                        Seamlessly import your data from Vyapar backups (.vyp).
                        We'll analyze your file and map Customers, Items, and Stock automatically.
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-center mb-12">
                    <div className={`flex flex - col items - center z - 10 ${step === 'upload' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === 'upload' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}>1</div>
                        <span className="text-xs font-bold uppercase">Upload</span>
                    </div>
                    <div className="w-16 h-0.5 bg-sunken mx-2"></div>
                    <div className={`flex flex - col items - center z - 10 ${(['analyzing', 'review', 'importing', 'results'].includes(step)) ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${(['review', 'importing', 'results'].includes(step)) ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}>2</div>
                        <span className="text-xs font-bold uppercase">Review</span>
                    </div>
                    <div className="w-16 h-0.5 bg-sunken mx-2"></div>
                    <div className={`flex flex - col items - center z - 10 ${step === 'results' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === 'results' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}>3</div>
                        <span className="text-xs font-bold uppercase">Done</span>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-line shadow-xl overflow-hidden min-h-[400px] relative">

                    {error && (
                        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-6 py-3 text-sm font-bold flex items-center justify-center animate-in slide-in-from-top">
                            <AlertTriangle size={18} className="mr-2" />
                            {error}
                        </div>
                    )}

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-full max-w-md p-8 border-2 border-dashed border-line dark:border-line rounded-2xl hover:border-brand-500 transition-colors bg-app">
                                <Upload size={48} className="mx-auto text-ink-muted mb-4" />
                                <h3 className="font-bold text-lg mb-2">Drop your .vyp file here</h3>
                                <p className="text-xs text-ink-muted mb-6">Found in AppData/Roaming/Vyaparapp/DBUpdateBackup</p>

                                <input
                                    type="file"
                                    accept=".vyp,.db,.sqlite"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 mb-4"
                                />

                                {file && (
                                    <div className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-mono text-sm inline-block">
                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!file}
                                onClick={handleAnalyze}
                                className="mt-8 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg transition-transform disabled:opacity-50 flex items-center gap-2"
                            >
                                Analyze File <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: ANALYZING */}
                    {step === 'analyzing' && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <Loader2 size={48} className="animate-spin text-brand-600 mb-4" />
                            <h3 className="font-bold text-lg">Scanning Database...</h3>
                            <p className="text-ink-muted">Identifying Parties, Items, and transaction history.</p>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 'review' && analysis && (
                        <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800">
                                    <h3 className="font-bold text-sm text-brand-700 dark:text-brand-400 mb-1">Parties</h3>
                                    <p className="text-2xl font-bold text-ink">
                                        {analysis.analysis.potential_parties}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1">Items</h3>
                                    <p className="text-2xl font-bold text-ink">
                                        {analysis.analysis.potential_items}
                                    </p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                                    <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400 mb-1">Sales</h3>
                                    <p className="text-2xl font-bold text-ink">
                                        {analysis.analysis.potential_sales}
                                    </p>
                                </div>
                                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800">
                                    <h3 className="font-bold text-sm text-brand-700 dark:text-brand-400 mb-1">Purchases</h3>
                                    <p className="text-2xl font-bold text-ink">
                                        {analysis.analysis.potential_purchases}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-app p-4 rounded-xl mb-8 flex-1 overflow-y-auto">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-ink-muted mb-3">Raw Table Data Detected</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(analysis.tables).map(([name, count]) => (
                                        <div key={name} className="flex justify-between items-center text-xs p-2 bg-sunken rounded border border-line dark:border-line">
                                            <span className="font-mono text-ink-secondary truncate max-w-[120px]" title={name}>{name}</span>
                                            <span className="font-bold bg-sunken px-1.5 rounded">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center mt-auto">
                                <button
                                    onClick={handleExecute}
                                    className="w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg transition-transform flex items-center justify-center gap-3"
                                >
                                    <RefreshCw size={20} />
                                    Start Migration Process
                                </button>
                                <p className="text-xs text-ink-muted mt-3">This action will merge data into your existing system. No existing data will be overwritten.</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: IMPORTING */}
                    {step === 'importing' && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="mb-6 relative">
                                <div className="absolute inset-0 bg-brand-500 rounded-full opacity-20 animate-ping"></div>
                                <RefreshCw size={64} className="animate-spin text-brand-600 relative z-10" />
                            </div>
                            <h3 className="font-bold text-2xl mb-2">Importing Data...</h3>
                            <p className="text-ink-muted max-w-sm">Please wait while we transfer your accounts and inventory. Do not close this window.</p>
                        </div>
                    )}

                    {/* STEP 5: RESULTS */}
                    {step === 'results' && (
                        <div className="p-12 h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <Check size={40} strokeWidth={4} />
                            </div>
                            <h3 className="font-bold text-3xl mb-4 text-ink">Migration Successful!</h3>
                            <p className="text-ink-muted mb-8 max-w-md">
                                Your external data has been successfully imported. You can now view your new customers and products in the system.
                            </p>

                            <div className="bg-app p-4 rounded-xl w-full max-w-lg mb-8 text-left max-h-48 overflow-y-auto">
                                {importLog.map((log, i) => (
                                    <div key={i} className="text-xs font-mono text-ink-secondary py-1 border-b border-line last:border-0 flex items-center gap-2">
                                        <Check size={12} className="text-green-500" /> {log}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => router.visit(route("store.parties.index", {
                                    store_slug: store.slug
                                }))} className="px-6 py-2.5 bg-sunken text-ink-secondary hover:bg-interactive-hover rounded-xl font-bold transition-colors">
                                    View Parties
                                </button>
                                <button onClick={() => router.visit(route("store.inventory.index", {
                                    store_slug: store.slug
                                }))} className="px-6 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-bold shadow-lg transition-colors">
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
