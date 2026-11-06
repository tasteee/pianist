import { For, Show, createSignal, onMount } from 'solid-js'
import { FRAME_ROWS, KEYBOARD_UNITS, KEY_INDEX, type FrameKeyT, type KeyDef } from '../music/keymap'
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
    <div class="keyboard-stage">
      <div class="keyboard" style={{ '--units': KEYBOARD_UNITS }} role="group" aria-label="Computer keyboard">
        <For each={FRAME_ROWS}>
          {(row) => (
            <div class="keyboard-row">
              <For each={row}>{(frameKey) => <FrameKey def={frameKey} />}</For>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

function FrameKey(props: { def: FrameKeyT }) {
  const isSustain = props.def.code === SUSTAIN_CODE
  const playableKey = KEY_INDEX.get(props.def.code)
  const widthStyle = { '--w': props.def.width }

  if (isSustain) return <SustainKey width={widthStyle} />
  if (playableKey) return <KeyCap def={playableKey} width={widthStyle} />
  return <DisabledKey def={props.def} width={widthStyle} />
}

function DisabledKey(props: { def: FrameKeyT; width: Record<string, number> }) {
  return (
    <button type="button" class="keycap is-disabled" style={props.width} tabIndex={-1} disabled aria-label={`${props.def.label} is not playable`}>
      <span class="keycap-label">{props.def.label}</span>
    </button>
  )
}

function SustainKey(props: { width: Record<string, number> }) {
  return (
    <button
      type="button"
      class="keycap keycap--space"
      style={props.width}
      classList={{ 'is-down': pedalDown() }}
      aria-pressed={pedalDown()}
      tabIndex={-1}
      {...pointerKey(SUSTAIN_CODE)}
    >
      <span class="keycap-label">Sustain</span>
    </button>
  )
}

function KeyCap(props: { def: KeyDef; width: Record<string, number> }) {
  const note = () => noteForCode(props.def.code)
  const down = () => isKeyDown(props.def.code)
  const legend = () => legends().get(props.def.code)?.toUpperCase() ?? props.def.label

  return (
    <button
      type="button"
      class="keycap"
      style={props.width}
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
