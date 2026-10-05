import { createEffect, createMemo, createSignal } from 'solid-js'
import { setVolume as setPianoVolume } from './engine/player'
import { KEYS } from './music/keymap'
import { DEFAULT_CUSTOM, LAYOUTS, type CustomParams } from './music/layouts'
import { ROOTS, SCALES, mod, scaleNote, type Note } from './music/theory'

// ---- Settings (persisted) -------------------------------------------------

export const OCTAVE_MIN = 1
export const OCTAVE_MAX = 5

type Saved = {
  root: number
  scale: string
  octave: number
  volume: number
  layout: string
  custom: CustomParams
  seed: number
}
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
const [layoutId, setLayoutId] = createSignal(LAYOUTS.some((l) => l.id === saved.layout) ? saved.layout! : 'standard')
const [custom, setCustomRaw] = createSignal<CustomParams>({ ...DEFAULT_CUSTOM, ...saved.custom })
const [seed, setSeed] = createSignal(saved.seed ?? 20261005)

export { rootIndex, setRootIndex, scaleId, setScaleId, octave, volume, setVolume, layoutId, setLayoutId, custom }

export const layout = createMemo(() => LAYOUTS.find((l) => l.id === layoutId()) ?? LAYOUTS[0])
export const setCustom = (patch: Partial<CustomParams>) => setCustomRaw((c) => ({ ...c, ...patch }))
export const reshuffle = () => setSeed(Math.floor(Math.random() * 0xffffffff))

export const root = createMemo(() => ROOTS[rootIndex()])
export const scale = createMemo(() => SCALES.find((s) => s.id === scaleId()) ?? SCALES[0])

export const setOctave = (n: number) => setOctaveRaw(clamp(n, OCTAVE_MIN, OCTAVE_MAX))
export const shiftRoot = (by: number) => setRootIndex((i) => mod(i + by, 12))

createEffect(() => setPianoVolume(volume()))
createEffect(() => {
  const data: Saved = {
    root: rootIndex(),
    scale: scaleId(),
    octave: octave(),
    volume: volume(),
    layout: layoutId(),
    custom: custom(),
    seed: seed(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage blocked; settings just won't persist.
  }
})

// ---- Mapping --------------------------------------------------------------

// Piano range of the SoundFont (A0–C8). Keys outside it stay silent.
const MIDI_MIN = 21
const MIDI_MAX = 108

/** Every key's note under the current root, scale, octave and layout. */
export const keyNotes = createMemo(() => {
  const ctx = { len: scale().steps.length, custom: custom(), seed: seed() }
  const map = new Map<string, Note>()
  for (const key of KEYS) {
    const at = layout().place(key, ctx)
    if (!at) continue
    const note = scaleNote(root(), scale(), octave() + at.octave, at.steps)
    if (note.midi >= MIDI_MIN && note.midi <= MIDI_MAX) map.set(key.code, note)
  }
  return map
})

/** Note for a physical key, or undefined when the layout leaves it silent. */
export const noteForCode = (code: string) => keyNotes().get(code)

/** The scale's notes in one octave, for the readout. */
export const scaleNotes = createMemo(() => scale().steps.map((_, i) => scaleNote(root(), scale(), 4, i)))
