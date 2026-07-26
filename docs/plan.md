# a11y-now 实现计划与代码设计

> 目标：参考 [知乎无障碍工具栏审查报告](./design.md)，实现一个**插件化、多框架支持、类型安全、测试完备、易扩展**的网页无障碍工具栏产品。
> npm scope：`@a11y-now/*`，另保留非 scope 包 `a11y-now` 作为开箱即用的聚合入口。
> 本文档基于仓库现有基础结构（pnpm workspace + tsdown + tsgo + oxlint/oxfmt + vitest + bumpp）制定。
>
> **修订记录**：v2 —— 框架适配迁至 `packages-frameworks/`，插件改为一包一实现迁至 `packages-plugins/`，主题独立为 `packages-themes/`；样式体系明确为 CSS 变量驱动。

## 1. 产品定义

一行代码为任意网站接入无障碍工具栏：

```ts
import { createA11yNow } from 'a11y-now'

createA11yNow().mount()
```

对标源页面（知乎/世纪大家工具条）的能力，但以现代方案重新实现：

| 能力 | 源页面做法 | a11y-now 方案 |
| --- | --- | --- |
| 样式隔离 | 自定义标签（`<ariaul>` 等）+ 全量 `ariaskiptheme` 标记 | **Shadow DOM**，天然隔离，双向不污染 |
| 挂载位置 | `<html>` 直接子节点，`.noscale` 反缩放 | 同样挂 `<html>` 下（躲开 body 的 transform/zoom），宿主为自定义元素 `<a11y-now-host>` |
| 换肤 | 动态生成百 KB 级覆盖式 `<style>` | **CSS 变量（Design Tokens）**，切主题只改变量值，不重建样式表 |
| 语音 | 服务端 TTS（service.govwza.cn） | 默认 Web Speech API（零依赖、离线），`SpeechEngine` 接口可替换为远端 TTS |
| 区域导航 | 私有六区分类 | 基于 ARIA landmark + 启发式扫描，输出同样的「区域 + 计数 + 快捷键循环」交互 |
| 状态持久化 | 每功能一个 Cookie + localStorage 缓存配置 | 统一 `StorageAdapter`（默认 localStorage，版本化 schema，跨 Tab 同步） |
| 功能组织 | 单体脚本 | **插件系统**，每个功能一个插件包，核心零内置业务 |

## 2. Monorepo 结构

按领域分四个包目录：`packages/`（核心域）、`packages-frameworks/`（框架适配域）、`packages-plugins/`（插件域）、`packages-themes/`（主题域）。

