/**
 * /known-issues — a public status board, laid out like a hosted status page
 * (Redis / Atlassian Statuspage style): one overall-state banner, counts by
 * state, open issues first as expandable rows, resolved history below.
 *
 * Every number on this page is counted from `issues` — there is no uptime
 * percentage or history bar, because nothing in the app measures one, and a
 * status page that shows invented uptime is worse than none.
 *
 * Props (KnownIssuesController@show): issues[{id,title,status,severity,
 * impact,workaround,updated_at}], lastUpdated.
 */
import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Info, Mail, MessageSquareWarning, Search } from 'lucide-react';
import MarketingLayout from '@/Pages/Marketing/Shared/MarketingLayout';

const RESOLVED = ['resolved', 'fixed', 'closed'];
const MITIGATED = ['mitigated', 'workaround available', 'monitoring'];

const stateOf = (status = '') => {
    const s = String(status).toLowerCase();
    if (RESOLVED.includes(s)) return 'resolved';
    if (MITIGATED.includes(s)) return 'mitigated';
    return 'open';
};

const STATE_META = {
    open: { label: 'Open', tone: 'warning' },
    mitigated: { label: 'Mitigated', tone: 'info' },
    resolved: { label: 'Resolved', tone: 'success' },
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(`${d}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

function Banner({ open, mitigated, worst }) {
    let tone = 'success';
    let Icon = CheckCircle2;
    let title = 'No open issues';
    let sub = 'Everything we know about is resolved.';
    if (open > 0) {
        tone = worst === 'high' || worst === 'critical' ? 'warning' : 'info';
        Icon = tone === 'warning' ? AlertTriangle : Info;
        title = `${open} open ${open === 1 ? 'issue' : 'issues'} we are working on`;
        sub = 'Details, impact and a workaround for each are below.';
    } else if (mitigated > 0) {
        tone = 'info';
        Icon = Info;
        title = `${mitigated} ${mitigated === 1 ? 'issue has' : 'issues have'} a workaround in place`;
        sub = 'A permanent fix is still in progress.';
    }
    return (
        <div className={`vq-status-banner vq-status-banner--${tone}`} role="status">
            <Icon size={26} aria-hidden="true" />
            <div>
                <p className="vq-status-banner__title">{title}</p>
                <p className="vq-status-banner__sub">{sub}</p>
            </div>
        </div>
    );
}

function IssueRow({ issue, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen);
    const state = stateOf(issue.status);
    const meta = STATE_META[state];
    const sev = String(issue.severity || '').toLowerCase();
    const panelId = `issue-${issue.id}`;
    return (
        <li className={`vq-issue vq-issue--${state}${open ? ' is-open' : ''}`}>
            <button type="button" className="vq-issue__head" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
                <span className={`vq-issue__dot vq-issue__dot--${meta.tone}`} aria-hidden="true" />
                <span className="vq-issue__main">
                    <span className="vq-issue__title">{issue.title}</span>
                    <span className="vq-issue__meta">
                        <span className="vq-issue__id">{issue.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>Updated {fmtDate(issue.updated_at)}</span>
                    </span>
                </span>
                <span className="vq-issue__chips">
                    {sev && <span className={`vq-sev vq-sev--${sev}`}>{issue.severity}</span>}
                    <span className={`vq-badge vq-badge--${meta.tone}`}>{issue.status || meta.label}</span>
                </span>
                <ChevronDown size={18} className="vq-issue__chev" aria-hidden="true" />
            </button>
            <div id={panelId} className="vq-issue__body" hidden={!open}>
                <dl>
                    <div>
                        <dt>Impact</dt>
                        <dd>{issue.impact}</dd>
                    </div>
                    {issue.workaround && (
                        <div>
                            <dt>{state === 'resolved' ? 'Resolution' : 'Workaround'}</dt>
                            <dd>{issue.workaround}</dd>
                        </div>
                    )}
                </dl>
            </div>
        </li>
    );
}

export default function KnownIssues({ issues = [], lastUpdated }) {
    const [query, setQuery] = useState('');

    const { openList, mitigatedList, resolvedList, worst } = useMemo(() => {
        const q = query.trim().toLowerCase();
        const match = (i) => !q || [i.title, i.id, i.impact, i.workaround].some((t) => String(t || '').toLowerCase().includes(q));
        const bySeverity = (a, b) => (SEVERITY_ORDER[String(a.severity).toLowerCase()] ?? 9) - (SEVERITY_ORDER[String(b.severity).toLowerCase()] ?? 9);
        const list = issues.filter(match);
        const openL = list.filter((i) => stateOf(i.status) === 'open').sort(bySeverity);
        const worstSev = issues
            .filter((i) => stateOf(i.status) === 'open')
            .map((i) => String(i.severity).toLowerCase())
            .sort((a, b) => (SEVERITY_ORDER[a] ?? 9) - (SEVERITY_ORDER[b] ?? 9))[0];
        return {
            openList: openL,
            mitigatedList: list.filter((i) => stateOf(i.status) === 'mitigated').sort(bySeverity),
            resolvedList: list.filter((i) => stateOf(i.status) === 'resolved').sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))),
            worst: worstSev,
        };
    }, [issues, query]);

    const totals = useMemo(() => ({
        open: issues.filter((i) => stateOf(i.status) === 'open').length,
        mitigated: issues.filter((i) => stateOf(i.status) === 'mitigated').length,
        resolved: issues.filter((i) => stateOf(i.status) === 'resolved').length,
    }), [issues]);

    const Group = ({ title, list, defaultOpen, empty }) => (
        <section className="vq-status-group" aria-label={title}>
            <div className="vq-status-group__head">
                <h2>{title}</h2>
                <span className="vq-status-group__count">{list.length}</span>
            </div>
            {list.length ? (
                <ul className="vq-issue-list">
                    {list.map((i) => <IssueRow key={i.id} issue={i} defaultOpen={defaultOpen} />)}
                </ul>
            ) : (
                <p className="vq-status-empty">{empty}</p>
            )}
        </section>
    );

    return (
        <MarketingLayout
            title="Known issues & status"
            description="Live list of known VenQore issues — what is affected, the workaround, and when it was last updated."
        >
            <section className="vq-section vq-status-page">
                <div className="vq-container vq-status-wrap">
                    <header className="vq-status-top">
                        <div>
                            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Status</span>
                            <h1 className="vq-h1 vq-mt-3">Known issues</h1>
                            <p className="vq-lede vq-mt-3">What we know is not working perfectly, who it affects, and what to do until it is fixed.</p>
                        </div>
                        <div className="vq-status-actions">
                            <a className="vq-btn vq-btn--secondary" href="/subscribe"><Mail size={16} aria-hidden="true" /> Get updates</a>
                            <a className="vq-btn vq-btn--primary" href="/contact"><MessageSquareWarning size={16} aria-hidden="true" /> Report an issue</a>
                        </div>
                    </header>

                    <Banner open={totals.open} mitigated={totals.mitigated} worst={worst} />

                    <div className="vq-status-bar">
                        <dl className="vq-status-counts">
                            <div><dt><span className="vq-issue__dot vq-issue__dot--warning" aria-hidden="true" />Open</dt><dd>{totals.open}</dd></div>
                            <div><dt><span className="vq-issue__dot vq-issue__dot--info" aria-hidden="true" />Mitigated</dt><dd>{totals.mitigated}</dd></div>
                            <div><dt><span className="vq-issue__dot vq-issue__dot--success" aria-hidden="true" />Resolved</dt><dd>{totals.resolved}</dd></div>
                        </dl>
                        <label className="vq-status-search">
                            <Search size={16} aria-hidden="true" />
                            <span className="vq-sr-only">Search issues</span>
                            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title or ID" />
                        </label>
                    </div>

                    <Group title="Open" list={openList} defaultOpen empty="No open issues match." />
                    <Group title="Mitigated — workaround in place" list={mitigatedList} defaultOpen={false} empty="Nothing here right now." />
                    <Group title="Resolved" list={resolvedList} defaultOpen={false} empty="No resolved issues match." />

                    {lastUpdated && <p className="vq-status-foot">Board last updated {fmtDate(lastUpdated)}. Times are shown in your local date format.</p>}
                </div>
            </section>
        </MarketingLayout>
    );
}
