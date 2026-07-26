# Elder mode

`@a11y-now/plugin-elder-mode` · Shortcut `Ctrl+Alt+O` · **optional add-on**

A care mode for older users: sets a minimum font size on content elements
(`max(1em, 18px)`, resolved through the parent so nothing compounds),
relaxes line and letter spacing, underlines links and thickens focus
outlines. It does not use whole-page zoom, so it never conflicts with the
[page zoom](/en/plugins/zoom) plugin.

While enabled, `<html>` carries an `a11y-elder` class that sites can hook
to add their own care-mode styles.

## Usage

```ts
import { createA11yNow } from 'a11y-now'
import { elderMode } from '@a11y-now/plugin-elder-mode'

createA11yNow({ plugins: [elderMode()] }).mount()
```

## Options

| Option        | Default | Description                  |
| ------------- | ------- | ---------------------------- |
| `minFontSize` | `18`    | Content font-size floor (px) |
| `lineHeight`  | `1.6`   | Line height                  |

## API

```ts
const api = instance.getPlugin('elder-mode')
api?.toggle()
api?.isEnabled()
```
