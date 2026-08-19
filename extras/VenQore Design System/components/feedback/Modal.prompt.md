One-line: dialog for confirms, quick forms and the business-category picker.

```jsx
<Modal title="Delete invoice INV-2291?" description="This reverses two ledger postings."
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="danger">Delete INV-2291</Button></>}
  onClose={close}/>
```

Destructive confirms name the object in the button label. Widths: 560 / 720 / 960.
