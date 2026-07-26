# Nuxt 接入

`@a11y-now/nuxt`

零依赖的 Nuxt module（不引入 `@nuxt/kit`）：注册一个仅客户端的插件，
按 preset 挂载工具栏并注入 `$a11yNow`。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@a11y-now/nuxt'],
  a11yNow: {
    preset: 'full', // 'full' | 'reading' | 'screen-reader'
  },
})
```

```ts
// 任意组件/组合式函数内
const { $a11yNow } = useNuxtApp()
$a11yNow.getPlugin('zoom')?.zoomIn()
```

## 模块选项（configKey `a11yNow`）

| 选项                       | 默认   | 说明                                        |
| -------------------------- | ------ | ------------------------------------------- |
| `preset`                   | `full` | 挂载的内置 preset                           |
| `autoMount`                | `true` | 关闭后仅注入 `$a11yNow`，由你手动 `mount()` |
| `respectExit`              | `true` | 尊重用户上次「退出服务」的选择              |
| `locale` / `storagePrefix` | —      | 透传给 `createA11yNow`                      |

模块选项需可序列化（经 `runtimeConfig.public` 传给客户端）。若要自定义
插件列表、远程 TTS 引擎等非序列化配置，跳过本模块，直接写一个 Nuxt
客户端插件并使用 [`@a11y-now/vue`](/frameworks/vue) 或 `a11y-now`。
