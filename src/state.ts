import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { noteOff, noteOn, setVolume as setPianoVolume } from './audio/piano'
import { KEY_INDEX } from './music/keymap'
import { ROOTS, SCALES, mod, scaleNote } from './music/theory'

// ---- Settings (persisted) -------------------------------------------------

export const OCTAVE_MIN = 1
export const OCTAVE_MAX = 4

type Saved = { root: number; scale: string; octave: number; volume: number }
const STORAGE_KEY = 'pianist:settings'

function load(): Partial<Saved> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const saved = load()
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const [rootIndex, setRootIndex] = createSignal(clamp(saved.root ?? 0, 0, 11))
const [scaleId, setScaleId] = createSignal(SCALES.some((s) => s.id === saved.scale) ? saved.scale! : 'major')
const [octave, setOctaveRaw] = createSignal(clamp(saved.octave ?? 3, OCTAVE_MIN, OCTAVE_MAX))
const [volume, setVolume] = createSignal(clamp(saved.volume ?? 100, 0, 127))

export { rootIndex, setRootIndex, scaleId, setScaleId, octave, volume, setVolume }

export const root = createMemo(() => ROOTS[rootIndex()])
export const scale = createMemo(() => SCALES.find((s) => s.id === scaleId()) ?? SCALES[0])

export const setOctave = (n: number) => setOctaveRaw(clamp(n, OCTAVE_MIN, OCTAVE_MAX))
export const shiftRoot = (by: number) => setRootIndex((i) => mod(i + by, 12))

createEffect(() => setPianoVolume(volume()))
createEffect(() => {
  const data: Saved = { root: rootIndex(), scale: scaleId(), octave: octave(), volume: volume() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage blocked; settings just won't persist.
  }
})

// ---- Mapping --------------------------------------------------------------

/** Note for a physical key under the current root, scale and octave. */
export function noteForCode(code: string) {
  const hit = KEY_INDEX.get(code)
  if (!hit) return undefined
  return scaleNote(root(), scale(), octave() + hit.row.octave, hit.key.step)
}

/** The scale's notes in one octave, for the readout. */
export const scaleNotes = createMemo(() => scale().steps.map((_, i) => scaleNote(root(), scale(), 4, i)))

// ---- Performance ----------------------------------------------------------
// `pressed`: sources physically held right now (key codes or pointer ids).
// `sustained`: released while the pedal was down, still ringing.

const [pressed, setPressed] = createStore<Record<string, number | undefined>>({})
const [sustained, setSustained] = createStore<Record<string, number | undefined>>({})
const [sustain, setSustainRaw] = createSignal(false)

export { pressed, sustain }

export function press(id: string, midi: number) {
  setSustained(id, undefined)
  setPressed(id, midi)
  noteOn(id, midi)
}

export function release(id: string) {
  const midi = pressed[id]
  if (midi === undefined) return
  setPressed(id, undefined)
  if (sustain()) setSustained(id, midi)
  else noteOff(id)
}

export function setSustain(on: boolean) {
  if (on === sustain()) return
  setSustainRaw(on)
  if (on) return
  for (const id of Object.keys(sustained)) {
    if (sustained[id] === undefined) continue
    setSustained(id, undefined)
    noteOff(id)
  }
}

export function releaseAll() {
  setSustain(false)
  for (const id of Object.keys(pressed)) release(id)
}

/** Every MIDI note currently sounding, held or sustained. */
export const sounding = createMemo(() => {
  const set = new Set<number>()
  for (const v of Object.values(pressed)) if (v !== undefined) set.add(v)
  for (const v of Object.values(sustained)) if (v !== undefined) set.add(v)
  return set
})

export const isPressed = (id: string) => pressed[id] !== undefined
