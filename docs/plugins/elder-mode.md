# 关怀版

`@a11y-now/plugin-elder-mode` · 快捷键 `Ctrl+Alt+O` · **可选扩展包**

面向老年用户的关怀模式：为正文元素设置字号下限（`max(1em, 18px)`，
经由父级解析、不会嵌套放大）、放宽行距与字距、为链接加下划线、加粗聚焦
轮廓。不使用整页缩放，因此不与[页面缩放](/plugins/zoom)插件冲突。

开启时 `<html>` 会带上 `a11y-elder` 类，站点可据此追加自己的关怀样式。

## 使用

```ts
import { elderMode } from '@a11y-now/plugin-elder-mode'
import { createA11yNow } from 'a11y-now'

createA11yNow({ plugins: [elderMode()] }).mount()
```

## 选项

| 选项          | 默认  | 说明               |
| ------------- | ----- | ------------------ |
| `minFontSize` | `18`  | 正文字号下限（px） |
| `lineHeight`  | `1.6` | 行距               |

## Api

```ts
const api = instance.getPlugin('elder-mode')
api?.toggle()
api?.isEnabled()
```
