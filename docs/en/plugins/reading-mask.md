# Reading mask

`@a11y-now/plugin-reading-mask` · Shortcut `Ctrl+Alt+G` · **optional add-on**

Dims the page except for a clear horizontal band that follows the pointer,
helping low-vision and dyslexic readers keep their place on the line. The
mask renders inside the toolbar's Shadow DOM with `pointer-events: none` —
it never blocks interaction or touches the page DOM.

## Usage

```ts
import { readingMask } from '@a11y-now/plugin-reading-mask'
import { createA11yNow } from 'a11y-now'

createA11yNow({ plugins: [readingMask()] }).mount()
```

## Options

| Option   | Default              | Description                         |
| -------- | -------------------- | ----------------------------------- |
| `height` | `120`                | Height of the clear band (px)       |
| `color`  | `rgba(0, 0, 0, 0.5)` | Mask color above and below the band |

## API

```ts
const api = instance.getPlugin('reading-mask')
api?.toggle()
api?.isEnabled()
```
