import type { ScopedState, StateDefaults, StorageAdapter } from '@a11y-now/types';
/**
 * Create the plugin-scoped reactive persisted state.
 *
 * The whole scope is persisted as one JSON blob under
 * `<prefix>:plugin:<name>`, mirroring how the reference toolbar keeps one
 * cookie per feature — but versionable and namespaced.
 */
export declare const createScopedState: <T extends StateDefaults>(name: string, defaults: T, storage: StorageAdapter | null, prefix: string) => ScopedState<T>;
/** Default storage adapter backed by `localStorage`, or `null` when absent. */
export declare const createLocalStorageAdapter: () => StorageAdapter | null;
/** In-memory adapter, useful for tests and privacy-sensitive embeds. */
export declare const createMemoryStorageAdapter: () => StorageAdapter;
