# a11y-now 下一步工作计划

> 前置状态（2026-07-26）：M0~M4 已完成——26 个包全部实现，`pnpm build` / `tsc --noEmit` / `oxlint` / `vitest`（78 用例）全绿，tsgo 已移除改用默认 TypeScript 工具链，真实 Chromium 冒烟 13/13 通过。
> 本计划接续 [plan.md](./plan.md) 的里程碑，聚焦「发布 0.1.0」与其后的加固与生态。

## P0 · 发布前必须（本周）

### 1. 提交代码与 lockfile

当前工作区全部变更尚未提交（仓库仅有 init commit）。先 `git diff` 审阅一遍，然后连同重新生成的 `pnpm-lock.yaml` 一起提交——CI 的 `--frozen-lockfile` 依赖它。建议拆成 2~3 个 commit（monorepo 骨架 / 各包实现 / 文档）。

### 2. 修复 Node 26 兼容（CI 会挂的已知问题）

Node 25+ 自带实验性 `localStorage` 全局（未提供 `--localstorage-file` 时为 `undefined`），会遮蔽 happy-dom 注入的实现——本地 fnm node 24 通过的测试，在 CI 的 26.x 矩阵上会失败。修法（选一）：

- 在 `vitest.shared.ts` 增加 `setupFiles`，setup 里当检测到 node 自带的 undefined `localStorage` 时 `Object.defineProperty` 回 happy-dom window 的实现；
- 或临时把 CI 矩阵收敛到 22/24，待 vitest/happy-dom 上游适配后再放开。

验收：CI 三 OS × 全 Node 矩阵绿。

### 3. 文档站首次构建与部署

`docs:build`（VitePress 2.0 alpha）还没实际构建过。跑通 `pnpm docs:dev` 目检导航/侧栏/中文渲染，`docs:build` 通过后在 GitHub 仓库设置里启用 Pages（Source: GitHub Actions），验证 `docs.yml` 工作流端到端。alpha 版如有阻塞问题可降级 vitepress 1.x（页面语法完全兼容）。

### 4. Playground 真机体验 QA

`pnpm --filter playground-vanilla dev` 在真实浏览器过一遍 12 个插件，重点关注自动化测试覆盖不到的体感项：Web Speech 中文音色（Chrome/Safari 差异）、指读 hover 的节奏、换肤在复杂 DOM 的覆盖效果与 `data-a11y-skip` 逃生舱、缩放后布局、帮助面板焦点管理。vue / react playground 各过一遍挂载与 HMR。

### 5. npm 发布准备与 0.1.0 首发

代码侧已就绪（2026-07-26）：

- ✅ 包名确认：registry 查询 `a11y-now` 与 `@a11y-now/*` 均 404，名称可用；
- ✅ 全部 32 个包 `description` / `keywords` 补齐；README 包表与徽章核对；
- ✅ release workflow 修复：补上 `pnpm build` 步骤、`pnpm publish` 改为 `-r` 递归发布（根包 private，原命令会发不出任何包）；
- ✅ IIFE 产物命名修复（原为 `a11y-now.iife.iife.js`），`unpkg` / `jsdelivr` 字段指向 `dist/a11y-now.iife.js`；
- ✅ publint 抽查通过（a11y-now / core / next / nuxt / plugin-pinyin）。

剩余人工步骤：

1. npm 创建 `a11y-now` 组织（scope `@a11y-now`）；
2. 在 npm 侧为各包配置 Trusted Publishing（OIDC，workflow 已带 `id-token: write`）——首发包无法预先配置的话，先用 granular token 走一次 0.1.0，再切 OIDC；
3. 本地跑 `pnpm release`（release:check 全绿 → bumpp -r 统一版本 → 推 tag 触发 workflow 发 32 个包 + changelogithub）。

验收：`npm i a11y-now` 后 `createA11yNow().mount()` 一行可用；unpkg 能取到 IIFE 产物。

## P1 · 发布后加固(1~2 周)

### 6. CI 质量门禁补齐

按 plan.md 承诺补上：每包 `publint` + `arethetypeswrong`（发布产物/类型双校验）、`vitest --coverage` 接入 CI 并为 core 与各插件包设 90% 行覆盖率阈值。

### 7. 浏览器端 e2e 固化

把本次开发中验证过的 13 项真实浏览器冒烟（含「退出后 DOM 逐字节零残留」）固化为仓库内的 vitest browser mode（playwright/chromium）用例，防回归。

### 8. 文档补全

每个插件页补交互截图/动图；docs 站自举接入 `a11y-now`（产品即演示）；`typedoc-plugin-markdown` 从 d.ts 生成 API 参考；补一篇「站点接入清单」（`data-a11y-skip`、`data-a11y-region` 标注指南）。

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
