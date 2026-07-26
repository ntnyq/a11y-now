# Built-in plugins

Every plugin lives in `packages-plugins/`, one package per plugin,
individually installable:

| Package                                                       | Feature            | Shortcut             |
| ------------------------------------------------------------- | ------------------ | -------------------- |
| [`@a11y-now/plugin-region-nav`](/en/plugins/region-nav)       | Region navigation  | `Alt+1 ~ Alt+6`      |
| [`@a11y-now/plugin-speech`](/en/plugins/speech)               | Read aloud         | `Ctrl+Alt+V / K / F` |
| [`@a11y-now/plugin-screen-reader`](/en/plugins/screen-reader) | Screen-reader mode | `Ctrl+Alt+R`         |
| [`@a11y-now/plugin-theme`](/en/plugins/theme)                 | Theme switcher     | `Ctrl+Alt+T`         |
| [`@a11y-now/plugin-zoom`](/en/plugins/zoom)                   | Page zoom          | `Ctrl+Alt+= / -`     |
| [`@a11y-now/plugin-big-cursor`](/en/plugins/big-cursor)       | Big cursor         | `Ctrl+Alt+M`         |
| [`@a11y-now/plugin-crosshair`](/en/plugins/crosshair)         | Crosshair          | `Ctrl+Alt+N`         |
| [`@a11y-now/plugin-caption`](/en/plugins/caption)             | Caption bar        | `Ctrl+Alt+B`         |
| [`@a11y-now/plugin-reset`](/en/plugins/reset)                 | Reset              | `Ctrl+Alt+C`         |
| [`@a11y-now/plugin-pin`](/en/plugins/pin)                     | Pin                | `Ctrl+Alt+L`         |
| [`@a11y-now/plugin-help`](/en/plugins/help)                   | Help               | `Ctrl+Alt+?`         |
| [`@a11y-now/plugin-exit`](/en/plugins/exit)                   | Exit               | `Ctrl+Alt+E`         |

## Optional add-ons

The following plugins are not part of the `a11y-now` aggregate package or
the full preset (they carry third-party dependencies, or change the page's
appearance by default) — install them individually as needed:

| Package                                                 | Feature                              | Shortcut     |
| ------------------------------------------------------- | ------------------------------------ | ------------ |
| [`@a11y-now/plugin-pinyin`](/en/plugins/pinyin)         | Pinyin annotation (pinyin-pro)       | `Ctrl+Alt+P` |
| [`@a11y-now/plugin-zh-convert`](/en/plugins/zh-convert) | Simplified ⇄ Traditional (opencc-js) | `Ctrl+Alt+J` |
| [`@a11y-now/plugin-elder-mode`](/en/plugins/elder-mode) | Elder mode                           | `Ctrl+Alt+O` |
| [`@a11y-now/plugin-auto-theme`](/en/plugins/auto-theme) | Auto theme (follows the system)      | `Ctrl+Alt+U` |

All plugins follow the same contract and test template — see
[write a plugin](/en/guide/write-a-plugin).
