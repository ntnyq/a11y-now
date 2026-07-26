import type { ConfiguredPlugin } from '@a11y-now/types';
export type ReadMode = 'continuous' | 'point';
export interface SpeechPluginOptions {
    /** Max characters read in one continuous pass, defaults to 3000. */
    continuousLimit?: number;
    /** Hover-read debounce in ms, defaults to 150. */
    hoverDelay?: number;
}
export interface SpeechPluginApi {
    getMode: () => ReadMode;
    /** Read the main page content once (continuous mode entry point). */
    readPage: () => void;
    setMode: (mode: ReadMode) => void;
    toggleVoice: () => void;
}
interface SpeechState {
    enabled: boolean;
    mode: string;
    rate: number;
    [key: string]: boolean | number | string;
}
/** Self-voicing plugin: voice toggle, rate and read mode. */
export declare const speech: (options?: SpeechPluginOptions) => ConfiguredPlugin<SpeechPluginOptions | undefined, SpeechPluginApi, SpeechState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        speech: SpeechPluginApi;
    }
}
export {};
