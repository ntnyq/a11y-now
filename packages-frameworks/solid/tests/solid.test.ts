import { createA11yNowSolid, createA11yEventSignal } from '@a11y-now/solid'
import { createRoot } from 'solid-js'
import { beforeEach, expect, it } from 'vitest'

const noopDispose = (): void => {}

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('creates, auto-mounts and disposes with the reactive root', () => {
  let dispose: () => void = noopDispose
  createRoot(d => {
    dispose = d
    const instance = createA11yNowSolid({ storage: null })
    expect(instance.mounted).toBe(true)
    expect(document.querySelector('a11y-now-host')).not.toBeNull()
  })
  dispose()
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('event signal tracks the latest payload', () => {
  createRoot(dispose => {
    const instance = createA11yNowSolid({ autoMount: false, storage: null })
    const payload = createA11yEventSignal(instance, 'theme:change')
    expect(payload()).toBeUndefined()
    instance.events.emit('theme:change', { theme: 'forest' })
    expect(payload()).toStrictEqual({ theme: 'forest' })
    dispose()
  })
})
