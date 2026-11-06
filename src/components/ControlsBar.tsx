import { Show } from 'solid-js'
import { CATEGORIES, LAYOUTS } from '../music/layouts'
import { midiOutputs, midiStatus } from '../engine/output'
import { layout, layoutId, instrument, midiOutputId, reshuffle, setInstrument, setLayoutId, setMidiOutputId, setVolume, volume } from '../state'
import { blurActiveElement } from './ui/focus'

type ChangeEventT = CustomEvent<{ value: string | number | undefined }>

const MIDI_VOLUME_MAX = 127

const layoutOptions = CATEGORIES.flatMap((category) => {
  const layoutsInCategory = LAYOUTS.filter((item) => item.category === category)
  return layoutsInCategory.map((item) => ({ value: item.id, label: `${category} · ${item.name}` }))
})

const getMidiPlaceholder = () => {
  const status = midiStatus()
  if (status === 'unsupported') return 'MIDI not supported'
  if (status === 'denied') return 'MIDI access denied'
  if (status === 'idle') return 'Connecting…'
  return 'No outputs found'
}

export const ControlsBar = () => {
  const handleLayoutChange = (event: ChangeEventT) => {
    setLayoutId(String(event.detail.value))
    blurActiveElement()
  }

  const handleInstrumentChange = (event: ChangeEventT) => {
    const nextInstrument = event.detail.value
    const wasCleared = nextInstrument === undefined
    if (wasCleared) return
    setInstrument(nextInstrument === 'midi' ? 'midi' : 'piano')
    blurActiveElement()
  }

  const handleMidiOutputChange = (event: ChangeEventT) => {
    setMidiOutputId(String(event.detail.value))
    blurActiveElement()
  }

  const handleVolumeInput = (event: ChangeEventT) => setVolume(Number(event.detail.value))

  const handleReshuffle = () => {
    reshuffle()
    blurActiveElement()
  }

  const isMidi = () => instrument() === 'midi'
  const isRandomWalk = () => layoutId() === 'random-walk'
  const midiOptions = () => midiOutputs().map((output) => ({ value: output.id, label: output.name }))
  const hasMidiOutputs = () => midiOutputs().length > 0
  const midiPlaceholder = getMidiPlaceholder

  return (
    <div class="controls-bar field-row">
      <z-field label="Layout" description={layout().description}>
        <z-select prop:options={layoutOptions} prop:value={layoutId()} on:change={handleLayoutChange} />
      </z-field>

      <Show when={isRandomWalk()}>
        <z-button kind="outline" on:click={handleReshuffle}>
          Reshuffle
        </z-button>
      </Show>

      <z-field label="Instrument">
        <z-toggle-button-group kind="outline" prop:value={instrument()} on:change={handleInstrumentChange}>
          <z-toggle-button-group-item value="piano" prop:isPressed={!isMidi()}>
            Piano
          </z-toggle-button-group-item>
          <z-toggle-button-group-item value="midi" prop:isPressed={isMidi()}>
            MIDI
          </z-toggle-button-group-item>
        </z-toggle-button-group>
      </z-field>

      <Show when={isMidi()}>
        <z-field label="MIDI output">
          <z-select
            placeholder={midiPlaceholder()}
            prop:isDisabled={!hasMidiOutputs()}
            prop:options={midiOptions()}
            prop:value={midiOutputId()}
            on:change={handleMidiOutputChange}
          />
        </z-field>
      </Show>

      <z-field label="Volume">
        <z-slider
          prop:min={0}
          prop:max={MIDI_VOLUME_MAX}
          prop:value={volume()}
          on:input={handleVolumeInput}
          on:change={blurActiveElement}
        />
      </z-field>
    </div>
  )
}
