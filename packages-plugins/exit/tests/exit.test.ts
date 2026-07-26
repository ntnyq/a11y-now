import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { exit } from '@a11y-now/plugin-exit'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('unmounts the toolbar and persists the exited flag', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(exit())
  a11y.mount()
  expect(a11y.mounted).toBe(true)

  a11y.getPlugin('exit')?.exit()
  expect(a11y.mounted).toBe(false)
  expect(document.querySelector('a11y-now-host')).toBeNull()

  const raw = storage.get('a11y-now:plugin:exit')
  expect(JSON.parse(raw as string)).toStrictEqual({ disabled: true })

  // Exit persists the kernel-level disable: a plain mount() stays hidden…
  a11y.mount()
  expect(a11y.mounted).toBe(false)
  expect(storage.get('a11y-now:enabled')).toBe('false')

  // …while an explicit enable revives the toolbar and clears the flag.
  a11y.setEnabled(true)
  expect(a11y.mounted).toBe(true)
  expect(
    JSON.parse(storage.get('a11y-now:plugin:exit') as string),
  ).toStrictEqual({ disabled: false })
  a11y.unmount()
})

it('Ctrl+Alt+E exits and leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(exit())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'e' }),
  )
  expect(a11y.mounted).toBe(false)
  expect(document.documentElement.outerHTML).toBe(before)
})
