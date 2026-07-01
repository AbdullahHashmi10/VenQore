/**
 * PlatformShell — drop-in adapter so existing SuperAdmin pages move into the
 * unified Command Center shell without rewriting their bodies.
 *
 * The old pages wrapped themselves in <OneGlanceLayout mode="admin"
 * activeMenu="…" title="…">. Swapping that tag for <PlatformShell …> renders
 * the new PlatformLayout (grouped sidebar, ⌘K, search, notifications, themed),
 * ignoring the store-layout-only props. Page bodies are unchanged.
 */
import React from 'react';
import PlatformLayout from '@/Layouts/PlatformLayout';

export default function PlatformShell({ title, children }) {
    return <PlatformLayout title={title || 'Command Center'}>{children}</PlatformLayout>;
}
