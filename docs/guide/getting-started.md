# 快速开始

## 安装

::: code-group

```shell [pnpm]
pnpm add a11y-now
```

```shell [npm]
npm install a11y-now
```

:::

## 一行接入（全量预设）

```ts
import { createA11yNow } from 'a11y-now'

createA11yNow().mount()
```

这会挂载包含全部 12 个官方插件与 5 套主题的工具栏。

## CDN 接入

```html
<script src="https://unpkg.com/a11y-now/dist/a11y-now.iife.js"></script>
<script>
  A11yNow.createA11yNow().mount()
</script>
```

## 按需组装

```ts
import { createA11yNow } from '@a11y-now/core'
import { themeSwitcher } from '@a11y-now/plugin-theme'
import { zoom } from '@a11y-now/plugin-zoom'
import { deepBlue } from '@a11y-now/theme-deep-blue'
import { defaultTheme } from '@a11y-now/theme-default'

createA11yNow({
  plugins: [zoom({ max: 1.5 }), themeSwitcher()],
  themes: [defaultTheme, deepBlue],
}).mount()
```

## 尊重用户的退出选择

```ts
import { createA11yNow, wasExited } from 'a11y-now'

if (!wasExited()) {
  createA11yNow().mount()
}
```

## 默认禁用与触发按钮

`enabled: false` 时 `mount()` 只记录意图、不实际挂载,配合
`toggleEnabled()` 可以做出「点击悬浮按钮再展开工具栏」的接入形态
(本文档站即此形态)。用户的开关选择会持久化,优先于 `enabled` 默认值;
工具栏内的「退出服务」同样会持久化关闭,再次点击触发按钮即可复活:

```ts
import { createA11yNow } from 'a11y-now'

const a11y = createA11yNow({ enabled: false })
a11y.mount() // 首次不显示;若用户上次开过,则直接显示

trigger.addEventListener('click', () => {
  a11y.toggleEnabled() // 显示 ⇄ 隐藏,返回新的显示状态
})
```

## 自定义快捷键

所有快捷键都在 shortcut center 集中注册,可按 id 覆写或禁用
(id 见「操作说明」面板对应功能,如 `zoom-in` / `help` / `spacing`):

```ts
createA11yNow({
  shortcutOverrides: {
    'zoom-in': { key: '9' }, // Ctrl+Alt+= → Ctrl+Alt+9
    help: null, // 禁用该快捷键(按钮仍可点击)
  },
}).mount()

// 运行时改绑:局部覆写合并到默认值上,{} 还原默认
instance.shortcuts.setOverride('zoom-in', { key: '0' })
```

覆写后的组合会自动出现在「操作说明」面板;与其他快捷键冲突时立即抛错。

## 明暗配色

工具栏自身默认 `colorScheme: 'auto'`——跟随宿主页面的明暗:依次探测显式的
`color-scheme` 计算值、`<html>`/`<body>` 上的 `dark`/`light` class 与
`data-theme` / `data-color-mode` / `data-color-scheme` 标记、页面背景亮度,
最后回退到系统 `prefers-color-scheme`。站点切换主题(如 VitePress 的
`.dark` class)会实时跟随,零配置。也可固定或在运行时切换:

```ts
createA11yNow({ colorScheme: 'dark' }).mount() // 固定暗色

instance.setColorScheme('light') // 'light' | 'dark' | 'auto'
instance.resolvedColorScheme // 当前生效值:'light' | 'dark'
instance.events.on('scheme:change', ({ scheme }) => console.log(scheme))
```

暗色工具栏的全部文本/背景对比度均通过 WCAG AA;应用任意无障碍主题
(如深蓝白)时,主题 token 始终优先于明暗方案。

## 界面语言

工具栏内置简体中文与英文文案,默认跟随 `<html lang>`(`en*` 匹配英文、
`zh*` 匹配中文,其余回退中文),也可显式指定或自带语言包:

```ts
createA11yNow({ locale: 'en' }).mount()

createA11yNow({
  locale: 'fr-FR',
  messages: { 'fr-FR': { 'toolbar.label': "Barre d'accessibilité" } },
}).mount()
```

## 预设

| 预设                   | 内容                                                |
| ---------------------- | --------------------------------------------------- |
| `fullPreset()`         | 全部 12 插件 + 5 主题（默认）                       |
| `readingPreset()`      | 低视力阅读向：语音/配色/缩放/大鼠标/十字线/大字幕等 |
| `screenReaderPreset()` | 读屏向：区域导航 + 读屏专用 + 说明 + 退出           |
