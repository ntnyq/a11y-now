/**
 * Real-browser e2e (chromium): keyboard traversal, shadow DOM focus,
 * theme switching with computed-style assertions, and the byte-exact
 * "leave no trace" guarantee — the properties happy-dom cannot prove.
 */
import { createA11yNow } from 'a11y-now'
import type { A11yNowInstance } from 'a11y-now'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'

let a11y: A11yNowInstance | null = null

beforeEach(() => {
  localStorage.clear()
  document.querySelector('a11y-now-host')?.remove()
  // The suite models a Chinese page; label queries below rely on it.
  document.documentElement.lang = 'zh-CN'
  document.documentElement.className = ''
  document.body.removeAttribute('style')
  document.body.innerHTML = '<main><h1>标题</h1><p>正文段落</p></main>'
})

afterEach(() => {
  a11y?.destroy()
  a11y = null
})

function shadowRoot(): ShadowRoot {
  const host = document.querySelector('a11y-now-host')
  if (!host?.shadowRoot) {
    throw new Error('toolbar host missing')
  }
  return host.shadowRoot
}

function buttons(): HTMLButtonElement[] {
  return [...shadowRoot().querySelectorAll('button')]
}

it('mounts the full preset and unmounts byte-exact', () => {
  const before = document.documentElement.outerHTML
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  expect(buttons().length).toBeGreaterThan(10)
  const toolbar = shadowRoot().querySelector('[role="toolbar"]')
  expect(toolbar && getComputedStyle(toolbar).justifyContent).toBe(
    'safe center',
  )

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

it('renders the English toolbar on an English page', () => {
  document.documentElement.lang = 'en'
  a11y = createA11yNow({ storage: null })
  a11y.mount()

  const toolbar = shadowRoot().querySelector('[role="toolbar"]')
  expect(toolbar?.getAttribute('aria-label')).toBe('Accessibility toolbar')
  expect(buttons().some(el => el.textContent?.includes('Help'))).toBe(true)
  expect(buttons().some(el => el.textContent?.includes('Exit'))).toBe(true)
})

it('follows the host dark switch with real computed chrome styles', async () => {
  // Pin a light page first so the test is independent of the runner's OS.
  document.body.style.backgroundColor = 'rgb(255, 255, 255)'
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  const toolbar = shadowRoot().querySelector('.toolbar') as HTMLElement
  expect(getComputedStyle(toolbar).backgroundColor).toBe('rgb(255, 255, 255)')
  expect(a11y.resolvedColorScheme).toBe('light')

  document.documentElement.classList.add('dark')
  await vi.waitFor(() => {
    expect(getComputedStyle(toolbar).backgroundColor).toBe('rgb(30, 34, 39)')
  })
  expect(a11y.resolvedColorScheme).toBe('dark')
  expect(getComputedStyle(toolbar).color).toBe('rgb(232, 234, 237)')

  document.documentElement.classList.remove('dark')
  await vi.waitFor(() => {
    expect(getComputedStyle(toolbar).backgroundColor).toBe('rgb(255, 255, 255)')
  })
  expect(a11y.resolvedColorScheme).toBe('light')
})

it('setColorScheme pins the chrome regardless of the page', () => {
  a11y = createA11yNow({ colorScheme: 'dark', storage: null })
  a11y.mount()
  const toolbar = shadowRoot().querySelector('.toolbar') as HTMLElement
  expect(getComputedStyle(toolbar).backgroundColor).toBe('rgb(30, 34, 39)')
  expect(a11y.colorScheme).toBe('dark')

  a11y.setColorScheme('light')
  expect(getComputedStyle(toolbar).backgroundColor).toBe('rgb(255, 255, 255)')
})

it('contains Tab and Shift+Tab inside Help and restores background access', async () => {
  const pageButton = document.createElement('button')
  pageButton.textContent = 'Page action'
  document.body.append(pageButton)
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  const help = shadowRoot().querySelector<HTMLButtonElement>(
    '[data-item-id="help"]',
  )
  help?.focus()
  help?.click()
  const dialog = shadowRoot().querySelector('[role="dialog"]')
  const close = dialog?.querySelector('button')
  const scroller = dialog?.querySelector('.help-scroll')
  expect(document.body.inert).toBe(true)
  await userEvent.tab({ shift: true })
  expect(shadowRoot().activeElement).toBe(scroller)
  await userEvent.tab()
  expect(shadowRoot().activeElement).toBe(close)
  await userEvent.tab()
  expect(shadowRoot().activeElement).toBe(scroller)
  await userEvent.tab()
  expect(shadowRoot().activeElement).toBe(close)
  pageButton.focus()
  expect(dialog?.contains(shadowRoot().activeElement)).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(shadowRoot().activeElement).toBe(help)
  expect(document.body.hasAttribute('inert')).toBe(false)
  pageButton.focus()
  expect(document.activeElement).toBe(pageButton)
})

it('screen-reader mode removes visual buttons from layout', () => {
  a11y = createA11yNow({ storage: null })
  a11y.mount()
  a11y.getPlugin('screen-reader')?.toggle()
  const zoom = shadowRoot().querySelector<HTMLElement>(
    '[data-item-id="zoom-in"]',
  )
  expect(zoom && getComputedStyle(zoom).display).toBe('none')
  expect(zoom?.getBoundingClientRect().width).toBe(0)
  a11y.getPlugin('screen-reader')?.toggle()
  expect(zoom && getComputedStyle(zoom).display).toBe('flex')
})

it('keeps the first and last controls reachable on a narrow viewport', async () => {
  await page.viewport(375, 812)
  try {
    a11y = createA11yNow({ locale: 'en-US', storage: null })
    a11y.mount()
    const toolbar = shadowRoot().querySelector<HTMLElement>('.toolbar')
    if (!toolbar) {
      throw new Error('Toolbar missing')
    }
    expect(toolbar.scrollWidth).toBeGreaterThan(toolbar.clientWidth)
    const [first] = buttons()
    expect(first?.getBoundingClientRect().left).toBeGreaterThanOrEqual(0)
    const enabled = buttons().find(button => !button.disabled)
    enabled?.focus()
    await userEvent.keyboard('{End}')
    const exit = shadowRoot().querySelector<HTMLElement>(
      '[data-item-id="exit"]',
    )
    expect(shadowRoot().activeElement).toBe(exit)
    expect(exit?.getBoundingClientRect().right).toBeLessThanOrEqual(375)
    await vi.waitFor(() => {
      expect(
        Number(
          getComputedStyle(document.body).paddingBlockStart.replace('px', ''),
        ),
      ).toBeCloseTo(toolbar.getBoundingClientRect().height)
    })
  } finally {
    await page.viewport(1280, 720)
  }
})
