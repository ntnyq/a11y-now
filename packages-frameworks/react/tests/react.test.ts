import { createA11yNow } from '@a11y-now/core'
import { zoom } from '@a11y-now/plugin-zoom'
import { A11yNowProvider, useA11yNow } from '@a11y-now/react'
import type { A11yNowInstance } from '@a11y-now/types'
import { act, createElement, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLElement = document.createElement('div')

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  container.remove()
  vi.restoreAllMocks()
})

it('provider mounts the toolbar and exposes it via hook', async () => {
  const captured: { current: A11yNowInstance | null } = { current: null }
  function Probe(): null {
    captured.current = useA11yNow()
    return null
  }
  const root = createRoot(container)
  await act(() => {
    root.render(
      createElement(
        A11yNowProvider,
        { options: { storage: null } },
        createElement(Probe),
      ),
    )
  })
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  expect(captured.current?.mounted).toBe(true)

  await act(() => {
    root.unmount()
  })
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('hook throws without a provider', async () => {
  const thrown: { current: unknown } = { current: null }
  function Probe(): null {
    try {
      useA11yNow()
    } catch (error) {
      thrown.current = error
    }
    return null
  }
  const root = createRoot(container)
  await act(() => {
    root.render(createElement(Probe))
  })
  expect(String(thrown.current)).toMatch(/A11yNowProvider/u)
  await act(() => {
    root.unmount()
  })
})

it('core instance is reusable outside react', () => {
  const instance = createA11yNow({ storage: null })
  instance.mount()
  expect(instance.mounted).toBe(true)
  instance.unmount()
})

it('releases browser resources after StrictMode replay and final unmount', async () => {
  const add = vi.spyOn(window, 'addEventListener')
  const remove = vi.spyOn(window, 'removeEventListener')
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
  const root = createRoot(container)
  await act(() =>
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(A11yNowProvider, {
          options: { storage: null, plugins: [zoom()] },
        }),
      ),
    ),
  )
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '=' }),
  )
  expect(
    document.querySelector('[data-a11y-now="zoom"]')?.textContent,
  ).toContain('1.1')
  await act(() => root.unmount())
  const handlers = add.mock.calls.filter(([type]) => type === 'keydown')
  expect(handlers.length).toBeGreaterThan(0)
  for (const args of handlers) {
    expect(remove).toHaveBeenCalledWith(...args)
  }
  expect(disconnect).toHaveBeenCalledWith()
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('does not subscribe when rendering suspends before commit', async () => {
  const add = vi.spyOn(window, 'addEventListener')
  const observe = vi.spyOn(MutationObserver.prototype, 'observe')
  // An empty race stays pending, so this render never commits.
  const pending = Promise.race<undefined>([])
  function Suspend(): never {
    throw pending
  }
  const root = createRoot(container)
  await act(() =>
    root.render(
      createElement(
        Suspense,
        { fallback: 'Loading' },
        createElement(
          A11yNowProvider,
          { options: { storage: null, plugins: [zoom()] } },
          createElement(Suspend),
        ),
      ),
    ),
  )
  expect(container.textContent).toBe('Loading')
  expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0)
  expect(observe).not.toHaveBeenCalled()
  await act(() => root.unmount())
})

it('stops and restarts resources when autoMount changes', async () => {
  const root = createRoot(container)
  const options = { storage: null, plugins: [zoom()] }
  await act(() => root.render(createElement(A11yNowProvider, { options })))
  await act(() =>
    root.render(createElement(A11yNowProvider, { options, autoMount: false })),
  )
  expect(document.querySelector('a11y-now-host')).toBeNull()
  await act(() => root.render(createElement(A11yNowProvider, { options })))
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '=' }),
  )
  expect(
    document.querySelector('[data-a11y-now="zoom"]')?.textContent,
  ).toContain('1.1')
  await act(() => root.unmount())
})
