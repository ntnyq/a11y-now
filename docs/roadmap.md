# a11y-now 下一步工作计划

> 前置状态（2026-07-26）：M0~M4 已完成——26 个包全部实现，`pnpm build` / `tsc --noEmit` / `oxlint` / `vitest`（78 用例）全绿，tsgo 已移除改用默认 TypeScript 工具链，真实 Chromium 冒烟 13/13 通过。
> 本计划接续 [plan.md](./plan.md) 的里程碑，聚焦「发布 0.1.0」与其后的加固与生态。

## P0 · 发布前必须（本周）

### 1. 提交代码与 lockfile

当前工作区全部变更尚未提交（仓库仅有 init commit）。先 `git diff` 审阅一遍，然后连同重新生成的 `pnpm-lock.yaml` 一起提交——CI 的 `--frozen-lockfile` 依赖它。建议拆成 2~3 个 commit（monorepo 骨架 / 各包实现 / 文档）。

### 2. 修复 Node 26 兼容 ✅（2026-07-26）

Node 25+ 自带实验性 `localStorage` 全局（未提供 `--localstorage-file` 时为 `undefined`），会遮蔽 happy-dom 注入的实现——vitest 的 happy-dom 环境看到 `globalThis` 已有同名 key 就不再覆盖，且 `window` 与 `document.defaultView` 均被重映射回打补丁后的 global，setup 里拿不到真实 happy-dom window。落地修法：根级 `vitest.setup.ts`（经 `vitest.shared.ts` 与根配置 `setupFiles` 注入），对值为 `undefined` 的 `localStorage` / `sessionStorage` 按测试文件粒度安装内存版 Storage。已在本机 node 26.2.0 验证：修复前 26 用例挂，修复后 117/117 全过（含覆盖率门禁）。

### 3. 文档站首次构建与部署 ✅（2026-07-26）

已上线：仓库转 public 后经 API 启用 Pages（build_type=workflow），`docs.yml` 端到端通过。真实浏览器验证：首页/指南/typedoc API 页渲染正常、资源 200、控制台零报错，自举工具栏挂载且分区计数随页面联动。（首发在 `ntnyq.github.io/a11y-now/` 子路径，`base: '/a11y-now/'`；同日切换自定义域名 <https://a11y-now.ntnyq.dev/>，base 还原为根路径。）

### 4. Playground 真机体验 QA

`pnpm --filter playground-vanilla dev` 在真实浏览器过一遍 12 个插件，重点关注自动化测试覆盖不到的体感项：Web Speech 中文音色（Chrome/Safari 差异）、指读 hover 的节奏、换肤在复杂 DOM 的覆盖效果与 `data-a11y-skip` 逃生舱、缩放后布局、帮助面板焦点管理。vue / react playground 各过一遍挂载与 HMR。

### 5. npm 发布准备与 0.1.0 首发 ✅（2026-07-26 发布完成）

代码侧准备（包名确认、description/keywords、release workflow 修复、IIFE 命名、publint 抽查）与发布均已完成。首发实录：

