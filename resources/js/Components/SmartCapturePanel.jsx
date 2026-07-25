import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import {
    X, Camera, Mic, Upload, Loader2, Sparkles, FileText, CheckCircle2,
    AlertTriangle, Plus, ChevronRight, User, Type, Lock, Settings2,
    Trash2, FilePlus2, Layers, KeyRound, TestTube2
} from 'lucide-react';
import axios from 'axios';
import { openLemonCheckout, closeLemonCheckout } from '@/lib/lemonCheckout';

/**
 * SmartCapturePanel — the "AI Scan" intake panel.
 *
 * Inputs:  up to 5 photos/PDF pages, a voice memo (recorded OR uploaded), or raw text.
 * Outputs: a fully user-confirmed transaction (sale, purchase, expense, return,
 *          proposal, pre-invoice, pre-purchase, recurring invoice, purchase return)
 *          — created new, or appended to an existing open/draft document.
 */
export default function SmartCapturePanel({ isOpen, onClose, initialTab = 'image' }) {
    const { store } = usePage().props;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Panel context (entitlement, parties, categories, open docs, limits)
    const [ctx, setCtx] = useState(null);
    const [ctxLoading, setCtxLoading] = useState(false);

    // Image state — up to N files
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]); // [{file, preview}]

    // Audio state
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioSource, setAudioSource] = useState(null); // 'recorded' | 'uploaded'
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Text state
    const [textInput, setTextInput] = useState('');

    // Intake options
    const [targetType, setTargetType] = useState('');
    const [customCommand, setCustomCommand] = useState('');
    const [appendMode, setAppendMode] = useState(false);
    const [appendDocType, setAppendDocType] = useState('pre_invoice');
    const [appendDocId, setAppendDocId] = useState('');

    // Review state
    const [extractedData, setExtractedData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedPartyId, setSelectedPartyId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Settings drawer (BYOK)
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState(null);
    const [settingsForm, setSettingsForm] = useState({ provider: 'gemini', api_key: '', model: '' });
    const [settingsBusy, setSettingsBusy] = useState(false);
    const [settingsMsg, setSettingsMsg] = useState(null);

    const [isPurchasingAddon, setIsPurchasingAddon] = useState(null);

    // Handle checkout for AI or Sync add-ons.
    // Lemon Squeezy must host the card form (they are our Merchant of Record),
    // but it opens as an overlay on top of this panel — the user never leaves
    // VenQore and never loses the scan they were in the middle of.
    const handlePurchaseAddon = (addonType) => {
        setIsPurchasingAddon(addonType);
        axios.post(`/store/${store?.slug}/billing/checkout-addon`, { addon_type: addonType })
            .then(res => {
                if (!res.data.url) {
                    alert(res.data.error || 'Failed to create checkout.');
                    setIsPurchasingAddon(null);
                    return;
                }

                openLemonCheckout(res.data.url, {
                    onSuccess: () => {
                        setTimeout(async () => {
                            // Don't wait on the webhook — pull the entitlement
                            // from Lemon Squeezy so the add-on unlocks now.
                            await axios
                                .post(`/store/${store?.slug}/billing/sync-subscription`)
                                .catch(() => { /* reload below still reflects webhook if it lands */ });
                            closeLemonCheckout();
                            router.reload({ preserveScroll: true });
                            setIsPurchasingAddon(null);
                        }, 2200);
                    },
                    onClose: () => setIsPurchasingAddon(null),
                    onError: () => setIsPurchasingAddon(null),
                });
            })
            .catch(err => {
                console.error(err);
                alert('Failed to generate checkout link. Please check your network connection.');
                setIsPurchasingAddon(null);
            });
    };

    // Base URL for all smart-capture endpoints (derived so new endpoints work
    // even before the Ziggy route cache is regenerated)
    const baseUrl = useMemo(() => {
        try {
            return route('store.smart-capture.extract', { store_slug: store?.slug }).replace(/\/extract$/, '');
        } catch (e) {
            return `/store/${store?.slug}/smart-capture`;
        }
    }, [store?.slug]);

    const maxFiles = ctx?.limits?.max_files ?? 5;
    const locked = ctx && !ctx.entitlement?.allowed;

    // ── Load context when the panel opens ────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setCtxLoading(true);
        axios.get(`${baseUrl}/context`)
            .then(res => setCtx(res.data))
            .catch(() => setCtx(null))
            .finally(() => setCtxLoading(false));
    }, [isOpen, baseUrl]);

    // Recording timer
    useEffect(() => {
        if (recording) {
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [recording]);

    if (!isOpen) return null;

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── File handling (multi) ────────────────────────────────────────────────
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileChange = (e) => {
        if (e.target.files?.length) addFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    const addFiles = (files) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        const maxMb = ctx?.limits?.max_image_mb ?? 10;
        const next = [...selectedFiles];

        for (const file of files) {
            if (next.length >= maxFiles) {
                setError(`Maximum ${maxFiles} files per scan.`);
                break;
            }
            if (!validTypes.includes(file.type)) {
                setError('Unsupported file format. Please upload JPG, PNG, WEBP or PDF.');
                continue;
            }
            if (file.size > maxMb * 1024 * 1024) {
                setError(`"${file.name}" exceeds the ${maxMb}MB limit.`);
                continue;
            }
            const entry = { file, preview: null };
            if (file.type.startsWith('image/')) {
                entry.preview = URL.createObjectURL(file);
            }
            next.push(entry);
            setError(null);
        }
        setSelectedFiles(next);
    };

    const removeFile = (idx) => {
        setSelectedFiles(prev => {
            const next = [...prev];
            if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
            next.splice(idx, 1);
            return next;
        });
    };

    // ── Audio: record ────────────────────────────────────────────────────────
    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/mp4' };

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: options.mimeType });
                setAudioBlob(blob);
                setAudioSource('recorded');
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setRecording(true);
        } catch (err) {
            console.error('Audio capture failed:', err);
            setError('Permission denied. Could not access microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    // ── Audio: upload ────────────────────────────────────────────────────────
    const handleAudioUpload = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const validTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/m4a'];
        const maxMb = ctx?.limits?.max_audio_mb ?? 25;

        if (!validTypes.includes(file.type) && !file.type.startsWith('audio/')) {
            setError('Unsupported audio format. Use MP3, WAV, M4A, OGG or WEBM.');
            return;
        }
        if (file.size > maxMb * 1024 * 1024) {
            setError(`Audio exceeds the ${maxMb}MB limit.`);
            return;
        }
        setAudioBlob(file);
        setAudioSource('uploaded');
        setError(null);
    };

    const convertToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
    });

    // ── Extraction ───────────────────────────────────────────────────────────
    const handleExtract = async () => {
        setLoading(true);
        setError(null);
        setExtractedData(null);

        try {
            const payload = {
                type: activeTab,
                target_type: targetType || null,
                custom_command: customCommand || null,
            };

            if (activeTab === 'image') {
                if (selectedFiles.length === 0) {
                    setError('Please add at least one photo or PDF first.');
                    setLoading(false);
                    return;
                }
                payload.files = [];
                for (const entry of selectedFiles) {
                    const data = await convertToBase64(entry.file);
                    payload.files.push({ base64: data.split(',')[1], mime: entry.file.type });
                }
            } else if (activeTab === 'audio') {
                if (!audioBlob) {
                    setError('Please record or upload a voice memo first.');
                    setLoading(false);
                    return;
                }
                const data = await convertToBase64(audioBlob);
                payload.base64 = data.split(',')[1];
                payload.mime_type = audioBlob.type;
            } else {
                if (!textInput.trim()) {
                    setError('Please type or paste some text first.');
                    setLoading(false);
                    return;
                }
                payload.text = textInput;
            }

            const response = await axios.post(`${baseUrl}/extract`, payload);

            if (response.data.success) {
                setExtractedData(response.data);
                setSelectedPartyId(response.data.suggested_party_id || '');
                setSelectedCategoryId(response.data.suggested_category_id || '');
                setPaymentMethod(response.data.action === 'purchase' ? 'credit' : 'cash');
            } else {
                setError(response.data.message || 'Failed to extract transaction details.');
            }
        } catch (err) {
            if (err.response?.status === 402) {
                // Entitlement changed — refresh lock state
                axios.get(`${baseUrl}/context`).then(res => setCtx(res.data)).catch(() => {});
            }
            setError(err.response?.data?.message || 'AI extraction failed. Please check your AI settings and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Review helpers ───────────────────────────────────────────────────────
    const handleItemChange = (idx, field, value) => {
        setExtractedData(prev => {
            const updatedItems = [...prev.items];
            updatedItems[idx] = { ...updatedItems[idx], [field]: value };
            return { ...prev, items: updatedItems };
        });
    };

    const handleProductPick = (idx, value) => {
        setExtractedData(prev => {
            const updatedItems = [...prev.items];
            const item = { ...updatedItems[idx] };
            if (value === '__create_new__') {
                item.product_id = null;
                item.create_new = {
                    name: item.raw_name,
                    price: item.unit_price || 0,
                    cost_price: 0,
                };
            } else {
                item.product_id = value;
                item.create_new = null;
                const candidate = (item.candidates || []).find(c => String(c.id) === String(value));
                if (candidate && (item.unit_price === null || item.unit_price === undefined || item.unit_price === '')) {
                    item.unit_price = candidate.sale_price;
                }
            }
            updatedItems[idx] = item;
            return { ...prev, items: updatedItems };
        });
    };

    const removeItem = (idx) => {
        setExtractedData(prev => {
            const updatedItems = prev.items.filter((_, i) => i !== idx);
            return { ...prev, items: updatedItems };
        });
    };

    const isExpense = extractedData?.action === 'expense';
    const partyType = extractedData ? (['purchase', 'pre_purchase', 'purchase_return'].includes(extractedData.action) ? 'supplier' : 'customer') : 'customer';
    const partyList = partyType === 'supplier' ? (ctx?.parties?.suppliers || []) : (ctx?.parties?.customers || []);
    const candidateIds = new Set((extractedData?.party_candidates || []).map(c => String(c.id)));

    const itemsReady = extractedData?.items?.length > 0 && extractedData.items.every(i =>
        isExpense ? true : (i.product_id || (i.create_new && i.create_new.name?.trim()))
    );
    const isAppending = appendMode && !!appendDocId;
    // Appending: the target document already has its party — no selection needed.
    const partyReady = isAppending ? true : (isExpense ? !!selectedCategoryId : !!selectedPartyId);
    const appendReady = !appendMode || (appendDocType && appendDocId);

    // ── Confirm ──────────────────────────────────────────────────────────────
    const handleConfirmTransaction = async () => {
        if (!extractedData || confirming) return;

        setConfirming(true);
        setError(null);

        const postItems = extractedData.items.map(item => ({
            product_id: item.create_new ? null : item.product_id,
            create_new: item.create_new ? {
                name: item.create_new.name,
                price: parseFloat(item.create_new.price || 0),
                cost_price: parseFloat(item.create_new.cost_price || 0),
            } : null,
            qty: parseFloat(item.qty || 1),
            unit_price: parseFloat(item.unit_price || 0),
            name: item.raw_name,
        }));

        const payload = {
            action: extractedData.action,
            party_id: isExpense ? null : selectedPartyId,
            party: extractedData.party,
            payment_method: isExpense && paymentMethod === 'credit' ? 'cash' : paymentMethod,
            expense_category_id: isExpense ? selectedCategoryId : null,
            date: extractedData.date || null,
            reference: extractedData.reference || null,
            append_to: appendMode && appendDocId ? { type: appendDocType, id: appendDocId } : null,
            items: postItems,
        };

        try {
            const response = await axios.post(`${baseUrl}/confirm`, payload);
            if (response.data.success) {
                setSuccessData({ ...response.data.data, message: response.data.message });
            } else {
                setError(response.data.message || 'Failed to post transaction.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction creation failed. Check the details and try again.');
        } finally {
            setConfirming(false);
        }
    };

    const calculateGrossTotal = () => {
        if (!extractedData) return '0.00';
        return extractedData.items
            .reduce((sum, item) => sum + (parseFloat(item.qty || 1) * parseFloat(item.unit_price || 0)), 0)
            .toFixed(2);
    };

    const resetAll = () => {
        setSuccessData(null);
        setExtractedData(null);
        setSelectedFiles([]);
        setAudioBlob(null);
        setAudioSource(null);
        setTextInput('');
        setSelectedPartyId('');
        setSelectedCategoryId('');
        setAppendDocId('');
        setError(null);
    };

    const navigateToSuccessDoc = () => {
        if (!successData) return;
        onClose();

        let path = null;
        try {
            if (successData.type === 'purchase') {
                path = route('store.v3.purchases.show', { store_slug: store.slug, purchase: successData.id });
            } else if (successData.type === 'sale' || successData.type === 'invoice') {
                path = route('store.sales.dashboard', { store_slug: store.slug });
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
        } catch (e) { /* route not in cache */ }

        if (path) router.visit(path);
    };

    // ── Settings drawer ──────────────────────────────────────────────────────
    const openSettings = () => {
        setShowSettings(true);
        setSettingsMsg(null);
        axios.get(`${baseUrl}/settings`)
            .then(res => {
                setSettings(res.data);
                setSettingsForm({
                    provider: res.data.provider || 'gemini',
                    api_key: res.data.api_key_masked || '',
                    model: res.data.model || '',
                });
            })
            .catch(err => setSettingsMsg({ ok: false, text: err.response?.data?.message || 'Could not load settings.' }));
    };

    const saveSettings = async () => {
        setSettingsBusy(true);
        setSettingsMsg(null);
        try {
            const res = await axios.post(`${baseUrl}/settings`, settingsForm);
            setSettingsMsg({ ok: true, text: res.data.message || 'Saved.' });
            // refresh context so lock state updates immediately
            axios.get(`${baseUrl}/context`).then(r => setCtx(r.data)).catch(() => {});
        } catch (err) {
            setSettingsMsg({ ok: false, text: err.response?.data?.message || 'Failed to save settings.' });
        } finally {
            setSettingsBusy(false);
        }
    };

    const testSettings = async () => {
        setSettingsBusy(true);
        setSettingsMsg(null);
        try {
            const res = await axios.post(`${baseUrl}/settings/test`, settingsForm);
            setSettingsMsg({ ok: res.data.success, text: res.data.message });
        } catch (err) {
            setSettingsMsg({ ok: false, text: err.response?.data?.message || 'Connection test failed.' });
        } finally {
            setSettingsBusy(false);
        }
    };

    const providerLabels = { gemini: 'Google Gemini', openai: 'OpenAI', anthropic: 'Anthropic (Claude)', deepseek: 'DeepSeek' };
    const providerCaps = ctx?.settings?.providers || {};

    // ── Intake option controls ───────────────────────────────────────────────
    const openDocs = ctx?.open_documents?.[appendDocType] || [];

    const renderAdvancedControls = () => (
        <div className="mb-6 space-y-4 text-left bg-slate-50/50 dark:bg-slate-850/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 relative z-20">
            {/* Create new vs append */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setAppendMode(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${!appendMode
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                    <FilePlus2 size={14} />
                    Create New Document
                </button>
                <button
                    type="button"
                    onClick={() => setAppendMode(true)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${appendMode
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                    <Layers size={14} />
                    Add to Existing Document
                </button>
            </div>

            {appendMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1">Document Type</label>
                        <select
                            value={appendDocType}
                            onChange={e => { setAppendDocType(e.target.value); setAppendDocId(''); }}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer"
                        >
                            <option value="pre_invoice">Sales Order (Pre-Invoice)</option>
                            <option value="pre_purchase">Purchase Order (Pre-Purchase)</option>
                            <option value="proposal">Proposal / Quote</option>
                            <option value="recurring_invoice">Recurring Invoice</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1">Target Document</label>
                        <select
                            value={appendDocId}
                            onChange={e => setAppendDocId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer"
                        >
                            <option value="">-- Select an open document --</option>
                            {openDocs.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.reference || doc.id?.slice(0, 8)} — {doc.party || 'No party'}{doc.total !== undefined && doc.total !== null ? ` — ${parseFloat(doc.total).toFixed(2)}` : ''} ({doc.status})
                                </option>
                            ))}
                        </select>
                        {openDocs.length === 0 && (
                            <p className="text-[10px] text-amber-500 font-semibold ml-1">No open documents of this type found.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1">What would you like to create?</label>
                        <select
                            value={targetType}
                            onChange={e => setTargetType(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer"
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
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1">Text Commands / Instructions (Optional)</label>
                        <input
                            type="text"
                            value={customCommand}
                            onChange={e => setCustomCommand(e.target.value)}
                            placeholder="e.g. 'Use wholesale prices', 'Skip tax'"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none text-slate-800 dark:text-white font-medium"
                        />
                    </div>
                </div>
            )}
        </div>
    );

    // ── Settings drawer UI ───────────────────────────────────────────────────
    const renderSettingsDrawer = () => (
        <div className="absolute inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <KeyRound size={18} className="text-indigo-500" />
                        <h3 className="text-base font-black text-slate-800 dark:text-white">AI Settings (Bring Your Own Key)</h3>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white">
                        <X size={14} />
                    </button>
                </div>

                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Use your own API key from any major AI provider. Your key is stored only for this store and is never shared with other stores.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Provider</label>
                        <select
                            value={settingsForm.provider}
                            onChange={e => setSettingsForm(f => ({ ...f, provider: e.target.value, model: '' }))}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white"
                        >
                            {Object.keys(providerLabels).map(p => (
                                <option key={p} value={p}>{providerLabels[p]}</option>
                            ))}
                        </select>
                        {providerCaps[settingsForm.provider] && (
                            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                                Supports: {['image', 'audio', 'text'].filter(t => providerCaps[settingsForm.provider][t]).map(t => t === 'image' ? 'Photos' : t === 'audio' ? 'Voice' : 'Text').join(', ')}
                                {!providerCaps[settingsForm.provider].image && ' — no photo scanning!'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">API Key</label>
                        <input
                            type="text"
                            value={settingsForm.api_key}
                            onChange={e => setSettingsForm(f => ({ ...f, api_key: e.target.value }))}
                            placeholder="Paste your API key"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Model (optional)</label>
                        <input
                            type="text"
                            value={settingsForm.model}
                            onChange={e => setSettingsForm(f => ({ ...f, model: e.target.value }))}
                            placeholder={settings?.default_models?.[settingsForm.provider] || 'Default model'}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-800 dark:text-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Leave empty to use the recommended default.</p>
                    </div>

                    {settingsMsg && (
                        <div className={`p-3 rounded-xl text-xs font-bold ${settingsMsg.ok ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                            {settingsMsg.text}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={testSettings}
                            disabled={settingsBusy}
                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                            {settingsBusy ? <Loader2 className="animate-spin" size={14} /> : <TestTube2 size={14} />}
                            Test Connection
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={settingsBusy}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-40"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Locked screen ────────────────────────────────────────────────────────
    const renderLocked = () => (
        <div className="flex-1 flex flex-col justify-center p-8 overflow-y-auto max-h-full">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 mb-3 shrink-0">
                    <Lock size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">AI Scan is Locked</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                    {ctx?.entitlement?.message || 'AI Scan requires the AI add-on. Every store gets 10 free credits to test out the capabilities.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
                {/* Option 1: BYOK */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between text-left">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                BYOK Lifetime
                            </span>
                            <div className="text-lg font-black text-slate-800 dark:text-white">$5 <span className="text-[10px] font-normal text-slate-500">once</span></div>
                        </div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1.5">Bring Your Own Key</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Provide your own Gemini, OpenAI, Claude, or DeepSeek API key. Bypass platform fees forever.
                        </p>
                    </div>
                    <div className="mt-4 space-y-2">
                        {ctx?.entitlement?.reason === 'no_key' ? (
                            <button
                                onClick={openSettings}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                            >
                                <KeyRound size={12} /> Configure API Key
                            </button>
                        ) : (
                            <button
                                onClick={() => handlePurchaseAddon('ai_byok')}
                                disabled={isPurchasingAddon !== null}
                                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-[#020010] rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                            >
                                {isPurchasingAddon === 'ai_byok' ? <Loader2 size={12} className="animate-spin" /> : 'Buy BYOK Unlock'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Option 2: Managed Plans */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between text-left">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                Managed API
                            </span>
                            <span className="text-[10px] text-slate-500">Monthly Tiers</span>
                        </div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1.5">Managed AI Subscriptions</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                            No API keys or developer setup needed. Access our premium high-speed models instantly. Select a volume:
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'ai_starter', label: 'Starter AI', price: '$9', scans: 90, queries: 110 },
                                { key: 'ai_lite', label: 'Lite AI', price: '$19', scans: 150, queries: 200 },
                                { key: 'ai_pro', label: 'Pro AI', price: '$39', scans: 480, queries: 420 },
                                { key: 'ai_ultimate', label: 'Ultimate AI', price: '$79', scans: 850, queries: 800 }
                            ].map(plan => (
                                <div 
                                    key={plan.key} 
                                    onClick={() => handlePurchaseAddon(plan.key)}
                                    className="p-2.5 rounded-lg bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] hover:border-purple-500/30 hover:bg-purple-500/[0.02] cursor-pointer transition-all flex flex-col justify-between group"
                                >
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[11px] font-black text-slate-800 dark:text-white group-hover:text-purple-400 transition-colors">{plan.label}</span>
                                        <span className="text-[11px] font-black text-purple-500">{plan.price}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-500">
                                        {plan.scans} scans / {plan.queries} queries
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden h-[720px] relative">
                {/* glow blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

                {showSettings && renderSettingsDrawer()}

                {/* Header */}
                <div className="p-6 bg-slate-900 text-white shrink-0 flex items-center justify-between border-b border-slate-800 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <Sparkles size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">AI Scan</h2>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">
                                AI-Powered Transaction Entry
                                {ctx?.entitlement?.mode === 'managed' && ctx?.entitlement?.scans_limit > 0 && (
                                    <span className="ml-2 text-slate-400 normal-case">({ctx.entitlement.scans_used}/{ctx.entitlement.scans_limit} scans used)</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openSettings}
                            title="AI Settings (BYOK)"
                            className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/55 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
                        >
                            <Settings2 size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/55 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-hidden flex flex-col relative z-10">
                    {ctxLoading && !ctx ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-500" size={28} />
                        </div>
                    ) : locked && !extractedData && !successData ? (
                        renderLocked()
                    ) : successData ? (
                        /* SUCCESS STATE */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-350">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mb-6 shadow-inner animate-bounce">
                                <CheckCircle2 size={44} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                {successData.appended ? 'Items Added!' : 'Transaction Created!'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                {successData.message || `Structured ${successData.type} transaction successfully processed.`}
                            </p>

                            <div className="mt-8 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 max-w-sm w-full space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span>Type:</span>
                                    <span className="text-slate-800 dark:text-white uppercase font-bold">{successData.type?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span>Reference:</span>
                                    <span className="text-slate-800 dark:text-white font-mono">{successData.reference}</span>
                                </div>
                                {successData.appended ? (
                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                        <span>Lines Added:</span>
                                        <span className="text-slate-800 dark:text-white font-black">{successData.appended}</span>
                                    </div>
                                ) : null}
                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span>Total:</span>
                                    <span className="text-slate-800 dark:text-white font-black">Rs. {Math.abs(successData.total || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={resetAll}
                                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    Scan Another
                                </button>
                                <button
                                    onClick={navigateToSuccessDoc}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                                >
                                    <span>View Document</span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ) : extractedData ? (
                        /* AI REVIEW & CONFIRMATION */
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
                            {/* Settings strip */}
                            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-end gap-5 justify-between">
                                <div className="flex flex-wrap items-end gap-5">
                                    {/* Action Intent */}
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Transaction Intent</label>
                                        <select
                                            value={extractedData.action}
                                            onChange={(e) => {
                                                const action = e.target.value;
                                                setExtractedData({ ...extractedData, action });
                                                setSelectedPartyId('');
                                            }}
                                            disabled={appendMode && !!appendDocId}
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-white disabled:opacity-50"
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

                                    {/* Party or Expense Category — explicit, user-confirmed */}
                                    {isExpense ? (
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">
                                                Expense Category <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={selectedCategoryId}
                                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                                className={`bg-white dark:bg-slate-800 border text-xs font-bold rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-white min-w-[180px] ${!selectedCategoryId ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                                            >
                                                <option value="">-- Select category --</option>
                                                {(ctx?.expense_categories || []).map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            {extractedData.expense_category && (
                                                <p className="text-[9px] text-indigo-400 font-bold mt-0.5">AI suggested: {extractedData.expense_category}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">
                                                {partyType === 'supplier' ? 'Supplier' : 'Customer'} <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-1.5">
                                                <User size={12} className="text-slate-400" />
                                                <select
                                                    value={selectedPartyId}
                                                    onChange={(e) => setSelectedPartyId(e.target.value)}
                                                    className={`bg-white dark:bg-slate-800 border text-xs font-bold rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-white min-w-[200px] ${!selectedPartyId ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                                                >
                                                    <option value="">-- Select {partyType} --</option>
                                                    {(extractedData.party_candidates || []).length > 0 && (
                                                        <optgroup label={`AI matches for "${extractedData.party}"`}>
                                                            {extractedData.party_candidates.map(c => (
                                                                <option key={`cand-${c.id}`} value={c.id}>{c.name} ({c.confidence}% match)</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                    <optgroup label={`All ${partyType}s`}>
                                                        {partyList.filter(p => !candidateIds.has(String(p.id))).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </div>
                                            {extractedData.party && (
                                                <p className="text-[9px] text-indigo-400 font-bold mt-0.5">AI read: "{extractedData.party}"</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Payment Method</label>
                                    <div className="flex gap-1.5">
                                        {(isExpense ? ['cash', 'bank'] : ['cash', 'credit', 'bank']).map((method) => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => setPaymentMethod(method)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${paymentMethod === method
                                                    ? 'bg-slate-900 border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 text-white font-black'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400'}`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Append banner */}
                            {appendMode && appendDocId && (
                                <div className="px-8 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 text-xs font-bold text-indigo-500">
                                    <Layers size={13} />
                                    Items will be ADDED to the selected existing {appendDocType.replace(/_/g, ' ')} — no new document will be created.
                                </div>
                            )}

                            {/* Extracted meta */}
                            {(extractedData.date || extractedData.reference || extractedData.notes) && (
                                <div className="px-8 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-[10px] font-semibold text-slate-400">
                                    {extractedData.date && <span>Date read: <span className="text-slate-600 dark:text-slate-300">{extractedData.date}</span></span>}
                                    {extractedData.reference && <span>Ref: <span className="text-slate-600 dark:text-slate-300 font-mono">{extractedData.reference}</span></span>}
                                    {extractedData.notes && <span className="truncate max-w-md">Notes: <span className="text-slate-600 dark:text-slate-300">{extractedData.notes}</span></span>}
                                </div>
                            )}

                            {/* Items */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {error && (
                                    <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-850 dark:text-rose-300 text-xs font-bold flex items-start gap-2">
                                        <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {extractedData.items.map((item, idx) => {
                                        const isNew = !!item.create_new;
                                        const isHigh = item.confidence >= 90;
                                        const isMedium = item.confidence >= 60 && item.confidence < 90;

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${isNew ? 'bg-indigo-500/5 border-indigo-500/20' :
                                                    isHigh ? 'bg-emerald-500/5 border-emerald-500/10' :
                                                        isMedium ? 'bg-amber-500/5 border-amber-500/10' :
                                                            'bg-rose-500/5 border-rose-500/10'}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI read: "{item.raw_name}"</span>

                                                        {!isExpense ? (
                                                            <div className="mt-1.5 space-y-2">
                                                                <select
                                                                    value={isNew ? '__create_new__' : (item.product_id || '')}
                                                                    onChange={(e) => handleProductPick(idx, e.target.value)}
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none"
                                                                >
                                                                    <option value="" disabled>-- Match a store product --</option>
                                                                    {(item.candidates || []).map(c => (
                                                                        <option key={c.id} value={c.id}>
                                                                            {c.name} (SKU: {c.sku} | Match: {c.confidence}%)
                                                                        </option>
                                                                    ))}
                                                                    <option value="__create_new__">＋ Create as NEW product…</option>
                                                                </select>

                                                                {isNew && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-indigo-500/20">
                                                                        <div className="sm:col-span-3">
                                                                            <label className="block text-[9px] font-bold text-indigo-400 uppercase">New Product Name</label>
                                                                            <input
                                                                                type="text"
                                                                                value={item.create_new.name}
                                                                                onChange={(e) => handleItemChange(idx, 'create_new', { ...item.create_new, name: e.target.value })}
                                                                                className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-indigo-400 uppercase">Sale Price</label>
                                                                            <input
                                                                                type="number" min="0" step="any"
                                                                                value={item.create_new.price}
                                                                                onChange={(e) => handleItemChange(idx, 'create_new', { ...item.create_new, price: e.target.value })}
                                                                                className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-indigo-400 uppercase">Cost Price</label>
                                                                            <input
                                                                                type="number" min="0" step="any"
                                                                                value={item.create_new.cost_price}
                                                                                onChange={(e) => handleItemChange(idx, 'create_new', { ...item.create_new, cost_price: e.target.value })}
                                                                                className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {!isNew && (!item.candidates || item.candidates.length === 0) && (
                                                                    <span className="text-rose-500 text-xs font-bold flex items-center gap-1">
                                                                        <AlertTriangle size={12} />
                                                                        No matches found — use "Create as NEW product".
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">{item.raw_name}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Quantity</label>
                                                            <input
                                                                type="number"
                                                                value={item.qty}
                                                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                                                className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-center outline-none"
                                                                min="0.0001" step="any"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Unit Price</label>
                                                            <input
                                                                type="number"
                                                                value={item.unit_price ?? 0}
                                                                onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                                                className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-center outline-none"
                                                                min="0" step="any"
                                                            />
                                                        </div>
                                                        <div className="pt-4 flex items-center gap-2">
                                                            <span className={`px-2 py-1 text-[8px] font-black uppercase rounded-full ${isNew ? 'bg-indigo-150 text-indigo-700' :
                                                                isHigh ? 'bg-emerald-150 text-emerald-700' :
                                                                    isMedium ? 'bg-amber-150 text-amber-700' :
                                                                        'bg-rose-150 text-rose-700'}`}>
                                                                {isNew ? 'New Product' : `${item.confidence}% Match`}
                                                            </span>
                                                            <button
                                                                onClick={() => removeItem(idx)}
                                                                title="Remove line"
                                                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-300 transition-all"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-slate-55/40 dark:bg-slate-900/60 backdrop-blur-md">
                                <div className="text-sm">
                                    <span className="text-slate-400 font-medium">Estimated Gross:</span>{' '}
                                    <span className="font-black text-slate-800 dark:text-white text-base">Rs. {calculateGrossTotal()}</span>
                                    {!partyReady && (
                                        <span className="block text-[10px] text-rose-500 font-bold mt-0.5">
                                            {isExpense ? 'Select an expense category to continue.' : `Select the ${partyType} to continue.`}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setExtractedData(null); setError(null); }}
                                        className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Re-Intake
                                    </button>
                                    <button
                                        onClick={handleConfirmTransaction}
                                        disabled={confirming || !itemsReady || !partyReady || !appendReady}
                                        className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/10 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                                    >
                                        {confirming ? (
                                            <div className="flex items-center gap-1.5">
                                                <Loader2 className="animate-spin" size={14} />
                                                <span>Posting...</span>
                                            </div>
                                        ) : (
                                            <span>{appendMode && appendDocId ? 'Add to Document' : 'Post Transaction'}</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        /* LOADING */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                                <div className="absolute w-16 h-16 rounded-full border-4 border-indigo-500/10 border-t-indigo-600 border-r-indigo-600 animate-spin" />
                                <Sparkles className="text-indigo-500 animate-pulse" size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">AI Intake in Progress...</h3>
                            <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                                Reading your {activeTab === 'image' ? `document (${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})` : activeTab === 'audio' ? 'voice memo' : 'text'} and matching items against your catalog...
                            </p>
                        </div>
                    ) : (
                        /* INTAKE */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                {[
                                    { key: 'image', icon: Camera, label: 'Photos / PDF' },
                                    { key: 'audio', icon: Mic, label: 'Voice Memo' },
                                    { key: 'text', icon: Type, label: 'Text' },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => { setActiveTab(tab.key); setError(null); }}
                                        className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === tab.key
                                            ? 'border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {error && (
                                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-850 dark:text-rose-300 text-xs font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
                                        <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {renderAdvancedControls()}

                                {activeTab === 'image' ? (
                                    /* MULTI-PHOTO TAB */
                                    <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                                        <div
                                            onDragEnter={handleDrag}
                                            onDragOver={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDrop={handleDrop}
                                            className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 transition-all min-h-[240px] ${dragActive
                                                ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]'
                                                : selectedFiles.length > 0
                                                    ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'}`}
                                        >
                                            {selectedFiles.length > 0 ? (
                                                <div className="w-full">
                                                    <div className="flex flex-wrap gap-3 justify-center">
                                                        {selectedFiles.map((entry, idx) => (
                                                            <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                                                                {entry.preview ? (
                                                                    <img src={entry.preview} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-center px-1">
                                                                        <FileText className="text-indigo-500 mx-auto" size={26} />
                                                                        <p className="text-[8px] font-bold text-slate-500 mt-1 truncate max-w-[96px]">{entry.file.name}</p>
                                                                    </div>
                                                                )}
                                                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-black rounded-md">{idx + 1}</span>
                                                                <button
                                                                    onClick={() => removeFile(idx)}
                                                                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {selectedFiles.length < maxFiles && (
                                                            <label htmlFor="capture-file-picker" className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-400 cursor-pointer transition-all">
                                                                <Plus size={22} />
                                                                <span className="text-[9px] font-bold mt-1">Add More</span>
                                                            </label>
                                                        )}
                                                    </div>
                                                    <p className="text-center text-[10px] text-slate-400 font-semibold mt-4">
                                                        {selectedFiles.length}/{maxFiles} files — multiple photos are treated as pages of ONE document.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center max-w-xs">
                                                    <Upload className="text-slate-400 mx-auto mb-4" size={40} />
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload invoice / receipt / handwritten note</p>
                                                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                                        Drag & drop up to {maxFiles} photos or PDFs (printed OR handwritten), or click to browse. Long receipt? Snap it in sections.
                                                    </p>
                                                    <label
                                                        htmlFor="capture-file-picker"
                                                        className="mt-6 inline-block px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-850 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow"
                                                    >
                                                        Browse Files
                                                    </label>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,.pdf"
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="capture-file-picker"
                                            />
                                        </div>

                                        <div className="pt-6 shrink-0 text-right">
                                            <button
                                                onClick={handleExtract}
                                                disabled={selectedFiles.length === 0}
                                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                            >
                                                Proceed to Extract
                                            </button>
                                        </div>
                                    </div>
                                ) : activeTab === 'audio' ? (
                                    /* VOICE TAB — record OR upload */
                                    <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                                        <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-3xl flex flex-col items-center justify-center p-8 bg-slate-50/20 dark:bg-slate-900/10">
                                            {audioBlob ? (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4 animate-pulse">
                                                        <Mic size={32} />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                        {audioSource === 'uploaded' ? 'Audio File Ready' : 'Voice Memo Recorded'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {audioSource === 'uploaded' && audioBlob.name ? audioBlob.name : 'Audio capture ready for analysis'}
                                                    </p>

                                                    <audio src={URL.createObjectURL(audioBlob)} controls className="mt-4 mx-auto max-w-[240px] h-9" />

                                                    <button
                                                        onClick={() => { setAudioBlob(null); setAudioSource(null); }}
                                                        className="mt-6 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all"
                                                    >
                                                        Delete Audio
                                                    </button>
                                                </div>
                                            ) : recording ? (
                                                <div className="text-center space-y-4">
                                                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
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
                                                <div className="text-center max-w-sm space-y-4">
                                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-850 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto">
                                                        <Mic size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Voice memo</p>
                                                        <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                                            Record now, or upload an existing audio file (e.g. "Invoice received from Vendor XYZ: 10 Cokes, 3 units of Pepsi")
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={startRecording}
                                                            className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                                                        >
                                                            <Mic size={14} />
                                                            <span>Start Recording</span>
                                                        </button>
                                                        <label
                                                            htmlFor="capture-audio-picker"
                                                            className="px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                                        >
                                                            <Upload size={14} />
                                                            <span>Upload Audio</span>
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="audio/*"
                                                            onChange={handleAudioUpload}
                                                            className="hidden"
                                                            id="capture-audio-picker"
                                                        />
                                                    </div>
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
                                ) : (
                                    /* TEXT TAB */
                                    <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                                        <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 ml-1">
                                                Type or paste your transaction text
                                            </label>
                                            <textarea
                                                value={textInput}
                                                onChange={e => setTextInput(e.target.value)}
                                                placeholder={"e.g.\nBought from Ali Traders:\n10 x Coca Cola 1.5L @ 180\n5 x Lays Masala @ 50\n2 cartons Nestle Water"}
                                                maxLength={20000}
                                                className="flex-1 min-h-[180px] w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white outline-none resize-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium leading-relaxed"
                                            />
                                            <p className="text-[10px] text-slate-400 font-semibold mt-2 ml-1">
                                                Works with item lists, copied invoices, WhatsApp order messages — any language.
                                            </p>
                                        </div>

                                        <div className="pt-6 shrink-0 text-right">
                                            <button
                                                onClick={handleExtract}
                                                disabled={!textInput.trim()}
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