```
a11y-now/
├── package.json                    # 私有 workspace 根（改 private: true，不再直接发布）
├── pnpm-workspace.yaml             # packages: docs, packages/*, packages-frameworks/*,
│                                   #           packages-plugins/*, packages-themes/*, playground/*
├── tsconfig.json                   # 根配置，各包 extends
├── tsdown.config.ts                # 基础构建配置，各包按需覆盖
├── vitest.config.ts                # 根配置：projects 聚合各包 tests
├── docs/                           # VitePress 文档站（workspace 成员）
│   ├── .vitepress/config.ts
│   ├── index.md                    # 首页
│   ├── guide/                      # 快速开始 / 核心概念 / 编写插件 / 编写主题
│   ├── plugins/                    # 插件包逐个文档
│   ├── themes/                     # 主题包文档 + token 参考
│   ├── frameworks/                 # vue / react / svelte / solid / element
│   ├── design.md                   # 已有：源页面审查报告（归入「设计资料」）
│   └── plan.md                     # 本文档
├── packages/                       # ── 核心域 ──
│   ├── types/                      # @a11y-now/types      纯类型，零运行时
│   ├── shared/                     # @a11y-now/shared     内部工具函数（dom/keyboard/css）
│   ├── core/                       # @a11y-now/core       内核（见 §3.2）
│   └── a11y-now/                   # a11y-now             聚合包：core + 全部官方插件/主题 + 预设，含 IIFE
├── packages-frameworks/            # ── 框架适配域（自 packages/ 迁移 vue、react）──
│   ├── vue/                        # @a11y-now/vue        Vue 3 适配
│   ├── react/                      # @a11y-now/react      React 18+ 适配
│   ├── svelte/                     # @a11y-now/svelte     Svelte 5 适配
│   ├── solid/                      # @a11y-now/solid      Solid 适配
│   └── element/                    # @a11y-now/element    Web Component <a11y-now>（无构建/任意栈可用）
├── packages-plugins/               # ── 插件域：一插件一包 ──
│   ├── region-nav/                 # @a11y-now/plugin-region-nav      区域导航 ALT+1~6
│   ├── speech/                     # @a11y-now/plugin-speech          声音/语速/指读连读
│   ├── screen-reader/              # @a11y-now/plugin-screen-reader   读屏专用模式
│   ├── theme/                      # @a11y-now/plugin-theme           配色切换器（消费主题包）
│   ├── zoom/                       # @a11y-now/plugin-zoom            放大/缩小
│   ├── big-cursor/                 # @a11y-now/plugin-big-cursor      大鼠标
│   ├── crosshair/                  # @a11y-now/plugin-crosshair       十字线
│   ├── caption/                    # @a11y-now/plugin-caption         大字幕
│   ├── reset/                      # @a11y-now/plugin-reset           重置
│   ├── pin/                        # @a11y-now/plugin-pin             固定工具栏
│   ├── help/                       # @a11y-now/plugin-help            操作说明
│   └── exit/                       # @a11y-now/plugin-exit            退出服务
├── packages-themes/                # ── 主题域：一主题一包（对齐源页面 5 套配色）──
│   ├── default/                    # @a11y-now/theme-default          默认（不改页面配色）
│   ├── deep-blue/                  # @a11y-now/theme-deep-blue        深蓝白
│   ├── chocolate/                  # @a11y-now/theme-chocolate        巧克力色
│   ├── high-contrast/              # @a11y-now/theme-high-contrast    黑底白字（黄链接）
│   └── forest/                     # @a11y-now/theme-forest           森林绿
├── playground/                     # 各框架演示/联调应用（vite，不发布）
│   ├── vanilla/
│   ├── vue/
│   └── react/
└── tests/                          # 根 tests 保留跨包集成测试
```

包依赖关系（单向，禁止反向依赖）：

```
types ← shared ← core ← packages-plugins/*（definePlugin 来自 core）
types ←──────────────── packages-themes/*（纯 token 数据，仅依赖 types，零运行时）
core  ←──────────────── packages-frameworks/*（只依赖 core，插件/主题由用户自选）
core + 全部官方插件 + 全部官方主题 ← a11y-now 聚合包
```

命名与拆分约定：

- **插件一包一实现**，命名 `@a11y-now/plugin-<name>`，目录名不带前缀（`packages-plugins/zoom`）；第三方生态插件约定 `a11y-now-plugin-*`。依赖较重的能力（拼音标注、简繁转换）不进官方首发清单，作为独立可选包在 Phase 3 提供。
- **主题一包一实现**，命名 `@a11y-now/theme-<name>`；主题包是纯数据包（token 集合），不含逻辑，第三方约定 `a11y-now-theme-*`。
- **`a11y-now` 聚合包**面向「一行代码接入」用户，额外产出 IIFE 供 `<script>` 直接引用（源页面即此接入方式）；`@a11y-now/*` 面向按需组装的用户。
- 所有官方包 lockstep 同版本发布（`bumpp -r`），降低版本矩阵认知成本。

## 3. 核心代码设计

### 3.1 @a11y-now/types：类型即契约

