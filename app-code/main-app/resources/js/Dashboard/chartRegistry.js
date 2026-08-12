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
