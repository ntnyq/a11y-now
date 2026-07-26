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
