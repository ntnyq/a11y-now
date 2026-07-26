import { createA11yNow } from '@a11y-now/core'
import { A11yNowProvider, useA11yNow } from '@a11y-now/react'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import type { A11yNowInstance } from '@a11y-now/types'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLElement

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  container.remove()
})

it('provider mounts the toolbar and exposes it via hook', async () => {
  let captured: A11yNowInstance | null = null
  const Probe = () => {
    captured = useA11yNow()
    return null
  }
  const root = createRoot(container)
  await act(async () => {
    root.render(
      createElement(
        A11yNowProvider,
        { options: { storage: null } },
        createElement(Probe),
      ),
    )
  })
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  expect(captured?.mounted).toBe(true)

  await act(async () => {
    root.unmount()
  })
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('hook throws without a provider', async () => {
  let error: unknown
  const Probe = () => {
    try {
      useA11yNow()
    } catch (caught) {
      error = caught
    }
    return null
  }
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(Probe))
  })
  expect(String(error)).toMatch(/A11yNowProvider/)
  await act(async () => {
    root.unmount()
  })
})

it('core instance is reusable outside react', () => {
  const instance = createA11yNow({ storage: null })
  instance.mount()
  expect(instance.mounted).toBe(true)
  instance.unmount()
})
