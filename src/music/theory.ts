// Pitch math and note spelling. Everything is MIDI numbers until it hits the UI.

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PITCH = [0, 2, 4, 5, 7, 9, 11]

export type Root = {
  id: string
  letter: Letter
  accidental: number
  pitchClass: number
}

// The twelve keys, spelled the way musicians usually name them.
export const ROOTS: Root[] = [
  root('C', 0),
  root('D', -1),
  root('D', 0),
  root('E', -1),
  root('E', 0),
  root('F', 0),
  root('F', 1),
  root('G', 0),
  root('A', -1),
  root('A', 0),
  root('B', -1),
  root('B', 0),
]

function root(letter: Letter, accidental: number): Root {
  const pitchClass = mod(LETTER_PITCH[LETTERS.indexOf(letter)] + accidental, 12)
  return { id: `${letter}${accidentalSymbol(accidental)}`, letter, accidental, pitchClass }
}

// Each step is [semitones above root, letters above root].
// The letter offset gives correct spelling (E♭ in C minor, not D♯).
type Step = [number, number]

export type Scale = {
  id: string
  name: string
  group: 'Common' | 'Modes' | 'Other'
  steps: Step[]
}

const s = (pairs: string): Step[] =>
  pairs.split(' ').map((p) => p.split(':').map(Number) as Step)

export const SCALES: Scale[] = [
  { id: 'major', name: 'Major', group: 'Common', steps: s('0:0 2:1 4:2 5:3 7:4 9:5 11:6') },
  { id: 'minor', name: 'Natural Minor', group: 'Common', steps: s('0:0 2:1 3:2 5:3 7:4 8:5 10:6') },
  { id: 'harmonic', name: 'Harmonic Minor', group: 'Common', steps: s('0:0 2:1 3:2 5:3 7:4 8:5 11:6') },
  { id: 'melodic', name: 'Melodic Minor', group: 'Common', steps: s('0:0 2:1 3:2 5:3 7:4 9:5 11:6') },
  { id: 'majpent', name: 'Major Pentatonic', group: 'Common', steps: s('0:0 2:1 4:2 7:4 9:5') },
  { id: 'minpent', name: 'Minor Pentatonic', group: 'Common', steps: s('0:0 3:2 5:3 7:4 10:6') },
  { id: 'blues', name: 'Blues', group: 'Common', steps: s('0:0 3:2 5:3 6:4 7:4 10:6') },
  { id: 'dorian', name: 'Dorian', group: 'Modes', steps: s('0:0 2:1 3:2 5:3 7:4 9:5 10:6') },
  { id: 'phrygian', name: 'Phrygian', group: 'Modes', steps: s('0:0 1:1 3:2 5:3 7:4 8:5 10:6') },
  { id: 'lydian', name: 'Lydian', group: 'Modes', steps: s('0:0 2:1 4:2 6:3 7:4 9:5 11:6') },
  { id: 'mixolydian', name: 'Mixolydian', group: 'Modes', steps: s('0:0 2:1 4:2 5:3 7:4 9:5 10:6') },
  { id: 'locrian', name: 'Locrian', group: 'Modes', steps: s('0:0 1:1 3:2 5:3 6:4 8:5 10:6') },
  { id: 'wholetone', name: 'Whole Tone', group: 'Other', steps: s('0:0 2:1 4:2 6:3 8:4 10:5') },
  // Chromatic has no letter logic; it's spelled by pitch (see `spellByPitch`).
  { id: 'chromatic', name: 'Chromatic', group: 'Other', steps: s('0:0 1:0 2:0 3:0 4:0 5:0 6:0 7:0 8:0 9:0 10:0 11:0') },
]

export type Note = {
  midi: number
  letter: Letter
  accidental: number
  octave: number
  degree: number // 1-based position in the scale
}

/** The note `index` steps above the root in `octave`. Negative indexes walk down. */
export function scaleNote(rootNote: Root, scale: Scale, octave: number, index: number): Note {
  const len = scale.steps.length
  const octaveShift = Math.floor(index / len)
  const step = mod(index, len)
  const [semis, letterOffset] = scale.steps[step]

  const rootLetterIdx = LETTERS.indexOf(rootNote.letter)
  const letterIdx = rootLetterIdx + letterOffset
  const letter = LETTERS[letterIdx % 7]

  const rootMidi = (octave + 1) * 12 + rootNote.pitchClass
  const midi = rootMidi + semis + octaveShift * 12

  if (scale.id === 'chromatic') return { ...spellByPitch(midi, prefersFlats(rootNote)), degree: step + 1 }

  // Octave of the written letter, so B♯3 stays B♯3 even though it sounds as C4.
  const rootLetterOctave = Math.floor((rootMidi - rootNote.accidental) / 12) - 1
  const letterOctave = rootLetterOctave + Math.floor(letterIdx / 7) + octaveShift
  const naturalMidi = (letterOctave + 1) * 12 + LETTER_PITCH[letterIdx % 7]

  return {
    midi,
    letter,
    accidental: midi - naturalMidi,
    octave: letterOctave,
    degree: step + 1,
  }
}

export function accidentalSymbol(n: number): string {
  if (n === 0) return ''
  if (n === 1) return '♯'
  if (n === -1) return '♭'
  if (n === 2) return '𝄪'
  if (n === -2) return '𝄫'
  return n > 0 ? '♯'.repeat(n) : '♭'.repeat(-n)
}

export const noteLabel = (n: Note) => `${n.letter}${accidentalSymbol(n.accidental)}`

const prefersFlats = (r: Root) => r.accidental < 0 || r.id === 'F'

function spellByPitch(midi: number, flats: boolean) {
  const pc = mod(midi, 12)
  const natural = LETTER_PITCH.indexOf(pc)
  const letterIdx = natural >= 0 ? natural : LETTER_PITCH.indexOf(flats ? pc + 1 : pc - 1)
  const accidental = natural >= 0 ? 0 : flats ? -1 : 1
  return { midi, letter: LETTERS[letterIdx], accidental, octave: Math.floor(midi / 12) - 1 }
}

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

/** Plain name for any MIDI note, used where scale context doesn't apply. */
export const midiName = (midi: number) => `${SHARP_NAMES[mod(midi, 12)]}${Math.floor(midi / 12) - 1}`

export const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(mod(midi, 12))

export function mod(n: number, m: number) {
  return ((n % m) + m) % m
}
