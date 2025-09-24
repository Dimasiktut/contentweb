import * as PocketBaseModule from 'pocketbase';

// FIX: Use a namespace import and then access the default export.
// This is a robust way to handle module resolution issues, especially when a file
// in the project has the same name as an npm package. The bundler can get confused.
const PocketBase = (PocketBaseModule as any).default || PocketBaseModule;

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
export const pb = new PocketBase(POCKETBASE_URL);

pb.autoCancellation(false);