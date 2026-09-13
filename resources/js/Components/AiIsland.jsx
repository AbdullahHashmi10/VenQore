import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Sparkles, X, ArrowRight, ArrowUpRight, Clock, Bell, BellOff,
  AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, CornerDownLeft,
  TrendingUp, Box, Users, DollarSign, FileText, Camera, Mic, Volume2, VolumeX,
  MessageSquare, Zap, ScanLine, Inbox,
} from 'lucide-react';
import IslandShell from '@/Components/Island/IslandShell';
import { contentVariants, listVariants, itemVariants, DUR, EASE_OUT } from '@/Components/Island/motion';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import SmoothCaretInput from '@/Components/SmoothCaretInput';
import useDictation from '@/Components/Island/useDictation';
import { buildSuggestionFeed } from '@/Components/Island/suggestions';
import { searchRegistry } from '@/Data/AppRegistry';
import SmartCapturePanel from '@/Components/SmartCapturePanel';
import ChatWidget from '@/Components/ChatWidget';
import { useAppearance } from '@/Contexts/AppearanceContext';
import { useTheme } from '@/Contexts/ThemeContext';
import { useWorkspace } from '@/Contexts/WorkspaceContext';

const STORAGE_RECENT_QUERIES = 'venqore_island_recent_queries';
const STORAGE_SOUND_ENABLED = 'venqore_island_sound_enabled';

/* ═══════════════════════════════════════════════════════════════════════════
   VenQore Dynamic Island

   One surface. Every AI in the product lives inside it, and it is also the
   product's notification bar. It never unmounts and never swaps: each state is
   the same piece of glass at a different size.

   · Island/IslandShell.jsx — why one node, and the morph mechanics
   · Island/motion.js       — the spring contract
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Type: the V6 scale, not a smaller one ───────────────────────────────────
   tokens/typography.css was bumped 1–2px on 22 Aug 2026 with an explicit note:
   "a cashier reads a POS terminal from further away, standing, often over 50,
   and the 13px caption and 11px eyebrow were the first things people asked to
   make bigger." The first build of this island used 10–12px throughout, which
   is below the floor that note establishes. CAPTION (14px) is now the smallest
   type allowed anywhere in here. */
const T = {
  eyebrow: { fontSize: 12, lineHeight: 1.2, letterSpacing: '0.12em', fontWeight: 600, textTransform: 'uppercase' },
  caption: { fontSize: 14, lineHeight: 1.45 },                 // FLOOR
  small:   { fontSize: 15, lineHeight: 1.5 },                  // list rows
  body:    { fontSize: 17, lineHeight: 1.6, letterSpacing: '-0.002em' },
  h3:      { fontSize: 23, lineHeight: 1.3, letterSpacing: '-0.016em', fontWeight: 700 },
  metric:  { fontFamily: 'var(--vq-font-numeric)', fontSize: 17, fontVariantNumeric: 'tabular-nums' },
};

/* ── Geometry ────────────────────────────────────────────────────────────────
   Rest height is 44px, not an arbitrary pill height: --vq-control-md and the
   header's own h-11 buttons are 44px, so the island sits on the same baseline
   as the controls opposite it. Symmetry across the top bar comes from sharing
   one number, not from eyeballing it. */
const CONTROL_H = 44;
const MODES = {
  rest:     { w: 420, h: CONTROL_H },
  // A bare circle reads as a dot of chrome nobody knows to press. The collapsed
  // full-screen island is a labelled pill — small enough to ignore over a POS
  // screen, legible enough to be an offer.
  orb:      { w: 154, h: CONTROL_H },
  orbHover: { w: 340, h: CONTROL_H },
  working:  { w: 340, h: CONTROL_H },
  alert:    { w: 470, h: 84 },
  open:     { w: 760, h: 600 },
};

/* The nine orb states earn their keep: the orb IS the status readout, so the
   island never needs a spinner. Each activity gets the animation that depicts it. */
const ORB_FOR = {
  idle: 'breathing',
  search: 'searching',
  compute: 'solving',
  sync: 'connecting',
  chat: 'listening',
  growth: 'weaving',
  capture: 'shaping',
  compose: 'composing',
};

/* One theme system, five identities. Same three-lobe mesh recipe rotated onto
   each surface's hue (tokens/theme.css), same header band, same row treatment. */
const TABS = [
  { id: 'ask',     label: 'Ask Vena', icon: Sparkles,      orb: 'compute', mesh: 'var(--vq-mesh-vena)',    accent: '#59DBC0', sub: 'Ask anything about this store' },
  { id: 'chat',    label: 'Support',  icon: MessageSquare, orb: 'chat',    mesh: 'var(--vq-mesh-support)', accent: '#8FD9F5', sub: 'Talk to the VenQore team' },
  { id: 'growth',  label: 'Growth',   icon: Zap,           orb: 'growth',  mesh: 'var(--vq-mesh-growth)',  accent: '#E0B4E0', sub: 'Opportunities found for you' },
  { id: 'alerts',  label: 'Alerts',   icon: Bell,          orb: 'idle',    mesh: 'var(--vq-mesh-alerts)',  accent: '#FFDD8E', sub: 'Everything needing attention' },
  { id: 'capture', label: 'Capture',  icon: ScanLine,      orb: 'capture', mesh: 'var(--vq-mesh-capture)', accent: '#93EBD6', sub: 'Scan a document into your records' },
];
const TAB = Object.fromEntries(TABS.map(t => [t.id, t]));

const INK = 'rgba(241,245,242,';

