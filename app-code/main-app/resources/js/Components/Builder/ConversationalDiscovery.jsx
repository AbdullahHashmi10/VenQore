import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, ArrowRight, CornerDownLeft, RotateCcw, Sliders, AlertCircle } from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';

const csrfToken = () =>
    (typeof document !== 'undefined' && document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')) || '';

const postJson = async (url, body) => {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
    });
    return res.json();
};

export default function ConversationalDiscovery({
    initialPrompt,
    initialPreset,
    onComplete,
    onFallbackToManual,
    onStateUpdate,
}) {
    const [messages, setMessages] = useState([]);
    const [quickOptions, setQuickOptions] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(25);
    const [turn, setTurn] = useState(1);
    const [errorMsg, setErrorMsg] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, quickOptions]);

    // Initialize conversation on mount
    useEffect(() => {
        let isMounted = true;

        async function initSession() {
            setIsLoading(true);
            setErrorMsg('');
            const startingPrompt = initialPrompt || 'I want to setup a new workspace for my business.';

            setMessages([
                {
                    id: 'init-user',
                    role: 'user',
                    content: startingPrompt,
                },
            ]);

            try {
                const data = await postJson('/workspace/converse/start', {
                    prompt: startingPrompt,
                    preset: initialPreset || null,
                });

                if (!isMounted) return;

                if (data && data.ok) {
                    setSessionId(data.session_id);
                    setTurn(data.turn || 1);
                    setProgress(data.progress || 35);

                    if (onStateUpdate && data.confirmed_caps) {
                        onStateUpdate(data.confirmed_caps, data.detected_facts);
                    }

                    if (data.is_complete && data.proposal) {
                        onComplete(data.proposal, data.modules, data.preset);
                        return;
                    }

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: 'msg-' + Date.now(),
                            role: 'assistant',
                            content: data.assistant_message,
                            targetCapability: data.target_capability,
                        },
                    ]);

                    setQuickOptions(data.quick_options || []);
                } else if (data && data.fallback && data.proposal) {
                    onComplete(data.proposal, data.modules, data.preset);
                } else {
                    // Show fallback candidate question directly in chat without breaking
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: 'msg-' + Date.now(),
                            role: 'assistant',
                            content: data?.assistant_message || 'Could you tell me what products or services your business offers?',
                        },
                    ]);
                    setQuickOptions(data?.quick_options || [
                        { key: 'yes', label: 'Retail Products' },
                        { key: 'services', label: 'Services & Repairs' },
                        { key: 'food', label: 'Food & Dining' },
                    ]);
                }
            } catch (err) {
                console.error('AI discovery error:', err);
                if (!isMounted) return;
                setMessages((prev) => [
                    ...prev,
                    {
                        id: 'msg-' + Date.now(),
                        role: 'assistant',
                        content: 'Welcome! Do you sell retail goods, provide services/repairs, or operate in food and dining?',
                    },
                ]);
                setQuickOptions([
                    { key: 'retail', label: 'Retail Goods' },
                    { key: 'services', label: 'Services & Repairs' },
                    { key: 'food', label: 'Food & Dining' },
                ]);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    inputRef.current?.focus();
                }
            }
        }

        initSession();

        return () => {
            isMounted = false;
        };
    }, []);

    // Handle user submitting text or clicking a quick chip
    const handleSend = async (answerText, optionKey = null) => {
        const text = (answerText || inputText).trim();
        if (!text || isLoading) return;

        setInputText('');
        setQuickOptions([]);
        setIsLoading(true);
        setErrorMsg('');

        const newMsgId = 'user-' + Date.now();
        setMessages((prev) => [
            ...prev,
            {
                id: newMsgId,
                role: 'user',
                content: text,
            },
        ]);

        try {
            const data = await postJson('/workspace/converse/step', {
                session_id: sessionId || 'anon_session',
                response: text,
                selected_option_key: optionKey,
            });

            if (data && data.ok) {
                setTurn(data.turn || turn + 1);
                setProgress(data.progress || 80);

                if (onStateUpdate && data.confirmed_caps) {
                    onStateUpdate(data.confirmed_caps, data.detected_facts);
                }

                if (data.is_complete && data.proposal) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: 'msg-' + Date.now(),
                            role: 'assistant',
                            content: data.assistant_message || 'Configuring your workspace blueprint now...',
                        },
                    ]);

                    setTimeout(() => {
                        onComplete(data.proposal, data.modules, data.preset);
                    }, 600);
                    return;
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        id: 'msg-' + Date.now(),
                        role: 'assistant',
                        content: data.assistant_message,
                        targetCapability: data.target_capability,
                    },
                ]);

                setQuickOptions(data.quick_options || []);
            } else if (data && data.fallback && data.proposal) {
                onComplete(data.proposal, data.modules, data.preset);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: 'msg-' + Date.now(),
                        role: 'assistant',
                        content: data?.assistant_message || 'Understood. Do you operate across multiple branches or a single store?',
                    },
                ]);
                setQuickOptions([
                    { key: 'yes', label: 'Multiple Branches' },
                    { key: 'no', label: 'Single Store' },
                ]);
            }
        } catch (err) {
            console.error('Turn error:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: 'msg-' + Date.now(),
                    role: 'assistant',
                    content: 'Got it. Would you like to track individual serial numbers or batch expiry dates for your stock?',
                },
            ]);
            setQuickOptions([
                { key: 'serials', label: 'Serial / IMEIs' },
                { key: 'expiry', label: 'Batch & Expiry' },
                { key: 'standard', label: 'Standard Inventory' },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
            {/* Header progress info */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
                        AI Discovery &bull; Step {turn} of 4
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-28 bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onFallbackToManual}
                        className="text-xs text-white/50 hover:text-white/80 transition flex items-center gap-1"
                        title="Switch to manual selection"
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Manual Setup</span>
                    </button>
                </div>
            </div>

            {/* Conversation message feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[320px] max-h-[520px]">
                <AnimatePresence initial={false}>
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.25 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                                    m.role === 'user'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-emerald-950/20'
                                        : 'bg-white/10 text-white/90 border border-white/10 backdrop-blur-md rounded-bl-none'
                                }`}
                            >
                                {m.role === 'assistant' && (
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-1.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>VenQore AI</span>
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Thinking / Typing state */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-white/60 text-xs py-2 px-3 bg-white/5 rounded-xl border border-white/5 w-fit"
                    >
                        <div className="w-4 h-4 text-emerald-400">
                            <ThinkingOrb />
                        </div>
                        <span>Understanding your business structure...</span>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Option Smart Chips */}
            {quickOptions.length > 0 && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-3 pb-2 flex flex-wrap gap-2"
                >
                    {quickOptions.map((opt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(opt.label, opt.key)}
                            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/50 hover:text-emerald-200 transition active:scale-95 shadow-sm"
                        >
                            {opt.label}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Bottom Input Field */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                className="pt-2 relative flex items-center gap-2"
            >
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your answer in any language (English, Urdu, Arabic...)..."
                        disabled={isLoading}
                        className="w-full bg-white/10 border border-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-white placeholder-white/40 text-sm rounded-xl py-3 pl-4 pr-12 transition outline-none disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-30 disabled:hover:bg-emerald-500 transition active:scale-95"
                    >
                        <CornerDownLeft className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
