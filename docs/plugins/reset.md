# 重置

`@a11y-now/plugin-reset` · 快捷键 `Ctrl+Alt+C`

一键恢复所有插件状态为默认值。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { reset } from '@a11y-now/plugin-reset'

createA11yNow({ plugins: [reset()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('reset')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
