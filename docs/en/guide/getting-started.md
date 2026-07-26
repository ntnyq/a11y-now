# Getting started

## Install

::: code-group

```shell [pnpm]
pnpm add a11y-now
```

```shell [npm]
npm install a11y-now
```

:::

## One line (full preset)

```ts
import { createA11yNow } from 'a11y-now'

createA11yNow().mount()
```

This mounts the toolbar with all 12 official plugins and 5 themes.

## Via CDN

```html
<script src="https://unpkg.com/a11y-now/dist/a11y-now.iife.js"></script>
<script>
  A11yNow.createA11yNow().mount()
</script>
```

## Compose à la carte

```ts
import { createA11yNow } from '@a11y-now/core'
import { themeSwitcher } from '@a11y-now/plugin-theme'
import { zoom } from '@a11y-now/plugin-zoom'
import { deepBlue } from '@a11y-now/theme-deep-blue'
import { defaultTheme } from '@a11y-now/theme-default'

createA11yNow({
  plugins: [zoom({ max: 1.5 }), themeSwitcher()],
  themes: [defaultTheme, deepBlue],
}).mount()
```

## Respect the user's exit choice

```ts
import { createA11yNow, wasExited } from 'a11y-now'

if (!wasExited()) {
  createA11yNow().mount()
}
```

## UI language

The toolbar ships English and Simplified Chinese out of the box and follows
`<html lang>` (any `en*` tag maps to English, any `zh*` tag to Chinese;
anything else falls back to Chinese). Set it explicitly or bring your own
locale via options:

```ts
createA11yNow({ locale: 'en' }).mount()

createA11yNow({
  locale: 'fr-FR',
  messages: { 'fr-FR': { 'toolbar.label': "Barre d'accessibilité" } },
}).mount()
```

## Presets

| Preset                 | Contents                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| `fullPreset()`         | All 12 plugins + 5 themes (the default)                                        |
| `readingPreset()`      | Low-vision reading: speech / themes / zoom / big cursor / crosshair / caption… |
| `screenReaderPreset()` | Screen-reader oriented: region navigation + screen-reader mode + help + exit   |
