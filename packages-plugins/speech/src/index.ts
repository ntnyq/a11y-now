import { configurePlugin, definePlugin, SPEECH_RATES } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'
import {
  createContinuousReading,
  createHoverReading,
  DEFAULT_SEGMENT_SELECTOR,
} from './reading'

export type ReadMode = 'continuous' | 'point'

export interface SpeechPluginOptions {
  /**
   * Max total characters enqueued per continuous pass.
   * `0` (the default) reads the whole page — the queue can be stopped at
   * any time, so no hard cap is needed.
   *
   * @default 0
   */
  continuousLimit?: number
  /**
   * Hover-read debounce in ms, defaults to 150.
   *
   * @default 150
   */
  hoverDelay?: number
  /**
   * Scroll the segment being read into view, defaults to true.
   *
   * @default true
   */
  scrollIntoView?: boolean
  /**
   * Block-level selector used to split the page into read segments.
   *
   * @default DEFAULT_SEGMENT_SELECTOR
   */
  segmentSelector?: string
}

export interface SpeechPluginApi {
  /**
   * Read the current page-reading mode.
   *
   * @returns The active point or continuous reading mode.
   */
  getMode: () => ReadMode
  /**
   * Is a continuous pass currently in progress?
   *
   * @returns `true` while the reading queue is active.
   */
  isReading: () => boolean
  /**
   * Read the main page content segment by segment (continuous entry point).
   */
  readPage: () => void
  /**
   * Persist the reading mode, starting a page pass in continuous mode
   * or stopping it when switching to point mode.
   *
   * @param mode - Point reading for hover speech or continuous reading for a
   *   page pass.
   */
  setMode: (mode: ReadMode) => void
  /**
   * Stop the current continuous pass, if any.
   */
  stopReading: () => void
  /**
   * Toggle and persist speech enablement, stopping continuous reading when
   * disabled.
   */
  toggleVoice: () => void
}

interface SpeechState {
  /**
   * Whether ordinary speech requests are enabled.
   *
   * @default true
   */
  enabled: boolean
  /**
   * Persisted point or continuous page-reading mode.
   *
   * @default 'point'
   */
  mode: string
  /**
   * Persisted speech playback speed multiplier.
   *
   * @default 1
   */
  rate: number
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: boolean | number | string
}

/**
 * Inline SVG for the page-reading mode button.
 */
const ICON_MODE =
  '<svg viewBox="0 0 24 24"><path d="M9 2a2 2 0 0 0-2 2v8.6l-1.3-1.3a2 2 0 1 0-2.8 2.8L8.5 20H17l3-7V9a2 2 0 0 0-2-2h-1V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Z"/></svg>'
/**
 * Inline SVG for the speech playback rate button.
 */
const ICON_RATE =
  '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 4v6l4.5 2.7.8-1.3-3.8-2.3V6H13Z"/></svg>'
/**
 * Inline SVG for the speech enablement button.
 */
const ICON_VOICE =
  '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-9v2a7 7 0 0 1 0 14v2a9 9 0 0 0 0-18Z"/></svg>'

const speechPlugin = definePlugin<
  SpeechPluginOptions,
  SpeechPluginApi,
  SpeechState
