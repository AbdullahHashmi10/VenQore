One-line: the dashboard KPI tile; a row of 4 opens every app screen.

```jsx
<StatCard tone="accent" label="Total balance" value="Rs 6,636,549" delta="8.2%" caption="vs last month"/>
<StatCard label="Overdue" value="Rs 10,260" delta="3.1%" deltaTone="down" caption="receivables"/>
```

Figures are always `--vq-font-numeric` with tabular figures. Never animate a ledger figure counting up. The icon bubble tilts on hover — that is the tile's whole personality, don't add more.