- `a11y-now` 组织创建后,release workflow 补了 NPM_TOKEN 认证通道（setup-node `registry-url` + 发布步骤 `NODE_AUTH_TOKEN`）；
- `release:check` 七道门禁全绿后 `bumpp -r 0.1.0` 推 tag 触发发布；
- 踩坑记录：granular token 只授 `@a11y-now` scope 时,无 scope 的新包 `a11y-now` 发布 403（不存在的无 scope 包需要 All packages 权限）——主包本地手动发布,重跑 workflow 补齐（`pnpm -r publish` 自动跳过已上架版本）；
- 验收通过：32/32 包 0.1.0 上架；干净环境 `npm i a11y-now` 依赖解析正确、`createA11yNow` 可导入；unpkg IIFE 200（45.5 KB）；changelogithub 生成 [GitHub Release](https://github.com/ntnyq/a11y-now/releases/tag/v0.1.0)。

✅ 已切换 Trusted Publishing（2026-07-26）：`npm trust github`（npm ≥11.10）循环配好 32 个包（首次 2FA 后勾选 5 分钟豁免），`npm trust list` 逐包核验通过；workflow 已移除 `registry-url` / `NODE_AUTH_TOKEN`，`NPM_TOKEN` secret 已删除。后续发版零 token（OIDC + provenance），下次 0.1.x 发布即为 OIDC 通道的实测。

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

## P3 · 国际化与触达（✅ 2026-07-26）

- ✅ **英文语言包**：16 插件与内核的 en-US 文案本已齐备，真实缺口是 BCP 47 规范化——`lang="en"` / `"zh-Hant"` 匹配不上表键 `en-US` / `zh-CN`，英文页会错误回退中文。`@a11y-now/shared` 新增 `normalizeLocale`（`en*`→en-US、`zh*`→zh-CN、自定义 locale 放行、空值走 zh-CN 兜底），kernel 探测与显式 `locale` 皆经其规范化；新增 shared 单测、kernel 集成测试与「16 插件 en/zh key 对齐」长效守护测试；浏览器 e2e 补英文页用例（测试页 `lang` 钉为 zh-CN 后原中文断言不再依赖回退巧合）。
- ✅ **文档站双语**：VitePress locales（根 zh-CN + `/en/`），30 个英文页面全量翻译（首页/指南 4/插件 17/主题/框架 7），内部资料（design/plan/roadmap）保持中文；`/en/` 页 `html lang="en-US"`，自举工具栏自动渲染英文（线上实测）；README 增双语文档入口；中英快速开始均补「界面语言」章节。
- ✅ **0.1.1 发布 = OIDC 首次实弹**：32 包全部经 Trusted Publishing 发布（日志零 "Skipped OIDC"），SLSA v1 provenance attestations 自动附带，changelogithub 更新 GitHub Release。发布链路自此零 token。

## P4 · 产品深化

- ✅ **新插件三连**（2026-07-27，均为可选扩展包、不动内核）：
  - `@a11y-now/plugin-reading-mask` 阅读遮罩（`Ctrl+Alt+G`，水平聚焦条随鼠标，遮罩渲染在 shadow DOM、pointer-events 无遮挡）；
  - `@a11y-now/plugin-pause-motion` 停止动画（`Ctrl+Alt+X`，强制 reduced-motion 样式 + 暂停 autoplay 视频 + 同源 GIF 尽力冻结首帧，关闭全量还原）；
  - `@a11y-now/plugin-spacing` 间距调节（`Ctrl+Alt+S`，关闭→舒适→宽松三档循环，「舒适」即 WCAG 1.4.12 测试指标，支持自定义阶梯，发 `spacing:change` 事件）。
  - 配套：各 4 组测试（含 GIF 冻结路径打桩）、90% 覆盖门禁、en/zh 消息 key 对齐守护（19 插件）、双语文档页 + typedoc 入口、playground 演示。
- ✅ **快捷键自定义 API**（2026-07-27）：`createA11yNow({ shortcutOverrides })` 按 id 覆写（partial 合并）或 `null` 禁用任意快捷键，`instance.shortcuts.setOverride(id, def)` 运行时改绑（`{}` 还原默认）；覆写结果自动进「操作说明」面板，冲突走既有检测立即抛错。
- ✅ **help 弹框样式重做**（2026-07-27）：backdrop 压暗（`color-mix` 基于 fg token）+ 卡片化对话框（560px、圆角阴影）+ 头部标题栏与 ✕ 关闭（点击 backdrop / Esc / ✕ 均可关）+ 键帽风格 `<kbd>` 胶囊两列网格；样式集中于 shadow 内 `<style>`，全部引用 `--a11y-*` token，主题可完整重着色。

## P5 · 下一步工作(2026-07-27 计划)

### 10. 0.2.0 发布(最高优先)

main 已积累 4 个未发布 feature 提交(新插件三连、快捷键覆写 API、help 重做、工具栏居中 + 总开关),文档/测试/门禁齐备、CI 全绿,发布价值成熟。注意事项:

- ✅ 新包首发(2026-07-27):reading-mask / pause-motion / spacing 三包已用 `pnpm publish:new` 以 0.1.0 手动首发,npm 上均可见;首发版无 provenance 属手动通道预期,0.2.0 走 OIDC 后补齐。配套脚本沉淀在 `scripts/`:`pnpm publish:new` 自动检测 404 新包并首发(默认 0.1.0,构建 + publint/attw 前置校验,version 临时改写、发布后原样还原);`pnpm trust:new` 免登录检测「未上架或最新版无 provenance」的待配包,逐包 `npm trust github --allow-publish` 并 `npm trust list` 核验(均支持 `--dry-run`,trust 另有 `--print`)。
- ⬜ 发版前确认三个新包已 `pnpm trust:new` 配好 trust;**0.2.0 将是新包走 OIDC 的首次实测**。
- 流程:`release:check` 七道门禁 → `bumpp -r 0.2.0` 推 tag;发完干净环境 `npm i` 抽查 + unpkg IIFE 探活 + 各新包 `npm trust list` 核验。

### 11. P1 尾巴清零

- ⬜ 插件页截图/动图(P1-8):用浏览器 e2e 截图自动生成,顺带沉淀视觉基线,避免手工维护 19 张图;
- ⬜ 「站点接入清单」指南页(P1-8):`data-a11y-skip` / `data-a11y-region` / `data-a11y-reading` 标注指南 + SSR / CSP 注意事项,双语;
- ⬜ axe-core 实测(P1-9 的可自动化半):接入 `tests/browser/` 对 shadow DOM 工具栏与 help 对话框扫描,结论公开进文档;VoiceOver 实测保留人工;
- ⬜ Playground 预检(P0-4 的可自动化半):真实浏览器过一遍 vanilla / vue / react 的挂载、19 插件开关与控制台零报错;体感项(Web Speech 中文音色、Safari 差异、指读节奏)留人工清单。

### 12. 工程加固(候选,按需排期)

- ⬜ CI 加 size-limit 体积门禁(IIFE 当前 45.5 KB 基线),防插件增长引发体积回归;
- ⬜ Renovate 落地风险备忘 #1:happy-dom / vitepress 单独分组、关闭 automerge(当前继承全局 automerge;happy-dom 带 pnpm patch,版本漂移会直接挂 install);upstream [#2255](https://github.com/capricorn86/happy-dom/issues/2255) 修复后移除补丁;
- ⬜ e2e 浏览器矩阵扩 firefox / webkit(Web Speech 与 reading-mask 跨引擎行为差异)。

### 13. 产品候选(收集 0.2.0 反馈后挑选)

highlight-links(链接强调)、focus-indicator(焦点强化)、dyslexia 字体、文本对齐调节等常见竞品能力;RemoteTTSEngine 对接一家真实厂商出教程;酝酿 1.0 的 API 冻结条件(shortcutOverrides / 事件名 / token 集稳定后)。

### 人工待办(agent 无法代办)

- npmjs.com 撤销 0.1.0 引导期 granular token(截至 2026-07-26 未确认);
- VoiceOver 实测(P1-9)与真机体感 QA(P0-4 剩余项)。

## 已知风险备忘

1. **依赖版本漂移**：happy-dom / vitepress alpha 升级曾引发行为变化，建议 Renovate 对二者单独分组、开 automerge 前先跑全量测试；
2. **happy-dom MutationObserver GC bug（已打补丁，2026-07-27）**：happy-dom ≤20.11.1 内部监听回调仅由 `WeakRef` 持有（`MutationObserverListener` 构造器里的内联箭头函数无任何强引用），V8 GC 后 `deref()` 变 undefined，**活跃 observer 静默失联**。表现为 CI Windows×Node24 `test:coverage`（覆盖率插桩加大 GC 压力）上 zh-convert 动态监听用例间歇失败，轮询等待也救不回。已用 `pnpm patch` 打补丁（`patches/happy-dom@20.11.1.patch`，构造器里对回调补一个强引用），`node --expose-gc` 最小复现脚本验证修复前必现、修复后消失。升级 happy-dom 时若补丁失配会报错——先确认上游是否已修复再移除补丁。已上报上游：[capricorn86/happy-dom#2255](https://github.com/capricorn86/happy-dom/issues/2255)（附最小复现与修复方案，并关联同源的 #1878）；
3. **Node 26 全局污染**：见 P0-2，Node 后续版本可能默认启用 localStorage，setup 层修法更稳；
4. **dts 工具链**：如日后想换回 tsgo，注意 rolldown-plugin-dts 检测到 TS 7 系（含 typescript 6.x）会自动切 tsgo 生成器——typescript 版本需与 dts 后端配套调整；
5. **VitePress 2 alpha**：文档站阻塞时降级 1.x 即可，内容零改动。
