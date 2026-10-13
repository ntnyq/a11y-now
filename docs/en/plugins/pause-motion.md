# Pause motion

`@a11y-now/plugin-pause-motion` · Shortcut `Ctrl+Alt+X` · **optional add-on**

Freezes page motion for vestibular-disorder and attention-sensitive users:
injects a forced `prefers-reduced-motion`-style override (pauses every CSS
animation, disables transitions and smooth scrolling), pauses autoplaying
video, and best-effort freezes same-origin GIFs onto a still first frame.
Disabling restores everything (stylesheet removed, autoplay videos resume,
GIFs get their original source back).

- `[data-a11y-skip]` subtrees stay untouched;
- cross-origin GIFs cannot be snapshotted (tainted canvas) and are left as
  they are — best effort by design;
- not part of the `a11y-now` aggregate package or the full preset —
  install it separately.

## Usage

```ts
import { pauseMotion } from '@a11y-now/plugin-pause-motion'
import { createA11yNow } from 'a11y-now'

createA11yNow({ plugins: [pauseMotion()] }).mount()
```

## Options

| Option       | Default | Description                              |
| ------------ | ------- | ---------------------------------------- |
| `freezeGifs` | `true`  | Try to freeze same-origin GIFs to stills |

## API

```ts
const api = instance.getPlugin('pause-motion')
api?.toggle()
api?.isEnabled()
```
