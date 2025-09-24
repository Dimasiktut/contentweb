// FIX: Simplified import to ensure proper type inference for the PocketBase client.
// The previous complex import was causing the client to be of type 'any', leading to TypeScript errors.
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
export const pb = new PocketBase(POCKETBASE_URL);

pb.autoCancellation(false);