```ts
/** 插件定义（对外扩展的唯一入口） */
export interface A11yPlugin<Options = void, Api = unknown> {
  name: string
  /** 依赖的其他插件（按名声明，内核做拓扑排序与缺失校验） */
  dependsOn?: string[]
  /** 工具栏按钮描述，省略则为无 UI 的后台插件 */
  toolbar?: ToolbarItemDef
  /** 默认快捷键，用户可覆盖；内核负责冲突检测 */
  shortcut?: ShortcutDef
  /** 需要持久化的状态 schema（含默认值与版本迁移） */
  state?: StateSchema
  /** 安装钩子：返回插件 Api（对外暴露）与清理函数 */
  setup: (ctx: PluginContext<Options>) => PluginSetupResult<Api>
}

/** setup 收到的内核服务集合 —— 插件与内核交互的全部界面 */
export interface PluginContext<Options> {
  options: Options
  ui: ToolbarUI            // 注册按钮/更新状态文案（同步 title 与 aria-label）
  state: ScopedState       // 本插件的响应式持久化状态
  events: EventBus         // 类型化事件总线
  speech: SpeechService    // speak/stop/rate，读屏模式下自动静默
  i18n: I18nService        // t(key)，随语言切换
  shortcuts: ShortcutService
  dom: DomService          // 对页面的安全操作：注入样式、扫描区域、标记高亮
  theme: ThemeService      // 读取/设置 CSS 变量 token（见 §4）
  storage: StorageAdapter
}

/** 主题定义：纯数据，token 键类型化（见 §4 token 清单） */
export interface A11yTheme {
  name: string
  displayName: Record<LocaleCode, string>
  /** 工具栏自身 UI 的 token 覆盖（作用于 shadow :host） */
  toolbar?: Partial<ToolbarTokens>
  /** 页面改色 token（作用于 documentElement），default 主题为空对象 */
  page?: Partial<PageTokens>
  /** 换肤时跳过的选择器（验证码/图片/表单控件等），合并进全局白名单 */
  skipSelectors?: string[]
}

/** 事件与注册表通过 module augmentation 扩展，保证跨包类型安全 */
export interface A11yEventMap {
  'toolbar:mounted': { host: HTMLElement }
  'plugin:activated': { name: string }
  'theme:change': { theme: string }
  // 插件包内: declare module '@a11y-now/types' { interface A11yEventMap { 'zoom:change': { scale: number } } }
}
export interface A11yPluginRegistry {}
// 插件包内: interface A11yPluginRegistry { zoom: ZoomApi }
// 于是 instance.getPlugin('zoom') 返回 ZoomApi，拼错包名直接编译报错
```

类型安全的关键手段：`A11yEventMap` / `A11yPluginRegistry` 双注册表 + 泛型 `definePlugin` / `defineTheme`，让「事件名、插件名、插件 Api、持久化状态、主题 token 键」全部走编译期检查；`tsconfig` 沿用 `@ntnyq/tsconfig/strict.json`，公共 API 不出现 `any`。

### 3.2 @a11y-now/core：内核

```ts
export function createA11yNow(options?: A11yNowOptions): A11yNowInstance

export interface A11yNowInstance {
  use<O, A>(plugin: A11yPlugin<O, A>, options?: O): this   // 链式注册插件
  useTheme(theme: A11yTheme): this                          // 注册主题
  mount(target?: Element): void                             // 默认挂 <html> 下 + ShadowRoot
  unmount(): void                                           // 完整清理（样式、监听、注入元素）
  getPlugin<K extends keyof A11yPluginRegistry>(name: K): A11yPluginRegistry[K]
  state: ReadonlyState
  on / off / emit                                           // 类型化事件
  destroy(): void
}
```

内核职责（也是与插件的边界）：

