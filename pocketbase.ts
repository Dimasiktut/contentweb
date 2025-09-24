import PocketBase, { type RecordSubscription } from 'pocketbase/dist/pocketbase.es.mjs';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 *
 * @remarks
 * We are using a deep import from 'pocketbase/dist/pocketbase.es.mjs' as a temporary
 * workaround for a build-time module resolution issue. The standard 'pocketbase'
 * import conflicts with the local file name.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

export type { RecordSubscription };
