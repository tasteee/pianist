import { createSignal } from 'solid-js'
import { Soundfont } from 'smplr'
import type { StopFn } from 'smplr'

// One shared AudioContext + SoundFont piano for the whole app.
// Browsers start the context suspended; `resume()` runs on the first gesture.

export type LoadState = { status: 'loading'; progress: number } | { status: 'ready' } | { status: 'error' }

const [loadState, setLoadState] = createSignal<LoadState>({ status: 'loading', progress: 0 })
const [audioUnlocked, setAudioUnlocked] = createSignal(false)
export { loadState, audioUnlocked }

const context = new AudioContext({ latencyHint: 'interactive' })

const piano = Soundfont(context, {
  instrument: 'acoustic_grand_piano',
  kit: 'MusyngKite',
  onLoadProgress: ({ loaded, total }) => {
    if (loadState().status === 'loading') setLoadState({ status: 'loading', progress: total ? loaded / total : 0 })
  },
})

piano.ready.then(
  () => setLoadState({ status: 'ready' }),
  () => setLoadState({ status: 'error' }),
)

export function resume() {
  if (context.state !== 'running') context.resume().then(() => setAudioUnlocked(true))
  else setAudioUnlocked(true)
}

export function setVolume(value: number) {
  piano.output.volume = value
}

/** Voices keyed by whatever triggered them (a key code, a pointer id). */
const voices = new Map<string, StopFn>()

export function noteOn(id: string, midi: number, velocity = 96) {
  resume()
  voices.get(id)?.()
  voices.set(id, piano.start({ note: midi, velocity }))
}

export function noteOff(id: string) {
  voices.get(id)?.()
  voices.delete(id)
}
