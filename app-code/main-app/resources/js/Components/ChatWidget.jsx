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
    const { store, auth, turnstile_site_key } = usePage().props;
    const { url } = usePage();

    // Turnstile explicit widget rendering state & refs
    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileWidgetId = useRef(null);
    const turnstileContainerRef = useRef(null);

    useEffect(() => {
        if (!turnstile_site_key) return;

        const renderWidget = () => {
            if (window.turnstile && turnstileContainerRef.current && turnstileWidgetId.current === null) {
                try {
                    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
                        sitekey: turnstile_site_key,
                        size: 'invisible',
                        callback: (token) => {
                            setTurnstileToken(token);
                        },
                        'expired-callback': () => {
                            setTurnstileToken(null);
                            if (turnstileWidgetId.current !== null && window.turnstile) {
                                window.turnstile.reset(turnstileWidgetId.current);
                            }
                        },
                        'error-callback': () => {
                            setTurnstileToken(null);
                        },
                    });
                } catch (err) {
                    console.warn('Turnstile render warning:', err);
                }
            }
        };

        const scriptId = 'cf-turnstile-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.turnstile && window.turnstile.ready) {
                    window.turnstile.ready(renderWidget);
                } else {
                    renderWidget();
                }
            };
            document.head.appendChild(script);
        } else {
            if (window.turnstile && window.turnstile.ready) {
                window.turnstile.ready(renderWidget);
            } else {
                renderWidget();
            }
        }

        return () => {
            if (turnstileWidgetId.current !== null && window.turnstile) {
                try {
                    window.turnstile.remove(turnstileWidgetId.current);
                } catch (e) {}
                turnstileWidgetId.current = null;
            }
        };
    }, [turnstile_site_key]);

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
            const tokenToSubmit = turnstileToken || (window.turnstile ? window.turnstile.getResponse() : null);
            const res  = await axios.post(`/api/${store?.slug}/chatbot/session`, {
                visitor_name: name,
                visitor_email: email,
                turnstile_token: tokenToSubmit,
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-surface text-brand-600 dark:bg-surface dark:text-brand-400 border border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-xs font-bold shadow-sm transition-all duration-normal">
                    <Play size={10} className="fill-brand-600 dark:fill-brand-400 stroke-none" />
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
                    <Loader2 className="animate-spin text-brand-500" size={32} />
                    <p className="text-xs text-ink-muted font-medium">Connecting to support...</p>
                </div>
            ) : (
                /* Message stream */
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-60">
                                <Sparkles size={24} className="text-brand-500 animate-pulse" />
                                <h5 className="text-xs font-bold text-ink-secondary dark:text-ink">Start a Conversation</h5>
                                <p className="text-2xs text-ink-muted max-w-[200px]">Send a message and our support team will reply instantly.</p>
                            </div>
                        )}
                        {messages.map((m, i) => {
                            const isVisitor = m.sender_type === 'visitor';
                            const isBot     = m.sender_type === 'bot';
                            const isSystem  = m.sender_type === 'system';

                            if (isSystem) return null;

                            return (
                                <div key={i} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-fast`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs shadow-sm ${
                                        isVisitor
                                            ? 'bg-brand-600 text-white rounded-tr-none font-medium'
                                            : isBot
                                                ? 'bg-sunken text-ink rounded-tl-none leading-relaxed'
                                                : 'bg-brand-50 dark:bg-brand-950/20 text-brand-950 dark:text-brand-300 border border-brand-100 dark:border-brand-900 rounded-tl-none leading-relaxed'
                                    }`}>
                                        <div className="text-3xs font-bold uppercase tracking-wider mb-1 opacity-70">
                                            {isVisitor ? 'You' : 'Support'}
                                        </div>
                                        <p className="whitespace-pre-line leading-relaxed">{renderMessageBody(m.body)}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {typing && (
                            <div className="flex items-center gap-1.5 text-2xs text-ink-muted font-medium py-1.5 animate-pulse">
                                <Loader2 size={10} className="animate-spin text-neutral-300" />
                                <span>Support is typing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick actions — shown until visitor sends their first message */}
                    {!messages.some(m => m.sender_type === 'visitor') && (
                        <div className="px-6 py-3 bg-sunken/50 dark:bg-surface border-t border-line shrink-0">
                            <div className="grid grid-cols-3 gap-2">
                                {[['🛒 POS','pos'],['📄 Invoice','create_invoice'],['💸 Expenses','expenses']].map(([label, action]) => (
                                    <button key={action} onClick={() => executeAction(action)}
                                        className="p-2.5 bg-app border border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover text-2xs font-bold text-ink flex items-center justify-center gap-1 shadow-sm transition-all duration-normal active:scale-95 rounded-xl">
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message input */}
                    <div className="p-4 border-t border-line bg-white/95 dark:bg-app backdrop-blur shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 relative items-center">
                            <input
                                type="text"
                                value={messageText}
                                onChange={(e) => { setMessageText(e.target.value); handleVisitorTyping(e.target.value.length > 0); }}
                                className="flex-1 pl-4 pr-12 py-3 bg-app border border-line rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-500 text-ink transition-all font-sans placeholder-slate-400"
                                placeholder="Type your message here..."
                                disabled={sending}
                            />
                            <button type="submit" disabled={!messageText.trim() || sending}
                                className="absolute right-1.5 p-2 bg-brand-600 hover:bg-brand-700 active:scale-90 text-white rounded-xl transition-all shadow-md disabled:opacity-30 disabled:hover:bg-brand-600 disabled:active:scale-100 flex items-center justify-center">
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
        <div className="px-5 py-4 bg-neutral-900 text-white shrink-0 relative flex items-center justify-between border-b border-neutral-800/80">
            <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" />

            {/* Left: branding */}
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-inner shrink-0">
                    <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                    <h4 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                        Support
                        {sessionStatus === 'agent_active' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />}
                    </h4>
                    <p className="text-2xs text-brand-300 font-bold uppercase tracking-wider mt-0.5">Online</p>
                </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-1.5 relative z-10">
                {/* New Chat */}
                {started && (
                    confirmNewChat ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xs text-ink-muted font-medium mr-1">Start over?</span>
                            <button onClick={handleNewChat}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-2xs font-bold transition-all active:scale-90">
                                Yes
                            </button>
                            <button onClick={() => setConfirmNewChat(false)}
                                className="px-2.5 py-1 bg-neutral-700 hover:bg-interactive-hover text-neutral-300 rounded-lg text-2xs font-bold transition-all active:scale-90">
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmNewChat(true)}
                            title="Start a new chat"
                            className="w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90">
                            <RotateCcw size={13} />
                        </button>
                    )
                )}

                {/* Expand / Collapse */}
                <button
                    onClick={() => setIsExpanded(v => !v)}
                    title={isExpanded ? 'Collapse chat' : 'Expand to sidebar'}
                    className="w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90">
                    {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>

                {/* Close */}
                <button onClick={closeFn}
                    className="w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90">
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
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-command transition-opacity duration-slow"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* Sidebar panel — slides in from right edge */}
            <div
                className={`fixed top-0 right-0 h-full z-command flex flex-col bg-surface border-l border-line shadow-2xl transition-all duration-slow ease-out font-sans ${
                    isExpanded ? 'translate-x-0 w-[420px]' : 'translate-x-full w-[420px]'
                }`}
                style={{ isolation: 'isolate' }}
            >
                {/* Glow blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

                {renderHeader(() => { setIsExpanded(false); setIsOpen(false); })}
                {renderChatBody()}
            </div>

            {/* ── FLOATING BUBBLE MODE ──────────────────────────────────────── */}
            <div className={`fixed right-6 z-sticky font-sans transition-all duration-slow ${showMobileNavBar ? 'bottom-[100px] lg:bottom-6' : 'bottom-6'}`} style={{ isolation: 'isolate' }}>

                {/* Compact popup panel — hidden when sidebar is open */}
                {isOpen && !isExpanded && (
                    <div className="mb-4 w-96 h-[520px] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-slow relative">
                        {/* Glow blobs */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[50px] pointer-events-none" />
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
                        className="w-14 h-14 rounded-full bg-surface text-ink-secondary dark:text-white border border-line hover:text-white shadow-2xl flex items-center justify-center transform active:scale-95 transition-all duration-slow group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-slow" />
                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-center">
                            {isOpen
                                ? <X size={22} className="animate-in spin-in-90 duration-slow" />
                                : <MessageSquare size={22} className="animate-in zoom-in duration-slow" />
                            }
                        </div>
                    </button>
                )}
            </div>

            {/* Cloudflare Turnstile Invisible Container */}
            <div ref={turnstileContainerRef} id="turnstile-chat-container" className="hidden" />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-300)); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-700)); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--vq-slate-400)); }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--vq-slate-600)); }
`}</style>
        </>
    );
}
