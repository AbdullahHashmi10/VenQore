---
tags: [frontend, components]
---

# Components & Layouts

Part of [[VenQore POS - Home]] · [[Frontend Architecture]]

## Layouts (`resources/js/Layouts/`)
| File | Purpose |
|---|---|
| `AuthenticatedLayout.jsx` | Main authenticated-store shell (sidebar/nav wrapper) |
| `GlobalProviderLayout.jsx` | Top-level provider composition — see [[State Management]] |
| `GuestLayout.jsx` | Unauthenticated page wrapper |
| `OneGlanceLayout.jsx` | Compact POS-terminal shell, used by `Pos.jsx` |
| `PlatformLayout.jsx` / `PlatformShell.jsx` | Platform-owner layer shell |
| `ReportsLayout.jsx` | Wrapper for ~50 report pages |
| `SuperAdminLayout.jsx` | SuperAdmin section shell |

## Components (`resources/js/Components/`, 100+ files) — selected
| File | Purpose |
|---|---|
| `AiAssistantModal.jsx`, `ChatWidget.jsx`, `FloatingAiBubble.jsx` | AI assistant UI |
| `AlertModal.jsx`, `ConfirmModal.jsx`, `InputModal.jsx`, `Modal.jsx`, `FormModal.jsx` | Generic modal primitives (imperative-modal pattern) |
| `AsyncPartyCombobox.jsx`, `AsyncProductCombobox.jsx`, `SmartCombobox.jsx` | Server-backed autocomplete/search inputs |
| `CommandPalette.jsx`, `OmniSearch.jsx`, `KeyboardShortcutsModal.jsx` | Global keyboard/command UX |
| `DataTable.jsx`, `Pagination.jsx`, `FilterPanel.jsx`, `EmptyState.jsx` | Generic list/table UI patterns |
| `Checkbox.jsx`, `TextInput.jsx`, `InputLabel.jsx`, `InputError.jsx`, `PrimaryButton.jsx`, `SecondaryButton.jsx`, `DangerButton.jsx`, `Dropdown.jsx`, `Toggle.jsx` | Breeze-derived base form components |
| `ConnectionGuard.jsx`, `OfflineLockScreen.jsx`, `OfflineWarningBanner.jsx`, `PwaInstallPrompt.jsx` | Offline/connectivity UX |
| `ErrorBoundary.jsx`, `GlobalErrorBoundary.jsx` | React error boundaries |
| `FeatureLock.jsx`, `FeatureLockBadge.jsx`, `PlanUsageBanner.jsx`, `LimitGraceBanner.jsx`, `SubscriptionExpiryBanner.jsx` | SaaS plan/feature-gating UI |
| `ImpersonationBanner.jsx` | SuperAdmin impersonation indicator |
| `Pos/PaymentModal.jsx` | POS-specific payment modal |
| `Sales/SalesMasterUI.jsx`, `Reports/MasterReport.jsx` | Feature-area composite UIs |
| `SuperAdmin/DemoStoreTab.jsx`, `HealthWidget.jsx`, `SmokeTestRunner.jsx` | SuperAdmin-only widgets |
| `*TourGuide.jsx` (Pos, Product, Purchase, Invoice, Expense, Import, Dashboard) | Per-module onboarding overlays |
| `*ModuleTabs.jsx` (Sell, Stock, Purchase, Money, Contacts) | Shared tab-navigation per module group |
| `PageHeader.jsx`, `SectionHeader.jsx`, `StatCard.jsx`, `DualStatCard.jsx`, `ChartSection.jsx` | Dashboard/report layout primitives |
| `SecurityPinModal.jsx`, `PasscodeModal.jsx`, `ElevatedPinModal.jsx` | PIN/passcode-gated action UX |
| `StoreSwitcher.jsx` | Multi-tenant store switching UI |

## Notable Shared UI Patterns
- **Modal-as-hook pattern**: pages keep modal visibility/content in local state objects and render shared modal components (`showAlert()`, `showConfirm()`, `showInput()` helpers).
- **Async combobox pattern**: server-backed searchable selects reused across POS, invoicing, purchases.
- **Tour-guide-per-module convention**: each major module has a matching `*TourGuide.jsx`.
- **Tab-bar convention**: `*ModuleTabs.jsx` standardizes secondary navigation within a module.
- **Plan-gating UI convention**: `FeatureLock`/`FeatureLockBadge`/`PlanUsageBanner`/`LimitGraceBanner`/`SubscriptionExpiryBanner` reused across pages to gate/upsell features.

## Related
- [[Pages Directory Structure]]
- [[State Management]]
