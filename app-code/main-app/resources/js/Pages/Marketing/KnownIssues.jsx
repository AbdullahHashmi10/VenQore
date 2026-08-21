import React from 'react';
import { Head } from '@inertiajs/react';

export default function KnownIssues({ issues, lastUpdated }) {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans">
            <Head title="Known Issues — VenQore POS" />
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center space-y-3">
                    <h1 className="text-4xl font-bold text-white">System Status & Known Issues</h1>
                    <p className="text-ink-muted">
                        Live status board updated during launch week. Check active issues and verified workarounds below.
                    </p>
                    <div className="inline-block text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full">
                        Last Updated: {lastUpdated}
                    </div>
                </header>

                <div className="space-y-6">
                    {issues.map((issue) => (
                        <div key={issue.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono text-ink-muted">{issue.id}</span>
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                                    issue.status === 'Resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                    issue.status === 'Mitigated' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                    'bg-amber-950 text-amber-400 border border-amber-800'
                                }`}>
                                    {issue.status}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-white">{issue.title}</h2>
                            <p className="text-neutral-300 text-sm">{issue.impact}</p>
                            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs space-y-1">
                                <span className="font-semibold text-purple-400">Workaround / Fix:</span>
                                <p className="text-ink-muted">{issue.workaround}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
