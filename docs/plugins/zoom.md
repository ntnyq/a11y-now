# 页面缩放

`@a11y-now/plugin-zoom` · 快捷键 `Ctrl+Alt+= / -`

整页缩放，默认 1.0 ~ 1.3 倍、步长 0.1，可配置。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { zoom } from '@a11y-now/plugin-zoom'

createA11yNow({ plugins: [zoom()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('zoom')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
