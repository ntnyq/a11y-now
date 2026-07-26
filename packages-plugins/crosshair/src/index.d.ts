import type { ConfiguredPlugin } from '@a11y-now/types';
export interface CrosshairOptions {
    /** Line thickness in px, defaults to 2. */
    thickness?: number;
}
export interface CrosshairApi {
    isEnabled: () => boolean;
    toggle: () => void;
}
interface CrosshairState {
    enabled: boolean;
    [key: string]: boolean;
}
/** Reading crosshair plugin. `Ctrl+Alt+N`. */
export declare const crosshair: (options?: CrosshairOptions) => ConfiguredPlugin<CrosshairOptions | undefined, CrosshairApi, CrosshairState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        crosshair: CrosshairApi;
    }
}
export {};
