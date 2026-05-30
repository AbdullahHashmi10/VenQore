import React, { useState, useEffect, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Monitor, RefreshCw, Zap, Users, TrendingUp, CheckCircle2,
    AlertTriangle, Clock, Activity, Database, Package, ShoppingCart,
    FileText, ChefHat, ExternalLink, Play, RotateCcw, Globe,
} from 'lucide-react';

// ─── Constants & Parsers for Test Runner ──────────────────────────────────────

const STATUS = {
    IDLE:    'idle',
    RUNNING: 'running',
    PASSED:  'passed',
    FAILED:  'failed',
};

const POLL_INTERVAL_MS = 800;

const LINE_COLORS = {
    pass:     '#10b981',  // emerald
    fail:     '#ef4444',  // red
    skip:     '#f59e0b',  // amber
    suite:    '#a78bfa',  // violet
    summary:  '#f1f5f9',  // near-white
    duration: '#475569',  // muted
    error:    '#f87171',  // light red
    trace:    '#64748b',  // slate
    divider:  '#1e293b',  // divider
    info:     '#94a3b8',  // default slate
};

function parseLine(raw) {
    const line = raw.trim();

    if (!line || line === 'STARTED') return null;
    if (line.startsWith('EXIT_CODE:'))  return null;

    // Individual test results
    if (line.includes('✓') || line.match(/^\s*PASS\s/))    return { type: 'pass',     text: line };
    if (line.includes('⨯') || line.includes('✗'))          return { type: 'fail',     text: line };
    if (line.match(/^\s*-\s/))                              return { type: 'skip',     text: line };

    // Suite-level headers
    if (line.match(/^\s*(PASS|FAIL)\s+/))                   return { type: 'suite',    text: line };

    // Summary and timing lines
    if (line.startsWith('Tests:'))                          return { type: 'summary',  text: line };
    if (line.startsWith('Duration:'))                       return { type: 'duration', text: line };

    // Failure detail blocks
    if (line.startsWith('●') || line.includes('FAILED'))   return { type: 'error',    text: line };
    if (line.match(/^\s+at\s+/) || line.match(/^\s+\d+\s/)) return { type: 'trace',  text: line };
    if (line.match(/^[─━═]+$/))                             return { type: 'divider', text: line };

    return { type: 'info', text: line };
}

function RunnerStatusBadge({ status }) {
    const configs = {
        [STATUS.IDLE]:    { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Idle' },
        [STATUS.RUNNING]: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Running…' },
        [STATUS.PASSED]:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'All Passed' },
        [STATUS.FAILED]:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Failed' },
    };
    const c = configs[status];
    return (
        <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '5px',
            padding:      '3px 10px',
            borderRadius: '20px',
            background:   c.bg,
            color:        c.color,
            fontSize:     '0.72rem',
            fontWeight:   600,
            letterSpacing: '0.04em',
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: c.color,
                animation: status === STATUS.RUNNING ? 'demoRunnerPulse 1.2s infinite' : 'none',
            }} />
            {c.label}
        </span>
    );
}

