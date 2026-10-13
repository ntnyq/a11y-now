import { css, pageVar, speakableText } from '@a11y-now/core'
import type { PluginContext } from '@a11y-now/types'

/**
 * Interactive and text elements treated as hover-reading targets.
 */
const HOVER_TARGET_SELECTOR =
  'a, button, [role], h1, h2, h3, h4, p, li, label, input, td, th'

/**
 * Point reading: debounced hover speech over interactive/text elements.
 * Returns a dispose function.
 *
 * @param ctx - Plugin context supplying the speech service.
 * @param config - Hover debounce delay in milliseconds and active-mode
 *   predicate.
 * @returns A disposer that removes the hover listener and cancels the pending
 *   timer.
 */
export function createHoverReading(
  ctx: Pick<PluginContext, 'speech'>,
  config: { delay: number; isActive: () => boolean },
): () => void {
  let lastSpoken: Element | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  function onHover(event: MouseEvent): void {
    if (!config.isActive() || !ctx.speech.isEnabled()) {
      return
    }
    const target = event.target as Element | null
    if (!target || target.closest('a11y-now-host')) {
      return
    }
    const el = target.closest(HOVER_TARGET_SELECTOR) ?? target
    if (el === lastSpoken) {
      return
    }
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      lastSpoken = el
      const text = speakableText(el)
      if (text) {
        ctx.speech.speak(text)
      }
    }, config.delay)
  }
  document.addEventListener('mouseover', onHover, true)
  return () => {
    document.removeEventListener('mouseover', onHover, true)
    if (timer) {
      clearTimeout(timer)
    }
  }
}

export interface ContinuousReadingConfig {
  /**
   * Max total characters enqueued per pass, `0` = unlimited.
   */
  limit: number
  /**
   * Announce the natural end of a pass.
   */
  onDone: () => void
  /**
   * Scroll the segment being read into view.
   */
  scroll: boolean
  /**
   * Block-level selector used to split the page into read segments.
   */
  selector: string
}

export interface ContinuousReading {
  /**
   * Check whether a continuous reading pass is in progress.
   *
   * @returns `true` while the reading queue is active.
   */
  isReading: () => boolean
  /**
   * Start a new pass through main page content when speech is enabled and
   * unmuted.
   */
  readPage: () => void
  /**
   * Stop the current pass, cancel speech, and remove reading highlights.
   */
  stopReading: () => void
}

interface ReadSegment {
  /**
   * Page element highlighted while this segment is spoken.
   */
  el: Element
  /**
   * Speakable text queued for this page segment.
   */
  text: string
}

/**
 * Default block elements collected as continuous-reading segments.
 */
export const DEFAULT_SEGMENT_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, caption, th, td, pre, summary'

/**
 * Attribute marking the page segment currently being spoken.
 */
const READING_ATTR = 'data-a11y-reading'

/**
 * Page stylesheet outlining the active continuous-reading segment.
 */
const HIGHLIGHT_STYLE = css`
  [${READING_ATTR}] {
    outline: var(${pageVar('region-outline')}, 2px solid #ff6c00) !important;
    outline-offset: 2px !important;
  }
`

/**
 * Continuous reading as a segment queue: one leaf block element per
 * utterance, advanced by the engine's `onEnd` callback, with the current
 * segment highlighted via `data-a11y-reading`.
 *
 * @param ctx - Plugin services for highlighting, events, and speech playback.
 * @param config - Segment selection, character limit, scrolling, and completion
 *   callback.
 * @returns Controls for starting, inspecting, and stopping continuous page
 *   reading.
 */
export function createContinuousReading(
  ctx: Pick<PluginContext, 'dom' | 'events' | 'speech'>,
  config: ContinuousReadingConfig,
): ContinuousReading {
  let generation = 0
  let queue: ReadSegment[] = []
  let index = -1
  let disposeStyle: (() => void) | null = null

  function collectSegments(root: Element): ReadSegment[] {
    const segments: ReadSegment[] = []
    let total = 0
    function push(el: Element, text: string): boolean {
      const clipped =
        config.limit > 0 ? text.slice(0, config.limit - total) : text
      if (!clipped) {
        return false
      }
      total += clipped.length
      segments.push({ el, text: clipped })
      return config.limit <= 0 || total < config.limit
    }
    for (const el of root.querySelectorAll(config.selector)) {
      // Leaf blocks only — a <li> wrapping a <p> yields just the <p>.
      const leaf =
        !el.querySelector(config.selector) &&
        !el.closest('[hidden], [aria-hidden="true"], [data-a11y-skip]')
      if (leaf) {
        const text = speakableText(el)
        if (text && !push(el, text)) {
          break
        }
      }
    }
    if (segments.length === 0) {
      const text = speakableText(root)
      if (text) {
        push(root, text)
      }
    }
    return segments
  }

  function isReading(): boolean {
    return index >= 0
  }

  function highlight(el: Element): void {
    clearHighlight()
    el.setAttribute(READING_ATTR, 'true')
    if (config.scroll && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function cleanup(): void {
    generation += 1
    queue = []
    index = -1
    clearHighlight()
    disposeStyle?.()
    disposeStyle = null
  }

  function stopReading(): void {
    if (!isReading()) {
      return
    }
    cleanup()
    ctx.speech.cancel()
    ctx.events.emit('speech:reading-end', {})
  }

  function speakNext(): void {
    index += 1
    const segment = queue[index]
    if (!segment) {
      // Natural end of the queue.
      cleanup()
      ctx.events.emit('speech:reading-end', {})
      config.onDone()
      return
    }
    highlight(segment.el)
    ctx.events.emit('speech:reading', { index, total: queue.length })
    const gen = generation
    ctx.speech.speak(segment.text, {
      onEnd() {
        if (gen === generation) {
          speakNext()
        }
      },
    })
  }

  function readPage(): void {
    stopReading()
    if (!ctx.speech.isEnabled() || ctx.speech.isMuted()) {
      return
    }
    const root =
      document.querySelector('main, article, [role="main"]') ?? document.body
    queue = collectSegments(root)
    if (queue.length === 0) {
      return
    }
    disposeStyle = ctx.dom.injectStyle('speech-reading', HIGHLIGHT_STYLE)
    speakNext()
  }

  return { isReading, readPage, stopReading }
}

function clearHighlight(): void {
  document.querySelector(`[${READING_ATTR}]`)?.removeAttribute(READING_ATTR)
}
