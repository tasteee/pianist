// Physical keyboard layout. Keys are matched by `KeyboardEvent.code`,
// so the mapping follows key position, not the user's language layout.

export type KeyDef = {
  code: string
  label: string
  /** Scale step relative to the row's root. */
  step: number
}

export type RowDef = {
  id: string
  /** Octaves above the base octave. Each row up = one octave up. */
  octave: number
  /** Left indent in key units, matching a real keyboard's stagger. */
  indent: number
  keys: KeyDef[]
}

const row = (id: string, octave: number, indent: number, codes: [string, string][], firstStep = 0): RowDef => ({
  id,
  octave,
  indent,
  keys: codes.map(([code, label], i) => ({ code, label, step: i + firstStep })),
})

const letters = (chars: string) => [...chars].map((c) => [`Key${c.toUpperCase()}`, c.toUpperCase()] as [string, string])
const digits = [...'1234567890'].map((d) => [`Digit${d}`, d] as [string, string])

// Top to bottom. The first letter of every row is the root; the backtick
// sits one step below it so the number row lines up with the letter rows.
export const ROWS: RowDef[] = [
  row('number', 3, 0, [['Backquote', '`'], ...digits, ['Minus', '-'], ['Equal', '=']], -1),
  row('top', 2, 1.5, [...letters('qwertyuiop'), ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\']]),
  row('home', 1, 1.75, [...letters('asdfghjkl'), ['Semicolon', ';'], ['Quote', "'"]]),
  row('bottom', 0, 2.25, [...letters('zxcvbnm'), ['Comma', ','], ['Period', '.'], ['Slash', '/']]),
]

export const KEY_INDEX = new Map(ROWS.flatMap((r) => r.keys.map((k) => [k.code, { row: r, key: k }] as const)))

/** Widest row in key units; drives keyboard sizing. */
export const KEYBOARD_UNITS = Math.max(...ROWS.map((r) => r.indent + r.keys.length))

export const SUSTAIN_CODE = 'Space'
