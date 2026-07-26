import type { ShortcutService } from '@a11y-now/types';
export interface ShortcutCenter extends ShortcutService {
    destroy: () => void;
    setEnabled: (enabled: boolean) => void;
}
/**
 * Central keyboard shortcut registry with conflict detection.
 * Listens on `window` in the capture phase so page handlers cannot
 * swallow accessibility shortcuts.
 */
export declare const createShortcutCenter: () => ShortcutCenter;
