'use strict';

// Main-process authorization. A renderer cannot create or extend this session.
class OwnerAccess {
    constructor(prefs, now = Date.now) { this.prefs = prefs; this.now = now; this.until = 0; }
    lock() { this.until = 0; }
    authorized() { return !this.prefs.hasPin() || this.now() < this.until; }
    verify(pin, grant = false) {
        if (!this.prefs.hasPin()) return { ok: true };
        const now = this.now();
        const state = this.prefs.get('pinAttempts') || {};
        if (now < (state.until || 0)) return { ok: false, locked: true, error: `Too many wrong PINs. Try again in ${Math.ceil((state.until - now) / 1000)} s.` };
        if (this.prefs.verifyPin(String(pin || ''))) {
            this.prefs.set({ pinAttempts: { failures: 0, until: 0 } }, { immediate: true });
            if (grant) this.until = now + 5 * 60_000;
            return { ok: true };
        }
        const failures = (state.failures || 0) + 1;
        this.prefs.set({ pinAttempts: { failures: failures >= 5 ? 0 : failures, until: failures >= 5 ? now + 60_000 : 0 } }, { immediate: true });
        return { ok: false, error: 'Wrong PIN' };
    }
}
module.exports = { OwnerAccess };
