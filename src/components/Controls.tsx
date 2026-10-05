import { For } from 'solid-js'
import { ROOTS, SCALES } from '../music/theory'
import { OCTAVE_MAX, OCTAVE_MIN, octave, rootIndex, scaleId, setOctave, setRootIndex, setScaleId, setVolume, volume } from '../state'
import { Chevron } from './ui/Chevron'
import { Segmented } from './ui/Segmented'
import { Stepper, blurTarget } from './ui/Stepper'

const GROUPS = ['Common', 'Modes', 'Other'] as const

export function Controls() {
  return (
    <div class="controls">
      <div class="field field--key">
        <span class="field-label">Key</span>
        <Segmented
          label="Key"
          class="segmented--keys"
          value={rootIndex()}
          onChange={setRootIndex}
          options={ROOTS.map((r, i) => ({ value: i, label: r.id }))}
        />
      </div>

      <div class="field field--scale">
        <label class="field-label" for="scale">Scale</label>
        <div class="select">
          <select
            id="scale"
            value={scaleId()}
            onChange={(e) => {
              setScaleId(e.currentTarget.value)
              blurTarget(e)
            }}
          >
            <For each={GROUPS}>
              {(g) => (
                <optgroup label={g}>
                  <For each={SCALES.filter((s) => s.group === g)}>
                    {(s) => <option value={s.id}>{s.name}</option>}
                  </For>
                </optgroup>
              )}
            </For>
          </select>
          <Chevron />
        </div>
      </div>

      <div class="field field--octave">
        <span class="field-label">Octave</span>
        <Stepper label="Octave" value={octave()} min={OCTAVE_MIN} max={OCTAVE_MAX} onChange={setOctave} />
      </div>

      <div class="field field--volume">
        <label class="field-label" for="volume">Volume</label>
        <input
          id="volume"
          class="slider"
          type="range"
          min="0"
          max="127"
          value={volume()}
          style={{ '--fill': `${(volume() / 127) * 100}%` }}
          onInput={(e) => setVolume(Number(e.currentTarget.value))}
          onChange={blurTarget}
        />
      </div>
    </div>
  )
}
