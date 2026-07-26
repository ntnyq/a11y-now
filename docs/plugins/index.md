# 内置插件总览

全部插件位于 `packages-plugins/`，一插件一包，可单独安装：

| 插件包                                                     | 功能     | 快捷键               |
| ---------------------------------------------------------- | -------- | -------------------- |
| [`@a11y-now/plugin-region-nav`](/plugins/region-nav)       | 区域导航 | `Alt+1 ~ Alt+6`      |
| [`@a11y-now/plugin-speech`](/plugins/speech)               | 语音朗读 | `Ctrl+Alt+V / K / F` |
| [`@a11y-now/plugin-screen-reader`](/plugins/screen-reader) | 读屏专用 | `Ctrl+Alt+R`         |
| [`@a11y-now/plugin-theme`](/plugins/theme)                 | 配色切换 | `Ctrl+Alt+T`         |
| [`@a11y-now/plugin-zoom`](/plugins/zoom)                   | 页面缩放 | `Ctrl+Alt+= / -`     |
| [`@a11y-now/plugin-big-cursor`](/plugins/big-cursor)       | 大鼠标   | `Ctrl+Alt+M`         |
| [`@a11y-now/plugin-crosshair`](/plugins/crosshair)         | 十字线   | `Ctrl+Alt+N`         |
| [`@a11y-now/plugin-caption`](/plugins/caption)             | 大字幕   | `Ctrl+Alt+B`         |
| [`@a11y-now/plugin-reset`](/plugins/reset)                 | 重置     | `Ctrl+Alt+C`         |
| [`@a11y-now/plugin-pin`](/plugins/pin)                     | 固定     | `Ctrl+Alt+L`         |
| [`@a11y-now/plugin-help`](/plugins/help)                   | 操作说明 | `Ctrl+Alt+?`         |
| [`@a11y-now/plugin-exit`](/plugins/exit)                   | 退出服务 | `Ctrl+Alt+E`         |

## 可选扩展包

以下插件不包含在 `a11y-now` 聚合包与 full preset 中（或带第三方依赖，
或行为默认改变页面外观），按需单独安装：

| 插件包                                               | 功能                   | 快捷键       |
| ---------------------------------------------------- | ---------------------- | ------------ |
| [`@a11y-now/plugin-pinyin`](/plugins/pinyin)         | 拼音标注（pinyin-pro） | `Ctrl+Alt+P` |
| [`@a11y-now/plugin-zh-convert`](/plugins/zh-convert) | 简繁转换（opencc-js）  | `Ctrl+Alt+J` |
| [`@a11y-now/plugin-elder-mode`](/plugins/elder-mode) | 关怀版/老年模式        | `Ctrl+Alt+O` |
| [`@a11y-now/plugin-auto-theme`](/plugins/auto-theme) | 自动配色（跟随系统）   | `Ctrl+Alt+U` |

所有插件遵循同一契约与测试模板，详见[编写插件](/guide/write-a-plugin)。
