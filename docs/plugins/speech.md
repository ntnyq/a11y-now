# 语音朗读

`@a11y-now/plugin-speech` · 快捷键 `Ctrl+Alt+V / K / F`

声音开关、语速调节（1~3 倍）与指读/连读两种阅读方式。

## 连读：逐段队列

连读不再一次性朗读全文，而是把主内容按叶级块元素
（`h1~h6 / p / li / blockquote / td` 等）切成队列逐段朗读：

- 当前段落带 `data-a11y-reading` 高亮描边并滚动到视口中央；
- 每段播报 `speech:reading { index, total }` 事件，结束或中断时播报
  `speech:reading-end`（大字幕插件天然逐段跟随）;
- 切回指读、关闭声音、进入读屏专用模式或重置时立即停止；
- 默认不再截断字数（原 3000 字上限废弃，`continuousLimit: 0` 表示不限）。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { speech } from '@a11y-now/plugin-speech'

createA11yNow({ plugins: [speech()] }).mount()
```

## 选项

| 选项              | 默认           | 说明                           |
| ----------------- | -------------- | ------------------------------ |
| `hoverDelay`      | `150`          | 指读 hover 防抖（ms）          |
| `continuousLimit` | `0`            | 连读单次入队字符上限，`0` 不限 |
| `scrollIntoView`  | `true`         | 连读时滚动当前段落到视口       |
| `segmentSelector` | 内置块级选择器 | 自定义分段选择器               |

## Api

```ts
const api = instance.getPlugin('speech')
api?.readPage() // 从头开始连读
api?.stopReading()
api?.isReading()
api?.setMode('continuous')
```

## 远程 TTS 引擎

Web Speech 的中文音色参差不齐。`@a11y-now/core` 提供
`createRemoteTTSEngine` 参考实现，对接自建或云厂商 TTS——默认契约为
`POST endpoint`、JSON `{ text, locale, rate }`、响应为音频流：

```ts
import { createA11yNow, createRemoteTTSEngine } from 'a11y-now'

createA11yNow({
  speechEngine: createRemoteTTSEngine({
    endpoint: '/api/tts',
    headers: { authorization: `Bearer ${token}` },
  }),
}).mount()
```

其他厂商协议可通过 `body`（自定义请求体）、`resolveAudio`（响应 → 可播放
URL）、`fetchImpl` 与 `clientRate`（语速在客户端经 `playbackRate` 应用，
服务端渲染语速时关闭）适配。引擎自带请求中断、换段取消与逐段 `onEnd`
回调，与连读队列直接协作。
