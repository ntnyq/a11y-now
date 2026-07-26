import { setTimeout as delay } from 'node:timers/promises'
import {
  createA11yNow,
  createEventBus,
  createSchemeController,
  SCHEME_ATTR,
} from '@a11y-now/core'
import { beforeEach, expect, it, vi } from 'vitest'

const SCHEME_MARKER_ATTRIBUTES = [
  'class',
  'style',
  'data-theme',
  'data-color-mode',
  'data-color-scheme',
]

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  for (const el of [document.documentElement, document.body]) {
    for (const attr of SCHEME_MARKER_ATTRIBUTES) {
      el.removeAttribute(attr)
    }
  }
})

it('resolves light when the page gives no signal', () => {
  const scheme = createSchemeController(document, createEventBus())
  expect(scheme.preference()).toBe('auto')
  expect(scheme.resolved()).toBe('light')
  scheme.destroy()
})

it('reads dark/light markers from class and data attributes', () => {
  const cases: [el: HTMLElement, attr: string, value: string][] = [
    [document.documentElement, 'class', 'mac dark'],
    [document.documentElement, 'data-theme', 'dark'],
    [document.documentElement, 'data-color-mode', 'dark'],
    [document.body, 'data-color-scheme', 'dark'],
  ]
  for (const [el, attr, value] of cases) {
    el.setAttribute(attr, value)
    const scheme = createSchemeController(document, createEventBus())
    expect(scheme.resolved(), `${attr}="${value}"`).toBe('dark')
    scheme.destroy()
    el.removeAttribute(attr)
  }
})

it('ignores ambiguous or partial-word markers', () => {
  document.documentElement.className = 'darkroom lighthouse'
  const partial = createSchemeController(document, createEventBus())
  expect(partial.resolved()).toBe('light')
  partial.destroy()

  // Both tokens present: no verdict, falls through to the media default.
  document.documentElement.className = 'light dark'
  const ambiguous = createSchemeController(document, createEventBus())
  expect(ambiguous.resolved()).toBe('light')
  ambiguous.destroy()
})

it('judges the page by background luminance when unmarked', () => {
  document.body.style.backgroundColor = 'rgb(18, 18, 18)'
  const dark = createSchemeController(document, createEventBus())
  expect(dark.resolved()).toBe('dark')
  dark.destroy()

  document.body.style.backgroundColor = 'rgb(250, 250, 250)'
  const light = createSchemeController(document, createEventBus())
  expect(light.resolved()).toBe('light')
  light.destroy()
})

it('falls back to prefers-color-scheme and follows its changes', () => {
  const listeners: (() => void)[] = []
  const fake = {
    addEventListener: (_event: string, fn: () => void) => {
      listeners.push(fn)
    },
    matches: true,
    removeEventListener: vi.fn<() => void>(),
  }
  const spy = vi
    .spyOn(window, 'matchMedia')
    .mockReturnValue(fake as unknown as MediaQueryList)

  const events = createEventBus()
  const seen: string[] = []
  events.on('scheme:change', ({ scheme }) => seen.push(scheme))
  const scheme = createSchemeController(document, events)
  expect(scheme.resolved()).toBe('dark')

  fake.matches = false
  for (const fn of listeners) {
    fn()
  }
  expect(scheme.resolved()).toBe('light')
  expect(seen).toStrictEqual(['light'])

  // An explicit host marker outranks the media query.
  fake.matches = true
  document.documentElement.className = 'light'
  for (const fn of listeners) {
    fn()
  }
  expect(scheme.resolved()).toBe('light')

  scheme.destroy()
  expect(fake.removeEventListener).toHaveBeenCalledWith(
    'change',
    expect.any(Function),
  )
  spy.mockRestore()
})

it('follows a live class flip, stamps the host and emits scheme:change', async () => {
  const events = createEventBus()
  const seen: string[] = []
  events.on('scheme:change', ({ scheme }) => seen.push(scheme))

  const scheme = createSchemeController(document, events)
  const host = document.createElement('div')
  scheme.attach(host)
  expect(host.getAttribute(SCHEME_ATTR)).toBe('light')

  document.documentElement.classList.add('dark')
  await vi.waitFor(() => {
    expect(host.getAttribute(SCHEME_ATTR)).toBe('dark')
  })
  expect(seen).toStrictEqual(['dark'])

  document.documentElement.classList.remove('dark')
  await vi.waitFor(() => {
    expect(host.getAttribute(SCHEME_ATTR)).toBe('light')
  })
  expect(seen).toStrictEqual(['dark', 'light'])
  scheme.destroy()
})

it('pins the scheme via set() and re-follows on auto', () => {
  const events = createEventBus()
  const scheme = createSchemeController(document, events, 'dark')
  const host = document.createElement('div')
  scheme.attach(host)
  expect(scheme.preference()).toBe('dark')
  expect(host.getAttribute(SCHEME_ATTR)).toBe('dark')

  scheme.set('light')
  expect(host.getAttribute(SCHEME_ATTR)).toBe('light')

  document.documentElement.classList.add('dark')
  scheme.set('auto')
  expect(scheme.resolved()).toBe('dark')
  expect(host.getAttribute(SCHEME_ATTR)).toBe('dark')
  scheme.destroy()
})

it('stops following after destroy', async () => {
  const events = createEventBus()
  const seen: string[] = []
  events.on('scheme:change', ({ scheme }) => seen.push(scheme))
  const scheme = createSchemeController(document, events)
  scheme.destroy()

  document.documentElement.classList.add('dark')
  await delay(30)
  expect(scheme.resolved()).toBe('light')
  expect(seen).toStrictEqual([])
})

it('works without a DOM (SSR): pinning only', () => {
  const scheme = createSchemeController(null, createEventBus())
  expect(scheme.resolved()).toBe('light')
  scheme.set('dark')
  expect(scheme.resolved()).toBe('dark')
  scheme.attach(null)
  scheme.destroy()
})

it('kernel: colorScheme option and setColorScheme drive the host attribute', () => {
  const a11y = createA11yNow({ colorScheme: 'dark', storage: null })
  a11y.mount()
  const host = document.querySelector('a11y-now-host')
  expect(host?.getAttribute(SCHEME_ATTR)).toBe('dark')
  expect(a11y.colorScheme).toBe('dark')
  expect(a11y.resolvedColorScheme).toBe('dark')

  a11y.setColorScheme('light')
  expect(host?.getAttribute(SCHEME_ATTR)).toBe('light')
  expect(a11y.resolvedColorScheme).toBe('light')
  a11y.destroy()
})

it('kernel: auto default follows the host dark class at mount time', () => {
  document.documentElement.classList.add('dark')
  const a11y = createA11yNow({ storage: null })
  a11y.mount()
  const host = document.querySelector('a11y-now-host')
  expect(host?.getAttribute(SCHEME_ATTR)).toBe('dark')
  expect(a11y.colorScheme).toBe('auto')
  a11y.destroy()
  document.documentElement.classList.remove('dark')
})

it('exposes the scheme service to plugins', () => {
  let resolvedInSetup: string | null = null
  const a11y = createA11yNow({ colorScheme: 'dark', storage: null })
  a11y.use({
    name: 'scheme-probe',
    setup: ctx => {
      resolvedInSetup = ctx.scheme.resolved()
      return { dispose: () => {} }
    },
  })
  a11y.mount()
  expect(resolvedInSetup).toBe('dark')
  a11y.destroy()
})
