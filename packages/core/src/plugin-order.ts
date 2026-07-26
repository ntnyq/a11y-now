import type { A11yPlugin, A11yPluginInput } from '@a11y-now/types'

/* eslint-disable typescript/no-explicit-any -- heterogeneous plugin registry */
export interface Registered {
  options: any
  plugin: A11yPlugin<any, any, any>
}
/* eslint-enable typescript/no-explicit-any */

export const normalizeInput = (input: A11yPluginInput): Registered =>
  'plugin' in input
    ? { options: input.options, plugin: input.plugin }
    : { options: undefined, plugin: input }

/** Topological sort by `dependsOn`, keeping registration order otherwise. */
export const sortPlugins = (registered: Registered[]): Registered[] => {
  const byName = new Map(registered.map(item => [item.plugin.name, item]))
  const sorted: Registered[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  const visit = (item: Registered): void => {
    const { name } = item.plugin
    if (visited.has(name)) {
      return
    }
    if (visiting.has(name)) {
      throw new Error(`[a11y-now] circular plugin dependency around "${name}"`)
    }
    visiting.add(name)
    for (const dep of item.plugin.dependsOn ?? []) {
      const found = byName.get(dep)
      if (!found) {
        throw new Error(
          `[a11y-now] plugin "${name}" depends on missing plugin "${dep}"`,
        )
      }
      visit(found)
    }
    visiting.delete(name)
    visited.add(name)
    sorted.push(item)
  }

  for (const item of registered) {
    visit(item)
  }
  return sorted
}
