import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

const DOMAINS = [
    { key: 'sales', label: 'Sales', desc: 'Revenue, orders, customer invoices.' },
    { key: 'finance', label: 'Finance', desc: 'Cash accounts, profits, balance status.' },
    { key: 'operations', label: 'Operations', desc: 'Inventory, stock levels, operations.' },
    { key: 'staff', label: 'Staff', desc: 'Shift clock ins, staff counts.' },
];

const SIZES = [
    { key: 'small', label: 'Small Card (3x2)', desc: 'Perfect for quick numbers and trends.' },
    { key: 'medium', label: 'Medium Card (6x2)', desc: 'Shows detailed lines or bars.' },
    { key: 'large', label: 'Large Card (6x4)', desc: 'Large grids and list tables.' },
    { key: 'full', label: 'Full Width (12x3)', desc: 'Wide timeline trend layouts.' },
];

export default function DashboardBuilderSheet({
    isOpen,
    onClose,
    catalogue = [],
    onSubmit
}) {
    if (!isOpen) return null;

    const [step, setStep] = useState(1);
    const [selectedDomain, setSelectedDomain] = useState('sales');
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedChart, setSelectedChart] = useState(null);
    const [selectedSize, setSelectedSize] = useState('small');

    // Step 1 -> Step 2 transition: Metric filter
    const metricsForDomain = catalogue.filter(m => m.domain === selectedDomain);

    const handleSelectDomain = (domain) => {
        setSelectedDomain(domain);
        setSelectedMetric(null);
        setSelectedChart(null);
        setStep(2);
    };

    const handleSelectMetric = (metric) => {
        setSelectedMetric(metric);
        setSelectedChart(metric.default_chart || 'stat');
        setStep(3);
    };

    const handleSelectChart = (chart) => {
        setSelectedChart(chart);
        setStep(4);
    };

    const handleFinish = () => {
        onSubmit({
            reading_key: selectedMetric.key,
            period: selectedMetric.default_period || 'today',
            chart: selectedChart,
            size: selectedSize
        });
        // Reset states
        setStep(1);
        setSelectedMetric(null);
        setSelectedChart(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />

            {/* Sheet Content Panel */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Add Metric Card</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Steps Navigator */}
                <div className="grid grid-cols-4 border-b border-slate-50 dark:border-slate-800/40 select-none py-2 text-center shrink-0">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-4xs font-black mb-1 ${step >= s ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                {s}
                            </div>
                            <span className={`text-4xs font-bold ${step === s ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-600'}`}>
                                {s === 1 ? 'Domain' : s === 2 ? 'Metric' : s === 3 ? 'Visual' : 'Size'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="grow overflow-y-auto p-4 custom-scrollbar">
                    
                    {/* STEP 1: Domain Selection */}
                    {step === 1 && (
                        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                            <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-1">Select a Domain</h3>
                            {DOMAINS.map(d => (
                                <button
                                    key={d.key}
                                    onClick={() => handleSelectDomain(d.key)}
                                    className="flex flex-col items-start p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-left transition-all duration-200"
                                >
                                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mb-0.5 capitalize">{d.label}</span>
                                    <span className="text-3xs text-slate-400 dark:text-slate-500">{d.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: Metric Picker */}
                    {step === 2 && (
                        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Select a Metric</h3>
                                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-4xs font-bold text-indigo-500 hover:underline">
                                    <ArrowLeft size={10} /> Back
                                </button>
                            </div>
                            {metricsForDomain.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-3xs">
                                    No metrics available for {selectedDomain}.
                                </div>
                            ) : (
                                metricsForDomain.map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => handleSelectMetric(m)}
                                        className="flex flex-col items-start p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-left transition-all duration-200"
                                    >
                                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mb-0.5">{m.label}</span>
                                        <span className="text-3xs text-slate-400 dark:text-slate-500 leading-normal">{m.description}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* STEP 3: Visual Configuration */}
                    {step === 3 && selectedMetric && (
                        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Select Chart Type</h3>
                                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-4xs font-bold text-indigo-500 hover:underline">
                                    <ArrowLeft size={10} /> Back
                                </button>
                            </div>
                            
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-2 text-left">
                                <div className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Selected Metric</div>
                                <div className="font-extrabold text-slate-700 dark:text-slate-200 text-xs">{selectedMetric.label}</div>
                            </div>

                            {selectedMetric.charts.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleSelectChart(c)}
                                    className={`flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-left transition-all duration-200 ${selectedChart === c ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/5' : 'border-slate-100 dark:border-slate-800/60'}`}
                                >
                                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 capitalize">{c}</span>
                                    {selectedChart === c && <Check size={14} className="text-indigo-500" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 4: Sizing / Placement */}
                    {step === 4 && (
                        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Select Card Size</h3>
                                <button onClick={() => setStep(3)} className="flex items-center gap-1 text-4xs font-bold text-indigo-500 hover:underline">
                                    <ArrowLeft size={10} /> Back
                                </button>
                            </div>

                            {SIZES.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setSelectedSize(s.key)}
                                    className={`flex flex-col items-start p-3 border rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-left transition-all duration-200 ${selectedSize === s.key ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/5' : 'border-slate-100 dark:border-slate-800/60'}`}
                                >
                                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mb-0.5">{s.label}</span>
                                    <span className="text-3xs text-slate-400 dark:text-slate-500">{s.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-end select-none">
                    {step === 4 ? (
                        <button
                            onClick={handleFinish}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                        >
                            <span>Add to Dashboard</span>
                            <Check size={14} />
                        </button>
                    ) : (
                        <button
                            disabled={step === 1 && !selectedDomain}
                            onClick={() => setStep(step + 1)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                        >
                            <span>Next Step</span>
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
