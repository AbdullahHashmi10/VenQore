One-line: the stacked breakdown row (healthy / low / out, cash / bank / credit).

```jsx
<BarMeter label="Healthy" value={75} color="var(--vq-success)"/>
<BarMeter label="Out" value={25} color="var(--vq-danger)"/>
```

Three or four rows per card, max. Bars animate width once on mount, never on re-render loops.
