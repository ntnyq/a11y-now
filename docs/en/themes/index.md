# Themes and token reference

Themes are defined with `defineTheme` from `@a11y-now/core` (token keys and
value types are checked at compile time). Official theme packages inline it
at build time and stay zero-runtime — see [write a theme](/en/guide/write-a-theme).

## Official themes

| Package                         | Display name  | Swatch (background / text / links)                                                                                                                                                                                                                                                                                                                                  | Page background | Text      | Links          |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------- | -------------- |
| `@a11y-now/theme-default`       | Default       | —                                                                                                                                                                                                                                                                                                                                                                   | untouched       | untouched | untouched      |
| `@a11y-now/theme-deep-blue`     | Deep Blue     | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(0,51,92)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span>   | rgb(0,51,92)    | white     | white          |
| `@a11y-now/theme-chocolate`     | Chocolate     | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(98,43,43)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span>  | rgb(98,43,43)   | white     | white          |
| `@a11y-now/theme-high-contrast` | High Contrast | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(0,0,0)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(255,184,0)"></span>                  | rgb(0,0,0)      | white     | rgb(255,184,0) |
| `@a11y-now/theme-forest`        | Forest        | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(34,139,34)"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff;border:1px solid #8886"></span> | rgb(34,139,34)  | white     | white          |

## Toolbar tokens (`--a11y-*`, applied to the shadow `:host`)

| Token                 | Default        | Purpose                                   |
| --------------------- | -------------- | ----------------------------------------- |
| `color-bg`            | #ffffff        | Toolbar background                        |
| `color-fg`            | #1f2329        | Toolbar text                              |
| `color-accent`        | #0b5cad        | Accent color                              |
| `color-border`        | #d0d3d6        | Borders                                   |
| `color-btn-hover-bg`  | #f2f3f5        | Button hover background                   |
| `color-btn-active-bg` | #e8f3ff        | Button active background                  |
| `color-btn-active-fg` | #0b5cad        | Button active text                        |
| `color-disabled-fg`   | #a8abb0        | Disabled text                             |
| `color-focus-ring`    | #fcff00        | Focus outline color                       |
| `toolbar-height`      | 84px           | Toolbar height                            |
| `toolbar-justify`     | center         | Toolbar row alignment (justify-content)   |
| `btn-size`            | 56px           | Button size                               |
| `font-size`           | 14px           | Font size                                 |
| `font-size-caption`   | 42px           | Caption-bar font size                     |
| `radius`              | 6px            | Corner radius                             |
| `outline-width`       | 3px            | Focus outline width                       |
| `z-index`             | 2147483000     | Stacking level                            |
| `transition`          | 120ms ease-out | Motion (0 under `prefers-reduced-motion`) |

## Page tokens (`--a11y-page-*`, applied to `documentElement`)

| Token            | Default           | Purpose                      |
| ---------------- | ----------------- | ---------------------------- |
| `bg`             | (empty)           | Page background              |
| `fg`             | (empty)           | Page text                    |
| `link`           | (empty)           | Link color                   |
| `region-outline` | 2px solid #ff6c00 | Region highlight outline     |
| `focus-outline`  | 3px solid #fcff00 | Focus outline                |
| `cursor-color`   | #ffd700           | Big cursor / crosshair color |

## The hard rule

Component styles may **only reference semantic tokens** — no hard-coded
colors or sizes; switching themes only rewrites variable values. That is
what lets any third-party theme fully recolor both the toolbar and the page.
