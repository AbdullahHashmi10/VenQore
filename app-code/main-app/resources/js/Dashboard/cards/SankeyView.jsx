import React from 'react';
import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip } from '@/Components/Charts/sankey';

/* The Sankey plot itself. Kept in its own module so @visx/sankey is only
   fetched when a Sankey card is actually on screen. */
export default function SankeyView({ parts, label, width, height, variant, mo }) {
  const small = width < 380;
  const data = {
    nodes: [{ name: label }, ...parts.map(p => ({ name: p.label }))],
    links: parts.map((p, i) => ({ source: 0, target: i + 1, value: p.value })),
  };
  return (
    <div className="vqcc-plot" style={{ height }}>
      <SankeyChart data={data} className="h-full" aspectRatio="auto"
        margin={{ top: 14, bottom: 14, left: small ? 12 : 84, right: small ? 12 : 96 }}
        nodeWidth={12} nodePadding={parts.length > 5 ? 14 : 22}
        animationDuration={mo.duration} enterTransition={mo.transition}>
        <SankeyLink useGradient={variant !== 'solid'} />
        <SankeyNode showLabels={!small && variant !== 'no-labels'} showValueLabels={false} />
        <SankeyTooltip />
      </SankeyChart>
    </div>
  );
}