1. **挂载与样式隔离**：创建 `<a11y-now-host>` 自定义元素挂到 `<html>` 下，内部 `attachShadow`；工具栏全部 UI 与样式（Constructable StyleSheets）都在 shadow 内。对页面的注入样式统一经 `dom.injectStyle()` 登记，unmount 时可全量回收——源页面「退出服务恢复原貌」的能力由内核兜底。
2. **插件系统**：注册 → 依赖拓扑排序 → setup → mount 后 activate；每个插件的返回值中必须包含 `dispose`，保证可卸载。
3. **ThemeService**：主题注册表 + token 应用/回收（实现细节见 §4）。
4. **响应式状态**：内核自带极简 signal store（零依赖，`get/set/subscribe`），插件状态按 `state` schema 自动持久化与恢复（对应源页面逐项 Cookie 的做法），`storage` 事件实现跨 Tab 同步。
5. **快捷键中心**：默认延续源页面心智——功能键 `Ctrl+Alt+*`、区域键 `Alt+数字`；注册时做冲突检测，全部可配置、可禁用。
6. **i18n**：内置 `zh-CN` / `en-US`，key 类型化（沿用源页面「229 条话术表」的思路，把 ARIA role → 本地化读法映射也放这里）。
7. **SpeechService**：接口化，默认实现基于 `speechSynthesis`；预留 `RemoteTTSEngine` 接口（源页面的服务端 TTS 模式）。
8. **工具栏自身的可访问性**（源页面做得好的照搬，做得差的补齐）：`role="toolbar"` + roving tabindex、每个按钮 `aria-pressed`/`aria-label` 随状态实时更新（对应源页面的动态 title）、进入引导锚点（对应 `#ariaTipText`）、`prefers-reduced-motion` / `prefers-contrast` 适配。

### 3.3 packages-plugins/*：官方插件清单

与审查报告逐项对应，一插件一包，独立测试、独立文档：

| 包 | 对应源功能 | 说明 |
| --- | --- | --- |
| `plugin-region-nav` | 六区导航 ALT+1~6 | landmark + 启发式扫描、计数、置灰、循环访问、高亮描边（描边色走 `--a11y-page-region-outline` token） |
| `plugin-speech` | 声音开关/语速/阅读方式 | 指读（hover 朗读）与连读两种模式，语速 1~3 档 |
| `plugin-screen-reader` | 读屏专用 | 静默自朗读、隐藏视觉辅助类插件（插件可声明 `hideInScreenReaderMode`） |
| `plugin-theme` | 配色 | 切换器本体：注入主题循环按钮，消费 `useTheme()` 注册的主题包；`dependsOn` 无，主题为空时按钮置灰 |
| `plugin-zoom` | 放大/缩小 | 可配置区间与步长（默认 1.0~1.3 / 0.1） |
| `plugin-big-cursor` | 鼠标样式 | 内置 SVG data-URL 大光标，颜色取 `--a11y-cursor-color` |
| `plugin-crosshair` | 十字线 | 阅读定位线，requestAnimationFrame 跟随，颜色/线宽走 token |
| `plugin-caption` | 大字幕 | 底部字幕条，联动 speech 的朗读文本，字号/配色走 token |
| `plugin-reset` | 重置 | 调用内核 state 全量重置 |
| `plugin-pin` | 固定 | 工具栏固定/悬浮 |
| `plugin-help` | 说明 | 可视化快捷键面板 + 可选语音播报（比源页面「纯语音无反馈」更友好） |
| `plugin-exit` | 退出服务 | unmount + 持久化关闭标记 |

预设放在聚合包 `a11y-now` 内：`presets/full`（全插件 + 全主题，默认）、`presets/reading`（低视力阅读向）、`presets/screen-reader`（读屏向）。

### 3.4 packages-frameworks/*：框架适配层

各适配包只做三件事：桥接生命周期、桥接响应式、透传类型。核心逻辑零重复。

```ts
// @a11y-now/vue —— app.use + 组合式
app.use(A11yNowPlugin, { plugins: [zoom(), theme()], themes: [deepBlue] })
const { state, getPlugin } = useA11yNow()

// @a11y-now/react —— Provider + Hook
<A11yNowProvider options={...}>
const { state, getPlugin } = useA11yNow()

// @a11y-now/svelte —— context + $state 桥接（Svelte 5 runes）
// @a11y-now/solid —— createA11yNow 信号桥接
// @a11y-now/element —— <a11y-now preset="full" lang="zh-CN"> 声明式接入
```

