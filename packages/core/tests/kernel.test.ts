import {
  configurePlugin,
  createA11yNow,
  createMemoryStorageAdapter,
  definePlugin,
} from '@a11y-now/core'
import { beforeEach, expect, it, vi } from 'vitest'

function cleanDom(): void {
  document.querySelector('a11y-now-host')?.remove()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('lang')
  delete document.documentElement.dataset['a11yTheme']
}

/**
 * Mount with the given options and read the toolbar's aria-label.
 */
function mountedToolbarLabel(
  options: Parameters<typeof createA11yNow>[0] = {},
): string | null | undefined {
  const a11y = createA11yNow({ storage: null, ...options })
  a11y.mount()
  const label = document
    .querySelector('a11y-now-host')
    ?.shadowRoot?.querySelector('[role="toolbar"]')
    ?.getAttribute('aria-label')
  a11y.unmount()
  return label
}

beforeEach(() => {
  cleanDom()
  localStorage.clear()
})

it('mounts a shadow host under <html> and unmounts without residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null })
  a11y.mount()

  const host = document.querySelector('a11y-now-host')
  expect(host).not.toBeNull()
  expect(host?.parentElement).toBe(document.documentElement)
  expect(host?.shadowRoot?.querySelector('[role="toolbar"]')).not.toBeNull()
  expect(a11y.mounted).toBe(true)

  a11y.unmount()
  expect(document.querySelector('a11y-now-host')).toBeNull()
  expect(a11y.mounted).toBe(false)
  expect(document.documentElement.outerHTML).toBe(before)
})

it('runs plugin setup on mount and dispose on unmount', () => {
  const setup = vi.fn<(ctx: unknown) => void>()
  const dispose = vi.fn<() => void>()
  const plugin = definePlugin({
    name: 'probe',
    setup(ctx) {
      setup(ctx)
      return { api: { hello: 'world' }, dispose }
    },
  })
  const a11y = createA11yNow({ storage: null }).use(plugin)

  expect(setup).not.toHaveBeenCalled()
  a11y.mount()
  expect(setup).toHaveBeenCalledTimes(1)
  a11y.unmount()
  expect(dispose).toHaveBeenCalledTimes(1)
})

it('orders plugins by dependsOn and rejects missing dependencies', () => {
  const order: string[] = []
  function make(name: string, dependsOn?: string[]) {
    return definePlugin({
      ...(dependsOn ? { dependsOn } : {}),
      name,
      setup() {
        order.push(name)
        return { dispose() {} }
      },
    })
  }

  const a11y = createA11yNow({ storage: null })
    .use(make('b', ['a']))
    .use(make('a'))
  a11y.mount()
  expect(order).toStrictEqual(['a', 'b'])
  a11y.unmount()

  const broken = createA11yNow({ storage: null }).use(make('x', ['missing']))
  expect(() => broken.mount()).toThrow(/missing plugin/u)
})

it('exposes plugin apis via getPlugin', () => {
  const plugin = definePlugin<undefined, { double: (n: number) => number }>({
    name: 'math',
    setup: () => ({ api: { double: n => n * 2 }, dispose() {} }),
  })
  const a11y = createA11yNow({ storage: null }).use(plugin)
  a11y.mount()
  const api = a11y.getPlugin('math' as never) as
    | { double: (n: number) => number }
    | undefined
  expect(api?.double(21)).toBe(42)
  a11y.unmount()
})

it('persists plugin state and restores it on a fresh instance', () => {
  const storage = createMemoryStorageAdapter()
  const plugin = definePlugin({
    name: 'counter',
    setup(ctx) {
      ctx.state.set('count', (ctx.state.get('count') as number) + 1)
      return { dispose() {} }
    },
    state: { count: 0 },
  })

  const first = createA11yNow({ storage }).use(plugin)
  first.mount()
  first.unmount()

  const second = createA11yNow({ storage }).use(plugin)
  second.mount()
  const raw = storage.get('a11y-now:plugin:counter')
  expect(raw).not.toBeNull()
  expect(JSON.parse(raw as string)).toStrictEqual({ count: 2 })
  second.unmount()
})

