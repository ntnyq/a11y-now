/**
 * Contain focus and temporarily make content outside a shadow-root dialog inert.
 * Returns a cleanup function that preserves pre-existing inert attributes.
 */
export function containModalFocus(
  dialog: HTMLElement,
  initialFocus: HTMLElement,
): () => void {
  const doc = dialog.ownerDocument
  const inertElements = new Map<HTMLElement, string | null>()
  let branch: Node = dialog
  while (branch.parentNode) {
    const parent = branch.parentNode
    for (const sibling of parent.childNodes) {
      if (
        sibling !== branch &&
        sibling instanceof HTMLElement &&
        !sibling.matches('style, script, [aria-live], .help-backdrop')
      ) {
        inertElements.set(sibling, sibling.getAttribute('inert'))
        sibling.inert = true
      }
    }
    branch = parent instanceof ShadowRoot ? parent.host : parent
  }

  function onFocus(event: FocusEvent): void {
    if (!event.composedPath().includes(dialog)) {
      initialFocus.focus()
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return
    }
    const controls = [
      ...dialog.querySelectorAll<HTMLElement>('button, [tabindex]'),
    ].filter(el => el.tabIndex >= 0 && !el.matches(':disabled, [hidden]'))
    const first = controls[0] ?? initialFocus
    const last = controls.at(-1) ?? initialFocus
    const [active] = event.composedPath()
    if (
      event.shiftKey &&
      (active === first || !event.composedPath().includes(dialog))
    ) {
      event.preventDefault()
      last.focus()
    } else if (
      !event.shiftKey &&
      (active === last || !event.composedPath().includes(dialog))
    ) {
      event.preventDefault()
      first.focus()
    }
  }

  doc.addEventListener('focusin', onFocus, true)
  doc.addEventListener('keydown', onKeydown, true)
  initialFocus.focus()
  return () => {
    doc.removeEventListener('focusin', onFocus, true)
    doc.removeEventListener('keydown', onKeydown, true)
    for (const [el, previous] of inertElements) {
      if (previous === null) {
        el.removeAttribute('inert')
      } else {
        el.setAttribute('inert', previous)
      }
    }
  }
}
