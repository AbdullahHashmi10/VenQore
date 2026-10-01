import React from 'react';

import { EmptyPlot, seriesColor } from './kit';

/**
 * FeedChart — what just happened.
 *
 * A feed is the one card where the most recent row matters more than the
 * biggest, so it keeps the order it arrives in and does not sort. It also does
 * not cap at three the way the old one did: the card's fit decides how many fit
 * and the rest scroll, because "three most recent sales" and "the sales feed"
 * are different cards and only one of them was asked for.
 */
export default function FeedChart({ data }) {
    const items = data?.items || data?.rows || [];

    if (!Array.isArray(items) || items.length === 0) {
        return <EmptyPlot label="Nothing yet today" />;
    }

    return (
        <div className="vqc-tb">
            {items.map((item, i) => (
                <div key={item.id ?? i} className="vqc-tr" style={{ '--d': `${i * 40}ms` }}>
                    <span className="vqc-fd" style={{ background: seriesColor(0) }} aria-hidden="true" />
                    <span className="vqc-tn" title={item.title}>
                        {item.title}
                        {item.subtitle && <span className="vqc-ft"> · {item.subtitle}</span>}
                    </span>
                    <span className="vqc-tv">{item.value}</span>
                    <span className="vqc-ft">{item.at}</span>
                </div>
            ))}
        </div>
    );
}
