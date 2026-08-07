import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { MessageSquare, X, Send, Sparkles, ArrowRight, Loader2, Play, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Dexie from 'dexie';

// Initialize Dexie local database for offline support
const db = new Dexie('VenQoreChatbotDB');
db.version(1).stores({
    sessions: 'session_uuid, status, visitor_name, visitor_email, updated_at',
    messages: '++id, session_uuid, sender_type, sender_name, body, created_at'
});

export default function ChatWidget() {
    const { store, auth } = usePage().props;
    const { url } = usePage();

    // Check if the mobile nav bar is active to avoid overlapping
    const showMobileNavBar = (() => {
        if (!auth?.user) return false;

        const path = url.toLowerCase();

        // 1. Explicitly check if returns history list page (should show navbar)
        const isReturnsHistoryList = path.includes('/returns-history') && 
            !path.includes('/create') && 
            !path.includes('/edit') && 
            !path.includes('/return-detail');

        if (isReturnsHistoryList) return true;

        // 2. Block on POS screen
        if (path.includes('/pos')) return false;

        // 3. Block on creation, editing, return making, or refunds
        const isCreateFlow = path.includes('/create');
        const isEditFlow = path.includes('/edit');
        const isReturnFlow = path.includes('/return') && !path.includes('/returns-history');
        const isRefundFlow = path.includes('/refund');
        const isSetupFlow = path.includes('/setup') || path.includes('/new-store') || path.includes('/start');

        if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
            return false;
        }

        return true;
    })();

    const [isOpen, setIsOpen]         = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);  // sidebar mode
    const [started, setStarted]       = useState(false);
    const [loading, setLoading]       = useState(false);
    const [sending, setSending]       = useState(false);
    const [typing, setTyping]         = useState(false);
    const [confirmNewChat, setConfirmNewChat] = useState(false); // confirm before resetting

    // Form inputs
    const [visitorName, setVisitorName]   = useState(auth?.user?.name || 'Guest');
    const [visitorEmail, setVisitorEmail] = useState(auth?.user?.email || '');
    const [messageText, setMessageText]   = useState('');

    // Session state
    const [sessionUuid, setSessionUuid]     = useState(() => {
        if (!store) return null;
        return localStorage.getItem(`vq_chat_uuid_${store.id}`) || null;
    });
    const [sessionStatus, setSessionStatus] = useState('bot_active');

    // Subscription context fetched from /api/vena/context
    const [venaContext, setVenaContext] = useState(null);

    // Messages
    const [messages, setMessages] = useState([]);

    // Refs
    const messagesEndRef    = useRef(null);
    const echoInstance      = useRef(null);
    const activeChannel     = useRef(null);
    const typingTimeoutRef  = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Sync store-based sessionUuid once store is loaded/changed
    useEffect(() => {
        if (store) {
            const cachedUuid = localStorage.getItem(`vq_chat_uuid_${store.id}`);
            if (cachedUuid && cachedUuid !== sessionUuid) {
                setSessionUuid(cachedUuid);
            }
        }
    }, [store]);

    // Sync visitor credentials when auth is loaded/changed
    useEffect(() => {
        if (auth?.user) {
            setVisitorName(auth.user.name || 'Guest');
            setVisitorEmail(auth.user.email || '');
        }
    }, [auth]);

    useEffect(() => {
        if (sessionUuid && store) restoreSession();
    }, [sessionUuid, store]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, typing, isOpen]);

    // Close sidebar on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && isExpanded) setIsExpanded(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isExpanded]);

    // Auto-start chat session if open/expanded and no session has started yet
    useEffect(() => {
        if ((isOpen || isExpanded) && !started && !loading && !sessionUuid && store) {
            handleStartSession();
        }
    }, [isOpen, isExpanded, started, loading, sessionUuid, store]);

    // ── Fetch vena context ──────────────────────────────────────────────────
    const fetchVenaContext = async () => {
        try {
            const res = await axios.get(`/api/${store.slug}/vena/context`);
            setVenaContext(res.data);
        } catch (err) {
            console.warn('Vena: Could not fetch subscription context.', err);
        }
    };

    // ── Restore existing session ────────────────────────────────────────────
    const restoreSession = async () => {
        setLoading(true);
        try {
            const cachedMsgs = await db.messages.where('session_uuid').equals(sessionUuid).sortBy('created_at');
            if (cachedMsgs.length > 0) { setMessages(cachedMsgs); setStarted(true); }

            const res  = await axios.post(`/api/${store.slug}/chatbot/session`, { session_uuid: sessionUuid });
            const data = res.data;
            setSessionStatus(data.status);
            setVisitorName(data.visitor_name);
            setVisitorEmail(data.visitor_email);

            if (data.messages?.length > 0) {
                setMessages(data.messages);
                setStarted(true);
                await db.transaction('rw', db.messages, async () => {
                    await db.messages.where('session_uuid').equals(sessionUuid).delete();
                    await db.messages.bulkAdd(data.messages.map(m => ({
                        session_uuid: sessionUuid,
                        sender_type: m.sender_type,
                        sender_name: m.sender_name,
                        body: m.body,
                        created_at: m.created_at
                    })));
                });
            }

            initializeEcho(sessionUuid);
            fetchVenaContext();
        } catch (err) {
            console.error('Failed to sync chat session:', err);
            setStarted(true);
        } finally {
            setLoading(false);
        }
    };

    // ── Start / reset session ───────────────────────────────────────────────
    const handleStartSession = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const name = auth?.user?.name || 'Guest';
            const email = auth?.user?.email || null;
            const res  = await axios.post(`/api/${store?.slug}/chatbot/session`, {
                visitor_name: name,
                visitor_email: email,
            });
            const data = res.data;
            setSessionUuid(data.session_uuid);
            setSessionStatus(data.status);
            localStorage.setItem(`vq_chat_uuid_${store?.id}`, data.session_uuid);

            await db.sessions.put({
                session_uuid: data.session_uuid,
                status: data.status,
                visitor_name: name,
                visitor_email: email,
                updated_at: new Date().toISOString()
            });

            setMessages([]);
            setStarted(true);
            initializeEcho(data.session_uuid);
            fetchVenaContext();
        } catch (err) {
            console.error('Failed to start session:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── New Chat ────────────────────────────────────────────────────────────
    const handleNewChat = () => {
        setConfirmNewChat(false);
        // Clear Echo subscriptions
        if (activeChannel.current) {
            activeChannel.current
                .stopListening('.MessageSent')
                .stopListening('.TypingStarted')
                .stopListening('.TypingStopped')
                .stopListening('.SessionStatusChanged');
            activeChannel.current = null;
        }
        // Reset all state
        localStorage.removeItem(`vq_chat_uuid_${store.id}`);
        setSessionUuid(null);
        setMessages([]);
        setStarted(false);
        setSessionStatus('bot_active');
        setVisitorName('');
        setVisitorEmail('');
        setMessageText('');
        setTyping(false);
        setVenaContext(null);
    };

    // ── Echo setup ──────────────────────────────────────────────────────────
    const initializeEcho = (uuid) => {
        // Only attempt real-time WebSocket when Reverb is explicitly enabled.
        // Browser-level WebSocket errors cannot be caught by JS — the only way
        // to prevent them is to not attempt the connection at all.
        // Set VITE_REVERB_ENABLED=true in .env to enable real-time push.
        // Chat still works fully (HTTP polling) without it.
        const reverbEnabled = import.meta.env.VITE_REVERB_ENABLED === 'true';
        if (!reverbEnabled) return;

        if (echoInstance.current) {
            if (activeChannel.current) {
                activeChannel.current
                    .stopListening('.MessageSent')
                    .stopListening('.TypingStarted')
                    .stopListening('.TypingStopped')
                    .stopListening('.SessionStatusChanged');
            }
        } else {
            const host = window.location.hostname;
            echoInstance.current = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY || 'venqore_chat',
                wsHost: import.meta.env.VITE_REVERB_HOST || host,
                wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
                wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
                enabledTransports: ['ws', 'wss'],
            });
        }

        activeChannel.current = echoInstance.current.channel(`chat.${uuid}`);
        activeChannel.current
            .listen('.MessageSent', async (e) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === e.id)) return prev;
                    const filtered = prev.filter(m =>
                        typeof m.id === 'string' && m.id.startsWith('temp_') && m.body === e.body ? false : true
                    );
                    return [...filtered, e];
                });
                await db.messages.add({
                    session_uuid: uuid,
                    sender_type: e.sender_type,
                    sender_name: e.sender_name,
                    body: e.body,
                    created_at: e.created_at
                });
            })
            .listen('.TypingStarted', (e) => { if (e.sender_type === 'agent') setTyping(true); })
            .listen('.TypingStopped', (e) => { if (e.sender_type === 'agent') setTyping(false); })
            .listen('.SessionStatusChanged', (e) => {
                if (e.status === 'deleted') {
                    handleNewChat();
                } else {
                    setSessionStatus(e.status);
                }
            });
    };

    // ── Send message ────────────────────────────────────────────────────────
    const handleSendMessage = async (textToSend) => {
        const text = textToSend || messageText;
        if (!text.trim() || sending) return;
        if (!textToSend) setMessageText('');

        setSending(true);
        const tempId  = `temp_${Date.now()}`;
        const tempMsg = {
            id: tempId,
            sender_type: 'visitor',
            sender_name: visitorName || 'Guest',
            body: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            handleVisitorTyping(false);
            const res = await axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/message`, {
                body: text,
                vena_context: venaContext || null,
            });
            if (res.data.success) {
                const serverMsg = res.data.message;
                setMessages(prev => prev.map(m => m.id === tempId ? serverMsg : m));
                await db.messages.add({
                    session_uuid: sessionUuid,
                    sender_type: serverMsg.sender_type,
                    sender_name: serverMsg.sender_name,
                    body: serverMsg.body,
                    created_at: serverMsg.created_at
                });
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender_type: 'system',
                sender_name: 'System',
                body: 'We are experiencing a brief connection issue. Your message has been saved and a support team member will follow up shortly.',
                created_at: new Date().toISOString()
            }]);
        } finally {
            setSending(false);
        }
    };

    // ── Typing broadcast ────────────────────────────────────────────────────
    const handleVisitorTyping = (isTyping) => {
        if (!sessionUuid) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/typing`, { typing: isTyping });
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => handleVisitorTyping(false), 4000);
        }
    };

    // ── Deep-link actions ───────────────────────────────────────────────────
    const executeAction = (actionName) => {
        const routes = {
            pos:           'store.pos',
            create_invoice:'store.sales.invoice.create',
            expenses:      'store.expenses.index',
            invoices:      'store.sales.dashboard',
            settings:      'store.settings',
        };
        if (actionName === 'handoff') {
            handleSendMessage('I need to speak with a member of your support team, please.');
            return;
        }
        if (routes[actionName]) {
            setIsOpen(false);
            setIsExpanded(false);
            router.visit(route(routes[actionName], { store_slug: store.slug }));
        }
    };

    // ── Render message body (supports action:xxx deep-links) ─────────────────
    const renderMessageBody = (body) => {
        const regex = /\[([^\]]+)\]\(action:([a-zA-Z0-9_-]+)\)/g;
        let lastIndex = 0;
        const result = [];
        let match;
        while ((match = regex.exec(body)) !== null) {
            const textBefore = body.slice(lastIndex, match.index);
            if (textBefore) result.push(<span key={lastIndex} className="whitespace-pre-wrap">{textBefore}</span>);
            result.push(
                <button key={match.index} onClick={() => executeAction(match[2])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-slate-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all duration-200">
                    <Play size={10} className="fill-indigo-600 dark:fill-indigo-400 stroke-none" />
                    {match[1]}
                </button>
            );
            lastIndex = regex.lastIndex;
        }
        const textAfter = body.slice(lastIndex);
        if (textAfter) result.push(<span key={lastIndex} className="whitespace-pre-wrap">{textAfter}</span>);
        return result.length > 0 ? result : body;
    };

    const getStatusLabel = () => {
        if (sessionStatus === 'agent_active') return 'Support Team';
        if (sessionStatus === 'human_requested' || sessionStatus === 'agent_claimed') return 'Connecting...';
        return 'Support';
    };

    // ── Shared chat panel content ────────────────────────────────────────────
    const renderChatBody = () => (
        <>
            {!started ? (
                <div className="flex-1 p-8 flex flex-col items-center justify-center relative z-10 text-center space-y-4">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Connecting to support...</p>
                </div>
            ) : (
                /* Message stream */
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-60">
                                <Sparkles size={24} className="text-indigo-500 animate-pulse" />
                                <h5 className="text-xs font-black text-slate-700 dark:text-slate-200">Start a Conversation</h5>
                                <p className="text-[10px] text-slate-400 max-w-[200px]">Send a message and our support team will reply instantly.</p>
                            </div>
                        )}
                        {messages.map((m, i) => {
                            const isVisitor = m.sender_type === 'visitor';
                            const isBot     = m.sender_type === 'bot';
                            const isSystem  = m.sender_type === 'system';

                            if (isSystem) return null;

                            return (
                                <div key={i} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs shadow-sm ${
                                        isVisitor
                                            ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                                            : isBot
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none leading-relaxed'
                                                : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-tl-none leading-relaxed'
                                    }`}>
                                        <div className="text-[9px] font-black uppercase tracking-wider mb-1 opacity-70">
                                            {isVisitor ? 'You' : 'Support'}
                                        </div>
                                        <p className="whitespace-pre-line leading-relaxed">{renderMessageBody(m.body)}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {typing && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium py-1.5 animate-pulse">
                                <Loader2 size={10} className="animate-spin text-slate-300" />
                                <span>Support is typing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick actions — shown until visitor sends their first message */}
                    {!messages.some(m => m.sender_type === 'visitor') && (
                        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="grid grid-cols-3 gap-2">
                                {[['🛒 POS','pos'],['📄 Invoice','create_invoice'],['💸 Expenses','expenses']].map(([label, action]) => (
                                    <button key={action} onClick={() => executeAction(action)}
                                        className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1 shadow-sm transition-all duration-200 active:scale-95 rounded-xl">
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message input */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 relative items-center">
                            <input
                                type="text"
                                value={messageText}
                                onChange={(e) => { setMessageText(e.target.value); handleVisitorTyping(e.target.value.length > 0); }}
                                className="flex-1 pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white transition-all font-sans placeholder-slate-400"
                                placeholder="Type your message here..."
                                disabled={sending}
                            />
                            <button type="submit" disabled={!messageText.trim() || sending}
                                className="absolute right-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 active:scale-90 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100 flex items-center justify-center">
                                <Send size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

    // ── Shared header ────────────────────────────────────────────────────────
    const renderHeader = (closeFn) => (
        <div className="px-5 py-4 bg-slate-900 text-white shrink-0 relative flex items-center justify-between border-b border-slate-800/80">
            <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" />

            {/* Left: branding */}
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
                    <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                    <h4 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                        Support
                        {sessionStatus === 'agent_active' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />}
                    </h4>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Online</p>
                </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-1.5 relative z-10">
                {/* New Chat */}
                {started && (
                    confirmNewChat ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium mr-1">Start over?</span>
                            <button onClick={handleNewChat}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition-all active:scale-90">
                                Yes
                            </button>
                            <button onClick={() => setConfirmNewChat(false)}
                                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[10px] font-black transition-all active:scale-90">
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmNewChat(true)}
                            title="Start a new chat"
                            className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 active:scale-90">
                            <RotateCcw size={13} />
                        </button>
                    )
                )}

                {/* Expand / Collapse */}
                <button
                    onClick={() => setIsExpanded(v => !v)}
                    title={isExpanded ? 'Collapse chat' : 'Expand to sidebar'}
                    className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 active:scale-90">
                    {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>

                {/* Close */}
                <button onClick={closeFn}
                    className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 active:scale-90">
                    <X size={14} />
                </button>
            </div>
        </div>
    );

    if (!store) return null;

    return (
        <>
            {/* ── SIDEBAR MODE ─────────────────────────────────────────────── */}
            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] transition-opacity duration-300"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* Sidebar panel — slides in from right edge */}
            <div
                className={`fixed top-0 right-0 h-full z-[9999] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-out font-sans ${
                    isExpanded ? 'translate-x-0 w-[420px]' : 'translate-x-full w-[420px]'
                }`}
                style={{ isolation: 'isolate' }}
            >
                {/* Glow blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

                {renderHeader(() => { setIsExpanded(false); setIsOpen(false); })}
                {renderChatBody()}
            </div>

            {/* ── FLOATING BUBBLE MODE ──────────────────────────────────────── */}
            <div className={`fixed right-6 z-[55] font-sans transition-all duration-300 ${showMobileNavBar ? 'bottom-[100px] lg:bottom-6' : 'bottom-6'}`} style={{ isolation: 'isolate' }}>

                {/* Compact popup panel — hidden when sidebar is open */}
                {isOpen && !isExpanded && (
                    <div className="mb-4 w-96 h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 relative">
                        {/* Glow blobs */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[50px] pointer-events-none" />

                        {renderHeader(() => setIsOpen(false))}
                        {renderChatBody()}
                    </div>
                )}

                {/* Toggle bubble — hidden when sidebar is open */}
                {!isExpanded && (
                    <button
                        id="tour-chat-widget-btn"
                        onClick={() => setIsOpen(v => !v)}
                        className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:text-white shadow-2xl flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-center">
                            {isOpen
                                ? <X size={22} className="animate-in spin-in-90 duration-300" />
                                : <MessageSquare size={22} className="animate-in zoom-in duration-300" />
                            }
                        </div>
                    </button>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </>
    );
}
