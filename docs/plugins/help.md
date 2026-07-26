# 操作说明

`@a11y-now/plugin-help` · 快捷键 `Ctrl+Alt+?`

可视化快捷键面板，列出当前全部已注册快捷键。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { help } from '@a11y-now/plugin-help'

createA11yNow({ plugins: [help()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('help')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
