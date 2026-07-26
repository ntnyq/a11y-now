import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { beforeEach, expect, it } from 'vitest'
import { createApp } from 'vue'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('installs, auto-mounts and exposes the instance via inject', () => {
  const app = createApp({ render: () => null })
  app.use(A11yNowPlugin, { storage: null })

  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  const instance = app.runWithContext(() => useA11yNow())
  expect(instance.mounted).toBe(true)

  app.unmount()
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
