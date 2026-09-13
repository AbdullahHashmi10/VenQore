import StatChart from './StatChart';

/**
 * A SCALAR rendered as `sparkline` rather than `stat` is the same card with the
 * run-up given more room. The frame draws the figure either way, so the two
 * chart types differ only in the height the fit gives the plot — which is a
 * layout decision, not a rendering one.
 *
 * Kept as a named module because `chartRegistry` maps chart type → component
 * and the Reckoner stores `sparkline` on real cards.
 */
export default StatChart;
