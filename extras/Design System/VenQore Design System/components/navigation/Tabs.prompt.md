One-line: in-card period switcher and page-level segmented nav.

```jsx
<Tabs tabs={["Today","Month","Year"]} value={p} onChange={setP} size="sm"/>
```

The thumb slides on `--vq-ease-spring`; labels never move. Use for 2–4 options — more than that is a Select.
