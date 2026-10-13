import { A11yNow, A11yNowProvider, useA11yNow } from '@a11y-now/next'
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
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  container.remove()
})

it('<A11yNow /> mounts the toolbar and cleans up on unmount', async () => {
  const root = createRoot(container)
  await act(() => {
    root.render(createElement(A11yNow, { preset: 'reading' }))
  })
  expect(document.querySelector('a11y-now-host')).not.toBeNull()

  await act(() => {
    root.unmount()
  })
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('<A11yNow /> honors a previous exit', async () => {
  localStorage.setItem(
    'a11y-now:plugin:exit',
    JSON.stringify({ disabled: true }),
  )
  const root = createRoot(container)
  await act(() => {
    root.render(createElement(A11yNow))
  })
  expect(document.querySelector('a11y-now-host')).toBeNull()
  await act(() => {
    root.unmount()
  })
})

it('re-exported provider and hook stay usable', async () => {
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
  expect(captured.current?.mounted).toBe(true)
  await act(() => {
    root.unmount()
  })
})