// ── Synthesised haptics (no assets) ─────────────────────────────────────────
export const playIslandHaptic = (type = 'pop', soundEnabled = true) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    const ramp = (f0, f1, g, dur, wave = 'sine') => {
      osc.type = wave;
      osc.frequency.setValueAtTime(f0, t);
      if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.55);
      gain.gain.setValueAtTime(g, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    };
    if (type === 'ring' || type === 'alert') ramp(880, 1175, 0.14, 0.28);
    else if (type === 'pop') ramp(440, 780, 0.09, 0.12);
    else if (type === 'click') ramp(360, null, 0.045, 0.04);
    else if (type === 'dismiss') ramp(260, 130, 0.07, 0.15);
    else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.08);
      osc.frequency.setValueAtTime(783.99, t + 0.16);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    } else ramp(420, null, 0.04, 0.05);
  } catch (e) { /* audio needs a user gesture on some browsers */ }
};

/** Fire an island alert from anywhere. */
export const raiseIslandAlert = (detail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('venqore-island-alert', { detail }));
  }
};

/**
 * One island state's content. Absolutely positioned so that while the shell is
 * springing between sizes the content never reflows the box it lives in.
 *
 * Must live at module scope: declared inside AiIsland it would be a fresh
 * component type every render, remounting each pass and destroying the exit
 * animations AnimatePresence exists to run.
 */
