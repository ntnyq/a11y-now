import { createA11yNow } from '@a11y-now/core'
import { A11yNowProvider, useA11yNow } from '@a11y-now/react'
import type { A11yNowInstance } from '@a11y-now/types'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'

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
})

it('provider mounts the toolbar and exposes it via hook', async () => {
  const captured: { current: A11yNowInstance | null } = { current: null }
  const Probe = (): null => {
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
  const Probe = (): null => {
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