it('resetAll restores plugin state defaults and emits state:reset', () => {
  let observed = -1
  const plugin = definePlugin({
    name: 'resettable',
    setup(ctx) {
      ctx.state.set('value', 42)
      const stop = ctx.events.on('state:reset', () => {
        observed = ctx.state.get('value') as number
      })
      return { dispose: stop }
    },
    state: { value: 0 },
  })
  const a11y = createA11yNow({ storage: null }).use(plugin)
  a11y.mount()
  a11y.resetAll()
  expect(observed).toBe(0)
  a11y.unmount()
})

it('accepts configured plugins with typed options', () => {
  let received: unknown = null
  const plugin = definePlugin<{ step: number }>({
    name: 'configured',
    setup(ctx) {
      received = ctx.options
      return { dispose() {} }
    },
  })
  const a11y = createA11yNow({ storage: null }).use(
    configurePlugin(plugin, { step: 5 }),
  )
  a11y.mount()
  expect(received).toStrictEqual({ step: 5 })
  a11y.unmount()
})

it('resolves the UI locale from html lang with en/zh normalization', () => {
  document.documentElement.lang = 'en'
  expect(mountedToolbarLabel()).toBe('Accessibility toolbar')

  document.documentElement.lang = 'en-GB'
  expect(mountedToolbarLabel()).toBe('Accessibility toolbar')

  document.documentElement.lang = 'zh-Hant'
  expect(mountedToolbarLabel()).toBe('无障碍工具栏')

  // Unknown and missing tags fall back to the zh-CN table.
  document.documentElement.lang = 'de'
  expect(mountedToolbarLabel()).toBe('无障碍工具栏')
  document.documentElement.removeAttribute('lang')
  expect(mountedToolbarLabel()).toBe('无障碍工具栏')
})

it('honors an explicit locale option over html lang', () => {
  document.documentElement.lang = 'zh-CN'
  expect(mountedToolbarLabel({ locale: 'en' })).toBe('Accessibility toolbar')
  expect(
    mountedToolbarLabel({
      locale: 'fr-FR',
      messages: { 'fr-FR': { 'toolbar.label': "Barre d'accessibilité" } },
    }),
  ).toBe("Barre d'accessibilité")
})

it('enabled: false defers mount until toggled on and persists the choice', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ enabled: false, storage })
  a11y.mount()
  expect(a11y.mounted).toBe(false)
  expect(a11y.enabled).toBe(false)
  expect(document.querySelector('a11y-now-host')).toBeNull()

  expect(a11y.toggleEnabled()).toBe(true)
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  expect(storage.get('a11y-now:enabled')).toBe('true')
  a11y.destroy()

  // A fresh instance sees the persisted enable over the option default.
  const revived = createA11yNow({ enabled: false, storage })
  revived.mount()
  expect(revived.mounted).toBe(true)
  revived.destroy()
})

it('persisted disable overrides the option and exit persists it', () => {
  const storage = createMemoryStorageAdapter()
  storage.set('a11y-now:enabled', 'false')
  const a11y = createA11yNow({ storage })
  a11y.mount()
  expect(a11y.mounted).toBe(false)
  a11y.setEnabled(true)
  expect(a11y.mounted).toBe(true)

  a11y.events.emit('a11y:exit', {})
  expect(a11y.mounted).toBe(false)
  expect(storage.get('a11y-now:enabled')).toBe('false')

  // The trigger flow revives a toolbar closed via exit.
  expect(a11y.toggleEnabled()).toBe(true)
  expect(a11y.mounted).toBe(true)
  a11y.destroy()
})

it('toggleEnabled flips actual visibility even after a direct unmount', () => {
  const a11y = createA11yNow({ storage: null })
  a11y.mount()
  expect(a11y.toggleEnabled()).toBe(false)
  expect(document.querySelector('a11y-now-host')).toBeNull()
  a11y.setEnabled(true)
  a11y.unmount()
  expect(a11y.toggleEnabled()).toBe(true)
  expect(a11y.mounted).toBe(true)
  a11y.destroy()
})
