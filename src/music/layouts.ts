// Layouts decide which scale step each physical key plays.
//
// A layout places a key at `steps` (0 = root, 1 = second degree, len = root
// an octave up, …) plus an `octave` offset added to the base octave.
// Numbers in the docs are 1-based; here everything is 0-based.

import { ROW_LENGTHS, type KeyDef } from './keymap'

export type Placement = { steps: number; octave: number }

export type Direction = 'right-up' | 'down-right'

export type LayoutContext = {
  /** Notes in the current scale. */
  len: number
}

export type Layout = {
  id: string
  name: string
  place: (key: KeyDef, ctx: LayoutContext) => Placement | null
}

// ---- Generic grid ---------------------------------------------------------
// Steps grow by `h` per key away from the origin column and by `v` per row
// away from the origin row.

type GridSpec = {
  h: number
  v: number | 'octave'
  direction: Direction
}

function grid(key: KeyDef, len: number, spec: GridSpec): Placement | null {
  const rowLen = ROW_LENGTHS[key.row]

  const fromTop = spec.direction.startsWith('down')
  const fromLeft = spec.direction === 'right-up' || spec.direction === 'down-right'
  const r = fromTop ? key.row : ROW_LENGTHS.length - 1 - key.row
  const c = fromLeft ? key.col : rowLen - 1 - key.col
  const v = spec.v === 'octave' ? len : spec.v
  return { steps: spec.h * c + v * r, octave: 0 }
}

const continuous = (steps: number): Placement => ({ steps, octave: 0 })

// ---- Right Up -------------------------------------------------------------
// First step of each row, top to bottom (1-based in the spec: 26, 16, 8, 1).

const RIGHT_UP_STARTS = [25, 15, 7, 0]

// ---- Staircase ------------------------------------------------------------
// Ten keys climbing up and to the right; everything else is silent.

const STAIRCASE: Record<string, number> = {
  KeyV: 0, KeyB: 1, KeyN: 2, KeyM: 3,
  KeyJ: 4, KeyK: 5, KeyL: 6,
  KeyO: 7, KeyP: 8,
  Digit0: 9,
}

// ---- The layouts ----------------------------------------------------------

export const LAYOUTS: Layout[] = [
  {
    id: 'standard',
    name: 'Standard',
    place: (k, { len }) => grid(k, len, { h: 1, v: 'octave', direction: 'right-up' }),
  },
  {
    id: 'isometric',
    name: 'Isometric',
    place: (k, { len }) => grid(k, len, { h: 1, v: 3, direction: 'right-up' }),
  },
  {
    id: 'right-up',
    name: 'Right Up',
    place: (k) => continuous(RIGHT_UP_STARTS[k.row] + k.col),
  },
  {
    id: 'down-right',
    name: 'Down Right',
    place: (k, { len }) => grid(k, len, { h: 4, v: 1, direction: 'down-right' }),
  },
  {
    id: 'linear',
    name: 'Linear',
    place: (k, { len }) => grid(k, len, { h: 1, v: 10, direction: 'down-right' }),
  },
  {
    id: 'staircase',
    name: 'Staircase',
    place: (k) => (k.code in STAIRCASE ? continuous(STAIRCASE[k.code]) : null),
  },
]
