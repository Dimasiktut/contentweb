import PocketBase, { type RecordSubscription } from 'pocketbase/dist/pocketbase.es.mjs';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

export type { RecordSubscription };
