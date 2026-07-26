import type { EventBus, I18nService, SpeechEngine, SpeechService } from '@a11y-now/types';
export declare const SPEECH_RATES: readonly [1, 1.25, 1.5, 2, 2.5, 3];
/** Web Speech API engine. Falls back to unavailable outside browsers. */
export declare const createWebSpeechEngine: () => SpeechEngine;
/** Silent engine used when nothing is available (e.g. happy-dom tests). */
export declare const createSilentEngine: () => SpeechEngine;
export interface SpeechCenter extends SpeechService {
    destroy: () => void;
}
export declare const createSpeechService: (engine: SpeechEngine, events: EventBus, i18n: I18nService, initial: {
    enabled: boolean;
    rate: number;
}) => SpeechCenter;
