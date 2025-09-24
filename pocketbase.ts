// FIX: Replaced combined import with a default-only import to resolve a potential module resolution issue that caused the "no default export" error.
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);
