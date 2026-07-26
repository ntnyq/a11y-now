import { configurePlugin, css, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface PauseMotionOptions {
  /** Also freeze GIF images onto a first-frame canvas snapshot. Default true. */
  freezeGifs?: boolean
}

export interface PauseMotionApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface PauseMotionState {
  enabled: boolean
  [key: string]: boolean
}

const SKIP = ':not([data-a11y-skip], [data-a11y-skip] *)'

const resumeVideo = async (video: HTMLVideoElement): Promise<void> => {
  try {
    await video.play()
  } catch {
    // Autoplay policies may refuse; the user can press play manually.
  }
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z"/></svg>'

const pauseMotionPlugin = definePlugin<
  PauseMotionOptions,
  PauseMotionApi,
  PauseMotionState
>({
  messages: {
    'en-US': {
      'motion.label': 'Pause motion',
      'motion.off': 'Motion is playing, pause with {shortcut}',
      'motion.on': 'Motion is paused, resume with {shortcut}',
    },
    'zh-CN': {
      'motion.label': '停止动画',
      'motion.off': '当前动画播放中，停止动画 {shortcut}',
      'motion.on': '当前动画已停止，恢复动画 {shortcut}',
    },
  },
  name: 'pause-motion',
  setup: ctx => {
    const freezeGifs = ctx.options.freezeGifs ?? true
    let disposeStyle: (() => void) | null = null
    /** Videos we paused, to resume on disable. */
    const pausedVideos = new Set<HTMLVideoElement>()
    /** GIF images swapped to a still snapshot, with their original src. */
    const frozenGifs = new Map<HTMLImageElement, string>()

    const buildStyle = (): string => css`
      :where(body *${SKIP}, body *${SKIP}::before, body *${SKIP}::after) {
        animation-play-state: paused !important;
        transition-property: none !important;
        scroll-behavior: auto !important;
      }
    `

    const pauseVideos = (): void => {
      for (const video of document.querySelectorAll('video')) {
        const skipped = video.closest('[data-a11y-skip]')
        if (!skipped && (!video.paused || video.autoplay)) {
          try {
            video.pause()
            pausedVideos.add(video)
          } catch {
            // Ignore engines without media playback support.
          }
        }
      }
    }

    const resumeVideos = (): void => {
      for (const video of pausedVideos) {
        if (video.isConnected && video.autoplay) {
          // Fire-and-forget: the failure path is swallowed inside.
          resumeVideo(video)
        }
      }
      pausedVideos.clear()
    }

    const freezeGifImage = (img: HTMLImageElement): void => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const context = canvas.getContext('2d')
        if (context) {
          context.drawImage(img, 0, 0)
          // Throws on cross-origin GIFs (tainted canvas) — leave those be.
          const still = canvas.toDataURL()
          frozenGifs.set(img, img.src)
          img.src = still
        }
      } catch {
        // Keep the original animated image.
      }
    }

    const freezeGifImages = (): void => {
      for (const img of document.querySelectorAll('img')) {
        const eligible =
          img.src.toLowerCase().includes('.gif') &&
          !img.closest('[data-a11y-skip]') &&
          img.complete &&
          img.naturalWidth > 0
        if (eligible) {
          freezeGifImage(img)
        }
      }
    }

    const restoreGifImages = (): void => {
      for (const [img, original] of frozenGifs) {
        if (img.isConnected) {
          img.src = original
        }
      }
      frozenGifs.clear()
    }

    const apply = (enabled: boolean): void => {
      if (enabled) {
        disposeStyle = ctx.dom.injectStyle('pause-motion', buildStyle())
        pauseVideos()
        if (freezeGifs) {
          freezeGifImages()
        }
      } else {
        disposeStyle?.()
        disposeStyle = null
        resumeVideos()
        restoreGifImages()
      }
    }

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'motion.on' : 'motion.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'x' }),
      })

    const toggle = (): void => {
      const next = !isEnabled()
      ctx.state.set('enabled', next)
      apply(next)
      button.update({ description: describe, pressed: next })
      ctx.ui.announce(describe())
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'tool',
      icon: ICON,
      id: 'pause-motion',
      label: () => ctx.i18n.t('motion.label'),
      onPress: toggle,
      order: 53,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('motion.label'),
      handler: toggle,
      id: 'pause-motion',
      key: 'x',
    })

    if (isEnabled()) {
      apply(true)
    }

    return {
      api: { isEnabled, toggle },
      dispose: () => {
        apply(false)
        unregister()
        button.remove()
      },
    }
  },
  state: { enabled: false },
})

/**
 * Pause motion plugin. `Ctrl+Alt+X` freezes CSS animations and transitions
 * (a forced `prefers-reduced-motion`-style override), pauses autoplaying
 * video, and best-effort freezes same-origin GIFs onto a still first frame
 * — for vestibular-disorder and attention-sensitive users.
 */
export const pauseMotion = (
  options: PauseMotionOptions = {},
): ConfiguredPlugin<PauseMotionOptions, PauseMotionApi, PauseMotionState> =>
  configurePlugin(pauseMotionPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'pause-motion': PauseMotionApi
  }
}
