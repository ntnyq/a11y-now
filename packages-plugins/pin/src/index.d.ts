import type { ConfiguredPlugin } from '@a11y-now/types';
export interface PinApi {
    isPinned: () => boolean;
    toggle: () => void;
}
interface PinState {
    pinned: boolean;
    [key: string]: boolean;
}
/** Toolbar pin plugin: reserve page space for the toolbar. `Ctrl+Alt+L`. */
export declare const pin: () => ConfiguredPlugin<undefined, PinApi, PinState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        pin: PinApi;
    }
}
export {};
