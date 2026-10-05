import { createStore } from 'solid-js/store'
import { SUSTAIN_CODE } from '../music/keymap'
import { keys, notes, type KeyEvent } from './events'

// Layer 2: key code → note.
// Looks up what the key plays *right now* and forwards it to the player.
// Remembers which voice each held key started, so the right note stops on
// key up even if the layout, key or octave changed in between.

const VELOCITY = 100

/** Held keys by `${source}:${code}`. Drives the keycap pressed state. */
const [held, setHeld] = createStore<Record<string, true | undefined>>({})

export const isKeyDown = (code: string) => !!(held[`keyboard:${code}`] || held[`pointer:${code}`])

const voiceOf = (e: KeyEvent) => `${e.source}:${e.code}`

/** Start the mapper. `lookup` returns the MIDI note a key plays, if any. */
export function startMapper(lookup: (code: string) => number | undefined) {
  const sounding = new Set<string>()
  const pedalSources = new Set<string>()

  const offDown = keys.on('key:down', (e) => {
    const id = voiceOf(e)
    if (held[id]) return // auto-repeat or double source
    setHeld(id, true)

    if (e.code === SUSTAIN_CODE) {
      pedalSources.add(id)
      notes.emit('pedal', { down: true })
      return
    }

    const midi = lookup(e.code)
    if (midi === undefined) return
    sounding.add(id)
    notes.emit('note:on', { id, midi, velocity: VELOCITY })
  })

  const offUp = keys.on('key:up', (e) => {
    const id = voiceOf(e)
    if (!held[id]) return
    setHeld(id, undefined)

    if (e.code === SUSTAIN_CODE) {
      pedalSources.delete(id)
      if (!pedalSources.size) notes.emit('pedal', { down: false })
      return
    }

    if (sounding.delete(id)) notes.emit('note:off', { id })
  })

  const offReset = keys.on('key:reset', () => {
    for (const id of Object.keys(held)) setHeld(id, undefined)
    for (const id of sounding) notes.emit('note:off', { id })
    sounding.clear()
    if (pedalSources.size) notes.emit('pedal', { down: false })
    pedalSources.clear()
  })

  return () => {
    offDown()
    offUp()
    offReset()
  }
}
