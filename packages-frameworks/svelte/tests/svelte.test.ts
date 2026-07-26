import { createA11yNow } from '@a11y-now/core'
import { a11yEventStore } from '@a11y-now/svelte'
import { get } from 'svelte/store'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('a11yEventStore reflects the latest event payload', () => {
  const instance = createA11yNow({ storage: null })
  const store = a11yEventStore(instance, 'theme:change')

  const seen: unknown[] = []
  const stop = store.subscribe(value => {
    seen.push(value)
  })
  instance.events.emit('theme:change', { theme: 'deep-blue' })
  expect(get(store)).toEqual({ theme: 'deep-blue' })
  expect(seen).toEqual([undefined, { theme: 'deep-blue' }])

  stop()
  instance.destroy()
})

it('store unsubscribes from the event bus when released', () => {
  const instance = createA11yNow({ storage: null })
  const store = a11yEventStore(instance, 'theme:change')
  const stop = store.subscribe(() => {})
  stop()
  instance.events.emit('theme:change', { theme: 'x' })
  expect(get(store)).toBeUndefined()
  instance.destroy()
})
