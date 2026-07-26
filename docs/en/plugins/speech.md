# Read aloud

`@a11y-now/plugin-speech` · Shortcut `Ctrl+Alt+V / K / F`

Sound toggle, speech rate control (1–3×) and two reading modes:
point-to-read (hover) and continuous reading.

## Continuous reading: a segment queue

Continuous reading no longer speaks the whole page in one utterance. The
main content is split into leaf-level block elements
(`h1~h6 / p / li / blockquote / td` …) and spoken as a queue:

- the current segment gets a `data-a11y-reading` highlight outline and is
  scrolled to the center of the viewport;
- each segment emits a `speech:reading { index, total }` event, and the end
  or interruption emits `speech:reading-end` (the caption bar follows along
  segment by segment for free);
- switching back to point-to-read, muting, entering screen-reader mode or
  resetting stops the queue immediately;
- no more length cap by default (the old 3000-character limit is gone;
  `continuousLimit: 0` means unlimited).

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { speech } from '@a11y-now/plugin-speech'

createA11yNow({ plugins: [speech()] }).mount()
```

## Options

| Option            | Default                  | Description                                        |
| ----------------- | ------------------------ | -------------------------------------------------- |
| `hoverDelay`      | `150`                    | Point-to-read hover debounce (ms)                  |
| `continuousLimit` | `0`                      | Per-run character cap for the queue, `0` unlimited |
| `scrollIntoView`  | `true`                   | Scroll the current segment into view while reading |
| `segmentSelector` | built-in block selectors | Custom segmentation selector                       |

## API

```ts
const api = instance.getPlugin('speech')
api?.readPage() // start continuous reading from the top
api?.stopReading()
api?.isReading()
api?.setMode('continuous')
```

## Remote TTS engines

Web Speech voices vary wildly across platforms. `@a11y-now/core` ships a
`createRemoteTTSEngine` reference implementation for self-hosted or cloud
TTS — the default contract is `POST endpoint` with JSON
`{ text, locale, rate }` and an audio-stream response:

```ts
import { createA11yNow, createRemoteTTSEngine } from 'a11y-now'

createA11yNow({
  speechEngine: createRemoteTTSEngine({
    endpoint: '/api/tts',
    headers: { authorization: `Bearer ${token}` },
  }),
}).mount()
```

Other vendor protocols are covered by `body` (custom request payload),
`resolveAudio` (response → playable URL), `fetchImpl` and `clientRate`
(apply the rate client-side via `playbackRate`; turn it off when the server
renders the rate). The engine handles request abortion, cancel-on-segment-
switch and per-segment `onEnd` callbacks, cooperating directly with the
continuous-reading queue.