>({
  messages: {
    'en-US': {
      'speech.mode': 'Read mode',
      'speech.mode.continuous': 'Continuous reading, switch with {shortcut}',
      'speech.mode.point': 'Point reading, switch with {shortcut}',
      'speech.rate': 'Rate',
      'speech.rate.desc': 'Current rate {rate}x, adjust with {shortcut}',
      'speech.reading.done': 'Finished reading the page',
      'speech.voice': 'Voice',
      'speech.voice.off': 'Voice is off, enable with {shortcut}',
      'speech.voice.on': 'Voice is on, disable with {shortcut}',
    },
    'zh-CN': {
      'speech.mode': '阅读方式',
      'speech.mode.continuous': '当前为连读，切换阅读方式 {shortcut}',
      'speech.mode.point': '当前为指读，切换阅读方式 {shortcut}',
      'speech.rate': '语速',
      'speech.rate.desc': '当前语速为 {rate} 倍，调节语速 {shortcut}',
      'speech.reading.done': '本页内容朗读完毕',
      'speech.voice': '声音开关',
      'speech.voice.off': '当前声音已关闭，开启声音 {shortcut}',
      'speech.voice.on': '当前声音已开启，关闭声音 {shortcut}',
    },
  },
  name: 'speech',
  setup(ctx) {
    const hoverDelay = ctx.options.hoverDelay ?? 150
    function shortcut(key: string): string {
      return ctx.shortcuts.format({ alt: true, ctrl: true, key })
    }

    // --- restore persisted state into the kernel speech service
    ctx.speech.setEnabled(ctx.state.get('enabled') as boolean)
    ctx.speech.setRate(ctx.state.get('rate') as number)

    // --- voice toggle
    function voiceDesc(): string {
      return ctx.i18n.t(
        ctx.speech.isEnabled() ? 'speech.voice.on' : 'speech.voice.off',
        { shortcut: shortcut('v') },
      )
    }
    function toggleVoice(): void {
      const next = !ctx.speech.isEnabled()
      ctx.speech.setEnabled(next)
      ctx.state.set('enabled', next)
      voiceBtn.update({ description: voiceDesc, pressed: next })
      ctx.ui.announce(voiceDesc())
    }
    const voiceBtn = ctx.ui.addItem({
      description: voiceDesc,
      group: 'tool',
      icon: ICON_VOICE,
      id: 'speech-voice',
      label: () => ctx.i18n.t('speech.voice'),
      onPress: toggleVoice,
      order: 20,
      pressed: ctx.speech.isEnabled(),
    })

    // --- rate cycling
    function rateDesc(): string {
      return ctx.i18n.t('speech.rate.desc', {
        rate: ctx.speech.getRate(),
        shortcut: shortcut('k'),
      })
    }
    function cycleRate(): void {
      const rates = [...SPEECH_RATES]
      const index = rates.indexOf(ctx.speech.getRate() as 1)
      const next = rates[(index + 1) % rates.length] as number
      ctx.speech.setRate(next)
      ctx.state.set('rate', next)
      rateBtn.update({ description: rateDesc })
      ctx.ui.announce(rateDesc())
    }
    const rateBtn = ctx.ui.addItem({
      description: rateDesc,
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON_RATE,
      id: 'speech-rate',
      label: () => ctx.i18n.t('speech.rate'),
      onPress: cycleRate,
      order: 21,
    })

    // --- read mode (point = hover reading, continuous = read the page)
    function getMode(): ReadMode {
      return ctx.state.get('mode') === 'continuous' ? 'continuous' : 'point'
    }
    function modeDesc(): string {
      return ctx.i18n.t(
        getMode() === 'point' ? 'speech.mode.point' : 'speech.mode.continuous',
        { shortcut: shortcut('f') },
      )
    }

    const disposeHover = createHoverReading(ctx, {
      delay: hoverDelay,
      isActive: () => getMode() === 'point',
    })

    // --- continuous reading: segment queue with progress highlight
    const reading = createContinuousReading(ctx, {
      limit: ctx.options.continuousLimit ?? 0,
      onDone() {
        ctx.ui.announce(ctx.i18n.t('speech.reading.done'))
      },
      scroll: ctx.options.scrollIntoView ?? true,
      selector: ctx.options.segmentSelector ?? DEFAULT_SEGMENT_SELECTOR,
    })

    function setMode(mode: ReadMode): void {
      ctx.state.set('mode', mode)
      modeBtn.update({ description: modeDesc })
      ctx.ui.announce(modeDesc())
      if (mode === 'continuous') {
        reading.readPage()
      }
    }
    function toggleMode(): void {
      setMode(getMode() === 'point' ? 'continuous' : 'point')
    }
    const modeBtn = ctx.ui.addItem({
      description: modeDesc,
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON_MODE,
      id: 'speech-mode',
      label: () => ctx.i18n.t('speech.mode'),
      onPress: toggleMode,
      order: 22,
    })

    const stoppers = [
      ctx.events.on('state:reset', () => {
        ctx.speech.setEnabled(ctx.state.get('enabled'))
        ctx.speech.setRate(ctx.state.get('rate'))
        voiceBtn.update({
          description: voiceDesc,
          pressed: ctx.speech.isEnabled(),
        })
        rateBtn.update({ description: rateDesc })
        modeBtn.update({ description: modeDesc })
      }),
      // Leaving continuous mode (including a state reset) ends the pass.
      ctx.state.subscribe((key, value) => {
        if (key === 'mode' && value !== 'continuous') {
          reading.stopReading()
        }
      }),
      ctx.events.on('speech:enabled', ({ enabled }) => {
        if (!enabled) {
          reading.stopReading()
        }
      }),
      ctx.events.on('screen-reader:change', ({ enabled }) => {
        if (enabled) {
          reading.stopReading()
        }
      }),
    ]

    const unregisters = [
      ctx.shortcuts.register({
        alt: true,
        ctrl: true,
        description: () => ctx.i18n.t('speech.voice'),
        handler: toggleVoice,
        id: 'speech-voice',
        key: 'v',
      }),
      ctx.shortcuts.register({
        alt: true,
        ctrl: true,
        description: () => ctx.i18n.t('speech.rate'),
        handler: cycleRate,
        id: 'speech-rate',
        key: 'k',
      }),
      ctx.shortcuts.register({
        alt: true,
        ctrl: true,
        description: () => ctx.i18n.t('speech.mode'),
        handler: toggleMode,
        id: 'speech-mode',
        key: 'f',
      }),
    ]

    return {
      api: {
        getMode,
        isReading: reading.isReading,
        readPage: reading.readPage,
        setMode,
        stopReading: reading.stopReading,
        toggleVoice,
      },
      dispose() {
        reading.stopReading()
        disposeHover()
        for (const stop of stoppers) {
          stop()
        }
        for (const unregister of unregisters) {
          unregister()
        }
        voiceBtn.remove()
        rateBtn.remove()
        modeBtn.remove()
        ctx.speech.cancel()
      },
    }
  },
  state: { enabled: true, mode: 'point', rate: 1 },
})

/**
 * Self-voicing plugin: voice toggle, rate and read mode.
 *
 * @param options - Hover delay, character limit, scrolling, and segment
 *   selection.
 * @returns A configured speech plugin for toolbar registration.
 */
export function speech(
  options: SpeechPluginOptions = {},
): ConfiguredPlugin<SpeechPluginOptions, SpeechPluginApi, SpeechState> {
  return configurePlugin(speechPlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yEventMap {
    /**
     * Continuous reading progress, one per spoken segment.
     */
    'speech:reading': {
      /**
       * Zero-based position of the segment currently being spoken.
       */
      index: number
      /**
       * Number of segments in the current reading pass.
       */
      total: number
    }
    /**
     * A continuous pass finished or was stopped.
     */
    'speech:reading-end': Record<string, never>
  }
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the speech plugin after activation.
     */
    speech: SpeechPluginApi
  }
}
