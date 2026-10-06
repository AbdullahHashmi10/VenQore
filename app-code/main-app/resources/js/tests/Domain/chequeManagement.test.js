/**
 * ============================================================
 * Cheque Management — Frontend Logic Verification Suite
 * ============================================================
 *
 * Tests pure functions and domain rules extracted from the
 * Chequebook / Cheque Management feature.  Runs in the
 * `node` vitest environment — no DOM, no React rendering.
 *
 * Coverage areas
 * ──────────────
 *  A) Chequebook range helpers
 *       A-01  leaf count (end - start + 1)
 *       A-02  inverted range (start > end) → 0 leaves
 *       A-03  equal start/end              → exactly 1 leaf
 *       A-04  range exceeds 500 cap
 *       A-05  serial preview with prefix and padding
 *       A-06  serial preview without prefix
 *
 *  B) Cheque leaf selector state helpers
 *       B-01  no bank account → empty / placeholder state
 *       B-02  bank account set, leaves available → populated
 *       B-03  current value reset when no longer in available set
 *
 *  C) Received cheque duplicate-identity helpers
 *       C-01  normalizeBank strips accents, case, whitespace
 *       C-02  fingerprint is tenant-scoped
 *       C-03  different tenants never share fingerprint
 *       C-04  different banks produce different fingerprints
 *       C-05  different cheque numbers produce different fingerprints
 *
 *  D) Duplicate override validation rules
 *       D-01  reason too short (< 10 chars) → invalid
 *       D-02  reason exactly 10 chars → valid
 *       D-03  reason > 10 chars → valid
 *       D-04  empty reason → invalid
 *       D-05  override without permission → blocked
 *       D-06  override with permission + valid reason → allowed
 *
 *  E) PDC (post-dated cheque) detection logic
 *       E-01  cheque_date > today → is PDC
 *       E-02  cheque_date = today → not PDC
 *       E-03  cheque_date < today → not PDC
 *       E-04  PDC due-window flag (within 7 days)
 *
 *  F) Cheque status badge helper
 *       F-01  received  → amber class
 *       F-02  deposited → blue class
 *       F-03  cleared   → emerald class
 *       F-04  bounced   → red class
 *       F-05  returned  → orange class
 *       F-06  unknown   → neutral class
 *
 *  G) Seven V6 dashboard card key registration
 *       G-01  all 7 cheque card keys exist in cards.json
 *       G-02  total card catalogue count equals 374
 *       G-03  each cheque card has required contract fields
 *       G-04  all 7 keys are unique within the catalogue
 *       G-05  cheque cards carry status === 'READY'
 *       G-06  cheque cards carry contract_state === 'implemented_unverified'
 *       G-07  cheque cards carry module === 'bank_accounts'
 *
 * @group cheque-management
 * @group phase-cheque-frontend
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// A) Chequebook range helpers
//    (Mirrors the useMemo logic in Pages/ChequeBooks/Create.jsx)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates leaf count the same way Create.jsx does:
 *   end >= start  →  end - start + 1
 *   otherwise     →  0
 */
function calcLeafCount(startStr, endStr) {
    const start = parseInt(startStr, 10);
    const end   = parseInt(endStr,   10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
        return end - start + 1;
    }
    return 0;
}

/**
 * Builds the preview serial strings the same way Create.jsx does.
 * Returns null when the range is invalid.
 */
function buildPreviewSerials(startStr, endStr, prefix = '', padding = 6) {
    const start = parseInt(startStr, 10);
    const end   = parseInt(endStr,   10);
    const pad   = parseInt(padding, 10) || 6;
    const pfx   = prefix ? prefix.trim().toUpperCase() + '-' : '';

    if (!isNaN(start) && !isNaN(end) && end >= start) {
        return {
            first: pfx + String(start).padStart(pad, '0'),
            last:  pfx + String(end).padStart(pad,   '0'),
        };
    }
    return null;
}

