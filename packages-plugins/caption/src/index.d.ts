import type { ConfiguredPlugin } from '@a11y-now/types';
export interface CaptionApi {
    isEnabled: () => boolean;
    toggle: () => void;
}
interface CaptionState {
    enabled: boolean;
    [key: string]: boolean;
}
/** Big caption bar plugin: mirrors spoken text at the bottom. `Ctrl+Alt+B`. */
export declare const caption: () => ConfiguredPlugin<undefined, CaptionApi, CaptionState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        caption: CaptionApi;
    }
}
export {};
