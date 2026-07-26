# 大鼠标

`@a11y-now/plugin-big-cursor` · 快捷键 `Ctrl+Alt+M`

将光标替换为大号高对比 SVG 光标。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { bigCursor } from '@a11y-now/plugin-big-cursor'

createA11yNow({ plugins: [bigCursor()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('big-cursor')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
