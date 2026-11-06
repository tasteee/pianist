import { Show } from 'solid-js'
import { midiOutputs, midiStatus } from '../engine/output'
import { instrument, midiOutputId, setInstrument, setMidiOutputId, setVolume, volume } from '../state'
import { blurActiveElement } from './ui/focus'

type ChangeEventT = CustomEvent<{ value: string | number | undefined }>

const MIDI_VOLUME_MAX = 127

const instrumentOptions = [
  { value: 'piano', label: 'Piano' },
  { value: 'midi', label: 'MIDI' },
]

const getMidiPlaceholder = () => {
  const status = midiStatus()
  if (status === 'unsupported') return 'MIDI not supported'
  if (status === 'denied') return 'MIDI access denied'
  if (status === 'idle') return 'Connecting…'
  return 'No outputs found'
}

export const ControlsBar = () => {
  const handleInstrumentChange = (event: ChangeEventT) => {
    const nextInstrument = event.detail.value
    setInstrument(nextInstrument === 'midi' ? 'midi' : 'piano')
    blurActiveElement()
  }

  const handleMidiOutputChange = (event: ChangeEventT) => {
    setMidiOutputId(String(event.detail.value))
    blurActiveElement()
  }

  const handleVolumeInput = (event: ChangeEventT) => setVolume(Number(event.detail.value))

  const isMidi = () => instrument() === 'midi'
  const midiOptions = () => midiOutputs().map((output) => ({ value: output.id, label: output.name }))
  const hasMidiOutputs = () => midiOutputs().length > 0

  return (
    <div class="controls-bar field-row">
      <z-field label="Instrument">
        <z-select prop:options={instrumentOptions} prop:value={instrument()} on:change={handleInstrumentChange} />
      </z-field>

      <Show when={isMidi()}>
        <z-field label="MIDI output">
          <z-select
            placeholder={getMidiPlaceholder()}
            prop:isDisabled={!hasMidiOutputs()}
            prop:options={midiOptions()}
            prop:value={midiOutputId()}
            on:change={handleMidiOutputChange}
          />
        </z-field>
      </Show>

      <z-slider
        label="Volume"
        prop:min={0}
        prop:max={MIDI_VOLUME_MAX}
        prop:value={volume()}
        on:input={handleVolumeInput}
        on:change={blurActiveElement}
      />
    </div>
  )
}
