import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
    IDLE:    'idle',
    RUNNING: 'running',
    PASSED:  'passed',
    FAILED:  'failed',
};

const POLL_INTERVAL_MS = 800;

// ─── Line Parser ──────────────────────────────────────────────────────────────

/**
 * Parses a raw Pest output line into a typed object for the terminal renderer.
 * Pest's --colors=never output uses plain text with ✓ and ✗ markers.
 */
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

// ─── Color Map ────────────────────────────────────────────────────────────────

const LINE_COLORS = {
    pass:     '#10b981',  // emerald
    fail:     '#ef4444',  // red
    skip:     '#f59e0b',  // amber
    suite:    '#a78bfa',  // violet — suite-level PASS/FAIL header
    summary:  '#f1f5f9',  // near-white
    duration: '#475569',  // muted
    error:    '#f87171',  // light red
    trace:    '#64748b',  // slate
    divider:  '#1e293b',  // barely visible
    info:     '#94a3b8',  // default slate
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
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
                animation: status === STATUS.RUNNING ? 'smokeRunnerPulse 1.2s infinite' : 'none',
            }} />
            {c.label}
        </span>
    );
}

function LineRow({ item, index }) {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SmokeTestRunner() {
    const [status,  setStatus]  = useState(STATUS.IDLE);
    const [lines,   setLines]   = useState([]);
    const [elapsed, setElapsed] = useState(0);
    const [counts,  setCounts]  = useState({ pass: 0, fail: 0, skip: 0 });

    const pollRef  = useRef(null);
    const timerRef = useRef(null);
    const jobRef   = useRef(null);
    const termRef  = useRef(null);

    // Auto-scroll terminal output to bottom as lines arrive
    useEffect(() => {
        if (termRef.current) {
            termRef.current.scrollTop = termRef.current.scrollHeight;
        }
    }, [lines]);

    // Cleanup on unmount
    useEffect(() => () => {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
    }, []);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const startElapsedTimer = () => {
        setElapsed(0);
        timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };

    const stopAll = () => {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
    };

    const countLines = (parsed) => ({
        pass: parsed.filter(l => l.type === 'pass').length,
        fail: parsed.filter(l => l.type === 'fail').length,
        skip: parsed.filter(l => l.type === 'skip').length,
    });

    // ── Poll Loop ─────────────────────────────────────────────────────────────

    const poll = useCallback(async (jobId) => {
        try {
            const { data } = await axios.get(`/VenQore/smoke-tests/${jobId}`);
            const parsed = (data.lines || []).map(parseLine).filter(Boolean);

            setLines(parsed);
            setCounts(countLines(parsed));

            if (data.done) {
                stopAll();
                setStatus(data.passed ? STATUS.PASSED : STATUS.FAILED);

                // Auto-cleanup the server log file after 60s
                setTimeout(() => {
                    axios.delete(`/VenQore/smoke-tests/${jobId}`).catch(() => {});
                }, 60_000);
            }
        } catch {
            stopAll();
            setStatus(STATUS.FAILED);
            setLines(prev => [...prev, { type: 'error', text: 'Lost connection to test runner.' }]);
        }
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    const runTests = async () => {
        setStatus(STATUS.RUNNING);
        setLines([]);
        setCounts({ pass: 0, fail: 0, skip: 0 });
        startElapsedTimer();

        try {
            const { data } = await axios.post('/VenQore/smoke-tests/run');
            jobRef.current = data.job_id;
            pollRef.current = setInterval(() => poll(data.job_id), POLL_INTERVAL_MS);
        } catch (e) {
            stopAll();
            setStatus(STATUS.FAILED);
            setLines([{
                type: 'error',
                text: `Failed to start test runner: ${e?.response?.data?.message ?? e.message}`,
            }]);
        }
    };

    const reset = () => {
        stopAll();
        setStatus(STATUS.IDLE);
        setLines([]);
        setCounts({ pass: 0, fail: 0, skip: 0 });
        setElapsed(0);
        jobRef.current = null;
    };

    const copyToClipboard = () => {
        const textToCopy = lines.map(l => l.text).join('\n');
        navigator.clipboard.writeText(textToCopy);
    };

    // ── Derived UI State ──────────────────────────────────────────────────────

    const borderColor = {
        [STATUS.IDLE]:    '#334155',
        [STATUS.RUNNING]: '#f59e0b',
        [STATUS.PASSED]:  '#10b981',
        [STATUS.FAILED]:  '#ef4444',
    }[status];

    const isRunning = status === STATUS.RUNNING;
    const isDone    = status === STATUS.PASSED || status === STATUS.FAILED;

    const formatElapsed = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{
            background:   'rgba(255,255,255,0.02)',
            border:       `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding:      '20px 24px',
            transition:   'border-color 0.4s ease',
        }}>

            {/* ── Header Row ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Icon */}
                    <div style={{
                        width: 38, height: 38, borderRadius: '10px',
                        background: 'rgba(99,102,241,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem',
                    }}>
                        🧪
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                                Production Smoke Tests
                            </h3>
                            <StatusBadge status={status} />
                        </div>
                        <p style={{ color: '#475569', margin: '2px 0 0', fontSize: '0.75rem' }}>
                            20 read-only checks · safe to run on live server
                        </p>
                    </div>
                </div>

                {/* Control buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isRunning && (
                        <span style={{ color: '#64748b', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>
                            ⏱ {formatElapsed(elapsed)}
                        </span>
                    )}

                    {isDone && (
                        <>
                            <button onClick={copyToClipboard} style={{
                                background:   'transparent',
                                border:       '1px solid #334155',
                                color:        '#94a3b8',
                                padding:      '6px 14px',
                                borderRadius: '8px',
                                cursor:       'pointer',
                                fontSize:     '0.78rem',
                                transition:   'all 0.2s',
                            }}>
                                📋 Copy Logs
                            </button>
                            <button onClick={reset} style={{
                                background:   'transparent',
                                border:       '1px solid #334155',
                                color:        '#94a3b8',
                                padding:      '6px 14px',
                                borderRadius: '8px',
                                cursor:       'pointer',
                                fontSize:     '0.78rem',
                                transition:   'all 0.2s',
                            }}>
                                Reset
                            </button>
                        </>
                    )}

                    <button
                        id="smoke-test-run-btn"
                        onClick={status === STATUS.IDLE ? runTests : undefined}
                        disabled={isRunning}
                        style={{
                            background:   isRunning ? 'transparent' : (isDone ? 'transparent' : '#6366f1'),
                            border:       `1px solid ${isRunning ? '#f59e0b' : (status === STATUS.PASSED ? '#10b981' : status === STATUS.FAILED ? '#ef4444' : '#6366f1')}`,
                            color:        isRunning ? '#f59e0b' : (status === STATUS.PASSED ? '#10b981' : status === STATUS.FAILED ? '#ef4444' : '#fff'),
                            padding:      '8px 18px',
                            borderRadius: '10px',
                            cursor:       isRunning ? 'not-allowed' : 'pointer',
                            fontSize:     '0.82rem',
                            fontWeight:   600,
                            transition:   'all 0.25s',
                            whiteSpace:   'nowrap',
                        }}
                    >
                        {status === STATUS.IDLE    && '▶ Run Smoke Tests'}
                        {status === STATUS.RUNNING && '⟳ Running…'}
                        {status === STATUS.PASSED  && '✓ All Passed'}
                        {status === STATUS.FAILED  && '✗ Tests Failed'}
                    </button>
                </div>
            </div>

            {/* ── Progress Counters (visible while running or done) ── */}
            {(isRunning || isDone) && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    {[
                        { label: 'Passed',  count: counts.pass, color: '#10b981' },
                        { label: 'Failed',  count: counts.fail, color: '#ef4444' },
                        { label: 'Skipped', count: counts.skip, color: '#f59e0b' },
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

            {/* ── Terminal Output ── */}
            {lines.length > 0 && (
                <div
                    ref={termRef}
                    style={{
                        background:   '#080d17',
                        border:       '1px solid #1e293b',
                        borderRadius: '10px',
                        padding:      '14px 16px',
                        maxHeight:    '340px',
                        overflowY:    'auto',
                        fontFamily:   '"JetBrains Mono", "Fira Code", "Courier New", monospace',
                        fontSize:     '0.74rem',
                        lineHeight:   1.7,
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#1e293b #080d17',
                    }}
                >
                    {lines.map((line, i) => (
                        <LineRow key={i} item={line} index={i} />
                    ))}

                    {/* Blinking cursor while running */}
                    {isRunning && (
                        <span style={{
                            color:     '#f59e0b',
                            animation: 'smokeRunnerBlink 1s step-end infinite',
                            fontSize:  '0.9rem',
                        }}>
                            ▌
                        </span>
                    )}
                </div>
            )}

            {/* ── Idle Placeholder ── */}
            {status === STATUS.IDLE && lines.length === 0 && (
                <div style={{
                    border:       '1px dashed #1e293b',
                    borderRadius: '10px',
                    padding:      '24px',
                    textAlign:    'center',
                    color:        '#334155',
                    fontSize:     '0.8rem',
                }}>
                    Click <strong style={{ color: '#6366f1' }}>Run Smoke Tests</strong> to verify the production environment is healthy.
                    <br />
                    <span style={{ fontSize: '0.72rem', color: '#1e293b', marginTop: 6, display: 'block' }}>
                        Checks DB · Tables · Cache · Storage · Routes · API · Logs
                    </span>
                </div>
            )}

            {/* ── Verdict Banner ── */}
            {isDone && (
                <div style={{
                    marginTop:    '14px',
                    padding:      '12px 18px',
                    borderRadius: '10px',
                    background:   status === STATUS.PASSED ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border:       `1px solid ${status === STATUS.PASSED ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '10px',
                }}>
                    <span style={{ fontSize: '1.1rem' }}>
                        {status === STATUS.PASSED ? '✅' : '🔴'}
                    </span>
                    <div>
                        <div style={{
                            color:      status === STATUS.PASSED ? '#10b981' : '#ef4444',
                            fontSize:   '0.84rem',
                            fontWeight: 600,
                        }}>
                            {status === STATUS.PASSED
                                ? 'All checks passed — production environment is healthy.'
                                : 'One or more checks failed — do not deploy until resolved.'}
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px' }}>
                            {counts.pass} passed · {counts.fail} failed · {counts.skip} skipped · {formatElapsed(elapsed)} total
                        </div>
                    </div>
                </div>
            )}

            {/* ── CSS Animations ── */}
            <style>{`
                @keyframes smokeRunnerPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.4; transform: scale(0.85); }
                }
                @keyframes smokeRunnerBlink {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
