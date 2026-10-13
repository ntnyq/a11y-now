import { createA11yNow } from '@a11y-now/core'
import { help } from '@a11y-now/plugin-help'
import { zoom } from '@a11y-now/plugin-zoom'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('opens a dialog listing registered shortcuts, Escape closes it', () => {
  const a11y = createA11yNow({ storage: null }).use(zoom()).use(help())
  a11y.mount()

  const api = a11y.getPlugin('help')
  api?.open()
  expect(api?.isOpen()).toBe(true)

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const dialog = shadow?.querySelector('[role="dialog"]') as HTMLElement
  expect(dialog).not.toBeNull()
  const rows = [...dialog.querySelectorAll('.help-keys')].map(row =>
    [...row.querySelectorAll('kbd')].map(kbd => kbd.textContent).join('+'),
  )
  expect(rows).toContain('Ctrl+Alt+=')

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(api?.isOpen()).toBe(false)
  a11y.unmount()
})

it('Ctrl+Alt+? opens and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(help())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '?' }),
  )
  expect(a11y.getPlugin('help')?.isOpen()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('renders keycap chips and closes on backdrop click', () => {
  const a11y = createA11yNow({ storage: null }).use(zoom()).use(help())
  a11y.mount()
  a11y.getPlugin('help')?.open()

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const chips = [...(shadow?.querySelectorAll('.help-keys kbd') ?? [])]
  expect(chips.length).toBeGreaterThan(0)
  expect(chips.map(el => el.textContent)).toContain('Ctrl')

  const backdrop = shadow?.querySelector('.help-backdrop') as HTMLElement
  expect(backdrop).not.toBeNull()
  backdrop.click()
  expect(a11y.getPlugin('help')?.isOpen()).toBe(false)
  expect(shadow?.querySelector('.help-backdrop')).toBeNull()
  a11y.unmount()
})

it('contains focus and restores existing inert attributes on close and disposal', () => {
  const originalInert = document.body.getAttribute('inert')
  document.body.setAttribute('inert', 'preserve')
  const a11y = createA11yNow({ storage: null }).use(help())
  a11y.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const opener = shadow?.querySelector<HTMLButtonElement>(
    '[data-item-id="help"]',
  )
  opener?.focus()
  const api = a11y.getPlugin('help')
  api?.open()
  const dialog = shadow?.querySelector('[role="dialog"]')
  const close = dialog?.querySelector<HTMLButtonElement>('button')
  const scroller = dialog?.querySelector<HTMLElement>('.help-scroll')
  close?.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )
  expect(shadow?.activeElement).toBe(scroller)
  scroller?.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )
  expect(shadow?.activeElement).toBe(close)
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )
  expect(shadow?.activeElement).toBe(close)
  document.dispatchEvent(
    new FocusEvent('focusin', { bubbles: true, composed: true }),
  )
  expect(shadow?.activeElement).toBe(close)
  api?.close()
  expect(document.body.getAttribute('inert')).toBe('preserve')
  expect(opener?.closest('.toolbar')?.hasAttribute('inert')).toBe(false)
  api?.open()
  a11y.destroy()
  expect(document.body.getAttribute('inert')).toBe('preserve')
  if (originalInert === null) {
    document.body.removeAttribute('inert')
  } else {
    document.body.setAttribute('inert', originalInert)
  }
})
