import { regionNav } from '@a11y-now/plugin-region-nav'
import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('installs, auto-mounts and exposes the instance via inject', () => {
  const app = createApp({ render: () => null })
  app.use(A11yNowPlugin, { storage: null })

  expect(document.querySelector('a11y-now-host')).toBeNull()
  const container = document.createElement('div')
  document.body.append(container)
  app.mount(container)
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  const instance = app.runWithContext(() => useA11yNow())
  expect(instance.mounted).toBe(true)

  app.unmount()
  container.remove()
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('autoMount: false defers mounting', () => {
  const app = createApp({ render: () => null })
  app.use(A11yNowPlugin, { autoMount: false, storage: null })
  expect(document.querySelector('a11y-now-host')).toBeNull()

  const instance = app.runWithContext(() => useA11yNow())
  instance.mount()
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  app.unmount()
})

it('useA11yNow throws outside an app with the plugin', () => {
  const app = createApp({ render: () => null })
  expect(() => app.runWithContext(() => useA11yNow())).toThrow(/A11yNowPlugin/u)
})

it('discovers content rendered by the app before mounting plugins', () => {
  const rect = vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, 100, 100))
  const container = document.createElement('div')
  document.body.append(container)
  const app = createApp({
    render: () => h('main', { 'data-a11y-region': 'content' }, 'Article'),
  })
  app.use(A11yNowPlugin, { storage: null, plugins: [regionNav()] })
  app.mount(container)
  const main = container.querySelector('main')
  // happy-dom has no layout; rescan is deliberately not invoked here.
  expect(main).not.toBeNull()
  const instance = app.runWithContext(() => useA11yNow())
  expect(instance.mounted).toBe(true)
  expect(instance.getPlugin('region-nav')?.counts().content).toBe(1)
  rect.mockRestore()
  app.unmount()
  container.remove()
})
