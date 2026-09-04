import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, Sparkles, X, ArrowRight, ArrowUpRight, Clock, Bell,
    AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, CornerDownLeft,
    TrendingUp, Box, ShoppingCart, Users, DollarSign, FileText, Settings,
    Camera, Mic, Loader2, ShieldCheck, Zap, RotateCcw, Volume2, VolumeX,
    Check, Sliders, ExternalLink, RefreshCw
} from 'lucide-react';
import { searchRegistry, getCategoryLabel, CATEGORIES } from '@/Data/AppRegistry';
import SmartCapturePanel from '@/Components/SmartCapturePanel';
import { useAppearance } from '@/Contexts/AppearanceContext';
import { useTheme } from '@/Contexts/ThemeContext';
import { useWorkspace } from '@/Contexts/WorkspaceContext';

const STORAGE_RECENT_QUERIES = 'venqore_island_recent_queries';
const STORAGE_SOUND_ENABLED = 'venqore_island_sound_enabled';

// ─────────────────────────────────────────────────────────────────────────────
// Synthesize organic Apple-like acoustic haptics with Web Audio API (Zero assets)
// ─────────────────────────────────────────────────────────────────────────────
export const playIslandHaptic = (type = 'pop', soundEnabled = true) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        if (type === 'ring' || type === 'alert') {
            // Pleasant double-bell alert chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1175, now + 0.14);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        } else if (type === 'pop') {
            // Tactile bubble pop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
            gain.gain.setValueAtTime(0.10, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'click') {
            // Subtle crisp micro-click
            osc.type = 'sine';
            osc.frequency.setValueAtTime(360, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'silent' || type === 'dismiss') {
            // Low soft descent
            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'success') {
            // Bright harmonic chime
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {
        // Audio context may require explicit user activation on some browsers
    }
};

export default function AiIsland({ onAskAi, isAiLoading = false, compact = false }) {
    const { auth, store, growth_engine, vensynq_enabled } = usePage().props;
    const { isDark: appearanceIsDark } = useAppearance() || { isDark: true };
    const { isDarkMode: themeIsDark } = useTheme() || { isDarkMode: true };
    const isDark = store ? appearanceIsDark : themeIsDark;
    const { activeInvoices, currentInvoiceId } = useWorkspace() || {};

    // ─────────────────────────────────────────────────────────────────────────
    // Active Island States: 'rest' | 'notification' | 'critical' | 'working' | 'focused'
    // ─────────────────────────────────────────────────────────────────────────
    const [islandState, setIslandState] = useState('rest');
    const [soundEnabled, setSoundEnabled] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_SOUND_ENABLED);
            return saved !== null ? saved === 'true' : true;
        } catch (e) {
            return true;
        }
    });

    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'ai' | 'screens' | 'records'
    const [dbResults, setDbResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSearchingDb, setIsSearchingDb] = useState(false);
    const [aiAnswer, setAiAnswer] = useState(null);
    const [isAiAnswering, setIsAiAnswering] = useState(false);
    
    // Ambient rotating insight ticker
    const [tickerIndex, setTickerIndex] = useState(0);
    const [tickerFade, setTickerFade] = useState(true);

    // Live Notifications & Alerts
    const [notificationsSummary, setNotificationsSummary] = useState({
        unread_count: 0,
        critical_count: 0,
        latest: [],
    });
    const [activeNotification, setActiveNotification] = useState(null);
    const [alertCountdown, setAlertCountdown] = useState(100);
    const [isHoveringAlert, setIsHoveringAlert] = useState(false);

    // Smart Capture modal state
    const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
    const [smartCaptureTab, setSmartCaptureTab] = useState('image');

    // Recent queries
    const [recentQueries, setRecentQueries] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_RECENT_QUERIES);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const inputRef = useRef(null);
    const containerRef = useRef(null);

    const userRole = auth?.user?.role;
    const userPerms = useMemo(() => auth?.user?.permissions || [], [auth?.user?.permissions]);
    const isFullAccess = userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || userRole === 'platform_admin';
    const canUseSmartCapture = vensynq_enabled && (isFullAccess || userPerms.some(p => p.startsWith('pos') || p.startsWith('sales') || p.startsWith('purchases')));

    // Save sound toggle
    const toggleSound = (e) => {
        e?.stopPropagation();
        const next = !soundEnabled;
        setSoundEnabled(next);
        try {
            localStorage.setItem(STORAGE_SOUND_ENABLED, String(next));
        } catch (err) {}
        if (next) playIslandHaptic('pop', true);
    };

    const openIsland = useCallback(() => {
        playIslandHaptic('pop', soundEnabled);
        setIslandState('focused');
        setTimeout(() => inputRef.current?.focus(), 60);
    }, [soundEnabled]);

    const closeIsland = useCallback(() => {
        playIslandHaptic('dismiss', soundEnabled);
        setIslandState('rest');
        setQuery('');
        setDbResults([]);
        setAiAnswer(null);
        setIsSearchingDb(false);
        setIsAiAnswering(false);
    }, [soundEnabled]);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Transaction Guard (Never interrupt active cashiers / invoices)
    // ──────────────────────────────────────────────────────────────────────────
    const isUserTransacting = useCallback(() => {
        if (typeof window === 'undefined') return false;
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pos') || currentPath.includes('/sales/create') || currentPath.includes('/purchases/create')) {
            return true;
        }
        if (activeInvoices && Object.keys(activeInvoices).length > 0 && currentInvoiceId) {
            return true;
        }
        const activeElem = document.activeElement;
        if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA' || activeElem.tagName === 'SELECT')) {
            if (activeElem.id !== 'ai-island-input') {
                return true;
            }
        }
        return false;
    }, [activeInvoices, currentInvoiceId]);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Fetch Notification Summary & Live Event Subscriptions
    // ──────────────────────────────────────────────────────────────────────────
    const triggerNotificationPill = useCallback((notif) => {
        if (!notif) return;
        setActiveNotification(notif);
        setAlertCountdown(100);
        playIslandHaptic('ring', soundEnabled);

        if (notif.severity === 'critical') {
            setIslandState('critical');
        } else {
            setIslandState('notification');
        }
    }, [soundEnabled]);

    const fetchNotifications = useCallback(() => {
        if (!store?.slug && !auth?.user) return;
        window.axios?.get('/api/notifications/summary')
            .then(res => {
                if (res.data) {
                    setNotificationsSummary(res.data);
                    const topNotif = res.data.latest?.find(n => !n.read_at && (n.severity === 'critical' || n.severity === 'important'));
                    if (topNotif && !isUserTransacting() && islandState === 'rest') {
                        triggerNotificationPill(topNotif);
                    }
                }
            })
            .catch(() => {});
    }, [store?.slug, auth?.user, isUserTransacting, islandState, triggerNotificationPill]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 35000); // 35s poll
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Listen for custom global app alerts (e.g. from POS, Invoicing, Sync)
    useEffect(() => {
        const handleCustomAlert = (event) => {
            if (event.detail && !isUserTransacting() && islandState !== 'focused') {
                triggerNotificationPill(event.detail);
            }
        };
        const handleSyncEvent = (event) => {
            if (islandState === 'rest') {
                setIslandState('working');
                setTimeout(() => {
                    setIslandState('rest');
                }, event.detail?.duration || 2500);
            }
        };
        window.addEventListener('venqore-island-alert', handleCustomAlert);
        window.addEventListener('venqore-island-sync', handleSyncEvent);
        return () => {
            window.removeEventListener('venqore-island-alert', handleCustomAlert);
            window.removeEventListener('venqore-island-sync', handleSyncEvent);
        };
    }, [islandState, isUserTransacting, triggerNotificationPill]);

    // Notification auto-dismiss countdown bar
    useEffect(() => {
        let timer;
        if ((islandState === 'notification' || islandState === 'critical') && !isHoveringAlert) {
            timer = setInterval(() => {
                setAlertCountdown((prev) => {
                    if (prev <= 0) {
                        clearInterval(timer);
                        setIslandState('rest');
                        setActiveNotification(null);
                        return 100;
                    }
                    return prev - 2;
                });
            }, 80); // ~4 seconds
        }
        return () => clearInterval(timer);
    }, [islandState, isHoveringAlert]);

    const dismissNotification = (e) => {
        e?.stopPropagation();
        playIslandHaptic('dismiss', soundEnabled);
        setActiveNotification(null);
        setIslandState('rest');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Rotating Ambient Insights & Tips
    // ──────────────────────────────────────────────────────────────────────────
    const ambientInsights = useMemo(() => {
        const list = [];
        if (growth_engine?.popup?.description) {
            list.push(`Growth: ${growth_engine.popup.description}`);
        } else if (growth_engine?.count > 0) {
            list.push(`${growth_engine.count} Growth recommendations available`);
        }
        list.push('Ask Reckoner AI or search records...');
        list.push('Try "Sales today", "Low stock", or "Profit this month"');
        list.push('Press ⌘K / Ctrl+K anytime for Spotlight');
        return list;
    }, [growth_engine]);

    useEffect(() => {
        if (islandState !== 'rest') return;
        const timer = setInterval(() => {
            setTickerFade(false);
            setTimeout(() => {
                setTickerIndex(prev => (prev + 1) % ambientInsights.length);
                setTickerFade(true);
            }, 300);
        }, 6500);
        return () => clearInterval(timer);
    }, [ambientInsights.length, islandState]);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Keyboard Shortcuts: ⌘K / Ctrl+K / ESC
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                if (islandState === 'focused') {
                    closeIsland();
                } else {
                    openIsland();
                }
            }
            if (e.key === 'Escape' && islandState === 'focused') {
                closeIsland();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [islandState, openIsland, closeIsland]);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Search & Query Execution
    // ──────────────────────────────────────────────────────────────────────────
    const checkPerm = useCallback((required) => {
        if (userRole === 'platform_admin') return true;
        if (!required || required.length === 0) return isFullAccess;
        return required.some(p => userPerms.includes(p));
    }, [userRole, isFullAccess, userPerms]);

    const getRequiredPerms = useCallback((item) => {
        if (item.route?.includes('pos')) return ['pos'];
        if (item.route?.includes('inventory') || item.route?.includes('production')) return ['inventory'];
        if (item.route?.includes('sales')) return ['sales', 'sales_view'];
        if (item.route?.includes('reports') || item.route?.includes('finance')) return ['reports', 'finance'];
        if (item.route?.includes('settings')) return ['settings'];
        if (item.route?.includes('parties') || item.route?.includes('customer')) return ['customers'];
        return [];
    }, []);

    // Derive AppRegistry results automatically without cascading setState
    const results = useMemo(() => {
        if (!query || !query.trim()) return [];
        const q = query.trim();
        const appResults = searchRegistry(q);
        return appResults.filter(item => checkPerm(getRequiredPerms(item)));
    }, [query, checkPerm, getRequiredPerms]);

    const handleQueryChange = (val) => {
        setQuery(val);
        if (!val || val.trim().length === 0) {
            setDbResults([]);
            setAiAnswer(null);
        }
    };

    // Debounced Database Search
    useEffect(() => {
        if (!query || query.trim().length < 2 || !store?.slug) {
            return;
        }

        const q = query.trim();
        const timeout = setTimeout(() => {
            setIsSearchingDb(true);
            window.axios?.get(route('store.global.search', { store_slug: store.slug }), { params: { query: q } })
                .then(res => setDbResults(res.data || []))
                .catch(() => setDbResults([]))
                .finally(() => setIsSearchingDb(false));
        }, 240);
        return () => clearTimeout(timeout);
    }, [query, store?.slug]);

    const saveRecentQuery = (text) => {
        if (!text || text.trim().length === 0) return;
        const updated = [text, ...recentQueries.filter(q => q.toLowerCase() !== text.toLowerCase())].slice(0, 5);
        setRecentQueries(updated);
        try {
            localStorage.setItem(STORAGE_RECENT_QUERIES, JSON.stringify(updated));
        } catch (e) {}
    };

    // Execute direct AI query
    const executeAiQuestion = (questionText) => {
        if (!store?.slug) return;
        playIslandHaptic('click', soundEnabled);
        setIsAiAnswering(true);
        setAiAnswer(null);

        window.axios?.post(route('store.ai.query', { store_slug: store.slug }), { message: questionText })
            .then(res => {
                if (res.data?.response || res.data?.answer || res.data?.summary) {
                    setAiAnswer({
                        text: res.data.response || res.data.answer || res.data.summary,
                        records: res.data.records || [],
                    });
                    playIslandHaptic('success', soundEnabled);
                }
            })
            .catch(err => {
                console.error("AI Island error:", err);
            })
            .finally(() => {
                setIsAiAnswering(false);
            });
    };

    const handleQuickPrompt = (promptText) => {
        setQuery(promptText);
        saveRecentQuery(promptText);
        executeAiQuestion(promptText);
    };

    // Keyboard navigation
    const totalSelectables = results.length + dbResults.length + (query.length > 2 ? 1 : 0);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            playIslandHaptic('click', soundEnabled);
            setSelectedIndex(prev => (prev + 1) % Math.max(1, totalSelectables));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            playIslandHaptic('click', soundEnabled);
            setSelectedIndex(prev => (prev - 1 + totalSelectables) % Math.max(1, totalSelectables));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (aiAnswer) return;
            if (selectedIndex === 0 && query.length > 2 && results.length === 0 && dbResults.length === 0) {
                handleQuickPrompt(query);
                return;
            }
            if (selectedIndex < results.length) {
                navigateToItem(results[selectedIndex]);
            } else if (dbResults[selectedIndex - results.length]) {
                const dbItem = dbResults[selectedIndex - results.length];
                if (dbItem.url) {
                    playIslandHaptic('pop', soundEnabled);
                    router.visit(dbItem.url);
                    closeIsland();
                }
            } else if (query.length > 2) {
                handleQuickPrompt(query);
            }
        }
    };

    const navigateToItem = (item) => {
        try {
            playIslandHaptic('pop', soundEnabled);
            const routeName = item.route.startsWith('store.') ? item.route : `store.${item.route}`;
            const url = route(routeName, { ...item.queryParams, store_slug: store?.slug });
            router.visit(url);
            closeIsland();
        } catch (e) {
            console.warn('Route not found:', item.route);
            closeIsland();
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                if (islandState === 'focused') {
                    closeIsland();
                }
            }
        };
        if (islandState === 'focused') {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [islandState, closeIsland]);

    // ──────────────────────────────────────────────────────────────────────────
    // Authentic Apple Dynamic Island Dimensions & Spring Styling
    // ──────────────────────────────────────────────────────────────────────────
    const getIslandStyle = () => {
        if (compact) {
            return {
                width: '180px',
                height: '36px',
                borderRadius: '9999px',
            };
        }
        switch (islandState) {
            case 'notification':
            case 'critical':
                return {
                    width: 'min(440px, 92vw)',
                    height: '72px',
                    borderRadius: '26px',
                };
            case 'working':
                return {
                    width: '280px',
                    height: '38px',
                    borderRadius: '9999px',
                };
            case 'rest':
            default:
                return {
                    width: 'min(380px, 86vw)',
                    height: '38px',
                    borderRadius: '9999px',
                };
        }
    };

    const islandDims = getIslandStyle();

    return (
        <div ref={containerRef} className="relative flex items-center justify-center select-none">
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* 1. HERO DYNAMIC ISLAND CUTOUT (Deep Obsidian Glass with Apple Spring)   */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {islandState !== 'focused' && (
                <button
                    type="button"
                    onClick={openIsland}
                    onMouseEnter={() => setIsHoveringAlert(true)}
                    onMouseLeave={() => setIsHoveringAlert(false)}
                    style={{
                        width: islandDims.width,
                        height: islandDims.height,
                        borderRadius: islandDims.borderRadius,
                        transition: 'all 460ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className={`group relative flex items-center justify-between cursor-pointer overflow-hidden backdrop-blur-2xl bg-[#06080c]/95 text-white border border-white/[0.12] ring-1 ring-black/80 shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18)] hover:border-white/[0.22] hover:shadow-[0_14px_45px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all outline-none focus:outline-none ${
                        islandState === 'critical'
                            ? 'ring-2 ring-red-500/50 border-red-500/40 bg-[#120507]/95'
                            : islandState === 'notification'
                            ? 'ring-2 ring-amber-500/40 border-amber-500/30 bg-[#0e0a05]/95'
                            : ''
                    }`}
                >
                    {/* Subtle Front Camera Iris Dot */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#15171e] ring-1 ring-white/10 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />

                    {/* ── STATE: REST / IDLE PILL ── */}
                    {islandState === 'rest' && (
                        <div className="w-full h-full flex items-center justify-between px-3.5 animate-in fade-in duration-300">
                            {/* Left: Glowing Pulse Dot & Brand */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="relative flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/20 animate-ping" />
                                </div>
                                <span className="text-[11px] font-bold tracking-tight text-white/90">
                                    {compact ? 'VenQore' : 'VenQore AI'}
                                </span>
                            </div>

                            {/* Middle: Rotating Ambient Ticker */}
                            {!compact && (
                                <div className="flex-1 min-w-0 px-2.5 overflow-hidden text-left">
                                    <p
                                        className={`text-[11px] text-neutral-300 font-medium truncate transition-all duration-300 ${
                                            tickerFade ? 'opacity-90 translate-y-0' : 'opacity-0 -translate-y-1'
                                        }`}
                                    >
                                        {ambientInsights[tickerIndex]}
                                    </p>
                                </div>
                            )}

                            {/* Right: Shortcut Badge / Unread Dot */}
                            <div className="flex items-center gap-1.5 mr-4 shrink-0">
                                {notificationsSummary.unread_count > 0 && (
                                    <span className="flex items-center justify-center h-4 px-1.5 text-[9px] font-bold bg-amber-500 text-black rounded-full shadow-sm animate-pulse">
                                        {notificationsSummary.unread_count}
                                    </span>
                                )}
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-white/10 text-neutral-400 border border-white/5">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    )}

                    {/* ── STATE: WORKING / SYNCING ── */}
                    {islandState === 'working' && (
                        <div className="w-full h-full flex items-center justify-between px-3.5 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                                <span className="text-xs font-semibold text-white">Reckoner Synchronizing...</span>
                            </div>
                            <div className="flex items-end gap-0.5 h-3 mr-4">
                                <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" />
                                <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* ── STATE: NOTIFICATION / ALERT MORPH ── */}
                    {(islandState === 'notification' || islandState === 'critical') && (
                        <section
                            aria-label="Notification alert"
                            className="w-full h-full px-3.5 py-2 flex flex-col justify-between animate-in fade-in duration-200"
                        >
                            <div className="flex items-center justify-between gap-3">
                                {/* Left Icon */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                                            islandState === 'critical'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        }`}
                                    >
                                        {islandState === 'critical' ? (
                                            <AlertCircle className="w-4 h-4 animate-pulse" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="leading-tight text-left min-w-0">
                                        <p className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                                            {activeNotification?.title || (islandState === 'critical' ? 'Critical Alert' : 'System Alert')}
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                        </p>
                                        <p className="text-[11px] text-neutral-300 truncate max-w-[220px] sm:max-w-[260px]">
                                            {activeNotification?.message || activeNotification?.desc || 'Action required in your store.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-1.5 mr-4 shrink-0">
                                    {activeNotification?.action_url ? (
                                        <Link
                                            href={activeNotification.action_url}
                                            onClick={() => setIslandState('rest')}
                                            className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-all active:scale-95"
                                        >
                                            {activeNotification.action_text || 'View'}
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={openIsland}
                                            className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-all active:scale-95"
                                        >
                                            Review
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={dismissNotification}
                                        className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                        title="Dismiss Alert"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Linear Auto-dismiss Progress Bar */}
                            <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mt-1">
                                <div
                                    className={`h-full transition-all duration-100 ease-linear ${
                                        islandState === 'critical' ? 'bg-red-400' : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${alertCountdown}%` }}
                                />
                            </div>
                        </section>
                    )}
                </button>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* 2. FOCUSED EXPANDED OVERLAY (Mounted via Portal for crisp layering)     */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {islandState === 'focused' && (
                        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-3 px-3 sm:px-4 select-none">
                            {/* Backdrop Blur Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                onClick={closeIsland}
                                className="fixed inset-0 bg-black/65 backdrop-blur-md"
                            />

                            {/* Expanded Island Spotlight Card */}
                            <motion.div
                                initial={{ opacity: 0, y: -26, scale: 0.93 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -18, scale: 0.94 }}
                                transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.75 }}
                                className="relative w-full max-w-2xl rounded-3xl border border-white/[0.12] bg-[#07090e]/95 text-white shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden z-10 backdrop-blur-2xl"
                            >
                                {/* Top Search Input Bar */}
                                <div className="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shrink-0 mr-3 shadow-md shadow-indigo-500/30">
                                        {isAiAnswering || isSearchingDb ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={15} className="animate-pulse" />
                                        )}
                                    </div>

                                    <input
                                        id="ai-island-input"
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => handleQueryChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask Reckoner AI (e.g. sales today, net profit, stock) or search screens & records..."
                                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm font-medium h-9 text-white placeholder:text-neutral-400"
                                        autoComplete="off"
                                    />

                                    <div className="flex items-center gap-1.5 ml-2">
                                        {/* Smart Scan Trigger (Camera) */}
                                        {canUseSmartCapture && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    playIslandHaptic('pop', soundEnabled);
                                                    setSmartCaptureTab('image');
                                                    setIsSmartCaptureOpen(true);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                                title="AI Smart Scan (Invoice / Barcode / Receipt)"
                                            >
                                                <Camera size={16} />
                                            </button>
                                        )}

                                        {/* Sound Toggle */}
                                        <button
                                            type="button"
                                            onClick={toggleSound}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
                                        >
                                            {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
                                        </button>

                                        {query.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleQueryChange('');
                                                    setAiAnswer(null);
                                                    playIslandHaptic('click', soundEnabled);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                            >
                                                <X size={15} />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={closeIsland}
                                            className="px-2 py-1 text-3xs font-mono font-semibold rounded-md bg-white/10 text-neutral-400 hover:text-white hover:bg-white/20 transition-colors"
                                        >
                                            ESC
                                        </button>
                                    </div>
                                </div>

                                {/* Loading / Computing Shimmer Line */}
                                {(isAiAnswering || isSearchingDb) && (
                                    <div className="h-0.5 w-full bg-neutral-800 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[shimmer_1.4s_infinite] w-full" />
                                    </div>
                                )}

                                {/* Category Tabs Filter Bar */}
                                {query && (
                                    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-black/20 text-xs font-semibold">
                                        {[
                                            { id: 'all', label: 'All Results' },
                                            { id: 'ai', label: 'Reckoner AI' },
                                            { id: 'screens', label: `Screens (${results.length})` },
                                            { id: 'records', label: `Records (${dbResults.length})` },
                                        ].map(tab => (
                                            <button
                                                type="button"
                                                key={tab.id}
                                                onClick={() => {
                                                    setActiveTab(tab.id);
                                                    playIslandHaptic('click', soundEnabled);
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-3xs uppercase tracking-wider transition-all ${
                                                    activeTab === tab.id
                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Main Results & Intelligence Body */}
                                <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-3 space-y-3.5">
                                    {/* ── 1. AI Answer Box ── */}
                                    {aiAnswer && (
                                        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-white">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-500/20">
                                                <div className="flex items-center gap-2 font-bold text-emerald-400">
                                                    <Sparkles size={15} />
                                                    <span>Reckoner Intelligence Response</span>
                                                </div>
                                                <span className="text-3xs font-mono text-emerald-400/80">Real-time DB Sync</span>
                                            </div>
                                            <p className="whitespace-pre-line leading-relaxed text-neutral-200">{aiAnswer.text}</p>
                                        </div>
                                    )}

                                    {/* ── 2. If Query is Empty: Quick Suggested Prompts, Recents & Growth Engine ── */}
                                    {!query && (
                                        <div className="space-y-4 py-1">
                                            {/* Quick Reckoner Calculations */}
                                            <div>
                                                <p className="px-2 mb-2 text-3xs font-bold uppercase tracking-wider text-neutral-400">
                                                    Instant Reckoner Calculations
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {[
                                                        { label: "Today's Sales Summary", prompt: "sales today", icon: DollarSign },
                                                        { label: 'Net Profit This Month', prompt: 'profit this month', icon: TrendingUp },
                                                        { label: 'Low Stock Alert Items', prompt: 'low stock', icon: Box },
                                                        { label: 'Customer Receivables Total', prompt: 'receivables', icon: Users },
                                                    ].map((item, idx) => {
                                                        const Icon = item.icon;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={idx}
                                                                onClick={() => handleQuickPrompt(item.prompt)}
                                                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-left transition-colors text-xs font-semibold group text-neutral-200 border border-white/[0.04]"
                                                            >
                                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                                                                    <Icon size={14} />
                                                                </div>
                                                                <span className="flex-1 truncate">{item.label}</span>
                                                                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Recent Queries */}
                                            {recentQueries.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between px-2 mb-1.5">
                                                        <p className="text-3xs font-bold uppercase tracking-wider text-neutral-400">
                                                            Recent Searches
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRecentQueries([]);
                                                                localStorage.removeItem(STORAGE_RECENT_QUERIES);
                                                            }}
                                                            className="text-3xs text-neutral-500 hover:text-neutral-300"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 px-2">
                                                        {recentQueries.map((rq, idx) => (
                                                            <button
                                                                type="button"
                                                                key={idx}
                                                                onClick={() => handleQuickPrompt(rq)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 hover:text-white transition-colors border border-white/5"
                                                            >
                                                                <Clock size={12} className="text-neutral-500" />
                                                                <span>{rq}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Growth Engine Opportunities */}
                                            {growth_engine?.count > 0 && (
                                                <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                                                            <Zap size={14} className="text-amber-400" />
                                                            <span>Growth Engine Opportunities</span>
                                                        </div>
                                                        <Link
                                                            href={route('store.growth-engine.index', { store_slug: store?.slug })}
                                                            onClick={closeIsland}
                                                            className="text-3xs text-purple-300 hover:underline flex items-center gap-0.5 font-bold"
                                                        >
                                                            View All <ArrowUpRight size={10} />
                                                        </Link>
                                                    </div>
                                                    <p className="text-xs text-neutral-300">
                                                        {growth_engine?.popup?.description || `${growth_engine.count} high-impact recommendations ready for review.`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── 3. If Query is Present: AI Prompt + Registry + Database Results ── */}
                                    {query && (
                                        <div className="space-y-3">
                                            {/* Ask Reckoner AI Prompt Banner */}
                                            {!aiAnswer && (activeTab === 'all' || activeTab === 'ai') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickPrompt(query)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-colors text-xs font-semibold text-emerald-300 group"
                                                >
                                                    <div className="p-2 rounded-xl bg-emerald-500 text-black shadow-md shadow-emerald-500/30">
                                                        <Sparkles size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-white truncate">Ask Reckoner AI: "{query}"</p>
                                                        <p className="text-3xs text-neutral-400">Compute metrics, summarize trends or query database</p>
                                                    </div>
                                                    <CornerDownLeft size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            )}

                                            {/* App Screens from AppRegistry */}
                                            {(activeTab === 'all' || activeTab === 'screens') && results.length > 0 && (
                                                <div>
                                                    <p className="px-2 mb-1.5 text-3xs font-bold uppercase tracking-wider text-neutral-400">
                                                        Screens & Features ({results.length})
                                                    </p>
                                                    <div className="space-y-1">
                                                        {results.slice(0, 6).map((item, idx) => {
                                                            const Icon = item.icon || FileText;
                                                            const isSelected = selectedIndex === idx;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={item.id || idx}
                                                                    onClick={() => navigateToItem(item)}
                                                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all text-xs font-semibold ${
                                                                        isSelected
                                                                            ? 'bg-emerald-600 text-white shadow-md'
                                                                            : 'hover:bg-white/10 text-neutral-200'
                                                                    }`}
                                                                >
                                                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white/5 text-neutral-300'}`}>
                                                                        <Icon size={14} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="truncate font-bold">{item.title}</p>
                                                                        <p className={`text-3xs truncate ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>{item.subtitle}</p>
                                                                    </div>
                                                                    <ChevronRight size={14} className="opacity-60" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Database Records */}
                                            {(activeTab === 'all' || activeTab === 'records') && dbResults.length > 0 && (
                                                <div>
                                                    <p className="px-2 mb-1.5 text-3xs font-bold uppercase tracking-wider text-neutral-400">
                                                        Database Records ({dbResults.length})
                                                    </p>
                                                    <div className="space-y-1">
                                                        {dbResults.slice(0, 6).map((item, idx) => {
                                                            const isSelected = selectedIndex === results.length + idx;
                                                            return (
                                                                <a
                                                                    key={idx}
                                                                    href={item.url}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        if (item.url) {
                                                                            playIslandHaptic('pop', soundEnabled);
                                                                            router.visit(item.url);
                                                                            closeIsland();
                                                                        }
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all text-xs font-semibold ${
                                                                        isSelected
                                                                            ? 'bg-emerald-600 text-white shadow-md'
                                                                            : 'hover:bg-white/10 text-neutral-200'
                                                                    }`}
                                                                >
                                                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white/5 text-neutral-300'}`}>
                                                                        <Box size={14} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="truncate font-bold">{item.title || item.name}</p>
                                                                        <p className={`text-3xs truncate ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>{item.type || 'Record'}</p>
                                                                    </div>
                                                                    <ArrowUpRight size={14} className="opacity-60" />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {results.length === 0 && dbResults.length === 0 && !aiAnswer && !isAiAnswering && !isSearchingDb && (
                                                <div className="p-6 text-center text-neutral-400 text-xs">
                                                    <p>No direct screens or database matches found.</p>
                                                    <p className="text-3xs mt-1 text-neutral-500">Press Enter or click above to compute with Reckoner AI.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer / Keyboard Shortcuts */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-black/40 text-3xs text-neutral-400">
                                    <div className="flex items-center gap-3">
                                        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-neutral-300">↑↓</kbd> Navigate</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-neutral-300">↵</kbd> Select</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-neutral-300">ESC</kbd> Close</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="font-mono text-4xs uppercase tracking-widest text-neutral-400">VenQore Dynamic Island</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Smart Capture Intake Panel */}
            {canUseSmartCapture && (
                <SmartCapturePanel
                    isOpen={isSmartCaptureOpen}
                    onClose={() => setIsSmartCaptureOpen(false)}
                    initialTab={smartCaptureTab}
                />
            )}
        </div>
    );
}