响应式桥接统一走内核 store 的 `subscribe`，各框架包体预期 < 2 KB。

## 4. 样式与主题系统（CSS 变量驱动）

**硬性规范：所有样式一律通过 CSS 自定义属性（`--a11y-*` 前缀）取值，组件样式中不出现硬编码颜色/尺寸**，主题切换只改变量、不动样式表。oxlint 阶段可加自定义检查（grep 禁止 `#hex`/`rgb(` 出现在组件样式模板中，token 定义文件除外）。

### 4.1 Token 分层

```
primitive（原始值，仅主题包内出现）
   └→ semantic（语义层，组件唯一允许引用的层）
        └→ component（组件层，少量，由 semantic 组合而来）
```

两个作用域，互不混用：

| 作用域 | 写在哪 | 前缀 | 用途 |
| --- | --- | --- | --- |
| 工具栏 UI | shadow root 内 `:host` | `--a11y-*` | 工具栏自身外观（不受页面影响） |
| 页面改色 | `documentElement` 内联 style | `--a11y-page-*` | 换肤时页面的背景/文字/链接/描边 |

### 4.2 语义层 token 清单（`ToolbarTokens` / `PageTokens` 的类型来源）

```css
/* 工具栏 UI（:host 默认值，即 theme-default 的工具栏部分） */
:host {
  /* 颜色 */
  --a11y-color-bg: #ffffff;
  --a11y-color-fg: #1f2329;
  --a11y-color-accent: #0b5cad;
  --a11y-color-border: #d0d3d6;
  --a11y-color-btn-hover-bg: #f2f3f5;
  --a11y-color-btn-active-bg: #e8f3ff;
  --a11y-color-btn-active-fg: var(--a11y-color-accent);
  --a11y-color-disabled-fg: #a8abb0;
  --a11y-color-focus-ring: #fcff00;      /* 对齐源页面焦点描边 */
  /* 尺寸/排版 */
  --a11y-toolbar-height: 84px;
  --a11y-btn-size: 56px;
  --a11y-font-size: 14px;
  --a11y-font-size-caption: 42px;        /* 大字幕 */
  --a11y-radius: 6px;
  --a11y-outline-width: 3px;
  --a11y-z-index: 2147483000;
  /* 动效（prefers-reduced-motion 时置 0） */
  --a11y-transition: 120ms ease-out;
}

/* 页面改色（由 plugin-theme 写到 documentElement） */
:root {
  --a11y-page-bg: initial;
  --a11y-page-fg: initial;
  --a11y-page-link: initial;
  --a11y-page-region-outline: 2px solid #ff6c00;   /* 区域高亮，对齐源页面 */
  --a11y-page-focus-outline: 3px solid #fcff00;    /* 焦点描边，对齐源页面 */
  --a11y-cursor-color: #ffd700;                    /* 大鼠标/十字线主色 */
}
```

组件样式书写示例（shadow 内）：

```ts
const buttonStyle = css`
  .btn {
    inline-size: var(--a11y-btn-size);
    color: var(--a11y-color-fg);
    border-radius: var(--a11y-radius);
    transition: background-color var(--a11y-transition);
  }
  .btn:hover { background: var(--a11y-color-btn-hover-bg); }
  .btn[aria-pressed='true'] { color: var(--a11y-color-btn-active-fg); }
  .btn:focus-visible { outline: var(--a11y-outline-width) solid var(--a11y-color-focus-ring); }
`
```

### 4.3 主题包契约（packages-themes/*）

主题包是**零运行时的纯数据包**，只依赖 `@a11y-now/types`：

```ts
// packages-themes/deep-blue/src/index.ts —— @a11y-now/theme-deep-blue
import type { A11yTheme } from '@a11y-now/types'

export const deepBlue = {
  name: 'deep-blue',
  displayName: { 'zh-CN': '深蓝白', 'en-US': 'Deep Blue' },
  toolbar: {
    'color-bg': 'rgb(0 51 92)',
    'color-fg': '#ffffff',
  },
  page: {
    bg: 'rgb(0 51 92)',
    fg: '#ffffff',
    link: '#ffffff',
  },
} satisfies A11yTheme
```