const Pane = ({ children }) => (
  <motion.div
    variants={contentVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="absolute inset-0"
  >
    {children}
  </motion.div>
);

/** The shared pane chrome every tab wears — mesh ground, orb, title, body. */
const PaneShell = ({ tab, orbState, paused, right, children, flush = false }) => {
  const meta = TAB[tab];
  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-hidden"
      style={{ background: meta.mesh, borderRadius: 20 }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${INK}.08)` }}
      >
        <span className="grid place-items-center shrink-0" style={{ width: 30, height: 30 }}>
          <ThinkingOrb state={orbState || meta.orb} size={28} theme="dark" paused={paused} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate" style={{ ...T.body, fontWeight: 700, color: '#F1F5F2' }}>
            {meta.label}
          </span>
          <span className="block truncate" style={{ ...T.caption, color: `${INK}.60)` }}>
            {meta.sub}
          </span>
        </span>
        {right}
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${flush ? '' : 'p-3'}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * The suggestion feed — 26 real questions plus whatever this person has
 * actually searched, which sorts to the top as it accumulates.
 *
 * Items stagger in on the V6 60ms step and the scroll container is masked at
 * both ends, so a long list reads as continuing past the fold rather than
 * being clipped by it.
 */
/* Group headers are resolved outside the component — walking a cursor across
   the list during render is a mutation React Compiler can't reason about. */
const withHeaders = (feed) => {
  let last = null;
  return feed.map((item) => {
    const header = item.group === last ? null : item.group;
    last = item.group;
    return { ...item, header };
  });
};

const SuggestionList = ({ feed, onPick, accent = '#59DBC0' }) => {
  const rows = withHeaders(feed);
  return (
    <div
      className="h-full min-h-0 overflow-y-auto custom-scrollbar"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, #000 14px, #000 calc(100% - 14px), transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 14px, #000 calc(100% - 14px), transparent)',
      }}
    >
      <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-1.5 py-2">
        {rows.map((item, i) => {
          const header = item.header;
          return (
            <React.Fragment key={`${item.groupId}-${item.prompt}-${i}`}>
              {header && (
                <motion.p
                  variants={itemVariants}
                  className="px-1 pt-2 pb-1"
                  style={{ ...T.eyebrow, color: `${INK}.42)` }}
                >
                  {header}
                </motion.p>
              )}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => onPick(item.prompt)}
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left group"
                style={{ background: `${INK}.05)` }}
              >
                <span
                  className="grid place-items-center shrink-0 rounded-xl"
                  style={{ width: 32, height: 32, background: `${INK}.06)`, color: accent }}
                >
                  {item.recent ? <Clock size={15} /> : <Search size={15} />}
                </span>
                <span className="flex-1 min-w-0 truncate" style={{ ...T.small, fontWeight: 600, color: `${INK}.9)` }}>
                  {item.label}
                </span>
                <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 shrink-0" style={{ color: accent }} />
              </motion.button>
            </React.Fragment>
          );
        })}
      </motion.div>
    </div>
  );
};

export default function AiIsland({
  onAskAi,
  isAiLoading = false,
  compact = false,      // full-screen pages: orb-only until hovered
  extraAlerts = [],
}) {
  const { auth, store, growth_engine, vensynq_enabled } = usePage().props;
  const { isDark: appearanceIsDark } = useAppearance() || { isDark: true };
  const { isDarkMode: themeIsDark } = useTheme() || { isDarkMode: true };
  const isDark = store ? appearanceIsDark : themeIsDark;
  const { activeInvoices, currentInvoiceId } = useWorkspace() || {};

  // mode: 'rest' | 'working' | 'alert' | 'open'
  const [mode, setMode] = useState('rest');
  const [tab, setTab] = useState('ask');
  const [activity, setActivity] = useState('idle');
  const [workingLabel, setWorkingLabel] = useState('');
  const [hovered, setHovered] = useState(false);
  const [captureTab, setCaptureTab] = useState('image');

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_SOUND_ENABLED);
      return v !== null ? v === 'true' : true;
    } catch { return true; }
  });

  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  const [tickerIndex, setTickerIndex] = useState(0);
  const [notifications, setNotifications] = useState({ unread_count: 0, critical_count: 0, latest: [] });
  const [activeNotification, setActiveNotification] = useState(null);
  const [alertCountdown, setAlertCountdown] = useState(100);
  const [isHoveringAlert, setIsHoveringAlert] = useState(false);

  const [recentQueries, setRecentQueries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_RECENT_QUERIES) || '[]'); }
    catch { return []; }
  });

  const [orbPaused, setOrbPaused] = useState(
    () => typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const sync = () => setOrbPaused(Boolean(mq?.matches) || document.hidden);
    document.addEventListener('visibilitychange', sync);
    mq?.addEventListener?.('change', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      mq?.removeEventListener?.('change', sync);
    };
  }, []);

  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isOpen = mode === 'open';

  const userRole = auth?.user?.role;
  const userPerms = useMemo(() => auth?.user?.permissions || [], [auth?.user?.permissions]);
  const isFullAccess = ['owner', 'admin', 'manager', 'platform_admin'].includes(userRole);
  const canUseSmartCapture = vensynq_enabled && (isFullAccess || userPerms.some(p => /^(pos|sales|purchases)/.test(p)));

  // ── Geometry ──────────────────────────────────────────────────────────────
  // Capture hosts the full AI Scan workflow, so it takes 80% of the viewport;
  // every other open state is the standard hub.
  const target = useMemo(() => {
    if (mode === 'open') {
      if (tab === 'capture') {
        // AI Scan is a full workflow — intake, review, post. At 80% it still
        // scrolled; it gets the room a document actually needs.
        return { w: Math.min(vw * 0.92, 1480), h: vh * 0.92 };
      }
      return MODES.open;
    }
    if (mode === 'rest' && compact) return hovered ? MODES.orbHover : MODES.orb;
    return MODES[mode] || MODES.rest;
  }, [mode, tab, compact, hovered, vw, vh]);

  const width = Math.min(target.w, vw - 48);   // --vq-gutter on both sides
  const height = Math.min(target.h, vh - 88);
  const restBase = compact ? MODES.orb : MODES.rest;
  const restWidth = Math.min(restBase.w, vw - 48);
  const restHeight = restBase.h;

  const tone = mode === 'alert'
    ? (activeNotification?.severity === 'critical' ? 'danger' : 'warning')
    : (isOpen || mode === 'working') ? 'accent' : 'neutral';

  // ── Sound ─────────────────────────────────────────────────────────────────
  const haptic = useCallback((t) => playIslandHaptic(t, soundEnabled), [soundEnabled]);
  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    try { localStorage.setItem(STORAGE_SOUND_ENABLED, String(next)); } catch {}
    if (next) playIslandHaptic('pop', true);
  };

  // ── Open / close ──────────────────────────────────────────────────────────
  const openIsland = useCallback((nextTab) => {
    haptic('pop');
    if (nextTab) setTab(nextTab);
    setMode('open');
    setTimeout(() => document.getElementById('ai-island-input')?.focus(), 240);
  }, [haptic]);

  const closeIsland = useCallback(() => {
    haptic('dismiss');
    setMode('rest');
    setQuery('');
    setDbResults([]);
    setAiAnswer(null);
    setIsSearchingDb(false);
    setIsAiAnswering(false);
    setActivity('idle');
  }, [haptic]);

  const openCapture = useCallback((which = 'image') => {
    haptic('pop');
    setCaptureTab(which);
    setTab('capture');
    setMode('open');
  }, [haptic]);

  // ── Never interrupt a cashier mid-transaction ─────────────────────────────
  const isUserTransacting = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    if (/\/(pos|sales\/create|purchases\/create)/.test(p)) return true;
    if (activeInvoices && Object.keys(activeInvoices).length > 0 && currentInvoiceId) return true;
    const el = document.activeElement;
    if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && el.id !== 'ai-island-input') return true;
    return false;
  }, [activeInvoices, currentInvoiceId]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const raiseAlert = useCallback((n) => {
    if (!n) return;
    setActiveNotification(n);
    setAlertCountdown(100);
    haptic('ring');
    setMode('alert');
  }, [haptic]);

  const fetchNotifications = useCallback(() => {
    if (!store?.slug && !auth?.user) return;
    const summaryUrl = store?.slug ? `/s/${store.slug}/api/notifications/summary` : '/api/notifications/summary';
    window.axios?.get(summaryUrl)
      .then(res => {
        if (!res.data) return;
        setNotifications(res.data);
        const top = res.data.latest?.find(n => !n.read_at && ['critical', 'important'].includes(n.severity));
        if (top && !isUserTransacting() && mode === 'rest') raiseAlert(top);
      })
      .catch(() => {});
  }, [store?.slug, auth?.user, isUserTransacting, mode, raiseAlert]);

  useEffect(() => {
    fetchNotifications();
    const i = setInterval(fetchNotifications, 35000);
    return () => clearInterval(i);
  }, [fetchNotifications]);

  useEffect(() => {
    const onAlert = (e) => {
      if (e.detail && !isUserTransacting() && mode !== 'open') raiseAlert(e.detail);
    };
    const onSync = (e) => {
      if (mode !== 'rest') return;
      setActivity(e.detail?.activity || 'sync');
      setWorkingLabel(e.detail?.label || 'Syncing with Reckoner');
      setMode('working');
      setTimeout(() => { setMode('rest'); setActivity('idle'); }, e.detail?.duration || 2500);
    };
    window.addEventListener('venqore-island-alert', onAlert);
    window.addEventListener('venqore-island-sync', onSync);
    return () => {
      window.removeEventListener('venqore-island-alert', onAlert);
      window.removeEventListener('venqore-island-sync', onSync);
    };
  }, [mode, isUserTransacting, raiseAlert]);

  useEffect(() => {
    let t;
    if (mode === 'alert' && !isHoveringAlert) {
      t = setInterval(() => {
        setAlertCountdown(prev => {
          if (prev <= 0) {
            clearInterval(t);
            setMode('rest');
            setActiveNotification(null);
            return 100;
          }
          return prev - 2;
        });
      }, 80);
    }
    return () => clearInterval(t);
  }, [mode, isHoveringAlert]);

  const dismissAlert = (e) => {
    e?.stopPropagation();
    haptic('dismiss');
    setActiveNotification(null);
    setMode('rest');
  };

  // ── Ambient ticker ────────────────────────────────────────────────────────
  const ambient = useMemo(() => {
    const l = [];
    if (growth_engine?.popup?.description) l.push(growth_engine.popup.description);
    else if (growth_engine?.count > 0) l.push(`${growth_engine.count} growth recommendations ready`);
    l.push('Ask Vena anything about your store');
    l.push('Try "sales today", "low stock", "profit this month"');
    return l;
  }, [growth_engine]);

  useEffect(() => {
    if (mode !== 'rest') return;
    const i = setInterval(() => setTickerIndex(p => (p + 1) % ambient.length), 6500);
    return () => clearInterval(i);
  }, [ambient.length, mode]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && /^[kKfF]$/.test(e.key)) {
        e.preventDefault();
        if (isOpen) closeIsland(); else openIsland('ask');
      }
      if (e.key === 'Escape' && isOpen) closeIsland();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, openIsland, closeIsland]);

  // ── Search ────────────────────────────────────────────────────────────────
  const checkPerm = useCallback((req) => {
    if (userRole === 'platform_admin') return true;
    if (!req || req.length === 0) return isFullAccess;
    return req.some(p => userPerms.includes(p));
  }, [userRole, isFullAccess, userPerms]);

  const getRequiredPerms = useCallback((item) => {
    const r = item.route || '';
    if (r.includes('pos')) return ['pos'];
    if (/inventory|production/.test(r)) return ['inventory'];
    if (r.includes('sales')) return ['sales', 'sales_view'];
    if (/reports|finance/.test(r)) return ['reports', 'finance'];
    if (r.includes('settings')) return ['settings'];
    if (/parties|customer/.test(r)) return ['customers'];
    return [];
  }, []);

  const results = useMemo(() => {
    if (!query?.trim()) return [];
    return searchRegistry(query.trim()).filter(i => checkPerm(getRequiredPerms(i)));
  }, [query, checkPerm, getRequiredPerms]);

  useEffect(() => {
    if (!query || query.trim().length < 2 || !store?.slug) return;
    const q = query.trim();
    const t = setTimeout(() => {
      setActivity('search');
      setIsSearchingDb(true);
      window.axios?.get(route('store.global.search', { store_slug: store.slug }), { params: { query: q } })
        .then(res => setDbResults(res.data || []))
        .catch(() => setDbResults([]))
        .finally(() => { setIsSearchingDb(false); setActivity('idle'); });
    }, 240);
    return () => clearTimeout(t);
  }, [query, store?.slug]);

  const saveRecent = (text) => {
    if (!text?.trim()) return;
    const next = [text, ...recentQueries.filter(q => q.toLowerCase() !== text.toLowerCase())].slice(0, 6);
    setRecentQueries(next);
    try { localStorage.setItem(STORAGE_RECENT_QUERIES, JSON.stringify(next)); } catch {}
  };

  const askVena = (text) => {
    if (!store?.slug || !text?.trim()) return;
    haptic('click');
    setIsAiAnswering(true);
    setActivity('compute');
    setAiAnswer(null);
    saveRecent(text);
    if (onAskAi) onAskAi(text);
    window.axios?.post(route('store.ai.query', { store_slug: store.slug }), { message: text })
      .then(res => {
        const d = res.data || {};
        const body = d.response || d.answer || d.summary;
        if (body) {
          setAiAnswer({ text: body, records: d.records || [] });
          haptic('success');
        }
      })
      .catch(err => console.error('Island AI error:', err))
      .finally(() => { setIsAiAnswering(false); setActivity('idle'); });
  };

  const navigateToItem = (item) => {
    try {
      haptic('pop');
      const name = item.route.startsWith('store.') ? item.route : `store.${item.route}`;
      router.visit(route(name, { ...item.queryParams, store_slug: store?.slug }));
      closeIsland();
    } catch {
      closeIsland();
    }
  };

  const totalSelectable = results.length + dbResults.length;
  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); haptic('click');
      setSelectedIndex(p => (p + 1) % Math.max(1, totalSelectable));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); haptic('click');
      setSelectedIndex(p => (p - 1 + totalSelectable) % Math.max(1, totalSelectable));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) return navigateToItem(results[selectedIndex]);
      const db = dbResults[selectedIndex - results.length];
      if (db?.url) { haptic('pop'); router.visit(db.url); return closeIsland(); }
      if (query.trim().length > 1) askVena(query.trim());
    }
  };

  // Mic means the same thing everywhere in the island: speak instead of type.
  const dictation = useDictation({
    locale: store?.locale,
    onText: setQuery,
    onFinal: (text) => { if (text?.trim()) saveRecent(text.trim()); },
  });

  const startDictation = useCallback(() => {
    haptic('click');
    if (mode !== 'open' || tab !== 'ask') { setTab('ask'); setMode('open'); }
    setTimeout(() => dictation.toggle(query), mode === 'open' ? 0 : 260);
  }, [dictation, haptic, mode, tab, query]);

  const suggestionFeed = useMemo(() => buildSuggestionFeed(recentQueries), [recentQueries]);

  const busy = isAiAnswering || isSearchingDb || isAiLoading;
  const orbState = dictation.listening
    ? ORB_FOR.chat
    : ORB_FOR[busy ? (isAiAnswering ? 'compute' : 'search') : activity] || ORB_FOR.idle;

  const allAlerts = useMemo(
    () => [...(extraAlerts || []), ...(notifications.latest || [])],
    [extraAlerts, notifications.latest]
  );
  const unread = (notifications.unread_count || 0) + (extraAlerts?.length || 0);

  const badge = unread > 0 && (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 24 }}
      className="grid place-items-center shrink-0"
      style={{ ...T.caption, fontWeight: 700, height: 22, minWidth: 22, padding: '0 7px',
               borderRadius: 999, background: '#23C4A6', color: '#062421' }}
    >
      {unread > 99 ? '99+' : unread}
    </motion.span>
  );

  const iconBtn = (onClick, title, children, accent) => (
    <button
      type="button" onClick={onClick} title={title} aria-label={title}
      className="grid place-items-center shrink-0 rounded-xl"
      style={{ width: 34, height: 34, color: accent || `${INK}.6)`,
               background: `${INK}.06)`, transition: 'background 120ms var(--vq-ease-out)' }}
    >
      {children}
    </button>
  );

  return (
    <>
      <IslandShell
        width={width}
        height={height}
        restWidth={restWidth}
        restHeight={restHeight}
        isOpen={isOpen}
        isAlert={mode === 'alert'}
        tone={tone}
        sheen={!isOpen}
        onScrimClick={closeIsland}
        onHoverChange={setHovered}
        slotClassName="shrink-0"
        ariaLabel="VenQore AI and notifications"
      >
        <AnimatePresence mode="wait" initial={false}>

          {/* ── REST ─────────────────────────────────────────────────────── */}
          {mode === 'rest' && (
            <Pane key="rest">
              <div
                className="w-full h-full flex items-center gap-2"
                style={{ padding: compact && !hovered ? '0 14px' : '0 8px 0 14px' }}
              >
                <button
                  type="button"
                  onClick={() => openIsland('ask')}
                  className="flex-1 min-w-0 h-full flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#23C4A6]/60 rounded-xl"
                  aria-label="Open VenQore AI"
                >
                  <span className="shrink-0 grid place-items-center" style={{ width: 26, height: 26 }}>
                    <ThinkingOrb state={orbState} size={24} theme="dark" paused={orbPaused} />
                  </span>

                  {compact ? (
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={hovered ? 'open' : 'idle'}
                        initial={{ opacity: 0, y: 5, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -5, filter: 'blur(3px)' }}
                        transition={{ duration: DUR.d2, ease: EASE_OUT }}
                        className="flex-1 min-w-0 truncate"
                        style={{ ...T.small, fontWeight: 600, color: `${INK}${hovered ? '.72)' : '.88)'}` }}
                      >
                        {hovered ? 'Ask Vena anything, or scan a document' : 'Ask Vena'}
                      </motion.span>
                    </AnimatePresence>
                  ) : (
                    <span className="flex-1 min-w-0 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={tickerIndex}
                          initial={{ opacity: 0, y: 7, filter: 'blur(3px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -7, filter: 'blur(3px)' }}
                          transition={{ duration: DUR.d3, ease: EASE_OUT }}
                          className="block truncate"
                          style={{ ...T.small, color: `${INK}.78)` }}
                        >
                          {ambient[tickerIndex]}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  )}
                </button>

                {/* Mic and camera live on the pill itself: the two fastest ways
                    in are speaking and scanning, and burying them behind an
                    expand made you open the hub to reach a shortcut. */}
                <AnimatePresence initial={false}>
                  {!(compact && !hovered) && (
                    <motion.span
                      key="pill-actions"
                      initial={{ opacity: 0, scale: 0.8, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                      exit={{ opacity: 0, scale: 0.8, width: 0 }}
                      transition={{ duration: DUR.d2, ease: EASE_OUT }}
                      className="flex items-center gap-1.5 shrink-0 overflow-hidden"
                    >
                      {badge}
                      {dictation.supported && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startDictation(); }}
                          className="grid place-items-center shrink-0 rounded-xl"
                          style={{
                            width: 32, height: 32,
                            background: dictation.listening ? '#23C4A6' : `${INK}.07)`,
                            color: dictation.listening ? '#062421' : `${INK}.62)`,
                            transition: 'background 120ms var(--vq-ease-out), color 120ms var(--vq-ease-out)',
                          }}
                          title="Speak your question"
                          aria-label="Speak your question"
                        >
                          <Mic size={16} />
                        </button>
                      )}
                      {canUseSmartCapture && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openCapture('image'); }}
                          className="grid place-items-center shrink-0 rounded-xl"
                          style={{ width: 32, height: 32, background: `${INK}.07)`, color: `${INK}.62)` }}
                          title="Scan a document"
                          aria-label="Scan a document"
                        >
                          <Camera size={16} />
                        </button>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Pane>
          )}

          {/* ── WORKING ──────────────────────────────────────────────────── */}
          {mode === 'working' && (
            <Pane key="working">
              <div className="w-full h-full flex items-center gap-3 px-4">
                <span className="shrink-0 grid place-items-center" style={{ width: 26, height: 26 }}>
                  <ThinkingOrb state={ORB_FOR[activity] || 'connecting'} size={24} theme="dark" paused={orbPaused} />
                </span>
                <span className="flex-1 truncate" style={{ ...T.small, fontWeight: 600, color: `${INK}.92)` }}>
                  {workingLabel || 'Working'}
                </span>
              </div>
            </Pane>
          )}

          {/* ── ALERT ────────────────────────────────────────────────────── */}
          {mode === 'alert' && (
            <Pane key="alert">
              <div
                className="w-full h-full flex flex-col justify-between px-4 py-3"
                onMouseEnter={() => setIsHoveringAlert(true)}
                onMouseLeave={() => setIsHoveringAlert(false)}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                    className="grid place-items-center shrink-0 rounded-2xl"
                    style={{
                      width: 38, height: 38,
                      background: activeNotification?.severity === 'critical' ? 'rgba(255,138,107,.16)' : 'rgba(255,205,91,.16)',
                      color: activeNotification?.severity === 'critical' ? '#FFAE96' : '#FFDD8E',
                    }}
                  >
                    {activeNotification?.severity === 'critical'
                      ? <AlertCircle size={19} />
                      : <AlertTriangle size={19} />}
                  </motion.span>

                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ ...T.small, fontWeight: 700, color: '#F1F5F2' }}>
                      {activeNotification?.title || 'Store alert'}
                    </p>
                    <p className="truncate" style={{ ...T.caption, color: `${INK}.65)` }}>
                      {activeNotification?.message || activeNotification?.desc || 'Action required in your store.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeNotification?.action_url ? (
                      <Link
                        href={activeNotification.action_url}
                        onClick={() => setMode('rest')}
                        className="rounded-xl"
                        style={{ ...T.caption, fontWeight: 700, padding: '8px 14px', background: '#23C4A6', color: '#062421' }}
                      >
                        {activeNotification.action_text || 'View'}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openIsland('alerts')}
                        className="rounded-xl"
                        style={{ ...T.caption, fontWeight: 700, padding: '8px 14px', background: '#23C4A6', color: '#062421' }}
                      >
                        Review
                      </button>
                    )}
                    <button
                      type="button" onClick={dismissAlert}
                      className="grid place-items-center rounded-lg"
                      style={{ width: 30, height: 30, color: `${INK}.55)` }}
                      aria-label="Dismiss alert"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>

                <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: `${INK}.12)` }}>
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${alertCountdown}%` }}
                    transition={{ duration: 0.08, ease: 'linear' }}
                    style={{ background: activeNotification?.severity === 'critical' ? '#FF8A6B' : '#FFCD5B' }}
                  />
                </div>
              </div>
            </Pane>
          )}

          {/* ── OPEN HUB ─────────────────────────────────────────────────── */}
          {mode === 'open' && (
            <Pane key="open">
              <div className="w-full h-full flex flex-col">

                {/* Tab rail. The active pill is a shared layoutId, so it SLIDES
                    between tabs rather than cross-fading. */}
                <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto custom-scrollbar">
                    {TABS.map((t) => {
                      const Icon = t.icon;
                      const active = tab === t.id;
                      const count = t.id === 'alerts' ? unread
                                  : t.id === 'growth' ? (growth_engine?.count || 0) : 0;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setTab(t.id); haptic('click'); }}
                          className="relative flex items-center gap-2 rounded-xl shrink-0"
                          style={{ ...T.caption, fontWeight: 700, padding: '9px 14px',
                                   color: active ? '#062421' : `${INK}.66)` }}
                        >
                          {active && (
                            <motion.span
                              layoutId="island-tab"
                              className="absolute inset-0 rounded-xl"
                              style={{ background: '#23C4A6' }}
                              transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                            />
                          )}
                          <span className="relative flex items-center gap-2">
                            <Icon size={15} />
                            <span>{t.label}</span>
                            {count > 0 && (
                              <span
                                className="rounded-full"
                                style={{ ...T.eyebrow, letterSpacing: 0, padding: '1px 6px',
                                  background: active ? 'rgba(6,36,33,.22)' : 'rgba(35,196,166,.22)',
                                  color: active ? '#062421' : '#59DBC0' }}
                              >
                                {count}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {iconBtn(toggleSound, soundEnabled ? 'Mute island sounds' : 'Enable island sounds',
                    soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />)}
                  <button
                    type="button" onClick={closeIsland}
                    className="rounded-xl shrink-0"
                    style={{ ...T.caption, fontWeight: 700, padding: '8px 13px',
                             background: `${INK}.08)`, color: `${INK}.65)` }}
                  >
                    ESC
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 px-4 pb-4">
                  <AnimatePresence mode="wait" initial={false}>

                    {/* ── ASK VENA ─────────────────────────────────────── */}
                    {tab === 'ask' && (
                      <motion.div key="ask" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                        <PaneShell
                          tab="ask" orbState={orbState} paused={orbPaused} flush
                          right={
                            <span className="flex items-center gap-2">
                              {canUseSmartCapture && iconBtn(() => openCapture('image'), 'Scan a document', <Camera size={17} />, '#93EBD6')}
                              {canUseSmartCapture && iconBtn(() => openCapture('audio'), 'Speak a transaction', <Mic size={17} />, '#93EBD6')}
                            </span>
                          }
                        >
                          <div className="flex flex-col h-full min-h-0">
                            {/* Search bar. The native caret is a 1px hairline
                                that disappears against the mesh — SmoothCaretInput
                                (already in the repo, unused until now) draws a
                                spring-driven caret that glides to the insertion
                                point and glows enough to find. */}
                            <div className="flex items-center gap-3 px-4 shrink-0"
                                 style={{ height: 60, borderBottom: `1px solid ${INK}.08)` }}>
                              <Search size={19} style={{ color: `${INK}.5)`, flex: 'none' }} />
                              <SmoothCaretInput
                                id="ai-island-input"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onInputKey}
                                placeholder={dictation.listening ? 'Listening…' : 'Ask Vena, or search screens and records…'}
                                autoComplete="off"
                                caretColor="bg-[#23C4A6]"
                                className="flex-1 min-w-0"
                                inputClassName="!bg-transparent !border-0 !rounded-none !px-0 !py-0 !text-[17px] !leading-[1.6] !font-medium !text-[#F1F5F2] placeholder:!text-[rgba(241,245,242,0.42)] focus:!ring-0 focus:!border-transparent"
                              />
                              {dictation.supported && (
                                <button
                                  type="button"
                                  onClick={() => dictation.toggle(query)}
                                  className="grid place-items-center shrink-0 rounded-xl"
                                  style={{
                                    width: 36, height: 36,
                                    background: dictation.listening ? '#23C4A6' : `${INK}.06)`,
                                    color: dictation.listening ? '#062421' : `${INK}.62)`,
                                    transition: 'background 120ms var(--vq-ease-out), color 120ms var(--vq-ease-out)',
                                  }}
                                  title={dictation.listening ? 'Stop listening' : 'Speak your question'}
                                  aria-label={dictation.listening ? 'Stop listening' : 'Speak your question'}
                                >
                                  {dictation.listening
                                    ? <motion.span
                                        animate={{ scale: [1, 1.18, 1] }}
                                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                        className="grid place-items-center"
                                      ><Mic size={17} /></motion.span>
                                    : <Mic size={17} />}
                                </button>
                              )}
                              {query && (
                                <button type="button" onClick={() => { setQuery(''); setAiAnswer(null); }}
                                        className="grid place-items-center shrink-0"
                                        style={{ width: 30, height: 30, color: `${INK}.5)` }}
                                        aria-label="Clear search">
                                  <X size={18} />
                                </button>
                              )}
                            </div>

                            <div className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                              {aiAnswer && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: DUR.d3, ease: EASE_OUT }}
                                  className="p-4 rounded-2xl"
                                  style={{ background: 'rgba(35,196,166,.12)', boxShadow: 'inset 0 0 0 1px rgba(35,196,166,.28)' }}
                                >
                                  <p className="flex items-center gap-2 mb-2" style={{ ...T.eyebrow, color: '#59DBC0' }}>
                                    <Sparkles size={14} /> Vena
                                  </p>
                                  <p className="whitespace-pre-line" style={{ ...T.small, color: `${INK}.94)` }}>{aiAnswer.text}</p>
                                </motion.div>
                              )}

                              {query && !aiAnswer && (
                                <button type="button" onClick={() => askVena(query)}
                                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                                  style={{ background: 'rgba(35,196,166,.12)', boxShadow: 'inset 0 0 0 1px rgba(35,196,166,.3)' }}>
                                  <span className="p-2 rounded-xl shrink-0" style={{ background: '#23C4A6', color: '#062421' }}>
                                    <Sparkles size={16} />
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span className="block truncate" style={{ ...T.small, fontWeight: 700, color: '#F1F5F2' }}>Ask Vena: “{query}”</span>
                                    <span className="block" style={{ ...T.caption, color: `${INK}.6)` }}>Computes against live store data</span>
                                  </span>
                                  <CornerDownLeft size={16} style={{ color: '#59DBC0' }} />
                                </button>
                              )}

                              {!query && !aiAnswer && (
                                <div className="absolute inset-0 px-3 pb-3 pt-1">
                                  <SuggestionList
                                    feed={suggestionFeed}
                                    onPick={(prompt) => { setQuery(prompt); askVena(prompt); }}
                                  />
                                </div>
                              )}

                              {results.slice(0, 6).map((item, i) => {
                                const Icon = item.icon || FileText;
                                const sel = selectedIndex === i;
                                return (
                                  <button key={item.id || i} type="button" onClick={() => navigateToItem(item)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                                    style={{ background: sel ? '#23C4A6' : `${INK}.05)`,
                                             color: sel ? '#062421' : `${INK}.9)` }}>
                                    <Icon size={16} className="shrink-0" />
                                    <span className="flex-1 min-w-0 truncate" style={{ ...T.small, fontWeight: 600 }}>{item.title}</span>
                                    <ChevronRight size={15} className="opacity-60" />
                                  </button>
                                );
                              })}

                              {dbResults.slice(0, 6).map((item, i) => {
                                const sel = selectedIndex === results.length + i;
                                return (
                                  <button key={i} type="button"
                                    onClick={() => { if (item.url) { haptic('pop'); router.visit(item.url); closeIsland(); } }}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                                    style={{ background: sel ? '#23C4A6' : `${INK}.05)`,
                                             color: sel ? '#062421' : `${INK}.9)` }}>
                                    <Box size={16} className="shrink-0" />
                                    <span className="flex-1 min-w-0 truncate" style={{ ...T.small, fontWeight: 600 }}>{item.title || item.name}</span>
                                    <ArrowUpRight size={15} className="opacity-60" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </PaneShell>
                      </motion.div>
                    )}

                    {/* ── SUPPORT ──────────────────────────────────────── */}
                    {tab === 'chat' && (
                      <motion.div key="chat" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                        <PaneShell tab="chat" orbState="listening" paused={orbPaused} flush>
                          <div className="h-full min-h-0 overflow-hidden bg-transparent">
                            <ChatWidget embedded />
                          </div>
                        </PaneShell>
                      </motion.div>
                    )}

                    {/* ── GROWTH ───────────────────────────────────────── */}
                    {tab === 'growth' && (
                      <motion.div key="growth" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                        <PaneShell tab="growth" orbState="weaving" paused={orbPaused}>
                          {growth_engine?.count > 0 ? (
                            <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-3">
                              <motion.div variants={itemVariants} className="p-4 rounded-2xl"
                                style={{ background: `${INK}.06)`, boxShadow: 'inset 0 0 0 1px rgba(224,180,224,.22)' }}>
                                <p className="flex items-center gap-2 mb-1.5" style={{ ...T.body, fontWeight: 700, color: '#E0B4E0' }}>
                                  <Zap size={18} /> {growth_engine.count} opportunities
                                </p>
                                <p style={{ ...T.small, color: `${INK}.82)` }}>
                                  {growth_engine?.popup?.description || 'High-impact recommendations ready for review.'}
                                </p>
                              </motion.div>
                              <motion.div variants={itemVariants}>
                                <Link href={route('store.growth-engine.index', { store_slug: store?.slug })} onClick={closeIsland}
                                  className="w-full flex items-center justify-center gap-2 rounded-2xl"
                                  style={{ ...T.small, fontWeight: 700, padding: '13px 16px', background: '#23C4A6', color: '#062421' }}>
                                  Open Growth Engine <ArrowUpRight size={16} />
                                </Link>
                              </motion.div>
                            </motion.div>
                          ) : (
                            <div className="h-full grid place-items-center text-center px-6">
                              <div>
                                <div className="mx-auto mb-3 grid place-items-center" style={{ width: 64, height: 64 }}>
                                  <ThinkingOrb state="weaving" size={60} theme="dark" paused={orbPaused} />
                                </div>
                                <p style={{ ...T.body, fontWeight: 700, color: `${INK}.88)` }}>Growth Engine is watching</p>
                                <p style={{ ...T.small, color: `${INK}.58)`, marginTop: 4 }}>New opportunities appear here as they are found.</p>
                              </div>
                            </div>
                          )}
                        </PaneShell>
                      </motion.div>
                    )}

                    {/* ── ALERTS ───────────────────────────────────────── */}
                    {tab === 'alerts' && (
                      <motion.div key="alerts" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                        <PaneShell tab="alerts" orbState={unread > 0 ? 'searching' : 'breathing'} paused={orbPaused}>
                          {allAlerts.length ? (
                            <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
                              {allAlerts.map((n, i) => (
                                <motion.div key={n.id || i} variants={itemVariants}
                                  className="flex items-start gap-3 p-3 rounded-2xl"
                                  style={{ background: `${INK}.06)` }}>
                                  <span className="mt-0.5 shrink-0" style={{ color: n.severity === 'critical' ? '#FFAE96' : n.severity === 'important' ? '#FFDD8E' : '#59DBC0' }}>
                                    {n.severity === 'critical' ? <AlertCircle size={18} />
                                      : n.severity === 'important' ? <AlertTriangle size={18} />
                                      : <CheckCircle2 size={18} />}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate" style={{ ...T.small, fontWeight: 700, color: '#F1F5F2' }}>{n.title}</p>
                                    <p style={{ ...T.caption, color: `${INK}.65)` }}>{n.message || n.desc}</p>
                                  </div>
                                  {n.action_url && (
                                    <Link href={n.action_url} onClick={closeIsland} className="shrink-0"
                                      style={{ ...T.caption, fontWeight: 700, color: '#59DBC0' }}>
                                      View
                                    </Link>
                                  )}
                                </motion.div>
                              ))}
                            </motion.div>
                          ) : (
                            <div className="h-full grid place-items-center text-center px-6">
                              <div>
                                <BellOff size={30} className="mx-auto mb-3" style={{ color: `${INK}.32)` }} />
                                <p style={{ ...T.body, fontWeight: 700, color: `${INK}.82)` }}>All clear</p>
                                <p style={{ ...T.small, color: `${INK}.55)`, marginTop: 4 }}>Nothing needs your attention.</p>
                              </div>
                            </div>
                          )}
                        </PaneShell>
                      </motion.div>
                    )}

                    {/* ── CAPTURE ──────────────────────────────────────────
                        AI Scan renders INSIDE the island. It used to portal
                        itself at z-toast (900) while the island owns z-command
                        (1000), so its popup opened underneath — the bug you
                        saw. Hosting it here removes the stacking question
                        entirely rather than fighting the ladder. */}
                    {tab === 'capture' && (
                      <motion.div key="capture" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                        <PaneShell tab="capture" orbState="shaping" paused={orbPaused} flush>
                          {canUseSmartCapture ? (
                            <div className="h-full min-h-0 overflow-hidden bg-transparent">
                              <SmartCapturePanel
                                embedded
                                isOpen
                                initialTab={captureTab}
                                onClose={() => setTab('ask')}
                              />
                            </div>
                          ) : (
                            <div className="h-full grid place-items-center text-center px-6">
                              <div>
                                <Inbox size={30} className="mx-auto mb-3" style={{ color: `${INK}.32)` }} />
                                <p style={{ ...T.body, fontWeight: 700, color: `${INK}.82)` }}>Smart Capture is not enabled</p>
                                <p style={{ ...T.small, color: `${INK}.55)`, marginTop: 4 }}>Enable VenSynQ to scan documents into your records.</p>
                              </div>
                            </div>
                          )}
                        </PaneShell>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Pane>
          )}
        </AnimatePresence>
      </IslandShell>
    </>
  );
}
