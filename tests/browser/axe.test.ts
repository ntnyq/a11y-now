/**
 * axe-core audit in a real browser (chromium): a clean page must stay
 * clean after the toolbar mounts. Full-document scans with axe's default
 * rule set (WCAG A/AA + best practices), covering both color schemes and
 * the help dialog. This is the automatable half of the toolbar-self-a11y
 * pass; VoiceOver remains a manual check.
 */
import { createA11yNow } from 'a11y-now'
import type { A11yNowInstance } from 'a11y-now'
import axe from 'axe-core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

let a11y: A11yNowInstance | null = null

beforeEach(() => {
  localStorage.clear()
  document.querySelector('a11y-now-host')?.remove()
  document.documentElement.className = ''
  // A minimal but complete host page: axe's page-level rules (title,
  // lang, main landmark, h1) must pass before the toolbar enters.
  document.documentElement.lang = 'zh-CN'
  document.title = 'a11y-now axe 审计'
  document.body.innerHTML = '<main><h1>标题</h1><p>正文段落</p></main>'
})

afterEach(() => {
  a11y?.destroy()
  a11y = null
  document.documentElement.classList.remove('dark')
})

function shadowRoot(): ShadowRoot {
  const host = document.querySelector('a11y-now-host')
  if (!host?.shadowRoot) {
    throw new Error('toolbar host missing')
  }
  return host.shadowRoot
}

/**
 * Whole-page axe run, violations condensed so failures read at a glance.
 */
async function audit(): Promise<string[]> {
  const results = await axe.run(document, { resultTypes: ['violations'] })
  return results.violations.map(violation => {
    const targets = violation.nodes
      .map(node => node.target.flat().join(' '))
      .join(', ')
    return `${violation.id} [${violation.impact ?? 'n/a'}]: ${targets}`
  })
}

function mountToolbar(): void {
  a11y = createA11yNow({ storage: null })
  a11y.mount()
}

function openHelpDialog(): HTMLElement {
  const helpButton = shadowRoot().querySelector<HTMLButtonElement>(
    'button[data-item-id="help"]',
  )
  if (!helpButton) {
    throw new Error('help button missing')
  }
  helpButton.click()
  const dialog = shadowRoot().querySelector<HTMLElement>('[data-a11y-help]')
  if (!dialog) {
    throw new Error('help dialog missing')
  }
  return dialog
}

async function awaitScheme(scheme: string): Promise<void> {
  await vi.waitFor(() => {
    const host = document.querySelector<HTMLElement>('a11y-now-host')
    expect(host?.dataset['a11yScheme']).toBe(scheme)
  })
}

it('the bare fixture page is clean (guards the scans below)', async () => {
  await expect(audit()).resolves.toStrictEqual([])
})

it('mounting the toolbar keeps the page clean (light scheme)', async () => {
  mountToolbar()
  await expect(audit()).resolves.toStrictEqual([])
})

it('the dark scheme passes the same audit', async () => {
  mountToolbar()
  document.documentElement.classList.add('dark')
  await awaitScheme('dark')
  await expect(audit()).resolves.toStrictEqual([])
})

it('the open help dialog is clean in both schemes', async () => {
  mountToolbar()
  openHelpDialog()
  await expect(audit()).resolves.toStrictEqual([])

  document.documentElement.classList.add('dark')
  await awaitScheme('dark')
  await expect(audit()).resolves.toStrictEqual([])
})

it.each(['default', 'deep-blue', 'chocolate', 'high-contrast', 'forest'])(
  'theme %s has readable page and toolbar colors in all button states',
  async name => {
    mountToolbar()
    a11y?.themes.apply(name)
    const host = document.querySelector<HTMLElement>('a11y-now-host')
    if (!host) {
      throw new Error('Toolbar missing')
    }
    async function contrast(): Promise<string[]> {
      const options = {
        runOnly: { type: 'rule' as const, values: ['color-contrast'] },
      }
      const results = await axe.run(document, options)
      const toolbarResults = await axe.run(host as HTMLElement, options)
      return [...results.violations, ...toolbarResults.violations].flatMap(v =>
        v.nodes.map(n => `${n.target.join(' ')}: ${n.failureSummary}`),
      )
    }
    await expect(contrast()).resolves.toStrictEqual([])
    const pin = shadowRoot().querySelector<HTMLButtonElement>(
      '[data-item-id="pin"]',
    )
    if (!pin) {
      throw new Error('Pin missing')
    }
    await userEvent.hover(pin)
    await expect(contrast()).resolves.toStrictEqual([])
    pin.click()
    await expect(contrast()).resolves.toStrictEqual([])
    await userEvent.unhover(pin)
  },
)
