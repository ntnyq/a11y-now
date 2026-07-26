import { createA11yNow } from '@a11y-now/core'
import { regionNav } from '@a11y-now/plugin-region-nav'
import { beforeEach, expect, it } from 'vitest'

const PAGE = `
  <header><h1>站点</h1></header>
  <nav><a href="#a">链接A</a><a href="#b">链接B</a></nav>
  <main><article><p>正文内容</p></article></main>
  <form><input aria-label="搜索" /></form>
  <aside>侧栏</aside>
  <footer>底部</footer>
  <ul><li>一</li><li>二</li><li>三</li></ul>
`

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = PAGE
  // happy-dom reports zero rects; make elements "visible" for the scanner
  Element.prototype.getBoundingClientRect = () =>
    ({ height: 10, width: 10 }) as DOMRect
})

it('scans regions, reports counts and disables empty ones', () => {
  const a11y = createA11yNow({ storage: null }).use(regionNav())
  a11y.mount()
  const counts = a11y.getPlugin('region-nav')?.counts()

  expect(counts?.window).toBe(1)
  expect(counts?.nav).toBe(1)
  expect(counts?.interactive).toBe(1)
  expect(counts?.service).toBe(2)
  expect(counts?.list).toBe(1)
  // main + article both classify as content.
  expect(counts?.content).toBe(2)

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const navBtn = shadow?.querySelector(
    '[data-item-id="region-nav"]',
  ) as HTMLButtonElement
  expect(navBtn.disabled).toBe(false)
  expect(navBtn.textContent).toContain('(1)')
  a11y.unmount()
})

it('enter cycles elements with outline marker, Escape clears', () => {
  const a11y = createA11yNow({ storage: null }).use(regionNav())
  a11y.mount()
  const api = a11y.getPlugin('region-nav')

  api?.enter('service')
  const aside = document.querySelector('aside') as HTMLElement
  const footer = document.querySelector('footer') as HTMLElement
  expect(aside.classList.contains('a11y-region-current')).toBe(true)

  api?.enter('service')
  expect(aside.classList.contains('a11y-region-current')).toBe(false)
  expect(footer.classList.contains('a11y-region-current')).toBe(true)

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(footer.classList.contains('a11y-region-current')).toBe(false)
  a11y.unmount()
})

it('respects data-a11y-region override and Alt+N shortcuts', () => {
  document.body.innerHTML = '<div data-a11y-region="content">手动标注</div>'
  const a11y = createA11yNow({ storage: null }).use(regionNav())
  a11y.mount()
  expect(a11y.getPlugin('region-nav')?.counts().content).toBe(1)

  window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: '6' }))
  const tagged = document.querySelector('[data-a11y-region]') as HTMLElement
  expect(tagged.classList.contains('a11y-region-current')).toBe(true)
  a11y.unmount()
})

it('unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(regionNav())
  a11y.mount()
  a11y.getPlugin('region-nav')?.enter('nav')
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
