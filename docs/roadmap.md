# a11y-now 下一步工作计划

> 前置状态（2026-07-26）：M0~M4 已完成——26 个包全部实现，`pnpm build` / `tsc --noEmit` / `oxlint` / `vitest`（78 用例）全绿，tsgo 已移除改用默认 TypeScript 工具链，真实 Chromium 冒烟 13/13 通过。
> 本计划接续 [plan.md](./plan.md) 的里程碑，聚焦「发布 0.1.0」与其后的加固与生态。

## P0 · 发布前必须（本周）

### 1. 提交代码与 lockfile

当前工作区全部变更尚未提交（仓库仅有 init commit）。先 `git diff` 审阅一遍，然后连同重新生成的 `pnpm-lock.yaml` 一起提交——CI 的 `--frozen-lockfile` 依赖它。建议拆成 2~3 个 commit（monorepo 骨架 / 各包实现 / 文档）。

### 2. 修复 Node 26 兼容 ✅（2026-07-26）

Node 25+ 自带实验性 `localStorage` 全局（未提供 `--localstorage-file` 时为 `undefined`），会遮蔽 happy-dom 注入的实现——vitest 的 happy-dom 环境看到 `globalThis` 已有同名 key 就不再覆盖，且 `window` 与 `document.defaultView` 均被重映射回打补丁后的 global，setup 里拿不到真实 happy-dom window。落地修法：根级 `vitest.setup.ts`（经 `vitest.shared.ts` 与根配置 `setupFiles` 注入），对值为 `undefined` 的 `localStorage` / `sessionStorage` 按测试文件粒度安装内存版 Storage。已在本机 node 26.2.0 验证：修复前 26 用例挂，修复后 117/117 全过（含覆盖率门禁）。

### 3. 文档站首次构建与部署 ✅（2026-07-26）

已上线：<https://ntnyq.github.io/a11y-now/>。仓库转 public 后经 API 启用 Pages（build_type=workflow），`docs.yml` 端到端通过；VitePress 配置补了 `base: '/a11y-now/'`（改用自定义域名时需改回 `'/'`）。真实浏览器验证：首页/指南/typedoc API 页渲染正常、资源 200、控制台零报错，自举工具栏挂载且分区计数随页面联动。

### 4. Playground 真机体验 QA

`pnpm --filter playground-vanilla dev` 在真实浏览器过一遍 12 个插件，重点关注自动化测试覆盖不到的体感项：Web Speech 中文音色（Chrome/Safari 差异）、指读 hover 的节奏、换肤在复杂 DOM 的覆盖效果与 `data-a11y-skip` 逃生舱、缩放后布局、帮助面板焦点管理。vue / react playground 各过一遍挂载与 HMR。

### 5. npm 发布准备与 0.1.0 首发 ✅（2026-07-26 发布完成）

代码侧准备（包名确认、description/keywords、release workflow 修复、IIFE 命名、publint 抽查）与发布均已完成。首发实录：

