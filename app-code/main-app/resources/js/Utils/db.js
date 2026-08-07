import { db as consolidatedDb } from '../DB/LocalDB';

export const db = consolidatedDb;

// Helper to check connection
export const isOnline = () => navigator.onLine;
