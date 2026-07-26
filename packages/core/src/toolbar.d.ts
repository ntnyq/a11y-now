import type { I18nService, SpeechService, ToolbarUI } from '@a11y-now/types';
export interface ToolbarView extends ToolbarUI {
    destroy: () => void;
    readonly el: HTMLElement;
    /** Show/hide items flagged `hideInScreenReaderMode`. */
    setScreenReaderMode: (enabled: boolean) => void;
}
/**
 * Render the toolbar inside the shadow root.
 *
 * Keyboard support follows the WAI-ARIA toolbar pattern: one tab stop,
 * arrow keys move between buttons (roving tabindex), Home/End jump.
 */
export declare const createToolbar: (shadow: ShadowRoot, i18n: I18nService, speech: SpeechService) => ToolbarView;
