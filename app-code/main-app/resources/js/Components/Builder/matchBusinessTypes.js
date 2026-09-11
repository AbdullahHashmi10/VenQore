/**
 * Client-side mirror of App\Support\BusinessTypes::match(), used ONLY for
 * instant suggestions while someone types. The server's match is the one that
 * decides; keep the scoring rules here in step with it:
 *   exact phrase = 3 per word · all words apart = 2 per word · plurals folded.
 * Plus one thing the server does not need: the word still being typed counts
 * when an alias word starts with it ("plum" → plumber).
 */

const singular = (w) => {
    if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
    return w;
};

export const tokens = (text) =>
    String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/&/g, ' and ')
        .replace(/-/g, ' ')
        .replace(/[^a-z0-9\s]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(singular);

const labelPhrase = (label) => String(label || '').split(/\s*(?:&|,|\(|\/)\s*/)[0];

/** True when a and b differ by exactly one insert, delete or substitution. */
function oneEditApart(a, b) {
    if (a === b || Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            i += 1;
            j += 1;
            continue;
        }
        edits += 1;
        if (edits > 1) return false;
        if (a.length > b.length) i += 1;
        else if (a.length < b.length) j += 1;
        else {
            i += 1;
            j += 1;
        }
    }
    return edits + (a.length - i) + (b.length - j) === 1;
}

const indexCache = new WeakMap();

function indexOf(types) {
    if (indexCache.has(types)) return indexCache.get(types);
    const index = types.map((t) => {
        const phrases = new Map();
        [...(t.aliases || []), labelPhrase(t.label)].forEach((a) => {
            const tk = tokens(a);
            if (tk.length) phrases.set(tk.join(' '), tk);
        });
        const words = new Set([...phrases.values()].flat());
        tokens(t.label).forEach((w) => words.add(w));
        return { type: t, phrases: [...phrases.values()], words };
    });
    indexCache.set(types, index);
    return index;
}

/** Best business types for a sentence, highest first. */
export function rankBusinessTypes(text, types, limit = 4) {
    const tk = tokens(text);
    if (!tk.length || !types?.length) return [];
    const hay = ` ${tk.join(' ')} `;
    const set = new Set(tk);
    const last = tk[tk.length - 1];

    const scored = [];
    indexOf(types).forEach(({ type, phrases, words }) => {
        let score = 0;
        phrases.forEach((p) => {
            if (hay.includes(` ${p.join(' ')} `)) score += 3 * p.length;
            else if (p.length > 1 && p.every((w) => set.has(w))) score += 2 * p.length;
        });
        // Loose signal for suggestions only: each typed word that is one of
        // this type's words (or one letter off), and the word still being typed.
        tk.forEach((t) => {
            if (t.length < 3) return;
            if (words.has(t)) score += 1;
            else if (t.length >= 5 && [...words].some((w) => oneEditApart(t, w))) score += 1;
        });
        if (last && last.length >= 3) {
            for (const w of words) {
                if (w !== last && w.startsWith(last)) {
                    score += 1;
                    break;
                }
            }
        }
        if (score > 0) scored.push({ type, score });
    });

    scored.sort((a, b) => b.score - a.score);
    const floor = scored.length ? scored[0].score / 2 : 0;
    return scored
        .filter((s) => s.score >= floor)
        .slice(0, limit)
        .map((s) => s.type);
}

/** Search-box filter: every typed word must start a word of the label, note or an alias. */
export function filterBusinessTypes(query, types) {
    const q = tokens(query);
    if (!q.length) return types;
    return indexOf(types)
        .filter(({ type, words }) => {
            const all = [...words, ...tokens(type.note || '')];
            return q.every((w) => all.some((x) => x.startsWith(w)));
        })
        .map(({ type }) => type);
}
