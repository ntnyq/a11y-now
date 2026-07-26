import type { DomService, EventBus, ThemeService } from '@a11y-now/types';
export interface ThemeCenter extends ThemeService {
    /** Bind the shadow host once the toolbar is mounted. */
    attach: (host: HTMLElement) => void;
    destroy: () => void;
}
/**
 * Theme switching is a pure CSS-variable operation:
 * toolbar tokens go to the shadow `:host` inline style, page tokens go to
 * `document.documentElement` — no stylesheet is ever rebuilt, which is the
 * deliberate improvement over the audited reference implementation
 * (it regenerates 100 KB+ of override styles per switch).
 */
export declare const createThemeService: (dom: DomService, events: EventBus, doc: Document) => ThemeCenter;
