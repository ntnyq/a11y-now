# 配色切换

`@a11y-now/plugin-theme` · 快捷键 `Ctrl+Alt+T`

循环切换已注册的主题包，纯 CSS 变量操作。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { themeSwitcher } from '@a11y-now/plugin-theme'

createA11yNow({ plugins: [themeSwitcher()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('theme')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
