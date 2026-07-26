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
