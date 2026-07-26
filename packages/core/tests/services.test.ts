import {
  createA11yNow,
  createDomService,
  createEventBus,
  createShortcutCenter,
  definePlugin,
  defineTheme,
} from '@a11y-now/core'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.documentElement.removeAttribute('style')
  delete document.documentElement.dataset['a11yTheme']
  localStorage.clear()
})

it('event bus delivers typed payloads and unsubscribes', () => {
  const bus = createEventBus()
  const fn = vi.fn<(payload: { theme: string }) => void>()
  const stop = bus.on('theme:change', fn)
  bus.emit('theme:change', { theme: 'x' })
  stop()
  bus.emit('theme:change', { theme: 'y' })
  expect(fn).toHaveBeenCalledExactlyOnceWith({ theme: 'x' })
})

it('shortcut center matches key combos and detects conflicts', () => {
  const center = createShortcutCenter()
  const handler = vi.fn<() => void>()
  center.register({
    alt: true,
    ctrl: true,
    description: 'test',
    handler,
    id: 'test',
    key: 't',
  })

  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 't' }),
  )
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }))
  expect(handler).toHaveBeenCalledTimes(1)

  expect(() =>
    center.register({
      alt: true,
      ctrl: true,
      description: 'other',
      handler: () => {},
      id: 'other',
      key: 'T',
    }),
  ).toThrow(/conflict/u)

  expect(center.format({ alt: true, ctrl: true, key: 't' })).toBe('Ctrl+Alt+T')
  expect(center.list()).toHaveLength(1)
  center.destroy()
})

it('dom service reverts every mutation on cleanup', () => {
  const dom = createDomService(document)
  dom.injectStyle('probe', 'body { color: red }')
  dom.setPageVar('--a11y-page-bg', 'black')
  dom.addPageClass('a11y-probe')

  expect(document.head.querySelector('[data-a11y-now="probe"]')).not.toBeNull()
  expect(
    document.documentElement.style.getPropertyValue('--a11y-page-bg'),
  ).toBe('black')
  expect(document.documentElement.classList.contains('a11y-probe')).toBe(true)

  dom.cleanup()
  expect(document.head.querySelector('[data-a11y-now="probe"]')).toBeNull()
  expect(
    document.documentElement.style.getPropertyValue('--a11y-page-bg'),
  ).toBe('')
  expect(document.documentElement.classList.contains('a11y-probe')).toBe(false)
})

it('theme service applies tokens as CSS variables and cycles', () => {
  const dark = defineTheme({
    displayName: { 'zh-CN': '深色' },
    name: 'dark',
    page: { bg: 'rgb(0, 0, 0)', fg: 'rgb(255, 255, 255)' },
    toolbar: { 'color-bg': 'rgb(0, 0, 0)' },
  })
  const light = defineTheme({
    displayName: { 'zh-CN': '默认' },
    name: 'light',
  })
  const a11y = createA11yNow({ storage: null, themes: [light, dark] })
  a11y.mount()

  const host = document.querySelector('a11y-now-host') as HTMLElement
  a11y.themes.apply('dark')
  expect(host.style.getPropertyValue('--a11y-color-bg')).toBe('rgb(0, 0, 0)')
  expect(
    document.documentElement.style.getPropertyValue('--a11y-page-bg'),
  ).toBe('rgb(0, 0, 0)')
  expect(document.documentElement.dataset['a11yTheme']).toBe('dark')
  expect(
    document.head.querySelector('[data-a11y-now="theme-page"]'),
  ).not.toBeNull()

  // Cycling wraps: dark -> light (no page tokens -> everything reverted)
  const next = a11y.themes.cycle()
  expect(next?.name).toBe('light')
  expect(host.style.getPropertyValue('--a11y-color-bg')).toBe('')
  expect(document.documentElement.dataset['a11yTheme']).toBeUndefined()
  expect(document.head.querySelector('[data-a11y-now="theme-page"]')).toBeNull()

  a11y.unmount()
})

