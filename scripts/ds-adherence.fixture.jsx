/**
 * ds-adherence.fixture.jsx — deliberately wrong code, kept wrong on purpose.
 *
 * NOT part of the app. Nothing imports this and Vite never sees it. It exists so
 * `design-check.sh` can prove the adherence rules are actually armed before it
 * believes a count of zero from them.
 *
 * ── Why a count of zero cannot be trusted on its own ────────────────────────
 *
 * oxlint exits 1 for "found problems" AND for "your config is broken". A
 * missing native binding crashes node before a single file is read. All three
 * produce an empty diagnostic list, and a harness that greps that list for
 * errors finds none and reports success. That is the precise failure mode this
 * whole section of design-check exists to prevent, so the section has to be
 * held to it too: run the rules against known-bad input first, and only trust a
 * clean report from a harness that just demonstrated it can catch something.
 *
 * design-check asserts each of the three rules fires at least once here, and
 * that `SidebarItem` does NOT appear in the output. Do not "fix" this file.
 */

import { Alert, Card, IconButton, StatCard } from '@/Components/ds';

// The app's own SidebarItem, which has different props from the DS one. The
// rule must resolve the import before firing, so this line must stay silent.
import SidebarItem from '@/Components/SidebarItem';

export default function AdherenceFixture({ spread }) {
    // Plain oxlint correctness bait, for the ratchet's own self-test. The ds
    // config turns the correctness category off, so this is invisible to the
    // three rules above and visible to the root config.
    const dupe = { a: 1, a: 2 };

    return (
        /* ds/enum — surface | accent | ink */
        <Card tone="dark">
            {/* ds/enum on tone, ds/no-unknown-prop on wobble */}
            <Alert tone="urgent" wobble="x" />

            {/* ds/required-prop — label is required, the glyph is not a name */}
            <IconButton />

            {/* ds/enum — up | down | flat */}
            <StatCard label="Net" value={dupe.a} deltaTone="green" />

            {/* Silent by design: a spread may supply the required prop. */}
            <IconButton {...spread} />

            {/* Silent by design: not a literal, so not ours to police. */}
            <Alert tone={spread.tone} />

            {/* Silent by design: this is the app's own component, not the DS one. */}
            <SidebarItem label="Ledger" wobble />
        </Card>
    );
}
