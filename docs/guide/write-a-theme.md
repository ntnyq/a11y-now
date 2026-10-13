# 编写主题

主题是**零运行时的纯数据包**（官方包命名 `@a11y-now/theme-*`），用
`@a11y-now/core` 导出的 `defineTheme` 定义：

```ts
import { defineTheme } from '@a11y-now/core'

export const nightOwl = defineTheme({
  displayName: { 'en-US': 'Night Owl', 'zh-CN': '夜枭' },
  name: 'night-owl',
  page: {
    bg: 'rgb(1, 22, 39)',
    fg: 'rgb(214, 222, 235)',
    link: 'rgb(130, 170, 255)',
  },
  toolbar: {
    'color-bg': 'rgb(1, 22, 39)',
    'color-fg': 'rgb(214, 222, 235)',
  },
})
```

## defineTheme

`defineTheme` 是纯类型辅助（identity 函数）：token 键名与值类型在编译期
校验，多写少写立即报错，与 `definePlugin` 一一对应。写单文件主题时直接
内联对象即可；发布独立主题包时，把 `@a11y-now/core` 放进
**devDependencies** 并在 tsdown 配置里加
`deps: { alwaysBundle: [/^@a11y-now\//u] }`——identity 函数会被内联并摇树，产物零
运行时依赖、类型声明自包含（官方 5 个主题包即此形态，产物仅数十行）。

## 使用

```ts
createA11yNow({ plugins: [themeSwitcher()], themes: [defaultTheme, nightOwl] })
// 或
instance.useTheme(nightOwl)
```

## 运行时机制

- 工具栏 token 写入 shadow `:host` 内联样式（`--a11y-<key>`）；
- 页面 token 写入 `documentElement`（`--a11y-page-<key>`），同时设置
  `data-a11y-theme` 属性，由一条可回收的兜底样式命中；
- 切换/还原都是纯变量操作，**不重建样式表**；
- 站点可用 `data-a11y-skip` 属性或主题 `skipSelectors` 将元素排除在
  页面改色之外（验证码、图表、品牌图等）。

详见 [主题与 Token 参考](/themes/)。
