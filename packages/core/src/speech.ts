import { clamp } from '@a11y-now/shared'
import type {
  EventBus,
  I18nService,
  SpeechEngine,
  SpeechService,
} from '@a11y-now/types'

export const SPEECH_RATES = [1, 1.25, 1.5, 2, 2.5, 3] as const

/** Web Speech API engine. Falls back to unavailable outside browsers. */
export const createWebSpeechEngine = (): SpeechEngine => {
  const synth =
    typeof globalThis !== 'undefined' && 'speechSynthesis' in globalThis
      ? globalThis.speechSynthesis
      : null
  return {
    available: synth !== null,
    cancel: () => {
      synth?.cancel()
    },
    speak: (text, options) => {
      if (!synth || !text) {
        return
      }
      synth.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = options.locale
      utterance.rate = options.rate
      const { onEnd } = options
      if (onEnd) {
        // Fire exactly once — browsers emit `end` on completion and `error`
        // on cancellation/interruption, and some emit both.
        let done = false
        const finish = (): void => {
          if (!done) {
            done = true
            onEnd()
          }
        }
        utterance.addEventListener('end', finish)
        utterance.addEventListener('error', finish)
      }
      synth.speak(utterance)
    },
  }
}

const noop = (): void => {
  // Intentionally silent.
}

/** Silent engine used when nothing is available (e.g. happy-dom tests). */
export const createSilentEngine = (): SpeechEngine => ({
  available: false,
  cancel: noop,
  speak: (text, options) => {
    // Report instant completion so sequenced reading still drains.
    if (options.onEnd) {
      queueMicrotask(options.onEnd)
    }
  },
})

export interface SpeechCenter extends SpeechService {
  destroy: () => void
}

export const createSpeechService = (
  engine: SpeechEngine,
  events: EventBus,
  i18n: I18nService,
  initial: { enabled: boolean; rate: number },
): SpeechCenter => {
  let { enabled } = initial
  let muted = false
  let rate = clamp(initial.rate, 1, 3)

  return {
    cancel: () => {
      engine.cancel()
    },
    destroy: () => {
      engine.cancel()
    },
    getRate: () => rate,
    isEnabled: () => enabled,
    isMuted: () => muted,
    setEnabled: value => {
      enabled = value
      if (!value) {
        engine.cancel()
      }
      events.emit('speech:enabled', { enabled: value })
    },
    setMuted: value => {
      muted = value
      if (value) {
        engine.cancel()
      }
    },
    setRate: value => {
      rate = clamp(value, 1, 3)
    },
    speak: (text, options) => {
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
