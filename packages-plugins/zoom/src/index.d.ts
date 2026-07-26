import type { ConfiguredPlugin } from '@a11y-now/types';
export interface ZoomOptions {
    /** Maximum page zoom, defaults to 1.3 (mirrors the audited reference). */
    max?: number;
    /** Minimum page zoom, defaults to 1. */
    min?: number;
    /** Zoom step, defaults to 0.1. */
    step?: number;
}
export interface ZoomApi {
    getScale: () => number;
    setScale: (scale: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
}
interface ZoomState {
    scale: number;
    [key: string]: number;
}
/** Page zoom plugin. `Ctrl+Alt+=` / `Ctrl+Alt+-`. */
export declare const zoom: (options?: ZoomOptions) => ConfiguredPlugin<ZoomOptions | undefined, ZoomApi, ZoomState>;
declare module '@a11y-now/types' {
    interface A11yEventMap {
        'zoom:change': {
            scale: number;
        };
    }
    interface A11yPluginRegistry {
        zoom: ZoomApi;
    }
}
export {};
