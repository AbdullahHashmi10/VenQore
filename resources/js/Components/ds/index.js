/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  The VenQore V6 component library                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 *     import { Button, Card, DataTable } from '@/Components/ds';
 *
 * 28 components, vendored from `extras/Design System/VenQore Design System/`.
 * They import nothing but React and style themselves entirely through
 * `var(--vq-*)`, so they follow the token layer with no Tailwind classes, no
 * `dark:` twins and no configuration.
 *
 * ── Why these and not the ones already in Components/ ───────────────────────
 *
 * The app's own primitives were written before the token layer and mostly never
 * adopted: `PrimaryButton`, `SecondaryButton`, `DangerButton`, `TextInput`,
 * `Checkbox`, `InputLabel` and `EmptyState` have ZERO page imports between
 * them, and `DataTable` has two against 145 pages that hand-roll a `<table>`.
 * Replacing an unused primitive costs nothing; these are the replacements.
 *
 * ── Names that collide with the app's own ───────────────────────────────────
 *
 * `SidebarItem`, `StatCard` and `DataTable` all exist under `Components/` too.
 * That is why this library lives in its own directory and is imported by name
 * from the barrel rather than being merged in — an import path should never be
 * ambiguous about which of two components you get.
 *
 * The app's `Components/SidebarItem.jsx` stays for now: it carries hover-to-
 * expand, submenu routing and feature-lock badges that the DS version has no
 * concept of. The DS one is the visual reference, not a drop-in.
 *
 * ── The one local correction ────────────────────────────────────────────────
 *
 * Eight literal colours (`#fff` on filled surfaces, the switch knob, the
 * tooltip's ink) were replaced with the tokens that name them. Everything else
 * is verbatim, so the folder can be re-synced from the design system when it
 * moves.
 */

/* ── Core ─────────────────────────────────────────────────────────────────── */
export { Avatar, AvatarStack } from './core/Avatar';
export { Badge } from './core/Badge';
export { Button } from './core/Button';
export { Chip } from './core/Chip';
export { IconButton } from './core/IconButton';

/* ── Surfaces ─────────────────────────────────────────────────────────────── */
export { Card } from './surfaces/Card';

/* ── Data ─────────────────────────────────────────────────────────────────── */
export { ActivityRow } from './data/ActivityRow';
export { AreaChart } from './data/AreaChart';
export { BarChart } from './data/BarChart';
export { BarMeter } from './data/BarMeter';
export { DataTable } from './data/DataTable';
export { ProgressRing } from './data/ProgressRing';
export { StatCard } from './data/StatCard';

/* ── Forms ────────────────────────────────────────────────────────────────── */
export { Checkbox } from './forms/Checkbox';
export { Input } from './forms/Input';
export { SearchField } from './forms/SearchField';
export { Select } from './forms/Select';
export { Switch } from './forms/Switch';

/* ── Feedback ─────────────────────────────────────────────────────────────── */
export { Alert } from './feedback/Alert';
export { EmptyState, Skeleton } from './feedback/EmptyState';
export { Modal } from './feedback/Modal';
export { Toast } from './feedback/Toast';
export { Tooltip } from './feedback/Tooltip';

/* ── Navigation ───────────────────────────────────────────────────────────── */
export { SidebarItem as DsSidebarItem } from './navigation/SidebarItem';
export { Tabs } from './navigation/Tabs';
export { ThemeToggle } from './navigation/ThemeToggle';
