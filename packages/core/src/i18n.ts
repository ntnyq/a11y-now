import { interpolate } from '@a11y-now/shared'
import type { A11yMessages, I18nService, LocaleCode } from '@a11y-now/types'

/**
 * Built-in kernel messages. Plugins ship their own tables via
 * `plugin.messages`, merged at registration time.
 */
const BUILT_IN: Record<string, A11yMessages> = {
  'en-US': {
    'a11y.entry': 'Accessibility toolbar enabled. Press {shortcut} for help.',
    'toolbar.label': 'Accessibility toolbar',
    'toolbar.region.group': 'Page regions',
    'toolbar.system.group': 'System',
    'toolbar.tool.group': 'Tools',
  },
  'zh-CN': {
    'a11y.entry': '无障碍工具栏已开启，按 {shortcut} 查看操作说明。',
    'toolbar.label': '无障碍工具栏',
    'toolbar.region.group': '页面区域',
    'toolbar.system.group': '系统',
    'toolbar.tool.group': '辅助工具',
  },
}

export const createI18n = (
  initialLocale: LocaleCode,
  overrides?: Partial<Record<LocaleCode, A11yMessages>>,
): I18nService => {
  let locale: LocaleCode = initialLocale
  const tables = new Map<LocaleCode, A11yMessages>()

  const extend = (target: LocaleCode, messages: A11yMessages): void => {
    tables.set(target, { ...tables.get(target), ...messages })
  }

  for (const [key, table] of Object.entries(BUILT_IN)) {
    extend(key, table)
  }
  if (overrides) {
    for (const [key, table] of Object.entries(overrides)) {
      if (table) {
        extend(key, table)
      }
    }
  }

  return {
    extend,
    getLocale: () => locale,
    setLocale: next => {
      locale = next
    },
    t: (key, params) => {
      const message =
        tables.get(locale)?.[key]
        ?? tables.get('zh-CN')?.[key]
        ?? tables.get('en-US')?.[key]
        ?? key
      return interpolate(message, params)
    },
  }
}
