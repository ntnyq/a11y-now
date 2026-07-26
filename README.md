# a11y-now

[![CI](https://github.com/ntnyq/a11y-now/workflows/CI/badge.svg)](https://github.com/ntnyq/a11y-now/actions)
[![NPM VERSION](https://img.shields.io/npm/v/a11y-now.svg)](https://www.npmjs.com/package/a11y-now)
[![NPM DOWNLOADS](https://img.shields.io/npm/dy/a11y-now.svg)](https://www.npmjs.com/package/a11y-now)
[![LICENSE](https://img.shields.io/github/license/ntnyq/a11y-now.svg)](https://github.com/ntnyq/a11y-now/blob/main/LICENSE)

网页无障碍工具栏：插件化 · 可主题化 · 多框架 · 类型安全 · 卸载零残留。

Accessibility toolbar for any website — pluggable, themeable,
framework-agnostic, type-safe, and it leaves no trace on unmount.

## Quick start

```shell
pnpm add a11y-now
```

```ts
import { createA11yNow } from 'a11y-now'

createA11yNow().mount()
```

Or via CDN:

```html
<script src="https://unpkg.com/a11y-now/dist/a11y-now.iife.js"></script>
<script>A11yNow.createA11yNow().mount()</script>
```

## Packages

| 目录 | 内容 |
| --- | --- |
| `packages/` | `@a11y-now/types` · `@a11y-now/shared` · `@a11y-now/core` · `a11y-now`（聚合） |
| `packages-plugins/` | 12 个官方插件 `@a11y-now/plugin-*`（一插件一包） |
| `packages-themes/` | 5 套官方主题 `@a11y-now/theme-*`（零运行时纯数据包） |
| `packages-frameworks/` | `@a11y-now/vue` · `react` · `svelte` · `solid` · `element` |
| `docs/` | VitePress 文档站（含设计资料 design.md / plan.md） |
| `playground/` | vanilla / vue / react 演示应用 |

## Development

```shell
pnpm install
pnpm build        # 构建全部包
pnpm test         # vitest projects 聚合各包 tests/
pnpm typecheck    # tsgo
pnpm docs:dev     # 文档站
pnpm --filter playground-vanilla dev
```

## License

[MIT](./LICENSE) License © 2026-PRESENT [ntnyq](https://github.com/ntnyq)
