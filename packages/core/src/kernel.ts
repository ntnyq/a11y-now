/* eslint-disable import/max-dependencies -- the kernel wires every service */
import { isBrowser, normalizeLocale, warn } from '@a11y-now/shared'
import type {
  A11yNowInstance,
  A11yNowOptions,
  A11yPluginRegistry,
  ScopedState,
  StateDefaults,
} from '@a11y-now/types'
import { createDomService } from './dom'
import { createEventBus } from './events'
import { createI18n } from './i18n'
import { normalizeInput, sortPlugins } from './plugin-order'
import type { Registered } from './plugin-order'
import { createShortcutCenter } from './shortcuts'
import {
  createSilentEngine,
  createSpeechService,
  createWebSpeechEngine,
} from './speech'
import { createLocalStorageAdapter, createScopedState } from './store'
import { baseStyles } from './styles'
import { createThemeService } from './theme'
import { createToolbar } from './toolbar'

const HOST_TAG = 'a11y-now-host'

export const createA11yNow = (
  options: A11yNowOptions = {},
): A11yNowInstance => {
  const doc = isBrowser() ? document : null
  const storage =
    options.storage === undefined
      ? createLocalStorageAdapter()
      : options.storage
  const prefix = options.storagePrefix ?? 'a11y-now'
  const locale =
    normalizeLocale(options.locale) ??
    normalizeLocale(doc?.documentElement.lang) ??
    'zh-CN'

  const events = createEventBus()
  const i18n = createI18n(locale, options.messages)
  const shortcuts = createShortcutCenter(options.shortcutOverrides)
  const engine =
    options.speechEngine ??
    (isBrowser() ? createWebSpeechEngine() : createSilentEngine())
  const speech = createSpeechService(engine, events, i18n, {
    enabled: true,
    rate: 1,
  })

  const registered: Registered[] = []
  const apis = new Map<string, unknown>()
  const disposers: (() => void)[] = []
  const kernelDisposers: (() => void)[] = []
  const scopedStates = new Map<string, ScopedState>()

  const enabledKey = `${prefix}:enabled`
  const persistedEnabled = storage?.get(enabledKey)
  let enabled =
    persistedEnabled === null || persistedEnabled === undefined
      ? (options.enabled ?? true)
      : persistedEnabled === 'true'
  /** Last requested mount target, replayed when the toolbar is re-enabled. */
  let savedTarget: Element | null = null

  let mounted = false
  let host: HTMLElement | null = null
  let dom = doc ? createDomService(doc) : null
  let themes = doc && dom ? createThemeService(dom, events, doc) : null
  let toolbar: ReturnType<typeof createToolbar> | null = null

  for (const theme of options.themes ?? []) {
    themes?.register(theme)
  }

  const instance: A11yNowInstance = {
    destroy: () => {
      instance.unmount()
      shortcuts.destroy()
      speech.destroy()
    },
    get enabled() {
      return enabled
    },
    events,
    getPlugin: <K extends keyof A11yPluginRegistry>(name: K) =>
      apis.get(name as string) as A11yPluginRegistry[K] | undefined,
    i18n,
    get mounted() {
      return mounted
    },
    mount: target => {
      savedTarget = target ?? null
      if (mounted || !enabled) {
        return
      }
      if (!doc || !dom || !themes) {
        warn('mount() requires a DOM environment')
        return
      }
      mounted = true

      host = doc.createElement(HOST_TAG)
      // Mounted as a sibling of <body>, directly under <html> — page-level
      // transforms/zoom on body can never affect the toolbar (the audited
      // reference needs a `.noscale` counter-hack for this).
      const parent = target ?? doc.documentElement
      parent.append(host)
      const shadow = host.attachShadow({ mode: 'open' })

      const styleEl = doc.createElement('style')
      styleEl.textContent = baseStyles()
      shadow.append(styleEl)

      toolbar = createToolbar(shadow, i18n, speech)
      themes.attach(host)

      kernelDisposers.push(
        events.on('screen-reader:change', ({ enabled: srEnabled }) => {
          toolbar?.setScreenReaderMode(srEnabled)
        }),
        events.on('a11y:reset', () => {
          instance.resetAll()
        }),
        events.on('a11y:exit', () => {
          // Exit persists the disabled choice so the toolbar stays hidden
          // on later visits until explicitly re-enabled.
          instance.setEnabled(false)
        }),
      )

      const ordered = sortPlugins(registered)
      for (const { options: pluginOptions, plugin } of ordered) {
        let scoped = scopedStates.get(plugin.name)
        if (!scoped) {
          scoped = createScopedState(
            plugin.name,
            plugin.state ?? {},
            storage,
            prefix,
          )
          scopedStates.set(plugin.name, scoped)
        }
        for (const [messagesLocale, table] of Object.entries(
          plugin.messages ?? {},
        )) {
          if (table) {
            i18n.extend(messagesLocale, table)
          }
        }
        const result = plugin.setup({
          dom,
          events,
          i18n,
          options: pluginOptions,
          shortcuts,
          speech,
          state: scoped as ScopedState<StateDefaults>,
          storage,
          theme: themes,
          ui: toolbar,
        })
        if (result.api !== undefined) {
          apis.set(plugin.name, result.api)
        }
        disposers.push(result.dispose)
        events.emit('plugin:activated', { name: plugin.name })
      }

      events.emit('toolbar:mounted', { host })
      toolbar.announce(
        i18n.t('a11y.entry', {
          shortcut: shortcuts.format({ alt: true, ctrl: true, key: '?' }),
        }),
      )
    },
    resetAll: () => {
      for (const scoped of scopedStates.values()) {
        scoped.reset()
      }
      events.emit('state:reset', {})
    },
    setEnabled: value => {
      enabled = value
      storage?.set(enabledKey, String(value))
      if (value && !mounted) {
        instance.mount(savedTarget ?? undefined)
      } else if (!value && mounted) {
        instance.unmount()
      }
    },
    shortcuts,
    speech,
    get themes() {
      if (!themes) {
        throw new Error('[a11y-now] theme service requires a DOM environment')
      }
      return themes
    },
    toggleEnabled: () => {
      instance.setEnabled(!mounted)
      return mounted
    },
    unmount: () => {
      if (!mounted) {
        return
      }
      mounted = false
      for (const dispose of kernelDisposers) {
        dispose()
      }
      kernelDisposers.length = 0
      for (const dispose of disposers.toReversed()) {
        try {
          dispose()
        } catch (error) {
          warn(`plugin dispose failed: ${String(error)}`)
        }
      }
      disposers.length = 0
      apis.clear()
      toolbar?.destroy()
      toolbar = null
      themes?.destroy()
      dom?.cleanup()
      host?.remove()
      host = null
      speech.cancel()
      events.emit('toolbar:unmounted', {})
      // Recreate page-facing services so a later mount starts clean.
      if (doc) {
        dom = createDomService(doc)
        const nextThemes = createThemeService(dom, events, doc)
        for (const theme of themes?.list() ?? []) {
          nextThemes.register(theme)
        }
        themes = nextThemes
      }
    },
    use: input => {
      const item = normalizeInput(input)
      if (registered.some(entry => entry.plugin.name === item.plugin.name)) {
        warn(`plugin "${item.plugin.name}" is already registered`)
        return instance
      }
      registered.push(item)
      if (mounted) {
        warn(
          `plugin "${item.plugin.name}" registered after mount; ` +
            'remount to activate it',
        )
      }
      return instance
    },
    useTheme: theme => {
      themes?.register(theme)
      return instance
    },
  }

  for (const plugin of options.plugins ?? []) {
    instance.use(plugin)
  }

  return instance
}
