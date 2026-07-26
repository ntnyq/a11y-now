# 读屏专用

`@a11y-now/plugin-screen-reader` · 快捷键 `Ctrl+Alt+R`

面向 NVDA/VoiceOver 用户：静默自朗读、隐藏视觉辅助按钮。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { screenReader } from '@a11y-now/plugin-screen-reader'

createA11yNow({ plugins: [screenReader()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('screen-reader')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
