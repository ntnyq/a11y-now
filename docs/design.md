# 知乎无障碍模式工具栏（#ariaToptoolbar）审查报告

> 审查对象：https://www.zhihu.com/signin 页面点击「无障碍模式」按钮后弹出的顶部无障碍工具栏
> 审查日期：2026-07-26
> 审查方式：Chrome 实机操作 + DOM / 样式 / Cookie / localStorage 逐项检查，并对各功能按钮进行了实际点击验证

## 1. 概述

知乎登录页内置了一套第三方网页无障碍改造工具条。点击页面上的「无障碍模式」按钮（`button.css-1jb1bpx`）后，页面顶部弹出固定工具栏 `#ariaToptoolbar`，同时页面底部预置大字幕栏 `#accscreen`。

该服务并非知乎自研，而是由信息无障碍服务商「世纪大家」提供（服务域名 `service.govwza.cn`），知乎将其脚本托管在自己的 CDN 上：

| 项目 | 值 |
| --- | --- |
| 核心脚本 | `https://static.zhihu.com/event/wza/4633_1/aria.js?appid=a3637ace...`（defer 加载，`id="ariascripts"`） |
| 辅助脚本 | `pinyin.min.js`（拼音标注能力） |
| 版本 | v4.6.33（资源 URL 的 `v` 参数） |
| 服务端 | `https://service.govwza.cn`（配置、语音合成、文件服务共用此域名） |
| appid | `a3637ace5dc3a347f6863b0bac487599`（绑定域名 www.zhihu.com） |

激活状态通过 Cookie `ariaStatus=true` 持久化：刷新或再次访问知乎页面时，工具栏会自动恢复开启，直到用户点击「退出服务」。

## 2. 挂载方式与整体架构

### 2.1 挂载位置：`<html>` 直接子节点

工具栏**不挂在 `<body>` 内**，而是与 `<body>` 平级，直接挂在 `<html>` 下：

```
<html class="itcauecng">
├── <head>
├── <body id="ariao17y4rsq7og" class="ariabodytopfiexed">   ← 页面本体（被加上随机 id 与定位类）
├── <style id="ariatoolcss">                                 ← 工具栏自身样式（约 9 KB）
├── <div id="ariaToptoolbar" class="main-menu noscale ariaskiptheme expanded">  ← 顶部工具栏
└── <div id="accscreen" class="noscale hidden930 ariaskiptheme">                ← 底部大字幕栏
```

这样做的好处：页面对 `body` 施加的缩放、滤镜、主题改色都不会波及工具栏本身。

### 2.2 自定义标签，隔离页面样式

工具栏内部结构完全使用**自定义元素**搭建：`<ariaul>`、`<ariali>`、`<ariai>`、`<arialabel>`、`<cc>`、`<t>`。浏览器把未知标签当作行内元素处理，而页面里针对 `ul/li/i/label` 的既有 CSS 选择器一概命中不了它们，天然避免样式污染。

### 2.3 页面让位与反缩放

- 激活后 `body` 被加上 `ariabodytopfiexed` 类，并注入 `padding-top: 100px`，为 100px 高的工具栏让出空间；另有一批站点定制 CSS（配置里的 `golabCss`）逐个修正知乎各种 fixed 头部的 top 值。
- 工具栏和大字幕带 `noscale` 类：当用户使用「放大/缩小」功能缩放网页时，注入的 `.noscale { zoom: 1 !important }` 保证工具栏自身不跟着缩放。

### 2.4 全量元素标记

脚本会给页面上几乎每个元素追加 `ariaskiptheme` 类 / `aria-skiptheme` 属性（由配置项 `golabSkipTheme` 的选择器列表决定哪些元素在换肤时跳过），这是它实现「一键换肤但不破坏验证码、图片、输入框」的基础。

### 2.5 读屏引导入口

激活后在文档最前部注入一个 1×1 像素的隐形锚点，供读屏软件朗读进入引导：

