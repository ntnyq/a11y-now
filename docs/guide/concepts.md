# 核心概念

## 架构

```
types ← shared ← core ← plugin-*（definePlugin）
types ←──────────────── theme-*（纯 token 数据）
core  ←──────────────── vue / react / svelte / solid / element
core + 全部官方插件/主题 ← a11y-now 聚合包
```

## 挂载与样式隔离

工具栏宿主 `<a11y-now-host>` 挂在 `<html>` 下（与 body 平级），内部使用
Shadow DOM。因此页面对 body 的缩放、主题、transform 永远影响不到工具栏，
工具栏样式也绝不会泄漏进页面。

## 卸载零残留

插件对页面的所有改动都必须经由 `ctx.dom`（注入样式、设置变量、加类名），
内核登记每一笔改动并在 `unmount()` 时全量回收。集成测试断言退出后
`document.documentElement.outerHTML` 与挂载前逐字节一致。

## 插件系统

每个功能都是一个插件包，实现 `A11yPlugin` 契约：`setup(ctx)` 返回
`{ api, dispose }`。内核负责依赖排序、状态持久化、快捷键注册与冲突检测。

## 类型安全

通过 module augmentation 双注册表实现跨包类型安全：

```ts
declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    zoom: ZoomApi
  }
  interface A11yEventMap {
    'zoom:change': { scale: number }
  }
}
```

于是 `instance.getPlugin('zoom')` 返回 `ZoomApi`，事件名拼错直接编译报错。

## 状态持久化

每个插件的状态按 schema 自动持久化（默认 localStorage，可替换或禁用），
key 形如 `a11y-now:plugin:zoom`，跨标签页同步，`resetAll()` 一键还原。

## 工具栏自身的无障碍

无障碍工具栏首先得自己无障碍：`role="toolbar"` / `role="group"` 结构、
方向键漫游焦点（roving tabindex）、`aria-pressed` 状态、`aria-live`
操作播报、帮助对话框的焦点管理与可聚焦滚动区，明暗两套配色的全部
文本/背景对比度均满足 WCAG AA。

这不止是自我要求，也有实测背书：真实浏览器 e2e
（`tests/browser/axe.test.ts`，CI 每次提交运行）用 **axe-core 默认全量
规则集（WCAG A/AA + best-practice，未豁免任何规则）** 做整页扫描——
一张干净页面在挂载工具栏后、切到暗色后、打开帮助对话框后，均保持
**零违规**。也就是说：接入 a11y-now 不会让你自己站点的 axe /
Lighthouse 审计多出任何问题。

自动扫描只覆盖机器可判定的问题类型；读屏软件（VoiceOver / NVDA）的
真实体验属人工实测范畴，结论会随版本持续更新。

## 生命周期与故障恢复

创建实例时不会注册浏览器监听器；挂载时启动，卸载时停止，重新挂载后恢复。
依赖关系在修改页面前校验。如果插件初始化失败，挂载流程会回收宿主、已完成
初始化的插件以及通过插件上下文注册的订阅，再抛出原始错误。
插件仍需在初始化抛错时自行清理直接创建的浏览器副作用。

默认 localStorage 适配器采用尽力持久化：存储不可用或配额不足时，
工具栏控件仍可基于内存状态正常工作。

窄屏下工具栏可以横向滚动，首个控件始终可达；方向键导航会将获得焦点的控件
滚动到可见位置。固定模式的页面预留空间跟随工具栏实际高度。
