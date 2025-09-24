import * as PocketBaseModule from 'pocketbase';
// FIX: Explicitly import the PocketBase class type to ensure `pb` is correctly typed.
// This resolves the "Untyped function calls may not accept type arguments" errors throughout the app.
// By deriving the type from the namespace import, we avoid a separate `import type` that can get confused by the local file name.
type PocketBase = PocketBaseModule.default;

// FIX: Use a namespace import and then access the default export.
// This is a robust way to handle module resolution issues, especially when a file
// in the project has the same name as an npm package. The bundler can get confused.
const PocketBaseConstructor = (PocketBaseModule as any).default || PocketBaseModule;

const POCKETBASE_URL = 'https://pocketbase-production-63f9.up.railway.app';

/**
 * PocketBase client instance.
 * Auto-cancellation is disabled to allow subscriptions to persist.
 */
// FIX: Explicitly type the `pb` instance with the imported PocketBase type.
export const pb: PocketBase = new PocketBaseConstructor(POCKETBASE_URL);

pb.autoCancellation(false);