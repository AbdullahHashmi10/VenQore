One-line: dropdown select; `size="sm"` is the in-card period picker ("Today / Month / Year").

```jsx
<Select label="Currency" options={["PKR","USD","AED"]} value={c} onChange={e=>setC(e.target.value)} />
<Select size="sm" options={["Today","Month","Year"]} />
```
