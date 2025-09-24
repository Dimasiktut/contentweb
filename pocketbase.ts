// FIX: Corrected the PocketBase import to use a default import. The module
// provides a default export, and the previous named import was causing a syntax error.
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
// The type of `pb` is inferred from the constructor, so an explicit type annotation is not required.
export const pb = new PocketBase(POCKETBASE_URL);

pb.autoCancellation(false);