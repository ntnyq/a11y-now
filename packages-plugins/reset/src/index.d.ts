import type { ConfiguredPlugin } from '@a11y-now/types';
export interface ResetApi {
    reset: () => void;
}
/** Reset-everything plugin. `Ctrl+Alt+C`. */
export declare const reset: () => ConfiguredPlugin<undefined, ResetApi>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        reset: ResetApi;
    }
}