token 键用裸名（`color-bg`），由 ThemeService 统一拼 `--a11y-` / `--a11y-page-` 前缀写入，避免主题包写错前缀；`satisfies A11yTheme` 保证键名与值类型编译期校验，多写少写立即报错。

### 4.4 运行时切换机制（ThemeService）

1. `useTheme()` 注册进主题表（`Map<name, A11yTheme>`），`plugin-theme` 按注册顺序循环切换（对齐源页面 Ctrl+Alt+T 交互）。
2. 应用主题 = 两步纯变量操作：工具栏 token 写到 shadow `:host` 的 inline style；页面 token 写到 `documentElement` inline style，同时给 `<html>` 加 `data-a11y-theme="deep-blue"` 供页面适配 `--a11y-page-*` 的兜底样式命中（`html[data-a11y-theme] body { background: var(--a11y-page-bg) !important; ... }`，经 `dom.injectStyle()` 登记、可回收）。
3. 跳过白名单：全局默认 skip 选择器（img、video、canvas、验证码 iframe、`[data-a11y-skip]`）∪ 各主题的 `skipSelectors`——对应源页面 `golabSkipTheme` 机制，但站点侧只需加 `data-a11y-skip` 属性即可，不需要维护巨型选择器清单。
4. 卸载/切回 default：删除变量与 data 属性即还原，**不存在样式表重建**，这是对源页面「每次换肤生成百 KB style」的最大改进。
5. 后期扩展在此模型上零成本：暗色模式跟随 `prefers-color-scheme`、站点自定义品牌主题（发一个 `a11y-now-theme-*` 包或运行时传对象）、高对比度跟随 `prefers-contrast`。

## 5. 工程规范

### 5.1 构建（tsdown）

- 各包独立 `tsdown.config.ts`，extends 根配置；`dts: { tsgo: true }` 沿用现状。
- 产物：ESM（全部包）；`a11y-now` 聚合包额外 `iife`（globalName `A11yNow`，供 CDN）。
- `platform: 'neutral'`；框架适配包将框架标记为 `external` + `peerDependencies`。
- 样式以 TS 模板字符串内联（`css` 标签函数，shadow DOM 经 Constructable StyleSheets 注入），不引入 CSS 文件构建链路；token 默认值单独一个 `tokens.ts`，同时导出为类型与运行时对象。
- 主题包零运行时依赖，构建产物应只有数十行——CI 加包体积上限检查。
- 发布质量门禁：CI 中对每个包跑 `publint` + `arethetypeswrong`。

### 5.2 测试（vitest，各包根目录 `tests/`）

```
packages-plugins/zoom/
├── src/
├── tests/            # ← 每个包根目录下 tests 文件夹
│   └── zoom.test.ts
├── tsdown.config.ts
└── vitest.config.ts
```

- 根 `vitest.config.ts` 改为 `projects: ['packages/*', 'packages-frameworks/*', 'packages-plugins/*', 'packages-themes/*']` 聚合，各包配置自己的环境。
- 环境分层：types/shared/themes 用 node（主题包测试重点：token 键完整性、`satisfies` 之外的运行时校验）；core/plugins 用 **happy-dom**（挂载卸载、快捷键、状态持久化、区域扫描、**主题切换后变量值断言与还原断言**）；框架包用对应 Testing Library；关键交互路径（工具栏键盘遍历、shadow DOM 焦点管理、换肤视觉回归）用 **vitest browser mode（playwright/chromium）** 做少量端到端用例。
- 覆盖率 `@vitest/coverage-v8`，core 与各插件包行覆盖率门槛 90%。
- 每个插件包的测试模板统一：注册 → 激活 → 断言 DOM 效果 → 快捷键触发 → 持久化恢复 → 卸载无残留（「无残留」用快照对比 `document.documentElement`，这是源页面审查中验证过的关键性质）。

