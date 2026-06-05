import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
    X, Camera, Mic, Upload, Loader2, Sparkles, FileText, CheckCircle2, 
    AlertTriangle, RefreshCw, Plus, CreditCard, ChevronRight, User 
} from 'lucide-react';
import axios from 'axios';

export default function SmartCapturePanel({ isOpen, onClose, initialTab = 'image' }) {
    const { store } = usePage().props;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Image upload state
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    // Audio recording state
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // AI Extracted data review state
    const [extractedData, setExtractedData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [confirming, setConfirming] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [targetType, setTargetType] = useState('');
    const [customCommand, setCustomCommand] = useState('');

    // Auto record timer
    useEffect(() => {
        if (recording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [recording]);

    if (!isOpen) return null;

    // Format recording timer
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Drag-and-drop image handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError("Unsupported file format. Please upload JPG, PNG or PDF.");
            return;
        }

        // Limit size
        if (file.size > 10 * 1024 * 1024) {
            setError("File size exceeds 10MB limit.");
            return;
        }

        setSelectedFile(file);
        setError(null);

        // Preview images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null); // PDFs don't get simple image previews
        }
    };

    // HTML5 MediaRecorder Audio handlers
    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Set options if supported
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/mp4' };
            }

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const mime = options.mimeType;
                const blob = new Blob(audioChunksRef.current, { type: mime });
                setAudioBlob(blob);
                
                // Stop audio track capture stream
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setRecording(true);

        } catch (err) {
            console.error('Audio capture failed:', err);
            setError("Permission denied. Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    // Convert file to base64 and POST to backend extract endpoint
    const handleExtract = async () => {
        setLoading(true);
        setError(null);
        setExtractedData(null);

        try {
            let fileData = null;
            let mimeType = null;
            let captureType = activeTab;

            if (activeTab === 'image') {
                if (!selectedFile) {
                    setError("Please select or drop an invoice first.");
                    setLoading(false);
                    return;
                }
                mimeType = selectedFile.type;
                fileData = await convertToBase64(selectedFile);
            } else {
                if (!audioBlob) {
                    setError("Please record a voice memo first.");
                    setLoading(false);
                    return;
                }
                mimeType = audioBlob.type;
                fileData = await convertToBase64(audioBlob);
            }

            const cleanBase64 = fileData.split(',')[1];

            const response = await axios.post(route('store.smart-capture.extract', { store_slug: store.slug }), {
                type: captureType,
                base64: cleanBase64,
                mime_type: mimeType,
                target_type: targetType || null,
                custom_command: customCommand || null
            });

            if (response.data.success) {
                setExtractedData(response.data);
                // Auto choose payment method based on invoice type
                setPaymentMethod(response.data.action === 'purchase' ? 'credit' : 'cash');
            } else {
                setError(response.data.message || "Failed to extract transaction details.");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Gemini Extraction API call failed. Please check your credentials.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
        });
    };

    // Line items modification helper
    const handleItemChange = (idx, field, value) => {
        setExtractedData(prev => {
            const updatedItems = [...prev.items];
            updatedItems[idx] = { ...updatedItems[idx], [field]: value };
            return { ...prev, items: updatedItems };
        });
    };

    // Confirms and posts final transaction
    const handleConfirmTransaction = async () => {
        if (!extractedData || confirming) return;

        setConfirming(true);
        setError(null);

        // Prepare line items
        const postItems = extractedData.items.map(item => ({
            product_id: item.product_id,
            qty: parseFloat(item.qty || 1),
            unit_price: parseFloat(item.unit_price || 0),
            name: item.raw_name
        }));

        const payload = {
            action: extractedData.action,
            party: extractedData.party,
            payment_method: paymentMethod,
            items: postItems
        };

        try {
            const response = await axios.post(route('store.smart-capture.confirm', { store_slug: store.slug }), payload);
            if (response.data.success) {
                setSuccessData(response.data.data);
            } else {
                setError(response.data.message || "Failed to post transaction.");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Transaction creation failed. Check database logs.";
            setError(msg);
        } finally {
            setConfirming(false);
        }
    };

    // Calculate total summary of review rows
    const calculateGrossTotal = () => {
        if (!extractedData) return 0;
        return extractedData.items.reduce((sum, item) => sum + (parseFloat(item.qty || 1) * parseFloat(item.unit_price || 0)), 0).toFixed(2);
    };

    const navigateToSuccessDoc = () => {
        if (!successData) return;
        onClose();
        
        let path = null;
        if (successData.type === 'purchase') {
            path = route('store.v3.purchases.show', { store_slug: store.slug, purchase: successData.id });
        } else if (successData.type === 'sale' || successData.type === 'invoice') {
            path = route('store.sales.dashboard', { store_slug: store.slug }); // Or show standard sale page
        } else if (successData.type === 'expense') {
            path = route('store.expenses.index', { store_slug: store.slug });
        } else if (successData.type === 'return') {
            path = route('store.returns-history.index', { store_slug: store.slug });
        } else if (successData.type === 'proposal') {
            path = route('store.proposals.show', { store_slug: store.slug, proposal: successData.id });
        } else if (successData.type === 'pre_invoice') {
            path = route('store.sales-orders.show', { store_slug: store.slug, sales_order: successData.id });
        } else if (successData.type === 'pre_purchase') {
            path = route('store.purchase-orders.show', { store_slug: store.slug, purchase_order: successData.id });
        } else if (successData.type === 'recurring_invoice') {
            path = route('store.recurring-invoices.index', { store_slug: store.slug });
        } else if (successData.type === 'purchase_return') {
            path = route('store.debit-notes.show', { store_slug: store.slug, id: successData.id });
        }

        if (path) {
            router.visit(path);
        }
    };

    const renderAdvancedControls = () => (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-slate-50/50 dark:bg-slate-850/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 relative z-20">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1">1. What would you like to create?</label>
                <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 dark:text-white cursor-pointer"
                >
                    <option value="">No Preference (Auto-Detect)</option>
                    <option value="sale">Sales Invoice (Invoice/Sale)</option>
                    <option value="purchase">Purchase (Bill/Purchase)</option>
                    <option value="expense">Operating Expense</option>
                    <option value="return">Sales Return</option>
                    <option value="proposal">Proposal</option>
                    <option value="pre_invoice">Pre-Invoice (Sales Order)</option>
                    <option value="pre_purchase">Pre-Purchase (Purchase Order)</option>
                    <option value="recurring_invoice">Recurring Invoice</option>
                    <option value="purchase_return">Purchase Return (Debit Note)</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1">2. Give Text Commands / Instructions (Optional)</label>
                <input
                    type="text"
                    value={customCommand}
                    onChange={e => setCustomCommand(e.target.value)}
                    placeholder="e.g. 'Use wholesale prices', 'Skip tax'"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 dark:text-white font-medium"
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden h-[680px] relative">
                {/* Midnight Nebula glow blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="p-6 bg-slate-900 text-white shrink-0 flex items-center justify-between border-b border-slate-800 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <Sparkles size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">SmartCapture Intake</h2>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">AI-Powered Transaction Entry</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/55 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-hidden flex flex-col relative z-10">
                    {successData ? (
                        /* SUCCESS STATE */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-350">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mb-6 shadow-inner animate-bounce">
                                <CheckCircle2 size={44} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Transaction Created!</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                Structured {successData.type} transaction successfully processed and balancing double-entry journal items posted.
                            </p>
                            
                            <div className="mt-8 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 max-w-sm w-full space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span>Type:</span>
                                    <span className="text-slate-800 dark:text-white uppercase font-bold">{successData.type}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span>Reference ID:</span>
                                    <span className="text-slate-800 dark:text-white font-mono">{successData.reference}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span>Total:</span>
                                    <span className="text-slate-800 dark:text-white font-black">Rs. {Math.abs(successData.total).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => {
                                        setSuccessData(null);
                                        setExtractedData(null);
                                        setSelectedFile(null);
                                        setAudioBlob(null);
                                    }}
                                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    Record Another
                                </button>
                                <button
                                    onClick={navigateToSuccessDoc}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                                >
                                    <span>View Transaction</span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ) : extractedData ? (
                        /* AI REVIEW & CONFIRMATION ROW LIST */
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
                            {/* Panel settings strip */}
                            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    {/* Action Intent Selector */}
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Transaction Intent</label>
                                        <select
                                            value={extractedData.action}
                                            onChange={(e) => setExtractedData({ ...extractedData, action: e.target.value })}
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-2 py-1 outline-none text-slate-800 dark:text-white"
                                        >
                                            <option value="sale">Sales Invoice</option>
                                            <option value="purchase">Purchase</option>
                                            <option value="expense">Operating Expense</option>
                                            <option value="return">Sales Return</option>
                                            <option value="proposal">Proposal</option>
                                            <option value="pre_invoice">Pre-Invoice (Sales Order)</option>
                                            <option value="pre_purchase">Pre-Purchase (Purchase Order)</option>
                                            <option value="recurring_invoice">Recurring Invoice</option>
                                            <option value="purchase_return">Purchase Return (Debit Note)</option>
                                        </select>
                                    </div>

                                    {/* Customer/Supplier Party details */}
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Party / Business Context</label>
                                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                                            <User size={12} className="text-slate-400" />
                                            <input
                                                type="text"
                                                value={extractedData.party || ''}
                                                onChange={(e) => setExtractedData({ ...extractedData, party: e.target.value })}
                                                className="bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white p-0 w-36 focus:ring-0"
                                                placeholder="Walk-in Guest / Vendor"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Payment Method</label>
                                    <div className="flex gap-1.5">
                                        {['cash', 'credit', 'bank'].map((method) => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => setPaymentMethod(method)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all border ${
                                                    paymentMethod === method
                                                        ? 'bg-slate-900 border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 text-white font-black'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table container */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="space-y-3">
                                    {extractedData.items.map((item, idx) => {
                                        // Colors based on confidence tiers
                                        const isHigh = item.confidence >= 90;
                                        const isMedium = item.confidence >= 60 && item.confidence < 90;
                                        
                                        return (
                                            <div 
                                                key={idx}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                                                    isHigh ? 'bg-emerald-500/5 border-emerald-500/10' :
                                                    isMedium ? 'bg-amber-500/5 border-amber-500/10' :
                                                    'bg-rose-500/5 border-rose-500/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Raw name extracted from AI */}
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Raw AI Text: "{item.raw_name}"</span>
                                                        
                                                        {/* Target DB Product Match Selector */}
                                                        <div className="mt-1">
                                                            {item.candidates && item.candidates.length > 0 ? (
                                                                <select
                                                                    value={item.product_id || ''}
                                                                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none"
                                                                >
                                                                    <option value="" disabled>-- Match a store product --</option>
                                                                    {item.candidates.map(c => (
                                                                        <option key={c.id} value={c.id}>
                                                                            {c.name} (SKU: {c.sku} | Match: {c.confidence}%)
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="text-rose-500 text-xs font-bold block mt-1 flex items-center gap-1">
                                                                    <AlertTriangle size={12} />
                                                                    No matches found in store catalog.
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Inputs for Qty & Price */}
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Quantity</label>
                                                            <input
                                                                type="number"
                                                                value={item.qty}
                                                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                                                className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-center focus:ring-0 outline-none"
                                                                min="0.0001"
                                                                step="any"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Unit Price</label>
                                                            <input
                                                                type="number"
                                                                value={item.unit_price || 0}
                                                                onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                                                className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-center focus:ring-0 outline-none"
                                                                min="0"
                                                                step="any"
                                                            />
                                                        </div>

                                                        {/* Visual confidence tag */}
                                                        <div className="pt-4">
                                                            <span className={`px-2 py-1 text-[8px] font-black uppercase rounded-full ${
                                                                isHigh ? 'bg-emerald-150 text-emerald-700' :
                                                                isMedium ? 'bg-amber-150 text-amber-700' :
                                                                'bg-rose-150 text-rose-700'
                                                            }`}>
                                                                {item.confidence}% Match
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Review Action Footer */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-slate-55/40 dark:bg-slate-900/60 backdrop-blur-md">
                                <div className="text-sm">
                                    <span className="text-slate-400 font-medium">Estimated Gross:</span>{' '}
                                    <span className="font-black text-slate-800 dark:text-white text-base">Rs. {calculateGrossTotal()}</span>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setExtractedData(null)}
                                        className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Re-Intake
                                    </button>
                                    <button
                                        onClick={handleConfirmTransaction}
                                        disabled={confirming || extractedData.items.some(i => !i.product_id)}
                                        className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/10 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                                    >
                                        {confirming ? (
                                            <div className="flex items-center gap-1.5">
                                                <Loader2 className="animate-spin" size={14} />
                                                <span>Posting...</span>
                                            </div>
                                        ) : (
                                            <span>Post Transaction</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        /* LOADING PARSING STATE */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                                <div className="absolute w-16 h-16 rounded-full border-4 border-indigo-500/10 border-t-indigo-600 border-r-indigo-600 animate-spin" />
                                <Sparkles className="text-indigo-500 animate-pulse" size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Gemini Intake in Progress...</h3>
                            <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                                Uploading base64 payload to model for field extraction and fuzzy-matching candidates...
                            </p>
                        </div>
                    ) : (
                        /* INTAKE INPUT PANELS */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Tab Switcher */}
                            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <button
                                    onClick={() => { setActiveTab('image'); setError(null); }}
                                    className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                                        activeTab === 'image'
                                            ? 'border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Camera size={14} />
                                    Invoice Snap
                                </button>
                                <button
                                    onClick={() => { setActiveTab('audio'); setError(null); }}
                                    className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                                        activeTab === 'audio'
                                            ? 'border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Mic size={14} />
                                    Voice Memo
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {error && (
                                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-850 dark:text-rose-300 text-xs font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
                                        <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {renderAdvancedControls()}

                                {activeTab === 'image' ? (
                                    /* IMAGE SNAP TAB */
                                    <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                                        <div
                                            onDragEnter={handleDrag}
                                            onDragOver={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDrop={handleDrop}
                                            className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all ${
                                                dragActive
                                                    ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]'
                                                    : selectedFile
                                                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                                            }`}
                                        >
                                            {filePreview ? (
                                                <div className="relative max-w-sm max-h-[220px] rounded-2xl overflow-hidden shadow border border-slate-200 dark:border-slate-700">
                                                    <img src={filePreview} alt="Invoice Snap Preview" className="w-full object-contain" />
                                                    <button
                                                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : selectedFile ? (
                                                <div className="text-center">
                                                    <FileText className="text-indigo-500 mx-auto mb-3" size={48} />
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedFile.name}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                                                    <button
                                                        onClick={() => setSelectedFile(null)}
                                                        className="mt-4 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all"
                                                    >
                                                        Remove File
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center max-w-xs">
                                                    <Upload className="text-slate-400 mx-auto mb-4" size={40} />
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload supplier invoice</p>
                                                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                                        Drag and drop invoice image or PDF, or click here to browse files (max 10MB)
                                                    </p>
                                                    
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                        id="capture-file-picker"
                                                    />
                                                    <label
                                                        htmlFor="capture-file-picker"
                                                        className="mt-6 inline-block px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-850 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow"
                                                    >
                                                        Browse Files
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 shrink-0 text-right">
                                            <button
                                                onClick={handleExtract}
                                                disabled={!selectedFile}
                                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                            >
                                                Proceed to Extract
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* VOICE MEMO TAB */
                                    <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                                        <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-3xl flex flex-col items-center justify-center p-8 bg-slate-50/20 dark:bg-slate-900/10">
                                            {audioBlob ? (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4 animate-pulse">
                                                        <Mic size={32} />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Voice Memo Recorded</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Audio capture ready for analysis</p>
                                                    
                                                    {/* Simple HTML Audio Player */}
                                                    <audio src={URL.createObjectURL(audioBlob)} controls className="mt-4 mx-auto max-w-[240px] h-9" />

                                                    <button
                                                        onClick={() => setAudioBlob(null)}
                                                        className="mt-6 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all"
                                                    >
                                                        Delete Recording
                                                    </button>
                                                </div>
                                            ) : recording ? (
                                                <div className="text-center space-y-4">
                                                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                                                        {/* Bouncing radial pulse simulation */}
                                                        <div className="absolute w-20 h-20 bg-rose-500/20 rounded-full animate-ping opacity-60" />
                                                        <div className="absolute w-16 h-16 bg-rose-500/30 rounded-full animate-pulse" />
                                                        <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg relative z-20">
                                                            <div className="w-4 h-4 bg-white rounded-sm" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-lg font-black text-rose-500 tracking-tight">{formatTime(recordingTime)}</p>
                                                        <p className="text-xs text-slate-400 mt-1.5">Microphone active. Speak transaction items...</p>
                                                    </div>

                                                    <button
                                                        onClick={stopRecording}
                                                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                                                    >
                                                        Stop Recording
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center max-w-xs space-y-4">
                                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-850 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto">
                                                        <Mic size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">Voice memo recorder</p>
                                                        <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                                            Dictate details (e.g. "Invoice received from Vendor XYZ: 10 Cokes, 3 units of Pepsi")
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={startRecording}
                                                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-600/10 flex items-center gap-1.5 mx-auto"
                                                    >
                                                        <Mic size={14} />
                                                        <span>Start Recording</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 shrink-0 text-right">
                                            <button
                                                onClick={handleExtract}
                                                disabled={!audioBlob}
                                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                            >
                                                Proceed to Extract
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