```html
<a id="ariaTipText" role="pagedescription"
   aria-label="欢迎进入 知乎 - 有问题，就会有答案,盲人用户使用操作智能引导，
   请按快捷键Ctrl+Alt+R；阅读详细操作说明请按快捷键Ctrl+Alt+问号键。">
```

## 3. #ariaToptoolbar 内部结构

整个工具栏 HTML 约 7.5 KB，单行布局：

```
#ariaToptoolbar.main-menu.noscale.expanded
└── ariaul
    ├── ariali#acccont-logo            ← 服务 logo（背景图 zh-CN1.png）
    └── ariali.acc-m-wrap.ariaBtns
        └── ariaul
            ├── ariali.ariaAreas       ← 六个区域导航按钮（见 4.1）
            │   ├── div#acccross1 …… div#acccross6
            ├── ariali#accrole         ← 读屏专用
            ├── ariali#accvol-k        ← 声音开关
            ├── ariali#accspeed-m      ← 语速
            ├── ariali#accread-d       ← 阅读方式
            ├── ariali（配色）
            ├── ariali#acc-text-big    ← 放大
            ├── ariali#acc-text-small  ← 缩小
            ├── ariali#accmouse        ← 鼠标样式
            ├── ariali#acccross        ← 十字线
            ├── ariali#accbig          ← 大字幕
            ├── ariali#accreset        ← 重置
            ├── ariali（固定）
            ├── ariali#acchelpbook     ← 说明
            └── ariali#accclose        ← 退出服务
```

每个工具项的通用结构：`<arialabel>`（文字标签）+ `<ariai class="ariaicon ariaicon-xxx">`（图标，同时承载 `title` 提示与点击行为）。当前状态、快捷键全部写在 `title` 里，随状态切换动态更新。

响应式：部分按钮带 `hidden740` / `hidden930` 类，在视口宽度不足 930px / 740px 时隐藏次要功能；`notonlineread` 类的按钮在「读屏专用」模式下整体隐藏（见 4.2）。

## 4. 功能逐项审查

### 4.1 区域导航（视窗区…正文区，ALT+1～6）

工具栏左半部是六个「区域」按钮，脚本自动扫描页面内容并把元素归类到六类区域，按钮上实时显示该区域的元素数量，数量为 0 的按钮加 `disable` 类置灰：

| 按钮 | 快捷键 | 登录页实测数量 |
| --- | --- | --- |
| 视窗区 | ALT+1 | 0（置灰） |
| 导航区 | ALT+2 | 0（置灰） |
| 交互区 | ALT+3 | 1 |
| 服务区 | ALT+4 | 1 |
| 列表区 | ALT+5 | 0（置灰） |
| 正文区 | ALT+6 | 0（置灰） |

DOM 特征：`<div id="acccross3" regiontype="3" class="readsrc ariaregionbutton">`，内含区域名、计数（`aria-label="交互区1"`）和快捷键说明三个 `arialabel`。

**实测点击「交互区」**：登录表单 `form.SignFlow` 被加上 `currentRegion3 ariafocus ariaregion` 类，获得琥珀色高亮描边（`outline: 2px solid rgb(255,184,0)`）并获取焦点，当前按钮加 `ariatoolselect` 选中态；配合语音会朗读区域内容，重复按 ALT+n 在区域内循环访问（提示语「按Alt+{0}循环访问」），按 ESC 退出。

### 4.2 读屏专用（Ctrl+Alt+R）

`title`：「读屏专用：快捷键Ctrl+Alt+R，适用于使用读屏软件的用户，若无读屏软件可通过Ctrl+Alt+V开启声音获取语音提示」。