it('speech service respects enabled and muted flags', () => {
  const speak =
    vi.fn<(text: string, options: { locale: string; rate: number }) => void>()
  const a11y = createA11yNow({
    speechEngine: { available: true, cancel: () => {}, speak },
    storage: null,
  })
  a11y.mount()

  a11y.speech.speak('hello')
  // Two calls so far: the mount announcement, then 'hello'.
  expect(speak).toHaveBeenCalledTimes(2)

  a11y.speech.setEnabled(false)
  a11y.speech.speak('ignored')
  expect(speak).toHaveBeenCalledTimes(2)
  a11y.speech.speak('forced', { force: true })
  expect(speak).toHaveBeenCalledTimes(3)

  a11y.speech.setEnabled(true)
  a11y.speech.setMuted(true)
  a11y.speech.speak('muted')
  expect(speak).toHaveBeenCalledTimes(3)

  a11y.unmount()
})

it('toolbar renders items with aria-pressed and roving tabindex', () => {
  const a11y = createA11yNow({ storage: null })
  const plugin = {
    name: 'ui-probe',
    setup: (ctx: {
      ui: {
        addItem: (def: {
          id: string
          label: string
          onPress: () => void
          pressed: boolean
        }) => { el: HTMLElement; update: (p: { pressed?: boolean }) => void }
      }
    }) => {
      const handle = ctx.ui.addItem({
        id: 'probe',
        label: 'Probe',
        onPress: () => handle.update({ pressed: true }),
        pressed: false,
      })
      return { dispose: () => handle.el.remove() }
    },
  }
  a11y.use(plugin as never)
  a11y.mount()

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const button = shadow?.querySelector(
    '[data-item-id="probe"]',
  ) as HTMLButtonElement
  expect(button.getAttribute('aria-pressed')).toBe('false')
  button.click()
  expect(button.getAttribute('aria-pressed')).toBe('true')
  expect(button.tabIndex).toBe(0)

  a11y.unmount()
})

const press = (key: string): void => {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key }),
  )
}

it('shortcut overrides remap, disable and rebind at runtime', () => {
  const center = createShortcutCenter({
    disabled: null,
    remapped: { key: 'y' },
  })
  let fired = ''
  const make = (id: string, key: string) => ({
    alt: true,
    ctrl: true,
    description: id,
    handler: () => {
      fired = id
    },
    id,
    key,
  })
  center.register(make('remapped', 't'))
  center.register(make('disabled', 'd'))

  // The default combo is dead, the override combo fires.
  press('t')
  expect(fired).toBe('')
  press('y')
  expect(fired).toBe('remapped')
  expect(center.list().map(info => info.key)).toStrictEqual(['y'])

  // Disabled ids never bind and stay out of the help listing.
  press('d')
  expect(fired).toBe('remapped')

  // Runtime rebinding: enable the disabled one, restore the remapped one.
  center.setOverride('disabled', {})
  center.setOverride('remapped', {})
  press('d')
  expect(fired).toBe('disabled')
  press('t')
  expect(fired).toBe('remapped')

  // Colliding override throws via the existing conflict detection.
  expect(() => center.setOverride('remapped', { key: 'd' })).toThrow(
    /conflict/u,
  )
  center.destroy()
})

it('kernel wires shortcutOverrides through to plugin registrations', () => {
  const plugin = definePlugin({
    name: 'probe-shortcut',
    setup: ctx => {
      let count = 0
      ctx.shortcuts.register({
        alt: true,
        ctrl: true,
        description: 'probe',
        handler: () => {
          count += 1
        },
        id: 'probe-shortcut',
        key: 'q',
      })
      return { api: { count: () => count }, dispose: () => {} }
    },
  })
  const a11y = createA11yNow({
    shortcutOverrides: { 'probe-shortcut': { key: '8' } },
    storage: null,
  }).use(plugin)
  a11y.mount()

  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'q' }),
  )
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '8' }),
  )
  const api = a11y.getPlugin('probe-shortcut' as never) as
    | { count: () => number }
    | undefined
  expect(api?.count()).toBe(1)
  a11y.unmount()
})
