import { clamp, configurePlugin, definePlugin, round2 } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface ZoomOptions {
  /** Maximum page zoom, defaults to 1.3 (mirrors the audited reference). */
  max?: number
  /** Minimum page zoom, defaults to 1. */
  min?: number
  /** Zoom step, defaults to 0.1. */
  step?: number
}

export interface ZoomApi {
  getScale: () => number
  setScale: (scale: number) => void
  zoomIn: () => void
  zoomOut: () => void
}

interface ZoomState {
  scale: number
  [key: string]: number
}

const ICON_IN =
  '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm-1 3v2H7v2h2v2h2v-2h2V9h-2V7H9Z"/></svg>'
const ICON_OUT =
  '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM7 9v2h6V9H7Z"/></svg>'

const zoomPlugin = definePlugin<ZoomOptions, ZoomApi, ZoomState>({
  messages: {
    'en-US': {
      'zoom.current': 'Current page zoom {scale}x',
      'zoom.in': 'Zoom in',
      'zoom.in.desc': 'Zoom the page in, {shortcut}',
      'zoom.max': 'Maximum page zoom reached',
      'zoom.min': 'Minimum page zoom reached',
      'zoom.out': 'Zoom out',
      'zoom.out.desc': 'Zoom the page out, {shortcut}',
    },
    'zh-CN': {
      'zoom.current': '当前网页缩放倍数为 {scale} 倍',
      'zoom.in': '放大',
      'zoom.in.desc': '网页放大，{shortcut}',
      'zoom.max': '网页放大倍数已达到允许最大倍数',
      'zoom.min': '网页缩小倍数已达到允许最小倍数',
      'zoom.out': '缩小',
      'zoom.out.desc': '网页缩小，{shortcut}',
    },
  },
  name: 'zoom',
  setup: ctx => {
    const min = ctx.options.min ?? 1
    const max = ctx.options.max ?? 1.3
    const step = ctx.options.step ?? 0.1
    let disposeStyle: (() => void) | null = null

    const apply = (scale: number): void => {
      if (scale === 1) {
        disposeStyle?.()
        disposeStyle = null
        return
      }
      // The toolbar host lives outside <body>, so unlike the audited
      // reference no `.noscale` counter-zoom is needed.
      disposeStyle = ctx.dom.injectStyle(
        'zoom',
        `body { zoom: ${scale} !important; }`,
      )
    }

    const describe = (key: 'zoom.in.desc' | 'zoom.out.desc'): string => {
      const shortcutKey = key === 'zoom.in.desc' ? '=' : '-'
      return `${ctx.i18n.t('zoom.current', { scale: ctx.state.get('scale') })}，${ctx.i18n.t(
        key,
        {
          shortcut: ctx.shortcuts.format({
            alt: true,
            ctrl: true,
            key: shortcutKey,
          }),
        },
      )}`
    }

    const setScale = (next: number): void => {
      const clamped = round2(clamp(next, min, max))
      const current = ctx.state.get('scale')
      if (clamped === current) {
        ctx.ui.announce(ctx.i18n.t(next > current ? 'zoom.max' : 'zoom.min'))
        return
      }
      ctx.state.set('scale', clamped)
      apply(clamped)
      inBtn.update({ description: () => describe('zoom.in.desc') })
      outBtn.update({ description: () => describe('zoom.out.desc') })
      ctx.events.emit('zoom:change', { scale: clamped })
      ctx.ui.announce(ctx.i18n.t('zoom.current', { scale: clamped }))
    }

    const zoomIn = (): void => {
      setScale(ctx.state.get('scale') + step)
    }
    const zoomOut = (): void => {
      setScale(ctx.state.get('scale') - step)
    }

    const inBtn = ctx.ui.addItem({
      description: () => describe('zoom.in.desc'),
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON_IN,
      id: 'zoom-in',
      label: () => ctx.i18n.t('zoom.in'),
      onPress: zoomIn,
      order: 40,
    })
    const outBtn = ctx.ui.addItem({
      description: () => describe('zoom.out.desc'),
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON_OUT,
      id: 'zoom-out',
      label: () => ctx.i18n.t('zoom.out'),
      onPress: zoomOut,
      order: 41,
    })

    const unregisterIn = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('zoom.in'),
      handler: zoomIn,
      id: 'zoom-in',
      key: '=',
    })
    const unregisterOut = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('zoom.out'),
      handler: zoomOut,
      id: 'zoom-out',
      key: '-',
    })

    // Restore persisted zoom.
    const persisted = ctx.state.get('scale')
    if (persisted !== 1) {
      apply(persisted)
    }
    const stopState = ctx.state.subscribe((key, value) => {
      if (key === 'scale') {
        apply(value as number)
      }
    })

    return {
      api: {
        getScale: () => ctx.state.get('scale'),
        setScale,
        zoomIn,
        zoomOut,
      },
      dispose: () => {
        stopState()
        unregisterIn()
        unregisterOut()
        inBtn.remove()
        outBtn.remove()
        disposeStyle?.()
      },
    }
  },
  state: { scale: 1 },
})

/** Page zoom plugin. `Ctrl+Alt+=` / `Ctrl+Alt+-`. */
export const zoom = (
  options: ZoomOptions = {},
): ConfiguredPlugin<ZoomOptions, ZoomApi, ZoomState> =>
  configurePlugin(zoomPlugin, options)

declare module '@a11y-now/types' {
  interface A11yEventMap {
    'zoom:change': { scale: number }
  }
  interface A11yPluginRegistry {
    zoom: ZoomApi
  }
}