- `a11y-now` 组织创建后,release workflow 补了 NPM_TOKEN 认证通道（setup-node `registry-url` + 发布步骤 `NODE_AUTH_TOKEN`）；
- `release:check` 七道门禁全绿后 `bumpp -r 0.1.0` 推 tag 触发发布；
- 踩坑记录：granular token 只授 `@a11y-now` scope 时,无 scope 的新包 `a11y-now` 发布 403（不存在的无 scope 包需要 All packages 权限）——主包本地手动发布,重跑 workflow 补齐（`pnpm -r publish` 自动跳过已上架版本）；
- 验收通过：32/32 包 0.1.0 上架；干净环境 `npm i a11y-now` 依赖解析正确、`createA11yNow` 可导入；unpkg IIFE 200（45.5 KB）；changelogithub 生成 [GitHub Release](https://github.com/ntnyq/a11y-now/releases/tag/v0.1.0)。

发布后待办：在 npm 为 32 个包配置 Trusted Publishing（OIDC，指向 `release.yml`），完成后撤销引导 token 并删除 workflow 的 `registry-url` / `NODE_AUTH_TOKEN` 两处。

## P1 · 发布后加固(1~2 周)

### 6. CI 质量门禁补齐

- ✅ 覆盖率（2026-07-26）：CI test job 改跑 `test:coverage`，core 与 16 个插件包各设 90% 行覆盖率阈值（vitest.config.ts thresholds，逐包 glob 独立断言），当前 core 94.8%、全插件达标；
- ✅ 每包 `publint --strict` + `attw --pack --profile esm-only`（发布产物/类型双校验，2026-07-26）：根脚本 `publint` / `attw` 覆盖全部 32 个包本地通过，接入 CI `publish-check` job，并纳入 `release:check`。

### 7. 浏览器端 e2e 固化 ✅（2026-07-26）

`vitest.browser.config.ts` + `tests/browser/`（playwright/chromium，`pnpm test:browser`，CI 独立 e2e job）：全预设挂载/逐字节零残留、方向键 roving 真实焦点、Ctrl+Alt+= 真实缩放、换肤 computed style 断言与还原、帮助对话框焦点管理（Esc 关闭还原焦点）、退出并持久化。落地时抓到并修复一个真实缺陷：roving 未跳过原生 `disabled` 按钮，方向键会把焦点丢失（happy-dom 无法暴露）。

### 8. 文档补全

- ✅ docs 站自举接入 `a11y-now`（2026-07-26）：`.vitepress/theme/index.ts` 客户端挂载全预设工具栏，尊重 `wasExited`——产品即演示；
- ✅ `typedoc` + `typedoc-plugin-markdown` + `typedoc-vitepress-theme` 生成 API 参考（聚合包 + 4 个可选插件入口），`docs:dev` / `docs:build` 前自动生成，产物 gitignore，侧栏/导航已接入；
- ✅ 主题参考页补视觉色板；
- ⬜ 每个插件页补交互截图/动图；补一篇「站点接入清单」（`data-a11y-skip`、`data-a11y-region` 标注指南）。

### 9. 工具栏自身无障碍实测

用 VoiceOver（macOS）实测工具栏的 roving tabindex、`aria-pressed` 播报、live region 通告与帮助对话框焦点管理；对 shadow DOM 内容跑一次 axe-core。这是无障碍产品的自证环节，值得在文档里公开结论。

## P2 · 生态与增强（M5，已完成 2026-07-26）

- ✅ **可选插件包**：`@a11y-now/plugin-pinyin`（拼音标注，pinyin-pro，`Ctrl+Alt+P`）、`@a11y-now/plugin-zh-convert`（简繁转换，opencc-js + MutationObserver，`Ctrl+Alt+J`）、`@a11y-now/plugin-elder-mode`（关怀版，`Ctrl+Alt+O`）——均不入 full preset，按需安装；
- ✅ **RemoteTTSEngine** 参考实现：`@a11y-now/core` 导出 `createRemoteTTSEngine`（POST JSON → 音频流，支持取消/换段/逐段 onEnd，`body`/`resolveAudio`/`fetchImpl`/`clientRate` 适配任意厂商）；
- ✅ **框架生态**：`@a11y-now/nuxt`（kit-free module + client 插件，注入 `$a11yNow`）、`@a11y-now/next`（`'use client'` 产物，`<A11yNow />` 服务端布局可直接渲染）；
- ✅ **主题生态**：`@a11y-now/plugin-auto-theme` 跟随 `prefers-color-scheme` 与 `prefers-contrast`，手动切换自动让位（`Ctrl+Alt+U`）；
- ✅ **连读增强**：speech 连读升级为叶级块元素逐段队列 + `data-a11y-reading` 进度高亮 + `speech:reading` 进度事件，废弃 3000 字截断（`SpeechEngine` 新增可选 `onEnd` 完成回调）。

## 已知风险备忘

1. **依赖版本漂移**：happy-dom / vitepress alpha 升级曾引发行为变化，建议 Renovate 对二者单独分组、开 automerge 前先跑全量测试；
2. **Node 26 全局污染**：见 P0-2，Node 后续版本可能默认启用 localStorage，setup 层修法更稳；
3. **dts 工具链**：如日后想换回 tsgo，注意 rolldown-plugin-dts 检测到 TS 7 系（含 typescript 6.x）会自动切 tsgo 生成器——typescript 版本需与 dts 后端配套调整；
4. **VitePress 2 alpha**：文档站阻塞时降级 1.x 即可，内容零改动。
