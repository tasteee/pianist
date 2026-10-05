// Physical keyboard grid. Keys are matched by `KeyboardEvent.code`,
// so the mapping follows key position, not the user's language layout.

export type KeyDef = {
  code: string
  label: string
  /** Row from the top: 0 = number row … 3 = Z row. */
  row: number
  /** Column from the left within the row. */
  col: number
}

export type RowDef = {
  id: string
  /** Left indent in key units, matching a real keyboard's stagger. */
  indent: number
  keys: KeyDef[]
}

const makeRow = (id: string, row: number, indent: number, chars: string, code: (c: string) => string): RowDef => ({
  id,
  indent,
  keys: [...chars].map((ch, col) => ({ code: code(ch), label: ch.toUpperCase(), row, col })),
})

const letter = (c: string) => `Key${c.toUpperCase()}`

export const ROWS: RowDef[] = [
  makeRow('number', 0, 0, '1234567890', (d) => `Digit${d}`),
  makeRow('top', 1, 0.5, 'qwertyuiop', letter),
  makeRow('home', 2, 0.75, 'asdfghjkl', letter),
  makeRow('bottom', 3, 1.25, 'zxcvbnm', letter),
]

/** Keys per row, top to bottom: 10 / 10 / 9 / 7. */
export const ROW_LENGTHS = ROWS.map((r) => r.keys.length)

export const KEYS = ROWS.flatMap((r) => r.keys)
export const KEY_INDEX = new Map(KEYS.map((k) => [k.code, k]))

/** Widest row in key units; drives keyboard sizing. */
export const KEYBOARD_UNITS = Math.max(...ROWS.map((r) => r.indent + r.keys.length))

export const SUSTAIN_CODE = 'Space'
