import type { ConfiguredPlugin } from '@a11y-now/types';
export interface HelpApi {
    close: () => void;
    isOpen: () => boolean;
    open: () => void;
}
/** Help panel plugin. `Ctrl+Alt+?`. */
export declare const help: () => ConfiguredPlugin<undefined, HelpApi>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        help: HelpApi;
    }
}
