import type { PageTokens, ToolbarTokens } from '@a11y-now/types';
/** Toolbar UI token defaults — the toolbar half of `theme-default`. */
export declare const DEFAULT_TOOLBAR_TOKENS: ToolbarTokens;
/** Page token defaults, aligned with the audited reference toolbar. */
export declare const DEFAULT_PAGE_TOKENS: PageTokens;
export declare const TOOLBAR_TOKEN_PREFIX = "--a11y-";
export declare const PAGE_TOKEN_PREFIX = "--a11y-page-";
export declare const toolbarVar: (key: keyof ToolbarTokens) => string;
export declare const pageVar: (key: keyof PageTokens) => string;
/** Selectors always excluded from page re-coloring. */
export declare const GLOBAL_SKIP_SELECTORS: string[];
