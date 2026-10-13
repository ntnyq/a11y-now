import { configurePlugin, css, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface SpacingLevel {
  /**
   * i18n message key suffix, announced when the level activates.
   */
  name: string
  /**
   * `line-height`, e.g. `1.5`.
   */
  lineHeight: number
  /**
   * `letter-spacing`, e.g. `0.12em`.
   */
  letterSpacing: string
  /**
   * `word-spacing`, e.g. `0.16em`.
   */
  wordSpacing: string
  /**
   * Paragraph spacing (`margin-block-end` on `p`), e.g. `2em`.
   */
  paragraphSpacing: string
}

export interface SpacingOptions {
  /**
   * Replacement level ladder (excluding "off").
   *
   * @default SPACING_LEVELS
   */
  levels?: SpacingLevel[]
}

export interface SpacingApi {
  /**
   * Current level: `0` = off, then 1-based into the ladder.
   *
   * @returns The active 1-based spacing level, or 0 when spacing is off.
   */
  getLevel: () => number
  /**
   * Apply and persist a text-spacing level.
   *
   * @param level - 1-based level index; 0 or an invalid index turns spacing
   *   off.
   */
  setLevel: (level: number) => void
  /**
   * Advance to the next level, wrapping back to off.
   */
  cycle: () => void
}

interface SpacingState {
  /**
   * Persisted spacing level; zero is off and positive values index the ladder.
   *
   * @default 0
   */
  level: number
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: number
}

/**
 * Default ladder. Level 1 is exactly the WCAG 1.4.12 text-spacing test
 * metrics; level 2 goes a step looser for dyslexic readers.
 */
export const SPACING_LEVELS: SpacingLevel[] = [
  {
    letterSpacing: '0.12em',
    lineHeight: 1.5,
    name: 'comfort',
    paragraphSpacing: '2em',
    wordSpacing: '0.16em',
  },
  {
    letterSpacing: '0.16em',
    lineHeight: 1.8,
    name: 'loose',
    paragraphSpacing: '2.5em',
    wordSpacing: '0.2em',
  },
]

/**
 * Inline SVG for the spacing toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h10v2H4v-2Z"/></svg>'

/**
 * Selector suffix excluding opted-out elements and their descendants.
 */
const SKIP = ':not([data-a11y-skip], [data-a11y-skip] *)'

const spacingPlugin = definePlugin<SpacingOptions, SpacingApi, SpacingState>({
  messages: {
    'en-US': {
      'spacing.comfort': 'comfortable',
      'spacing.label': 'Text spacing',
      'spacing.loose': 'loose',
      'spacing.off': 'Text spacing restored, adjust with {shortcut}',
      'spacing.set': 'Text spacing set to {name}, adjust with {shortcut}',
    },
    'zh-CN': {
      'spacing.comfort': '舒适',
      'spacing.label': '间距调节',
      'spacing.loose': '宽松',
      'spacing.off': '文本间距已还原，调节间距 {shortcut}',
      'spacing.set': '文本间距已设为{name}，调节间距 {shortcut}',
    },
  },
  name: 'spacing',
  setup(ctx) {
    const levels = ctx.options.levels ?? SPACING_LEVELS
    let disposeStyle: (() => void) | null = null

    function clampLevel(level: number): number {
      return Number.isInteger(level) && level >= 0 && level <= levels.length
        ? level
        : 0
    }

    function getLevel(): number {
      return clampLevel(ctx.state.get('level'))
    }

    function shortcut(): string {
      return ctx.shortcuts.format({ alt: true, ctrl: true, key: 's' })
    }
    function describe(): string {
      const level = getLevel()
      const spec = levels[level - 1]
      return spec
        ? ctx.i18n.t('spacing.set', {
            name: ctx.i18n.t(`spacing.${spec.name}`),
            shortcut: shortcut(),
          })
        : ctx.i18n.t('spacing.off', { shortcut: shortcut() })
    }

    function apply(level: number): void {
      disposeStyle?.()
      disposeStyle = null
      const spec = levels[level - 1]
      if (spec) {
        disposeStyle = ctx.dom.injectStyle('spacing', buildStyle(spec))
      }
    }

    function setLevel(level: number): void {
      const next = clampLevel(level)
      ctx.state.set('level', next)
      ctx.ui.announce(describe())
      ctx.events.emit('spacing:change', { level: next })
    }

    function cycle(): void {
      setLevel((getLevel() + 1) % (levels.length + 1))
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'tool',
      icon: ICON,
      id: 'spacing',
      label: () => ctx.i18n.t('spacing.label'),
      onPress: cycle,
      order: 54,
      pressed: getLevel() > 0,
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('spacing.label'),
      handler: cycle,
      id: 'spacing',
      key: 's',
    })

    if (getLevel() > 0) {
      apply(getLevel())
    }

    const stopState = ctx.state.subscribe(key => {
      if (key === 'level') {
        apply(getLevel())
        button.update({ description: describe, pressed: getLevel() > 0 })
      }
    })

    return {
      api: { cycle, getLevel, setLevel },
      dispose() {
        stopState()
        disposeStyle?.()
        disposeStyle = null
        unregister()
        button.remove()
      },
    }
  },
  state: { level: 0 },
})

/**
 * Text spacing plugin. `Ctrl+Alt+S` cycles off → comfortable (the WCAG
 * 1.4.12 metrics: 1.5 line height, 0.12em letter, 0.16em word, 2em
 * paragraph spacing) → loose, applied over the page with a reclaimable
 * stylesheet.
 *
 * @param options - Optional replacement ladder of text-spacing levels.
 * @returns A configured text spacing plugin for toolbar registration.
 */
export function textSpacing(
  options: SpacingOptions = {},
): ConfiguredPlugin<SpacingOptions, SpacingApi, SpacingState> {
  return configurePlugin(spacingPlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the spacing plugin after activation.
     */
    spacing: SpacingApi
  }
  interface A11yEventMap {
    /**
     * Text spacing changed to the supplied level; zero means off.
     */
    'spacing:change': {
      /**
       * New spacing level; zero disables additional spacing.
       */
      level: number
    }
  }
}

function buildStyle(level: SpacingLevel): string {
  return css`
    body :where(*${SKIP}) {
      line-height: ${level.lineHeight} !important;
      letter-spacing: ${level.letterSpacing} !important;
      word-spacing: ${level.wordSpacing} !important;
    }
    body :where(p${SKIP}) {
      margin-block-end: ${level.paragraphSpacing} !important;
    }
  `
}
