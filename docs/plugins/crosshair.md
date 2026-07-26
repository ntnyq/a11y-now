# 十字线

`@a11y-now/plugin-crosshair` · 快捷键 `Ctrl+Alt+N`

跟随鼠标的阅读定位线，帮助低视力用户对准行。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { crosshair } from '@a11y-now/plugin-crosshair'

createA11yNow({ plugins: [crosshair()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('crosshair')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
