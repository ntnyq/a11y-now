# Write a plugin

A complete third-party plugin (naming convention `a11y-now-plugin-*`):

```ts
import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface HighlightLinksApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface State {
  enabled: boolean
  [key: string]: boolean
}

const plugin = definePlugin<undefined, HighlightLinksApi, State>({
  messages: {
    'en-US': { 'hl.label': 'Highlight links' },
    'zh-CN': { 'hl.label': '链接高亮' },
  },
  name: 'highlight-links',
  setup: ctx => {
    let dispose: (() => void) | null = null

    const apply = (enabled: boolean) => {
      if (enabled) {
        dispose = ctx.dom.injectStyle(
          'highlight-links',
          'a { outline: var(--a11y-page-focus-outline) !important; }',
        )
      } else {
        dispose?.()
        dispose = null
      }
    }

    const toggle = () => {
      const next = !ctx.state.get('enabled')
      ctx.state.set('enabled', next)
      apply(next)
      button.update({ pressed: next })
    }

    const button = ctx.ui.addItem({
      group: 'tool',
      id: 'highlight-links',
      label: () => ctx.i18n.t('hl.label'),
      onPress: toggle,
      pressed: ctx.state.get('enabled'),
    })

    if (ctx.state.get('enabled')) {
      apply(true)
    }

    return {
      api: { isEnabled: () => ctx.state.get('enabled'), toggle },
      dispose: () => {
        dispose?.()
        button.remove()
      },
    }
  },
  state: { enabled: false },
})

export const highlightLinks = (): ConfiguredPlugin<
  undefined,
  HighlightLinksApi,
  State
> => configurePlugin(plugin, undefined)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'highlight-links': HighlightLinksApi
  }
}
```

## Non-negotiable conventions

1. **Every page mutation goes through `ctx.dom`** so unmount leaves zero residue;
2. **Styles reference only the `--a11y-*` semantic tokens** — no hard-coded colors or sizes;
3. `dispose` removes every button, listener and style the plugin created;
4. Shortcuts register through `ctx.shortcuts.register` (automatic conflict detection);
5. Copy is declared in `plugin.messages` and read through `ctx.i18n.t()` — ship `en-US` and `zh-CN` tables with matching keys.

## Test template

Each plugin package's `tests/` should cover: registration → activation →
DOM effect assertions → shortcut triggering → persistence restore →
zero-residue unmount (outerHTML snapshot comparison).
