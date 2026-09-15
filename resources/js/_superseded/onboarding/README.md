# Superseded onboarding screens

Replaced by `resources/js/Pages/Onboarding/Wizard.jsx` running on the shared
kit in `resources/js/Components/Builder/`. Kept here rather than deleted so the
old copy is readable during the rollout.

None of these were Inertia pages — `Onboarding/Wizard` is the only name
`OnboardingExperienceController` renders, and these were child components it
imported. Nothing else in `resources/js` imported them (checked before the
move), so nothing resolves them by string name and nothing breaks.

Why each one went:

| File | Why |
|---|---|
| `AiDiscovery.jsx` | Three dropdowns — industry, sales method, team size. The server read `industry` only; `salesType` and `teamSize` were not even in the validator, so two of the three questions changed nothing. |
| `Proposal.jsx` | Chips could only be REMOVED. There was no list of inactive modules to add from, so "add anything you like" was never true on this screen. |
| `Welcome.jsx` | Hard-coded dark palette (`bg-neutral-900`, `bg-brand-950/40`) with no light mode, and a currency/business-name form whose values were never submitted anywhere. |
| `PresetPicker.jsx` | Same hard-coded dark palette. Its job now lives in the Wizard's template step, reading the same `presets` config. |
| `Building.jsx` | Same, plus a progress animation that ran on a timer unrelated to the request. |
| `FirstRunDashboard.jsx` | Same palette problem; the completion step is now part of the Wizard. |
