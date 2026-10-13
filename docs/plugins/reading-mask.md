# 阅读遮罩

`@a11y-now/plugin-reading-mask` · 快捷键 `Ctrl+Alt+G` · **可选扩展包**

将页面压暗,只保留一条跟随鼠标的水平透明条带,帮助低视力与阅读障碍
用户锁定当前行。遮罩层渲染在工具栏 Shadow DOM 内、`pointer-events: none`,
不遮挡交互也不改动页面 DOM。

## 使用

```ts
import { readingMask } from '@a11y-now/plugin-reading-mask'
import { createA11yNow } from 'a11y-now'

createA11yNow({ plugins: [readingMask()] }).mount()
```

## 选项

| 选项     | 默认                 | 说明               |
| -------- | -------------------- | ------------------ |
| `height` | `120`                | 透明条带高度（px） |
| `color`  | `rgba(0, 0, 0, 0.5)` | 条带上下的遮罩颜色 |

## Api

```ts
const api = instance.getPlugin('reading-mask')
api?.toggle()
api?.isEnabled()
```
