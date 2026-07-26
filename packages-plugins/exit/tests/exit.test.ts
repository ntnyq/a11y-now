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
  expect(JSON.parse(raw as string)).toEqual({ disabled: true })

  // Remounting re-enables and clears the flag.
  a11y.mount()
  expect(JSON.parse(storage.get('a11y-now:plugin:exit') as string)).toEqual({
    disabled: false,
  })
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
