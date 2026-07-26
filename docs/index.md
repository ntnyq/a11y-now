---
layout: home

hero:
  name: a11y-now
  text: 网页无障碍工具栏
  tagline: 插件化 · 可主题化 · 多框架 · 类型安全 · 卸载零残留
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 设计资料
      link: /design

features:
  - title: 一行接入
    details: createA11yNow().mount() 即获得完整无障碍工具栏，也可按需组装 @a11y-now/* 各包。
  - title: 插件化内核
    details: 十二个官方功能全部以插件实现，内核零业务；第三方插件遵循同一契约。
  - title: CSS 变量主题
    details: 换肤只改变量值、不重建样式表；主题是零运行时的纯数据包。
  - title: 多框架支持
    details: Vue / React / Svelte / Solid 适配包与 <a11y-now> Web Component。
  - title: 类型安全
    details: 事件名、插件名、插件 Api、主题 Token 全部编译期校验。
  - title: 卸载零残留
    details: 所有页面改动登记回收，退出后 DOM 与接入前逐字节一致（浏览器实测保障）。
---
