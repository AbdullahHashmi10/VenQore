/**
 * "Pizza (Large)" + add-ons → "Pizza (Large) (Extra cheese, Olives)".
 *
 * Every receipt renderer prints one name per line. Add-ons are part of what was
 * sold (and, for "no onions", the whole point of the line), so they ride on the
 * name rather than needing each renderer to grow a second row. Reads either the
 * saved sale line (`modifiers`) or a live cart line (`mods`).
 */
export function addOnNames(item) {
    const list = Array.isArray(item?.modifiers) ? item.modifiers : (Array.isArray(item?.mods) ? item.mods : []);
    return list.map(m => String(m?.name || '').trim()).filter(Boolean);
}

export function withAddOns(name, item) {
    const names = addOnNames(item);
    return names.length ? `${name} (${names.join(', ')})` : name;
}
