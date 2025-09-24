import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@latest/dist/pocketbase.es.mjs';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);
