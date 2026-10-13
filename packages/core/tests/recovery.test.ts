import {
  createA11yNow,
  createLocalStorageAdapter,
  createSilentEngine,
} from '@a11y-now/core'
import { zoom } from '@a11y-now/plugin-zoom'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

function fail(): never {
  throw new Error('QuotaExceededError')
}

it('keeps page updates, reset, and exit usable when storage operations fail', () => {
  vi.stubGlobal('localStorage', {
    getItem: fail,
    setItem: fail,
    removeItem: fail,
  })
  const adapter = createLocalStorageAdapter()
  expect(adapter?.get('missing')).toBeNull()
  const a11y = createA11yNow({
    plugins: [zoom()],
    speechEngine: createSilentEngine(),
  })
  a11y.mount()
  a11y.getPlugin('zoom')?.zoomIn()
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1.1)
  expect(document.querySelector('[data-a11y-now="zoom"]')).not.toBeNull()
  a11y.resetAll()
  expect(document.querySelector('[data-a11y-now="zoom"]')).toBeNull()
  a11y.setEnabled(false)
  expect(a11y.mounted).toBe(false)
  a11y.destroy()
})

it('validates dependencies before mounting and allows a corrected retry', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use({
    name: 'dependent',
    dependsOn: ['dependency'],
    setup: () => ({ dispose() {} }),
  })
  expect(() => a11y.mount()).toThrow(/missing plugin/u)
  expect(a11y.mounted).toBe(false)
  expect(document.documentElement.outerHTML).toBe(before)
  a11y.use({ name: 'dependency', setup: () => ({ dispose() {} }) })
  a11y.mount()
  expect(a11y.mounted).toBe(true)
  a11y.destroy()
})

it('rolls back completed plugins and subscriptions from a failing setup', () => {
  let shouldFail = true
  const invoked = vi.fn<() => void>()
  const disposed = vi.fn<() => void>()
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({
    storage: null,
    speechEngine: createSilentEngine(),
  })
    .use({ name: 'first', setup: () => ({ dispose: disposed }) })
    .use({
      name: 'second',
      setup(ctx) {
        ctx.dom.injectStyle('probe', 'body { color: red; }')
        ctx.events.on('state:reset', invoked)
        ctx.state.subscribe(invoked)
        ctx.shortcuts.register({
          id: 'probe',
          key: 'q',
          handler: invoked,
          description: 'Probe',
        })
        if (shouldFail) {
          throw new Error('setup failed')
        }
        return { dispose() {} }
      },
      state: { enabled: false },
    })
  expect(() => a11y.mount()).toThrow('setup failed')
  expect(a11y.mounted).toBe(false)
  expect(disposed).toHaveBeenCalledTimes(1)
  expect(a11y.shortcuts.list()).toHaveLength(0)
  expect(document.documentElement.outerHTML).toBe(before)
  a11y.resetAll()
  expect(invoked).not.toHaveBeenCalled()
  shouldFail = false
  a11y.mount()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }))
  expect(invoked).toHaveBeenCalledTimes(1)
  a11y.destroy()
})
