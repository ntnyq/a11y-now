import { clamp } from '@a11y-now/shared'
import type {
  EventBus,
  I18nService,
  SpeechEngine,
  SpeechService,
} from '@a11y-now/types'

/**
 * Playback speed multipliers cycled by the speech rate control.
 */
export const SPEECH_RATES = [1, 1.25, 1.5, 2, 2.5, 3] as const

/**
 * Web Speech API engine. Falls back to unavailable outside browsers.
 *
 * @returns A speech engine whose availability reflects the global speech
 *   synthesis API.
 */
export function createWebSpeechEngine(): SpeechEngine {
  const synth =
    typeof globalThis !== 'undefined' && 'speechSynthesis' in globalThis
      ? globalThis.speechSynthesis
      : null
  return {
    available: synth !== null,
    cancel() {
      synth?.cancel()
    },
    speak(text, options) {
      if (!synth || !text) {
        return
      }
      synth.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = options.locale
      utterance.rate = options.rate
      const { onEnd } = options
      // Fire exactly once — browsers emit `end` on completion and `error`
      // on cancellation/interruption, and some emit both.
      let done = false
      function finish(): void {
        if (!done) {
          done = true
          onEnd?.()
        }
      }
      if (onEnd) {
        utterance.addEventListener('end', finish)
        utterance.addEventListener('error', finish)
      }
      synth.speak(utterance)
    },
  }
}

function noop(): void {
  // Intentionally silent.
}

/**
 * Silent engine used when nothing is available (e.g. happy-dom tests).
 *
 * @returns An unavailable engine that completes queued utterances silently in a
 *   microtask.
 */
export function createSilentEngine(): SpeechEngine {
  return {
    available: false,
    cancel: noop,
    speak(text, options) {
      // Report instant completion so sequenced reading still drains.
      if (options.onEnd) {
        queueMicrotask(options.onEnd)
      }
    },
  }
}

export interface SpeechCenter extends SpeechService {
  /**
   * Cancel speech playback through the configured backend.
   */
  destroy: () => void
}

/**
 * Create speech controls with enablement, muting, and rate limits.
 *
 * @param engine - Backend responsible for speaking and cancelling utterances.
 * @param events - Bus receiving speech and enablement notifications.
 * @param i18n - Translation service supplying the current speech locale.
 * @param initial - Initial enabled flag and rate, clamped to the range 1
 *   through 3.
 * @returns Speech controls with a cleanup method that cancels playback.
 */
export function createSpeechService(
  engine: SpeechEngine,
  events: EventBus,
  i18n: I18nService,
  initial: { enabled: boolean; rate: number },
): SpeechCenter {
  let { enabled } = initial
  let muted = false
  let rate = clamp(initial.rate, 1, 3)

  return {
    cancel() {
      engine.cancel()
    },
    destroy() {
      engine.cancel()
    },
    getRate: () => rate,
    isEnabled: () => enabled,
    isMuted: () => muted,
    setEnabled(value) {
      enabled = value
      if (!value) {
        engine.cancel()
      }
      events.emit('speech:enabled', { enabled: value })
    },
    setMuted(value) {
      muted = value
      if (value) {
        engine.cancel()
      }
    },
    setRate(value) {
      rate = clamp(value, 1, 3)
    },
    speak(text, options) {
      if (muted || !text) {
        return
      }
      if (!enabled && !options?.force) {
        return
      }
      events.emit('speech:speak', { text })
      engine.speak(text, {
        locale: i18n.getLocale(),
        onEnd: options?.onEnd,
        rate,
      })
    },
  }
}
