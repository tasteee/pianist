// Layouts decide which scale step each physical key plays.
//
// A layout places a key at `steps` (0 = root, 1 = second degree, len = root
// an octave up, …) plus an `octave` offset added to the base octave.
// Numbers in the docs are 1-based; here everything is 0-based.

import { ROW_LENGTHS, type KeyDef } from './keymap'
import { mod } from './theory'

export type Placement = { steps: number; octave: number }

export type Direction = 'right-up' | 'down-right' | 'left-up' | 'down-left'
export type Wrap = 'scale' | 'none'

export type CustomParams = {
  horizontal: number
  vertical: number
  rowLengths: number[] // top to bottom
  direction: Direction
  wrap: Wrap
}

export type LayoutContext = {
  /** Notes in the current scale. */
  len: number
  custom: CustomParams
  seed: number
}

export type Category = 'Melodic' | 'Harmonic' | 'Experimental'

export type Layout = {
  id: string
  name: string
  category: Category
  description: string
  place: (key: KeyDef, ctx: LayoutContext) => Placement | null
}

export const CATEGORY_INFO: Record<Category, string> = {
  Melodic: 'Makes melodic movement and scale exploration intuitive.',
  Harmonic: 'Makes intervals, chord tones and arpeggios easy to find.',
  Experimental: 'Unexpected relationships and happy accidents.',
}

export const DEFAULT_CUSTOM: CustomParams = {
  horizontal: 4,
  vertical: 1,
  rowLengths: [...ROW_LENGTHS],
  direction: 'down-right',
  wrap: 'scale',
}

// ---- Generic grid ---------------------------------------------------------
// Steps grow by `h` per key away from the origin column and by `v` per row
// away from the origin row. With wrap = 'scale', each row folds into one
// octave, and rows further from the origin sit an octave higher.

type GridSpec = {
  h: number
  v: number | 'octave'
  direction: Direction
  wrap: Wrap
  rowLengths?: number[]
}

function grid(key: KeyDef, len: number, spec: GridSpec): Placement | null {
  const rowLen = Math.min(spec.rowLengths?.[key.row] ?? ROW_LENGTHS[key.row], ROW_LENGTHS[key.row])
  if (key.col >= rowLen) return null

  const fromTop = spec.direction.startsWith('down')
  const fromLeft = spec.direction === 'right-up' || spec.direction === 'down-right'
  const r = fromTop ? key.row : ROW_LENGTHS.length - 1 - key.row
  const c = fromLeft ? key.col : rowLen - 1 - key.col
  const v = spec.v === 'octave' ? len : spec.v
  const raw = spec.h * c + v * r

  return spec.wrap === 'scale' ? { steps: mod(raw, len), octave: r } : { steps: raw, octave: 0 }
}

const continuous = (steps: number): Placement => ({ steps, octave: 0 })

/** Walk a sequence of chosen scale indexes upward: picks[k], then an octave up, … */
const pickSteps = (k: number, picks: number[], len: number) =>
  Math.floor(k / picks.length) * len + picks[mod(k, picks.length)]

// ---- Staircase ------------------------------------------------------------
// Ten keys climbing up and to the right; everything else is silent.

const STAIRCASE: Record<string, number> = {
  KeyV: 0, KeyB: 1, KeyN: 2, KeyM: 3,
  KeyJ: 4, KeyK: 5, KeyL: 6,
  KeyO: 7, KeyP: 8,
  Digit0: 9,
}

// ---- Random walk ----------------------------------------------------------
// Reading order, each key a small step from the last. Seeded so it's stable
// until the user reshuffles.

const walkCache = new Map<string, number[]>()

function walk(seed: number, len: number): number[] {
  const id = `${seed}:${len}`
  const hit = walkCache.get(id)
  if (hit) return hit

  let s = seed >>> 0 || 1
  const rand = () => {
    // xorshift32
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 0x100000000
  }

  const moves = [-2, -1, 1, 2, 3]
  const total = ROW_LENGTHS.reduce((a, b) => a + b, 0)
  const out: number[] = []
  let d = 0
  for (let i = 0; i < total; i++) {
    out.push(d)
    d = mod(d + moves[Math.floor(rand() * moves.length)], len)
  }
  walkCache.set(id, out)
  return out
}

const readingIndex = (key: KeyDef) => ROW_LENGTHS.slice(0, key.row).reduce((a, b) => a + b, 0) + key.col

// ---- The layouts ----------------------------------------------------------

