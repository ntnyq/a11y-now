# Text spacing

`@a11y-now/plugin-spacing` · Shortcut `Ctrl+Alt+S` · **optional add-on**

Cycles through three levels per WCAG 1.4.12 (text spacing):
**off → comfortable → loose**. The "comfortable" level is exactly the
1.4.12 test metrics (line height 1.5, letter spacing 0.12em, word spacing
0.16em, paragraph spacing 2em); "loose" goes a step further for dyslexic
readers. Styles are applied through a reclaimable stylesheet, and
`[data-a11y-skip]` subtrees stay untouched.

## Usage

```ts
import { createA11yNow } from 'a11y-now'
import { textSpacing } from '@a11y-now/plugin-spacing'

createA11yNow({ plugins: [textSpacing()] }).mount()
```

## Options

| Option   | Default          | Description                                     |
| -------- | ---------------- | ----------------------------------------------- |
| `levels` | `SPACING_LEVELS` | Custom level ladder (excluding "off"), any size |

## API

```ts
const api = instance.getPlugin('spacing')
api?.cycle() // advance to the next level
api?.setLevel(1) // 0 = off, then 1-based level index
api?.getLevel()
```

Every level change emits a `spacing:change { level }` event.