### 5.3 文档（docs/，VitePress）

- `docs` 转为 VitePress 站点包（已是 workspace 成员）：`vitepress` 为 devDependency，脚本 `docs:dev` / `docs:build` / `docs:preview`。
- 信息架构：指南（快速开始、核心概念、编写插件、**编写主题**）/ 插件参考（每包一页：选项、快捷键、事件、Api）/ **主题参考（token 全表 + 各官方主题色板预览）** / 框架接入 / API 参考（`typedoc-plugin-markdown` 从 dts 生成）/ 设计资料（收录现有 `design.md` 与本 `plan.md`）。
- 文档内嵌 live demo：文档站自身接入 `a11y-now`（自举，即产品最好的展示）。
- 部署：新增 `.github/workflows/docs.yml`，构建后发 GitHub Pages。

### 5.4 仓库调整清单（一次性）

1. 根 `package.json`：`private: true`、去掉 `files/main/types/exports/publishConfig`，脚本改为 `pnpm -r` 编排；README 的 starter 文案同步更新。
2. `pnpm-workspace.yaml`：packages 列表更新为 `docs`、`packages/*`、`packages-frameworks/*`、`packages-plugins/*`、`packages-themes/*`、`playground/*`；启用 `catalog:` 统一共享依赖版本（vitest、tsdown、框架版本）。
3. 目录迁移：现有空目录 `packages/vue`、`packages/react` 移至 `packages-frameworks/`；`packages/types`、`packages/core` 留在原地并初始化；按 §2 新建其余包。
4. 发布流：`bumpp -r` 统一版本；release workflow 改为 `pnpm -r publish`。
5. CI：check job 不变；test job 增加 `pnpm -r build` 后跑根 vitest projects；矩阵保持 3 OS × Node 22/24/26。

## 6. 里程碑

| 阶段 | 内容 | 验收标准 |
| --- | --- | --- |
| **M0 基建**（0.5 周） | §5.4 清单全量落地；types/shared/core 空实现打通四目录的构建-测试-发布链路 | CI 全绿；`pnpm -r build` 产物通过 publint/attw |
| **M1 内核**（1~2 周） | 挂载/卸载、插件系统、store + 持久化、快捷键、i18n、SpeechService(WebSpeech)、**ThemeService + token 体系（§4）** | core 覆盖率 ≥ 90%；demo 插件与 demo 主题可注册/切换/卸载无残留 |
| **M2 插件与主题**（2~3 周） | 12 个插件包 + 5 个主题包 + 3 个预设；`a11y-now` 聚合包（含 IIFE） | 每包测试模板全过；playground/vanilla 手测对齐 design.md 功能清单；换肤零样式表重建 |
| **M3 框架适配**（1~2 周） | vue / react 正式实现，svelte / solid / element 补全 | 各适配包 Testing Library 用例通过；playground 三框架联调 |
| **M4 文档与发布**（1 周） | VitePress 站点 + token 参考 + live demo 自举；0.1.0 发布 | docs 构建部署成功；`npm i a11y-now` 一行接入可用 |
| **M5 生态**（持续） | 拼音/简繁可选插件包、暗色/自动对比度主题包、远端 TTS 引擎、关怀版（老年模式）、Nuxt/Next 集成、第三方插件与主题指南 | 按需排期 |

风险与预案：Web Speech API 在部分浏览器的中文音色质量不稳 → SpeechEngine 接口从 M1 就抽象好，必要时提供远端引擎包；区域自动分类的准确率依赖页面语义化程度 → region-nav 提供手动标注逃生舱（`data-a11y-region` 属性优先）；页面改色对非语义化站点的覆盖率有限 → `data-a11y-skip` + 主题 `skipSelectors` 双白名单兜底。

---

*本计划的功能范围以 [design.md](./design.md) 的 15 项功能审查为基准；实现顺序上先保证「内核可插拔 + 卸载无残留 + 变量化换肤」这三个工程性质，再逐个还原功能。*
