One-line: the app's data table — invoices, ledger lines, stock lists.

```jsx
<DataTable
  columns={[{key:"ref",label:"Invoice"},{key:"party",label:"Customer"},{key:"amount",label:"Amount",numeric:true}]}
  rows={rows}
  totals={{amount:"Rs 412,900.00"}}
/>
```

No vertical rules, ever. Negative figures get a minus sign, parentheses AND `--vq-danger`. Row hover is a background change only.