function RunnerLineRow({ item, index }) {
    const color = LINE_COLORS[item.type] || LINE_COLORS.info;
    const isHighlight = item.type === 'pass' || item.type === 'fail' || item.type === 'summary';

    return (
        <div style={{
            color,
            padding:      isHighlight ? '1px 0' : '0',
            lineHeight:   '1.65',
            wordBreak:    'break-all',
            opacity:      item.type === 'divider' ? 0.3 : 1,
        }}>
            {item.type === 'pass' && (
                <span style={{ color: '#10b981', marginRight: 4 }}>✓</span>
            )}
            {item.type === 'fail' && (
                <span style={{ color: '#ef4444', marginRight: 4 }}>✗</span>
            )}
            {item.type === 'skip' && (
                <span style={{ color: '#f59e0b', marginRight: 4 }}>–</span>
            )}
            {item.text.replace(/^[✓✗⨯]\s*/, '')}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS = {
    owner:              '#f59e0b',
    admin:              '#6366f1',
    manager:            '#8b5cf6',
    cashier:            '#10b981',
    accountant:         '#3b82f6',
    purchasing_officer: '#ec4899',
    viewer:             '#64748b',
};

function StatCard({ label, value, icon: Icon, color = '#6366f1', sub }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.45) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>
                    {value ?? '—'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DemoStoreTab() {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [msg, setMsg]           = useState(null);
    const [selectedModules, setSelectedModules] = useState({
        products: true,
        sales: true,
        purchases: true,
        expenses: true,
        parties: true,
        proposals: true,
    });

    // Test runner state & refs
    const [runnerStatus, setRunnerStatus]   = useState(STATUS.IDLE);
    const [runnerLines, setRunnerLines]     = useState([]);
    const [runnerElapsed, setRunnerElapsed] = useState(0);
    const [runnerCounts, setRunnerCounts]   = useState({ pass: 0, fail: 0, skip: 0 });

    const runnerPollRef  = useRef(null);
    const runnerTimerRef = useRef(null);
    const runnerJobRef   = useRef(null);
    const runnerTermRef  = useRef(null);

    // Auto-scroll terminal output to bottom as lines arrive
    useEffect(() => {
        if (runnerTermRef.current) {
            runnerTermRef.current.scrollTop = runnerTermRef.current.scrollHeight;
        }
    }, [runnerLines]);

    // Cleanup on unmount
    useEffect(() => () => {
        clearInterval(runnerPollRef.current);
        clearInterval(runnerTimerRef.current);
    }, []);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(route('platform.demo-store.status'), {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            setData(json);
        } catch (e) {
            setMsg({ type: 'error', text: 'Failed to load demo store status.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleReset = async () => {
        if (!confirm('Quick reset the demo store? This will re-run seeders (~15 seconds).')) return;
        setResetting(true);
        try {
            await fetch(route('platform.demo-store.reset'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setMsg({ type: 'success', text: '✅ Demo store reset initiated. Data will refresh in ~15 seconds.' });
            setTimeout(fetchStatus, 16000);
        } catch {
            setMsg({ type: 'error', text: 'Reset failed. Check server logs.' });
        } finally {
            setResetting(false);
        }
    };

    const handleDeploy = async () => {
        const activeModules = Object.keys(selectedModules).filter(k => selectedModules[k]);
        if (activeModules.length === 0) {
            alert('Please select at least one module to seed!');
            return;
        }

        const isFull = activeModules.length === Object.keys(selectedModules).length;
        const confirmMsg = isFull 
            ? '🚀 Run FULL DEPLOY? This wipes all demo data and re-seeds 5 years of history.\nThis takes 60–120 seconds.'
            : `🚀 Run SELECTIVE DEPLOY? This will seed: ${activeModules.join(', ')}.\nThis takes 10–30 seconds.`;

        if (!confirm(confirmMsg)) return;

        setDeploying(true);
        setMsg({ 
            type: 'info', 
            text: isFull 
                ? '🚀 Full deploy started. This takes 60–120 seconds. Please wait...' 
                : `🚀 Selective deploy started for: ${activeModules.join(', ')}. Please wait...`
        });

        try {
            const queryParams = isFull ? '' : `?only=${activeModules.join(',')}`;
            await fetch(route('platform.demo-store.deploy') + queryParams, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            // Shorter timeout for selective seeding
            const waitTime = isFull ? 90000 : 20000;
            setTimeout(() => {
                fetchStatus();
                setMsg({ type: 'success', text: '✅ Seeding complete! Selected data has been successfully loaded.' });
                setDeploying(false);
            }, waitTime);
        } catch {
            setMsg({ type: 'error', text: 'Deploy failed. Check server logs.' });
            setDeploying(false);
        }
    };

    // ─── Test Runner Functions ───────────────────────────────────────────────

    const startElapsedTimer = () => {
        setRunnerElapsed(0);
        runnerTimerRef.current = setInterval(() => setRunnerElapsed(s => s + 1), 1000);
    };

    const stopAll = () => {
        clearInterval(runnerPollRef.current);
        clearInterval(runnerTimerRef.current);
    };

    const countLines = (parsed) => ({
        pass: parsed.filter(l => l.type === 'pass').length,
        fail: parsed.filter(l => l.type === 'fail').length,
        skip: parsed.filter(l => l.type === 'skip').length,
    });

    const poll = useCallback(async (jobId) => {
        try {
            const res = await fetch(route('platform.demo-store.tests.status', { jobId }), {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            const parsed = (data.lines || []).map(parseLine).filter(Boolean);

            setRunnerLines(parsed);
            setRunnerCounts(countLines(parsed));

            if (data.done) {
                stopAll();
                setRunnerStatus(data.passed ? STATUS.PASSED : STATUS.FAILED);

                // Auto-cleanup the server log file after 60s
                setTimeout(() => {
                    fetch(route('platform.demo-store.tests.cleanup', { jobId }), {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    }).catch(() => {});
                }, 60_000);
            }
        } catch {
            stopAll();
            setRunnerStatus(STATUS.FAILED);
            setRunnerLines(prev => [...prev, { type: 'error', text: 'Lost connection to page health test runner.' }]);
        }
    }, []);

    const runPageTests = async () => {
        setRunnerStatus(STATUS.RUNNING);
        setRunnerLines([]);
        setRunnerCounts({ pass: 0, fail: 0, skip: 0 });
        startElapsedTimer();

        try {
            const res = await fetch(route('platform.demo-store.tests.run'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            runnerJobRef.current = data.job_id;
            runnerPollRef.current = setInterval(() => poll(data.job_id), POLL_INTERVAL_MS);
        } catch (e) {
            stopAll();
            setRunnerStatus(STATUS.FAILED);
            setRunnerLines([{
                type: 'error',
                text: 'Failed to start page health test runner.',
            }]);
        }
    };

    const resetRunner = () => {
        stopAll();
        setRunnerStatus(STATUS.IDLE);
        setRunnerLines([]);
        setRunnerCounts({ pass: 0, fail: 0, skip: 0 });
        setRunnerElapsed(0);
        runnerJobRef.current = null;
    };

    const copyLogsToClipboard = () => {
        const textToCopy = runnerLines.map(l => l.text).join('\n');
        navigator.clipboard.writeText(textToCopy);
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, gap: 10, color: '#94a3b8' }}>
                <RefreshCw size={18} className="animate-spin" />
                <span>Loading demo store status...</span>
            </div>
        );
    }

    if (!data?.exists) {
        return (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                <Monitor size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, marginBottom: 8 }}>No Demo Store Found</p>
                <p style={{ fontSize: 14, marginBottom: 24 }}>No tenant with <code>is_demo = true</code> exists yet.</p>
                <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    style={{
                        padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 14,
                    }}
                >
                    <Zap size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Create & Deploy Demo Store
                </button>
            </div>
        );
    }

    const totalRoles = data.role_breakdown?.reduce((s, r) => s + r.total, 0) || 1;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Alert message */}
            {msg && (
                <div style={{
                    padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                    background: msg.type === 'error' ? '#fef2f2' : msg.type === 'success' ? '#f0fdf4' : '#eff6ff',
                    color:      msg.type === 'error' ? '#dc2626' : msg.type === 'success' ? '#16a34a' : '#2563eb',
                    border:     `1px solid ${msg.type === 'error' ? '#fca5a5' : msg.type === 'success' ? '#86efac' : '#93c5fd'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span>{msg.text}</span>
                    <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 18 }}>×</button>
                </div>
            )}

            {/* Status Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                padding: '16px 20px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#6366f118', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={20} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: '#f8fafc' }}>
                            🎭 Demo Store
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                background: data.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color:      data.status === 'active' ? '#10b981' : '#f59e0b',
                                border:     `1px solid ${data.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                                {data.status === 'active' ? 'LIVE' : data.status?.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            venqore.com/demo · Last reset: {data.last_reset_at}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a
                        href="/demo"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'rgba(255, 255, 255, 0.04)', color: '#cbd5e1', fontSize: 13, fontWeight: 600,
                            textDecoration: 'none', cursor: 'pointer',
                        }}
                    >
                        <Globe size={13} /> View Demo
                    </a>
                    <button
                        onClick={handleReset}
                        disabled={resetting || deploying || runnerStatus === STATUS.RUNNING}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'rgba(255, 255, 255, 0.04)', color: '#cbd5e1', fontSize: 13, fontWeight: 600,
                            cursor: (resetting || deploying || runnerStatus === STATUS.RUNNING) ? 'not-allowed' : 'pointer',
                            opacity: (resetting || deploying || runnerStatus === STATUS.RUNNING) ? 0.6 : 1,
                        }}
                    >
                        <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
                        {resetting ? 'Resetting...' : 'Quick Reset'}
                    </button>
                    <button
                        onClick={handleDeploy}
                        disabled={deploying || resetting || runnerStatus === STATUS.RUNNING}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 9, border: 'none',
                            background: deploying ? '#818cf8' : '#6366f1',
                            color: '#fff', fontSize: 13, fontWeight: 600,
                            cursor: (deploying || resetting || runnerStatus === STATUS.RUNNING) ? 'not-allowed' : 'pointer',
                            opacity: (deploying || resetting || runnerStatus === STATUS.RUNNING) ? 0.6 : 1,
                            boxShadow: '0 2px 8px #6366f140',
                        }}
                    >
                        <Zap size={13} className={deploying ? 'animate-pulse' : ''} />
                        {deploying ? 'Deploying...' : (Object.values(selectedModules).every(v => v) ? '🚀 Full Deploy (5-Year Data)' : '🚀 Deploy Selected Data')}
                    </button>
                    <button
                        onClick={runPageTests}
                        disabled={runnerStatus === STATUS.RUNNING || deploying || resetting}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 9, border: 'none',
                            background: runnerStatus === STATUS.RUNNING ? '#f59e0b' : '#10b981',
                            color: '#fff', fontSize: 13, fontWeight: 600,
                            cursor: (runnerStatus === STATUS.RUNNING || deploying || resetting) ? 'not-allowed' : 'pointer',
                            opacity: (runnerStatus === STATUS.RUNNING || deploying || resetting) ? 0.6 : 1,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                        }}
                    >
                        <Play size={13} className={runnerStatus === STATUS.RUNNING ? 'animate-spin' : ''} />
                        {runnerStatus === STATUS.RUNNING ? 'Testing...' : '🧪 Run Page Tests'}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                <StatCard label="Live Right Now" value={data.live_now} icon={Activity} color="#10b981" sub="Active demo sessions" />
                <StatCard label="Visitors Today" value={data.today?.toLocaleString()} icon={Users} color="#6366f1" />
                <StatCard label="This Month" value={data.this_month?.toLocaleString()} icon={TrendingUp} color="#8b5cf6" />
                <StatCard label="All Time" value={data.total_all?.toLocaleString()} icon={Globe} color="#f59e0b" />
            </div>

            {/* Visitor Chart + Role Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

                {/* 30-day chart */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.55) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
                    padding: 20,
                    color: '#f8fafc'
                }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 16 }}>
                        Daily Visitors — Last 30 Days
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.visitor_chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)', background: '#0f172a', color: '#f8fafc', fontSize: 12 }} />
                            <Bar dataKey="total" fill="#6366f1" radius={[3, 3, 0, 0]} name="Visitors" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Role breakdown */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.55) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
                    padding: 20,
                    color: '#f8fafc'
                }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 16 }}>
                        Role Breakdown (30d)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(data.role_breakdown ?? []).map(r => {
                            const pct = Math.round((r.total / totalRoles) * 100);
                            const color = ROLE_COLORS[r.role] ?? '#6366f1';
                            return (
                                <div key={r.role}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                        <span style={{ fontWeight: 600, color: '#cbd5e1', textTransform: 'capitalize' }}>
                                            {r.role.replace('_', ' ')}
                                        </span>
                                        <span style={{ color: '#94a3b8' }}>{r.total} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {(!data.role_breakdown || data.role_breakdown.length === 0) && (
                            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                                No visitor data yet. Role breakdown will appear after the first demo login.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Coverage */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.55) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
                padding: 20,
                color: '#f8fafc'
            }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 16 }}>
                    📦 Data Population Coverage
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {[
                        { key: 'products',  label: 'Products',           icon: Package,      color: '#6366f1' },
                        { key: 'sales',     label: 'Sales (5yr)',         icon: TrendingUp,   color: '#10b981' },
                        { key: 'purchases', label: 'Purchases (5yr)',     icon: ShoppingCart, color: '#f59e0b' },
                        { key: 'expenses',  label: 'Expenses (5yr)',      icon: FileText,     color: '#ef4444' },
                        { key: 'parties',   label: 'Customers/Suppliers', icon: Users,        color: '#8b5cf6' },
                        { key: 'proposals', label: 'Proposals',           icon: FileText,     color: '#ec4899' },
                    ].map(({ key, label, icon: Icon, color }) => {
                        const count = data.data_counts?.[key] ?? 0;
                        const populated = count > 0;
                        return (
                            <div key={key} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', borderRadius: 10,
                                background: populated ? color + '15' : 'rgba(255, 255, 255, 0.02)',
                                border: `1px solid ${populated ? color + '30' : 'rgba(255, 255, 255, 0.06)'}`,
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedModules[key]}
                                    onChange={(e) => setSelectedModules({ ...selectedModules, [key]: e.target.checked })}
                                    style={{
                                        marginRight: 6,
                                        width: 14,
                                        height: 14,
                                        cursor: 'pointer',
                                        accentColor: color,
                                    }}
                                    title="Include this module in seeding"
                                />
                                {populated
                                    ? <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                    : <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                }
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{label}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {count > 0 ? `${count.toLocaleString()} records` : 'Not seeded yet'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {Object.values(data.data_counts ?? {}).every(v => v === 0) && (
                    <div style={{ textAlign: 'center', padding: '20px 0 4px', fontSize: 13, color: '#64748b' }}>
                        Run <strong>Full Deploy</strong> to populate all modules with 5-year data.
                    </div>
                )}
            </div>

            {/* ─── Page Health Tests (Pillar 5) ─── */}
            <div style={{
                background:   'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border:       `1px solid ${
                    runnerStatus === STATUS.RUNNING ? '#f59e0b' :
                    runnerStatus === STATUS.PASSED ? '#10b981' :
                    runnerStatus === STATUS.FAILED ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'
                }`,
                borderRadius: '16px',
                padding:      '20px 24px',
                boxShadow:    '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                transition:   'border-color 0.4s ease, box-shadow 0.4s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem',
                        }}>
                            🧪
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                    Demo Store Page Health Tests
                                </h3>
                                <RunnerStatusBadge status={runnerStatus} />
                            </div>
                            <p style={{ color: '#94a3b8', margin: '2px 0 0', fontSize: '0.75rem' }}>
                                35+ Authenticated GET checks across all active module sections
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {runnerStatus === STATUS.RUNNING && (
                            <span style={{ color: '#64748b', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>
                                ⏱ {runnerElapsed < 60 ? `${runnerElapsed}s` : `${Math.floor(runnerElapsed / 60)}m ${runnerElapsed % 60}s`}
                            </span>
                        )}

                        {runnerStatus !== STATUS.IDLE && (
                            <>
                                <button onClick={copyLogsToClipboard} style={{
                                    background:   'transparent',
                                    border:       '1px solid rgba(255, 255, 255, 0.12)',
                                    color:        '#cbd5e1',
                                    padding:      '6px 14px',
                                    borderRadius: '8px',
                                    cursor:       'pointer',
                                    fontSize:     '0.78rem',
                                    fontWeight:   500,
                                    transition:   'all 0.2s',
                                }}>
                                    📋 Copy Logs
                                </button>
                                <button onClick={resetRunner} style={{
                                    background:   'transparent',
                                    border:       '1px solid rgba(255, 255, 255, 0.12)',
                                    color:        '#cbd5e1',
                                    padding:      '6px 14px',
                                    borderRadius: '8px',
                                    cursor:       'pointer',
                                    fontSize:     '0.78rem',
                                    fontWeight:   500,
                                    transition:   'all 0.2s',
                                }}>
                                    Reset
                                </button>
                            </>
                        )}

                        <button
                            onClick={runnerStatus === STATUS.IDLE ? runPageTests : undefined}
                            disabled={runnerStatus === STATUS.RUNNING || deploying || resetting}

                            style={{
                                background:   runnerStatus === STATUS.RUNNING ? 'transparent' : (runnerStatus !== STATUS.IDLE ? 'transparent' : '#10b981'),
                                border:       `1px solid ${
                                    runnerStatus === STATUS.RUNNING ? '#f59e0b' :
                                    runnerStatus === STATUS.PASSED ? '#10b981' :
                                    runnerStatus === STATUS.FAILED ? '#ef4444' : '#10b981'
                                }`,
                                color:        runnerStatus === STATUS.RUNNING ? '#f59e0b' : (runnerStatus === STATUS.PASSED ? '#10b981' : runnerStatus === STATUS.FAILED ? '#ef4444' : '#fff'),
                                padding:      '8px 18px',
                                borderRadius: '10px',
                                cursor:       runnerStatus === STATUS.RUNNING ? 'not-allowed' : 'pointer',
                                fontSize:     '0.82rem',
                                fontWeight:   600,
                                transition:   'all 0.25s',
                                whiteSpace:   'nowrap',
                            }}
                        >
                            {runnerStatus === STATUS.IDLE    && '▶ Run Page Tests'}
                            {runnerStatus === STATUS.RUNNING && '⟳ Running…'}
                            {runnerStatus === STATUS.PASSED  && '✓ All Healthy'}
                            {runnerStatus === STATUS.FAILED  && '✗ Issues Found'}
                        </button>
                    </div>
                </div>

                {/* Progress Indicators */}
                {(runnerStatus === STATUS.RUNNING || runnerStatus !== STATUS.IDLE) && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Passed',  count: runnerCounts.pass, color: '#10b981' },
                            { label: 'Failed',  count: runnerCounts.fail, color: '#ef4444' },
                            { label: 'Skipped', count: runnerCounts.skip, color: '#f59e0b' },
                        ].map(({ label, count, color }) => (
                            <div key={label} style={{
                                padding:      '5px 14px',
                                borderRadius: '8px',
                                background:   `${color}15`,
                                border:       `1px solid ${color}30`,
                                color,
                                fontSize:     '0.76rem',
                                fontWeight:   600,
                            }}>
                                {count} {label}
                            </div>
                        ))}
                    </div>
                )}

                {/* Terminal Window */}
                {runnerLines.length > 0 && (
                    <div
                        ref={runnerTermRef}
                        style={{
                            background:   '#080d17',
                            border:       '1px solid #1e293b',
                            borderRadius: '10px',
                            padding:      '14px 16px',
                            maxHeight:    '300px',
                            overflowY:    'auto',
                            fontFamily:   '"JetBrains Mono", "Fira Code", "Courier New", monospace',
                            fontSize:     '0.74rem',
                            lineHeight:   1.7,
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#1e293b #080d17',
                        }}
                    >
                        {runnerLines.map((line, i) => (
                            <RunnerLineRow key={i} item={line} index={i} />
                        ))}

                        {runnerStatus === STATUS.RUNNING && (
                            <span style={{
                                color:     '#f59e0b',
                                animation: 'demoRunnerBlink 1s step-end infinite',
                                fontSize:  '0.9rem',
                            }}>
                                ▌
                            </span>
                        )}
                    </div>
                )}

                {/* Placeholder */}
                {runnerStatus === STATUS.IDLE && runnerLines.length === 0 && (
                    <div style={{
                        border:       '1px dashed #cbd5e1',
                        borderRadius: '10px',
                        padding:      '24px',
                        textAlign:    'center',
                        color:        '#64748b',
                        fontSize:     '0.8rem',
                    }}>
                        Click <strong style={{ color: '#10b981' }}>Run Page Tests</strong> to initiate a live health scan of all frontend routes.
                        <br />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6, display: 'block' }}>
                            Simulates full Owner authentication · Scans P&L, POS, Staff, Inventory, Sales, CRM and 30+ pages
                        </span>
                    </div>
                )}

                {/* Verdict Banner */}
                {runnerStatus !== STATUS.IDLE && runnerStatus !== STATUS.RUNNING && (
                    <div style={{
                        marginTop:    '14px',
                        padding:      '12px 18px',
                        borderRadius: '10px',
                        background:   runnerStatus === STATUS.PASSED ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border:       `1px solid ${runnerStatus === STATUS.PASSED ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '10px',
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>
                            {runnerStatus === STATUS.PASSED ? '✅' : '🔴'}
                        </span>
                        <div>
                            <div style={{
                                color:      runnerStatus === STATUS.PASSED ? '#10b981' : '#ef4444',
                                fontSize:   '0.84rem',
                                fontWeight: 600,
                            }}>
                                {runnerStatus === STATUS.PASSED
                                    ? 'All page checks passed — the platform is 100% stable.'
                                    : 'Page issues detected — some sections returned non-200 responses.'}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                                {runnerCounts.pass} passed · {runnerCounts.fail} failed · {runnerCounts.skip} skipped · {runnerElapsed < 60 ? `${runnerElapsed}s` : `${Math.floor(runnerElapsed / 60)}m ${runnerElapsed % 60}s`} total
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Animations styles */}
            <style>{`
                @keyframes demoRunnerPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.4; transform: scale(0.85); }
                }
                @keyframes demoRunnerBlink {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0; }
                }
            `}</style>

        </div>
    );
}
