/**
 * Real-browser e2e (chromium): keyboard traversal, shadow DOM focus,
 * theme switching with computed-style assertions, and the byte-exact
 * "leave no trace" guarantee — the properties happy-dom cannot prove.
 */
import { createA11yNow } from 'a11y-now'
import type { A11yNowInstance } from 'a11y-now'
import { afterEach, beforeEach, expect, it } from 'vitest'

let a11y: A11yNowInstance | null = null

beforeEach(() => {
  localStorage.clear()
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><h1>标题</h1><p>正文段落</p></main>'
})

afterEach(() => {
  a11y?.destroy()
  a11y = null
})

const shadowRoot = (): ShadowRoot => {
  const host = document.querySelector('a11y-now-host')
  if (!host?.shadowRoot) {
    throw new Error('toolbar host missing')
  }
  return host.shadowRoot
}

const buttons = (): HTMLButtonElement[] => [
  ...shadowRoot().querySelectorAll('button'),
]

it('mounts the full preset and unmounts byte-exact', () => {
  const before = document.documentElement.outerHTML
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  expect(buttons().length).toBeGreaterThan(10)

  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('arrow keys move real focus through the toolbar', () => {
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  // Roving skips natively disabled buttons (unfocusable in real browsers).
  const all = buttons().filter(el => !el.disabled)
  const first = all[0] as HTMLButtonElement
  first.focus()
  expect(shadowRoot().activeElement).toBe(first)

  first.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }),
  )
  expect(shadowRoot().activeElement).toBe(all[1])
  expect(all[1]?.tabIndex).toBe(0)
  expect(first.tabIndex).toBe(-1)

  all[1]?.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key: 'End' }),
  )
  expect(shadowRoot().activeElement).toBe(all.at(-1))

  all
    .at(-1)
    ?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Home' }),
    )
  expect(shadowRoot().activeElement).toBe(first)
})

it('Ctrl+Alt+= zooms the page for real', () => {
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '=' }),
  )
  expect(getComputedStyle(document.body).zoom).toBe('1.1')
  a11y.unmount()
  expect(getComputedStyle(document.body).zoom).toBe('1')
})

it('theme switching re-colors the page and reverts cleanly', () => {
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  a11y.themes.apply('deep-blue')

  expect(document.documentElement.dataset['a11yTheme']).toBe('deep-blue')
  expect(getComputedStyle(document.body).backgroundColor).toBe('rgb(0, 51, 92)')
  expect(getComputedStyle(document.body).color).toBe('rgb(255, 255, 255)')

  a11y.themes.apply('high-contrast')
  expect(getComputedStyle(document.body).backgroundColor).toBe('rgb(0, 0, 0)')

  a11y.unmount()
  expect(document.documentElement.dataset['a11yTheme']).toBeUndefined()
  expect(getComputedStyle(document.body).backgroundColor).not.toBe(
    'rgb(0, 0, 0)',
  )
})

it('help dialog manages focus and restores it on Escape', () => {
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  const helpBtn =
    buttons().find(el => el.dataset['a11yId'] === 'help') ??
    buttons().find(el => el.textContent?.includes('说明'))
  expect(helpBtn).toBeDefined()
  helpBtn?.focus()
  helpBtn?.click()

  const dialog = shadowRoot().querySelector('[role="dialog"]')
  expect(dialog).not.toBeNull()
  // Focus moved into the dialog (onto its close button).
  expect(dialog?.contains(shadowRoot().activeElement)).toBe(true)

  // The close handler listens on document (capture) — dispatch from the
  // focused element so the event actually propagates there.
  shadowRoot().activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      composed: true,
      key: 'Escape',
    }),
  )
  expect(shadowRoot().querySelector('[role="dialog"]')).toBeNull()
  expect(shadowRoot().activeElement).toBe(helpBtn)
})

it('exit removes the toolbar and remembers the choice', () => {
  a11y = createA11yNow()
  a11y.mount()
  const exitBtn = buttons().find(el => el.textContent?.includes('退出'))
  expect(exitBtn).toBeDefined()
  exitBtn?.click()

  expect(document.querySelector('a11y-now-host')).toBeNull()
  const raw = localStorage.getItem('a11y-now:plugin:exit') ?? '{}'
  expect((JSON.parse(raw) as { disabled?: boolean }).disabled).toBe(true)
})
