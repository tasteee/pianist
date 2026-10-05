import { onCleanup } from 'solid-js'
import { keys } from './engine/events'
import { resume } from './engine/player'
import { KEY_INDEX, SUSTAIN_CODE } from './music/keymap'
import { octave, setOctave, shiftRoot } from './state'

// Layer 1: physical input → key events.
// Only says *which key* moved. What it plays is the mapper's job.

const isPlayKey = (code: string) => KEY_INDEX.has(code) || code === SUSTAIN_CODE

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null
  if (!el) return false
  if (el instanceof HTMLInputElement) return !['range', 'checkbox', 'radio', 'button'].includes(el.type)
  return el.isContentEditable || el.tagName === 'TEXTAREA'
}

/** Wires the computer keyboard into the key bus. Call once from the root component. */
export function useKeyboardInput() {
  const onKeyDown = (e: KeyboardEvent) => {
    // Leave browser and OS shortcuts alone.
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return
    resume()

    if (isPlayKey(e.code)) {
      e.preventDefault()
      if (!e.repeat) keys.emit('key:down', { code: e.code, source: 'keyboard' })
      return
    }

    // Arrow keys change settings; they never play.
    const action = ARROWS[e.code]
    if (action) {
      e.preventDefault()
      action()
    }
  }

  const onKeyUp = (e: KeyboardEvent) => {
    if (isPlayKey(e.code)) keys.emit('key:up', { code: e.code, source: 'keyboard' })
  }

  // Keyups are lost when the window loses focus; don't leave notes stuck.
  const reset = () => keys.emit('key:reset', undefined)
  const onVisibility = () => document.hidden && reset()

  window.addEventListener('pointerdown', resume)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', reset)
  document.addEventListener('visibilitychange', onVisibility)

  onCleanup(() => {
    window.removeEventListener('pointerdown', resume)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', reset)
    document.removeEventListener('visibilitychange', onVisibility)
  })
}

const ARROWS: Record<string, () => void> = {
  ArrowUp: () => setOctave(octave() + 1),
  ArrowDown: () => setOctave(octave() - 1),
  ArrowRight: () => shiftRoot(1),
  ArrowLeft: () => shiftRoot(-1),
}

/** Pointer handlers that make an on-screen element act like a physical key. */
export function pointerKey(code: string) {
  const up = () => keys.emit('key:up', { code, source: 'pointer' })
  return {
    onPointerDown: (e: PointerEvent) => {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      keys.emit('key:down', { code, source: 'pointer' })
    },
    onPointerUp: up,
    onPointerCancel: up,
  }
}
