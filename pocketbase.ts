// Fix: Updated the import to point directly to the ES module distribution file.
// This is a common workaround for module resolution issues with some bundlers.
import PocketBase from 'pocketbase/dist/pocketbase.es.js';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);