**实测**：开启后，所有带 `notonlineread` 类的工具项（语速、阅读方式、配色、放大、缩小、鼠标样式、十字线、重置、固定）`display:none` —— 这些视觉辅助对使用 NVDA/VoiceOver 等读屏软件的用户没有意义；工具栏切换为读屏优化输出模式（配合语言表中大量 role→中文话术的映射，如 `combobox→下拉框`、`haspopup→当前有浮动窗口，按ctrl+下键进入窗口…`）。再次点击恢复。

### 4.3 声音开关（Ctrl+Alt+V）

内置 TTS 自朗读的总开关（语音由 `service.govwza.cn` 合成）。**实测**：点击后图标类在 `ariaicon-open_sound` / `ariaicon-close_sound` 间切换，`title` 在「当前声音已开启，关闭声音Ctrl+Alt+V」/「当前声音已关闭…」间切换，状态写入 Cookie `ariavoiceEnable`。

### 4.4 语速（Ctrl+Alt+K）

`title`：「当前语速为1倍，调节语速Ctrl+Alt+K」。配置 `voice: { rate: 1, minRate: 1, maxRate: 3 }`；语言表中定义了 7 档：正常、1.25倍、1.5倍、2倍、2.25倍、2.5倍、3倍，超限时提示「当前语速已超限，不可再调整」。

### 4.5 阅读方式（Ctrl+Alt+F）

在两种朗读模式间切换，状态存 Cookie `ariaReadtype`：

- **指读**（默认，`ariaReadtype=1`）：鼠标指到哪读到哪；
- **连读**（`ariaReadtype=2`）：从当前位置起连续朗读。

### 4.6 配色（Ctrl+Alt+T）

点击循环切换 5 套主题，Cookie `ariatheme=0..4` 持久化。**实测循环顺序与主题配置**（来自 localStorage 缓存的主题表）：

| 序号 | 主题 | 背景色 | 文字色 | 链接色 |
| --- | --- | --- | --- | --- |
| 0 | 默认 | 原样 | 原样 | 原样 |
| 1 | 深蓝白 | rgba(0,51,92,1) | 白 | 白 |
| 2 | 巧克力色 | rgba(98,43,43,1) | 白 | 白 |
| 3 | 黑底白字 | rgba(0,0,0,1) | 白 | rgba(255,184,0,1) |
| 4 | 森林绿 | rgba(34,139,34,1) | 白 | 白 |

每套主题还细分了 `mouseover`（悬停高亮）、`region`（区域描边，如 `2px solid #ff6c00`）、`focus`（焦点描边 `3px solid #fcff00`）、光标色、亮度/对比度/灰度等子配置。

**实现机制（实测）**：换肤不改元素内联样式，而是动态生成若干巨型 `<style>`（实测单个最大约 122 KB，id 为 `aria+随机串`），对页面元素逐类覆盖背景/文字色；带 `ariaskiptheme` 标记的元素（验证码、图片、输入框等，由 `golabSkipTheme` 选择器清单指定）被排除在外。工具栏按钮自身的主题预览色也用一个小 `<style id="ariathemebtn">` 单独渲染。

### 4.7 放大 / 缩小（Ctrl+Alt+加号 / 减号）

**实测**：点击「放大」后 `title` 变为「当前网页缩放倍数为1.1倍…」，Cookie `ariaScale=1.1`；注入的 `<style id="ariabodyscale">` 用 CSS `zoom` 对页面整体缩放，同时 `.noscale` 反缩放保证工具栏不变形，并强制 checkbox/radio 有最小尺寸。配置限定范围 `minZoom:1 ~ maxZoom:1.3`，步长 0.1，越界时提示「网页放大倍数已经超过允许最大倍数」。

### 4.8 鼠标样式（Ctrl+Alt+M）

大鼠标开关（`title`：「当前大鼠标已关闭，开启大鼠标Ctrl+Alt+M」），开启后以 CSS cursor 替换为大号光标图（主题包 `public/theme/1/images/` 内资源），状态存 Cookie `ariaMousemode`。

