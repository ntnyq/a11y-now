import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { crosshair } from '@a11y-now/plugin-crosshair'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('adds two crosshair lines inside the shadow root when enabled', () => {
  const a11y = createA11yNow({ storage: null }).use(crosshair())
  a11y.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot

  const api = a11y.getPlugin('crosshair')
  api?.toggle()
  const lines = [...(shadow?.querySelectorAll('div') ?? [])].filter(
    el => el.style.pointerEvents === 'none',
  )
  expect(lines).toHaveLength(2)

  api?.toggle()
  const after = [...(shadow?.querySelectorAll('div') ?? [])].filter(
    el => el.style.pointerEvents === 'none',
  )
  expect(after).toHaveLength(0)
  a11y.unmount()
})

it('lines follow the pointer on the next animation frame', async () => {
  const a11y = createA11yNow({ storage: null }).use(crosshair())
  a11y.mount()
  a11y.getPlugin('crosshair')?.toggle()

  window.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 120, clientY: 80 }),
  )
  // A second move while a frame is pending is coalesced.
  window.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 999, clientY: 999 }),
  )

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  function lines() {
    return [...(shadow?.querySelectorAll('div') ?? [])].filter(
      el => el.style.pointerEvents === 'none',
    )
  }
  await vi.waitFor(() => {
    expect(lines().map(el => el.style.insetBlockStart)).toContain('80px')
    expect(lines().map(el => el.style.insetInlineStart)).toContain('120px')
  })

  // Disabling with a frame still pending cancels it.
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1, clientY: 1 }))
  a11y.getPlugin('crosshair')?.toggle()
  expect(lines()).toHaveLength(0)
  a11y.unmount()
})

it('restores the enabled state on remount', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(crosshair())
  a11y.mount()
  a11y.getPlugin('crosshair')?.toggle()
  a11y.unmount()

  const again = createA11yNow({ storage }).use(crosshair())
  again.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  expect(
    [...(shadow?.querySelectorAll('div') ?? [])].filter(
      el => el.style.pointerEvents === 'none',
    ),
  ).toHaveLength(2)
  again.unmount()
})

it('Ctrl+Alt+N toggles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(crosshair())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'n' }),
  )
  expect(a11y.getPlugin('crosshair')?.isEnabled()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
