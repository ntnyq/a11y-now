import { warn } from '@a11y-now/shared'
import type {
  LocaleCode,
  SpeechEngine,
  SpeechSpeakOptions,
} from '@a11y-now/types'

/** One utterance as seen by the remote service. */
export interface RemoteTTSContext {
  locale: LocaleCode
  rate: number
  text: string
}

export interface RemoteTTSEngineOptions {
  /** Map an utterance to the JSON request body, defaults to the context itself. */
  body?: (ctx: RemoteTTSContext) => unknown
  /**
   * Apply `rate` locally via `audio.playbackRate`, defaults to true.
   * Disable when the service renders the rate into the audio itself.
   */
  clientRate?: boolean
  /** POST target returning an audio payload (e.g. `audio/mpeg`). */
  endpoint: string
  /** Custom fetch, e.g. wrapped with auth or retries. Defaults to global fetch. */
  fetchImpl?: typeof fetch
  /** Extra request headers, e.g. `Authorization`. */
  headers?: Record<string, string>
  /** Turn a response into a playable audio URL. Defaults to a blob object-URL. */
  resolveAudio?: (response: Response) => Promise<string>
}

/** Safe for non-blob URLs and environments without `revokeObjectURL`. */
const releaseUrl = (url: string): void => {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

const defaultResolveAudio = async (response: Response): Promise<string> => {
  const blob = await response.blob()
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new TypeError('URL.createObjectURL unavailable; pass resolveAudio')
  }
  return URL.createObjectURL(blob)
}

/**
 * Reference `SpeechEngine` backed by a remote TTS HTTP service — for
 * self-hosted or cloud-vendor voices when the Web Speech API falls short
 * (the common case for zh-CN).
 *
 * Default request contract: `POST endpoint` with JSON
 * `{ text, locale, rate }`; the response body is the audio payload.
 * Adapt other vendors via `body` / `headers` / `resolveAudio`.
 *
 * ```ts
 * createA11yNow({
 *   speechEngine: createRemoteTTSEngine({ endpoint: '/api/tts' }),
 * })
 * ```
 */
export const createRemoteTTSEngine = (
  options: RemoteTTSEngineOptions,
): SpeechEngine => {
  const fetcher =
    options.fetchImpl ?? (typeof fetch === 'function' ? fetch : null)
  const hasAudio = typeof Audio !== 'undefined'
  const clientRate = options.clientRate ?? true
  const buildBody = options.body ?? ((ctx: RemoteTTSContext): unknown => ctx)
  const resolveAudio = options.resolveAudio ?? defaultResolveAudio

  let generation = 0
  let controller: AbortController | null = null
  let audio: HTMLAudioElement | null = null
  let audioUrl: string | null = null
  // Warn on the first failure only, until a playback succeeds again —
  // a dead endpoint during sequenced reading must not flood the console.
  let warned = false

  const cleanup = (): void => {
    controller?.abort()
    controller = null
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio = null
    }
    if (audioUrl) {
      releaseUrl(audioUrl)
      audioUrl = null
    }
  }

  const finishAs = (gen: number, onEnd?: (() => void) | undefined): void => {
    if (gen === generation) {
      cleanup()
      onEnd?.()
    }
  }

  const run = async (
    text: string,
    speakOptions: SpeechSpeakOptions,
    gen: number,
    signal: AbortSignal,
  ): Promise<void> => {
    if (!fetcher) {
      return
    }
    try {
      const ctx: RemoteTTSContext = {
        locale: speakOptions.locale,
        rate: speakOptions.rate,
        text,
      }
      const response = await fetcher(options.endpoint, {
        body: JSON.stringify(buildBody(ctx)),
        headers: { 'content-type': 'application/json', ...options.headers },
        method: 'POST',
        signal,
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const url = await resolveAudio(response)
      if (gen !== generation) {
        // Superseded while fetching — never played, just release.
        releaseUrl(url)
        return
      }
      audioUrl = url
      const el = new Audio(url)
      audio = el
      if (clientRate) {
        el.playbackRate = speakOptions.rate
      }
      el.addEventListener('ended', () => {
        warned = false
        finishAs(gen, speakOptions.onEnd)
      })
      el.addEventListener('error', () => {
        el.pause()
        // Report before finishing: onEnd may immediately start the next
        // utterance, which bumps the generation.
        reportFailure('audio playback error', gen)
        finishAs(gen, speakOptions.onEnd)
      })
      await el.play()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      reportFailure(error, gen)
      finishAs(gen, speakOptions.onEnd)
    }
  }

  const reportFailure = (error: unknown, gen: number): void => {
    if (gen === generation && !warned) {
      warned = true
      warn(`remote TTS failed: ${String(error)}`)
    }
  }

  const speak = (text: string, speakOptions: SpeechSpeakOptions): void => {
    generation += 1
    cleanup()
    if (!fetcher || !hasAudio || !text) {
      return
    }
    const abort = new AbortController()
    controller = abort
    // Fire-and-forget: every path inside `run` is caught and reported.
    run(text, speakOptions, generation, abort.signal)
  }

  return {
    available: fetcher !== null && hasAudio,
    cancel: () => {
      generation += 1
      cleanup()
    },
    speak,
  }
}
