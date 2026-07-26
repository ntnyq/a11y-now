import {
  configurePlugin,
  createA11yNow,
  createMemoryStorageAdapter,
  definePlugin,
} from '@a11y-now/core'
import { beforeEach, expect, it, vi } from 'vitest'

const cleanDom = (): void => {
  document.querySelector('a11y-now-host')?.remove()
  document.documentElement.removeAttribute('style')
  delete document.documentElement.dataset['a11yTheme']
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
    setup: ctx => {
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
  const make = (name: string, dependsOn?: string[]) =>
    definePlugin({
      ...(dependsOn ? { dependsOn } : {}),
      name,
      setup: () => {
        order.push(name)
        return { dispose: () => {} }
      },
    })

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
    setup: () => ({ api: { double: n => n * 2 }, dispose: () => {} }),
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
    setup: ctx => {
      ctx.state.set('count', (ctx.state.get('count') as number) + 1)
      return { dispose: () => {} }
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
    setup: ctx => {
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
    setup: ctx => {
      received = ctx.options
      return { dispose: () => {} }
    },
  })
  const a11y = createA11yNow({ storage: null }).use(
    configurePlugin(plugin, { step: 5 }),
  )
  a11y.mount()
  expect(received).toStrictEqual({ step: 5 })
  a11y.unmount()
})