export const LAYOUTS: Layout[] = [
  {
    id: 'standard',
    name: 'Standard',
    category: 'Melodic',
    description: 'Each row starts on the root. Every row up is one octave higher.',
    place: (k, { len }) => grid(k, len, { h: 1, v: 'octave', direction: 'right-up', wrap: 'none' }),
  },
  {
    id: 'isometric',
    name: 'Isometric',
    category: 'Melodic',
    description: 'Every row up is three scale steps higher, so shapes stay the same anywhere.',
    place: (k, { len }) => grid(k, len, { h: 1, v: 3, direction: 'right-up', wrap: 'none' }),
  },
  {
    id: 'right-up',
    name: 'Right Up',
    category: 'Melodic',
    description: 'One long run: left to right along the Z row, then continuing up each row.',
    place: (k) => {
      const below = ROW_LENGTHS.slice(k.row + 1).reduce((a, b) => a + b, 0)
      return continuous(below + k.col)
    },
  },
  {
    id: 'down-right',
    name: 'Down Right',
    category: 'Melodic',
    description: 'Scale runs down each column, then moves to the next column.',
    place: (k, { len }) => grid(k, len, { h: 4, v: 1, direction: 'down-right', wrap: 'none' }),
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Melodic',
    description: 'Reads like text: left to right, then down to the next row.',
    place: (k, { len }) => grid(k, len, { h: 1, v: 10, direction: 'down-right', wrap: 'none' }),
  },
  {
    id: 'staircase',
    name: 'Staircase',
    category: 'Melodic',
    description: 'Ten keys climbing up and to the right, from V to 0.',
    place: (k) => (k.code in STAIRCASE ? continuous(STAIRCASE[k.code]) : null),
  },
  {
    id: 'thirds',
    name: 'Thirds',
    category: 'Harmonic',
    description: 'Neighbors are a third apart. Three keys in a row make a chord.',
    place: (k, { len }) => grid(k, len, { h: 2, v: 1, direction: 'down-right', wrap: 'none' }),
  },
  {
    id: 'fifths',
    name: 'Fifths',
    category: 'Harmonic',
    description: 'Neighbors are a fifth apart, folded into one octave per row.',
    place: (k, { len }) => grid(k, len, { h: 4, v: 5, direction: 'down-right', wrap: 'scale' }),
  },
  {
    id: 'arpeggio',
    name: 'Arpeggio',
    category: 'Harmonic',
    description: 'Only chord tones: 1, 3 and 5, climbing across each row.',
    place: (k, { len }) => continuous(pickSteps(k.col + k.row, [0, 2, 4], len)),
  },
  {
    id: 'pentatonic',
    name: 'Pentatonic',
    category: 'Harmonic',
    description: 'Degrees 1, 2, 3, 5 and 6 only. Hard to play a wrong note.',
    place: (k, { len }) => {
      const picks = len >= 7 ? [0, 1, 2, 4, 5] : Array.from({ length: len }, (_, i) => i)
      return continuous(pickSteps(k.col + k.row, picks, len))
    },
  },
  {
    id: 'zigzag',
    name: 'Zig-Zag',
    category: 'Experimental',
    description: 'Rows alternate direction: right, then back left, then right again.',
    place: (k) => {
      const len = ROW_LENGTHS[k.row]
      return continuous(k.row * 10 + (k.row % 2 ? len - 1 - k.col : k.col))
    },
  },
  {
    id: 'mirror',
    name: 'Mirror',
    category: 'Experimental',
    description: 'The scale rises to the top degree, then reflects back down.',
    place: (k, { len }) => {
      if (len < 2) return continuous(0)
      const period = 2 * (len - 1)
      const p = mod(k.row * 10 + k.col, period)
      return { steps: p < len ? p : period - p, octave: k.row }
    },
  },
  {
    id: 'random-walk',
    name: 'Random Walk',
    category: 'Experimental',
    description: 'Each key is a small, random step from the last. Reshuffle for a new walk.',
    place: (k, { len, seed }) => ({ steps: walk(seed, len)[readingIndex(k)], octave: k.row }),
  },
  {
    id: 'custom',
    name: 'Custom',
    category: 'Experimental',
    description: 'Set your own horizontal and vertical intervals.',
    place: (k, { len, custom }) =>
      grid(k, len, {
        h: custom.horizontal,
        v: custom.vertical,
        direction: custom.direction,
        wrap: custom.wrap,
        rowLengths: custom.rowLengths,
      }),
  },
]

export const CATEGORIES: Category[] = ['Melodic', 'Harmonic', 'Experimental']

export const CUSTOM_EXAMPLES: [number, number][] = [
  [1, 3],
  [3, 2],
  [4, -1],
  [5, 1],
]

export const DIRECTIONS: { id: Direction; label: string; arrows: string }[] = [
  { id: 'right-up', label: 'Right Up', arrows: '→↑' },
  { id: 'down-right', label: 'Down Right', arrows: '↓→' },
  { id: 'left-up', label: 'Left Up', arrows: '←↑' },
  { id: 'down-left', label: 'Down Left', arrows: '↓←' },
]
