import { createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { SplendidGrandPiano, type StopFn } from 'smplr'
import { notes } from './events'

// Layer 3: notes → sound.
// Owns the AudioContext and the Splendid Grand Piano. Handles the sustain
// pedal: a note released while the pedal is down keeps ringing until it lifts.

export type LoadState = { status: 'loading'; progress: number } | { status: 'ready' } | { status: 'error' }

const [loadState, setLoadState] = createSignal<LoadState>({ status: 'loading', progress: 0 })
const [audioUnlocked, setAudioUnlocked] = createSignal(false)
const [pedalDown, setPedalDown] = createSignal(false)

/** MIDI note per live voice id, held or sustained. */
const [voices, setVoices] = createStore<Record<string, number | undefined>>({})

export { loadState, audioUnlocked, pedalDown }

/** Every MIDI note currently sounding. */
export const sounding = createMemo(() => new Set(Object.values(voices).filter((v): v is number => v !== undefined)))

const context = new AudioContext({ latencyHint: 'interactive' })

const piano = SplendidGrandPiano(context, {
  decayTime: 0.6,
  onLoadProgress: ({ loaded, total }) => {
    if (loadState().status === 'loading') setLoadState({ status: 'loading', progress: total ? loaded / total : 0 })
  },
})

piano.ready.then(
  () => setLoadState({ status: 'ready' }),
  () => setLoadState({ status: 'error' }),
)

/** Browsers start audio suspended; call on the first user gesture. */
export function resume() {
  if (context.state === 'running') return setAudioUnlocked(true)
  context.resume().then(() => setAudioUnlocked(true))
}

export function setVolume(value: number) {
  piano.output.volume = value
}

const stops = new Map<string, StopFn>()
const sustained = new Set<string>()

function stop(id: string) {
  stops.get(id)?.()
  stops.delete(id)
  sustained.delete(id)
  setVoices(id, undefined)
}

/** Start listening to the note bus. */
export function startPlayer() {
  const offs = [
    notes.on('note:on', ({ id, midi, velocity }) => {
      resume()
      stop(id) // re-strike: a held or sustained voice with this id is replaced
      stops.set(id, piano.start({ note: midi, velocity }))
      setVoices(id, midi)
    }),

    notes.on('note:off', ({ id }) => {
      if (!stops.has(id)) return
      if (pedalDown()) sustained.add(id)
      else stop(id)
    }),

    notes.on('pedal', ({ down }) => {
      setPedalDown(down)
      if (down) return
      for (const id of [...sustained]) stop(id)
    }),

    notes.on('note:panic', () => {
      for (const id of [...stops.keys()]) stop(id)
      setPedalDown(false)
    }),
  ]

  return () => offs.forEach((off) => off())
}
