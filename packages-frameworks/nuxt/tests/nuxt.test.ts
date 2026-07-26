import { beforeEach, expect, it } from 'vitest'
import a11yNowModule from '../src/module'
import type { NuxtLike } from '../src/module'
import a11yNowPlugin from '../src/runtime/plugin.client'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  localStorage.clear()
})

it('module merges configKey and inline options, registers the client plugin', () => {
  const nuxt: NuxtLike = {
    options: {
      a11yNow: { locale: 'en-US', preset: 'screen-reader' },
      plugins: [],
      runtimeConfig: { public: {} },
    },
  }
  a11yNowModule({ preset: 'reading' }, nuxt)

  expect(nuxt.options.runtimeConfig.public['a11yNow']).toStrictEqual({
    autoMount: true,
    locale: 'en-US',
    preset: 'reading',
    respectExit: true,
  })
  const entry = nuxt.options.plugins?.[0]
  expect(entry).toMatchObject({ mode: 'client' })
  expect(
    typeof entry === 'object' && entry.src.endsWith('runtime/plugin.client.js'),
  ).toBe(true)
  expect(a11yNowModule.meta).toStrictEqual({
    configKey: 'a11yNow',
    name: '@a11y-now/nuxt',
  })
})

it('runtime plugin mounts the toolbar and provides the instance', () => {
  const result = a11yNowPlugin({
    $config: { public: { a11yNow: { preset: 'reading' } } },
  })
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  expect(result.provide.a11yNow.mounted).toBe(true)
  result.provide.a11yNow.destroy()
})

it('runtime plugin honors a previous exit but still provides', () => {
  localStorage.setItem(
    'a11y-now:plugin:exit',
    JSON.stringify({ disabled: true }),
  )
  const result = a11yNowPlugin({ $config: { public: { a11yNow: {} } } })
  expect(document.querySelector('a11y-now-host')).toBeNull()
  expect(result.provide.a11yNow.mounted).toBe(false)
  result.provide.a11yNow.destroy()
})

it('runtime plugin respects autoMount: false', () => {
  const result = a11yNowPlugin({
    $config: { public: { a11yNow: { autoMount: false } } },
  })
  expect(document.querySelector('a11y-now-host')).toBeNull()
  // Manual mount still works through the provided instance.
  result.provide.a11yNow.mount()
  expect(document.querySelector('a11y-now-host')).not.toBeNull()
  result.provide.a11yNow.destroy()
})
