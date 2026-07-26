import type { ConfiguredPlugin } from '@a11y-now/types';
export interface BigCursorOptions {
    /** Cursor fill color; defaults to the `cursor-color` page token. */
    color?: string;
    /** Cursor size in px, defaults to 48. */
    size?: number;
}
export interface BigCursorApi {
    isEnabled: () => boolean;
    toggle: () => void;
}
interface BigCursorState {
    enabled: boolean;
    [key: string]: boolean;
}
/** Big mouse cursor plugin. `Ctrl+Alt+M`. */
export declare const bigCursor: (options?: BigCursorOptions) => ConfiguredPlugin<BigCursorOptions | undefined, BigCursorApi, BigCursorState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        'big-cursor': BigCursorApi;
    }
}
export {};
