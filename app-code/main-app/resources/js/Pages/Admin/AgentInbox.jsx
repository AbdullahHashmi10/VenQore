import React, { useState, useEffect, useRef } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, usePage } from '@inertiajs/react';
import { MessageSquare, User, Clock, CheckCircle2, RefreshCw, Send, AlertCircle, ShieldAlert, Sparkles, LogOut, Loader2, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import VenaLogo from '@/Components/VenaLogo';
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Setup Pusher globally if needed by Echo
window.Pusher = Pusher;

export default function AgentInbox() {
    const { store, auth, my_role } = usePage().props;
    const currentUser = auth.user;
    const isOwner = my_role === 'owner' || auth.user.is_platform_admin;
    
    const storeId = store?.id;
    const storeSlug = store?.slug;

    const getRoute = (name, params = {}) => {
        if (storeSlug) {
            return route(`store.admin.chatbot.${name}`, { store_slug: storeSlug, ...params });
        }
        return route(`platform.chatbot.${name}`, params);
    };

    const [sessions, setSessions] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [cannedResponses, setCannedResponses] = useState([]);
    const [slashSuggestions, setSlashSuggestions] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Collapsible group states
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };
    
    // Typing states
    const [visitorTyping, setVisitorTyping] = useState(false);
    const [typingText, setTypingText] = useState('');

    // Co-pilot states
    const [showCopilot, setShowCopilot] = useState(true);
    const [copilotLoading, setCopilotLoading] = useState(false);
    const [copilotSuggestion, setCopilotSuggestion] = useState('');
    const [copilotSimilarKb, setCopilotSimilarKb] = useState([]);
    const [copilotConfidence, setCopilotConfidence] = useState('medium');
    const [editableSuggestion, setEditableSuggestion] = useState('');


    // AI Learning Log Resolve Modal states
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolveCategory, setResolveCategory] = useState('general');
    const [resolveProblem, setResolveProblem] = useState('');
    const [resolveSolution, setResolveSolution] = useState('');
    const [submittingResolve, setSubmittingResolve] = useState(false);

    // References
    const chatScrollRef = useRef(null);
    const echoInstance = useRef(null);
    const activeChannel = useRef(null);
    const typingTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    // Auto-fetch suggestions when new visitor message arrives
    useEffect(() => {
        if (!selectedSession || !showCopilot) return;

        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.sender_type === 'visitor') {
            fetchSuggestion();
        } else {
            setCopilotSuggestion('');
            setCopilotSimilarKb([]);
            setCopilotConfidence('medium');
        }
    }, [selectedSession?.session_uuid, messages?.length, showCopilot]);

    // Keep editableSuggestion in sync with new incoming suggestions
    useEffect(() => {
        setEditableSuggestion(copilotSuggestion || '');
    }, [copilotSuggestion]);

    const fetchSuggestion = async () => {
        if (!selectedSession) return;
        setCopilotLoading(true);
        try {
            const res = await axios.post(getRoute('assist', { uuid: selectedSession.session_uuid }), {
                session_uuid: selectedSession.session_uuid
            });
            if (res.data.success) {
                setCopilotSuggestion(res.data.suggestion);
                setCopilotSimilarKb(res.data.similar_kb || []);
                setCopilotConfidence(res.data.confidence || 'medium');
            }
        } catch (err) {
            console.error("Failed to fetch assist suggestion", err);
        } finally {
            setCopilotLoading(false);
        }
    };

    // Initial load: Fetch sessions and canned responses
    useEffect(() => {
        fetchSessions();
        fetchCannedResponses();

        // 1. Initialize Echo connection
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

        // 2. Subscribe to store/tenant inbox channel
        const channelName = storeId ? `agent.inbox.${storeId}` : 'agent.inbox.global';
        const inboxChannel = echoInstance.current.private(channelName)
            .listen('.SessionStatusChanged', (e) => {
                fetchSessions(); // Reload sessions on any status changes
            })
            .listen('.MessageSent', (e) => {
                fetchSessions(); // Reload sessions on new messages
            });

        return () => {
            inboxChannel.stopListening('.SessionStatusChanged');
            if (activeChannel.current) {
                activeChannel.current.stopListening('.MessageSent')
                    .stopListening('.TypingStarted')
                    .stopListening('.TypingStopped')
                    .stopListening('.SessionStatusChanged');
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, [storeId]);

    // Scroll to bottom of chat on new messages
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTo({
                top: chatScrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, visitorTyping]);

    // Setup active session listener and lock heartbeat
    useEffect(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        if (!selectedSession) {
            setMessages([]);
            setVisitorTyping(false);
            return;
        }

        setMessages(selectedSession.messages || []);
        setReplyText('');
        setVisitorTyping(false);

        // 1. Subscribe to specific chat session channel
        if (activeChannel.current) {
            activeChannel.current.stopListening('.MessageSent')
                .stopListening('.TypingStarted')
                .stopListening('.TypingStopped')
                .stopListening('.SessionStatusChanged');
        }

        activeChannel.current = echoInstance.current.channel(`chat.${selectedSession.session_uuid}`);
        
        activeChannel.current
            .listen('.MessageSent', (e) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === e.id)) return prev;
                    return [...prev, e];
                });
            })
            .listen('.TypingStarted', (e) => {
                if (e.sender_type === 'visitor') {
                    setTypingText(`${e.sender_name} is typing...`);
                    setVisitorTyping(true);
                }
            })
            .listen('.TypingStopped', (e) => {
                if (e.sender_type === 'visitor') {
                    setVisitorTyping(false);
                }
            })
            .listen('.SessionStatusChanged', (e) => {
                setSelectedSession(prev => {
                    if (!prev || prev.session_uuid !== e.session_uuid) return prev;
                    return { ...prev, status: e.status, claimed_by: e.claimed_by };
                });
            });

        // 2. Start heartbeat claim lock renewal if claimed by current user
        if (selectedSession.claimed_by === currentUser.id && selectedSession.status === 'agent_active') {
            heartbeatIntervalRef.current = setInterval(() => {
                renewClaimLock(selectedSession.session_uuid);
            }, 15000); // Renew lock every 15s (TTL 30s)
        }

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, [selectedSession?.session_uuid, selectedSession?.claimed_by, selectedSession?.status]);

    const fetchSessions = async () => {
        try {
            const res = await axios.get(getRoute('sessions'));
            setSessions(res.data.sessions);
            setStaffMembers(res.data.staff || []);
            
            // Sync selected session if any
            if (selectedSession) {
                const updated = res.data.sessions.find(s => s.session_uuid === selectedSession.session_uuid);
                if (updated) {
                    setSelectedSession(updated);
                }
            }
        } catch (err) {
            console.error('Failed to fetch chat sessions', err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchCannedResponses = async () => {
        try {
            const res = await axios.get(getRoute('canned-responses'));
            setCannedResponses(res.data.canned_responses);
        } catch (err) {
            console.error('Failed to fetch canned responses', err);
        }
    };

    const renewClaimLock = async (uuid) => {
        try {
            // Re-hitting the claim endpoint updates expires_at timestamp
            await axios.post(getRoute('claim', { uuid }));
        } catch (err) {
            console.error('Failed to renew claim lock', err);
        }
    };

    const handleGiveToAi = async (uuid) => {
        try {
            const res = await axios.post(getRoute('handoff-to-ai', { uuid }));
            if (res.data.success) {
                fetchSessions();
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: 'Conversation handed back to Vena (AI).', type: 'success' }
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRefer = async (uuid, userId) => {
        try {
            const res = await axios.post(getRoute('refer', { uuid }), { user_id: userId });
            if (res.data.success) {
                fetchSessions();
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: 'Conversation successfully referred.', type: 'success' }
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSetStatus = async (uuid, subStatus) => {
        try {
            const res = await axios.post(getRoute('set-status', { uuid }), { sub_status: subStatus });
            if (res.data.success) {
                fetchSessions();
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: `Status updated to: ${subStatus}`, type: 'success' }
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleClaim = async (uuid) => {
        try {
            const res = await axios.post(getRoute('claim', { uuid }));
            if (res.data.success) {
                fetchSessions();
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: 'Chat claimed successfully!', type: 'success' }
                }));
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to claim chat session.';
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: msg, type: 'error' }
            }));
            fetchSessions();
        }
    };

    const handleRelease = async (uuid) => {
        try {
            await axios.post(getRoute('release', { uuid }));
            fetchSessions();
            setSelectedSession(null);
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: 'Returned chat session to the queue.', type: 'info' }
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteSession = async (uuid) => {
        if (!window.confirm("Are you sure you want to permanently delete this chat session? This will remove all messages and cannot be undone.")) {
            return;
        }

        try {
            const res = await axios.delete(getRoute('destroy', { uuid }));
            if (res.data.success) {
                setSelectedSession(null);
                fetchSessions();
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: 'Chat session permanently deleted.', type: 'success' }
                }));
            }
        } catch (err) {
            console.error('Failed to delete chat session', err);
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: 'Failed to delete session.', type: 'error' }
            }));
        }
    };

    const handleResolve = (uuid) => {
        // Clear previous state and open resolve & learning engine modal
        setResolveProblem('');
        setResolveSolution('');
        setResolveCategory('general');
        setShowResolveModal(true);
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!resolveProblem.trim() || !resolveSolution.trim()) {
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: 'Please outline the problem and verified solution.', type: 'warning' }
            }));
            return;
        }

        setSubmittingResolve(true);
        try {
            const res = await axios.post(getRoute('log-learning', { uuid: selectedSession.session_uuid }), {
                category: resolveCategory,
                problem: resolveProblem,
                solution: resolveSolution,
            });

            if (res.data.success) {
                setShowResolveModal(false);
                setSelectedSession(null);
                fetchSessions();
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: 'Session resolved and logged to AI learning successfully!', type: 'success' }
                }));
            }
        } catch (err) {
            console.error('Failed to log learning & resolve session', err);
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: 'Failed to resolve session.', type: 'error' }
            }));
        } finally {
            setSubmittingResolve(false);
        }
    };

    const handleReplyDirect = async (textToSubmit) => {
        if (!textToSubmit.trim() || sending) return;
        setSending(true);
        try {
            const res = await axios.post(
                getRoute('reply', { uuid: selectedSession.session_uuid }),
                { body: textToSubmit, vena_suggestion: copilotSuggestion }
            );
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.message]);
                setReplyText('');
                setCopilotSuggestion('');
                setEditableSuggestion('');
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: 'Reply sent successfully!', type: 'success' }
                }));
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to send reply.';
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: msg, type: 'error' }
            }));
        } finally {
            setSending(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || sending) return;

        setSending(true);
        try {
            const res = await axios.post(
                getRoute('reply', { uuid: selectedSession.session_uuid }),
                { body: replyText, vena_suggestion: copilotSuggestion }
            );
            if (res.data.success) {
                setReplyText('');
                setMessages(prev => [...prev, res.data.message]);
                setCopilotSuggestion('');
                setEditableSuggestion('');
                // Stop typing broadcast
                handleTypingBroadcast(false);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to send reply.';
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: msg, type: 'error' }
            }));
        } finally {
            setSending(false);
        }
    };

    // Auto-complete suggestions trigger on '/'
    const handleInputChange = (e) => {
        const value = e.target.value;
        setReplyText(value);

        // Broadcast typing
        handleTypingBroadcast(value.length > 0);

        if (value.startsWith('/')) {
            const query = value.slice(1).toLowerCase();
            const filtered = cannedResponses.filter(r => 
                r.shortcode.toLowerCase().includes(query) || 
                r.title.toLowerCase().includes(query)
            );
            setSlashSuggestions(filtered);
        } else {
            setSlashSuggestions([]);
        }
    };

    const selectCannedResponse = (response) => {
        setReplyText(response.body);
        setSlashSuggestions([]);
    };

    const handleTypingBroadcast = (typing) => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Send backend typing event
        axios.post(
            getRoute('typing.agent', { uuid: selectedSession.session_uuid }),
            { typing }
        );

        if (typing) {
            typingTimeoutRef.current = setTimeout(() => {
                handleTypingBroadcast(false);
            }, 5000); // Stop typing after 5 seconds of inactivity
        }
    };

    return (
        <OneGlanceLayout mode="admin" title="Agent Inbox" activeMenu={storeSlug ? "Store Settings" : "Agent Inbox"} noPadding={true}>
            <Head title="Agent Inbox" />

            <div className="h-full w-full flex gap-6 overflow-hidden p-6">
                {/* Left panel: Active sessions */}
                <div className="w-80 h-full bg-surface border border-line rounded-2xl shadow-xl flex flex-col overflow-hidden relative shrink-0">
                    <div className="p-6 border-b border-line bg-sunken/50 dark:bg-app">
                        <h3 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                            <MessageSquare className="text-brand-500" size={20} />
                            Support Queue
                        </h3>
                        <p className="text-xs text-ink-muted mt-1">Real-time customer inquiries</p>
                    </div>

                    {/* Filter tabs */}
                    <div className="px-6 py-3 border-b border-line flex gap-1 bg-sunken/50 dark:bg-app overflow-x-auto shrink-0 scrollbar-none">
                        {[
                            { id: 'all', label: 'All Active' },
                            { id: 'referred', label: 'Referred' },
                            { id: 'ai', label: 'AI Active' },
                            { id: 'resolved', label: 'Resolved' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-2.5 py-1.5 rounded-full text-3xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                                    activeTab === tab.id
                                        ? 'bg-brand-600 text-white shadow-md'
                                        : 'bg-sunken hover:bg-interactive-hover dark:bg-surface dark:hover:bg-interactive-hover text-ink-muted'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 chat-scroll p-3 space-y-2">
                        {loadingSessions ? (
                            <div className="flex flex-col items-center justify-center h-48 text-ink-muted">
                                <Loader2 className="animate-spin mb-2" size={24} />
                                <span className="text-xs">Loading queue...</span>
                            </div>
                        ) : (() => {
                            const filteredSessions = sessions.filter(s => {
                                if (activeTab === 'referred') return s.referred_to === currentUser.id;
                                if (activeTab === 'ai') return s.status === 'bot_active';
                                if (activeTab === 'resolved') return s.status === 'resolved';
                                return s.status !== 'resolved'; // 'all' shows unresolved active sessions
                            });

                            if (filteredSessions.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-48 text-ink-muted text-center px-4">
                                        <CheckCircle2 className="text-emerald-400 mb-2" size={32} />
                                        <span className="text-xs font-bold text-ink-secondary">All clear!</span>
                                        <span className="text-2xs text-ink-muted mt-1">No chats in this category</span>
                                    </div>
                                );
                            }

                            // Group sessions by tenant name
                            const grouped = {};
                            filteredSessions.forEach(s => {
                                const groupName = s.tenant_name || 'General / Platform';
                                if (!grouped[groupName]) {
                                    grouped[groupName] = [];
                                }
                                grouped[groupName].push(s);
                            });

                            return Object.keys(grouped).map(groupName => {
                                const groupSessions = grouped[groupName];
                                const isCollapsed = !!collapsedGroups[groupName];

                                return (
                                    <div key={groupName} className="space-y-2 mb-3">
                                        {/* Group Header */}
                                        <div 
                                            onClick={() => toggleGroup(groupName)}
                                            className="flex items-center justify-between p-2.5 bg-surface hover:bg-sunken dark:hover:bg-interactive-hover rounded-xl cursor-pointer select-none transition-all text-ink border border-line shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCollapsed ? <ChevronRight size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
                                                <span className="text-2xs font-bold uppercase tracking-wider">{groupName}</span>
                                            </div>
                                            <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 text-3xs font-bold rounded-full">
                                                {groupSessions.length}
                                            </span>
                                        </div>

                                        {/* Group Sessions */}
                                        {!isCollapsed && (
                                            <div className="space-y-2 pl-1.5 border-l border-line ml-2 animate-in fade-in slide-in-from-top-1 duration-fast">
                                                {groupSessions.map(s => {
                                                    const isSelected = selectedSession?.session_uuid === s.session_uuid;
                                                    const isUnclaimed = s.status === 'human_requested';
                                                    const isClaimedByMe = s.claimed_by === currentUser.id;
                                                    const isClaimedByOther = s.claimed_by && s.claimed_by !== currentUser.id;

                                                    return (
                                                        <button
                                                            key={s.session_uuid}
                                                            onClick={() => setSelectedSession(s)}
                                                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-normal relative overflow-hidden group flex flex-col gap-1.5 ${
                                                                isSelected 
                                                                    ? 'bg-neutral-900 border-neutral-900 dark:bg-surface dark:border-line text-white shadow-lg' 
                                                                    : 'bg-sunken/60 dark:bg-surface border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary'
                                                            }`}
                                                        >
                                                            {/* Status indicator indicator bar */}
                                                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                                                                isUnclaimed ? 'bg-rose-500 animate-pulse' :
                                                                isClaimedByMe ? 'bg-emerald-500' :
                                                                isClaimedByOther ? 'bg-amber-500' : 'bg-sunken'
                                                            }`} />

                                                            <div className="flex items-center justify-between w-full">
                                                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-ink'}`}>
                                                                    {s.visitor_name || 'Website Guest'}
                                                                </span>
                                                                <span className="text-3xs text-ink-muted font-medium">
                                                                    {s.last_message_at ? new Date(s.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                                                </span>
                                                            </div>

                                                            {s.messages?.length > 0 && (
                                                                <p className={`text-2xs truncate ${isSelected ? 'text-neutral-300' : 'text-ink-muted'}`}>
                                                                    {s.messages[s.messages.length - 1].body}
                                                                </p>
                                                            )}

                                                            <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                                                                {/* Priority status badge */}
                                                                {isUnclaimed && (
                                                                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-4xs font-bold uppercase tracking-wider rounded-full">
                                                                        Action Required
                                                                    </span>
                                                                )}
                                                                {isClaimedByMe && (
                                                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-4xs font-bold uppercase tracking-wider rounded-full">
                                                                        Claimed by me
                                                                    </span>
                                                                )}
                                                                {isClaimedByOther && (
                                                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-4xs font-bold uppercase tracking-wider rounded-full max-w-[120px] truncate">
                                                                        {s.claimed_by_name || 'Other'}
                                                                    </span>
                                                                )}
                                                                {s.referred_to === currentUser.id && (
                                                                    <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 text-4xs font-bold uppercase tracking-wider rounded-full">
                                                                        Referred to me
                                                                    </span>
                                                                )}
                                                                {s.sub_status && (
                                                                    <span className={`px-2 py-0.5 text-4xs font-bold uppercase tracking-wider rounded-full ${
                                                                        s.sub_status === 'fixed' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/20 text-amber-600'
                                                                    }`}>
                                                                        {s.sub_status}
                                                                    </span>
                                                                )}
                                                                {s.status === 'resolved' && (
                                                                    <span className="px-2 py-0.5 bg-sunken text-ink-muted text-4xs font-bold uppercase tracking-wider rounded-full">
                                                                        Resolved
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Right panel: Active chat window */}
                <div className="flex-1 h-full bg-surface border border-line rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

                    {selectedSession ? (
                        <div className="flex-1 flex overflow-hidden relative z-10">
                            {/* Main Chat Flow */}
                            <div className="flex-1 flex flex-col overflow-hidden border-r border-line">
                                {/* Chat Header */}
                                <div className="p-6 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-app backdrop-blur-xl shrink-0">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-bold text-ink tracking-tight">
                                                {selectedSession.visitor_name || 'Website Guest'}
                                            </h3>
                                            {selectedSession.visitor_email && (
                                                <span className="text-xs text-ink-muted">({selectedSession.visitor_email})</span>
                                            )}
                                        </div>
                                        {selectedSession.escalation_reason && (
                                            <p className="text-2xs text-rose-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                Escalation Reason: {selectedSession.escalation_reason.replace('_', ' ')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* AI Co-Pilot Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowCopilot(!showCopilot)}
                                            className={`px-3 py-1.5 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border active:scale-95 shrink-0 ${
                                                showCopilot
                                                    ? 'bg-brand-600/10 border-brand-500/30 text-brand-600 dark:text-brand-400 shadow-sm'
                                                    : 'bg-sunken border-line dark:bg-surface dark:border-line text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'
                                            }`}
                                        >
                                            <Sparkles size={11} className={showCopilot ? 'animate-pulse text-brand-500' : ''} />
                                            <span>AI Co-Pilot</span>
                                        </button>

                                        {/* 1. AI Controller Badge & Toggle */}
                                        <div className="flex items-center bg-app border border-line rounded-xl p-1 gap-2 shrink-0">
                                            {selectedSession.status === 'bot_active' ? (
                                                <>
                                                    <span className="px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                                                        <VenaLogo size={12} className="animate-pulse" />
                                                        Vena AI Active
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleClaim(selectedSession.session_uuid)}
                                                        className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-2xs font-bold active:scale-95 transition-all shrink-0"
                                                    >
                                                        Take Charge
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-wider rounded-lg">
                                                        Human Active
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGiveToAi(selectedSession.session_uuid)}
                                                        className="px-3 py-1 border border-line text-ink-secondary rounded-lg text-2xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover active:scale-95 transition-all shrink-0"
                                                    >
                                                        Give to AI
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* 2. Referral Selector Dropdown */}
                                        {staffMembers.length > 0 && (
                                            <div className="relative shrink-0">
                                                <select
                                                    value={selectedSession.referred_to || ''}
                                                    onChange={(e) => handleRefer(selectedSession.session_uuid, e.target.value || null)}
                                                    className="px-3 py-2 bg-app border border-line rounded-xl text-xs font-bold text-ink-secondary focus:outline-none outline-none cursor-pointer"
                                                >
                                                    <option value="">Refer to Staff...</option>
                                                    {staffMembers.map(member => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.name} ({member.role.toUpperCase()})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* 3. Status Sub-state Buttons Selector */}
                                        <div className="flex bg-app border border-line rounded-xl p-0.5 shrink-0">
                                            {[
                                                { id: 'active', label: 'Active' },
                                                { id: 'fixed', label: 'Fixed' },
                                                { id: 'pending', label: 'Pending' },
                                            ].map(tag => (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => handleSetStatus(selectedSession.session_uuid, tag.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all ${
                                                        selectedSession.sub_status === tag.id || (!selectedSession.sub_status && tag.id === 'active')
                                                            ? 'bg-sunken shadow-sm text-ink'
                                                            : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'
                                                    }`}
                                                >
                                                    {tag.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* 4. Resolve & Release Buttons */}
                                        {selectedSession.status === 'human_requested' && (
                                            <button
                                                onClick={() => handleClaim(selectedSession.session_uuid)}
                                                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 active:scale-95 transition-all shadow-md shrink-0"
                                            >
                                                Claim Session
                                            </button>
                                        )}

                                        {selectedSession.status === 'bot_active' && (
                                            <button
                                                onClick={() => handleSetStatus(selectedSession.session_uuid, 'resolved')}
                                                className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center gap-1 shrink-0"
                                            >
                                                <CheckCircle2 size={13} />
                                                Resolve
                                            </button>
                                        )}

                                        {selectedSession.claimed_by === currentUser.id && selectedSession.status === 'agent_active' && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleRelease(selectedSession.session_uuid)}
                                                    className="px-3.5 py-2 border border-line text-ink-secondary rounded-xl text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover active:scale-95 transition-all flex items-center gap-1 shrink-0"
                                                >
                                                    <LogOut size={13} className="rotate-180" />
                                                    Release
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(selectedSession.session_uuid)}
                                                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center gap-1 shrink-0"
                                                >
                                                    <CheckCircle2 size={13} />
                                                    Resolve
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleDeleteSession(selectedSession.session_uuid)}
                                            title="Delete Session"
                                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md flex items-center gap-1.5 shrink-0"
                                        >
                                            <Trash2 size={13} />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Messages display */}
                                <div ref={chatScrollRef} className="flex-1 chat-scroll p-8 space-y-4">
                                    <div className="max-w-3xl mx-auto space-y-4">
                                        {messages.map((m) => {
                                            const isVisitor = m.sender_type === 'visitor';
                                            const isBot = m.sender_type === 'bot';
                                            const isAgent = m.sender_type === 'agent';
                                            const isSystem = m.sender_type === 'system';

                                            if (isSystem) {
                                                return (
                                                    <div key={m.id} className="flex justify-center my-2">
                                                        <span className="px-4 py-1.5 bg-sunken border border-line dark:border-line rounded-full text-2xs text-ink-muted font-bold uppercase tracking-wider text-center max-w-md">
                                                            {m.body}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div 
                                                    key={m.id} 
                                                    className={`flex ${isVisitor ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-1 duration-normal`}
                                                >
                                                    <div className={`max-w-md rounded-2xl px-5 py-3.5 shadow-sm text-sm ${
                                                        isVisitor 
                                                            ? 'bg-sunken text-ink rounded-bl-none' 
                                                            : isBot 
                                                                ? 'bg-brand-600 text-white rounded-br-none font-medium' 
                                                                : 'bg-brand-600 text-white rounded-br-none font-medium'
                                                    }`}>
                                                        {/* Sender name if group chat */}
                                                        <div className="text-2xs font-bold uppercase tracking-wider mb-1 opacity-70 flex items-center gap-1.5">
                                                            {isBot && <VenaLogo size={12} />}
                                                            {m.sender_name || (isVisitor ? 'Guest' : isBot ? 'Vena (AI)' : 'Agent')}
                                                        </div>
                                                        
                                                        <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>

                                                        <div className="text-3xs mt-1.5 opacity-60 text-right">
                                                            {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {visitorTyping && (
                                            <div className="flex justify-start items-center gap-2 text-xs text-ink-muted font-medium py-2 animate-pulse">
                                                <Loader2 size={12} className="animate-spin text-neutral-300" />
                                                <span>{typingText}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Input Form area */}
                                <div className="p-6 border-t border-line bg-white/80 dark:bg-app backdrop-blur-xl">
                                    <div className="max-w-3xl mx-auto relative">
                                        {/* Canned response suggestion dropdown */}
                                        {slashSuggestions.length > 0 && (
                                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-line rounded-2xl shadow-2xl p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2">
                                                <div className="px-3 py-1.5 text-2xs font-bold text-ink-muted uppercase tracking-widest border-b border-line mb-1">
                                                    Canned Responses (Tap to insert)
                                                </div>
                                                {slashSuggestions.map((r, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => selectCannedResponse(r)}
                                                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center justify-between group"
                                                    >
                                                        <span className="font-bold text-ink group-hover:text-brand-500">
                                                            /{r.shortcode}
                                                        </span>
                                                        <span className="text-ink-muted text-2xs truncate max-w-[300px]">
                                                            {r.title}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Supervision / Active state resolution */}
                                        {selectedSession.status === 'resolved' ? (
                                            <div className="p-4 bg-app border border-line rounded-2xl text-ink-muted flex items-center gap-3 text-xs font-semibold">
                                                <CheckCircle2 size={16} className="text-ink-muted shrink-0" />
                                                <span>This session has been resolved and closed.</span>
                                            </div>
                                        ) : (selectedSession.claimed_by && selectedSession.claimed_by !== currentUser.id && !isOwner) ? (
                                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl text-amber-800 dark:text-amber-300 flex items-center gap-3 text-xs font-semibold">
                                                <ShieldAlert size={16} className="text-amber-500 shrink-0" />
                                                <span>This chat is currently owned by {selectedSession.claimed_by_name || 'another agent'}. You cannot reply.</span>
                                            </div>
                                        ) : (selectedSession.claimed_by !== currentUser.id) ? (
                                            // Unclaimed / Bot Active / Supervision Read-Only state
                                            <div className="p-5 bg-surface/50 dark:bg-surface border border-line rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex items-center gap-3 text-xs font-semibold text-ink-secondary">
                                                    <ShieldAlert size={16} className="text-brand-500 shrink-0 animate-pulse" />
                                                    <div>
                                                        <p className="font-bold text-ink">Supervision Mode (Read-Only)</p>
                                                        <p className="text-2xs text-ink-muted mt-0.5">
                                                            {selectedSession.status === 'bot_active' 
                                                                ? 'Vena AI is currently handling the thread.' 
                                                                : selectedSession.claimed_by 
                                                                    ? `Owned by ${selectedSession.claimed_by_name || 'another agent'}.`
                                                                    : 'This session is waiting in the queue.'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                     {selectedSession.status === 'bot_active' && (
                                                         <button
                                                             type="button"
                                                             onClick={() => handleSetStatus(selectedSession.session_uuid, 'resolved')}
                                                             className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
                                                         >
                                                             <CheckCircle2 size={13} />
                                                             Resolve Session
                                                         </button>
                                                     )}
                                                     <button
                                                         type="button"
                                                         onClick={() => handleClaim(selectedSession.session_uuid)}
                                                         className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
                                                     >
                                                         Take Over Session
                                                     </button>
                                                 </div>
                                            </div>
                                        ) : (
                                            // Active Claimed (isClaimedByMe === true) Form
                                            <form onSubmit={handleReply} className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={handleInputChange}
                                                    className="flex-1 px-5 py-4 bg-app border border-line rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all text-ink"
                                                    placeholder="Type message... (type '/' for canned responses)"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!replyText.trim() || sending}
                                                    className="p-4 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shrink-0 shadow-lg "
                                                >
                                                    <Send size={18} />
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Vena AI Co-Pilot Panel */}
                            {showCopilot && (
                                <div className="w-96 h-full flex flex-col bg-sunken/20 dark:bg-app overflow-hidden shrink-0 animate-in slide-in-from-right duration-slow border-l border-line">
                                    <div className="p-6 border-b border-line bg-sunken/50 dark:bg-app shrink-0">
                                        <h3 className="text-sm font-bold text-ink tracking-tight flex items-center gap-2">
                                            <VenaLogo className="animate-pulse" size={16} />
                                            Vena Assist Co-Pilot
                                        </h3>
                                        <p className="text-2xs text-ink-muted mt-1">Real-time co-pilot assist drawer</p>
                                    </div>

                                    <div className="flex-1 chat-scroll p-4 space-y-4">
                                        {/* Suggestion Card */}
                                        <div className="rounded-2xl border border-brand-500/10 bg-brand-500/[0.02] p-4 relative overflow-hidden flex flex-col gap-3">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
                                            
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-2xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    Suggested Draft
                                                </h4>
                                                {copilotSuggestion && (
                                                    <span className={`px-2 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider border ${
                                                        copilotConfidence === 'high' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                        copilotConfidence === 'medium' ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' :
                                                        'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    }`}>
                                                        Confidence: {copilotConfidence}
                                                    </span>
                                                )}
                                            </div>

                                            {copilotLoading ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-ink-muted gap-2">
                                                    <Loader2 className="animate-spin text-brand-400" size={18} />
                                                    <span className="text-2xs font-medium animate-pulse">Analyzing context...</span>
                                                </div>
                                            ) : copilotSuggestion ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={editableSuggestion}
                                                        onChange={(e) => setEditableSuggestion(e.target.value)}
                                                        rows={4}
                                                        className="w-full text-xs leading-relaxed text-ink-secondary dark:text-ink bg-white/40 dark:bg-app p-3 rounded-xl border border-line outline-none focus:border-brand-500/40 transition-all resize-none"
                                                    />
                                                    
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReplyDirect(copilotSuggestion)}
                                                            className="py-2 bg-neutral-800 hover:bg-interactive-hover text-neutral-200 rounded-lg text-3xs font-bold uppercase tracking-wider transition-all"
                                                        >
                                                            Send As-Is
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReplyDirect(editableSuggestion)}
                                                            className="py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-3xs font-bold uppercase tracking-wider transition-all"
                                                        >
                                                            Edit & Send
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReplyText(editableSuggestion);
                                                                window.dispatchEvent(new CustomEvent('amd:toast', {
                                                                    detail: { message: 'Injected into reply box!', type: 'info' }
                                                                }));
                                                            }}
                                                            className="py-2 border border-line text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-3xs font-bold uppercase tracking-wider transition-all"
                                                        >
                                                            Inject
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-2xs text-ink-muted py-4 text-center">
                                                    Waiting for next customer message...
                                                </p>
                                            )}
                                        </div>

                                        {/* Knowledge Base / Cheat Sheet Card */}
                                        <div className="rounded-2xl border border-line bg-surface/30 dark:bg-surface p-4">
                                            <h4 className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                                                {copilotSimilarKb.length > 0 ? "Verified KB Matches" : "Support Cheat Sheet"}
                                            </h4>
                                            
                                            <div className="space-y-3.5">
                                                {copilotSimilarKb.length > 0 ? (
                                                    copilotSimilarKb.map((item, idx) => (
                                                        <div key={idx} className="border-b border-line pb-2.5 last:border-b-0 last:pb-0 flex flex-col gap-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-3xs font-bold text-ink truncate max-w-[200px]">
                                                                    Q: {item.question}
                                                                </span>
                                                                <span className="text-4xs bg-sunken text-ink-muted px-1.5 py-0.5 rounded font-bold">
                                                                    Seen {item.times_seen}x
                                                                </span>
                                                            </div>
                                                            <p className="text-3xs text-ink-muted leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                {item.agent_answer}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    [
                                                        { q: "How to handle refunds?", a: "Direct the user to email billing@venqore.com with their tenant name and transaction ID." },
                                                        { q: "Resetting store passcode?", a: "Go to Store Settings -> Staff -> select user -> Edit PIN. Only Owners can change this." },
                                                        { q: "Adding a new cashier?", a: "Cashiers are store-specific. Invite them at Store Admin -> Staff -> Invite Staff." }
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="border-b border-line pb-2 last:border-b-0 last:pb-0">
                                                            <p className="text-2xs font-bold text-ink">{item.q}</p>
                                                            <p className="text-3xs text-ink-muted mt-1 leading-relaxed">{item.a}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-ink-muted text-center px-6">
                            <MessageSquare className="text-neutral-300 dark:text-ink mb-3" size={64} />
                            <h4 className="text-sm font-bold text-ink-secondary">No Chat Selected</h4>
                            <p className="text-1xs text-ink-muted mt-1 max-w-[280px]">
                                Click on a support session from the queue on the left to start conversing in real-time.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Resolve & AI Learning Log Modal */}
            {showResolveModal && (
                <div className="fixed inset-0 z-drawer bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-slow">
                    <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden flex flex-col gap-6 animate-in zoom-in-95 duration-slow">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none -mt-32 -mr-32" />
                        
                        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 shrink-0">
                            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20 text-brand-400">
                                <Sparkles size={18} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white tracking-tight">AI Learning Engine Log</h3>
                                <p className="text-xs text-ink-muted">Teach Vena by documenting your verified resolution</p>
                            </div>
                        </div>

                        <form onSubmit={handleResolveSubmit} className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2.5">
                                    Ticket Category
                                </label>
                                <select
                                    value={resolveCategory}
                                    onChange={(e) => setResolveCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all cursor-pointer animate-in fade-in"
                                >
                                    <option value="general">General Support / FAQ</option>
                                    <option value="billing">Billing & Subscriptions</option>
                                    <option value="checkout">Checkout & Orders</option>
                                    <option value="features">Feature Requests & Products</option>
                                    <option value="bug">Technical Bug / Issue</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2.5">
                                    Core Problem Encountered
                                </label>
                                <textarea
                                    required
                                    value={resolveProblem}
                                    onChange={(e) => setResolveProblem(e.target.value)}
                                    rows={3}
                                    placeholder="Explain the specific issue the customer had..."
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-ink-secondary resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2.5">
                                    Verified Solution Provided
                                </label>
                                <textarea
                                    required
                                    value={resolveSolution}
                                    onChange={(e) => setResolveSolution(e.target.value)}
                                    rows={3}
                                    placeholder="Outline the exact steps or correct answer that resolved it..."
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-ink-secondary resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 border-t border-neutral-800 pt-6 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowResolveModal(false)}
                                    className="flex-1 py-3 text-center border border-neutral-800 hover:bg-interactive-hover rounded-xl text-xs font-bold text-ink-muted active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingResolve}
                                    className="flex-1 py-3 text-center bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {submittingResolve ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            Resolving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={13} />
                                            Resolve & Log
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                main {
                    overflow: hidden !important;
                    height: 100vh !important;
                }
                main > .overflow-y-auto {
                    overflow: hidden !important;
                    height: 100% !important;
                    flex: 1 !important;
                    min-height: 0 !important;
                    padding: 0 !important;
                }
                .chat-scroll {
                    overflow-y: auto;
                    scrollbar-width: thin;
                }
                .chat-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-scroll::-webkit-scrollbar-thumb {
                    background: rgb(var(--vq-slate-300));
                    border-radius: 10px;
                }
                .chat-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgb(var(--vq-slate-400));
                }
                .dark .chat-scroll::-webkit-scrollbar-thumb {
                    background: rgb(var(--vq-slate-700));
                    border-radius: 10px;
                }
                .dark .chat-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgb(var(--vq-slate-600));
                }
`}</style>
        </OneGlanceLayout>
    );
}
