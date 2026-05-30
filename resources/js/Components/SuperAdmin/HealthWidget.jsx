import React, { useState, useEffect } from 'react';
import { 
    Heart, ShieldAlert, Activity, Database, Cpu, 
    HardDrive, Terminal, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import axios from 'axios';

export default function HealthWidget() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [checks, setChecks] = useState({});
    const [checkedAt, setCheckedAt] = useState(null);

    const labels = {
        database:    { name: 'Database Engine', icon: Database, desc: 'Verifies DB ping & store presence' },
        storage:     { name: 'File Storage', icon: HardDrive, desc: 'Verifies read, write, and delete permissions' },
        cache:       { name: 'Cache System', icon: Cpu, desc: 'Verifies read/write speed & TTL stability' },
        queue:       { name: 'Queue Worker', icon: Activity, desc: 'Scans for recent background job failures' },
        recent_logs: { name: 'Error Log stream', icon: Terminal, desc: 'Analyzes memory-safe laravel.log stream' },
    };

    const allPass = results && Object.values(checks).every(c => c.ok);

    async function runChecks() {
        setLoading(true);
        try {
            const { data } = await axios.get('/VenQore/health/check');
            const { checked_at, ...rest } = data;
            setChecks(rest);
            setCheckedAt(checked_at);
            setResults(true);
        } catch (e) {
            console.error('Diagnostic run failed', e);
        } finally {
            setLoading(false);
        }
    }

    // Auto-run checks on load
    useEffect(() => {
        runChecks();
    }, []);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '24px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            color: '#f8fafc',
            transition: 'all 0.3s ease'
        }}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Heart className={loading ? "animate-pulse" : ""} size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">System Integrity Diagnostics</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time proactive live environment testing.</p>
                    </div>
                </div>

                <button 
                    onClick={runChecks} 
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/20 hover:scale-105 active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    {loading ? 'Diagnosing...' : 'Run Diagnostics'}
                </button>
            </div>

            {/* Overall Status Bar */}
            {results && (
                <div style={{
                    background: allPass ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${allPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                    borderRadius: '16px',
                    padding: '14px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {allPass ? (
                        <>
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                All Systems Operational · Clean Build Confirmed & Safe to Deploy
                            </div>
                        </>
                    ) : (
                        <>
                            <ShieldAlert className="text-red-500 shrink-0" size={18} />
                            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                                System Warning · Critical Checks Failed. Check logs immediately.
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(labels).map(([key, config]) => {
                    const result = checks[key];
                    const Icon = config.icon;
                    
                    return (
                        <div 
                            key={key}
                            style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.7 : 1
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)' }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">{config.name}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{config.desc}</div>
                                    </div>
                                </div>

                                {result ? (
                                    result.ok ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">PASS</span>
                                    ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">FAIL</span>
                                    )
                                ) : (
                                    <span className="text-[10px] text-slate-600 font-bold">...</span>
                                )}
                            </div>

                            {result && (
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: result.ok ? '#94a3b8' : '#f87171', 
                                    lineHeight: '1.4',
                                    marginTop: '8px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                                    paddingTop: '8px'
                                }}>
                                    {result.detail}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer timestamp */}
            {checkedAt && (
                <div className="text-right text-[10px] text-slate-500 font-mono mt-4">
                    Diagnostics refreshed at: {new Date(checkedAt).toLocaleString()}
                </div>
            )}
        </div>
    );
}
