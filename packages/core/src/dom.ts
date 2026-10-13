import type { DomService } from '@a11y-now/types'

/**
 * All page mutations flow through this service so `unmount()` can restore
 * the page exactly — the "leave no trace" guarantee.
 *
 * @param doc - Document receiving tracked styles, classes, and custom
 *   properties.
 * @returns A mutation service whose cleanup removes its tracked page changes.
 */
export function createDomService(doc: Document): DomService {
  const styles = new Map<string, HTMLStyleElement>()
  const pageVars = new Set<string>()
  const pageClasses = new Set<string>()
  let hadClassAttr: boolean | null = null
  let hadStyleAttr: boolean | null = null

  /**
   * Drop the empty `style=""` left behind by removeProperty.
   */
  function tidyStyleAttr(): void {
    const el = doc.documentElement
    if (hadStyleAttr === false && el.style.length === 0) {
      el.removeAttribute('style')
    }
  }

  /**
   * Drop the empty `class=""` left behind by classList.remove.
   */
  function tidyClassAttr(): void {
    const el = doc.documentElement
    if (hadClassAttr === false && el.classList.length === 0) {
      el.removeAttribute('class')
    }
  }

  return {
    addPageClass(className) {
      hadClassAttr ??= doc.documentElement.hasAttribute('class')
      doc.documentElement.classList.add(className)
      pageClasses.add(className)
    },
    cleanup() {
      for (const el of styles.values()) {
        el.remove()
      }
      styles.clear()
      for (const name of pageVars) {
        doc.documentElement.style.removeProperty(name)
      }
      pageVars.clear()
      tidyStyleAttr()
      for (const className of pageClasses) {
        doc.documentElement.classList.remove(className)
      }
      pageClasses.clear()
      tidyClassAttr()
    },
    injectStyle(id, cssText) {
      let el = styles.get(id)
      if (!el) {
        el = doc.createElement('style')
        el.dataset['a11yNow'] = id
        doc.head.append(el)
        styles.set(id, el)
      }
      el.textContent = cssText
      return () => {
        styles.get(id)?.remove()
        styles.delete(id)
      }
    },
    removePageClass(className) {
      hadClassAttr ??= doc.documentElement.hasAttribute('class')
      doc.documentElement.classList.remove(className)
      pageClasses.delete(className)
      tidyClassAttr()
    },
    removePageVar(name) {
      doc.documentElement.style.removeProperty(name)
      pageVars.delete(name)
      tidyStyleAttr()
    },
    setPageVar(name, value) {
      hadStyleAttr ??= doc.documentElement.hasAttribute('style')
      doc.documentElement.style.setProperty(name, value)
      pageVars.add(name)
    },
  }
}
