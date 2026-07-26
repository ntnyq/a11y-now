# Chinese conversion

`@a11y-now/plugin-zh-convert` · Shortcut `Ctrl+Alt+J` · **optional add-on**

Converts visible page text between Simplified and Traditional Chinese
(Simplified → Taiwan Traditional by default), powered by
[opencc-js](https://github.com/nk2028/opencc-js). Turning it off restores
the original text exactly.

- ships with a `MutationObserver`, so text inserted or changed by SPAs is
  converted too;
- converts text nodes only — attribute text like `aria-label` / `title`
  stays untouched;
- skips `script/style/textarea/code/pre` and `[data-a11y-skip]` subtrees;
- not part of the `a11y-now` aggregate package or the full preset —
  install it separately.

## Usage

```ts
import { createA11yNow } from 'a11y-now'
import { zhConvert } from '@a11y-now/plugin-zh-convert'

createA11yNow({ plugins: [zhConvert()] }).mount()
```

## Options

| Option        | Default     | Description                                 |
| ------------- | ----------- | ------------------------------------------- |
| `from` / `to` | `cn` / `tw` | OpenCC direction (`cn/tw/twp/hk/t/jp`)      |
| `watch`       | `true`      | Watch and convert dynamic content           |
| `convert`     | —           | Custom conversion function, replaces OpenCC |

## API

```ts
const api = instance.getPlugin('zh-convert')
api?.toggle()
api?.isEnabled()
```
