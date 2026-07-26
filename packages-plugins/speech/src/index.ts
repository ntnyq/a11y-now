import {
  configurePlugin,
  definePlugin,
  SPEECH_RATES,
  speakableText,
} from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export type ReadMode = 'continuous' | 'point'

export interface SpeechPluginOptions {
  /** Max characters read in one continuous pass, defaults to 3000. */
  continuousLimit?: number
  /** Hover-read debounce in ms, defaults to 150. */
  hoverDelay?: number
}

export interface SpeechPluginApi {
  getMode: () => ReadMode
  /** Read the main page content once (continuous mode entry point). */
  readPage: () => void
  setMode: (mode: ReadMode) => void
  toggleVoice: () => void
}

interface SpeechState {
  enabled: boolean
  mode: string
  rate: number
  [key: string]: boolean | number | string
}

const ICON_VOICE =
  '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-9v2a7 7 0 0 1 0 14v2a9 9 0 0 0 0-18Z"/></svg>'
const ICON_RATE =
  '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 4v6l4.5 2.7.8-1.3-3.8-2.3V6H13Z"/></svg>'
const ICON_MODE =
  '<svg viewBox="0 0 24 24"><path d="M9 2a2 2 0 0 0-2 2v8.6l-1.3-1.3a2 2 0 1 0-2.8 2.8L8.5 20H17l3-7V9a2 2 0 0 0-2-2h-1V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Z"/></svg>'

const speechPlugin = definePlugin<
  SpeechPluginOptions | undefined,
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
      'speech.voice': '声音开关',
      'speech.voice.off': '当前声音已关闭，开启声音 {shortcut}',
      'speech.voice.on': '当前声音已开启，关闭声音 {shortcut}',
    },
  },
  name: 'speech',
  setup: ctx => {
    const hoverDelay = ctx.options?.hoverDelay ?? 150
    const continuousLimit = ctx.options?.continuousLimit ?? 3000
    const shortcut = (key: string): string =>
      ctx.shortcuts.format({ alt: true, ctrl: true, key })

    // --- restore persisted state into the kernel speech service
    ctx.speech.setEnabled(ctx.state.get('enabled') as boolean)
    ctx.speech.setRate(ctx.state.get('rate') as number)

    // --- voice toggle
    const voiceDesc = (): string =>
      ctx.i18n.t(
        ctx.speech.isEnabled() ? 'speech.voice.on' : 'speech.voice.off',
        { shortcut: shortcut('v') },
      )
    const toggleVoice = (): void => {
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
    const rateDesc = (): string =>
      ctx.i18n.t('speech.rate.desc', {
        rate: ctx.speech.getRate(),
        shortcut: shortcut('k'),
      })
    const cycleRate = (): void => {
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
    const getMode = (): ReadMode =>
      ctx.state.get('mode') === 'continuous' ? 'continuous' : 'point'
    const modeDesc = (): string =>
      ctx.i18n.t(
        getMode() === 'point' ? 'speech.mode.point' : 'speech.mode.continuous',
        { shortcut: shortcut('f') },
      )

    let hoverTimer: ReturnType<typeof setTimeout> | null = null
    let lastSpoken: Element | null = null
    const onHover = (event: MouseEvent): void => {
      if (getMode() !== 'point' || !ctx.speech.isEnabled()) {
        return
      }
      const target = event.target as Element | null
      if (!target || target.closest('a11y-now-host')) {
        return
      }
      const el = target.closest('a, button, [role], h1, h2, h3, h4, p, li, label, input, td, th') ?? target
      if (el === lastSpoken) {
        return
      }
      if (hoverTimer) {
        clearTimeout(hoverTimer)
      }
      hoverTimer = setTimeout(() => {
        lastSpoken = el
        const text = speakableText(el)
        if (text) {
          ctx.speech.speak(text)
        }
      }, hoverDelay)
    }
    document.addEventListener('mouseover', onHover, true)

    const readPage = (): void => {
      const root =
        document.querySelector('main, article, [role="main"]') ?? document.body
      const text = speakableText(root).slice(0, continuousLimit)
      if (text) {
        ctx.speech.speak(text)
      }
    }

    const setMode = (mode: ReadMode): void => {
      ctx.state.set('mode', mode)
      modeBtn.update({ description: modeDesc })
      ctx.ui.announce(modeDesc())
      if (mode === 'continuous') {
        readPage()
      } else {
        ctx.speech.cancel()
      }
    }
    const toggleMode = (): void => {
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
        readPage,
        setMode,
        toggleVoice,
      },
      dispose: () => {
        document.removeEventListener('mouseover', onHover, true)
        if (hoverTimer) {
          clearTimeout(hoverTimer)
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

/** Self-voicing plugin: voice toggle, rate and read mode. */
export const speech = (
  options?: SpeechPluginOptions,
): ConfiguredPlugin<
  SpeechPluginOptions | undefined,
  SpeechPluginApi,
  SpeechState
> => configurePlugin(speechPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    speech: SpeechPluginApi
  }
}
