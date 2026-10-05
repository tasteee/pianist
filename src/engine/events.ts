import { createBus } from './bus'

// The two hops in the play pipeline:
//
//   input ──keys──▶ mapper ──notes──▶ player ──▶ SplendidGrandPiano
//
// `keys` carries physical key codes. `notes` carries MIDI notes.

export type KeySource = 'keyboard' | 'pointer'

export type KeyEvent = {
  /** `KeyboardEvent.code`, e.g. "KeyA", "Digit1", "Space". */
  code: string
  source: KeySource
}

export type KeyEvents = {
  'key:down': KeyEvent
  'key:up': KeyEvent
  /** Release everything, e.g. when the window loses focus. */
  'key:reset': void
}

export type NoteOn = {
  /** Who owns this voice; the matching `note:off` uses the same id. */
  id: string
  midi: number
  velocity: number
}

export type NoteEvents = {
  'note:on': NoteOn
  'note:off': { id: string }
  'pedal': { down: boolean }
  /** Stop every voice now. */
  'note:panic': void
}

export const keys = createBus<KeyEvents>()
export const notes = createBus<NoteEvents>()
