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

export const SUSTAIN_CODE = 'Space'

// The full QWERTY frame, drawn so the keyboard feels structured.
// Only the keys in ROWS (and Space) play; the rest are shown disabled.

export type FrameKeyT = {
  code: string
  label: string
  /** Width in key units. */
  width: number
}

const frameKey = (label: string, code: string, width = 1): FrameKeyT => ({ label, code, width })

const frameChars = (chars: string, code: (c: string) => string) =>
  [...chars].map((ch) => frameKey(ch, code(ch)))

const digit = (d: string) => `Digit${d}`

export const FRAME_ROWS: FrameKeyT[][] = [
  [frameKey('`', 'Backquote'), ...frameChars('1234567890', digit), frameKey('-', 'Minus'), frameKey('=', 'Equal'), frameKey('backspace', 'Backspace', 2)],
  [frameKey('tab', 'Tab', 1.5), ...frameChars('qwertyuiop', letter), frameKey('[', 'BracketLeft'), frameKey(']', 'BracketRight'), frameKey('\\', 'Backslash', 1.5)],
  [frameKey('caps', 'CapsLock', 1.75), ...frameChars('asdfghjkl', letter), frameKey(';', 'Semicolon'), frameKey("'", 'Quote'), frameKey('enter', 'Enter', 2.25)],
  [frameKey('shift', 'ShiftLeft', 2.25), ...frameChars('zxcvbnm', letter), frameKey(',', 'Comma'), frameKey('.', 'Period'), frameKey('/', 'Slash'), frameKey('shift', 'ShiftRight', 2.75)],
  [frameKey('ctrl', 'ControlLeft', 1.25), frameKey('alt', 'AltLeft', 1.25), frameKey('space', SUSTAIN_CODE, 9.75), frameKey('alt', 'AltRight', 1.25), frameKey('ctrl', 'ControlRight', 1.25)],
]

/** Every row is 15 key units wide. */
export const KEYBOARD_UNITS = 15
