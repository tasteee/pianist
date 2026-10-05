import { For, Show, createSignal, onMount } from 'solid-js'
import { KEYBOARD_UNITS, ROWS, type KeyDef } from '../music/keymap'
import { accidentalSymbol, noteLabel } from '../music/theory'
import { isKeyDown } from '../engine/mapper'
import { pedalDown } from '../engine/player'
import { pointerKey } from '../input'
import { SUSTAIN_CODE } from '../music/keymap'
import { noteForCode } from '../state'

// Use the user's real key legends when the browser can tell us (Chromium).
const [legends, setLegends] = createSignal<Map<string, string>>(new Map())

type KeyboardNav = { getLayoutMap?: () => Promise<Map<string, string>> }

function loadLegends() {
  const kb = (navigator as Navigator & { keyboard?: KeyboardNav }).keyboard
  kb?.getLayoutMap?.().then((m) => setLegends(new Map(m)), () => {})
}

export function Keyboard() {
  onMount(loadLegends)

  return (
    <div class="keyboard" style={{ '--units': KEYBOARD_UNITS }} role="group" aria-label="Computer keyboard">
      <For each={ROWS}>
        {(row) => (
          <div class="keyboard-row" style={{ '--indent': row.indent }}>
            <For each={row.keys}>{(key) => <KeyCap def={key} />}</For>
          </div>
        )}
      </For>
      <div class="keyboard-row keyboard-row--space">
        <button
          type="button"
          class="keycap keycap--space"
          classList={{ 'is-down': pedalDown() }}
          aria-pressed={pedalDown()}
          tabIndex={-1}
          {...pointerKey(SUSTAIN_CODE)}
        >
          <span class="keycap-legend">Space</span>
          <span class="keycap-space-label">Sustain</span>
        </button>
      </div>
    </div>
  )
}

function KeyCap(props: { def: KeyDef }) {
  const note = () => noteForCode(props.def.code)
  const down = () => isKeyDown(props.def.code)
  const legend = () => legends().get(props.def.code)?.toUpperCase() ?? props.def.label

  return (
    <button
      type="button"
      class="keycap"
      classList={{ 'is-down': down(), 'is-root': note()?.degree === 1, 'is-silent': !note() }}
      tabIndex={-1}
      aria-label={note() ? `${legend()} plays ${noteLabel(note()!)}${note()!.octave}` : `${legend()} is silent`}
      {...pointerKey(props.def.code)}
    >
      <span class="keycap-legend">{legend()}</span>
      <Show when={note()}>
        {(n) => (
          <>
            <span class="keycap-note">
              {n().letter}
              <Show when={n().accidental}>
                <span class="keycap-acc">{accidentalSymbol(n().accidental)}</span>
              </Show>
              <sub class="keycap-oct">{n().octave}</sub>
            </span>
            <span class="keycap-degree">{n().degree}</span>
          </>
        )}
      </Show>
    </button>
  )
}
