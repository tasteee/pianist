import { For, Show } from 'solid-js'
import { ROWS } from '../music/keymap'
import { CATEGORIES, CATEGORY_INFO, CUSTOM_EXAMPLES, DIRECTIONS, LAYOUTS, type Wrap } from '../music/layouts'
import { custom, layout, layoutId, reshuffle, setCustom, setLayoutId } from '../state'
import { Segmented } from './ui/Segmented'
import { Chevron } from './ui/Chevron'
import { Stepper, blurTarget } from './ui/Stepper'

const INTERVAL_LIMIT = 12

/** Picks how keys map to scale steps, and edits the Custom layout. */
export function LayoutPanel() {
  return (
    <section class="layout" aria-label="Keyboard layout">
      <div class="layout-head">
        <div class="field layout-select">
          <label class="field-label" for="layout">Layout</label>
          <div class="select">
            <select
              id="layout"
              value={layoutId()}
              onChange={(e) => {
                setLayoutId(e.currentTarget.value)
                blurTarget(e)
              }}
            >
              <For each={CATEGORIES}>
                {(cat) => (
                  <optgroup label={cat}>
                    <For each={LAYOUTS.filter((l) => l.category === cat)}>
                      {(l) => <option value={l.id}>{l.name}</option>}
                    </For>
                  </optgroup>
                )}
              </For>
            </select>
            <Chevron />
          </div>
        </div>

        <div class="layout-about">
          <span class="layout-category" title={CATEGORY_INFO[layout().category]}>
            {layout().category}
          </span>
          <p class="layout-desc">{layout().description}</p>
        </div>

        <Show when={layoutId() === 'random-walk'}>
          <button type="button" class="button" onClick={(e) => (reshuffle(), blurTarget(e))}>
            <ShuffleIcon />
            Reshuffle
          </button>
        </Show>
      </div>

      <Show when={layoutId() === 'custom'}>
        <CustomEditor />
      </Show>
    </section>
  )
}

function CustomEditor() {
  return (
    <div class="custom">
      <div class="custom-grid">
        <div class="field">
          <span class="field-label">Horizontal</span>
          <Stepper
            label="Horizontal interval"
            signed
            value={custom().horizontal}
            min={-INTERVAL_LIMIT}
            max={INTERVAL_LIMIT}
            onChange={(horizontal) => setCustom({ horizontal })}
          />
        </div>
        <div class="field">
          <span class="field-label">Vertical</span>
          <Stepper
            label="Vertical interval"
            signed
            value={custom().vertical}
            min={-INTERVAL_LIMIT}
            max={INTERVAL_LIMIT}
            onChange={(vertical) => setCustom({ vertical })}
          />
        </div>
        <div class="field">
          <span class="field-label">Direction</span>
          <Segmented
            label="Direction"
            class="segmented--compact"
            value={custom().direction}
            onChange={(direction) => setCustom({ direction })}
            options={DIRECTIONS.map((d) => ({ value: d.id, label: d.arrows, title: d.label }))}
          />
        </div>
        <div class="field">
          <span class="field-label">Wrap</span>
          <Segmented<Wrap>
            label="Scale wrapping"
            class="segmented--compact"
            value={custom().wrap}
            onChange={(wrap) => setCustom({ wrap })}
            options={[
              { value: 'scale', label: 'Scale', title: 'Fold each row into one octave' },
              { value: 'none', label: 'None', title: 'Keep climbing past the octave' },
            ]}
          />
        </div>
      </div>

      <div class="custom-grid custom-grid--rows">
        <span class="field-label custom-rows-label">Row lengths</span>
        <For each={ROWS}>
          {(row, i) => (
            <div class="custom-row">
              <span class="custom-row-name">
                {row.keys[0].label}–{row.keys[row.keys.length - 1].label}
              </span>
              <Stepper
                size="s"
                label={`Keys in row ${row.keys[0].label}`}
                value={custom().rowLengths[i()]}
                min={0}
                max={row.keys.length}
                onChange={(n) => setCustom({ rowLengths: custom().rowLengths.map((v, j) => (j === i() ? n : v)) })}
              />
            </div>
          )}
        </For>
      </div>

      <div class="custom-examples">
        <span class="field-label">Try</span>
        <For each={CUSTOM_EXAMPLES}>
          {([h, v]) => (
            <button
              type="button"
              class="chip"
              classList={{ 'is-active': custom().horizontal === h && custom().vertical === v }}
              onClick={(e) => (setCustom({ horizontal: h, vertical: v }), blurTarget(e))}
            >
              {fmt(h)} / {fmt(v)}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

const fmt = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M2 4h2.5c1.2 0 2.3.6 3 1.6l1 1.4M2 12h2.5c1.2 0 2.3-.6 3-1.6l2-2.8c.7-1 1.8-1.6 3-1.6H14M12 2l2 2-2 2M12 10l2 2-2 2M9.5 10.4c.7 1 1.8 1.6 3 1.6H14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}
