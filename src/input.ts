import { onCleanup } from 'solid-js'
import { resume } from './audio/piano'
import { KEY_INDEX, SUSTAIN_CODE } from './music/keymap'
import { noteForCode, octave, press, release, releaseAll, setOctave, setSustain, shiftRoot } from './state'

/** Wires the computer keyboard to the piano. Call once from the root component. */
export function useKeyboardInput() {
  const isTyping = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null
    if (!el) return false
    if (el instanceof HTMLInputElement) return !['range', 'checkbox', 'radio', 'button'].includes(el.type)
    return el.isContentEditable || el.tagName === 'TEXTAREA'
  }

  const onKeyDown = (e: KeyboardEvent) => {
    // Leave browser and OS shortcuts alone.
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return
    resume()

    if (KEY_INDEX.has(e.code)) {
      e.preventDefault()
      if (e.repeat) return
      const note = noteForCode(e.code)
      if (note) press(e.code, note.midi)
      return
    }

    switch (e.code) {
      case SUSTAIN_CODE:
        e.preventDefault()
        setSustain(true)
        return
      case 'ArrowUp':
        e.preventDefault()
        setOctave(octave() + 1)
        return
      case 'ArrowDown':
        e.preventDefault()
        setOctave(octave() - 1)
        return
      case 'ArrowRight':
        e.preventDefault()
        shiftRoot(1)
        return
      case 'ArrowLeft':
        e.preventDefault()
        shiftRoot(-1)
        return
    }
  }

  const onKeyUp = (e: KeyboardEvent) => {
    if (KEY_INDEX.has(e.code)) release(e.code)
    else if (e.code === SUSTAIN_CODE) setSustain(false)
  }

  // Keyups are lost when the window loses focus; don't leave notes stuck.
  const onBlur = () => releaseAll()
  const onVisibility = () => document.hidden && releaseAll()

  window.addEventListener('pointerdown', resume)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  document.addEventListener('visibilitychange', onVisibility)

  onCleanup(() => {
    window.removeEventListener('pointerdown', resume)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
