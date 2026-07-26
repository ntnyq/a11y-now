import {
  configurePlugin,
  definePlugin,
  pageVar,
  speakableText,
} from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export type RegionType =
  | 'content'
  | 'interactive'
  | 'list'
  | 'nav'
  | 'service'
  | 'window'

export interface RegionNavOptions {
  /** Override the selector heuristics per region type. */
  selectors?: Partial<Record<RegionType, string>>
}

export interface RegionNavApi {
  clear: () => void
  counts: () => Record<RegionType, number>
  /** Enter a region; repeated calls cycle through its elements. */
  enter: (type: RegionType) => void
  rescan: () => void
}

/**
 * Region order mirrors the audited reference toolbar:
 * 视窗区 / 导航区 / 交互区 / 服务区 / 列表区 / 正文区 → Alt+1..6.
 */
export const REGION_TYPES: RegionType[] = [
  'window',
  'nav',
  'interactive',
  'service',
  'list',
  'content',
]

const DEFAULT_SELECTORS: Record<RegionType, string> = {
  content: 'main, article, [role="main"]',
  interactive: 'form, [role="form"], [role="search"]',
  list: 'ul, ol, [role="list"]',
  nav: 'nav, [role="navigation"]',
  service: 'aside, footer, [role="complementary"], [role="contentinfo"]',
  window: 'header, [role="banner"]',
}

const isVisible = (el: Element): boolean => {
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

const MARK_CLASS = 'a11y-region-current'
const STYLE_ID = 'region-nav'

const regionNavPlugin = definePlugin<RegionNavOptions, RegionNavApi>({
  messages: {
    'en-US': {
      'region.content': 'Content',
      'region.desc': '{name} ({count}), {shortcut}, repeat to cycle',
      'region.empty': 'This page has no {name}',
      'region.entered': '{name} {index} of {total}: {text}',
      'region.interactive': 'Interactive',
      'region.list': 'Lists',
      'region.nav': 'Navigation',
      'region.service': 'Services',
      'region.window': 'Viewport',
    },
    'zh-CN': {
      'region.content': '正文区',
      'region.desc': '{name}（{count}），{shortcut}，重复按循环访问',
      'region.empty': '本页面无{name}',
      'region.entered': '{name}第 {index} 个，共 {total} 个：{text}',
      'region.interactive': '交互区',
      'region.list': '列表区',
      'region.nav': '导航区',
      'region.service': '服务区',
      'region.window': '视窗区',
    },
  },
  name: 'region-nav',
  setup: ctx => {
    const selectors = { ...DEFAULT_SELECTORS, ...ctx.options.selectors }
    const found = new Map<RegionType, Element[]>()
    const indexes = new Map<RegionType, number>()
    const tempTabindex = new Set<Element>()
    let marked: Element | null = null

    const disposeStyle = ctx.dom.injectStyle(
      STYLE_ID,
      `.${MARK_CLASS} { outline: var(${pageVar('region-outline')}, 2px solid #ff6c00) !important; outline-offset: 2px; }`,
    )

    const rescan = (): void => {
      found.clear()
      const host = document.querySelector('a11y-now-host')
      // data-a11y-region 属性优先：站点可手动标注区域归属。
      const tagged = new Set<Element>()
      for (const type of REGION_TYPES) {
        const explicit = [
          ...document.querySelectorAll(`[data-a11y-region="${type}"]`),
        ].filter(el => !host?.contains(el) && isVisible(el))
        for (const el of explicit) {
          tagged.add(el)
        }
        found.set(type, explicit)
      }
      for (const type of REGION_TYPES) {
        const matched = [...document.querySelectorAll(selectors[type])].filter(
          el =>
            !host?.contains(el) &&
            !tagged.has(el) &&
            !el.matches('[data-a11y-region]') &&
            isVisible(el) &&
            (type !== 'list' || el.querySelectorAll(':scope > li').length >= 3),
        )
        found.set(type, [...(found.get(type) ?? []), ...matched])
      }
      syncButtons()
    }

    const unmark = (el: Element | null): void => {
      if (!el) {
        return
      }
      el.classList.remove(MARK_CLASS)
      if (el.classList.length === 0) {
        el.removeAttribute('class')
      }
      if (tempTabindex.has(el)) {
        el.removeAttribute('tabindex')
        tempTabindex.delete(el)
      }
    }

    const clear = (): void => {
      unmark(marked)
      marked = null
      indexes.clear()
    }

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && marked) {
        clear()
      }
    }
    document.addEventListener('keydown', onEscape)

    const name = (type: RegionType): string => ctx.i18n.t(`region.${type}`)

    const enter = (type: RegionType): void => {
      const elements = found.get(type) ?? []
      if (elements.length === 0) {
        ctx.ui.announce(ctx.i18n.t('region.empty', { name: name(type) }))
        return
      }
      const index = ((indexes.get(type) ?? -1) + 1) % elements.length
      indexes.set(type, index)
      const el = elements[index] as HTMLElement
      unmark(marked)
      el.classList.add(MARK_CLASS)
      marked = el
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '-1')
        tempTabindex.add(el)
      }
      el.focus({ preventScroll: false })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ctx.ui.announce(
        ctx.i18n.t('region.entered', {
          index: index + 1,
          name: name(type),
          text: speakableText(el).slice(0, 80),
          total: elements.length,
        }),
      )
    }

    const counts = (): Record<RegionType, number> =>
      Object.fromEntries(
        REGION_TYPES.map(type => [type, (found.get(type) ?? []).length]),
      ) as Record<RegionType, number>

    const buttons = REGION_TYPES.map((type, index) => {
      const shortcutLabel = (): string =>
        ctx.shortcuts.format({ alt: true, key: String(index + 1) })
      return {
        handle: ctx.ui.addItem({
          description: () =>
            ctx.i18n.t('region.desc', {
              count: (found.get(type) ?? []).length,
              name: name(type),
              shortcut: shortcutLabel(),
            }),
          group: 'region',
          id: `region-${type}`,
          label: () => name(type),
          onPress: () => {
            enter(type)
          },
          order: index,
        }),
        type,
      }
    })

    const syncButtons = (): void => {
      for (const { handle, type } of buttons) {
        const count = (found.get(type) ?? []).length
        handle.update({ badge: count, disabled: count === 0 })
      }
    }

    const unregisters = REGION_TYPES.map((type, index) =>
      ctx.shortcuts.register({
        alt: true,
        description: () => name(type),
        handler: () => {
          enter(type)
        },
        id: `region-${type}`,
        key: String(index + 1),
      }),
    )

    rescan()

    return {
      api: { clear, counts, enter, rescan },
      dispose: () => {
        clear()
        document.removeEventListener('keydown', onEscape)
        for (const unregister of unregisters) {
          unregister()
        }
        for (const { handle } of buttons) {
          handle.remove()
        }
        disposeStyle()
      },
    }
  },
})

/** Region navigation plugin. `Alt+1`..`Alt+6` enter and cycle regions. */
export const regionNav = (
  options: RegionNavOptions = {},
): ConfiguredPlugin<RegionNavOptions, RegionNavApi> =>
  configurePlugin(regionNavPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'region-nav': RegionNavApi
  }
}
