import type { A11yTheme, ConfiguredPlugin } from '@a11y-now/types';
export interface ThemeSwitcherOptions {
    /** Theme applied on first activation, defaults to the first registered. */
    initial?: string;
}
export interface ThemeSwitcherApi {
    apply: (name: string) => void;
    current: () => A11yTheme | null;
    cycle: () => A11yTheme | null;
}
interface ThemeState {
    theme: string;
    [key: string]: string;
}
/** Color scheme switcher plugin. `Ctrl+Alt+T` cycles registered themes. */
export declare const themeSwitcher: (options?: ThemeSwitcherOptions) => ConfiguredPlugin<ThemeSwitcherOptions | undefined, ThemeSwitcherApi, ThemeState>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        theme: ThemeSwitcherApi;
    }
}
export {};