### 4.9 十字线（Ctrl+Alt+N）

**实测**：开启后在 `<html>` 下注入两个元素 `#ariamouseten1`、`#ariamouseten2`（水平线 + 垂直线），跟随鼠标移动形成十字定位线，帮助低视力用户对准阅读行；关闭后两个元素被移除。状态存 Cookie `ariaMouseten`。

### 4.10 大字幕（Ctrl+Alt+B）

**实测**：开启后底部 `#accscreen` 加 `expanded` 类展开为屏幕底部字幕条，朗读到的文字会以特大号字体（`aria-fontsize="huge"`）同步显示在 `#acctip` 内。字幕条自带工具组：

```html
<div id="accscreen" class="noscale hidden930">
  └── ariaul
      ├── ariali#acctip                ← 大字幕文本区
      └── ariali.acctool
          ├── ariai#accscreen-close    ← 关闭大字幕
          ├── ariai#accscreen-vol      ← 音量指示（title：Shift+A，默认隐藏）
          ├── arialabel#accscreen-py   ← 拼音开关（「拼音已关闭/已启用」）
          └── arialabel#accscreen-jt   ← 简体/繁体切换（「简体已启用」）
```

其中**拼音**（为字幕文字标注拼音，依赖 pinyin.min.js）和**简繁转换**是大字幕栏专属功能。状态存 Cookie `ariaBigsrc`。

### 4.11 重置（Ctrl+Alt+C）

`title`：「重新设置Ctrl+Alt+C」。将配色、缩放、语速、鼠标、十字线、大字幕等全部恢复默认，成功后提示「重置成功」。

### 4.12 固定（Ctrl+Alt+L）

`title`：「固定或者取消固定工具栏，请按Ctrl+Alt+L」。控制工具栏是否固定在页面顶部（固定时 body 顶部让位 100px），状态存 Cookie `ariaFixed`（实测默认 `true`，图标带 `fixedSelect` 选中态）。

### 4.13 说明（Ctrl+Alt+问号）

`title`：「开启操作说明Ctrl+Alt+问号键」。**实测**：点击后不弹出可视对话框，而是以语音播报完整操作指南（关闭声音时无可见反馈），符合其面向视障用户的定位。

### 4.14 退出服务（Ctrl+Alt+E）

关闭无障碍模式：移除工具栏与注入样式、恢复页面原貌，并把 Cookie `ariaStatus` 置为 `false`（不再自动恢复）。

### 4.15 隐藏能力：关怀版（Ctrl+Alt+O）

语言表中还存在「关怀版 / 轻松阅读模式」文案（「您已打开轻松阅读模式，关闭请按Ctrl+Alt+O」），即老年关怀版页面切换能力；本页配置 `useOldFixed:false`、Cookie `ariaoldFixedStatus=false`，未在工具栏上暴露按钮。

## 5. 全局快捷键汇总

| 快捷键 | 功能 |
| --- | --- |
| ALT+1 ~ ALT+6 | 进入视窗/导航/交互/服务/列表/正文区，重复按循环访问区域内元素 |
| Ctrl+Alt+R | 读屏专用模式 |
| Ctrl+Alt+V | 声音开/关 |
| Ctrl+Alt+K | 调节语速 |
| Ctrl+Alt+F | 指读 / 连读切换 |
| Ctrl+Alt+T | 循环切换配色主题 |
| Ctrl+Alt+加号 / 减号 | 网页放大 / 缩小（1.0 ~ 1.3 倍） |
| Ctrl+Alt+M | 大鼠标开/关 |
| Ctrl+Alt+N | 十字线开/关 |
| Ctrl+Alt+B | 大字幕开/关 |
| Ctrl+Alt+C | 重置全部设置 |
| Ctrl+Alt+L | 固定 / 取消固定工具栏 |
| Ctrl+Alt+问号 | 语音操作说明 |
| Ctrl+Alt+E | 退出无障碍服务 |
| Ctrl+Alt+O | 关怀版（本页未启用按钮） |
| Alt+9 | 放大查看本页所有图片 |
| Alt+0 | 居中放大二维码 |
| Ctrl+Enter | 进入下级内容 |
| Ctrl+↓ | 进入浮动窗口（Tab 遍历，ESC 返回） |
| Shift+A | 大字幕音量 |
| ESC | 退出所有弹出窗口 / 当前区域 |

