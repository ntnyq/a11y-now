# 主题与 Token 参考

主题用 `@a11y-now/core` 的 `defineTheme` 定义（编译期校验 token 键名与
值类型），官方主题包经构建内联保持零运行时依赖，见[编写主题](/guide/write-a-theme)。

## 官方主题（对齐源页面五套配色）

| 主题包                          | 显示名   | 色板（背景/文字/链接）                                                                                                                                                                                                                                                                                                                                              | 页面背景       | 文字   | 链接           |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ | -------------- |
| `@a11y-now/theme-default`       | 默认     | —                                                                                                                                                                                                                                                                                                                                                                   | 不改动         | 不改动 | 不改动         |
| `@a11y-now/theme-deep-blue`     | 深蓝白   | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(0,51,92)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span>   | rgb(0,51,92)   | 白     | 白             |
| `@a11y-now/theme-chocolate`     | 巧克力色 | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(98,43,43)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span>  | rgb(98,43,43)  | 白     | 白             |
| `@a11y-now/theme-high-contrast` | 黑底白字 | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(0,0,0)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(255,184,0)"></span>                  | rgb(0,0,0)     | 白     | rgb(255,184,0) |
| `@a11y-now/theme-forest`        | 森林绿   | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(34,139,34)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> | rgb(34,139,34) | 白     | 白             |

## 工具栏 Token（`--a11y-*`，作用于 shadow :host）

| Token                 | 默认值         | 用途                                  |
| --------------------- | -------------- | ------------------------------------- |
| `color-bg`            | #ffffff        | 工具栏背景                            |
| `color-fg`            | #1f2329        | 工具栏文字                            |
| `color-accent`        | #0b5cad        | 强调色                                |
| `color-border`        | #d0d3d6        | 边框                                  |
| `color-btn-hover-bg`  | #f2f3f5        | 按钮悬停背景                          |
| `color-btn-active-bg` | #e8f3ff        | 按钮激活背景                          |
| `color-btn-active-fg` | #0b5cad        | 按钮激活文字                          |
| `color-disabled-fg`   | #a8abb0        | 禁用文字                              |
| `color-focus-ring`    | #fcff00        | 焦点描边色                            |
| `toolbar-height`      | 84px           | 工具栏高度                            |
| `btn-size`            | 56px           | 按钮尺寸                              |
| `font-size`           | 14px           | 字号                                  |
| `font-size-caption`   | 42px           | 大字幕字号                            |
| `radius`              | 6px            | 圆角                                  |
| `outline-width`       | 3px            | 焦点描边宽度                          |
| `z-index`             | 2147483000     | 层级                                  |
| `transition`          | 120ms ease-out | 动效（prefers-reduced-motion 时为 0） |

## 页面 Token（`--a11y-page-*`，作用于 documentElement）

| Token            | 默认值            | 用途              |
| ---------------- | ----------------- | ----------------- |
| `bg`             | （空）            | 页面背景          |
| `fg`             | （空）            | 页面文字          |
| `link`           | （空）            | 链接颜色          |
| `region-outline` | 2px solid #ff6c00 | 区域高亮描边      |
| `focus-outline`  | 3px solid #fcff00 | 焦点描边          |
| `cursor-color`   | #ffd700           | 大鼠标/十字线主色 |

## 硬性规范

组件样式**只允许引用语义 token**，不写死颜色/尺寸；主题切换只改变量值。
这保证任何第三方主题都能完整地重新着色工具栏与页面。
