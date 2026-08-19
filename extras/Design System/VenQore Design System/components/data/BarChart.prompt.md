One-line: weekday / category bar chart for the analytics card.

```jsx
<BarChart data={[3,7,5,9,4,6,2]} labels={["S","M","T","W","T","F","S"]} highlight={3}/>
```

Bars grow on mount with a 45ms stagger and a soft spring. Highlight exactly one bar; the rest stay in `--vq-chart-track`.
