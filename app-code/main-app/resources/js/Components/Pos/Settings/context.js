import { createContext, useContext } from 'react';

/**
 * What every settings page can reach:
 *   p          everything the register handed down (values + setters)
 *   flash      the search id currently highlighted
 *   storeVal   read a whole-business setting, including unsaved local edits
 *   saveStore  write whole-business settings (one section at a time)
 *   track      wrap any async save so the header shows Saving… / Saved
 */
export const SettingsCtx = createContext(null);
export const useSettingsCtx = () => useContext(SettingsCtx);

export const truthy = v => v === true || v === 1 || v === '1' || v === 'true';
