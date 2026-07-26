import type { ConfiguredPlugin } from '@a11y-now/types';
export interface ScreenReaderApi {
    isEnabled: () => boolean;
    toggle: () => void;
}
interface ScreenReaderState {
    enabled: boolean;
    [key: string]: boolean;
}
/** Screen-reader mode plugin. `Ctrl+Alt+R`. */
export declare const screenReader: () => ConfiguredPlugin<undefined, ScreenReaderApi, ScreenReaderState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        'screen-reader': ScreenReaderApi;
    }
}
export {};
