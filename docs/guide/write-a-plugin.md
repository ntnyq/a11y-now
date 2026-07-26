# 编写插件

一个完整的第三方插件（命名约定 `a11y-now-plugin-*`）：

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

## 必须遵守的约定

1. **所有页面改动走 `ctx.dom`**，保证卸载零残留；
2. **样式只引用 `--a11y-*` 语义 token**，不写死颜色和尺寸；
3. `dispose` 中移除自己创建的按钮、监听与样式；
4. 快捷键经 `ctx.shortcuts.register` 注册（自动冲突检测）；
5. 文案经 `plugin.messages` 声明并用 `ctx.i18n.t()` 取用。

## 测试模板

每个插件包的 `tests/` 应覆盖：注册 → 激活 → DOM 效果断言 →
快捷键触发 → 持久化恢复 → 卸载无残留（outerHTML 快照对比）。
