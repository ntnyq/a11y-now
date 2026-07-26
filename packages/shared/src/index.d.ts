import type { ShortcutDef } from '@a11y-now/types';
/** Tagged template for CSS-in-TS. Exists for editor highlighting only. */
export declare const css: (strings: TemplateStringsArray, ...values: Array<number | string>) => string;
export declare const clamp: (value: number, min: number, max: number) => number;
/** Round to 2 decimals to avoid float drift in zoom steps. */
export declare const round2: (value: number) => number;
export declare const isBrowser: () => boolean;
export declare const warn: (message: string) => void;
/**
 * Normalize a shortcut to a stable id, e.g. `ctrl+alt+t`.
 * Used for both registration keys and conflict detection.
 */
export declare const normalizeShortcut: (def: ShortcutDef) => string;
/** Format a shortcut for humans, e.g. `Ctrl+Alt+T`. */
export declare const formatShortcut: (def: ShortcutDef) => string;
/** Does a keyboard event match a shortcut definition? */
export declare const matchShortcut: (event: KeyboardEvent, def: ShortcutDef) => boolean;
/** Resolve a `string | (() => string)` label. */
export declare const resolveLabel: (label: string | (() => string) | undefined) => string;
/** Interpolate `{name}` placeholders. */
export declare const interpolate: (template: string, params?: Record<string, number | string>) => string;
/** Readable text of an element for speech, trimmed and collapsed. */
export declare const speakableText: (el: Element) => string;
