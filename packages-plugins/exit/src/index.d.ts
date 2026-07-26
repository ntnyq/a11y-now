import type { ConfiguredPlugin } from '@a11y-now/types';
export interface ExitApi {
    exit: () => void;
}
interface ExitState {
    disabled: boolean;
    [key: string]: boolean;
}
/** Exit plugin: unmounts the toolbar and remembers the choice. `Ctrl+Alt+E`. */
export declare const exit: () => ConfiguredPlugin<undefined, ExitApi, ExitState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        exit: ExitApi;
    }
}
export {};
