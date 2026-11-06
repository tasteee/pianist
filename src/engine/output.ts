import { createSignal } from 'solid-js'

// Web MIDI output. Lets the keyboard drive an external synth or DAW.

export type MidiOutputT = { id: string; name: string }
export type MidiStatusT = 'idle' | 'unsupported' | 'denied' | 'ready'

const MIDI_CHANNEL = 0
const NOTE_ON = 0x90
const NOTE_OFF = 0x80
const CONTROL_CHANGE = 0xb0
const CC_VOLUME = 7
const CC_SUSTAIN = 64
const CC_ALL_NOTES_OFF = 123

const [midiStatus, setMidiStatus] = createSignal<MidiStatusT>('idle')
const [midiOutputs, setMidiOutputs] = createSignal<MidiOutputT[]>([])

export { midiStatus, midiOutputs }

let access: MIDIAccess | undefined
let selectedOutputId = ''

const readOutputs = (): MidiOutputT[] => {
  if (!access) return []
  const outputs = [...access.outputs.values()]
  return outputs.map((output) => ({ id: output.id, name: output.name ?? output.id }))
}

const refreshOutputs = () => setMidiOutputs(readOutputs())

/** Ask the browser for MIDI access. Safe to call more than once. */
export const connectMidi = async () => {
  const isConnected = access !== undefined
  if (isConnected) return
  const isSupported = typeof navigator.requestMIDIAccess === 'function'
  if (!isSupported) return setMidiStatus('unsupported')

  try {
    access = await navigator.requestMIDIAccess()
  } catch {
    setMidiStatus('denied')
    return
  }

  access.onstatechange = refreshOutputs
  refreshOutputs()
  setMidiStatus('ready')
}

export const selectMidiOutput = (outputId: string) => {
  selectedOutputId = outputId
}

const getOutput = () => access?.outputs.get(selectedOutputId)

const send = (bytes: number[]) => getOutput()?.send(bytes)

export const sendNoteOn = (midi: number, velocity: number) => send([NOTE_ON | MIDI_CHANNEL, midi, velocity])
export const sendNoteOff = (midi: number) => send([NOTE_OFF | MIDI_CHANNEL, midi, 0])
export const sendVolume = (volume: number) => send([CONTROL_CHANGE | MIDI_CHANNEL, CC_VOLUME, volume])
export const sendSustain = (isDown: boolean) => send([CONTROL_CHANGE | MIDI_CHANNEL, CC_SUSTAIN, isDown ? 127 : 0])
export const sendAllNotesOff = () => send([CONTROL_CHANGE | MIDI_CHANNEL, CC_ALL_NOTES_OFF, 0])
