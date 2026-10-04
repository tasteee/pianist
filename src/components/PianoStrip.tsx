import { For, createMemo } from 'solid-js'
import { ROWS } from '../music/keymap'
import { isBlackKey, midiName, mod } from '../music/theory'
import { noteForCode, press, release, root, scaleNotes, sounding } from '../state'

// A piano spanning exactly the range the computer keyboard reaches,
// padded out to whole octaves. Shows the scale and what's sounding.

const BLACK_OFFSET: Record<number, number> = { 1: 0.62, 3: 0.78, 6: 0.58, 8: 0.7, 10: 0.82 }

export function PianoStrip() {
  const range = createMemo(() => {
    const midis = ROWS.flatMap((r) => r.keys.map((k) => noteForCode(k.code)!.midi))
    const lo = Math.min(...midis)
    const hi = Math.max(...midis)
    const start = lo - mod(lo, 12)
    const end = hi + (11 - mod(hi, 12))
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  const inScale = createMemo(() => new Set(scaleNotes().map((n) => mod(n.midi, 12))))
  const whites = createMemo(() => range().filter((m) => !isBlackKey(m)))
  const blacks = createMemo(() => range().filter(isBlackKey))

  // Black key x-position: after the white key below it, nudged per pitch.
  const blackLeft = (midi: number) => {
    const whiteIndex = whites().indexOf(midi - 1)
    return `${((whiteIndex + BLACK_OFFSET[mod(midi, 12)]) / whites().length) * 100}%`
  }

  const Key = (p: { midi: number; class: string; style?: Record<string, string> }) => {
    const id = `strip:${p.midi}`
    return (
      <button
        type="button"
        tabIndex={-1}
        class={p.class}
        style={p.style}
        classList={{
          'is-scale': inScale().has(mod(p.midi, 12)),
          'is-root': mod(p.midi, 12) === root().pitchClass,
          'is-on': sounding().has(p.midi),
        }}
        aria-label={midiName(p.midi)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          press(id, p.midi)
        }}
        onPointerUp={() => release(id)}
        onPointerCancel={() => release(id)}
      >
        {mod(p.midi, 12) === 0 && <span class="piano-c">{midiName(p.midi)}</span>}
      </button>
    )
  }

  return (
    <div class="piano" role="group" aria-label="Piano">
      <div class="piano-whites">
        <For each={whites()}>{(m) => <Key midi={m} class="piano-key piano-key--white" />}</For>
      </div>
      <For each={blacks()}>
        {(m) => (
          <Key
            midi={m}
            class="piano-key piano-key--black"
            style={{ left: blackLeft(m), width: `${(0.6 / whites().length) * 100}%` }}
          />
        )}
      </For>
    </div>
  )
}
