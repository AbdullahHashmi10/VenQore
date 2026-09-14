import React from 'react';
import StatChart from './charts/StatChart';
import SparklineChart from './charts/SparklineChart';
import GaugeChart from './charts/GaugeChart';
import StatusCard from './charts/StatusCard';
import SeriesChart from './charts/SeriesChart';
import BreakdownChart from './charts/BreakdownChart';
import TableChart from './charts/TableChart';
import HeatmapChart from './charts/HeatmapChart';
import FeedChart from './charts/FeedChart';

export const chartRegistry = {
    // Core scalar/status
    stat: StatChart,
    sparkline: SparklineChart,
    gauge: GaugeChart,
    status: StatusCard,

    // Series shapes
    line: (props) => React.createElement(SeriesChart, { ...props, chartType: 'line' }),
    area: (props) => React.createElement(SeriesChart, { ...props, chartType: 'area' }),
    bar: (props) => React.createElement(SeriesChart, { ...props, chartType: 'bar' }),
    profit_loss_line: (props) => React.createElement(SeriesChart, { ...props, chartType: 'profit_loss_line' }),
    live_line: (props) => React.createElement(SeriesChart, { ...props, chartType: 'live_line' }),
    composed: (props) => React.createElement(SeriesChart, { ...props, chartType: 'composed' }),
    scatter: (props) => React.createElement(SeriesChart, { ...props, chartType: 'scatter' }),

    // Breakdown shapes
    pie: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'pie' }),
    ring: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'ring' }),
    sunburst: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'sunburst' }),
    funnel: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'funnel' }),
    radar: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'radar' }),
    sankey: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'sankey' }),
    choropleth: (props) => React.createElement(BreakdownChart, { ...props, chartType: 'choropleth' }),

    // Other shapes
    table: TableChart,
    heatmap: HeatmapChart,
    feed: FeedChart,
};

export function getChartComponent(type) {
    return chartRegistry[type] || StatChart;
}

/**
 * What a chart is called in front of a user.
 *
 * The registry keys are wire format — `profit_loss_line` is a fine column value
 * and a poor thing to put in a picker. Which of these a user is actually
 * offered is decided by the Layout Law, not by this list: a chart may only
 * render a shape it is legal for (layout-law.json → chartLegality).
 *
 * The five at the bottom are reachable by an already-stored card but legal for
 * no shape, so they render and never appear in the editor. `candlestick` is
 * excluded from the system entirely — VenQore has no OHLC data.
 */
export const CHART_LABELS = {
    stat: 'Number',
    sparkline: 'Sparkline',
    gauge: 'Gauge',
    status: 'Status',

    line: 'Line',
    area: 'Area',
    bar: 'Bar',
    profit_loss_line: 'Profit & loss',
    composed: 'Combined',

    pie: 'Pie',
    ring: 'Ring',
    sunburst: 'Sunburst',
    funnel: 'Funnel',

    table: 'Table',
    heatmap: 'Heatmap',
    feed: 'Activity feed',

    // Legal for no shape — kept renderable for rows that already hold them.
    live_line: 'Live line',
    scatter: 'Scatter',
    radar: 'Radar',
    sankey: 'Sankey',
    choropleth: 'Map',
};

export const chartLabel = (type) => CHART_LABELS[type] || type;
