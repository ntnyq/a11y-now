# 固定

`@a11y-now/plugin-pin` · 快捷键 `Ctrl+Alt+L`

切换工具栏是否为页面让位（body 上边距）。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { pin } from '@a11y-now/plugin-pin'

createA11yNow({ plugins: [pin()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('pin')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
