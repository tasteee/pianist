import { For } from 'solid-js'
import { ROOTS, SCALES } from '../music/theory'
import {
  OCTAVE_MAX,
  OCTAVE_MIN,
  octave,
  rootIndex,
  scaleId,
  setOctave,
  setRootIndex,
  setScaleId,
  setVolume,
  volume,
} from '../state'

const GROUPS = ['Common', 'Modes', 'Other'] as const

// Controls never keep focus: the keyboard belongs to the instrument.
const blurSoon = (e: Event) => (e.currentTarget as HTMLElement).blur()

export function Controls() {
  return (
    <div class="controls">
      <div class="field field--key">
        <span class="field-label" id="key-label">Key</span>
        <div class="segmented" role="radiogroup" aria-labelledby="key-label">
          <For each={ROOTS}>
            {(r, i) => (
              <button
                type="button"
                role="radio"
                aria-checked={rootIndex() === i()}
                class="segment"
                classList={{ 'is-active': rootIndex() === i() }}
                onClick={(e) => {
                  setRootIndex(i())
                  blurSoon(e)
                }}
              >
                {r.id}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="field field--scale">
        <label class="field-label" for="scale">Scale</label>
        <div class="select">
          <select
            id="scale"
            value={scaleId()}
            onChange={(e) => {
              setScaleId(e.currentTarget.value)
              blurSoon(e)
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
          <svg class="select-chevron" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <div class="field field--octave">
        <span class="field-label" id="octave-label">Octave</span>
        <div class="stepper" role="group" aria-labelledby="octave-label">
          <button
            type="button"
            class="stepper-btn"
            aria-label="Octave down"
            disabled={octave() <= OCTAVE_MIN}
            onClick={(e) => {
              setOctave(octave() - 1)
              blurSoon(e)
            }}
          >
            −
          </button>
          <output class="stepper-value" aria-live="polite">{octave()}</output>
          <button
            type="button"
            class="stepper-btn"
            aria-label="Octave up"
            disabled={octave() >= OCTAVE_MAX}
            onClick={(e) => {
              setOctave(octave() + 1)
              blurSoon(e)
            }}
          >
            +
          </button>
        </div>
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
          onChange={blurSoon}
        />
      </div>
    </div>
  )
}