describe('A) Chequebook range helpers', () => {

    it('A-01 calculates correct leaf count for a standard range', () => {
        expect(calcLeafCount('1001', '1050')).toBe(50);
        expect(calcLeafCount('1',    '100')).toBe(100);
        expect(calcLeafCount('500',  '999')).toBe(500);
    });

    it('A-02 returns 0 when start > end (inverted range)', () => {
        expect(calcLeafCount('200', '100')).toBe(0);
        expect(calcLeafCount('999', '1')).toBe(0);
    });

    it('A-03 returns exactly 1 for equal start and end', () => {
        expect(calcLeafCount('42', '42')).toBe(1);
        expect(calcLeafCount('1000', '1000')).toBe(1);
    });

    it('A-04 detects range exceeding 500 cap', () => {
        // Create.jsx disables submit and shows warning when totalLeaves > 500
        expect(calcLeafCount('1', '501')).toBe(501); // > 500 → should be blocked
        expect(calcLeafCount('1', '500')).toBe(500); // exactly 500 → allowed
        const over = calcLeafCount('1', '600');
        expect(over).toBeGreaterThan(500);
        const ok = calcLeafCount('1', '500');
        expect(ok).toBeLessThanOrEqual(500);
    });

    it('A-05 builds preview serials with prefix and 6-digit padding', () => {
        const preview = buildPreviewSerials('1', '50', 'CHK', 6);
        expect(preview).not.toBeNull();
        expect(preview.first).toBe('CHK-000001');
        expect(preview.last).toBe('CHK-000050');
    });

    it('A-06 builds preview serials without prefix', () => {
        const preview = buildPreviewSerials('101', '150', '', 4);
        expect(preview).not.toBeNull();
        expect(preview.first).toBe('0101');
        expect(preview.last).toBe('0150');
    });

    it('A-06b returns null preview for invalid (inverted) range', () => {
        expect(buildPreviewSerials('100', '50')).toBeNull();
        expect(buildPreviewSerials('', '')).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// B) Cheque leaf selector state helpers
//    (Mirrors the state-management logic in Components/Cheque/ChequeSelector.jsx)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the selector state from bankAccountId + fetched leaves.
 * Simulates the component's rendered output contract.
 */
function deriveSelectorState(bankAccountId, leaves, currentValue) {
    if (!bankAccountId) {
        return {
            placeholder: 'Select a bank account first to view and select available cheque leaves.',
            leaves: [],
            value: '',
            disabled: true,
        };
    }

    const available = leaves || [];
    const valueIsValid = currentValue && available.some(l => l.id === currentValue);

    return {
        placeholder: available.length === 0
            ? 'No available leaves found'
            : '-- Select Available Cheque Leaf --',
        leaves: available,
        value: valueIsValid ? currentValue : '',
        disabled: available.length === 0,
        showEmptyWarning: available.length === 0,
    };
}

describe('B) Cheque leaf selector state helpers', () => {

    it('B-01 shows placeholder and empty state when no bankAccountId', () => {
        const state = deriveSelectorState(null, [], '');
        expect(state.placeholder).toContain('Select a bank account first');
        expect(state.leaves).toHaveLength(0);
        expect(state.disabled).toBe(true);
    });

    it('B-02 populates leaf list when bank account is set and leaves are available', () => {
        const leaves = [
            { id: 'leaf-1', display_serial_number: 'CHK-000001', serial_number: 1 },
            { id: 'leaf-2', display_serial_number: 'CHK-000002', serial_number: 2 },
        ];
        const state = deriveSelectorState('bank-uuid-abc', leaves, 'leaf-1');
        expect(state.leaves).toHaveLength(2);
        expect(state.value).toBe('leaf-1');
        expect(state.disabled).toBe(false);
        expect(state.placeholder).toBe('-- Select Available Cheque Leaf --');
    });

    it('B-03 resets value when current leaf is no longer in available set', () => {
        const leaves = [
            { id: 'leaf-3', display_serial_number: 'CHK-000003', serial_number: 3 },
        ];
        // currentValue is leaf-1 but it's not in the new leaves array
        const state = deriveSelectorState('bank-uuid-abc', leaves, 'leaf-1');
        expect(state.value).toBe('');
    });

    it('B-04 shows empty warning when bank set but no leaves', () => {
        const state = deriveSelectorState('bank-uuid-abc', [], '');
        expect(state.showEmptyWarning).toBe(true);
        expect(state.disabled).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// C) Received cheque duplicate-identity helpers
//    (Mirrors ChequeNumberNormalizer.php logic in JS for UI-side pre-validation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JS port of ChequeNumberNormalizer::normalizeBank()
 * Strips punctuation, collapses spaces, uppercase, trims.
 */
function normalizeBank(name) {
    if (!name) return '';
    return name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')  // strip punctuation
        .replace(/\s+/g, ' ')          // collapse whitespace
        .trim();
}

/**
 * JS port of ChequeNumberNormalizer::normalizeChequeNumber()
 * Strips non-alphanumeric, uppercase, trim.
 */
function normalizeChequeNumber(serial) {
    if (!serial) return '';
    return serial
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .trim();
}

/**
 * JS port of ChequeNumberNormalizer::fingerprint()
 * tenantId | normalizedBank | normalizedSerial
 */
function fingerprint(tenantId, bankName, chequeSerial) {
    return `${tenantId}|${normalizeBank(bankName)}|${normalizeChequeNumber(chequeSerial)}`;
}

describe('C) Received cheque duplicate-identity helpers', () => {

    it('C-01 normalizeBank strips punctuation, collapses case and spaces', () => {
        expect(normalizeBank('hbl')).toBe('HBL');
        expect(normalizeBank('H.B.L.')).toBe('HBL');
        expect(normalizeBank('  Meezan  Bank  ')).toBe('MEEZAN BANK');
        expect(normalizeBank('MCB (Pakistan)')).toBe('MCB PAKISTAN');
        expect(normalizeBank('')).toBe('');
        expect(normalizeBank(null)).toBe('');
    });

    it('C-02 fingerprint is tenant-scoped', () => {
        const fp1 = fingerprint('tenant-A', 'HBL', '123456');
        const fp2 = fingerprint('tenant-A', 'HBL', '123456');
        expect(fp1).toBe(fp2);
    });

    it('C-03 different tenants produce different fingerprints', () => {
        const fp1 = fingerprint('tenant-A', 'HBL', '123456');
        const fp2 = fingerprint('tenant-B', 'HBL', '123456');
        expect(fp1).not.toBe(fp2);
    });

    it('C-04 different banks produce different fingerprints', () => {
        const fp1 = fingerprint('tenant-A', 'HBL', '123456');
        const fp2 = fingerprint('tenant-A', 'MCB', '123456');
        expect(fp1).not.toBe(fp2);
    });

    it('C-05 different cheque numbers produce different fingerprints', () => {
        const fp1 = fingerprint('tenant-A', 'HBL', '000001');
        const fp2 = fingerprint('tenant-A', 'HBL', '000002');
        expect(fp1).not.toBe(fp2);
    });

    it('C-06 bank name normalization produces consistent fingerprints', () => {
        // "H.B.L.", "hbl", "HBL" → all same fingerprint
        const fp1 = fingerprint('tenant-X', 'H.B.L.', '100');
        const fp2 = fingerprint('tenant-X', 'hbl',    '100');
        const fp3 = fingerprint('tenant-X', 'HBL',    '100');
        expect(fp1).toBe(fp2);
        expect(fp2).toBe(fp3);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// D) Duplicate override validation rules
//    (Mirrors ChequeDuplicateService::canOverride() pre-flight checks)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Client-side pre-validation for duplicate override.
 * Returns { valid: bool, error?: string }
 */
function validateDuplicateOverride(hasPermission, reason) {
    if (!hasPermission) {
        return { valid: false, error: 'You do not have permission to override duplicate cheque detection.' };
    }
    if (!reason || reason.trim().length === 0) {
        return { valid: false, error: 'Override reason is required.' };
    }
    if (reason.trim().length < 10) {
        return { valid: false, error: 'Override reason must be at least 10 characters.' };
    }
    return { valid: true };
}

describe('D) Duplicate override validation rules', () => {

    it('D-01 reason shorter than 10 chars → invalid', () => {
        const result = validateDuplicateOverride(true, 'short');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('10 characters');
    });

    it('D-02 reason exactly 10 chars → valid', () => {
        const result = validateDuplicateOverride(true, '1234567890');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('D-03 reason longer than 10 chars → valid', () => {
        const result = validateDuplicateOverride(true, 'Vendor confirmed this is a re-issue of a lost cheque');
        expect(result.valid).toBe(true);
    });

    it('D-04 empty reason → invalid', () => {
        const result = validateDuplicateOverride(true, '');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('required');
    });

    it('D-05 no permission → blocked regardless of reason quality', () => {
        const result = validateDuplicateOverride(false, 'Valid long override reason here');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('permission');
    });

    it('D-06 permission + valid reason → allowed', () => {
        const result = validateDuplicateOverride(true, 'Re-issue confirmed by finance manager');
        expect(result.valid).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// E) PDC (post-dated cheque) detection logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if chequeDate is strictly after today (PDC).
 * @param {string} chequeDateStr - ISO date string e.g. '2026-12-01'
 * @param {string} todayStr      - ISO date string e.g. '2026-09-26'
 */
function isPostDated(chequeDateStr, todayStr) {
    return chequeDateStr > todayStr;
}

/**
 * Returns true if PDC and due within the next `windowDays` days.
 */
function isPdcDueSoon(chequeDateStr, todayStr, windowDays = 7) {
    if (!isPostDated(chequeDateStr, todayStr)) return false;
    const today    = new Date(todayStr);
    const dueDate  = new Date(chequeDateStr);
    const diffMs   = dueDate.getTime() - today.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= windowDays;
}

describe('E) PDC (post-dated cheque) detection logic', () => {

    const today = '2026-09-26';

    it('E-01 cheque_date in the future → is PDC', () => {
        expect(isPostDated('2026-12-01', today)).toBe(true);
        expect(isPostDated('2026-09-27', today)).toBe(true);
    });

    it('E-02 cheque_date equals today → not PDC', () => {
        expect(isPostDated('2026-09-26', today)).toBe(false);
    });

    it('E-03 cheque_date in the past → not PDC', () => {
        expect(isPostDated('2026-01-01', today)).toBe(false);
        expect(isPostDated('2025-12-31', today)).toBe(false);
    });

    it('E-04 PDC due within 7 days → isPdcDueSoon is true', () => {
        expect(isPdcDueSoon('2026-09-30', today, 7)).toBe(true);  // 4 days away
        expect(isPdcDueSoon('2026-10-03', today, 7)).toBe(true);  // 7 days away
    });

    it('E-04b PDC beyond 7-day window → isPdcDueSoon is false', () => {
        expect(isPdcDueSoon('2026-10-04', today, 7)).toBe(false); // 8 days away
        expect(isPdcDueSoon('2026-12-31', today, 7)).toBe(false);
    });

    it('E-04c past cheque → isPdcDueSoon is false', () => {
        expect(isPdcDueSoon('2026-09-01', today, 7)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// F) Cheque status badge CSS class helper
//    (Mirrors getStatusBadge() in Pages/ChequeBooks/ReceivedCheques.jsx)
// ─────────────────────────────────────────────────────────────────────────────

function getStatusBadge(status) {
    switch (status) {
        case 'received':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
        case 'deposited':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
        case 'cleared':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'bounced':
            return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
        case 'returned':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300';
        default:
            return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
    }
}

describe('F) Cheque status badge class helper', () => {

    it('F-01 received → amber classes', () => {
        const cls = getStatusBadge('received');
        expect(cls).toContain('amber');
    });

    it('F-02 deposited → blue classes', () => {
        const cls = getStatusBadge('deposited');
        expect(cls).toContain('blue');
    });

    it('F-03 cleared → emerald classes', () => {
        const cls = getStatusBadge('cleared');
        expect(cls).toContain('emerald');
    });

    it('F-04 bounced → red classes', () => {
        const cls = getStatusBadge('bounced');
        expect(cls).toContain('red');
    });

    it('F-05 returned → orange classes', () => {
        const cls = getStatusBadge('returned');
        expect(cls).toContain('orange');
    });

    it('F-06 unknown status → neutral fallback classes', () => {
        const cls = getStatusBadge('stopped');
        expect(cls).toContain('neutral');
        const cls2 = getStatusBadge(undefined);
        expect(cls2).toContain('neutral');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// G) Seven V6 Dashboard Card key registration
//    Reads cards.json directly — no HTTP, no server.
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTED_CHEQUE_CARD_KEYS = [
    'cheque.available_leaves',
    'cheque.issued_uncleared',
    'cheque.cheques_in_hand',
    'cheque.deposited_uncleared',
    'cheque.bounced_total',
    'cheque.stopped_total',
    'cheque.post_dated_due',
];

const EXPECTED_TOTAL_CARDS = 374;

let cardsJson;
try {
    const cardsPath = resolve(
        new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
        '../../../../data/reckoner/cards.json'
    );
    const raw = JSON.parse(readFileSync(cardsPath, 'utf8'));
    // cards.json may be an object keyed by card key OR a plain array
    cardsJson = Array.isArray(raw) ? raw : Object.values(raw);
} catch (e) {
    // Fallback path resolution for Windows
    try {
        const p = 'E:/AMD POS/AMD POS/app-code/main-app/resources/data/reckoner/cards.json';
        const raw = JSON.parse(readFileSync(p, 'utf8'));
        cardsJson = Array.isArray(raw) ? raw : Object.values(raw);
    } catch (e2) {
        cardsJson = null;
    }
}

describe('G) Seven V6 dashboard card key registration', () => {

    it('G-00 cards.json is readable', () => {
        expect(cardsJson).not.toBeNull();
        expect(Array.isArray(cardsJson)).toBe(true);
    });

    it('G-01 all 7 cheque card keys exist in cards.json', () => {
        if (!cardsJson) return;
        const allKeys = cardsJson.map(c => c.key);
        for (const key of EXPECTED_CHEQUE_CARD_KEYS) {
            expect(allKeys).toContain(key);
        }
    });

    it('G-02 total card catalogue count equals 374', () => {
        if (!cardsJson) return;
        expect(cardsJson).toHaveLength(EXPECTED_TOTAL_CARDS);
    });

    it('G-03 each cheque card has required contract fields (key, title, module, contract_state)', () => {
        if (!cardsJson) return;
        const chequeCards = cardsJson.filter(c => c.key && c.key.startsWith('cheque.'));
        expect(chequeCards).toHaveLength(7);
        for (const card of chequeCards) {
            expect(card).toHaveProperty('key');
            expect(card).toHaveProperty('title');
            expect(card).toHaveProperty('module');
            expect(card).toHaveProperty('contract_state');
            expect(card.key.length).toBeGreaterThan(0);
            expect(card.title.length).toBeGreaterThan(0);
        }
    });

    it('G-04 all 7 cheque card keys are unique within the catalogue', () => {
        if (!cardsJson) return;
        const chequeCards = cardsJson.filter(c => c.key && c.key.startsWith('cheque.'));
        const keys = chequeCards.map(c => c.key);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
        expect(keys.length).toBe(7);
    });

    it('G-05 cheque cards carry contract_state === "implemented_unverified"', () => {
        if (!cardsJson) return;
        const chequeCards = cardsJson.filter(c => c.key && c.key.startsWith('cheque.'));
        for (const card of chequeCards) {
            expect(card.contract_state).toBe('implemented_unverified');
        }
    });

    it('G-06 cheque cards carry topic === "cheque" and a defined unit field', () => {
        if (!cardsJson) return;
        const chequeCards = cardsJson.filter(c => c.key && c.key.startsWith('cheque.'));
        for (const card of chequeCards) {
            expect(card.topic).toBe('cheque');
            expect(card).toHaveProperty('unit');
        }
    });

    it('G-07 cheque cards carry module === "bank_accounts"', () => {
        if (!cardsJson) return;
        const chequeCards = cardsJson.filter(c => c.key && c.key.startsWith('cheque.'));
        for (const card of chequeCards) {
            expect(card.module).toBe('bank_accounts');
        }
    });
});