## 6. 状态持久化

### 6.1 Cookie（按功能开关逐项存储）

| Cookie | 含义 | 实测值 |
| --- | --- | --- |
| `ariaStatus` | 无障碍模式总开关 | true |
| `ariaFixed` | 工具栏固定 | true |
| `ariavoiceEnable` | 声音开关 | true |
| `ariatheme` | 主题序号（0~4） | 0 |
| `ariaScale` | 网页缩放倍数 | 1 |
| `ariaReadtype` | 阅读方式（1 指读 / 2 连读） | 1 |
| `ariaMouseten` | 十字线 | false |
| `ariaMousemode` | 鼠标样式 | null |
| `ariaBigsrc` | 大字幕 | false |
| `ariaoldFixedStatus` | 关怀版 | false |
| `ariawapChangeViewPort` | 移动端视口调整 | false |

### 6.2 localStorage（配置缓存）

键名 `aria`，以 appid 为顶层键，缓存整份远端配置（实测约 70 KB），包含：

- `runtime.settings`：全部功能开关与参数（语音速率区间、缩放区间、`golabSkipTheme` 跳过选择器、`golabCss` 站点定制样式、移动端策略等 50+ 项）；
- `data.languages['zh-CN']`：229 条界面文案 / 播报话术（含所有按钮各状态的提示语、HTML 标签与 ARIA role 的中文读法映射）；
- `data.theme`：5 套主题的完整配色定义；
- `security`：appid、域名、referer、时间戳（请求签名用）。

## 7. 对 a11y-now 的设计启示

1. **挂载隔离**：工具栏挂 `<html>` 下 + 自定义标签 + `noscale` 反缩放，三层手段把「改造页面」和「工具自身」彻底隔离，值得直接借鉴。
2. **状态即 title**：每个按钮把当前状态和快捷键写进 `title`/`aria-label` 并随状态实时更新，读屏与鼠标悬停获得一致信息，成本极低。
3. **区域化导航**：自动扫描并把页面分为六类语义区 + 计数 + 置灰 + ALT 快捷键循环访问，是整套方案里对盲人用户最有价值的交互模型。
4. **双模式设计**：自带 TTS 的「自朗读模式」与让位给专业读屏软件的「读屏专用模式」分开处理，同一工具栏按 `notonlineread` 类切换可见性。
5. **换肤白名单**：全量标记 + `golabSkipTheme` 排除清单，换肤时跳过验证码/图片/表单控件，避免「一换肤页面就废」的常见问题；但生成百 KB 级 style 的做法性能开销大，a11y-now 可考虑 CSS variables + `filter` 方案替代。
6. **逐项 Cookie 持久化**：每个开关独立 Cookie（域级生效），配置整包缓存 localStorage，刷新与跨页均可恢复。
7. **快捷键体系**：功能键统一 `Ctrl+Alt+*`、区域键统一 `ALT+数字`，心智负担小；需注意与浏览器/读屏软件快捷键的冲突检测。

---

*附：审查过程中实际验证过的操作 —— 声音开关切换、5 套主题循环切换、放大/缩小（1.0↔1.1）、十字线开关（元素注入/移除）、大鼠标开关、大字幕展开/收起、读屏专用模式切换、交互区（ALT+3）区域高亮与焦点、说明按钮；所有状态在审查结束后均已还原为默认值，无障碍模式保持开启（可按 Ctrl+Alt+E 退出）。*
