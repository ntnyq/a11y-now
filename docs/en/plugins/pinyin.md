# Pinyin annotation

`@a11y-now/plugin-pinyin` · Shortcut `Ctrl+Alt+P` · **optional add-on**

Adds `<ruby>` pinyin annotations to Han characters in the main content
(powered by [pinyin-pro](https://github.com/zh-lx/pinyin-pro), with
word-level disambiguation of heteronyms). Turning it off restores the
original text node by node, leaving no trace.

- the `rt` annotations carry `aria-hidden`, so screen readers and
  point-to-read never speak the pinyin twice;
- skips `script/style/textarea/ruby/code/pre` and `[data-a11y-skip]` subtrees;
- not part of the `a11y-now` aggregate package or the full preset —
  install it separately.

## Usage

```ts
import { createA11yNow } from 'a11y-now'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'

createA11yNow({ plugins: [pinyinAnnotation()] }).mount()
```

## Options

| Option  | Default                                 | Description                                    |
| ------- | --------------------------------------- | ---------------------------------------------- |
| `root`  | `main, article, [role="main"]` → `body` | Root selector for annotation                   |
| `limit` | `10000`                                 | Per-run cap on annotated characters, `0` = off |

## API

```ts
const api = instance.getPlugin('pinyin')
api?.toggle()
api?.isEnabled()
```
