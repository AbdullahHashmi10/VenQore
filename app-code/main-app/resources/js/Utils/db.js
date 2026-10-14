import { db as consolidatedDb } from '../DB/LocalDB';

export const db = consolidatedDb;

// Helper to check connection
import { isOnline as connectivityIsOnline } from '../lib/connectivity';

// Real reachability (adapter + server + Station), not just the network adapter. See lib/connectivity.js.
export const isOnline = () => connectivityIsOnline();
