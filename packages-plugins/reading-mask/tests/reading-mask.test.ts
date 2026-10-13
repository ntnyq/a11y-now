import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { readingMask } from '@a11y-now/plugin-reading-mask'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

function covers() {
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  return [...(shadow?.querySelectorAll('div') ?? [])].filter(
    el => el.style.pointerEvents === 'none',
  )
}

it('dims the page with two covers around a centered band', () => {
  const a11y = createA11yNow({ storage: null }).use(readingMask())
  a11y.mount()
  const api = a11y.getPlugin('reading-mask')

  api?.toggle()
  const [above, below] = covers()
  expect(covers()).toHaveLength(2)
  expect(above?.style.insetBlockStart).toBe('0')
  // Initially centered: below cover starts under the band.
  expect(below?.style.insetBlockEnd).toBe('0')

  api?.toggle()
  expect(covers()).toHaveLength(0)
  a11y.unmount()
})

it('band follows the pointer on the next animation frame', async () => {
  const a11y = createA11yNow({ storage: null }).use(
    readingMask({ height: 100 }),
  )
  a11y.mount()
  a11y.getPlugin('reading-mask')?.toggle()

  window.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 10, clientY: 300 }),
  )
  // A second move while a frame is pending is coalesced.
  window.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 10, clientY: 999 }),
  )

  await vi.waitFor(() => {
    const styles = covers().map(el => ({
      size: el.style.blockSize,
      start: el.style.insetBlockStart,
    }))
    // Above cover ends 50px over the pointer, below cover starts 50px under.
    expect(styles.some(s => s.size === '250px')).toBe(true)
    expect(styles.some(s => s.start === '350px')).toBe(true)
  })

  // Disabling with a frame still pending cancels it.
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1, clientY: 1 }))
  a11y.getPlugin('reading-mask')?.toggle()
  expect(covers()).toHaveLength(0)
  a11y.unmount()
})

it('honors a custom mask color and restores state on remount', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(
    readingMask({ color: 'rgba(1, 2, 3, 0.7)' }),
  )
  a11y.mount()
  a11y.getPlugin('reading-mask')?.toggle()
  expect(covers()[0]?.style.background).toContain('rgba(1, 2, 3, 0.7)')
  a11y.unmount()

  const again = createA11yNow({ storage }).use(readingMask())
  again.mount()
  expect(covers()).toHaveLength(2)
  again.unmount()
})

it('Ctrl+Alt+G toggles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(readingMask())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'g' }),
  )
  expect(a11y.getPlugin('reading-mask')?.isEnabled()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
