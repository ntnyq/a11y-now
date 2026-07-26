# 区域导航

`@a11y-now/plugin-region-nav` · 快捷键 `Alt+1 ~ Alt+6`

扫描页面并把内容归入视窗/导航/交互/服务/列表/正文六类区域，带计数与循环访问。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { regionNav } from '@a11y-now/plugin-region-nav'

createA11yNow({ plugins: [regionNav()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('region-nav')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
